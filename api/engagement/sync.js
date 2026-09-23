import { createServerClient } from '../_lib/supabase-server.js';

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

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServerClient();
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { engagements } = req.body;
    if (!engagements || !Array.isArray(engagements)) {
      return res.status(400).json({ error: 'Missing or invalid engagements payload' });
    }

    // Map engagements to match the table schema
    const upsertData = engagements.map(eng => ({
      user_id: user.id,
      topic_id: eng.topicId || '',
      resource_id: eng.resourceId,
      resource_url: eng.url,
      resource_type: eng.resourceType || 'resource',
      is_done: !!eng.isDone,
      downloaded: !!eng.downloaded,
      opened: !!eng.opened,
      meaningful_read: !!eng.meaningfulRead
    }));

    if (upsertData.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    // Upsert the batch of engagements using unique constraints
    const { error: upsertError } = await supabase
      .from('resource_engagements')
      .upsert(upsertData, {
        onConflict: 'user_id, topic_id, resource_id, resource_url'
      });

    if (upsertError) {
      console.error('Failed to sync engagements:', upsertError);
      return res.status(500).json({ error: 'Failed to sync engagements' });
    }

    return res.status(200).json({ success: true, count: upsertData.length });
  } catch (error) {
    console.error('Engagement sync error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
