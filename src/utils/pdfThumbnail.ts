import type { PDFDocumentProxy } from 'pdfjs-dist';
import { pdfjs, pdfGetDocumentOptions } from './pdfjsConfig';
import { resolveFromR2, getAssetAuthHeaders } from './r2Utils';

type PdfFileSource = string | { data: Uint8Array };

const thumbnailCache = new Map<string, string>();
const pendingRenders = new Map<string, Promise<string>>();
let activeRenders = 0;
const MAX_CONCURRENT_THUMBNAILS = 2;
const renderQueue: Array<() => void> = [];

function runNextQueuedRender() {
  if (activeRenders >= MAX_CONCURRENT_THUMBNAILS || renderQueue.length === 0) return;
  const next = renderQueue.shift();
  next?.();
}

function enqueueRender<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeRenders += 1;
      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeRenders -= 1;
          runNextQueuedRender();
        });
    };

    if (activeRenders < MAX_CONCURRENT_THUMBNAILS) {
      run();
    } else {
      renderQueue.push(run);
    }
  });
}

export function clearPdfThumbnailCache(cacheKey?: string) {
  if (cacheKey) {
    for (const key of thumbnailCache.keys()) {
      if (key.startsWith(`${cacheKey}:`)) {
        thumbnailCache.delete(key);
      }
    }
    return;
  }
  thumbnailCache.clear();
}

export async function loadPdfDocument(file: PdfFileSource): Promise<PDFDocumentProxy> {
  if (typeof file === 'string') {
    const resolvedUrl = (await resolveFromR2(file)) || file;
    const url =
      resolvedUrl.startsWith('http') || resolvedUrl.startsWith('blob:')
        ? resolvedUrl
        : new URL(resolvedUrl, window.location.origin).href;
    return pdfjs.getDocument({
      ...pdfGetDocumentOptions,
      url,
      httpHeaders: getAssetAuthHeaders(),
    } as Parameters<typeof pdfjs.getDocument>[0]).promise;
  }

  // Copy bytes — react-pdf may detach the shared ArrayBuffer on the main viewer load.
  return pdfjs.getDocument({
    ...pdfGetDocumentOptions,
    data: file.data.slice(),
  } as Parameters<typeof pdfjs.getDocument>[0]).promise;
}

export async function renderPdfPageThumbnail(
  doc: PDFDocumentProxy,
  pageNumber: number,
  targetWidth: number,
  cacheKey: string
): Promise<string> {
  const storageKey = `${cacheKey}:${pageNumber}:${targetWidth}`;
  const cached = thumbnailCache.get(storageKey);
  if (cached) return cached;

  const pending = pendingRenders.get(storageKey);
  if (pending) return pending;

  const renderTask = enqueueRender(async () => {
    const page = await doc.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    // Target region ratio (210/297 - A4 dimensions)
    const TARGET_RATIO = 210 / 297;
    const pageRatio = viewport.width / viewport.height;

    // Calculate final dimensions
    const finalWidth = Math.max(1, Math.floor(viewport.width));
    let finalHeight = Math.max(1, Math.floor(viewport.height));
    const contentHeight = finalHeight;
    let topPadding = 0;

    // If target ratio is greater than page ratio, add white space above and below
    if (TARGET_RATIO > pageRatio) {
      // Target region is narrower/taller than page, so add vertical padding
      finalHeight = Math.round(finalWidth / TARGET_RATIO);
      topPadding = Math.floor((finalHeight - contentHeight) / 2);
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas not available');
    }

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    // Fill with white background
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // If we need padding, render to temp canvas first
    if (topPadding > 0) {
      const tempCanvas = document.createElement('canvas');
      const tempContext = tempCanvas.getContext('2d');
      if (!tempContext) {
        throw new Error('Canvas not available');
      }
      
      tempCanvas.width = finalWidth;
      tempCanvas.height = contentHeight;

      await page.render({
        canvas: tempCanvas,
        canvasContext: tempContext,
        viewport,
      }).promise;

      // Draw temp canvas to main canvas at offset
      context.drawImage(tempCanvas, 0, topPadding);
    } else {
      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.45);
    thumbnailCache.set(storageKey, dataUrl);
    pendingRenders.delete(storageKey);
    return dataUrl;
  });

  pendingRenders.set(storageKey, renderTask);
  return renderTask;
}
