export type Point = { x: number; y: number };

export type VectorStroke = {
  type: 'freehand';
  tool: 'pen' | 'eraser';
  points: Point[];
  color: string;
  size: number;
};

export type VectorShape = {
  type: 'line' | 'rectangle' | 'ellipse';
  start: Point;
  end: Point;
  color: string;
  size: number;
};

export type VectorAction = VectorStroke | VectorShape;

export type StoredVectorPage = {
  width: number;
  height: number;
  actions: VectorAction[];
  rasterFallback?: string; // Base64 canvas image for drawings not yet converted to vectors
};

export type StoredVectorAnnotations = {
  version: 2;
  pdfUrl: string;
  savedAt: number;
  pages: Record<string, StoredVectorPage>;
};

const STORAGE_PREFIX = 'pdf-annotations-vector:';

function hashPdfUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function storageKey(pdfUrl: string) {
  return `${STORAGE_PREFIX}${hashPdfUrl(pdfUrl)}`;
}

export function loadAnnotations(pdfUrl: string): StoredVectorAnnotations | null {
  try {
    const raw = localStorage.getItem(storageKey(pdfUrl));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredVectorAnnotations;
    if (parsed.version !== 2 || !parsed.pages) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAnnotations(
  pdfUrl: string,
  pages: Record<number, StoredVectorPage>
) {
  const key = storageKey(pdfUrl);
  const pageEntries = Object.entries(pages);

  if (pageEntries.length === 0) {
    localStorage.removeItem(key);
    return;
  }

  const payload: StoredVectorAnnotations = {
    version: 2,
    pdfUrl,
    savedAt: Date.now(),
    pages: Object.fromEntries(pageEntries.map(([page, data]) => [String(page), data])),
  };

  localStorage.setItem(key, JSON.stringify(payload));
}

export function clearStoredAnnotations(pdfUrl: string) {
  localStorage.removeItem(storageKey(pdfUrl));
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

/**
 * Capture canvas content, storing as raster fallback until vector action recording is implemented
 */
export function exportCanvasAnnotation(
  canvas: HTMLCanvasElement
): StoredVectorPage | null {
  if (!canvasHasContent(canvas)) return null;

  const rasterFallback = canvas.toDataURL('image/png');

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
      let hasResolved = false;
      const done = () => {
        if (!hasResolved) {
          hasResolved = true;
          resolve();
        }
      };
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        done();
      };
      img.onerror = () => {
        done();
      };
      img.src = stored.rasterFallback;
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        done();
      }
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
