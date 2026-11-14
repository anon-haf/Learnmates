/**
 * Cloudflare R2 URL Utility
 * 
 * Transforms local file paths to Cloudflare R2 URLs with proper URL encoding.
 * Implements fallback resolution for file serving.
 */

// Configuration for R2
// This now points at the asset-worker (Cloudflare Worker) gateway, not the
// bucket directly. The bucket is private; the Worker validates the headers
// below and streams the object, with edge caching. See /worker-assets.
const R2_BASE_URL = 'https://assets.learnmates.org';

// Shared secret the asset-worker checks (X-Asset-Key). Must match the
// ASSET_SHARED_KEY secret set on the Worker via `wrangler secret put`.
// This is "basic protection" against casual hotlinking/scraping, not real
// per-user auth — it's visible in the shipped JS bundle like any VITE_ var.
// Keep a fallback matching the local dev secret so requests continue to work
// even if the deployment environment does not inject VITE_ASSET_SHARED_KEY.
const ASSET_SHARED_KEY = (import.meta as any).env?.VITE_ASSET_SHARED_KEY || '';

/**
 * Headers required by the asset-worker for every request to assets.learnmates.org.
 * Import and reuse this anywhere a raw fetch() hits an R2-managed asset URL,
 * so there's a single place to update if the auth scheme ever changes.
 */
export function getAssetAuthHeaders(): HeadersInit {
  return ASSET_SHARED_KEY ? { 'X-Asset-Key': ASSET_SHARED_KEY } : {};
}

// Cache for R2 URL transformation results
const r2UrlCache = new Map<string, string>();

// Cache for fetched R2 blobs to avoid re-fetching
const r2BlobCache = new Map<string, Promise<Blob | null>>();

const isR2ManagedAssetPath = (localPath: string) => {
  const stripped = localPath.replace(/^\/+/, ''); // remove any leading slashes
  return stripped.startsWith('Questions/') || stripped.includes('/Questions/') ||
         stripped.startsWith('topicals/') || stripped.includes('/topicals/');
};

function normalizeR2AssetUrl(value: string): string | null {
  if (!value) return null;

  if (value.startsWith('https://assets.learnmates.org') || value.startsWith('http://assets.learnmates.org')) {
    try {
      const url = new URL(value);
      const encodedPath = encodeR2Path(url.pathname.replace(/^\/+/, ''));
      return `${R2_BASE_URL}/${encodedPath}${url.search}${url.hash}`;
    } catch (error) {
      console.error(`[R2 Utils] Error normalizing assets URL for ${value}:`, error);
      return null;
    }
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value);
      if (url.hostname === 'www.learnmates.org' || url.hostname === 'learnmates.org') {
        const encodedPath = encodeR2Path(url.pathname.replace(/^\/+/, ''));
        return `${R2_BASE_URL}/${encodedPath}${url.search}${url.hash}`;
      }
      return null;
    } catch (error) {
      console.error(`[R2 Utils] Error parsing URL for ${value}:`, error);
      return null;
    }
  }

  return null;
}

/**
 * Encode URL path according to specification:
 * - Ampersand (&) → %26
 * - Comma-space (, ) → %2C
 * - Other special characters encoded per RFC 3986
 * 
 * @param filePath - Original file path
 * @returns Properly encoded URL path
 */
