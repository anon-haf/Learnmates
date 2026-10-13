import { supabase } from '../lib/supabaseClient';

export interface LogTopicalSearchParams {
  level: string;
  board: string;
  subject: string;
  topics: string[];
  resultCount: number;
}

/**
 * Logs a "Find Matching Papers" search event to the Supabase `topicals` table.
 * - Only logs searches from logged-in users.
 * - Non-blocking: never throws or interrupts the user flow.
 */
export async function logTopicalSearch({
  level,
  board,
  subject,
  topics,
  resultCount,
}: LogTopicalSearchParams): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      // Anonymous users are not tracked
      return false;
    }

    const { error } = await supabase.from('topicals').insert({
      user_id: userId,
      level,
      board,
      subject,
      topics,
      result_count: resultCount,
    });

    if (error) {
      console.warn('[logTopicalSearch] Failed to log topical search:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[logTopicalSearch] Error logging topical search:', err);
    return false;
  }
}
