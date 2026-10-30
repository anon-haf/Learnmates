import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Page } from 'react-pdf';
import {
  applyStoredAnnotation,
  drawVectorText,
  eraseIntersectingVectorActions,
  getVectorTextBounds,
  isPointOnVectorText,
  redrawAfterVectorErase,
  StoredAnnotationPage,
} from '../utils/pdfVectorAnnotationStorage';
import type { VectorAction } from '../utils/pdfVectorAnnotationStorage';
import {
  getPdfOutputDevicePixelRatio,
  pdfStrokeWidthInCanvasPixels,
} from '../utils/pdfAnnotationMetrics';
import {
  getCachedPageRender,
  pdfRenderCacheKey,
  setCachedPageRender,
} from '../utils/pdfPageRenderCache';
import './PdfViewerTextLayer.css';

declare global {
  interface Window {
    __PDF_DOC__: any;
  }
}

const A4_ASPECT = 297 / 210;

export type DrawTool = 'pen' | 'eraser' | 'line' | 'rectangle' | 'ellipse' | 'text';

interface PdfDrawablePageProps {
  mode?: 'inline' | 'modal';
  pageNumber: number;
  pageWidth: number;
  zoom: number; // Kept for interface compatibility; layout zoom uses --pdf-zoom on the scroll container
  /** Percentage (100 = 100%). Drives PDF canvas resolution after zoom settles. */
  renderZoom?: number;
  renderScale?: number;
  pdfCacheKey?: string;
  drawingEnabled?: boolean;
  drawTool?: DrawTool;
  penColor?: string;
  textColor?: string;
  penSize?: number;
  eraserSize?: number;
  annotationTextSize?: number;
  onTextActionSelect?: (pageNumber: number, actionIndex: number | null, action: VectorAction | null, isEditing?: boolean) => void;
  onTextActionUpdate?: (pageNumber: number, actionIndex: number, action: VectorAction, pdfPageWidthAtScale1: number) => void;
  onTextActionDelete?: (pageNumber: number, actionIndex: number, pdfPageWidthAtScale1: number) => void;
  onCanvasMount?: (pageNumber: number, canvas: HTMLCanvasElement | null) => void;
  onActionComplete?: (
    pageNumber: number,
    beforeSnapshot: ImageData | null,
    vectorAction: VectorAction,
    pdfPageWidthAtScale1: number
  ) => void;
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

type TextEditorState = {
  position: Point;
  left: number;
  top: number;
  text: string;
  actionIndex: number | null;
  width: number;
  editable: boolean;
};

type TextDragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startLeft: number;
  startTop: number;
  startPosition: Point;
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
  penSizePdf: number,
  eraserSizePdf: number,
  canvas: HTMLCanvasElement,
  pdfPageWidthAtScale1: number
) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (tool === 'pen') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = pdfStrokeWidthInCanvasPixels(
      penSizePdf,
      canvas.width,
      pdfPageWidthAtScale1
    );
  } else {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = pdfStrokeWidthInCanvasPixels(
      eraserSizePdf,
      canvas.width,
      pdfPageWidthAtScale1
    );
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

function drawDot(
  ctx: CanvasRenderingContext2D,
  point: Point,
  sizePdf: number,
  color: string,
  canvas: HTMLCanvasElement,
  pdfPageWidthAtScale1: number
) {
  const radius = pdfStrokeWidthInCanvasPixels(
    sizePdf,
    canvas.width,
    pdfPageWidthAtScale1
  ) / 2;
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function isShapeTool(
  tool: DrawTool
): tool is 'line' | 'rectangle' | 'ellipse' {
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
  sizePdf: number,
  canvas: HTMLCanvasElement,
  pdfPageWidthAtScale1: number
) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = color;
  ctx.lineWidth = pdfStrokeWidthInCanvasPixels(
    sizePdf,
    canvas.width,
    pdfPageWidthAtScale1
  );
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
  renderZoom = 100,
  renderScale,
  pdfCacheKey,
  drawingEnabled = false,
  drawTool = 'pen',
  penColor = '#000000',
  textColor = '#000000',
  penSize = 2,
  eraserSize = 20,
  annotationTextSize = 12,
  onTextActionSelect,
  onTextActionUpdate,
  onTextActionDelete,
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
  const eraserPreviewFrame = useRef<number | null>(null);
  const shapePreviewFrame = useRef<number | null>(null);
  const pendingShapePoint = useRef<Point | null>(null);

  const drawToolRef = useRef(drawTool);
  const penColorRef = useRef(penColor);
  const textColorRef = useRef(textColor);
  const penSizeRef = useRef(penSize);
  const eraserSizeRef = useRef(eraserSize);
  const annotationTextSizeRef = useRef(annotationTextSize);
  const onTextActionSelectRef = useRef(onTextActionSelect);
  const onTextActionUpdateRef = useRef(onTextActionUpdate);
  const onTextActionDeleteRef = useRef(onTextActionDelete);
  const onActionCompleteRef = useRef(onActionComplete);
  const onDrawingActiveChangeRef = useRef(onDrawingActiveChange);
  const allowTouchNavigationRef = useRef(allowTouchNavigation);
  const restoredAnnotationRef = useRef(restoredAnnotation);
  const getRestoredAnnotationRef = useRef(getRestoredAnnotation);
  const appliedRestoreKeyRef = useRef<string | null>(null);
  const pdfPageWidthScale1Ref = useRef(A4_ASPECT * 210);

  const renderZoomPercent = renderScale != null ? renderScale * 100 : renderZoom;
  const renderZoomFactor = Math.max(0.25, renderZoomPercent / 100);
  const displayWidth = Math.max(1, Math.round(pageWidth * renderZoomFactor));
  const outputDevicePixelRatio = getPdfOutputDevicePixelRatio(displayWidth);
  const pageRenderCacheKey = pdfCacheKey
    ? pdfRenderCacheKey(
        pdfCacheKey,
        pageNumber,
        displayWidth,
        renderZoomPercent,
        outputDevicePixelRatio
      )
    : null;
  const renderIdentity =
    pageRenderCacheKey ??
    `${pageNumber}|${displayWidth}|${renderZoomPercent}|${outputDevicePixelRatio}`;
  const pdfIdentity = pdfCacheKey ?? '';

  const [renderedIdentity, setRenderedIdentity] = useState<string | null>(null);
  const rendered = renderedIdentity === renderIdentity;
  const [renderedPdfIdentity, setRenderedPdfIdentity] = useState<string | null>(null);
  const hasRenderedPdf = renderedPdfIdentity === pdfIdentity;
  const renderIdentityRef = useRef(renderIdentity);
  renderIdentityRef.current = renderIdentity;
  const [pageHeight, setPageHeight] = useState(() => pageWidth * A4_ASPECT);
  const [pagePreview, setPagePreview] = useState<{
    pdfKey: string;
    renderKey: string | null;
    src: string;
  } | null>(() => {
    const cached = pageRenderCacheKey
      ? getCachedPageRender(pageRenderCacheKey)
      : undefined;
    return cached && pdfCacheKey
      ? { pdfKey: pdfCacheKey, renderKey: pageRenderCacheKey, src: cached.dataUrl }
      : null;
  });
  const [textEditor, setTextEditor] = useState<TextEditorState | null>(null);
  const textEditorStateRef = useRef(textEditor);
  textEditorStateRef.current = textEditor;
  const textEditorRef = useRef<HTMLTextAreaElement>(null);
  const textEditorPositionRef = useRef<Point | null>(null);
  const textDragRef = useRef<TextDragState | null>(null);
  const updateTextEditor = useCallback(
    (update: React.SetStateAction<TextEditorState | null>) => {
      const next =
        typeof update === 'function'
          ? update(textEditorStateRef.current)
          : update;
      textEditorStateRef.current = next;
      setTextEditor(next);
    },
    []
  );
  const [invertActive, setInvertActive] = useState(() => {
    try {
      return localStorage.getItem('universal-pdf-invert-colors') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const sync = () => {
      try {
        setInvertActive(localStorage.getItem('universal-pdf-invert-colors') === 'true');
      } catch {}
    };
    window.addEventListener('pdf-invert-colors-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('pdf-invert-colors-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  useEffect(() => {
    drawToolRef.current = drawTool;
    penColorRef.current = penColor;
    textColorRef.current = textColor;
    penSizeRef.current = penSize;
    eraserSizeRef.current = eraserSize;
    annotationTextSizeRef.current = annotationTextSize;
    onTextActionSelectRef.current = onTextActionSelect;
    onTextActionUpdateRef.current = onTextActionUpdate;
    onTextActionDeleteRef.current = onTextActionDelete;
    onActionCompleteRef.current = onActionComplete;
    onDrawingActiveChangeRef.current = onDrawingActiveChange;
    allowTouchNavigationRef.current = allowTouchNavigation;
  }, [
    drawTool,
    penColor,
    textColor,
    penSize,
    eraserSize,
    annotationTextSize,
    onTextActionSelect,
    onTextActionUpdate,
    onTextActionDelete,
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
    setPageHeight(pageWidth * A4_ASPECT);
    drawCtxRef.current = null;
    appliedRestoreKeyRef.current = null;
    const drawCanvas = drawCanvasRef.current;
    if (drawCanvas?.width && drawCanvas.height) {
      const aspect = drawCanvas.height / drawCanvas.width;
      drawCanvas.style.width = `${displayWidth}px`;
      drawCanvas.style.height = `${displayWidth * aspect}px`;
    }
    const cached = pageRenderCacheKey
      ? getCachedPageRender(pageRenderCacheKey)
      : undefined;
    setPagePreview((previous) => {
      if (cached && pdfCacheKey) {
        return {
          pdfKey: pdfCacheKey,
          renderKey: pageRenderCacheKey,
          src: cached.dataUrl,
        };
      }
      return previous?.pdfKey === pdfCacheKey ? previous : null;
    });
  }, [pageNumber, pageWidth, displayWidth, pdfCacheKey, pageRenderCacheKey]);

  const getDrawContext = useCallback((canvas: HTMLCanvasElement) => {
    if (!drawCtxRef.current) {
      drawCtxRef.current = canvas.getContext('2d');
    }
    return drawCtxRef.current;
  }, []);

  const pdfPageWidthAtScale1 = useCallback(
    () => pdfPageWidthScale1Ref.current,
    []
  );

  const syncOverlayToPdfCanvas = useCallback(() => {
    const container = containerRef.current;
    const overlay = drawCanvasRef.current;
    if (!container || !overlay) return;

    const pdfCanvas = container.querySelector(
      'canvas.react-pdf__Page__canvas'
    ) as HTMLCanvasElement | null;
    const pageEl = container.querySelector('.react-pdf__Page') as HTMLElement | null;
    if (!pdfCanvas || !pageEl) return;

    const aspect =
      pdfCanvas.width && pdfCanvas.height
        ? pdfCanvas.height / pdfCanvas.width
        : A4_ASPECT;
    const layoutHeight =
      pdfCanvas.clientHeight || displayWidth * aspect;
    onPageAspectMeasured?.(pageNumber, aspect);

    if (overlay.width !== pdfCanvas.width || overlay.height !== pdfCanvas.height) {
      overlay.width = pdfCanvas.width;
      overlay.height = pdfCanvas.height;
      drawCtxRef.current = null;
    }
    overlay.style.top = `${pageEl.offsetTop}px`;
    overlay.style.left = `${pageEl.offsetLeft}px`;
    overlay.style.width = pdfCanvas.style.width || `${pdfCanvas.clientWidth || displayWidth}px`;
    overlay.style.height =
      pdfCanvas.style.height || `${pdfCanvas.clientHeight || layoutHeight}px`;
    setPageHeight(pageWidth * aspect);
  }, [displayWidth, onPageAspectMeasured, pageNumber, pageWidth]);

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

    const restoreKey = `${canvas.width}x${canvas.height}:${stored.width}x${stored.height}:${stored.actions.length}:${stored.rasterFallback?.length ?? 0}`;
    if (appliedRestoreKeyRef.current === restoreKey) return;

    try {
      await applyStoredAnnotation(
        ctx,
        canvas,
        stored,
        pdfPageWidthScale1Ref.current
      );
      appliedRestoreKeyRef.current = restoreKey;
    } catch {
      appliedRestoreKeyRef.current = null;
    }
  }, [getDrawContext]);

  const handleRenderSuccess = (page?: { originalWidth?: number }) => {
    if (renderIdentityRef.current !== renderIdentity) return;
    if (page?.originalWidth && page.originalWidth > 0) {
      pdfPageWidthScale1Ref.current = page.originalWidth;
    }
    setRenderedIdentity(renderIdentity);
    setRenderedPdfIdentity(pdfIdentity);
    requestAnimationFrame(() => {
      syncOverlayToPdfCanvas();
      void applyRestoredAnnotationToOverlay();

      const canvas = containerRef.current?.querySelector(
        'canvas.react-pdf__Page__canvas'
      ) as HTMLCanvasElement | null;
      if (!canvas || !pageRenderCacheKey || !pdfCacheKey) return;

      canvas.toBlob((blob) => {
        if (!blob) {
          console.warn(`Failed to cache PDF render for page ${pageNumber}`);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== 'string') {
            console.warn(`Failed to read cached PDF render for page ${pageNumber}`);
            return;
          }
          const entry = {
            dataUrl: reader.result,
            width: canvas.width,
            height: canvas.height,
          };
          setCachedPageRender(pageRenderCacheKey, entry);
          setPagePreview({
            pdfKey: pdfCacheKey,
            renderKey: pageRenderCacheKey,
            src: reader.result,
          });
        };
        reader.onerror = () => {
          console.warn(`Failed to read cached PDF render for page ${pageNumber}`);
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.82);
    });
  };

  useEffect(() => {
    if (!rendered) return;
    syncOverlayToPdfCanvas();
    void applyRestoredAnnotationToOverlay();
  }, [rendered, restoredAnnotation, syncOverlayToPdfCanvas, applyRestoredAnnotationToOverlay]);

  useEffect(() => {
    if (!rendered) return;
    const canvas = drawCanvasRef.current;
    onCanvasMount?.(pageNumber, canvas);
    return () => onCanvasMount?.(pageNumber, null);
  }, [pageNumber, rendered, onCanvasMount]);

  const commitAction = useCallback((vectorAction?: VectorAction) => {
    if (!didModify.current || !vectorAction) return;
    if (vectorAction) {
      onActionCompleteRef.current?.(
        pageNumber,
        beforeAction.current,
        vectorAction,
        pdfPageWidthAtScale1()
      );
    }
    beforeAction.current = null;
    didModify.current = false;
  }, [pageNumber, pdfPageWidthAtScale1]);

  const finishTextEditor = useCallback((save: boolean) => {
    const editor = textEditorRef.current;
    const text = editor?.value ?? '';
    const canvas = drawCanvasRef.current;
    const ctx = canvas ? getDrawContext(canvas) : null;
    const currentEditor = textEditorStateRef.current;
    const position = currentEditor?.position ?? textEditorPositionRef.current;
    if (!currentEditor) return;
    textEditorStateRef.current = null;
    let movedAction: VectorAction | null = null;
    if (
      save &&
      !currentEditor.editable &&
      currentEditor.actionIndex !== null &&
      canvas &&
      position
    ) {
      const stored =
        getRestoredAnnotationRef.current?.() ?? restoredAnnotationRef.current;
      const selectedAction = stored?.actions[currentEditor.actionIndex];
      if (selectedAction?.type === 'text' && stored) {
        const originalPosition = {
          x: selectedAction.position.x * (canvas.width / stored.width),
          y: selectedAction.position.y * (canvas.height / stored.height),
        };
        if (
          Math.abs(position.x - originalPosition.x) > 0.5 ||
          Math.abs(position.y - originalPosition.y) > 0.5
        ) {
          movedAction = { ...selectedAction, position };
          onTextActionUpdateRef.current?.(
            pageNumber,
            currentEditor.actionIndex,
            movedAction,
            pdfPageWidthAtScale1()
          );
        }
      }
    }
    if (
      save &&
      currentEditor.editable &&
      text.trim() &&
      canvas &&
      ctx &&
      position
    ) {
      const action: VectorAction = {
        type: 'text',
        position,
        text,
        color: textColorRef.current,
        size: annotationTextSizeRef.current,
        width: currentEditor.width,
      };
      if (currentEditor.actionIndex === null) {
        drawVectorText(ctx, action, action.position, canvas.width, pdfPageWidthAtScale1());
        onActionCompleteRef.current?.(pageNumber, null, action, pdfPageWidthAtScale1());
      } else {
        onTextActionUpdateRef.current?.(
          pageNumber,
          currentEditor.actionIndex,
          action,
          pdfPageWidthAtScale1()
        );
      }
    }
    if (
      save &&
      currentEditor.editable &&
      !text.trim() &&
      canvas &&
      currentEditor.actionIndex !== null
    ) {
      onTextActionDeleteRef.current?.(
        pageNumber,
        currentEditor.actionIndex,
        pdfPageWidthAtScale1()
      );
      onTextActionSelectRef.current?.(pageNumber, null, null, false);
      textEditorPositionRef.current = null;
      updateTextEditor(null);
      return;
    }
    if (canvas && ctx && currentEditor.actionIndex !== null) {
      if (
        !movedAction &&
        (!save || !currentEditor.editable || !text.trim())
      ) {
        const stored =
          getRestoredAnnotationRef.current?.() ?? restoredAnnotationRef.current;
        if (stored) {
          void applyStoredAnnotation(
            ctx,
            canvas,
            stored,
            pdfPageWidthAtScale1()
          );
        }
      }
      const currentAction =
        movedAction ??
        (save && currentEditor.editable && text.trim() && position
          ? {
              type: 'text' as const,
              position,
              text,
              color: textColorRef.current,
              size: annotationTextSizeRef.current,
              width: currentEditor.width,
            }
          : (
              getRestoredAnnotationRef.current?.() ??
              restoredAnnotationRef.current
            )?.actions[currentEditor.actionIndex] ?? null);
      onTextActionSelectRef.current?.(
        pageNumber,
        currentEditor.actionIndex,
        currentAction,
        false
      );
    } else if (currentEditor.actionIndex === null) {
      onTextActionSelectRef.current?.(pageNumber, null, null, false);
    }
    textEditorPositionRef.current = null;
    updateTextEditor(null);
  }, [getDrawContext, pageNumber, pdfPageWidthAtScale1, updateTextEditor]);

  const isTextEditorOpen = textEditor !== null;
  useEffect(() => {
    if (isTextEditorOpen && textEditor?.editable) {
      textEditorRef.current?.focus();
    }
  }, [isTextEditorOpen, textEditor?.editable]);

  const cancelPendingFrame = useCallback(() => {
    if (pendingFrame.current !== null) {
      cancelAnimationFrame(pendingFrame.current);
      pendingFrame.current = null;
    }
  }, []);

  const cancelEraserPreview = useCallback(() => {
    if (eraserPreviewFrame.current !== null) {
      cancelAnimationFrame(eraserPreviewFrame.current);
      eraserPreviewFrame.current = null;
    }
  }, []);

  const flushFreehandPoints = useCallback(() => {
    pendingFrame.current = null;

    const canvas = drawCanvasRef.current;
    const ctx = canvas ? getDrawContext(canvas) : null;
    const tool = drawToolRef.current;
    if (!canvas || !ctx || !isDrawing.current || !isFreehandTool(tool)) return;
    if (tool === 'eraser') return;

    const points = strokePoints.current;
    if (points.length < 3) return;

    applyFreehandStyle(
      ctx,
      tool,
      penColorRef.current,
      penSizeRef.current,
      eraserSizeRef.current,
      canvas,
      pdfPageWidthAtScale1()
    );
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
      penSizeRef.current,
      canvas,
      pdfPageWidthAtScale1()
    );
    lastPoint.current = point;
    didModify.current = true;
  }, [getDrawContext, pdfPageWidthAtScale1]);

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
    const canvas = drawCanvasRef.current;
    const points = strokePoints.current;
    if (points.length === 0 || !canvas) return;

    const tool = drawToolRef.current;
    if (!isFreehandTool(tool)) return;
    if (tool === 'eraser') {
      didModify.current = true;
      return;
    }

    applyFreehandStyle(
      ctx,
      tool,
      penColorRef.current,
      penSizeRef.current,
      eraserSizeRef.current,
      canvas,
      pdfPageWidthAtScale1()
    );

    if (points.length === 1) {
      if (tool === 'pen') {
        drawDot(
          ctx,
          points[0],
          penSizeRef.current,
          penColorRef.current,
          canvas,
          pdfPageWidthAtScale1()
        );
      }
      didModify.current = true;
      return;
    }

    if (points.length === 2) {
      applyFreehandStyle(
        ctx,
        tool,
        penColorRef.current,
        penSizeRef.current,
        eraserSizeRef.current,
        canvas,
        pdfPageWidthAtScale1()
      );
      drawSmoothCap(ctx, points[0], points[1]);
      didModify.current = true;
      return;
    }

    flushFreehandPoints();

    const pPrev = points[points.length - 2];
    const pLast = points[points.length - 1];
    applyFreehandStyle(
      ctx,
      tool,
      penColorRef.current,
      penSizeRef.current,
      eraserSizeRef.current,
      canvas,
      pdfPageWidthAtScale1()
    );
    drawSmoothCap(
      ctx,
      { x: (pPrev.x + pLast.x) / 2, y: (pPrev.y + pLast.y) / 2 },
      pLast
    );

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
    }

    didModify.current = true;
  }, [flushFreehandPoints, pdfPageWidthAtScale1]);

  const finishDrawing = useCallback(() => {
    if (!isDrawing.current) return;

    cancelPendingFrame();
    cancelEraserPreview();

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
        penSizeRef.current,
        canvas,
        pdfPageWidthAtScale1()
      );
      didModify.current = true;
    } else if (canvas && ctx && (tool === 'pen' || tool === 'eraser')) {
      finishFreehandStroke(ctx);
    }

    let vectorAction: VectorAction | undefined;
    if (canvas && didModify.current) {
      if (isShapeTool(tool) && shapeStart.current && lastPoint.current) {
        vectorAction = {
          type: tool,
          start: shapeStart.current,
          end: lastPoint.current,
          color: penColorRef.current,
          size: penSizeRef.current,
        };
      } else if (isFreehandTool(tool) && strokePoints.current.length > 0) {
        vectorAction = {
          type: 'freehand',
          tool,
          points: strokePoints.current.slice(),
          color: penColorRef.current,
          size: tool === 'pen' ? penSizeRef.current : eraserSizeRef.current,
        };
      }
    }

    if (
      canvas &&
      ctx &&
      vectorAction?.type === 'freehand' &&
      vectorAction.tool === 'eraser'
    ) {
      const stored =
        getRestoredAnnotationRef.current?.() ?? restoredAnnotationRef.current;
      const storedWidth = stored?.width ?? canvas.width;
      const storedHeight = stored?.height ?? canvas.height;
      const scaleX = storedWidth / canvas.width;
      const scaleY = storedHeight / canvas.height;
      const storedEraser = {
        ...vectorAction,
        points: vectorAction.points.map((point) => ({
          x: point.x * scaleX,
          y: point.y * scaleY,
        })),
      };
      const actions = eraseIntersectingVectorActions(
        stored?.actions ?? [],
        storedEraser,
        storedWidth,
        pdfPageWidthAtScale1()
      );
      if (stored?.rasterFallback) {
        actions.push(storedEraser);
        void applyStoredAnnotation(
          ctx,
          canvas,
          {
            width: storedWidth,
            height: storedHeight,
            actions,
            pdfPageWidthAtScale1: pdfPageWidthAtScale1(),
            rasterFallback: stored.rasterFallback,
          },
          pdfPageWidthAtScale1()
        );
      } else {
        redrawAfterVectorErase(
          ctx,
          canvas,
          stored?.actions ?? [],
          actions,
          storedWidth,
          storedHeight,
          pdfPageWidthAtScale1()
        );
      }
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
    commitAction(vectorAction);
  }, [cancelEraserPreview, cancelPendingFrame, commitAction, finishFreehandStroke, getDrawContext, pageNumber, pdfPageWidthAtScale1, renderShapePreview]);

  const renderLiveVectorErase = useCallback(() => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas ? getDrawContext(canvas) : null;
    const stored =
      getRestoredAnnotationRef.current?.() ?? restoredAnnotationRef.current;
    if (
      !canvas ||
      !ctx ||
      !stored ||
      stored.rasterFallback ||
      strokePoints.current.length === 0
    ) {
      return;
    }

    const scaleX = stored.width ? stored.width / canvas.width : 1;
    const scaleY = stored.height ? stored.height / canvas.height : 1;
    const eraser = {
      type: 'freehand' as const,
      tool: 'eraser' as const,
      points: strokePoints.current.map((point) => ({
        x: point.x * scaleX,
        y: point.y * scaleY,
      })),
      color: penColorRef.current,
      size: eraserSizeRef.current,
    };
    const remainingActions = eraseIntersectingVectorActions(
      stored.actions,
      eraser,
      stored.width,
      pdfPageWidthAtScale1()
    );
    redrawAfterVectorErase(
      ctx,
      canvas,
      stored.actions,
      remainingActions,
      stored.width,
      stored.height,
      pdfPageWidthAtScale1()
    );
  }, [getDrawContext, pdfPageWidthAtScale1]);

  const scheduleEraserPreview = useCallback(() => {
    if (eraserPreviewFrame.current !== null) return;
    eraserPreviewFrame.current = requestAnimationFrame(() => {
      eraserPreviewFrame.current = null;
      if (isDrawing.current && drawToolRef.current === 'eraser') {
        renderLiveVectorErase();
      }
    });
  }, [renderLiveVectorErase]);

  const addFreehandPoint = useCallback((point: Point) => {
    const points = strokePoints.current;
    const last = points[points.length - 1];
    if (last && last.x === point.x && last.y === point.y) return;

    points.push(point);
    lastPoint.current = point;
    const tool = drawToolRef.current;
    if (tool === 'eraser') {
      const canvas = drawCanvasRef.current;
      const ctx = canvas ? getDrawContext(canvas) : null;
      const stored =
        getRestoredAnnotationRef.current?.() ?? restoredAnnotationRef.current;
      if (canvas && ctx && last && stored?.rasterFallback) {
        applyFreehandStyle(
          ctx,
          'eraser',
          penColorRef.current,
          penSizeRef.current,
          eraserSizeRef.current,
          canvas,
          pdfPageWidthAtScale1()
        );
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
      if (stored && !stored.rasterFallback && stored.actions.length > 0) {
        scheduleEraserPreview();
      }
    }

    if (points.length >= 3) {
      if (tool !== 'eraser') {
        scheduleFreehandFlush();
      }
    } else {
      didModify.current = points.length > 0;
    }
  }, [getDrawContext, pdfPageWidthAtScale1, scheduleEraserPreview, scheduleFreehandFlush]);

  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !rendered || !drawingEnabled) return;

    const openTextEditorAtPoint = (clientX: number, clientY: number) => {
      finishTextEditor(true);
      const metrics = readCanvasMetrics(canvas);
      const point = getCanvasCoordsFromClient(clientX, clientY, metrics);
      const ctx = getDrawContext(canvas);
      const stored = getRestoredAnnotationRef.current?.() ?? restoredAnnotationRef.current;
      const scaleX = stored?.width ? canvas.width / stored.width : 1;
      const scaleY = stored?.height ? canvas.height / stored.height : 1;
      let selectedTextIndex = -1;
      if (ctx && stored) {
        for (let index = stored.actions.length - 1; index >= 0; index -= 1) {
          const action = stored.actions[index];
          if (action.type !== 'text') continue;
          const scaledPosition = {
            x: action.position.x * scaleX,
            y: action.position.y * scaleY,
          };
          if (
            isPointOnVectorText(
              ctx,
              action,
              scaledPosition,
              point,
              canvas.width,
              pdfPageWidthAtScale1()
            )
          ) {
            selectedTextIndex = index;
            break;
          }
        }
      }
      if (selectedTextIndex >= 0 && stored) {
        const action = stored.actions[selectedTextIndex];
        if (action.type !== 'text') return;
        const scaledPosition = {
          x: action.position.x * scaleX,
          y: action.position.y * scaleY,
        };
        const bounds = ctx
          ? getVectorTextBounds(
              ctx,
              action,
              scaledPosition,
              canvas.width,
              pdfPageWidthAtScale1()
            )
          : null;
        const pdfUnitsPerCanvasPixel =
          pdfPageWidthAtScale1() / canvas.width;
        const editorWidth =
          action.width ??
          Math.max(32, (bounds?.width ?? 180) * pdfUnitsPerCanvasPixel);
        const editorActionIndex = selectedTextIndex;
        const pageWithSelectedTextRemoved: StoredAnnotationPage = {
          width: stored.width,
          height: stored.height,
          actions: stored.actions.filter((_, index) => index !== editorActionIndex),
          ...(stored.pdfPageWidthAtScale1
            ? { pdfPageWidthAtScale1: stored.pdfPageWidthAtScale1 }
            : {}),
          ...(stored.rasterFallback
            ? { rasterFallback: stored.rasterFallback }
            : {}),
        };
        if (ctx) {
          void applyStoredAnnotation(
            ctx,
            canvas,
            pageWithSelectedTextRemoved,
            pdfPageWidthAtScale1()
          );
        }
        textEditorPositionRef.current = scaledPosition;
        onTextActionSelectRef.current?.(pageNumber, selectedTextIndex, {
          ...action,
          position: scaledPosition,
        }, true);
        updateTextEditor({
          position: scaledPosition,
          left: canvas.offsetLeft + scaledPosition.x * (canvas.clientWidth / canvas.width),
          top: canvas.offsetTop + scaledPosition.y * (canvas.clientHeight / canvas.height),
          text: action.text,
          actionIndex: selectedTextIndex,
          width: editorWidth,
          editable: false,
        });
        return;
      }
      textEditorPositionRef.current = point;
      onTextActionSelectRef.current?.(pageNumber, null, null, true);
      updateTextEditor({
        position: point,
        left: canvas.offsetLeft + point.x * (canvas.clientWidth / canvas.width),
        top: canvas.offsetTop + point.y * (canvas.clientHeight / canvas.height),
        text: '',
        actionIndex: null,
        width: 180,
        editable: true,
      });
    };

    const startStrokeAtPoint = (clientX: number, clientY: number) => {
      canvasMetrics.current = readCanvasMetrics(canvas);

      isDrawing.current = true;
      didModify.current = false;
      renderedPointCount.current = 0;
      onDrawingActiveChangeRef.current?.(pageNumber, true);

      const ctx = getDrawContext(canvas);
      const stored =
        getRestoredAnnotationRef.current?.() ?? restoredAnnotationRef.current;
      const tool = drawToolRef.current;
      if (ctx && (stored?.rasterFallback || isShapeTool(tool))) {
        beforeAction.current = captureSnapshot(ctx, canvas);
      } else {
        beforeAction.current = null;
      }

      const point = getCanvasCoordsFromClient(clientX, clientY, canvasMetrics.current);
      lastPoint.current = point;
      strokePoints.current = [point];

      if (isShapeTool(tool)) {
        shapeStart.current = point;
      } else if (tool === 'eraser') {
        const stored =
          getRestoredAnnotationRef.current?.() ?? restoredAnnotationRef.current;
        const eraserContext = getDrawContext(canvas);
        if (stored?.rasterFallback && eraserContext) {
          applyFreehandStyle(
            eraserContext,
            'eraser',
            penColorRef.current,
            penSizeRef.current,
            eraserSizeRef.current,
            canvas,
            pdfPageWidthAtScale1()
          );
          eraserContext.beginPath();
          eraserContext.arc(
            point.x,
            point.y,
            eraserContext.lineWidth / 2,
            0,
            2 * Math.PI
          );
          eraserContext.fill();
          eraserContext.globalCompositeOperation = 'source-over';
        }
        renderLiveVectorErase();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== undefined && e.button !== 0 && e.button !== -1) return;
      if (!shouldAnnotateWithPointer(e, allowTouchNavigationRef.current)) return;

      e.preventDefault();
      if (drawToolRef.current === 'text') {
        openTextEditorAtPoint(e.clientX, e.clientY);
        return;
      }
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
      if (drawToolRef.current === 'text') {
        openTextEditorAtPoint(e.clientX, e.clientY);
        return;
      }
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
      cancelEraserPreview();
      cancelPendingFrame();
      if (shapePreviewFrame.current !== null) {
        cancelAnimationFrame(shapePreviewFrame.current);
        shapePreviewFrame.current = null;
      }
    };
  }, [
    addFreehandPoint,
    cancelEraserPreview,
    cancelPendingFrame,
    drawingEnabled,
    finishDrawing,
    getDrawContext,
    renderLiveVectorErase,
    scheduleShapePreview,
    rendered,
    finishTextEditor,
    pdfPageWidthAtScale1,
    updateTextEditor,
  ]);

  useEffect(() => {
    if (!drawingEnabled) {
      cancelEraserPreview();
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
  }, [cancelEraserPreview, cancelPendingFrame, drawingEnabled, pageNumber]);

  useEffect(() => {
    if (!drawingEnabled || drawTool !== 'text') {
      textEditorPositionRef.current = null;
      updateTextEditor(null);
    }
  }, [drawTool, drawingEnabled, updateTextEditor]);

  const cursorClass = !drawingEnabled
    ? 'pointer-events-none'
    : drawTool === 'eraser'
      ? 'cursor-cell'
      : drawTool === 'text'
        ? 'cursor-text'
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
        className={`pdf-viewer-page relative origin-top-left rounded ${
          rendered ? 'bg-white' : 'bg-gray-200 dark:bg-gray-800'
        }`}
        style={{
          transform: `scale(calc(var(--pdf-zoom, 1) / ${renderZoomFactor}))`,
          transformOrigin: 'top left',
          width: displayWidth,
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
        <Page
          key={`${pageNumber}-${displayWidth}-${pageWidth}`}
          pageNumber={pageNumber}
          width={displayWidth}
          devicePixelRatio={outputDevicePixelRatio}
          renderMode="canvas"
          renderTextLayer={mode !== 'inline' && !drawingEnabled}
          renderAnnotationLayer={false}
          loading={
            <div className="w-full aspect-[210/297] pdf-skeleton-loader" aria-hidden="true" />
          }
          onRenderSuccess={handleRenderSuccess}
          onRenderError={(error) => console.error('PDF page render failed:', error)}
        />

        {pagePreview?.pdfKey === pdfCacheKey &&
          pagePreview.src &&
          (mode === 'inline'
            ? rendered
              ? pagePreview.renderKey === pageRenderCacheKey
              : true
            : !rendered) && (
            <img
              src={pagePreview.src}
              alt={`Page ${pageNumber}`}
              className="absolute inset-0 w-full h-full object-contain pointer-events-auto select-none z-10"
              draggable={false}
            />
          )}
          {textEditor && drawingEnabled && drawTool === 'text' && (
                <textarea
              ref={textEditorRef}
              rows={1}
              readOnly={!textEditor.editable}
              value={textEditor.text}
              onChange={(event) =>
                updateTextEditor((current) =>
                  current ? { ...current, text: event.target.value } : current
                )
              }
              onDoubleClick={() => {
                if (!textEditor.editable) {
                  updateTextEditor((current) =>
                    current ? { ...current, editable: true } : current
                  );
                }
              }}
              onPointerDown={(event) => {
                if (textEditor.editable || event.button !== 0) return;
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                textDragRef.current = {
                  pointerId: event.pointerId,
                  startClientX: event.clientX,
                  startClientY: event.clientY,
                  startLeft: textEditor.left,
                  startTop: textEditor.top,
                  startPosition: textEditor.position,
                };
              }}
              onPointerMove={(event) => {
                const drag = textDragRef.current;
                const canvas = drawCanvasRef.current;
                if (!drag || drag.pointerId !== event.pointerId || !canvas) return;
                const metrics = readCanvasMetrics(canvas);
                const dx = event.clientX - drag.startClientX;
                const dy = event.clientY - drag.startClientY;
                const position = {
                  x: drag.startPosition.x + dx * metrics.scaleX,
                  y: drag.startPosition.y + dy * metrics.scaleY,
                };
                textEditorPositionRef.current = position;
                updateTextEditor((current) =>
                  current
                    ? {
                        ...current,
                        position,
                        left: drag.startLeft + dx,
                        top: drag.startTop + dy,
                      }
                    : current
                );
              }}
              onPointerUp={(event) => {
                textDragRef.current = null;
                if (!textEditor.editable) return;
                const canvas = drawCanvasRef.current;
                if (!canvas) return;
                const displayedWidth =
                  canvas.clientWidth || canvas.width;
                const resizedWidth =
                  event.currentTarget.getBoundingClientRect().width;
                const width = Math.max(
                  32,
                  ((resizedWidth - 10) / displayedWidth) *
                    pdfPageWidthScale1Ref.current
                );
                updateTextEditor((current) =>
                  current ? { ...current, width } : current
                );
              }}
              onPointerCancel={() => {
                textDragRef.current = null;
              }}
              onBlur={(event) => {
                const nextTarget = event.relatedTarget;
                if (
                  nextTarget instanceof Element &&
                  nextTarget.closest('[data-text-annotation-controls]')
                ) {
                  return;
                }
                window.setTimeout(() => {
                  if (textEditorStateRef.current === textEditor) {
                    finishTextEditor(true);
                  }
                }, 0);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.ctrlKey) {
                  event.preventDefault();
                  const textarea = event.currentTarget;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  textarea.setRangeText('\n', start, end, 'end');
                  updateTextEditor((current) =>
                    current
                      ? { ...current, text: textarea.value }
                      : current
                  );
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  finishTextEditor(false);
                }
              }}
              aria-label="Text annotation"
              placeholder="Type here..."
              title={textEditor.editable ? 'Edit text annotation' : 'Drag to move; double-click to edit'}
              className={`absolute z-30 min-w-32 rounded-md border px-1.5 py-0.5 text-gray-900 shadow-lg ring-1 ring-black/15 outline-none ${
                textEditor.editable
                  ? 'border-black bg-white/95 focus:border-black focus:ring-black/25'
                  : 'cursor-move select-none border-black/30 bg-white/75'
              }`}
              style={{
                left: textEditor.left,
                top: Math.max(0, textEditor.top - 2),
                width: pdfStrokeWidthInCanvasPixels(
                  textEditor.width,
                  drawCanvasRef.current?.width ?? displayWidth,
                  pdfPageWidthScale1Ref.current
                ) *
                  ((drawCanvasRef.current?.clientWidth ?? displayWidth) /
                  (drawCanvasRef.current?.width ?? displayWidth)) + 10,
                fontSize: `${
                  pdfStrokeWidthInCanvasPixels(
                    annotationTextSize,
                    drawCanvasRef.current?.width ?? displayWidth,
                    pdfPageWidthScale1Ref.current
                  ) *
                  ((drawCanvasRef.current?.clientWidth ?? displayWidth) /
                    (drawCanvasRef.current?.width ?? displayWidth))
                }px`,
                lineHeight: 1.25,
                height: (() => {
                  const canvas = drawCanvasRef.current;
                  const ctx = canvas?.getContext('2d');
                  if (!canvas || !ctx) return '1.5em';
                  const bounds = getVectorTextBounds(
                    ctx,
                    {
                      type: 'text',
                      position: textEditor.position,
                      text: textEditor.text || ' ',
                      color: textColor,
                      size: annotationTextSize,
                      width: textEditor.width,
                    },
                    textEditor.position,
                    canvas.width,
                    pdfPageWidthScale1Ref.current
                  );
                  const scale =
                    (canvas.clientWidth || displayWidth) / canvas.width;
                  return `${Math.max(1, bounds.height * scale + 8)}px`;
                })(),
                color: textColor,
                resize: 'horizontal',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                boxSizing: 'border-box',
                touchAction: textEditor.editable ? 'auto' : 'none',
              }}
            />
          )}

        {hasRenderedPdf && (
          <canvas
            ref={drawCanvasRef}
            className={`absolute z-20 ${rendered ? cursorClass : 'pointer-events-none'} ${invertActive ? 'invert hue-rotate-180' : ''}`}
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
  if (prev.pdfCacheKey !== next.pdfCacheKey) return false;
  if (prev.drawingEnabled !== next.drawingEnabled) return false;
  if (prev.allowTouchNavigation !== next.allowTouchNavigation) return false;
  if (prev.drawTool !== next.drawTool) return false;
  if (prev.penColor !== next.penColor) return false;
  if (prev.textColor !== next.textColor) return false;
  if (prev.penSize !== next.penSize) return false;
  if (prev.eraserSize !== next.eraserSize) return false;
  if (prev.annotationTextSize !== next.annotationTextSize) return false;
  const prevRenderZoom = prev.renderScale != null ? prev.renderScale * 100 : (prev.renderZoom ?? 100);
  const nextRenderZoom = next.renderScale != null ? next.renderScale * 100 : (next.renderZoom ?? 100);
  if (Math.round(prevRenderZoom) !== Math.round(nextRenderZoom)) return false;
  if (prev.getRestoredAnnotation !== next.getRestoredAnnotation) return false;
  if (prev.onCanvasMount !== next.onCanvasMount) return false;
  if (prev.onActionComplete !== next.onActionComplete) return false;
  if (prev.onTextActionSelect !== next.onTextActionSelect) return false;
  if (prev.onTextActionUpdate !== next.onTextActionUpdate) return false;
  if (prev.onTextActionDelete !== next.onTextActionDelete) return false;
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
