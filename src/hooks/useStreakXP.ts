import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { triggerXPNotification } from '../components/XPRewardNotification';

export function useStreakXP() {
  useEffect(() => {
    const award = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      // Fetch current streak from backend
      const res = await fetch('/api/user/streak', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!res.ok) return;
      const { streak } = await res.json();
      if (streak && streak > 0) {
        // Fire XP heartbeat for streak_visit
        await fetch('/api/xp/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          keepalive: true,
          body: JSON.stringify({
            action: 'streak_visit',
            streak,
            duration: 0,
          }),
        }).catch(err => console.error('Streak XP error', err));
      }
    };
    award();
  }, []);
}
