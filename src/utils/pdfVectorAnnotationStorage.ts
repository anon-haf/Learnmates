import { pdfStrokeWidthInCanvasPixels } from './pdfAnnotationMetrics';

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

export type VectorText = {
  type: 'text';
  position: Point;
  text: string;
  color: string;
  size: number;
  width?: number;
};

export type VectorAction = VectorStroke | VectorShape | VectorText;

function actionPath(action: VectorAction, coordinateScale: number): Point[] {
  if (action.type === 'freehand') return action.points;
  if (action.type === 'text') {
    const width = (action.width ?? Math.max(action.size, action.text.length * action.size * 0.6)) *
      coordinateScale;
    const estimatedLines = action.width
      ? Math.ceil(
          (action.text.length * action.size * 0.6) /
            Math.max(action.width, action.size)
        )
      : 1;
    const height =
      Math.max(1, action.text.split('\n').length, estimatedLines) *
      action.size *
      1.25 *
      coordinateScale;
    return [
      action.position,
      { x: action.position.x + width, y: action.position.y },
      { x: action.position.x + width, y: action.position.y + height },
      { x: action.position.x, y: action.position.y + height },
      action.position,
    ];
  }

  if (action.type === 'line') return [action.start, action.end];
  if (action.type === 'rectangle') {
    return [
      action.start,
      { x: action.end.x, y: action.start.y },
      action.end,
      { x: action.start.x, y: action.end.y },
      action.start,
    ];
  }

  const centerX = (action.start.x + action.end.x) / 2;
  const centerY = (action.start.y + action.end.y) / 2;
  const radiusX = Math.abs(action.end.x - action.start.x) / 2;
  const radiusY = Math.abs(action.end.y - action.start.y) / 2;
  return Array.from({ length: 49 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2;
    return {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
    };
  });
}

function getPathBounds(points: Point[]) {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  );
}

function pointSegmentDistanceSquared(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) {
    const px = point.x - start.x;
    const py = point.y - start.y;
    return px * px + py * py;
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        lengthSquared
    )
  );
  const px = point.x - (start.x + projection * dx);
  const py = point.y - (start.y + projection * dy);
  return px * px + py * py;
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  const cross = (p1: Point, p2: Point, p3: Point) =>
    (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  const onSegment = (p1: Point, p2: Point, point: Point) =>
    point.x >= Math.min(p1.x, p2.x) &&
    point.x <= Math.max(p1.x, p2.x) &&
    point.y >= Math.min(p1.y, p2.y) &&
    point.y <= Math.max(p1.y, p2.y);
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  if (abC === 0 && onSegment(a, b, c)) return true;
  if (abD === 0 && onSegment(a, b, d)) return true;
  if (cdA === 0 && onSegment(c, d, a)) return true;
  if (cdB === 0 && onSegment(c, d, b)) return true;
  return abC * abD < 0 && cdA * cdB < 0;
}

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const current = polygon[i];
    const previous = polygon[j];
    const crosses =
      (current.y > point.y) !== (previous.y > point.y) &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

