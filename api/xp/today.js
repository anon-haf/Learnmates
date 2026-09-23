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

    // Fetch today's breakdown
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: eventsData, error: eventsError } = await supabase
      .from('xp_events')
      .select('action, xp_awarded')
      .eq('user_id', user.id)
      .gte('created_at', `${todayStr}T00:00:00Z`);

    if (eventsError) {
      throw eventsError;
    }

    const today = {};
    if (eventsData) {
      eventsData.forEach(event => {
        if (!today[event.action]) {
          today[event.action] = { total: 0, count: 0 };
        }
        today[event.action].total += event.xp_awarded;
        today[event.action].count += 1;
      });
    }

    return res.status(200).json({ today });

  } catch (error) {
    console.error('Today XP error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
