const DOWNLOAD_ACTIONS = new Set(['download', 'paper_download', 'topical_paper_download']);

function isMissingColumnError(error) {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  const details = (error.details || '').toLowerCase();
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    message.includes('metadata') ||
    details.includes('metadata')
  );
}

async function insertXpEvent(supabase, eventRow) {
  const { data, error } = await supabase
    .from('xp_events')
    .insert(eventRow)
    .select('id')
    .single();

  if (!error) {
    return { data, error: null };
  }

  if (isMissingColumnError(error) && eventRow.metadata !== undefined) {
    const { metadata: _removed, ...withoutMetadata } = eventRow;
    return supabase.from('xp_events').insert(withoutMetadata).select('id').single();
  }

  return { data, error };
}

/**
 * Legacy award path when fn_award_capped_xp is not deployed or errors at runtime.
 * Includes download idempotency by (user_id, action, ref_id).
 */
export async function awardCappedXPFallback(supabase, {
  userId,
  action,
  refId = null,
  amount,
  dailyCap,
  metadata = {},
}) {
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
    console.error('[awardCappedXPFallback] cap fetch failed:', fetchError);
    throw fetchError;
  }

  const todayTotal = (events || []).reduce((sum, row) => sum + (row.xp_awarded || 0), 0);
  const awarded = Math.max(0, Math.min(amount, dailyCap - todayTotal));
  if (awarded <= 0) {
    return 0;
  }

  if (refId && DOWNLOAD_ACTIONS.has(action)) {
    const { data: existing, error: dupError } = await supabase
      .from('xp_events')
      .select('id')
      .eq('user_id', userId)
      .eq('action', action)
      .eq('ref_id', refId)
      .maybeSingle();

    if (dupError) {
      console.error('[awardCappedXPFallback] idempotency check failed:', dupError);
      throw dupError;
    }
    if (existing) {
      return 0;
    }
  }

  const eventRow = {
    user_id: userId,
    action,
    xp_awarded: awarded,
  };
  if (refId) eventRow.ref_id = refId;
  if (metadata && Object.keys(metadata).length > 0) {
    eventRow.metadata = metadata;
  }

  const { data: insertedEvent, error: insertError } = await insertXpEvent(supabase, eventRow);

  if (insertError) {
    if (insertError.code === '23505' && refId && DOWNLOAD_ACTIONS.has(action)) {
      return 0;
    }
    console.error('[awardCappedXPFallback] insert xp_events failed:', insertError);
    throw insertError;
  }

  const { data: xpRow, error: xpFetchError } = await supabase
    .from('user_xp')
    .select('total_xp')
    .eq('user_id', userId)
    .maybeSingle();

  if (xpFetchError) {
    console.error('[awardCappedXPFallback] user_xp fetch failed (event id=%s):', insertedEvent?.id, xpFetchError);
    throw xpFetchError;
  }

  const nowIso = new Date().toISOString();

  if (xpRow) {
    const { error: updateError } = await supabase
      .from('user_xp')
      .update({
        total_xp: (xpRow.total_xp || 0) + awarded,
        updated_at: nowIso,
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[awardCappedXPFallback] user_xp update failed (event id=%s):', insertedEvent?.id, updateError);
      throw updateError;
    }
  } else {
    const { error: createError } = await supabase.from('user_xp').insert({
      user_id: userId,
      total_xp: awarded,
      updated_at: nowIso,
    });

    if (createError) {
      const { error: createWithoutUpdatedAt } = await supabase.from('user_xp').insert({
        user_id: userId,
        total_xp: awarded,
      });
      if (createWithoutUpdatedAt) {
        console.error('[awardCappedXPFallback] user_xp insert failed (event id=%s):', insertedEvent?.id, createError);
        throw createError;
      }
    }
  }

  return awarded;
}