function pathsWithinDistance(
  first: Point[],
  second: Point[],
  distance: number
) {
  if (first.length === 0 || second.length === 0) return false;
  const distanceSquared = distance * distance;
  const bounds = (points: Point[]) => points.reduce(
    (result, point) => ({
      minX: Math.min(result.minX, point.x),
      minY: Math.min(result.minY, point.y),
      maxX: Math.max(result.maxX, point.x),
      maxY: Math.max(result.maxY, point.y),
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  );
  const firstBounds = bounds(first);
  const secondBounds = bounds(second);
  if (
    firstBounds.maxX + distance < secondBounds.minX ||
    secondBounds.maxX + distance < firstBounds.minX ||
    firstBounds.maxY + distance < secondBounds.minY ||
    secondBounds.maxY + distance < firstBounds.minY
  ) {
    return false;
  }

  const firstSegments = first.length === 1
    ? [[first[0], first[0]] as const]
    : first.slice(1).map((point, index) => [first[index], point] as const);
  const secondSegments = second.length === 1
    ? [[second[0], second[0]] as const]
    : second.slice(1).map((point, index) => [second[index], point] as const);

  for (const [a, b] of firstSegments) {
    for (const [c, d] of secondSegments) {
      if (
        Math.max(a.x, b.x) + distance < Math.min(c.x, d.x) ||
        Math.max(c.x, d.x) + distance < Math.min(a.x, b.x) ||
        Math.max(a.y, b.y) + distance < Math.min(c.y, d.y) ||
        Math.max(c.y, d.y) + distance < Math.min(a.y, b.y)
      ) {
        continue;
      }
      if (segmentsIntersect(a, b, c, d)) return true;
      if (
        pointSegmentDistanceSquared(a, c, d) <= distanceSquared ||
        pointSegmentDistanceSquared(b, c, d) <= distanceSquared ||
        pointSegmentDistanceSquared(c, a, b) <= distanceSquared ||
        pointSegmentDistanceSquared(d, a, b) <= distanceSquared
      ) {
        return true;
      }
    }
  }
  return false;
}

export function eraseIntersectingVectorActions(
  actions: VectorAction[],
  eraser: VectorStroke,
  pageWidth: number,
  pdfPageWidthAtScale1: number
): VectorAction[] {
  if (eraser.tool !== 'eraser' || eraser.points.length === 0) return actions;

  const coordinateScale =
    pdfPageWidthAtScale1 > 0 ? pageWidth / pdfPageWidthAtScale1 : 1;
  const eraserRadius = (eraser.size * coordinateScale) / 2;
  return actions.filter((action) => {
    if (action.type === 'freehand' && action.tool === 'eraser') return true;

    if (action.type === 'text') {
      const textPath = actionPath(action, coordinateScale);
      if (eraser.points.some((point) => pointInPolygon(point, textPath))) {
        return false;
      }
      return !pathsWithinDistance(
        eraser.points,
        textPath,
        eraserRadius
      );
    }

    const actionRadius = (action.size * coordinateScale) / 2;
    return !pathsWithinDistance(
      eraser.points,
      actionPath(action, coordinateScale),
      eraserRadius + actionRadius
    );
  });
}

export type StoredVectorPage = {
  width: number;
  height: number;
  actions: VectorAction[];
  pdfPageWidthAtScale1?: number;
  rasterFallback?: string;
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

/** Capture legacy canvas-only annotations as a raster fallback. */
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
  stored: StoredVectorPage,
  pdfPageWidthAtScale1?: number
): Promise<void> {
  return new Promise((resolve) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageWidthScale1 =
      pdfPageWidthAtScale1 && pdfPageWidthAtScale1 > 0
        ? pdfPageWidthAtScale1
        : stored.pdfPageWidthAtScale1 && stored.pdfPageWidthAtScale1 > 0
          ? stored.pdfPageWidthAtScale1
          : stored.width > 0
            ? stored.width
            : canvas.width;

    const storedWidth = stored.width > 0 ? stored.width : canvas.width;
    const storedHeight = stored.height > 0 ? stored.height : canvas.height;

    const applyVectors = () => {
      for (const action of stored.actions) {
        if (action.type === 'freehand') {
          applyStroke(
            ctx,
            action,
            canvas.width,
            canvas.height,
            storedWidth,
            storedHeight,
            pageWidthScale1
          );
        } else if (action.type === 'text') {
          applyText(
            ctx,
            action,
            canvas.width,
            canvas.height,
            storedWidth,
            storedHeight,
            pageWidthScale1
          );
        } else {
          applyShape(
            ctx,
            action,
            canvas.width,
            canvas.height,
            storedWidth,
            storedHeight,
            pageWidthScale1
          );
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    };

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
        applyVectors();
        done();
      };
      img.onerror = () => {
        applyVectors();
        done();
      };
      img.src = stored.rasterFallback;
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        applyVectors();
        done();
      }
    } else {
      applyVectors();
      resolve();
    }
  });
}

