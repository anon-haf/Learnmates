import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Page } from 'react-pdf';
import {
  applyStoredAnnotation,
  canvasHasContent,
  StoredAnnotationPage,
} from '../utils/pdfVectorAnnotationStorage';
import './PdfViewerTextLayer.css';

declare global {
  interface Window {
    __PDF_DOC__: any;
  }
}

const A4_ASPECT = 297 / 210;

export type DrawTool = 'pen' | 'eraser' | 'line' | 'rectangle' | 'ellipse';

interface PdfDrawablePageProps {
  mode?: 'inline' | 'modal';
  pageNumber: number;
  pageWidth: number;
  zoom: number; // Kept for interface compatibility, but we use --pdf-zoom via CSS
  renderScale?: number;
  drawingEnabled?: boolean;
  drawTool?: DrawTool;
  penColor?: string;
  penSize?: number;
  eraserSize?: number;
  onCanvasMount?: (pageNumber: number, canvas: HTMLCanvasElement | null) => void;
  onActionComplete?: (pageNumber: number, beforeSnapshot: ImageData) => void;
  onDrawingActiveChange?: (pageNumber: number, active: boolean) => void;
  allowTouchNavigation?: boolean;
  restoredAnnotation?: StoredAnnotationPage | null;
  getRestoredAnnotation?: () => StoredAnnotationPage | null;
  onPageAspectMeasured?: (pageNumber: number, aspect: number) => void;
}

function shouldAnnotateWithPointer(
  event: PointerEvent,
  allowTouchNavigation: boolean
) {
  if (!allowTouchNavigation) return true;
  return event.pointerType === 'pen' || event.pointerType === 'mouse';
}

type Point = { x: number; y: number };

type CanvasMetrics = {
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
};

function getCanvasCoordsFromClient(
  clientX: number,
  clientY: number,
  metrics: CanvasMetrics
): Point {
  return {
    x: (clientX - metrics.left) * metrics.scaleX,
    y: (clientY - metrics.top) * metrics.scaleY,
  };
}

function applyFreehandStyle(
  ctx: CanvasRenderingContext2D,
  tool: 'pen' | 'eraser',
  color: string,
  penSize: number,
  eraserSize: number
) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (tool === 'pen') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = penSize;
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = eraserSize;
  }
}

function appendSmoothSegments(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  fromPointCount: number
) {
  if (points.length < 3) return fromPointCount;

  let startIndex = Math.max(2, fromPointCount);
  if (fromPointCount < 2) {
    startIndex = 2;
  }

  ctx.beginPath();
  let drew = false;

  for (let i = startIndex; i < points.length; i++) {
    const p0 = points[i - 2];
    const p1 = points[i - 1];
    const p2 = points[i];
    const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    if (!drew) {
      ctx.moveTo(mid1.x, mid1.y);
      drew = true;
    }
    ctx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y);
  }

  if (drew) {
    ctx.stroke();
  }

  return points.length;
}

function drawSmoothCap(ctx: CanvasRenderingContext2D, p0: Point, p1: Point) {
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
}

function drawDot(ctx: CanvasRenderingContext2D, point: Point, size: number, color: string) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.arc(point.x, point.y, size / 2, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function isShapeTool(tool: DrawTool) {
  return tool === 'line' || tool === 'rectangle' || tool === 'ellipse';
}

function isFreehandTool(tool: DrawTool): tool is 'pen' | 'eraser' {
  return tool === 'pen' || tool === 'eraser';
}

function captureSnapshot(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  tool: DrawTool,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  size: number
) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (tool === 'line') {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    return;
  }

  if (tool === 'rectangle') {
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    return;
  }

  const centerX = (x0 + x1) / 2;
  const centerY = (y0 + y1) / 2;
  const radiusX = Math.abs(x1 - x0) / 2;
  const radiusY = Math.abs(y1 - y0) / 2;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
  ctx.stroke();
}

function readCanvasMetrics(canvas: HTMLCanvasElement): CanvasMetrics {
  const rect = canvas.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    scaleX: canvas.width / rect.width,
    scaleY: canvas.height / rect.height,
  };
}

