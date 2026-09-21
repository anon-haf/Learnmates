/**
 * Awards capped XP with guaranteed xp_events logging.
 * Replaces fn_award_capped_xp RPC which was updating user_xp without inserting events.
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

  const todayStr = new Date().toISOString().split('T')[0];

  const { data: events, error: fetchError } = await supabase
    .from('xp_events')
    .select('xp_awarded')
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', `${todayStr}T00:00:00Z`);

  if (fetchError) {
    throw fetchError;
  }

  const todayTotal = (events || []).reduce((sum, row) => sum + (row.xp_awarded || 0), 0);
  const awarded = Math.max(0, Math.min(amount, dailyCap - todayTotal));

  if (awarded <= 0) {
    return 0;
  }

  const eventRow = {
    user_id: userId,
    action,
    xp_awarded: awarded,
  };

  if (refId) {
    eventRow.ref_id = refId;
  }

  if (metadata && Object.keys(metadata).length > 0) {
    eventRow.metadata = metadata;
  }

  const { error: insertError } = await supabase.from('xp_events').insert(eventRow);

  if (insertError) {
    throw insertError;
  }

  const { data: xpRow, error: xpFetchError } = await supabase
    .from('user_xp')
    .select('total_xp')
    .eq('user_id', userId)
    .maybeSingle();

  if (xpFetchError) {
    throw xpFetchError;
  }

  if (xpRow) {
    const { error: updateError } = await supabase
      .from('user_xp')
      .update({
        total_xp: (xpRow.total_xp || 0) + awarded,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: createError } = await supabase.from('user_xp').insert({
      user_id: userId,
      total_xp: awarded,
    });

    if (createError) {
      throw createError;
    }
  }

  return awarded;
}
