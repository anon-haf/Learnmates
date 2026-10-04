import { supabase } from '../lib/supabaseClient';
import { triggerXPNotification } from '../components/XPRewardNotification';
import type { DownloadResourceType } from './awardDownloadXP';
// DownloadResourceType is defined in awardDownloadXP.ts to keep a single import path for components.

const ACTION_BY_TYPE: Record<DownloadResourceType, string> = {
  file: 'download',
  paper: 'paper_download',
  topical_paper: 'topical_paper_download',
};

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

function notifyIfAwarded(xpAwarded: number, resourceType: DownloadResourceType) {
  if (xpAwarded > 0) {
    triggerXPNotification(xpAwarded, ACTION_BY_TYPE[resourceType]);
  }
}

function readXpAwardedHeader(response: Response): number {
  const header = response.headers.get('X-XP-Awarded');
  if (!header) return 0;
  const parsed = Number(header);
  return Number.isFinite(parsed) ? parsed : 0;
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Commits download XP on the server (transactional + idempotent).
 * Use for client-generated blobs (merged PDFs) where the file is not served by /api/download.
 */
export async function commitDownloadAward({
  resourceId,
  resourceName,
  resourceType,
}: {
  resourceId: string;
  resourceName: string;
  resourceType: DownloadResourceType;
}): Promise<number> {
  const token = await getAccessToken();
  if (!token) return 0;

  const response = await fetch('/api/xp/download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ resourceId, resourceName, resourceType }),
  });

  if (!response.ok) {
    throw new Error(`Download XP commit failed (${response.status})`);
  }

  const data = await response.json();
  const xpAwarded = data.xpAwarded ?? 0;
  notifyIfAwarded(xpAwarded, resourceType);
  return xpAwarded;
}

/**
 * Awards XP on the server, then delivers the file (redirect or proxied stream).
 * XP is committed before the response body / redirect is sent.
 */
export async function downloadFileWithXP({
  url,
  resourceId,
  resourceName,
  resourceType,
  filename,
}: {
  url: string;
  resourceId: string;
  resourceName: string;
  resourceType: DownloadResourceType;
  filename: string;
}): Promise<number> {
  const token = await getAccessToken();
  if (!token) return 0;

  const params = new URLSearchParams({
    url,
    resourceId,
    resourceName,
    resourceType,
  });

  const response = await fetch(`/api/download?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    redirect: 'manual',
  });

  if (response.status >= 300 && response.status < 400) {
    const xpAwarded = readXpAwardedHeader(response);
    const location = response.headers.get('Location');
    if (location) {
      window.open(location, '_blank');
    }
    notifyIfAwarded(xpAwarded, resourceType);
    return xpAwarded;
  }

  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }

  const xpAwarded = readXpAwardedHeader(response);
  const blob = await response.blob();
  triggerBrowserDownload(blob, filename);
  notifyIfAwarded(xpAwarded, resourceType);
  return xpAwarded;
}