export function encodeR2Path(filePath: string): string {
  // If already a full URL, don't encode it (shouldn't happen, but defensive check)
  if (filePath.startsWith('https://') || filePath.startsWith('http://')) {
    console.warn(`[R2 Utils] encodeR2Path received full URL, returning as-is: ${filePath}`);
    return filePath;
  }
  
  // Custom encoding for specific characters
  // IMPORTANT: Do NOT encode forward slashes (/) - they are part of the path structure
  return filePath
    .split('')
    .map((char) => {
      // Handle specific character mappings
      if (char === '&') return '%26';
      if (char === ' ') return '%20'; // Space in any context
      if (char === ',') return '%2C'; // Comma
      if (char === '/') return '/'; // Forward slash MUST NOT be encoded - it's part of path
      // Let URL encoding handle other special characters (but exclude forward slash)
      if (/[!*'();:@&=+$,?#\[\]]/.test(char)) {
        return encodeURIComponent(char);
      }
      return char;
    })
    .join('');
}

/**
 * Transform a local file path to an R2 URL
 * Only applies to /Questions/ directory
 * 
 * @param localPath - Local file path (e.g., '/Questions/alevel/cambridge/physics/MCQ/9702_p1 forces, density & pressure.pdf')
 * @returns R2 URL (e.g., 'https://learnmates.org/Questions/alevel/cambridge/physics/MCQ/9702_p1%20forces%2Cdensity%20%26%20pressure.pdf')
 */
export function getR2Url(localPath: string): string | null {
  // Normalize absolute LearnMates / assets URLs to the canonical R2 asset host.
  const normalizedAbsoluteUrl = normalizeR2AssetUrl(localPath);
  if (normalizedAbsoluteUrl) {
    return normalizedAbsoluteUrl;
  }

  let pathToTransform = localPath;

  // Normalize absolute LearnMates URLs to the R2 asset host.
  if (localPath.startsWith('http://') || localPath.startsWith('https://')) {
    try {
      const url = new URL(localPath);
      if (url.hostname === 'www.learnmates.org' || url.hostname === 'learnmates.org') {
        pathToTransform = `${url.pathname}${url.search}${url.hash}`;
      } else {
        return localPath;
      }
    } catch (error) {
      console.error(`[R2 Utils] Error parsing URL for ${localPath}:`, error);
      return localPath;
    }
  }

  // Only handle Questions/topicals asset directories
  if (!isR2ManagedAssetPath(pathToTransform)) {
    return null;
  }

  // Check cache first
  if (r2UrlCache.has(localPath)) {
    return r2UrlCache.get(localPath)!;
  }

  try {
    // Remove leading slash if present
    const cleanPath = pathToTransform.startsWith('/') ? pathToTransform.substring(1) : pathToTransform;

    // Encode the path
    const encodedPath = encodeR2Path(cleanPath);

    // Construct R2 URL
    const r2Url = `${R2_BASE_URL}/${encodedPath}`;

    // Cache the result
    r2UrlCache.set(localPath, r2Url);

    return r2Url;
  } catch (error) {
    console.error(`[R2 Utils] Error transforming URL for ${localPath}:`, error);
    return null;
  }
}

/**
 * Attempt to resolve a file from R2 storage
 * Returns the R2 URL if it exists, null otherwise
 * 
 * @param localPath - Local file path
 * @returns R2 URL if file exists in R2, null otherwise
 */
export async function resolveFromR2(localPath: string): Promise<string | null> {
  const normalizedAbsoluteUrl = normalizeR2AssetUrl(localPath);
  if (normalizedAbsoluteUrl) {
    return normalizedAbsoluteUrl;
  }

  // Resolve Questions/topicals assets from R2 only
  const normalizedPath = localPath.startsWith('http://') || localPath.startsWith('https://')
    ? (() => {
        try {
          const url = new URL(localPath);
          return (url.hostname === 'www.learnmates.org' || url.hostname === 'learnmates.org' || url.hostname === 'assets.learnmates.org')
            ? `${url.pathname}${url.search}${url.hash}`
            : localPath;
        } catch {
          return localPath;
        }
      })()
    : localPath;

  if (!isR2ManagedAssetPath(normalizedPath)) {
    return null;
  }

  const r2Url = getR2Url(localPath);
  if (!r2Url) {
    return null;
  }

  console.log(`[R2 Utils] R2 URL available (strict): ${r2Url}`);
  return r2Url;
}

/**
 * Dual-path file resolution:
 * For /Questions/ directory: Go directly to R2 (files are stored there, skip local check)
 * For other paths: Try local first, then R2 fallback
 * 
 * @param localPath - Local file path or already-resolved R2 URL
 * @returns Resolved URL (local path or R2 URL)
 */
export async function resolveFileUrl(localPath: string): Promise<string> {
  // If already an R2 URL, return as-is (avoid double encoding)
  if (localPath.startsWith('https://learnmates.org') || localPath.startsWith('http://')) {
    return localPath;
  }
  
  // For Questions/topicals assets, go directly to R2 (skip local check since files are stored in R2)
  if (isR2ManagedAssetPath(localPath)) {
    const r2Url = await resolveFromR2(localPath);
    if (r2Url) {
      console.log(`[R2 Utils] Using R2 URL directly for Questions path (skipped local check): ${r2Url}`);
      return r2Url;
    }
    // If R2 URL not available, return local path (will be handled by MediaViewer)
    console.warn(`[R2 Utils] R2 URL not available for Questions path, returning local: ${localPath}`);
    return localPath;
  }

  // For non-Questions paths, try local first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for local check

    const response = await fetch(localPath, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/pdf') || contentType.startsWith('image/')) {
        console.log(`[R2 Utils] Using local file: ${localPath}`);
        return localPath;
      }
    }
  } catch (error) {
    // Local file not available, continue to R2 check
    console.log(`[R2 Utils] Local file not available: ${localPath}`);
  }

  // Fallback to R2 for non-Questions paths
  const r2Url = await resolveFromR2(localPath);
  if (r2Url) {
    return r2Url;
  }

  // If R2 also not available, return local path as final fallback
  console.warn(`[R2 Utils] File not found anywhere, returning local path: ${localPath}`);
  return localPath;
}

