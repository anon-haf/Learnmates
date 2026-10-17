type CacheEntry = {
  dataUrl: string;
  width: number;
  height: number;
  at: number;
};

const MAX_ENTRIES = 24;
const MAX_CACHE_BYTES = 32 * 1024 * 1024;
const cache = new Map<string, CacheEntry>();
let cachedBytes = 0;

function removeCachedRender(key: string) {
  const entry = cache.get(key);
  if (!entry) return;
  cachedBytes -= Math.ceil(entry.dataUrl.length * 0.75);
  cache.delete(key);
}

export function pdfRenderCacheKey(
  pdfKey: string,
  pageNumber: number,
  displayWidth: number,
  renderZoom: number,
  dpr: number
): string {
  const w = Math.round(displayWidth);
  const z = Math.round(renderZoom);
  const r = Math.round(dpr * 100) / 100;
  return `${pdfKey}|${pageNumber}|${w}|${z}|${r}`;
}

export function getCachedPageRender(key: string): CacheEntry | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  hit.at = Date.now();
  return hit;
}

export function setCachedPageRender(key: string, entry: Omit<CacheEntry, 'at'>) {
  const entryBytes = Math.ceil(entry.dataUrl.length * 0.75);
  if (entryBytes > MAX_CACHE_BYTES) return;

  removeCachedRender(key);
  while (
    cache.size >= MAX_ENTRIES ||
    cachedBytes + entryBytes > MAX_CACHE_BYTES
  ) {
    let oldestKey: string | null = null;
    let oldestAt = Infinity;
    cache.forEach((value, k) => {
      if (value.at < oldestAt) {
        oldestAt = value.at;
        oldestKey = k;
      }
    });
    if (!oldestKey) break;
    removeCachedRender(oldestKey);
  }
  cache.set(key, { ...entry, at: Date.now() });
  cachedBytes += entryBytes;
}

export function clearPdfPageRenderCache(pdfKey?: string) {
  if (!pdfKey) {
    cache.clear();
    cachedBytes = 0;
    return;
  }
  const prefix = `${pdfKey}|`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) removeCachedRender(key);
  }
}
