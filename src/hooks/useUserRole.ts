import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useUserRole(userId: string | undefined) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    if (import.meta.env.DEV && localStorage.getItem('DEV_MOCK_LOGIN') === 'true') {
      setRole('tester');
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_role')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Error fetching user role:', error.message);
        setRole(null);
      } else {
        setRole(data?.role || null);
      }
      setLoading(false);
    };

    fetchRole();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { role, loading };
}
