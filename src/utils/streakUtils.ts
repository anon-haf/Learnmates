import { supabase } from '../lib/supabaseClient';

export interface StreakData {
  currentStreak: number;
  lastVisitDate: string;
  longestStreak: number;
  visitedDates: string[];
}

export interface DayData {
  date: string;
  dayOfMonth: number;
  isVisited: boolean;
  month: string;
}

export const getStreakData = async (): Promise<StreakData> => {
  const { data, error } = await supabase.rpc('get_user_streak');
  
  if (error || !data?.[0]) {
    const today = new Date().toISOString().split('T')[0];
    return {
      currentStreak: 1,
      lastVisitDate: today,
      longestStreak: 1,
      visitedDates: [today]
    };
  }
  
  return {
    currentStreak: data[0].current_streak,
    lastVisitDate: data[0].visited_dates[0],
    longestStreak: data[0].longest_streak,
    visitedDates: data[0].visited_dates
  };
};

const awardStreakXP = async (streak: number) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const res = await fetch('/api/xp/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        action: 'streak_visit',
        streak
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.awarded > 0) {
        const { triggerXPNotification } = await import('../components/XPRewardNotification');
        triggerXPNotification(data.awarded, 'streak_visit');
      }
    }
  } catch (error) {
    console.error('Failed to award streak XP:', error);
  }
};

export const updateStreak = async (): Promise<StreakData> => {
  await supabase.rpc('add_user_visit');
  const streak = await getStreakData();
  await awardStreakXP(streak.currentStreak);
  return streak;
};

export const getLast30DaysFromStreak = (streak: StreakData): DayData[] => {
  const today = new Date();
  const days: DayData[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    days.push({
      date: dateStr,
      dayOfMonth: date.getDate(),
      isVisited: streak.visitedDates.includes(dateStr),
      month: date.toLocaleString('default', { month: 'short' }),
    });
  }

  return days;
};

/**
 * Calls updateStreak once and derives both the streak data and the last-30-days
 * calendar from that single Supabase RPC round-trip. This is equivalent to
 * calling updateStreak() + getLast30Days() but avoids the duplicate getStreakData call.
 */
export const updateStreakAndDays = async (): Promise<{ streak: StreakData; days: DayData[] }> => {
  const streak = await updateStreak();
  const days = getLast30DaysFromStreak(streak);
  return { streak, days };
};