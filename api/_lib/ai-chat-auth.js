import { createServerClient } from './supabase-server.js';

export async function authenticateAiChatRequest(req) {
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return { supabase: null, user: null, error: { status: 401, detail: 'Please sign in to use the AI tutor.' } };
  }

  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7));
  if (authError || !user) {
    return { supabase: null, user: null, error: { status: 401, detail: 'Your session has expired. Please sign in again.' } };
  }

  const { data: role, error: roleError } = await supabase
    .from('user_role')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleError) throw roleError;
  if (role?.role !== 'tester') {
    return { supabase: null, user: null, error: { status: 403, detail: 'The AI tutor is currently available to testers only.' } };
  }

  return { supabase, user, error: null };
}
