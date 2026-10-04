import { createServerClient } from '../_lib/supabase-server.js';
import { awardCappedXP } from '../_lib/award-xp.js';
import { downloadXpParamsForResourceType } from '../_lib/download-xp-rules.js';

function applyCors(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

    const { resourceId, resourceName, resourceType = 'file' } = req.body;
    if (!resourceId) {
      return res.status(400).json({ error: 'Missing resourceId' });
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
        delivery: 'award_only',
      },
    });

    console.info('[xp/download] award committed', {
      requestId,
      userId: user.id,
      resourceId,
      resourceType,
      action,
      awarded,
    });

    return res.status(200).json({
      success: true,
      xpAwarded: awarded,
    });
  } catch (error) {
    console.error('[xp/download] error', { requestId, error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
