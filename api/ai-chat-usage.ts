import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateAiChatRequest } from './_lib/ai-chat-auth.js';

const DAILY_MESSAGE_LIMIT = 5;

function getUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ detail: 'Method not allowed' });
  }

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
