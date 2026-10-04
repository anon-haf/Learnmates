const ALLOWED_ASSET_HOSTS = new Set(['assets.learnmates.org']);
const ALLOWED_SITE_HOSTS = new Set(['www.learnmates.org', 'learnmates.org', 'localhost']);

/**
 * Resolve a client-provided URL/path to an absolute URL safe to fetch server-side.
 */
export function resolveDownloadTarget(rawUrl, siteOrigin) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('/')) {
    const origin = siteOrigin || 'https://www.learnmates.org';
    try {
      return new URL(trimmed, origin).href;
    } catch {
      return null;
    }
  }

  try {
    return new URL(trimmed).href;
  } catch {
    return null;
  }
}

export function classifyDownloadTarget(absoluteUrl) {
  let parsed;
  try {
    parsed = new URL(absoluteUrl);
  } catch {
    return { allowed: false, reason: 'invalid_url' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { allowed: false, reason: 'unsupported_protocol' };
  }

  if (ALLOWED_ASSET_HOSTS.has(parsed.hostname)) {
    return { allowed: true, mode: 'proxy' };
  }

  if (ALLOWED_SITE_HOSTS.has(parsed.hostname)) {
    return { allowed: true, mode: 'proxy' };
  }

  // External resource links (Google Drive, CDN, etc.) — award then redirect.
  return { allowed: true, mode: 'redirect' };
}

export function sanitizeFilename(name) {
  const fallback = 'download';
  if (!name || typeof name !== 'string') return fallback;
  return name.replace(/[\r\n"\\]/g, '_').slice(0, 200) || fallback;
}
