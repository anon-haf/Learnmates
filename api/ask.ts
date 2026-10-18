import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_REQUEST_BYTES = 4.4 * 1024 * 1024;
const UPSTREAM_TIMEOUT_MS = 55_000;

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
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

  try {
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

      const upstream = await fetch(`${apiBaseUrl}/ask`, {
        method: 'POST',
        headers,
        body: requestBody,
        signal: controller.signal,
      });
      console.info('Ask proxy upstream response', { status: upstream.status });

      const body = await upstream.text();
      const responseContentType = upstream.headers.get('content-type');
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
  }
}
