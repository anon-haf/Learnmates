import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function getAuthRedirectUrl(path = '/login'): string {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const configuredOrigin = import.meta.env.VITE_APP_URL?.replace(/\/$/, '');
  const origin = isLocal ? window.location.origin : (configuredOrigin || window.location.origin);
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}