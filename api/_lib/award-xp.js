/**
 * Awards capped XP via fn_award_capped_xp (single DB transaction:
 * xp_events row + user_xp update commit together).
 */
export async function awardCappedXP(supabase, {
  userId,
  action,
  refId = null,
  amount,
  dailyCap,
  metadata = {},
}) {
  if (!amount || amount <= 0) {
    return 0;
  }

  const { data, error } = await supabase.rpc('fn_award_capped_xp', {
    p_user_id: userId,
    p_action: action,
    p_ref_id: refId,
    p_amount: amount,
    p_daily_cap: dailyCap,
    p_metadata: metadata && Object.keys(metadata).length > 0 ? metadata : {},
  });

  if (error) {
    console.error('[awardCappedXP] fn_award_capped_xp failed:', {
      userId,
      action,
      refId,
      code: error.code,
      message: error.message,
      details: error.details,
    });
    throw error;
  }

  const awarded = typeof data === 'number' ? data : Number(data) || 0;
  if (awarded > 0) {
    console.info('[awardCappedXP] awarded', { userId, action, refId, awarded });
  }

  return awarded;
}
