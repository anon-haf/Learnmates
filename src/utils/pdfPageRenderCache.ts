type CacheEntry = {
  dataUrl: string;
  width: number;
  height: number;
  at: number;
};

export type CachedPdfPageRender = {
  pageNumber: number;
  dataUrl: string;
  width: number;
};

const MAX_ENTRIES = 24;
const MAX_CACHE_BYTES = 32 * 1024 * 1024;
const cache = new Map<string, CacheEntry>();
const pageCounts = new Map<string, number>();
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

export function getCachedPdfPageRenders(pdfKey: string): CachedPdfPageRender[] {
  const prefix = `${pdfKey}|`;
  const pages = new Map<number, { dataUrl: string; width: number; height: number; at: number }>();

  for (const [key, entry] of cache) {
    if (!key.startsWith(prefix)) continue;
    const pageNumber = Number(key.slice(prefix.length).split('|', 1)[0]);
    if (!Number.isInteger(pageNumber) || pageNumber < 1) continue;

    entry.at = Date.now();
    const current = pages.get(pageNumber);
    if (!current || entry.width * entry.height > current.width * current.height) {
      pages.set(pageNumber, entry);
    }
  }

  return Array.from(pages, ([pageNumber, entry]) => ({
    pageNumber,
    dataUrl: entry.dataUrl,
    width: entry.width,
  })).sort((a, b) => a.pageNumber - b.pageNumber);
}

export function getCachedPdfPageCount(pdfKey: string): number | undefined {
  return pageCounts.get(pdfKey);
}

export function setCachedPdfPageCount(pdfKey: string, pageCount: number) {
  if (!Number.isInteger(pageCount) || pageCount < 1) return;
  pageCounts.delete(pdfKey);
  pageCounts.set(pdfKey, pageCount);
  while (pageCounts.size > MAX_ENTRIES) {
    const oldestKey = pageCounts.keys().next().value;
    if (oldestKey === undefined) break;
    pageCounts.delete(oldestKey);
  }
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
    pageCounts.clear();
    cachedBytes = 0;
    return;
  }
  const prefix = `${pdfKey}|`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) removeCachedRender(key);
  }
  pageCounts.delete(pdfKey);
}
