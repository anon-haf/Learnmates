export async function hasStreakEventOnUtcDay(supabase, userId, date = new Date()) {
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const nextDay = new Date(dayStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const { data, error } = await supabase
    .from('xp_events')
    .select('id')
    .eq('user_id', userId)
    .eq('action', 'streak_visit')
    .gte('created_at', dayStart.toISOString())
    .lt('created_at', nextDay.toISOString())
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
