/**
 * Helper functions to determine action and format URLs for the Supabase download table
 */

export function mapDownloadAction(resourceType) {
  if (resourceType === 'paper') return 'past_paper_download';
  if (resourceType === 'topical_paper') return 'topical_download';
  return 'resource_download';
}

export function formatDownloadUrl(action, rawUrl, fallbackName) {
  if (!rawUrl) return '';
  let path = rawUrl.split('?')[0].split('#')[0].trim();
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsed = new URL(path);
      path = decodeURIComponent(parsed.pathname);
    } catch {
      // keep path
    }
  }

  if (action === 'resource_download') {
    const docIdx = path.indexOf('/documents/');
    if (docIdx !== -1) {
      return path.slice(docIdx);
    }
    if (path.startsWith('documents/')) {
      return `/${path}`;
    }
    return path.startsWith('/') ? path : `/${path}`;
  }

  // For past_paper_download and topical_download:
  // Must be structured as board/level/subject/{file_name}
  path = path.replace(/^\/+/, '');
  const questionsMatch = path.match(/^Questions\/([^/]+)\/([^/]+)\/([^/]+)\/(?:.*\/)?([^/]+)$/i);
  if (questionsMatch) {
    const [, level, board, subject, fileName] = questionsMatch;
    return `${board}/${level}/${subject}/${fallbackName || fileName}`;
  }

  const topicalsMatch = path.match(/^topicals\/([^/]+)\/([^/]+)\/([^/]+)\/(?:.*\/)?([^/]+)$/i);
  if (topicalsMatch) {
    const [, board, level, subject, fileName] = topicalsMatch;
    return `${board}/${level}/${subject}/${fallbackName || fileName}`;
  }

  return path;
}

export async function logDownloadServer(supabase, { userId, resourceType, rawUrl, resourceName }) {
  if (!userId) return false;
  try {
    const action = mapDownloadAction(resourceType);
    const url = formatDownloadUrl(action, rawUrl, resourceName);
    const { error } = await supabase.from('download').insert({
      user_id: userId,
      action,
      url,
    });
    if (error) {
      console.warn('[download-logger] Failed to insert download event:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[download-logger] Error logging download event:', err);
    return false;
  }
}
