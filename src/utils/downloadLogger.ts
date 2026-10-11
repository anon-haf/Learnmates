import { supabase } from '../lib/supabaseClient';

export type DownloadAction =
  | 'past_paper_download'
  | 'topical_download'
  | 'resource_download';

export interface LogDownloadParams {
  action: DownloadAction;
  url: string;
}

/**
 * Normalizes resource download URLs to full path (e.g. /documents/alevel/cambridge/Physics/2-Kinematics/Kinematics.pdf)
 */
export function formatResourceUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const clean = rawUrl.split('?')[0].split('#')[0].trim();
  const docIdx = clean.indexOf('/documents/');
  if (docIdx !== -1) {
    return clean.slice(docIdx);
  }
  if (clean.startsWith('documents/')) {
    return `/${clean}`;
  }
  if (clean.startsWith('/')) {
    return clean;
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const parsed = new URL(clean);
      return parsed.pathname || clean;
    } catch {
      return clean;
    }
  }
  return `/${clean}`;
}

/**
 * Formats past papers and topical download URLs according to the rule:
 * structured as board/level/subject/{file_name}, e.g. cambridge/alevel/Physics/9702_s22_qp_12.pdf
 */
export function formatPaperOrTopicalUrl(
  board: string,
  level: string,
  subject: string,
  fileName: string
): string {
  const cleanBoard = (board || '').trim().replace(/^\/+|\/+$/g, '');
  const cleanLevel = (level || '').trim().replace(/^\/+|\/+$/g, '');
  const cleanSubject = (subject || '').trim().replace(/^\/+|\/+$/g, '');
  const cleanFile = (fileName || '').trim().replace(/^\/+/, '');
  return `${cleanBoard}/${cleanLevel}/${cleanSubject}/${cleanFile}`;
}

/**
 * Normalizes any raw past paper or topical URL/path into board/level/subject/{file_name}
 */
export function normalizePaperOrTopicalUrl(
  rawUrl: string,
  fallback?: { board?: string; level?: string; subject?: string; fileName?: string }
): string {
  if (!rawUrl) {
    if (fallback?.board && fallback?.level && fallback?.subject && fallback?.fileName) {
      return formatPaperOrTopicalUrl(fallback.board, fallback.level, fallback.subject, fallback.fileName);
    }
    return '';
  }

  // Strip query/hash and decoded
  let path = rawUrl.split('?')[0].split('#')[0].trim();
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsed = new URL(path);
      path = decodeURIComponent(parsed.pathname);
    } catch {
      // keep path
    }
  }

  // Strip leading slash
  path = path.replace(/^\/+/, '');

  // Check if it's in format: Questions/{level}/{board}/{subject}/.../{fileName}
  const questionsMatch = path.match(/^Questions\/([^/]+)\/([^/]+)\/([^/]+)\/(?:.*\/)?([^/]+)$/i);
  if (questionsMatch) {
    const [, level, board, subject, fileName] = questionsMatch;
    return formatPaperOrTopicalUrl(board, level, subject, fallback?.fileName || fileName);
  }

  // Check if it's in format: topicals/{board}/{level}/{subject}/.../{fileName}
  const topicalsMatch = path.match(/^topicals\/([^/]+)\/([^/]+)\/([^/]+)\/(?:.*\/)?([^/]+)$/i);
  if (topicalsMatch) {
    const [, board, level, subject, fileName] = topicalsMatch;
    return formatPaperOrTopicalUrl(board, level, subject, fallback?.fileName || fileName);
  }

  // Check if it's already board/level/subject/{fileName}
  const standardMatch = path.match(/^([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (standardMatch) {
    const [, board, level, subject, fileName] = standardMatch;
    return formatPaperOrTopicalUrl(board, level, subject, fallback?.fileName || fileName);
  }

  // Fallback using provided metadata
  if (fallback?.board && fallback?.level && fallback?.subject) {
    const lastPart = path.split('/').pop() || fallback.fileName || 'file.pdf';
    return formatPaperOrTopicalUrl(
      fallback.board,
      fallback.level,
      fallback.subject,
      fallback.fileName || lastPart
    );
  }

  return path;
}

/**
 * Logs a download event to the Supabase download table.
 * - Only logs downloads from logged-in users (user_id populated with authenticated user's ID).
 * - Anonymous downloads are NOT recorded.
 * - Duplicate entries are allowed (no deduping).
 * - Non-blocking (never throws or interrupts user download flow).
 */
export async function logDownload({ action, url }: LogDownloadParams): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Requirement: Only log downloads from logged-in users — anonymous downloads should not be recorded
    if (!userId) {
      return false;
    }

    const cleanUrl = url?.trim();
    if (!cleanUrl) {
      return false;
    }

    const { error } = await supabase.from('download').insert({
      user_id: userId,
      action,
      url: cleanUrl,
    });

    if (error) {
      console.warn('[downloadLogger] Failed to log download event:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[downloadLogger] Error logging download event:', err);
    return false;
  }
}