/**
 * Synchronous URL resolution (uses cached R2 URLs)
 * For use in situations where async isn't available
 * 
 * @param localPath - Local file path
 * @returns Local path or cached R2 URL
 */
export function resolveFileUrlSync(localPath: string): string {
  // Check cache first
  if (r2UrlCache.has(localPath)) {
    return r2UrlCache.get(localPath)!;
  }

  // Return local path if not cached
  return localPath;
}

/**
 * Fetch a file from R2 as a Blob
 * Handles CORS issues by attempting direct fetch first, then CORS proxy as fallback
 * 
 * @param r2Url - R2 URL to fetch
 * @returns Blob data, or null if fetch fails
 */
export async function fetchR2AsBlob(r2Url: string): Promise<Blob | null> {
  // Check blob cache first
  if (r2BlobCache.has(r2Url)) {
    return r2BlobCache.get(r2Url)!;
  }

  const fetchPromise = (async () => {
    try {
      console.log(`[R2 Utils] Attempting direct R2 fetch: ${r2Url}`);
      const response = await fetch(r2Url, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf,image/*,*/*',
          ...getAssetAuthHeaders(),
        }
      });

      if (!response.ok) {
        console.error(`[R2 Utils] Direct fetch returned status ${response.status} for: ${r2Url}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      const blob = await response.blob();
      const blobType = blob.type || '';
      const finalContentType = contentType || blobType || '';

      if (finalContentType.includes('text/html') || finalContentType.includes('application/json')) {
        console.error(`[R2 Utils] R2 returned HTML/JSON instead of PDF/image: ${r2Url}`);
        return null;
      }

      if (blob.size === 0) {
        console.error(`[R2 Utils] R2 returned empty blob: ${r2Url}`);
        return null;
      }

      console.log(`[R2 Utils] Successfully fetched R2 blob: ${r2Url.substring(0, 80)}..., content-type: ${finalContentType}, blob size: ${blob.size} bytes`);
      return blob;
    } catch (err) {
      console.error(`[R2 Utils] Error fetching R2 blob:`, err);
      return null;
    }
  })();

  r2BlobCache.set(r2Url, fetchPromise);
  return fetchPromise;
}

/**
 * Fetch a file from R2 as a Blob URL (for PDF.js and similar)
 * This creates a blob URL that can be used without CORS issues
 * 
 * @param r2Url - R2 URL to fetch
 * @returns Blob URL (blob://...), or null if fetch fails
 */
export async function fetchR2AsBlobUrl(r2Url: string): Promise<string | null> {
  const blob = await fetchR2AsBlob(r2Url);
  if (blob) {
    const blobUrl = URL.createObjectURL(blob);
    console.log(`[R2 Utils] Created blob URL from R2 file`);
    return blobUrl;
  }
  return null;
}


