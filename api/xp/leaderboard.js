import { createServerClient } from '../lib/supabase-server.js';

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

  // Edge-cached: stale-while-revalidate 5m, max-age 0 on fresh
  res.setHeader('Cache-Control', 'public, max-age=0, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const supabase = createServerClient();

      // Verify user
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      userId = user.id;
    }

    const supabase = createServerClient();

    const period = req.query.period === 'weekly' ? 'weekly' : 'all';
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    let leaderboard = [];
    let totalUsers = 0;

    if (period === 'all') {
      // All-time: order user_xp by total_xp desc
      const { data: topXp, error: xpError, count } = await supabase
        .from('user_xp')
        .select('user_id, total_xp, updated_at', { count: 'exact' })
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (xpError) throw xpError;

      totalUsers = count ?? topXp.length;

      if (topXp.length > 0) {
        const ids = topXp.map((r) => r.user_id);
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url, is_private')
          .in('id', ids);

        if (profError) throw profError;

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

        leaderboard = topXp
          .filter((row) => {
            const p = profileMap.get(row.user_id);
            // Keep the current user even if private (they'll see their own rank)
            // Filter out other private users
            return (userId !== null && row.user_id === userId) || !p?.is_private;
          })
          .map((row, idx) => {
            const p = profileMap.get(row.user_id);
            return {
              rank: idx + 1,
              username: p?.username || 'Anonymous',
              name: p?.name || 'Student',
              avatar_url: p?.avatar_url || null,
              total_xp: row.total_xp,
              isCurrentUser: userId !== null && row.user_id === userId,
            };
          });
      }
    } else {
      // Weekly: aggregate xp_events from last 7 days (service_role bypasses RLS)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch in pages to avoid 1000-row PostgREST default cap
      const pageSize = 1000;
      let from = 0;
      let allEvents = [];
      for (;;) {
        const { data: page, error: evError } = await supabase
          .from('xp_events')
          .select('user_id, xp_awarded')
          .gte('created_at', weekAgo)
          .range(from, from + pageSize - 1);

        if (evError) throw evError;
        if (!page || page.length === 0) break;
        allEvents = allEvents.concat(page);
        if (page.length < pageSize) break;
        from += pageSize;
        // safety cap: 20k events
        if (from > 20000) break;
      }

      const sums = new Map();
      for (const e of allEvents) {
        sums.set(e.user_id, (sums.get(e.user_id) || 0) + (e.xp_awarded || 0));
      }

      const sorted = [...sums.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      totalUsers = sums.size;

      if (sorted.length > 0) {
        const ids = sorted.map(([uid]) => uid);
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url, is_private')
          .in('id', ids);

        if (profError) throw profError;

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

        leaderboard = sorted
          .filter(([uid]) => {
            const p = profileMap.get(uid);
            return (userId !== null && uid === userId) || !p?.is_private;
          })
          .map(([uid, total], idx) => {
            const p = profileMap.get(uid);
            return {
              rank: idx + 1,
              username: p?.username || 'Anonymous',
              name: p?.name || 'Student',
              avatar_url: p?.avatar_url || null,
              total_xp: total,
              isCurrentUser: userId !== null && uid === userId,
            };
          });
      }
    }

    // Current user rank + xp (all-time basis) — only when authenticated
    let currentUser = null;
    if (userId) {
      const { data: meXp } = await supabase
        .from('user_xp')
        .select('total_xp')
        .eq('user_id', userId)
        .single();

      const myXp = meXp?.total_xp || 0;

      const { count: aboveCount } = await supabase
        .from('user_xp')
        .select('user_id', { count: 'exact', head: true })
        .gt('total_xp', myXp);

      const myRank = (aboveCount ?? 0) + 1;

      // Check if current user is private
      const { data: myProfileData } = await supabase
        .from('profiles')
        .select('username, name, avatar_url, is_private')
        .eq('id', userId)
        .single();

      const isPrivate = myProfileData?.is_private || false;

      // If current user not in the returned slice, fetch their profile for the footer card
      currentUser = {
        rank: myRank,
        total_xp: myXp,
        inTop: leaderboard.some((r) => r.isCurrentUser),
        isPrivate,
      };
      if (!currentUser.inTop) {
        currentUser.username = myProfileData?.username || null;
        currentUser.name = myProfileData?.name || null;
      }
    }

    return res.status(200).json({
      period,
      leaderboard,
      currentUser,
      totalUsers,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
