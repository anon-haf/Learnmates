/**
 * Awards capped XP with guaranteed xp_events logging.
 * xp_events is always inserted BEFORE user_xp is updated.
 * Uses a 24-hour rolling window for daily cap checks to avoid timezone issues.
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

  // Use a 24h rolling window anchored to midnight UTC to avoid timezone edge cases.
  const now = new Date();
  const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const windowStart = startOfTodayUTC.toISOString();

  const { data: events, error: fetchError } = await supabase
    .from('xp_events')
    .select('xp_awarded')
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart);

  if (fetchError) {
    console.error('[awardCappedXP] Failed to fetch xp_events for cap check:', fetchError);
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

  // Step 1: Insert xp_events row first.
  const { data: insertedEvent, error: insertError } = await supabase
    .from('xp_events')
    .insert(eventRow)
    .select('id')
    .single();

  if (insertError) {
    console.error('[awardCappedXP] Failed to insert xp_events row:', insertError);
    throw insertError;
  }

  // Step 2: Update user_xp. If this fails, we log clearly so it can be reconciled.
  const { data: xpRow, error: xpFetchError } = await supabase
    .from('user_xp')
    .select('total_xp')
    .eq('user_id', userId)
    .maybeSingle();

  if (xpFetchError) {
    console.error('[awardCappedXP] Failed to fetch user_xp (event already logged, id=%s):', insertedEvent?.id, xpFetchError);
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
      console.error('[awardCappedXP] Failed to update user_xp (event already logged, id=%s):', insertedEvent?.id, updateError);
      throw updateError;
    }
  } else {
    const { error: createError } = await supabase.from('user_xp').insert({
      user_id: userId,
      total_xp: awarded,
    });

    if (createError) {
      console.error('[awardCappedXP] Failed to create user_xp row (event already logged, id=%s):', insertedEvent?.id, createError);
      throw createError;
    }
  }

  return awarded;
}
