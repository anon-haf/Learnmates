import { createServerClient } from './supabase-server.js';

async function getRole(supabase, userId) {
  const { data: role, error: roleError } = await supabase
    .from('user_role')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (roleError) throw roleError;
  return role?.role ?? null;
}

export async function authenticateAiChatRequest(req) {
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return { supabase: null, user: null, role: null, error: { status: 401, detail: 'Please sign in to use the AI tutor.' } };
  }

  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7));
  if (authError || !user) {
    return { supabase: null, user: null, role: null, error: { status: 401, detail: 'Your session has expired. Please sign in again.' } };
  }

  const role = await getRole(supabase, user.id);
  return { supabase, user, role, error: null };
}

export async function authenticateTopicalExplanationRequest(req) {
  const authorization = req.headers.authorization;
  const supabase = createServerClient();

  if (authorization === undefined) {
    return { supabase, user: null, role: null, error: null };
  }

  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return { supabase: null, user: null, role: null, error: { status: 401, detail: 'Your session could not be verified.' } };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7));
  if (authError || !user) {
    return { supabase: null, user: null, role: null, error: { status: 401, detail: 'Your session has expired. Please sign in again.' } };
  }

  const role = await getRole(supabase, user.id);
  return { supabase, user, role, error: null };
}
