import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'node:crypto';
import { createServerClient } from './_lib/supabase-server.js';

const CACHE_KEY_PATTERN = /^[0-9a-f]{64}$/;
const MAX_ANSWER_LENGTH = 100_000;

function getVisitorIp(req: VercelRequest): string | undefined {
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  const forwardedFor = req.headers['x-forwarded-for'];
  const cfIp = Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return cfIp?.trim() || forwardedIp?.split(',')[0]?.trim() || req.socket.remoteAddress;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ detail: 'Method not allowed.' });
  }

  const secret = process.env.TOPICAL_GUEST_CACHE_SECRET || process.env.API_SHARED_SECRET;
  if (!secret) {
    console.error('Guest topical explanation cache secret is not configured.');
    return res.status(500).json({ detail: 'Guest explanation caching is not configured.' });
  }

  const visitorIp = getVisitorIp(req);
  if (!visitorIp) {
    return res.status(503).json({ detail: 'Could not verify your network address.' });
  }

  const body: unknown = req.body;
  if (!isRecord(body) || typeof body.action !== 'string' || typeof body.cacheKey !== 'string' ||
    !CACHE_KEY_PATTERN.test(body.cacheKey)) {
    return res.status(400).json({ detail: 'Invalid guest explanation cache request.' });
  }
  if (body.action !== 'get' && body.action !== 'save') {
    return res.status(400).json({ detail: 'Unsupported guest explanation cache action.' });
  }

  const ipHash = createHmac('sha256', secret).update(visitorIp).digest('hex');
  try {
    const supabase = createServerClient();
    if (body.action === 'get') {
      const { data, error } = await supabase
        .from('topical_guest_explanations')
        .select('answer')
        .eq('ip_hash', ipHash)
        .eq('cache_key', body.cacheKey)
        .maybeSingle();
      if (error) {
        console.error('Could not read guest topical explanation cache:', error.message);
        return res.status(503).json({ detail: 'Could not check saved guest explanations.' });
      }
      return res.status(200).json({ answer: data?.answer ?? null });
    }

    if (
      typeof body.questionUrl !== 'string' ||
      typeof body.markSchemeUrl !== 'string' ||
      typeof body.isMcq !== 'boolean' ||
      typeof body.promptVersion !== 'string' ||
      typeof body.answer !== 'string' ||
      body.answer.length === 0 ||
      body.answer.length > MAX_ANSWER_LENGTH
    ) {
      return res.status(400).json({ detail: 'Invalid guest explanation cache data.' });
    }

    const usageDate = new Date().toISOString().slice(0, 10);
    const { data: usage, error: usageError } = await supabase
      .from('topical_guest_explanation_usage')
      .select('explanation_count')
      .eq('ip_hash', ipHash)
      .eq('usage_date', usageDate)
      .maybeSingle();
    if (usageError) {
      console.error('Could not verify guest explanation usage before caching:', usageError.message);
      return res.status(503).json({ detail: 'Could not verify guest explanation usage.' });
    }
    if (!usage || usage.explanation_count < 1) {
      return res.status(403).json({ detail: 'Generate an explanation before saving it to the guest cache.' });
    }

    const { error } = await supabase
      .from('topical_guest_explanations')
      .upsert({
        ip_hash: ipHash,
        cache_key: body.cacheKey,
        question_url: body.questionUrl,
        mark_scheme_url: body.markSchemeUrl,
        is_mcq: body.isMcq,
        prompt_version: body.promptVersion,
        answer: body.answer,
      }, { onConflict: 'ip_hash,cache_key' });
    if (error) {
      console.error('Could not save guest topical explanation cache:', error.message);
      return res.status(503).json({ detail: 'Could not save this guest explanation.' });
    }

    return res.status(200).json({ saved: true });
  } catch (error: unknown) {
    console.error('Guest topical explanation cache request failed:', error);
    return res.status(500).json({ detail: 'Guest explanation caching is temporarily unavailable.' });
  }
}
