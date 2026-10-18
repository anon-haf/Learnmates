import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateAiChatRequest } from './_lib/ai-chat-auth.js';
import { createServerClient } from './_lib/supabase-server.js';

const MAX_REQUEST_BYTES = 4.4 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 55_000;
const DAILY_MESSAGE_LIMIT = 5;

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 120,
};

class RequestBodyTooLargeError extends Error {
  constructor(readonly receivedBytes: number) {
    super('Request body exceeds the configured limit.');
    this.name = 'RequestBodyTooLargeError';
  }
}

async function readRequestBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let receivedBytes = 0;
  let tooLarge = false;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    receivedBytes += buffer.length;

    if (receivedBytes > MAX_REQUEST_BYTES) {
      tooLarge = true;
      continue;
    }

    chunks.push(buffer);
  }

  if (tooLarge) {
    throw new RequestBodyTooLargeError(receivedBytes);
  }

  return Buffer.concat(chunks, receivedBytes);
}

function getVisitorIp(req: VercelRequest): string | undefined {
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  const forwardedFor = req.headers['x-forwarded-for'];
  const cfIp = Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;

  return cfIp?.trim() || forwardedIp?.split(',')[0]?.trim() || req.socket.remoteAddress;
}

/**
 * Buffers the multipart request before forwarding it to the RAG API.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const auth = await authenticateAiChatRequest(req);
      if (auth.error) return res.status(auth.error.status).json({ detail: auth.error.detail });

      const { data, error } = await auth.supabase
        .from('ai_chat_daily_usage')
        .select('message_count')
        .eq('user_id', auth.user.id)
        .eq('usage_date', getUtcDate())
        .maybeSingle();

      if (error) throw error;

      const used = data?.message_count ?? 0;
      return res.status(200).json({
        limit: DAILY_MESSAGE_LIMIT,
        used,
        remaining: Math.max(0, DAILY_MESSAGE_LIMIT - used),
      });
    } catch (error: unknown) {
      console.error('AI chat usage lookup failed:', error);
      return res.status(500).json({ detail: 'Could not load your daily AI message usage.' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const apiBaseUrl = (process.env.API_BASE_URL || 'https://api.learnmates.org').replace(/\/+$/, '');
  const apiKey = process.env.API_SHARED_SECRET;

  if (!apiKey) {
    console.error('API_SHARED_SECRET is not configured');
    return res.status(500).json({ detail: 'Tutor service is not configured.' });
  }

  const contentType = req.headers['content-type'];
  if (typeof contentType !== 'string' || !contentType.toLowerCase().startsWith('multipart/form-data;')) {
    return res.status(400).json({ detail: 'Expected a multipart form upload.' });
  }

  let reservationDate: string | null = null;
  let reservationCommitted = false;
  let userId: string | null = null;
  let quotaClient: ReturnType<typeof createServerClient> | null = null;

  try {
    const auth = await authenticateAiChatRequest(req);
    if (auth.error) return res.status(auth.error.status).json({ detail: auth.error.detail });
    userId = auth.user.id;
    quotaClient = auth.supabase;

    const { data: reservationData, error: reservationError } = await quotaClient
      .rpc('reserve_ai_chat_message', { p_user_id: userId });
    if (reservationError) throw reservationError;

    const reservation = Array.isArray(reservationData) ? reservationData[0] : reservationData;
    if (!reservation || typeof reservation.allowed !== 'boolean' || typeof reservation.usage_date !== 'string') {
      throw new Error('AI chat quota reservation returned an invalid response.');
    }
    if (!reservation.allowed) {
      return res.status(429).json({
        code: 'DAILY_MESSAGE_LIMIT_REACHED',
        detail: 'You have used all 5 AI tutor messages for today. Your limit resets at midnight UTC.',
        limit: DAILY_MESSAGE_LIMIT,
        used: reservation.used,
        remaining: 0,
      });
    }
    reservationDate = reservation.usage_date;

    const requestBody = await readRequestBody(req);
    console.info('Ask proxy received request body', { bytes: requestBody.length });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
      const visitorIp = getVisitorIp(req);
      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Content-Length': String(requestBody.length),
        'X-API-Key': apiKey,
      };
      if (visitorIp) headers['X-Real-IP'] = visitorIp;
      const requestBodyBytes = new Uint8Array(requestBody.length);
      requestBodyBytes.set(requestBody);

      const upstream = await fetch(`${apiBaseUrl}/ask`, {
        method: 'POST',
        headers,
        body: requestBodyBytes,
        signal: controller.signal,
      });
      console.info('Ask proxy upstream response', { status: upstream.status });

      const body = await upstream.text();
      const responseContentType = upstream.headers.get('content-type');
      let hasAnswer = false;
      if (upstream.ok) {
        try {
          const responseBody: unknown = JSON.parse(body);
          hasAnswer = typeof responseBody === 'object'
            && responseBody !== null
            && !Array.isArray(responseBody)
            && typeof (responseBody as { answer?: unknown }).answer === 'string';
        } catch {
          hasAnswer = false;
        }
      }
      if (upstream.ok && !hasAnswer) {
        return res.status(502).json({ detail: 'The tutor returned an unexpected response. Please try again.' });
      }
      if (upstream.ok && hasAnswer) {
        reservationCommitted = true;
        res.setHeader('X-AI-Messages-Remaining', String(Math.max(0, DAILY_MESSAGE_LIMIT - reservation.used)));
      }
      if (responseContentType) res.setHeader('Content-Type', responseContentType);
      return res.status(upstream.status).send(body);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err: unknown) {
    if (err instanceof RequestBodyTooLargeError) {
      console.warn('Ask proxy rejected oversized request body', {
        bytes: err.receivedBytes,
        limit: MAX_REQUEST_BYTES,
      });
      return res.status(413).json({ detail: 'The upload is too large. Please reduce the attachment size and try again.' });
    }

    if (err instanceof Error && err.name === 'AbortError') {
      console.error(`Ask upstream request timed out after ${UPSTREAM_TIMEOUT_MS}ms`, err);
      return res.status(504).json({ detail: 'Tutor service timed out. Please try again.' });
    }

    console.error('Proxy error:', err);
    return res.status(502).json({ detail: 'Tutor temporarily unavailable. Please try again.' });
  } finally {
    if (quotaClient && userId && reservationDate && !reservationCommitted) {
      try {
        const { error } = await quotaClient.rpc('release_ai_chat_message', {
          p_user_id: userId,
          p_usage_date: reservationDate,
        });
        if (error) throw error;
      } catch (error: unknown) {
        console.error('Failed to release unused AI chat message quota:', error);
      }
    }
  }
}
