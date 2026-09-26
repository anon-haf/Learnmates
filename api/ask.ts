import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Proxy — POST /api/ask
 *
 * Forwards the request body to the Oracle Cloud RAG API,
 * injecting the shared secret from environment variables.
 * The secret never reaches the browser bundle.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight (only needed if the frontend ever calls from a different origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_BASE_URL = process.env.API_BASE_URL || 'https://api.learnmates.org';
  const API_SHARED_SECRET = process.env.API_SHARED_SECRET;

  if (!API_SHARED_SECRET) {
    console.error('API_SHARED_SECRET is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const upstream = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_SHARED_SECRET}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: 'Failed to reach upstream API' });
  }
}
