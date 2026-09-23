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

  if (req.method !== 'GET') {
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

    const { data: engagements, error: fetchError } = await supabase
      .from('resource_engagements')
      .select('topic_id, resource_id, resource_url, resource_type, is_done, downloaded, opened, meaningful_read')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Failed to fetch engagements:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch engagements' });
    }

    return res.status(200).json({ engagements });
  } catch (error) {
    console.error('Engagement fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
