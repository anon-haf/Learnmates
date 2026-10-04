import { createServerClient } from './_lib/supabase-server.js';
import { awardCappedXP } from './_lib/award-xp.js';
import { downloadXpParamsForResourceType } from './_lib/download-xp-rules.js';
import {
  classifyDownloadTarget,
  resolveDownloadTarget,
  sanitizeFilename,
} from './_lib/download-url.js';
import { getServerAssetAuthHeaders } from './_lib/asset-fetch.js';

function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Access-Control-Expose-Headers', 'X-XP-Awarded, Content-Disposition');
}

function readParams(req) {
  const source = req.method === 'GET' ? req.query : req.body;
  return {
    url: source?.url,
    resourceId: source?.resourceId,
    resourceName: source?.resourceName,
    resourceType: source?.resourceType || 'file',
  };
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { url, resourceId, resourceName, resourceType } = readParams(req);
    if (!resourceId || !url) {
      return res.status(400).json({ error: 'Missing resourceId or url' });
    }

    const siteOrigin =
      process.env.SITE_URL ||
      (req.headers['x-forwarded-proto'] && req.headers.host
        ? `${req.headers['x-forwarded-proto']}://${req.headers.host}`
        : 'https://www.learnmates.org');

    const targetUrl = resolveDownloadTarget(url, siteOrigin);
    if (!targetUrl) {
      return res.status(400).json({ error: 'Invalid download url' });
    }

    const classification = classifyDownloadTarget(targetUrl);
    if (!classification.allowed) {
      console.warn('[download] blocked url', { requestId, userId: user.id, reason: classification.reason, url: targetUrl });
      return res.status(400).json({ error: 'Download url not allowed' });
    }

    const { action, amount, dailyCap } = downloadXpParamsForResourceType(resourceType);

    const awarded = await awardCappedXP(supabase, {
      userId: user.id,
      action,
      refId: resourceId,
      amount,
      dailyCap,
      metadata: {
        file_name: resourceName || resourceId,
        resource_type: resourceType,
        download_url: targetUrl,
        delivery: classification.mode,
      },
    });

    console.info('[download] xp committed before file delivery', {
      requestId,
      userId: user.id,
      resourceId,
      resourceType,
      action,
      awarded,
      mode: classification.mode,
    });

    res.setHeader('X-XP-Awarded', String(awarded));

    if (classification.mode === 'redirect') {
      return res.redirect(302, targetUrl);
    }

    const upstream = await fetch(targetUrl, {
      headers: getServerAssetAuthHeaders(),
      redirect: 'follow',
    });

    if (!upstream.ok) {
      console.error('[download] upstream fetch failed', {
        requestId,
        status: upstream.status,
        url: targetUrl,
      });
      return res.status(502).json({ error: 'Failed to fetch file' });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const filename = sanitizeFilename(resourceName || resourceId);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const buffer = Buffer.from(await upstream.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('[download] error', { requestId, error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
