import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Readable } from 'node:stream';

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 120,
};

/**
 * Streams the multipart request to the RAG API and adds the server-side API key.
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
  if (!contentType?.toLowerCase().startsWith('multipart/form-data;')) {
    return res.status(400).json({ detail: 'Expected a multipart form upload.' });
  }

  try {
    const requestOptions: RequestInit & { duplex: 'half' } = {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'X-API-Key': apiKey,
      },
      body: Readable.toWeb(req) as ReadableStream<Uint8Array>,
      duplex: 'half',
    };
    const upstream = await fetch(`${apiBaseUrl}/ask`, requestOptions);

    const body = await upstream.text();
    const responseContentType = upstream.headers.get('content-type');
    if (responseContentType) res.setHeader('Content-Type', responseContentType);
    return res.status(upstream.status).send(body);
  } catch (err: unknown) {
    console.error('Proxy error:', err);
    return res.status(502).json({ detail: 'Tutor temporarily unavailable. Please try again.' });
  }
}
