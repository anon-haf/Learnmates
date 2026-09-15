import type {
  Point,
  VectorStroke,
  VectorShape,
  VectorAction,
  StoredVectorPage,
  StoredVectorAnnotations,
} from './pdfVectorAnnotationStorage';

const DB_NAME = 'pdf-annotations';
const STORE_NAME = 'annotations';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'pdfUrl' });
      }
    };
  });
}

function hashPdfUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}


const temporaryStorage = new Map<string, StoredVectorAnnotations>();

export async function loadAnnotations(pdfUrl: string, storageMode: 'permanent' | 'temporary' = 'permanent'): Promise<StoredVectorAnnotations | null> {
  if (storageMode === 'temporary') {
    return temporaryStorage.get(pdfUrl) || null;
  }
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get(pdfUrl);
      request.onsuccess = () => {
        const result = request.result as StoredVectorAnnotations | undefined;
        if (result && result.version === 2) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}


export async function saveAnnotations(
  pdfUrl: string,
  pages: Record<number, StoredVectorPage>,
  storageMode: 'permanent' | 'temporary' = 'permanent'
): Promise<void> {
  try {
    const pageEntries = Object.entries(pages);

    if (pageEntries.length === 0) {
      await clearStoredAnnotations(pdfUrl, storageMode);
      return;
    }


    const payload: StoredVectorAnnotations = {
      version: 2,
      pdfUrl,
      savedAt: Date.now(),
      pages: Object.fromEntries(pageEntries.map(([page, data]) => [String(page), data])),
    };

    if (storageMode === 'temporary') {
      temporaryStorage.set(pdfUrl, payload);
      return;
    }


    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(payload);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save annotations to IndexedDB:', error);
  }
}


export async function clearStoredAnnotations(pdfUrl: string, storageMode: 'permanent' | 'temporary' = 'permanent'): Promise<void> {
  if (storageMode === 'temporary') {
    temporaryStorage.delete(pdfUrl);
    return;
  }
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(pdfUrl);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to clear annotations from IndexedDB:', error);
  }
}

export async function getAllStorageInfo(): Promise<Record<string, { size: number; pages: number; savedAt: number }>> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const results = request.result as StoredVectorAnnotations[];
        const info: Record<string, { size: number; pages: number; savedAt: number }> = {};

        results.forEach((annotation) => {
          const size = new Blob([JSON.stringify(annotation)]).size;
          info[annotation.pdfUrl] = {
            size,
            pages: Object.keys(annotation.pages).length,
            savedAt: annotation.savedAt,
          };
        });

        resolve(info);
      };
      request.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

export function canvasHasContent(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const { width, height } = canvas;
  if (width === 0 || height === 0) return false;

  const step = Math.max(1, Math.floor(Math.min(width, height) / 40));
  const data = ctx.getImageData(0, 0, width, height).data;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 0) return true;
    }
  }

  return false;
}

export function exportCanvasAnnotation(
  canvas: HTMLCanvasElement,
  options?: { skipContentCheck?: boolean }
): StoredVectorPage | null {
  if (!options?.skipContentCheck && !canvasHasContent(canvas)) return null;

  const rasterFallback = canvas.toDataURL('image/webp', 0.75);

  return {
    width: canvas.width,
    height: canvas.height,
    actions: [],
    rasterFallback,
  };
}

/**
 * Redraw all vector actions and raster fallback onto a canvas
 */
export function applyStoredAnnotation(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  stored: StoredVectorPage
): Promise<void> {
  return new Promise((resolve) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply vector actions first
    for (const action of stored.actions) {
      if (action.type === 'freehand') {
        applyStroke(ctx, action);
      } else {
        applyShape(ctx, action);
      }
    }

    // Apply raster fallback if present (stores canvas drawing as image)
    if (stored.rasterFallback) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      img.onerror = () => {
        resolve(); // Resolve even if image fails to load
      };
      img.src = stored.rasterFallback;
    } else {
      resolve();
    }
  });
}

function applyStroke(ctx: CanvasRenderingContext2D, stroke: VectorStroke) {
  if (stroke.points.length < 2) return;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'pen') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = stroke.size;
  }

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  ctx.stroke();
}

function applyShape(ctx: CanvasRenderingContext2D, shape: VectorShape) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = shape.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const { start, end } = shape;
  const width = end.x - start.x;
  const height = end.y - start.y;

  ctx.beginPath();

  if (shape.type === 'line') {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
  } else if (shape.type === 'rectangle') {
    ctx.rect(start.x, start.y, width, height);
  } else if (shape.type === 'ellipse') {
    const centerX = start.x + width / 2;
    const centerY = start.y + height / 2;
    const radiusX = Math.abs(width / 2);
    const radiusY = Math.abs(height / 2);

    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  }

  ctx.stroke();
}

export type StoredAnnotationPage = StoredVectorPage;
export type StoredAnnotations = StoredVectorAnnotations;
