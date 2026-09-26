import { supabase } from '../lib/supabaseClient';
import { triggerXPNotification } from '../components/XPRewardNotification';

export type DownloadResourceType = 'file' | 'paper' | 'topical_paper';

const ACTION_BY_TYPE: Record<DownloadResourceType, string> = {
  file: 'download',
  paper: 'paper_download',
  topical_paper: 'topical_paper_download',
};

const XP_TIMEOUT_MS = 1500;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('XP request timeout')), ms)
    ),
  ]);
}

/**
 * Awards download XP and returns the amount awarded (0 if at cap or error).
 * Uses keepalive + timeout so the request completes even if the user navigates away,
 * but callers should await this before triggering the actual download to ensure
 * the XP is recorded before the user can leave the page.
 */
export async function awardDownloadXP({
  resourceId,
  resourceName,
  resourceType,
}: {
  resourceId: string;
  resourceName: string;
  resourceType: DownloadResourceType;
}): Promise<number> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return 0;

    const response = await withTimeout(
      fetch('/api/xp/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        keepalive: true,
        body: JSON.stringify({ resourceId, resourceName, resourceType }),
      }),
      XP_TIMEOUT_MS
    );

    if (response.ok) {
      const data = await response.json();
      if (data.xpAwarded > 0) {
        triggerXPNotification(data.xpAwarded, ACTION_BY_TYPE[resourceType]);
      }
      return data.xpAwarded;
    }
    return 0;
  } catch (error) {
    console.error('Failed to award download XP', error);
    return 0;
  }
}
