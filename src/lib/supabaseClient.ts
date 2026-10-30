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
  const configuredOrigin = import.meta.env.VITE_APP_URL?.replace(/\/$/, '');
  const origin = import.meta.env.DEV
    ? window.location.origin
    : (configuredOrigin || window.location.origin);
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}