export function redrawAfterVectorErase(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  previousActions: VectorAction[],
  remainingActions: VectorAction[],
  storedWidth: number,
  storedHeight: number,
  pdfPageWidthAtScale1: number
) {
  const remainingSet = new Set(remainingActions);
  const erasedActions = previousActions.filter((action) => !remainingSet.has(action));
  if (erasedActions.length === 0) return;

  const coordinateScale =
    pdfPageWidthAtScale1 > 0 ? storedWidth / pdfPageWidthAtScale1 : 1;
  const erasedBounds = erasedActions.reduce((bounds, action) => {
    const pathBounds = getPathBounds(actionPath(action, coordinateScale));
    const radius = action.type === 'text'
      ? 1
      : (action.size * coordinateScale) / 2 + 1;
    return {
      minX: Math.min(bounds.minX, pathBounds.minX - radius),
      minY: Math.min(bounds.minY, pathBounds.minY - radius),
      maxX: Math.max(bounds.maxX, pathBounds.maxX + radius),
      maxY: Math.max(bounds.maxY, pathBounds.maxY + radius),
    };
  }, {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  });

  const scaleX = storedWidth > 0 ? canvas.width / storedWidth : 1;
  const scaleY = storedHeight > 0 ? canvas.height / storedHeight : 1;
  const left = Math.max(0, erasedBounds.minX * scaleX);
  const top = Math.max(0, erasedBounds.minY * scaleY);
  const right = Math.min(canvas.width, erasedBounds.maxX * scaleX);
  const bottom = Math.min(canvas.height, erasedBounds.maxY * scaleY);
  if (right <= left || bottom <= top) return;

  const clipBounds = {
    minX: left / scaleX,
    minY: top / scaleY,
    maxX: right / scaleX,
    maxY: bottom / scaleY,
  };
  ctx.clearRect(left, top, right - left, bottom - top);
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, top, right - left, bottom - top);
  ctx.clip();

  for (const action of remainingActions) {
    const pathBounds = getPathBounds(actionPath(action, coordinateScale));
    const radius = action.type === 'text'
      ? 1
      : (action.size * coordinateScale) / 2 + 1;
    if (
      pathBounds.maxX + radius < clipBounds.minX ||
      pathBounds.minX - radius > clipBounds.maxX ||
      pathBounds.maxY + radius < clipBounds.minY ||
      pathBounds.minY - radius > clipBounds.maxY
    ) {
      continue;
    }

    if (action.type === 'freehand') {
      applyStroke(
        ctx,
        action,
        canvas.width,
        canvas.height,
        storedWidth,
        storedHeight,
        pdfPageWidthAtScale1
      );
    } else if (action.type === 'text') {
      applyText(
        ctx,
        action,
        canvas.width,
        canvas.height,
        storedWidth,
        storedHeight,
        pdfPageWidthAtScale1
      );
    } else {
      applyShape(
        ctx,
        action,
        canvas.width,
        canvas.height,
        storedWidth,
        storedHeight,
        pdfPageWidthAtScale1
      );
    }
  }
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