/** PDF page with a drawing canvas overlay for freehand pen annotations. */
const PdfDrawablePageInner: React.FC<PdfDrawablePageProps> = ({
  mode = 'modal',
  pageNumber,
  pageWidth,
  renderScale,
  drawingEnabled = false,
  drawTool = 'pen',
  penColor = '#000000',
  penSize = 3,
  eraserSize = 20,
  onCanvasMount,
  onActionComplete,
  onDrawingActiveChange,
  allowTouchNavigation = false,
  restoredAnnotation = null,
  getRestoredAnnotation,
  onPageAspectMeasured,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const isDrawing = useRef(false);
  const didModify = useRef(false);
  const lastPoint = useRef<Point | null>(null);
  const strokePoints = useRef<Point[]>([]);
  const renderedPointCount = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const shapeStart = useRef<Point | null>(null);
  const beforeAction = useRef<ImageData | null>(null);
  const canvasMetrics = useRef<CanvasMetrics | null>(null);
  const pendingFrame = useRef<number | null>(null);
  const shapePreviewFrame = useRef<number | null>(null);
  const pendingShapePoint = useRef<Point | null>(null);

  const drawToolRef = useRef(drawTool);
  const penColorRef = useRef(penColor);
  const penSizeRef = useRef(penSize);
  const eraserSizeRef = useRef(eraserSize);
  const onActionCompleteRef = useRef(onActionComplete);
  const onDrawingActiveChangeRef = useRef(onDrawingActiveChange);
  const allowTouchNavigationRef = useRef(allowTouchNavigation);
  const restoredAnnotationRef = useRef(restoredAnnotation);
  const getRestoredAnnotationRef = useRef(getRestoredAnnotation);
  const appliedRestoreKeyRef = useRef<string | null>(null);

  const [rendered, setRendered] = useState(false);
  const [pageHeight, setPageHeight] = useState(() => pageWidth * A4_ASPECT);
  const [pageImgSrc, setPageImgSrc] = useState<string | null>(null);
  const lastViewportKeyRef = useRef<string>('');

  useEffect(() => {
    drawToolRef.current = drawTool;
    penColorRef.current = penColor;
    penSizeRef.current = penSize;
    eraserSizeRef.current = eraserSize;
    onActionCompleteRef.current = onActionComplete;
    onDrawingActiveChangeRef.current = onDrawingActiveChange;
    allowTouchNavigationRef.current = allowTouchNavigation;
  }, [
    drawTool,
    penColor,
    penSize,
    eraserSize,
    onActionComplete,
    onDrawingActiveChange,
    allowTouchNavigation,
  ]);

  useEffect(() => {
    restoredAnnotationRef.current = restoredAnnotation;
    getRestoredAnnotationRef.current = getRestoredAnnotation;
    appliedRestoreKeyRef.current = null;
  }, [getRestoredAnnotation, restoredAnnotation]);

  useEffect(() => {
    setRendered(false);
    setPageHeight(pageWidth * A4_ASPECT);
    drawCtxRef.current = null;
    appliedRestoreKeyRef.current = null;
  }, [pageNumber, pageWidth]);

  const getDrawContext = useCallback((canvas: HTMLCanvasElement) => {
    if (!drawCtxRef.current) {
      drawCtxRef.current = canvas.getContext('2d');
    }
    return drawCtxRef.current;
  }, []);

  const syncOverlayToPdfCanvas = useCallback(() => {
    const container = containerRef.current;
    const overlay = drawCanvasRef.current;
    if (!container || !overlay) return;

    const pdfCanvas = container.querySelector(
      'canvas.react-pdf__Page__canvas'
    ) as HTMLCanvasElement | null;
    const pageEl = container.querySelector('.react-pdf__Page') as HTMLElement | null;
    if (!pdfCanvas || !pageEl) return;

    const fixedDpr = window.devicePixelRatio || 1;
    const logicalWidth = pdfCanvas.clientWidth || pageWidth;
    const aspect = (pdfCanvas.width && pdfCanvas.height) ? (pdfCanvas.height / pdfCanvas.width) : A4_ASPECT;
    const unscaledPageHeight = pageWidth * aspect;
    onPageAspectMeasured?.(pageNumber, aspect);

    const nextWidth = Math.round(logicalWidth * fixedDpr);
    const nextHeight = Math.round(unscaledPageHeight * fixedDpr);

    if (overlay.width !== nextWidth || overlay.height !== nextHeight) {
      overlay.width = nextWidth;
      overlay.height = nextHeight;
      drawCtxRef.current = null;
    }
    overlay.style.top = `${pageEl.offsetTop}px`;
    overlay.style.left = `${pageEl.offsetLeft}px`;
    overlay.style.width = `${pdfCanvas.clientWidth || logicalWidth}px`;
    overlay.style.height = `${pdfCanvas.clientHeight || (pageWidth * aspect)}px`;
    setPageHeight(unscaledPageHeight);
  }, [pageWidth]);

  const applyRestoredAnnotationToOverlay = useCallback(async () => {
    const stored =
      getRestoredAnnotationRef.current?.() ?? restoredAnnotationRef.current;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    
    const ctx = getDrawContext(canvas);
    if (!ctx) return;

    if (!stored) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      appliedRestoreKeyRef.current = null;
      return;
    }

    const restoreKey = `${stored.width}x${stored.height}:${stored.actions.length}:${stored.rasterFallback?.length ?? 0}`;
    if (appliedRestoreKeyRef.current === restoreKey) return;

    try {
      await applyStoredAnnotation(ctx, canvas, stored);
      appliedRestoreKeyRef.current = restoreKey;
    } catch {
      appliedRestoreKeyRef.current = null;
    }
  }, [getDrawContext]);

  const handleRenderSuccess = () => {
    setRendered(true);
    requestAnimationFrame(() => {
      syncOverlayToPdfCanvas();
      void applyRestoredAnnotationToOverlay();

      if (mode === 'inline') {
        const container = containerRef.current;
        if (container) {
          const pdfCanvas = container.querySelector(
            'canvas.react-pdf__Page__canvas'
          ) as HTMLCanvasElement | null;
          if (pdfCanvas && pdfCanvas.width > 0 && pdfCanvas.height > 0) {
            try {
              const dataUrl = pdfCanvas.toDataURL('image/png');
              setPageImgSrc(dataUrl);
            } catch (e) {
              console.warn('Failed to convert PDF canvas to image data URL:', e);
            }
          }
        }
      }
    });
  };

  useEffect(() => {
    if (!rendered) return;
    syncOverlayToPdfCanvas();
    void applyRestoredAnnotationToOverlay();
  }, [rendered, restoredAnnotation, syncOverlayToPdfCanvas, applyRestoredAnnotationToOverlay]);

  useEffect(() => {
    const canvas = drawCanvasRef.current;
    onCanvasMount?.(pageNumber, canvas);
    return () => onCanvasMount?.(pageNumber, null);
  }, [pageNumber, rendered, onCanvasMount]);

  const commitAction = useCallback(() => {
    if (!didModify.current || !beforeAction.current) return;
    onActionCompleteRef.current?.(pageNumber, beforeAction.current);
    beforeAction.current = null;
    didModify.current = false;
  }, [pageNumber]);

  const cancelPendingFrame = useCallback(() => {
    if (pendingFrame.current !== null) {
      cancelAnimationFrame(pendingFrame.current);
      pendingFrame.current = null;
    }
  }, []);

  const flushFreehandPoints = useCallback(() => {
    pendingFrame.current = null;

    const canvas = drawCanvasRef.current;
    const ctx = canvas ? getDrawContext(canvas) : null;
    const tool = drawToolRef.current;
    if (!canvas || !ctx || !isDrawing.current || !isFreehandTool(tool)) return;

    const points = strokePoints.current;
    if (points.length < 3) return;

    applyFreehandStyle(ctx, tool, penColorRef.current, penSizeRef.current, eraserSizeRef.current);
    renderedPointCount.current = appendSmoothSegments(ctx, points, renderedPointCount.current);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
    }

    didModify.current = true;
  }, [getDrawContext]);

  const scheduleFreehandFlush = useCallback(() => {
    if (pendingFrame.current !== null) return;
    pendingFrame.current = requestAnimationFrame(flushFreehandPoints);
  }, [flushFreehandPoints]);

  const renderShapePreview = useCallback((point: Point) => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas ? getDrawContext(canvas) : null;
    const tool = drawToolRef.current;
    if (!canvas || !ctx || !shapeStart.current || !beforeAction.current || !isShapeTool(tool)) return;

    ctx.putImageData(beforeAction.current, 0, 0);
    drawShape(
      ctx,
      tool,
      shapeStart.current.x,
      shapeStart.current.y,
      point.x,
      point.y,
      penColorRef.current,
      penSizeRef.current
    );
    lastPoint.current = point;
    didModify.current = true;
  }, [getDrawContext]);

  const scheduleShapePreview = useCallback((point: Point) => {
    pendingShapePoint.current = point;
    if (shapePreviewFrame.current !== null) return;

    shapePreviewFrame.current = requestAnimationFrame(() => {
      shapePreviewFrame.current = null;
      const previewPoint = pendingShapePoint.current;
      if (previewPoint) {
        renderShapePreview(previewPoint);
      }
    });
  }, [renderShapePreview]);

  const finishFreehandStroke = useCallback((ctx: CanvasRenderingContext2D) => {
    const points = strokePoints.current;
    if (points.length === 0) return;

    const tool = drawToolRef.current;
    if (!isFreehandTool(tool)) return;

    applyFreehandStyle(ctx, tool, penColorRef.current, penSizeRef.current, eraserSizeRef.current);

    if (points.length === 1) {
      if (tool === 'pen') {
        drawDot(ctx, points[0], penSizeRef.current, penColorRef.current);
      }
      didModify.current = true;
      return;
    }

    if (points.length === 2) {
      drawSmoothCap(ctx, points[0], points[1]);
      didModify.current = true;
      return;
    }

    flushFreehandPoints();

    const pPrev = points[points.length - 2];
    const pLast = points[points.length - 1];
    applyFreehandStyle(ctx, tool, penColorRef.current, penSizeRef.current, eraserSizeRef.current);
    drawSmoothCap(
      ctx,
      { x: (pPrev.x + pLast.x) / 2, y: (pPrev.y + pLast.y) / 2 },
      pLast
    );

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
    }

    didModify.current = true;
  }, [flushFreehandPoints]);

  const finishDrawing = useCallback(() => {
    if (!isDrawing.current) return;

    cancelPendingFrame();

    if (shapePreviewFrame.current !== null) {
      cancelAnimationFrame(shapePreviewFrame.current);
      shapePreviewFrame.current = null;
    }
    if (pendingShapePoint.current) {
      renderShapePreview(pendingShapePoint.current);
      pendingShapePoint.current = null;
    }

    const canvas = drawCanvasRef.current;
    const ctx = canvas ? getDrawContext(canvas) : null;
    const tool = drawToolRef.current;

    if (canvas && ctx && isShapeTool(tool) && shapeStart.current && lastPoint.current) {
      if (beforeAction.current) {
        ctx.putImageData(beforeAction.current, 0, 0);
      }
      drawShape(
        ctx,
        tool,
        shapeStart.current.x,
        shapeStart.current.y,
        lastPoint.current.x,
        lastPoint.current.y,
        penColorRef.current,
        penSizeRef.current
      );
      didModify.current = true;
    } else if (canvas && ctx && (tool === 'pen' || tool === 'eraser')) {
      finishFreehandStroke(ctx);
    }

    const pointerCanvas = drawCanvasRef.current;
    if (pointerCanvas && activePointerId.current !== null) {
      try {
        pointerCanvas.releasePointerCapture(activePointerId.current);
      } catch {
        // Pointer may already be released.
      }
    }

    isDrawing.current = false;
    activePointerId.current = null;
    lastPoint.current = null;
    strokePoints.current = [];
    renderedPointCount.current = 0;
    shapeStart.current = null;
    canvasMetrics.current = null;
    onDrawingActiveChangeRef.current?.(pageNumber, false);
    commitAction();
  }, [cancelPendingFrame, commitAction, finishFreehandStroke, getDrawContext, pageNumber, renderShapePreview]);

  const addFreehandPoint = useCallback((point: Point) => {
    const points = strokePoints.current;
    const last = points[points.length - 1];
    if (last && last.x === point.x && last.y === point.y) return;

    points.push(point);
    lastPoint.current = point;

    if (points.length >= 3) {
      scheduleFreehandFlush();
    } else {
      didModify.current = points.length > 0;
    }
  }, [scheduleFreehandFlush]);

  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !rendered || !drawingEnabled) return;

    const startStrokeAtPoint = (clientX: number, clientY: number) => {
      canvasMetrics.current = readCanvasMetrics(canvas);

      isDrawing.current = true;
      didModify.current = false;
      renderedPointCount.current = 0;
      onDrawingActiveChangeRef.current?.(pageNumber, true);

      const ctx = getDrawContext(canvas);
      if (ctx) {
        beforeAction.current = captureSnapshot(ctx, canvas);
      } else {
        beforeAction.current = null;
      }

      const point = getCanvasCoordsFromClient(clientX, clientY, canvasMetrics.current);
      lastPoint.current = point;
      strokePoints.current = [point];

      const tool = drawToolRef.current;
      if (isShapeTool(tool)) {
        shapeStart.current = point;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== undefined && e.button !== 0 && e.button !== -1) return;
      if (!shouldAnnotateWithPointer(e, allowTouchNavigationRef.current)) return;

      e.preventDefault();
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback if setPointerCapture fails on certain browsers
      }
      activePointerId.current = e.pointerId;
      startStrokeAtPoint(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawing.current) return;
      if (activePointerId.current !== null && activePointerId.current !== e.pointerId) return;

      const metrics = canvasMetrics.current ?? readCanvasMetrics(canvas);
      canvasMetrics.current = metrics;

      const tool = drawToolRef.current;
      if (isShapeTool(tool)) {
        scheduleShapePreview(getCanvasCoordsFromClient(e.clientX, e.clientY, metrics));
        return;
      }

      if (tool !== 'pen' && tool !== 'eraser') return;

      let events = [e];
      if (typeof e.getCoalescedEvents === 'function') {
        try {
          const coalesced = e.getCoalescedEvents();
          if (coalesced && coalesced.length > 0) {
            events = coalesced;
          }
        } catch {
          events = [e];
        }
      }

      for (const event of events) {
        addFreehandPoint(getCanvasCoordsFromClient(event.clientX, event.clientY, metrics));
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (activePointerId.current !== null && activePointerId.current !== e.pointerId) return;
      finishDrawing();
    };

    // Standard Mouse event fallbacks for browsers with partial pointer event implementations
    const handleMouseDown = (e: MouseEvent) => {
      if (isDrawing.current) return;
      if (e.button !== 0) return;

      e.preventDefault();
      startStrokeAtPoint(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing.current) return;

      const metrics = canvasMetrics.current ?? readCanvasMetrics(canvas);
      canvasMetrics.current = metrics;

      const tool = drawToolRef.current;
      if (isShapeTool(tool)) {
        scheduleShapePreview(getCanvasCoordsFromClient(e.clientX, e.clientY, metrics));
        return;
      }

      if (tool !== 'pen' && tool !== 'eraser') return;

      addFreehandPoint(getCanvasCoordsFromClient(e.clientX, e.clientY, metrics));
    };

    const handleMouseUp = () => {
      if (isDrawing.current) {
        finishDrawing();
      }
    };

    if (window.PointerEvent) {
      canvas.addEventListener('pointerdown', handlePointerDown);
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerup', handlePointerUp);
      canvas.addEventListener('pointercancel', handlePointerUp);
    } else {
      canvas.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (window.PointerEvent) {
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
        canvas.removeEventListener('pointercancel', handlePointerUp);
      } else {
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
      cancelPendingFrame();
      if (shapePreviewFrame.current !== null) {
        cancelAnimationFrame(shapePreviewFrame.current);
        shapePreviewFrame.current = null;
      }
    };
  }, [
    addFreehandPoint,
    cancelPendingFrame,
    drawingEnabled,
    finishDrawing,
    getDrawContext,
    scheduleShapePreview,
    rendered,
  ]);

  useEffect(() => {
    if (!drawingEnabled) {
      cancelPendingFrame();
      if (shapePreviewFrame.current !== null) {
        cancelAnimationFrame(shapePreviewFrame.current);
        shapePreviewFrame.current = null;
      }
      pendingShapePoint.current = null;
      if (isDrawing.current) {
        onDrawingActiveChangeRef.current?.(pageNumber, false);
      }
      isDrawing.current = false;
      lastPoint.current = null;
      strokePoints.current = [];
      renderedPointCount.current = 0;
      activePointerId.current = null;
      shapeStart.current = null;
      beforeAction.current = null;
      canvasMetrics.current = null;
      didModify.current = false;
    }
  }, [cancelPendingFrame, drawingEnabled, pageNumber]);

  const cursorClass = !drawingEnabled
    ? 'pointer-events-none'
    : drawTool === 'eraser'
      ? 'cursor-cell'
      : 'cursor-crosshair';

  return (
    <div
      className="relative mx-auto scroll-mt-4"
      style={{
        width: `calc(${pageWidth}px * var(--pdf-zoom, 1))`,
        height: `calc(${pageHeight}px * var(--pdf-zoom, 1))`,
      }}
    >
      <div
        ref={containerRef}
        className={`pdf-viewer-page relative origin-top-left rounded shadow-2xl ${
          rendered ? 'bg-white' : 'bg-gray-200 dark:bg-gray-800'
        }`}
        style={{
          transform: `scale(var(--pdf-zoom, 1))`,
          width: pageWidth,
        }}
      >
        {!rendered && (
          <div className="absolute inset-0 z-10 flex items-stretch pointer-events-none">
            <div
              className="w-full aspect-[210/297] pdf-skeleton-loader"
              aria-hidden="true"
            />
          </div>
        )}
        {(() => {
          const baseDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
          const effectiveDpr = Math.min(3, baseDpr * Math.max(1.8, (renderScale || 1) * 1.25));
          return (
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              devicePixelRatio={effectiveDpr}
              renderMode="canvas"
              renderTextLayer={mode !== 'inline' && !drawingEnabled}
              renderAnnotationLayer={false}
              loading={
                <div className="w-full aspect-[210/297] pdf-skeleton-loader" aria-hidden="true" />
              }
              onRenderSuccess={handleRenderSuccess}
              onRenderError={handleRenderSuccess}
            />
          );
        })()}

        {mode === 'inline' && pageImgSrc && (
          <img
            src={pageImgSrc}
            alt={`Page ${pageNumber}`}
            className="absolute inset-0 w-full h-full object-contain pointer-events-auto select-none z-10"
            draggable={false}
          />
        )}

        {rendered && (
          <canvas
            ref={drawCanvasRef}
            className={`absolute z-20 ${cursorClass}`}
            style={{
              touchAction: !drawingEnabled
                ? 'auto'
                : allowTouchNavigation
                  ? 'pan-x pan-y pinch-zoom'
                  : 'none',
            }}
          />
        )}
      </div>
    </div>
  );
};

