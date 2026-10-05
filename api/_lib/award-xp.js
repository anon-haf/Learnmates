import { awardCappedXPFallback } from './award-xp-fallback.js';

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

async function runFallback(supabase, params, reason) {
  try {
    console.warn('[awardCappedXP] using fallback:', reason);
    return await awardCappedXPFallback(supabase, params);
  } catch (fallbackError) {
    console.error('[awardCappedXP] fallback failed:', {
      userId: params.userId,
      action: params.action,
      refId: params.refId,
      code: fallbackError?.code,
      message: fallbackError?.message,
      details: fallbackError?.details,
    });
    return 0;
  }
}

/**
 * Awards capped XP via fn_award_capped_xp when available (single DB transaction).
 * Falls back to legacy path if the RPC is missing or errors; never throws to callers.
 */
export async function awardCappedXP(supabase, params) {
  const { amount } = params;
  if (!amount || amount <= 0) {
    return 0;
  }

  const rpcArgs = {
    p_user_id: params.userId,
    p_action: params.action,
    p_amount: params.amount,
    p_daily_cap: params.dailyCap,
    p_metadata: params.metadata && Object.keys(params.metadata).length > 0 ? params.metadata : {},
  };

  if (params.refId != null && params.refId !== '') {
    rpcArgs.p_ref_id = params.refId;
  }

  const { data, error } = await supabase.rpc('fn_award_capped_xp', rpcArgs);

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
    return runFallback(supabase, params, error.message);
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

  return runFallback(supabase, params, 'rpc_runtime_error');
}