export function drawVectorText(
  ctx: CanvasRenderingContext2D,
  annotation: VectorText,
  position: Point,
  canvasWidth: number,
  pageWidthScale1: number
) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = annotation.color;
  const fontSize = pdfStrokeWidthInCanvasPixels(
    annotation.size,
    canvasWidth,
    pageWidthScale1
  );
  const maxWidth = annotation.width
    ? pdfStrokeWidthInCanvasPixels(
        annotation.width,
        canvasWidth,
        pageWidthScale1
      )
    : Infinity;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';
  const lineHeight = fontSize * 1.25;
  const lines = wrapCanvasText(ctx, annotation.text, maxWidth);
  lines.forEach((line, index) =>
    ctx.fillText(line, position.x, position.y + index * lineHeight)
  );
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    const tokens = paragraph.match(/ +|[^ ]+/g) ?? [];
    for (const token of tokens) {
      if (
        line &&
        Number.isFinite(maxWidth) &&
        ctx.measureText(line + token).width > maxWidth
      ) {
        lines.push(line);
        line = '';
      }

      let remaining = token;
      while (
        Number.isFinite(maxWidth) &&
        remaining &&
        ctx.measureText(remaining).width > maxWidth
      ) {
        let splitAt = 1;
        while (
          splitAt < remaining.length &&
          ctx.measureText(remaining.slice(0, splitAt + 1)).width <= maxWidth
        ) {
          splitAt += 1;
        }
        const segment = remaining.slice(0, splitAt);
        const candidate = line + segment;
        if (line && ctx.measureText(candidate).width > maxWidth) {
          lines.push(line);
          line = segment;
        } else {
          line = candidate;
        }
        lines.push(line);
        line = '';
        remaining = remaining.slice(splitAt);
      }

      if (!remaining) continue;
      const candidate = line + remaining;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = remaining;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function isPointOnVectorText(
  ctx: CanvasRenderingContext2D,
  annotation: VectorText,
  position: Point,
  point: Point,
  canvasWidth: number,
  pageWidthScale1: number
) {
  const fontSize = pdfStrokeWidthInCanvasPixels(
    annotation.size,
    canvasWidth,
    pageWidthScale1
  );
  const maxWidth = annotation.width
    ? pdfStrokeWidthInCanvasPixels(
        annotation.width,
        canvasWidth,
        pageWidthScale1
      )
    : Infinity;
  ctx.save();
  ctx.font = `${fontSize}px sans-serif`;
  const lines = wrapCanvasText(ctx, annotation.text, maxWidth);
  const lineHeight = fontSize * 1.25;
  let hit = false;
  lines.forEach((line, lineIndex) => {
    if (hit) return;
    const lineTop = position.y + lineIndex * lineHeight;
    let prefix = '';
    for (const character of line) {
      const startX = position.x + ctx.measureText(prefix).width;
      const endX = startX + ctx.measureText(character).width;
      if (
        !/\s/.test(character) &&
        point.x >= startX - 1 &&
        point.x <= endX + 1 &&
        point.y >= lineTop &&
        point.y <= lineTop + fontSize
      ) {
        hit = true;
        return;
      }
      prefix += character;
    }
  });
  ctx.restore();
  return hit;
}

export function getVectorTextBounds(
  ctx: CanvasRenderingContext2D,
  annotation: VectorText,
  position: Point,
  canvasWidth: number,
  pageWidthScale1: number
) {
  const fontSize = pdfStrokeWidthInCanvasPixels(
    annotation.size,
    canvasWidth,
    pageWidthScale1
  );
  const maxWidth = annotation.width
    ? pdfStrokeWidthInCanvasPixels(
        annotation.width,
        canvasWidth,
        pageWidthScale1
      )
    : Infinity;
  ctx.save();
  ctx.font = `${fontSize}px sans-serif`;
  const lineHeight = fontSize * 1.25;
  const lines = wrapCanvasText(ctx, annotation.text, maxWidth);
  const widestLine = lines.reduce(
    (width, line) => Math.max(width, ctx.measureText(line).width),
    0
  );
  ctx.restore();
  return {
    left: position.x,
    top: position.y,
    width: Number.isFinite(maxWidth) ? maxWidth : widestLine,
    height: Math.max(1, lines.length) * lineHeight,
  };
}

function applyText(
  ctx: CanvasRenderingContext2D,
  annotation: VectorText,
  canvasWidth: number,
  canvasHeight: number,
  storedWidth: number,
  storedHeight: number,
  pageWidthScale1: number
) {
  const sx = storedWidth > 0 ? canvasWidth / storedWidth : 1;
  const sy = storedHeight > 0 ? canvasHeight / storedHeight : 1;
  drawVectorText(
    ctx,
    annotation,
    { x: annotation.position.x * sx, y: annotation.position.y * sy },
    canvasWidth,
    pageWidthScale1
  );
}

function applyStroke(
  ctx: CanvasRenderingContext2D,
  stroke: VectorStroke,
  canvasWidth: number,
  canvasHeight: number,
  storedWidth: number,
  storedHeight: number,
  pageWidthScale1: number
) {
  if (stroke.points.length === 0) return;

  const sx = storedWidth > 0 ? canvasWidth / storedWidth : 1;
  const sy = storedHeight > 0 ? canvasHeight / storedHeight : 1;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'pen') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = pdfStrokeWidthInCanvasPixels(
      stroke.size,
      canvasWidth,
      pageWidthScale1
    );
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = pdfStrokeWidthInCanvasPixels(
      stroke.size,
      canvasWidth,
      pageWidthScale1
    );
  }

  const points = stroke.points.map((point) => ({
    x: point.x * sx,
    y: point.y * sy,
  }));

  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(
      points[0].x,
      points[0].y,
      ctx.lineWidth / 2,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = stroke.tool === 'pen' ? stroke.color : '#000';
    ctx.fill();
  } else {
    ctx.beginPath();
    if (points.length === 2) {
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      ctx.moveTo(
        (points[0].x + points[1].x) / 2,
        (points[0].y + points[1].y) / 2
      );
      for (let i = 2; i < points.length; i++) {
        const previous = points[i - 1];
        const current = points[i];
        ctx.quadraticCurveTo(
          previous.x,
          previous.y,
          (previous.x + current.x) / 2,
          (previous.y + current.y) / 2
        );
      }
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function applyShape(
  ctx: CanvasRenderingContext2D,
  shape: VectorShape,
  canvasWidth: number,
  canvasHeight: number,
  storedWidth: number,
  storedHeight: number,
  pageWidthScale1: number
) {
  const sx = storedWidth > 0 ? canvasWidth / storedWidth : 1;
  const sy = storedHeight > 0 ? canvasHeight / storedHeight : 1;

  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = pdfStrokeWidthInCanvasPixels(
    shape.size,
    canvasWidth,
    pageWidthScale1
  );
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const start = { x: shape.start.x * sx, y: shape.start.y * sy };
  const end = { x: shape.end.x * sx, y: shape.end.y * sy };
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