function pdfDrawablePagePropsAreEqual(
  prev: PdfDrawablePageProps,
  next: PdfDrawablePageProps
) {
  if (prev.mode !== next.mode) return false;
  if (prev.pageNumber !== next.pageNumber) return false;
  if (prev.pageWidth !== next.pageWidth) return false;
  if (prev.drawingEnabled !== next.drawingEnabled) return false;
  if (prev.allowTouchNavigation !== next.allowTouchNavigation) return false;
  if (prev.drawTool !== next.drawTool) return false;
  if (prev.penColor !== next.penColor) return false;
  if (prev.penSize !== next.penSize) return false;
  if (prev.eraserSize !== next.eraserSize) return false;
  if (prev.getRestoredAnnotation !== next.getRestoredAnnotation) return false;
  if (prev.onCanvasMount !== next.onCanvasMount) return false;
  if (prev.onActionComplete !== next.onActionComplete) return false;
  if (prev.onDrawingActiveChange !== next.onDrawingActiveChange) return false;

  const prevRestore = prev.restoredAnnotation;
  const nextRestore = next.restoredAnnotation;
  if (prevRestore === nextRestore) return true;
  if (!prevRestore || !nextRestore) return prevRestore === nextRestore;

  return (
    prevRestore.width === nextRestore.width &&
    prevRestore.height === nextRestore.height &&
    prevRestore.actions.length === nextRestore.actions.length &&
    prevRestore.rasterFallback === nextRestore.rasterFallback
  );
}

export const PdfDrawablePage = memo(PdfDrawablePageInner, pdfDrawablePagePropsAreEqual);
