type CacheEntry = {
  dataUrl: string;
  width: number;
  height: number;
  at: number;
};

const MAX_ENTRIES = 48;
const cache = new Map<string, CacheEntry>();

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
  if (cache.size >= MAX_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestAt = Infinity;
    cache.forEach((value, k) => {
      if (value.at < oldestAt) {
        oldestAt = value.at;
        oldestKey = k;
      }
    });
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { ...entry, at: Date.now() });
}

export function clearPdfPageRenderCache(pdfKey?: string) {
  if (!pdfKey) {
    cache.clear();
    return;
  }
  const prefix = `${pdfKey}|`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
