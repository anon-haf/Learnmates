import { awardCappedXPFallback } from './award-xp-fallback.js';

/**
 * Awards capped XP via fn_award_capped_xp when available (single DB transaction).
 * Falls back to legacy path if the migration has not been applied yet.
 */
function isRpcUnavailable(error) {
  if (!error) return false;
  const code = error.code || '';
  const message = (error.message || '').toLowerCase();
  const details = (error.details || '').toLowerCase();
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    message.includes('could not find the function') ||
    message.includes('function fn_award_capped_xp') ||
    details.includes('fn_award_capped_xp')
  );
}

export async function awardCappedXP(supabase, params) {
  const { amount } = params;
  if (!amount || amount <= 0) {
    return 0;
  }

  const { data, error } = await supabase.rpc('fn_award_capped_xp', {
    p_user_id: params.userId,
    p_action: params.action,
    p_ref_id: params.refId ?? null,
    p_amount: params.amount,
    p_daily_cap: params.dailyCap,
    p_metadata: params.metadata && Object.keys(params.metadata).length > 0 ? params.metadata : {},
  });

  if (!error) {
    const awarded = typeof data === 'number' ? data : Number(data) || 0;
    if (awarded > 0) {
      console.info('[awardCappedXP] rpc awarded', {
        userId: params.userId,
        action: params.action,
        refId: params.refId,
        awarded,
      });
    }
    return awarded;
  }

  if (isRpcUnavailable(error)) {
    console.warn('[awardCappedXP] RPC missing — using fallback until migration is applied:', error.message);
    return awardCappedXPFallback(supabase, params);
  }

  console.error('[awardCappedXP] fn_award_capped_xp failed:', {
    userId: params.userId,
    action: params.action,
    refId: params.refId,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  // Broken RPC (e.g. SQL error inside function) — still allow downloads via fallback.
  console.warn('[awardCappedXP] attempting fallback after RPC error');
  return awardCappedXPFallback(supabase, params);
}
