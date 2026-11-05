import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export interface NibrasUsage {
  exempt: boolean;
  used?: number;
  limit?: number;
  remaining?: number;
}

export function useNibrasUsage(enabled = true) {
  const { user } = useAuth();
  const [usage, setUsage] = useState<NibrasUsage | null>(null);
  const [loading, setLoading] = useState(enabled && Boolean(user));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !user) {
      setUsage(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.');

      const response = await fetch('/api/ask', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload: unknown = await response.json();
      const responseObject = typeof payload === 'object' && payload !== null
        ? payload as { exempt?: unknown; used?: unknown; limit?: unknown; remaining?: unknown; detail?: unknown }
        : null;
      if (!response.ok) {
        const detail = typeof responseObject?.detail === 'string' ? responseObject.detail : 'Could not load your AI usage.';
        throw new Error(detail);
      }
      if (!responseObject || typeof responseObject.exempt !== 'boolean') {
        throw new Error('The AI usage response was invalid.');
      }

      if (responseObject.exempt) {
        setUsage({ exempt: true });
      } else {
        const { used, limit, remaining } = responseObject;
        if (typeof used !== 'number' || typeof limit !== 'number' || typeof remaining !== 'number') {
          throw new Error('The AI usage response was invalid.');
        }
        setUsage({ exempt: false, used, limit, remaining });
      }
    } catch (usageError: unknown) {
      console.error('Could not load Nibras usage:', usageError);
      setUsage(null);
      setError(usageError instanceof Error ? usageError.message : 'Could not load your AI usage.');
    } finally {
      setLoading(false);
    }
  }, [enabled, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { usage, loading, error, refresh };
}
