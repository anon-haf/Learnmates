import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from 'react';
import { Document } from 'react-pdf';
import { pdfDocumentOptions } from '../utils/pdfjsConfig';
import { supabase } from '../lib/supabaseClient';
import { resolveFromR2, getAssetAuthHeaders } from '../utils/r2Utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Save,
  X,
  Menu,
  Pen,
  Eraser,
  Undo2,
  Redo2,
  Minus,
  Square,
  Circle,
  Hand,
  Trash2,
  Shapes,
  PenTool,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfDocumentSkeleton } from './PdfPageSkeleton';
import { PdfSidebarPageThumb } from './PdfSidebarPageThumb';
import { DrawTool, PdfDrawablePage } from './PdfDrawablePage';
import { clearPdfThumbnailCache, loadPdfDocument } from '../utils/pdfThumbnail';
import { usePdfAnnotationHistory } from '../utils/pdfAnnotationHistory';
import {
  loadAnnotations,
  saveAnnotations,
  StoredAnnotationPage,
} from '../utils/pdfIndexedDBStorage';
import { useMeaningfulReadTracker } from '../hooks/useMeaningfulReadTracker';
import { useEngagement } from '../context/EngagementContext';
import { triggerXPNotification } from './XPRewardNotification';

type PdfFileSource = string | { data: Uint8Array };

export type PdfEngagementContext = {
  topicId: string;
  resourceId: string;
};

export interface UniversalDocumentViewerProps {
  mode?: 'inline' | 'modal';
  type?: 'pdf' | 'image';
  savedAnnotation?: string;
  onSaveAnnotation?: (data: string) => void;
  hideToolbar?: boolean;

  pdfUrl: string;
  fileName?: string;
  onClose?: () => void;
  engagementContext?: PdfEngagementContext;
}

const MIN_ZOOM = 50;
const MAX_ZOOM = 500;
const PAGE_GAP_PX = 12;
const A4_ASPECT = 297 / 210;
const AUTO_SAVE_DEBOUNCE_MS = 5000;
const AUTO_SAVE_RETRY_MS = 750;

const clampZoom = (value: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const isShapeTool = (tool: DrawTool) =>
  tool === 'line' || tool === 'rectangle' || tool === 'ellipse';

const iconBtn =
  'p-2 sm:p-2.5 rounded transition disabled:opacity-40 disabled:cursor-not-allowed';
const iconBtnActive = 'bg-blue-600 text-white';
const iconBtnIdle = 'text-gray-300 hover:bg-gray-700';
const toolbarIconSize = 'w-4 h-4 sm:w-5 sm:h-5';

// Memoized PdfDrawablePage with custom comparator
const MemoizedPdfDrawablePage = React.memo(
  PdfDrawablePage,
  (prevProps, nextProps) => {
    return (
      prevProps.mode === nextProps.mode &&
      prevProps.pageNumber === nextProps.pageNumber &&
      prevProps.pageWidth === nextProps.pageWidth &&
      prevProps.drawingEnabled === nextProps.drawingEnabled &&
      prevProps.drawTool === nextProps.drawTool &&
      prevProps.penColor === nextProps.penColor &&
      prevProps.penSize === nextProps.penSize &&
      prevProps.eraserSize === nextProps.eraserSize &&
      prevProps.allowTouchNavigation === nextProps.allowTouchNavigation &&
      prevProps.renderScale === nextProps.renderScale &&
      prevProps.restoredAnnotation === nextProps.restoredAnnotation
    );
  }
);

const UniversalDocumentViewer: React.FC<UniversalDocumentViewerProps> = ({
  mode = 'modal',
  savedAnnotation,
  onSaveAnnotation,
  hideToolbar = false,
  pdfUrl,
  fileName = 'document.pdf',
  onClose,
  engagementContext,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [debouncedZoom, setDebouncedZoom] = useState<number>(100);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pdfFile, setPdfFile] = useState<PdfFileSource | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [touchScrollInDrawMode, setTouchScrollInDrawMode] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches
  );
  const [drawTool, setDrawTool] = useState<DrawTool>('pen');
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(3);
  const [eraserSize, setEraserSize] = useState(20);
  const [pageWidth, setPageWidth] = useState(640);
  const [storedPages, setStoredPages] = useState<Record<number, StoredAnnotationPage>>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'pen' | 'shapes' | 'eraser' | null>(null);

  useEffect(() => {
    if (!activeDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.tool-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);
  const [drawingPages, setDrawingPages] = useState<Set<number>>(() => new Set());
  const [, startTransition] = useTransition();

  const engagementContextAPI = useEngagement();
  const setEngagementFlag = engagementContextAPI?.setEngagementFlag;

  const {
    registerCanvas,
    pushAction,
    undo,
    redo,
    clearAll,
    reset: resetAnnotationHistory,
    resetCache,
    exportAll,
    getCachedPage,
    markSaved,
    isDrawingActive,
    setPageDrawingActive,
    canUndo,
    canRedo,
    isDirty,
  } = usePdfAnnotationHistory();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pdfBytesForThumbnailsRef = useRef<Uint8Array | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isProgrammaticScroll = useRef(false);
  const isZoomingRef = useRef(false);
  const zoomEndTimeoutRef = useRef<number | null>(null);
  const engagementRecordedRef = useRef({ opened: false, read: false, downloaded: false });
  const alivePagesRef = useRef<Set<number>>(new Set());
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [thumbnailWidth, setThumbnailWidth] = useState(100);
  const [sidebarEl, setSidebarEl] = useState<HTMLDivElement | null>(null);
  const lastPointerInContainerRef = useRef<{ x: number; y: number } | null>(null);
  const zoomRef = useRef(zoom);
  // Note: we do NOT sync zoomRef.current = zoom here because the zoom state
  // is only updated at end-of-gesture and we don't want re-renders to overwrite
  // the ref that applyZoomAtPoint reads imperatively during active zooming.
  const pageWidthRef = useRef(pageWidth);
  pageWidthRef.current = pageWidth;
  const storedPagesRef = useRef(storedPages);
  const pageRestoreGettersRef = useRef<Map<number, () => StoredAnnotationPage | null>>(
    new Map()
  );
  const pageAspectRatiosRef = useRef<Record<number, number>>({});
  storedPagesRef.current = storedPages;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedZoom(zoomRef.current);
    }, 300);
    return () => clearTimeout(t);
  }, [zoom]);

  // Cleanup global PDF document on unmount
  useEffect(() => {
    return () => {
      window.__PDF_DOC__ = null;
    };
  }, []);

  useEffect(() => {
    engagementRecordedRef.current = { opened: false, read: false, downloaded: false };
  }, [pdfUrl, engagementContext?.topicId, engagementContext?.resourceId]);

  useEffect(() => {
    if (!engagementContext || engagementRecordedRef.current.opened) return;
    engagementRecordedRef.current.opened = true;
    if (setEngagementFlag) {
      setEngagementFlag(engagementContext.topicId, engagementContext.resourceId, pdfUrl, 'opened');
    }
  }, [engagementContext, pdfUrl, setEngagementFlag]);

  const handleMeaningfulRead = useCallback(() => {
    if (!engagementContext || engagementRecordedRef.current.read) return;
    engagementRecordedRef.current.read = true;
    if (setEngagementFlag) {
      setEngagementFlag(engagementContext.topicId, engagementContext.resourceId, pdfUrl, 'meaningfulRead');
    }
  }, [engagementContext, pdfUrl, setEngagementFlag]);

  useMeaningfulReadTracker({
    numPages,
    scrollContainerRef,
    pageRefs,
    enabled: Boolean(engagementContext) && numPages > 0,
    onComplete: handleMeaningfulRead,
  });

  const documentOptions = useMemo(() => pdfDocumentOptions, []);

  const showPenOptions = drawingEnabled && drawTool === 'pen';
  const showShapeOptions = drawingEnabled && isShapeTool(drawTool);
  const showEraserOptions = drawingEnabled && drawTool === 'eraser';

  const handleCanvasMount = useCallback(
    (pageNumber: number, canvas: HTMLCanvasElement | null) => {
      registerCanvas(pageNumber, canvas);
    },
    [registerCanvas]
  );

  const handleActionComplete = useCallback(
    (pageNumber: number, beforeSnapshot: ImageData) => {
      pushAction(pageNumber, beforeSnapshot);
    },
    [pushAction]
  );

  const handleDrawingActiveChange = useCallback(
    (pageNumber: number, active: boolean) => {
      setPageDrawingActive(pageNumber, active);
      setDrawingPages((prev) => {
        const next = new Set(prev);
        if (active) next.add(pageNumber);
        else next.delete(pageNumber);
        return next;
      });
    },
    [setPageDrawingActive]
  );

  const handlePageAspectMeasured = useCallback((pageNum: number, aspect: number) => {
    pageAspectRatiosRef.current[pageNum] = aspect;
  }, []);

  // Load the full PDF into memory so embedded images decode reliably
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setPdfFile(null);
      pdfBytesForThumbnailsRef.current = null;
      setFetchError(null);
      setNumPages(0);
      setCurrentPage(1);

      try {
        const resolvedUrl = (await resolveFromR2(pdfUrl)) || pdfUrl;
        const absoluteUrl = resolvedUrl.startsWith('http') || resolvedUrl.startsWith('blob:')
          ? resolvedUrl
          : new URL(resolvedUrl, window.location.origin).href;

        const response = await fetch(absoluteUrl, {
          headers: getAssetAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF (${response.status})`);
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('text/html') || contentType.includes('application/json')) {
          throw new Error('Received HTML/JSON instead of PDF document');
        }

        const data = new Uint8Array(await response.arrayBuffer());
        if (!cancelled) {
          pdfBytesForThumbnailsRef.current = data.slice();
          setPdfFile({ data });
        }
      } catch (err) {
        console.warn('PDF arraybuffer fetch failed, falling back to URL:', err);
        if (!cancelled) {
          pdfBytesForThumbnailsRef.current = null;
          const resolvedUrl = (await resolveFromR2(pdfUrl)) || pdfUrl;
          setPdfFile(resolvedUrl);
          setFetchError('Loaded via URL fallback — some images may not render.');
        }
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  useEffect(() => {
    clearPdfThumbnailCache(pdfUrl);
  }, [pdfUrl]);



  useEffect(() => {
    if (!pdfFile || numPages === 0) {
      setPdfDoc(null);
      return;
    }

    let cancelled = false;
    let doc: PDFDocumentProxy | null = null;

    const thumbnailSource =
      pdfBytesForThumbnailsRef.current != null
        ? { data: pdfBytesForThumbnailsRef.current }
        : pdfFile;

    void loadPdfDocument(thumbnailSource)
      .then((loaded) => {
        doc = loaded;
        if (!cancelled) setPdfDoc(loaded);
      })
      .catch((error) => {
        console.warn('Sidebar PDF document load failed:', error);
        if (!cancelled) setPdfDoc(null);
      });

    return () => {
      cancelled = true;
      doc?.destroy();
      setPdfDoc(null);
    };
  }, [pdfFile, numPages]);

  useEffect(() => {
    if (!sidebarEl) return;

    const updateThumbnailWidth = () => {
      setThumbnailWidth(Math.max(64, sidebarEl.clientWidth - 24));
    };

    updateThumbnailWidth();
    const observer = new ResizeObserver(updateThumbnailWidth);
    observer.observe(sidebarEl);
    return () => observer.disconnect();
  }, [sidebarEl, sidebarOpen, numPages]);

  useEffect(() => {
    let cancelled = false;

    const loadStoredAnnotations = async () => {
      const storageMode = mode === 'inline' ? 'temporary' : 'permanent';
      const stored = await loadAnnotations(pdfUrl, storageMode);
      if (cancelled) return;

      if (stored && Object.keys(stored.pages).length > 0) {
        const pages: Record<number, StoredAnnotationPage> = {};
        Object.entries(stored.pages).forEach(([page, data]) => {
          pages[Number(page)] = data;
        });
        setStoredPages(pages);
      } else if (savedAnnotation) {
        setStoredPages({
          1: {
            width: pageWidth,
            height: pageWidth * A4_ASPECT,
            actions: [],
            rasterFallback: savedAnnotation,
          },
        });
      } else {
        setStoredPages({});
      }
      pageRestoreGettersRef.current.clear();
      resetAnnotationHistory();
      resetCache();
      markSaved();
    };

    loadStoredAnnotations();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, mode, savedAnnotation, pageWidth, resetAnnotationHistory, resetCache, markSaved]);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!drawingEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingEnabled, undo, redo]);

  const onDocumentLoadSuccess = (doc: PDFDocumentProxy) => {
    const total = doc.numPages;
    setNumPages(total);
    setCurrentPage(1);
    setFetchError(null);
    // Expose PDF document globally for hi-res viewport rendering
    window.__PDF_DOC__ = doc;
  };

  const scrollToPage = useCallback((page: number, smooth = true) => {
    const newPage = Math.max(1, Math.min(page, numPages));
    setCurrentPage(newPage);
    const el = pageRefs.current.get(newPage);
    if (!el) return;

    isProgrammaticScroll.current = true;
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant', block: 'start' });
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, smooth ? 600 : 0);
  }, [numPages]);

  const goToPage = (page: number) => {
    scrollToPage(page);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || numPages === 0) return;

    let rafId: number | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current || isZoomingRef.current) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => ({
            page: Number((entry.target as HTMLElement).dataset.page),
            ratio: entry.intersectionRatio,
          }))
          .sort((a, b) => b.ratio - a.ratio);

        if (visible.length > 0) {
          const nextPage = visible[0].page;
          if (rafId !== null) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            setCurrentPage(nextPage);
            rafId = null;
          });
        }
      },
      {
        root: container,
        threshold: [0, 0.5, 1],
        rootMargin: '-20% 0px -55% 0px',
      }
    );

    pageRefs.current.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [numPages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // Initialize the CSS variable imperatively since we no longer set it via React style prop.
    // This prevents a flash of unscaled content on first render.
    container.style.setProperty('--pdf-zoom', String(zoomRef.current / 100));

    const updatePageWidth = () => {
      const padding = 32;
      const available = container.clientWidth - padding;
      setPageWidth(prev => {
        // Ignore small changes (< 24px) to prevent infinite loop from scrollbar flickering
        if (Math.abs(prev - available) < 24) return prev;
        return Math.max(280, available);
      });
    };

    updatePageWidth();
    const observer = new ResizeObserver(updatePageWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, [sidebarOpen]);



  const applyZoomAtPoint = useCallback(
    (newZoom: number, clientX: number, clientY: number) => {
      const clamped = clampZoom(newZoom);
      const oldZoom = zoomRef.current;
      if (clamped === oldZoom) return;

      const container = scrollContainerRef.current;
      if (!container) {
        zoomRef.current = clamped;
        setZoom(clamped);
        return;
      }

      isZoomingRef.current = true;
      if (zoomEndTimeoutRef.current !== null) {
        clearTimeout(zoomEndTimeoutRef.current);
      }
      zoomEndTimeoutRef.current = window.setTimeout(() => {
        isZoomingRef.current = false;
        zoomEndTimeoutRef.current = null;
      }, 200);

      const ratio = clamped / oldZoom;
      const containerRect = container.getBoundingClientRect();

      const pointerX = clientX - containerRect.left;
      const pointerY = clientY - containerRect.top;

      const containerWidth = container.clientWidth;
      const baseWidth = pageWidthRef.current;
      const oldDocWidth = baseWidth * (oldZoom / 100);
      const newDocWidth = baseWidth * (clamped / 100);

      // Account for flexbox centering offset (items-center / mx-auto)
      const oldOffset = oldDocWidth < containerWidth - 32 ? (containerWidth - oldDocWidth) / 2 : 16;
      const newOffset = newDocWidth < containerWidth - 32 ? (containerWidth - newDocWidth) / 2 : 16;

      const topPadding = 16;
      const contentPointX = container.scrollLeft + pointerX - oldOffset;
      const contentPointY = container.scrollTop + pointerY - topPadding;

      const targetScrollLeft = newOffset + contentPointX * ratio - pointerX;
      const targetScrollTop = topPadding + contentPointY * ratio - pointerY;

      container.style.setProperty('--pdf-zoom', String(clamped / 100));
      container.scrollLeft = Math.max(0, targetScrollLeft);
      container.scrollTop = Math.max(0, targetScrollTop);

      // Only update React state (which causes a re-render) AFTER the user stops
      // zooming. The CSS variable and zoomRef are updated imperatively above, so
      // the visual output is always correct. The state update just syncs the
      // toolbar percentage display and enables non-zoom features that depend on zoom.
      zoomRef.current = clamped;
      if (zoomEndTimeoutRef.current !== null) clearTimeout(zoomEndTimeoutRef.current);
      zoomEndTimeoutRef.current = window.setTimeout(() => {
        zoomEndTimeoutRef.current = null;
        isZoomingRef.current = false;
        setZoom(zoomRef.current);
      }, 200);
    },
    [] // no external deps — reads only refs
  );

  const applyZoomAtCursor = useCallback(
    (newZoom: number) => {
      const container = scrollContainerRef.current;
      if (!container) {
        setZoom(clampZoom(newZoom));
        return;
      }

      const rect = container.getBoundingClientRect();
      const pointer = lastPointerInContainerRef.current;
      const clientX = pointer ? rect.left + pointer.x : rect.left + rect.width / 2;
      const clientY = pointer ? rect.top + pointer.y : rect.top + rect.height / 2;
      applyZoomAtPoint(newZoom, clientX, clientY);
    },
    [applyZoomAtPoint]
  );



  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const trackPointer = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      lastPointerInContainerRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    let zoomRafId: number | null = null;
    let targetZoom = zoomRef.current;
    let latestPointer = { x: 0, y: 0 };

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      if (zoomRafId === null) {
        // Sync targetZoom with latest actual zoom on gesture start
        targetZoom = zoomRef.current;
      }

      latestPointer = { x: e.clientX, y: e.clientY };

      const isTrackpad = Math.abs(e.deltaY) < 50;
      const multiplier = isTrackpad ? 2.0 : 0.08;
      const zoomDelta = -e.deltaY * multiplier * (targetZoom / 100);

      targetZoom = clampZoom(targetZoom + zoomDelta);

      if (zoomRafId === null) {
        zoomRafId = requestAnimationFrame(() => {
          applyZoomAtPoint(targetZoom, latestPointer.x, latestPointer.y);
          zoomRafId = null;
        });
      }
    };

    const handlePointerLeave = () => {
      lastPointerInContainerRef.current = null;
    };

    container.addEventListener('pointermove', trackPointer);
    container.addEventListener('pointerleave', handlePointerLeave);
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('pointermove', trackPointer);
      container.removeEventListener('pointerleave', handlePointerLeave);
      container.removeEventListener('wheel', handleWheel);
      if (zoomRafId !== null) cancelAnimationFrame(zoomRafId);
    };
  }, [applyZoomAtPoint]);

  // Pinch-to-zoom on touch (normal mode always; draw mode only with finger nav)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (drawingEnabled && !touchScrollInDrawMode) return;

    const pinchStateRef = { distance: 0, zoom: 100 };

    const touchDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const touchMidpoint = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      pinchStateRef.distance = touchDistance(e.touches);
      pinchStateRef.zoom = zoomRef.current;
    };

    let pinchRafId: number | null = null;
    let targetPinchZoom = 100;
    let targetMidpoint = { x: 0, y: 0 };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchStateRef.distance <= 0) return;

      e.preventDefault();
      const nextDistance = touchDistance(e.touches);
      const rawScale = nextDistance / pinchStateRef.distance;
      const scale = 1 + (rawScale - 1) * 1.5;
      targetMidpoint = touchMidpoint(e.touches);
      targetPinchZoom = pinchStateRef.zoom * scale;

      if (pinchRafId === null) {
        pinchRafId = requestAnimationFrame(() => {
          applyZoomAtPoint(targetPinchZoom, targetMidpoint.x, targetMidpoint.y);
          pinchRafId = null;
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchStateRef.distance = 0;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      if (pinchRafId !== null) cancelAnimationFrame(pinchRafId);
    };
  }, [applyZoomAtPoint, drawingEnabled, touchScrollInDrawMode]);

  const handleDownload = async () => {
    if (engagementContext && !engagementRecordedRef.current.downloaded) {
      engagementRecordedRef.current.downloaded = true;
      if (setEngagementFlag) {
        setEngagementFlag(engagementContext.topicId, engagementContext.resourceId, pdfUrl, 'downloaded');
      }

      // Award XP for downloading
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch('/api/xp/download', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            keepalive: true,
            body: JSON.stringify({
              resourceId: engagementContext.resourceId,
              resourceName: fileName,
              resourceType: 'file'
            })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.xpAwarded > 0) {
              triggerXPNotification(data.xpAwarded, 'download');
            }
          }
        }
      } catch (err) {
        console.error('Failed to award download XP from viewer', err);
      }
    }

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const setPageRef = (page: number) => (el: HTMLDivElement | null) => {
    if (el) pageRefs.current.set(page, el);
    else pageRefs.current.delete(page);
  };

  const persistAnnotations = useCallback(async () => {
    const pages = exportAll();
    const storageMode = mode === 'inline' ? 'temporary' : 'permanent';
    await saveAnnotations(pdfUrl, pages, storageMode);
    markSaved();

    if (onSaveAnnotation) {
      const page1DataUrl = pages[1]?.rasterFallback || '';
      onSaveAnnotation(page1DataUrl);
    }
  }, [exportAll, markSaved, pdfUrl, mode, onSaveAnnotation]);

  // Auto-save only when idle — never during an active stroke (export blocks the main thread)
  useEffect(() => {
    if (!isDirty) return;

    let cancelled = false;
    let debounceTimer: number | undefined;
    let retryTimer: number | undefined;
    let idleCallbackId: number | undefined;

    const runSave = () => {
      if (cancelled) return;

      if (isDrawingActive()) {
        retryTimer = window.setTimeout(runSave, AUTO_SAVE_RETRY_MS);
        return;
      }

      const save = () => {
        if (cancelled || isDrawingActive()) {
          retryTimer = window.setTimeout(runSave, AUTO_SAVE_RETRY_MS);
          return;
        }
        void persistAnnotations();
      };

      if ('requestIdleCallback' in window) {
        idleCallbackId = window.requestIdleCallback(save, { timeout: 8000 });
      } else {
        save();
      }
    };

    debounceTimer = window.setTimeout(runSave, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      let shouldSave = false;
      if (debounceTimer !== undefined) {
        window.clearTimeout(debounceTimer);
        shouldSave = true;
      }
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
        shouldSave = true;
      }
      if (idleCallbackId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
        shouldSave = true;
      }

      if (shouldSave) {
        void persistAnnotations();
      }
    };
  }, [isDirty, isDrawingActive, persistAnnotations]);

  const completeExit = useCallback(() => {
    setShowSaveDialog(false);
    onClose?.();
  }, [onClose]);

  const cancelExit = useCallback(() => {
    setShowSaveDialog(false);
  }, []);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowSaveDialog(true);
      return;
    }
    onClose?.();
  }, [isDirty, onClose]);

  const handleSaveAndExit = useCallback(async () => {
    await persistAnnotations();
    completeExit();
  }, [completeExit, persistAnnotations]);

  const handleDiscardAndExit = useCallback(() => {
    markSaved();
    completeExit();
  }, [completeExit, markSaved]);

  const getPageRestoreGetter = useCallback(
    (pageNum: number) => {
      const cached = pageRestoreGettersRef.current.get(pageNum);
      if (cached) return cached;

      const getter = () =>
        getCachedPage(pageNum) ?? storedPagesRef.current[pageNum] ?? null;
      pageRestoreGettersRef.current.set(pageNum, getter);
      return getter;
    },
    [getCachedPage]
  );

  // Intentionally NOT including zoom here — the buffer should be based on the
  // unscaled page height so that zoom state changes don't trigger buffer
  // recalculation which would mount/unmount pages and shift the document layout.
  const estimatedPageHeight = pageWidth * A4_ASPECT + PAGE_GAP_PX;

  const dynamicBuffer = useMemo(() => {
    const container = scrollContainerRef.current;
    if (!container) return 2;
    const containerHeight = container.clientHeight;
    // Use current zoom from ref (not state) to avoid re-renders during zoom
    const scaledHeight = estimatedPageHeight * (zoomRef.current / 100);
    return Math.ceil(containerHeight / scaledHeight) + 1;
  }, [estimatedPageHeight]);

  // Ensure minimum ±2 buffer always kept loaded
  const effectiveBuffer = Math.max(2, dynamicBuffer);

  const renderStart = Math.max(1, currentPage - effectiveBuffer);
  const renderEnd = Math.min(numPages || 1, currentPage + effectiveBuffer);

  // Update alive pages: add new pages and lazily prune old ones
  useMemo(() => {
    // Add newly visible pages to alive set
    for (let i = renderStart; i <= renderEnd; i++) {
      alivePagesRef.current.add(i);
    }

    // Lazy prune: remove pages too far from current page
    const pruneDistance = effectiveBuffer + 2;
    const toRemove: number[] = [];
    alivePagesRef.current.forEach(page => {
      if (Math.abs(page - currentPage) > pruneDistance) {
        toRemove.push(page);
      }
    });
    toRemove.forEach(page => alivePagesRef.current.delete(page));
  }, [renderStart, renderEnd, currentPage, effectiveBuffer]);

  return (
    <div className={`w-full flex flex-col bg-gray-900 text-gray-100 ${mode === 'modal' ? 'h-screen' : 'h-full'}`}>
      {showSaveDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div
            className="w-full max-w-md rounded-lg bg-gray-800 border border-gray-600 shadow-xl p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-annotations-title"
          >
            <h3 id="save-annotations-title" className="text-lg font-semibold text-gray-100">
              Save annotations?
            </h3>
            <p className="mt-2 text-sm text-gray-300">
              You have unsaved drawing changes. Save them to this device before leaving?
            </p>
            <div className="mt-5 flex flex-wrap gap-2 justify-end">
              <button
                onClick={cancelExit}
                className="px-3 py-1.5 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscardAndExit}
                className="px-3 py-1.5 rounded bg-gray-700 text-gray-200 hover:bg-gray-600 transition text-sm"
              >
                Don&apos;t save
              </button>
              <button
                onClick={handleSaveAndExit}
                className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 transition text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {!hideToolbar && <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 sm:px-4 sm:py-2.5 md:py-3 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {mode === 'inline' && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <button onClick={() => applyZoomAtCursor(zoom - 5)} className={`${iconBtn} ${iconBtnIdle}`} title="Zoom out">
                <ZoomOut className={toolbarIconSize} />
              </button>
              <span className="text-xs sm:text-sm text-gray-300 px-1 text-center tabular-nums">{Math.round(zoom)}%</span>
              <button onClick={() => applyZoomAtCursor(zoom + 5)} className={`${iconBtn} ${iconBtnIdle}`} title="Zoom in">
                <ZoomIn className={toolbarIconSize} />
              </button>

              <div className="w-px h-6 bg-gray-700 mx-0.5" />

              <button
                onClick={() => {
                  setDrawingEnabled(prev => {
                    if (!prev) setDrawTool('pen');
                    return !prev;
                  });
                }}
                className={`${iconBtn} ${drawingEnabled ? 'bg-purple-600 text-white hover:bg-purple-500' : iconBtnIdle}`}
                title={drawingEnabled ? 'Exit annotation mode' : 'Annotate'}
              >
                <PenTool className={toolbarIconSize} />
              </button>

              {drawingEnabled && (
                <>
                  <div className="w-px h-6 bg-gray-700 mx-0.5" />
                  <button onClick={undo} disabled={!canUndo} className={`${iconBtn} ${iconBtnIdle}`} title="Undo"><Undo2 className={toolbarIconSize} /></button>
                  <button onClick={redo} disabled={!canRedo} className={`${iconBtn} ${iconBtnIdle}`} title="Redo"><Redo2 className={toolbarIconSize} /></button>
                  <div className="w-px h-6 bg-gray-700 mx-0.5" />
                  <button onClick={() => setTouchScrollInDrawMode(prev => !prev)} className={`${iconBtn} ${touchScrollInDrawMode ? iconBtnActive : iconBtnIdle}`} title="Finger scroll & pinch zoom" aria-pressed={touchScrollInDrawMode}><Hand className={toolbarIconSize} /></button>
                  <div className="w-px h-6 bg-gray-700 mx-0.5" />
                  <div className="relative tool-dropdown-container">
                    <button onClick={() => { setDrawTool('pen'); setActiveDropdown(activeDropdown === 'pen' ? null : 'pen'); }} className={`${iconBtn} ${drawTool === 'pen' ? iconBtnActive : iconBtnIdle}`} title="Pen"><Pen className={toolbarIconSize} /></button>
                    {activeDropdown === 'pen' && (
                      <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-50 flex flex-col gap-3 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" title="Pen color" />
                          <label className="flex items-center gap-2 text-gray-400 text-xs flex-1">
                            <span>Size</span>
                            <input type="range" min={1} max={20} value={penSize} onChange={e => setPenSize(Number(e.target.value))} className="flex-1 min-w-[4rem]" />
                            <span className="w-4 tabular-nums text-gray-300">{penSize}</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative tool-dropdown-container">
                    <button onClick={() => { setDrawTool(isShapeTool(drawTool) ? drawTool : 'line'); setActiveDropdown(activeDropdown === 'shapes' ? null : 'shapes'); }} className={`${iconBtn} ${isShapeTool(drawTool) ? iconBtnActive : iconBtnIdle}`} title="Shapes"><Shapes className={toolbarIconSize} /></button>
                    {activeDropdown === 'shapes' && (
                      <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-50 flex flex-col gap-3 min-w-[240px]">
                        <div className="flex items-center gap-1 rounded-md overflow-hidden border border-gray-600 w-full mb-1">
                          <button onClick={() => setDrawTool('line')} className={`flex-1 p-2 transition flex justify-center ${drawTool === 'line' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Line"><Minus className={toolbarIconSize} /></button>
                          <button onClick={() => setDrawTool('rectangle')} className={`flex-1 p-2 transition border-x border-gray-600 flex justify-center ${drawTool === 'rectangle' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Rectangle"><Square className={toolbarIconSize} /></button>
                          <button onClick={() => setDrawTool('ellipse')} className={`flex-1 p-2 transition flex justify-center ${drawTool === 'ellipse' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Ellipse"><Circle className={toolbarIconSize} /></button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" title="Stroke color" />
                          <label className="flex items-center gap-2 text-gray-400 text-xs flex-1">
                            <span>Border</span>
                            <input type="range" min={1} max={20} value={penSize} onChange={e => setPenSize(Number(e.target.value))} className="flex-1 min-w-[4rem]" />
                            <span className="w-4 tabular-nums text-gray-300">{penSize}</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative tool-dropdown-container">
                    <button onClick={() => { setDrawTool('eraser'); setActiveDropdown(activeDropdown === 'eraser' ? null : 'eraser'); }} className={`${iconBtn} ${drawTool === 'eraser' ? iconBtnActive : iconBtnIdle}`} title="Eraser"><Eraser className={toolbarIconSize} /></button>
                    {activeDropdown === 'eraser' && (
                      <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-50 flex flex-col gap-3 min-w-[180px]">
                        <label className="flex items-center gap-2 text-gray-400 text-xs flex-1">
                          <span>Size</span>
                          <input type="range" min={1} max={100} value={eraserSize} onChange={e => setEraserSize(Number(e.target.value))} className="flex-1 min-w-[4rem]" />
                          <span className="w-6 tabular-nums text-gray-300">{eraserSize}</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <button onClick={clearAll} className={`${iconBtn} text-red-400 hover:bg-red-900/40`} title="Clear all"><Trash2 className={toolbarIconSize} /></button>
                </>
              )}
            </div>
          )}
          {mode === 'modal' && (
            <>
              <Link
                to="/"
                className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
                title="Learnmates home"
              >
                <img src="/logo.svg" alt="" className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
                <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-100 hidden sm:inline">
                  Learnmates
                </span>
              </Link>
              <div className="w-px h-6 sm:h-7 bg-gray-600 shrink-0 hidden sm:block" />
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h2 className="text-xs sm:text-sm md:text-base text-gray-300 truncate max-w-[10rem] sm:max-w-md md:max-w-xl">
                  {fileName}
                </h2>
                {numPages > 0 && (
                  <span className="text-xs sm:text-sm text-gray-500 shrink-0">{numPages}p</span>
                )}
                {fetchError && (
                  <span className="text-xs text-amber-400 shrink-0" title={fetchError}>⚠</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${iconBtn} ${iconBtnIdle} disabled:opacity-50`}
            title="Previous page"
          >
            <ChevronLeft className={toolbarIconSize} />
          </button>

          <div className="flex items-center bg-gray-700/80 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded text-xs sm:text-sm">
            <input
              type="number"
              min="1"
              max={numPages}
              value={currentPage}
              onChange={e => goToPage(Number(e.target.value))}
              className="bg-transparent text-gray-100 w-8 sm:w-10 text-center outline-none tabular-nums"
            />
            <span className="text-gray-500">/{numPages || '—'}</span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className={`${iconBtn} ${iconBtnIdle} disabled:opacity-50`}
            title="Next page"
          >
            <ChevronRight className={toolbarIconSize} />
          </button>

          {mode === 'modal' && <><div className="w-px h-6 sm:h-7 bg-gray-700 mx-0.5 hidden sm:block" />

            <button
              onClick={() => applyZoomAtCursor(zoom - 5)}
              className={`${iconBtn} ${iconBtnIdle}`}
              title="Zoom out"
            >
              <ZoomOut className={toolbarIconSize} />
            </button>

            <span
              className="text-xs sm:text-sm text-gray-300 px-1.5 sm:px-2 min-w-[2.75rem] sm:min-w-[3.25rem] text-center tabular-nums"
              aria-live="polite"
              aria-label={`Zoom ${Math.round(zoom)}%`}
            >
              {Math.round(zoom)}%
            </span>

            <button
              onClick={() => applyZoomAtCursor(zoom + 5)}
              className={`${iconBtn} ${iconBtnIdle}`}
              title="Zoom in"
            >
              <ZoomIn className={toolbarIconSize} />
            </button>

            <div className="w-px h-6 sm:h-7 bg-gray-700 mx-0.5 hidden sm:block" />

            <button
              onClick={() => {
                setDrawingEnabled(prev => {
                  if (!prev) setDrawTool('pen');
                  return !prev;
                });
              }}
              className={`${iconBtn} ${drawingEnabled ? 'bg-purple-600 text-white hover:bg-purple-500' : iconBtnIdle
                }`}
              title={drawingEnabled ? 'Exit annotation mode' : 'Annotate'}
              aria-pressed={drawingEnabled}
            >
              <PenTool className={toolbarIconSize} />
            </button></>}

          {mode === 'modal' && (
            <button
              onClick={() => startTransition(() => setSidebarOpen(!sidebarOpen))}
              className={`${iconBtn} ${iconBtnIdle}`}
              title="Page list"
            >
              <Menu className={toolbarIconSize} />
            </button>
          )}

          {mode === 'modal' && (
            <>
              <button
                onClick={async () => {
                  setIsSaving(true);
                  await persistAnnotations();
                  setTimeout(() => setIsSaving(false), 500);
                }}
                disabled={!isDirty}
                className={`${iconBtn} ${iconBtnIdle}`}
                title="Save annotations"
              >
                <Save className={toolbarIconSize} />
              </button>

              <button
                onClick={handleDownload}
                className={`${iconBtn} ${iconBtnIdle}`}
                title="Download PDF"
              >
                <Download className={toolbarIconSize} />
              </button>
            </>
          )}

          {onClose && mode === 'modal' && (
            <>
              <div className="w-px h-6 sm:h-7 bg-gray-700 mx-0.5" />
              <button
                onClick={requestClose}
                className={`${iconBtn} ${iconBtnIdle}`}
                title="Close"
              >
                <X className={toolbarIconSize} />
              </button>
            </>
          )}
        </div>
      </div>}

      {drawingEnabled && !hideToolbar && mode === 'modal' && (
        <div className="bg-gray-800/95 border-b border-gray-700 px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`${iconBtn} ${iconBtnIdle}`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className={toolbarIconSize} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`${iconBtn} ${iconBtnIdle}`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className={toolbarIconSize} />
            </button>

            <div className="w-px h-6 sm:h-7 bg-gray-700 mx-0.5" />

            <button
              onClick={() => setTouchScrollInDrawMode(prev => !prev)}
              className={`${iconBtn} ${touchScrollInDrawMode ? iconBtnActive : iconBtnIdle
                }`}
              title="Finger scroll & pinch zoom"
              aria-pressed={touchScrollInDrawMode}
            >
              <Hand className={toolbarIconSize} />
            </button>

            <div className="w-px h-6 sm:h-7 bg-gray-700 mx-0.5" />

            <div className="relative tool-dropdown-container">
              <button onClick={() => { setDrawTool('pen'); setActiveDropdown(activeDropdown === 'pen' ? null : 'pen'); }} className={`${iconBtn} ${drawTool === 'pen' ? iconBtnActive : iconBtnIdle}`} title="Pen"><Pen className={toolbarIconSize} /></button>
              {activeDropdown === 'pen' && (
                <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-50 flex flex-col gap-3 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" title="Pen color" />
                    <label className="flex items-center gap-2 text-gray-400 text-xs flex-1">
                      <span>Size</span>
                      <input type="range" min={1} max={20} value={penSize} onChange={e => setPenSize(Number(e.target.value))} className="flex-1 min-w-[4rem]" />
                      <span className="w-4 tabular-nums text-gray-300">{penSize}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="relative tool-dropdown-container">
              <button onClick={() => { setDrawTool(isShapeTool(drawTool) ? drawTool : 'line'); setActiveDropdown(activeDropdown === 'shapes' ? null : 'shapes'); }} className={`${iconBtn} ${isShapeTool(drawTool) ? iconBtnActive : iconBtnIdle}`} title="Shapes"><Shapes className={toolbarIconSize} /></button>
              {activeDropdown === 'shapes' && (
                <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-50 flex flex-col gap-3 min-w-[240px]">
                  <div className="flex items-center gap-1 rounded-md overflow-hidden border border-gray-600 w-full mb-1">
                    <button onClick={() => setDrawTool('line')} className={`flex-1 p-2 transition flex justify-center ${drawTool === 'line' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Line"><Minus className={toolbarIconSize} /></button>
                    <button onClick={() => setDrawTool('rectangle')} className={`flex-1 p-2 transition border-x border-gray-600 flex justify-center ${drawTool === 'rectangle' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Rectangle"><Square className={toolbarIconSize} /></button>
                    <button onClick={() => setDrawTool('ellipse')} className={`flex-1 p-2 transition flex justify-center ${drawTool === 'ellipse' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`} title="Ellipse"><Circle className={toolbarIconSize} /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" title="Stroke color" />
                    <label className="flex items-center gap-2 text-gray-400 text-xs flex-1">
                      <span>Border</span>
                      <input type="range" min={1} max={20} value={penSize} onChange={e => setPenSize(Number(e.target.value))} className="flex-1 min-w-[4rem]" />
                      <span className="w-4 tabular-nums text-gray-300">{penSize}</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="relative tool-dropdown-container">
              <button onClick={() => { setDrawTool('eraser'); setActiveDropdown(activeDropdown === 'eraser' ? null : 'eraser'); }} className={`${iconBtn} ${drawTool === 'eraser' ? iconBtnActive : iconBtnIdle}`} title="Eraser"><Eraser className={toolbarIconSize} /></button>
              {activeDropdown === 'eraser' && (
                <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-50 flex flex-col gap-3 min-w-[180px]">
                  <label className="flex items-center gap-2 text-gray-400 text-xs flex-1">
                    <span>Size</span>
                    <input type="range" min={1} max={100} value={eraserSize} onChange={e => setEraserSize(Number(e.target.value))} className="flex-1 min-w-[4rem]" />
                    <span className="w-6 tabular-nums text-gray-300">{eraserSize}</span>
                  </label>
                </div>
              )}
            </div>

            <div className="w-px h-6 sm:h-7 bg-gray-700 mx-0.5" />

            <button
              onClick={clearAll}
              className={`${iconBtn} text-red-400 hover:bg-red-900/40`}
              title="Clear all annotations"
            >
              <Trash2 className={toolbarIconSize} />
            </button>
          </div>

          {showPenOptions && (
            <div className="flex items-center gap-3 sm:gap-4 mt-2 pt-2 border-t border-gray-700/70">
              <input
                type="color"
                value={penColor}
                onChange={e => setPenColor(e.target.value)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded cursor-pointer border-0 bg-transparent"
                title="Pen color"
              />
              <label className="flex items-center gap-2 sm:gap-3 text-gray-400 text-xs sm:text-sm flex-1 max-w-sm">
                <span>Size</span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={penSize}
                  onChange={e => setPenSize(Number(e.target.value))}
                  className="flex-1 min-w-[4rem]"
                />
                <span className="w-4 tabular-nums text-gray-300">{penSize}</span>
              </label>
            </div>
          )}

          {showShapeOptions && (
            <div className="flex items-center gap-3 sm:gap-4 mt-2 pt-2 border-t border-gray-700/70 flex-wrap">
              <div className="flex items-center rounded-md overflow-hidden border border-gray-600">
                <button
                  onClick={() => setDrawTool('line')}
                  className={`p-2 sm:p-2.5 transition ${drawTool === 'line' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'
                    }`}
                  title="Line"
                >
                  <Minus className={toolbarIconSize} />
                </button>
                <button
                  onClick={() => setDrawTool('rectangle')}
                  className={`p-2 sm:p-2.5 transition border-x border-gray-600 ${drawTool === 'rectangle'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700'
                    }`}
                  title="Rectangle"
                >
                  <Square className={toolbarIconSize} />
                </button>
                <button
                  onClick={() => setDrawTool('ellipse')}
                  className={`p-2 sm:p-2.5 transition ${drawTool === 'ellipse'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700'
                    }`}
                  title="Ellipse"
                >
                  <Circle className={toolbarIconSize} />
                </button>
              </div>
              <input
                type="color"
                value={penColor}
                onChange={e => setPenColor(e.target.value)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded cursor-pointer border-0 bg-transparent"
                title="Shape color"
              />
              <label className="flex items-center gap-2 sm:gap-3 text-gray-400 text-xs sm:text-sm flex-1 max-w-sm">
                <span>Size</span>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={penSize}
                  onChange={e => setPenSize(Number(e.target.value))}
                  className="flex-1 min-w-[4rem]"
                />
                <span className="w-4 tabular-nums text-gray-300">{penSize}</span>
              </label>
            </div>
          )}

          {showEraserOptions && (
            <div className="flex items-center gap-3 sm:gap-4 mt-2 pt-2 border-t border-gray-700/70">
              <label className="flex items-center gap-2 sm:gap-3 text-gray-400 text-xs sm:text-sm flex-1 max-w-sm">
                <span>Eraser size</span>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={eraserSize}
                  onChange={e => setEraserSize(Number(e.target.value))}
                  className="flex-1 min-w-[4rem]"
                />
                <span className="w-5 tabular-nums text-gray-300">{eraserSize}</span>
              </label>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <div
          ref={setSidebarEl}
          className={`absolute left-0 top-0 bottom-0 bg-gray-800 border-r border-gray-700 overflow-y-auto p-2 sm:p-3 md:p-4 transition-all duration-300 ease-out z-40 w-36 sm:w-44 md:w-52 lg:w-56 ${mode === 'modal' && sidebarOpen ? 'translate-x-0 visible' : '-translate-x-full invisible hidden'
            }`}
        >
          {numPages > 0 ? (
            <>
              <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500 mb-2 sm:mb-3 px-1">
                Pages
              </p>
              <div className="space-y-2 sm:space-y-2.5">
                {Array.from({ length: numPages }, (_, i) => i + 1).map(page =>
                  pdfDoc && thumbnailWidth > 0 ? (
                    <PdfSidebarPageThumb
                      key={page}
                      pdfDoc={pdfDoc}
                      pageNumber={page}
                      thumbnailWidth={thumbnailWidth}
                      cacheKey={pdfUrl}
                      scrollRoot={sidebarEl}
                      eager={page <= 6}
                      isActive={currentPage === page}
                      onSelect={() => goToPage(page)}
                    />
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      className={`w-full aspect-[210/297] rounded border-2 flex items-center justify-center text-sm font-medium transition ${currentPage === page
                        ? 'border-blue-500 bg-blue-600/20 text-blue-200'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-xs text-gray-500 text-center">Loading pages...</div>
            </div>
          )}
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 bg-gray-950 overflow-y-auto overflow-x-auto p-4"
          style={{ touchAction: 'pan-x pan-y pinch-zoom' } as React.CSSProperties}
          data-pdf-scroll-container="true"
        >
          {!pdfFile ? (
            <PdfDocumentSkeleton pageCount={2} />
          ) : (
            <div style={{ width: `max(100%, calc(${pageWidth}px * var(--pdf-zoom, 1)))` }} className="flex flex-col items-center">
              <Document
                file={pdfFile}
                options={documentOptions}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<PdfDocumentSkeleton pageCount={2} />}
                error={<div className="text-red-400 p-8 text-center">Failed to load PDF</div>}
                onLoadError={(error) => console.error('PDF Load Error:', error)}
                className="flex flex-col gap-[calc(12px*var(--pdf-zoom,1))]"
              >
                {numPages > 0 &&
                  Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => {
                    const shouldRenderPage =
                      drawingPages.has(pageNum) ||
                      alivePagesRef.current.has(pageNum);

                    return (
                      <div
                        key={pageNum}
                        style={{ width: `calc(${pageWidth}px * var(--pdf-zoom, 1))` }}
                      >
                        <div
                          ref={setPageRef(pageNum)}
                          data-page={pageNum}
                        >
                          {shouldRenderPage ? (
                            <MemoizedPdfDrawablePage
                              mode={mode}
                              pageNumber={pageNum}
                              pageWidth={pageWidth}
                              zoom={zoom}
                              renderScale={1}
                              drawingEnabled={drawingEnabled}
                              drawTool={drawTool}
                              penColor={penColor}
                              penSize={penSize}
                              eraserSize={eraserSize}
                              onCanvasMount={handleCanvasMount}
                              onActionComplete={handleActionComplete}
                              onDrawingActiveChange={handleDrawingActiveChange}
                              onPageAspectMeasured={handlePageAspectMeasured}
                              allowTouchNavigation={touchScrollInDrawMode}
                              restoredAnnotation={storedPages[pageNum] ?? null}
                              getRestoredAnnotation={getPageRestoreGetter(pageNum)}
                            />
                          ) : (
                            <div
                              className="mx-auto scroll-mt-4 rounded bg-gray-200/40 dark:bg-gray-800/40"
                              style={{
                                width: `calc(${pageWidth}px * var(--pdf-zoom, 1))`,
                                height: `calc(${pageWidth * (pageAspectRatiosRef.current[pageNum] || A4_ASPECT)}px * var(--pdf-zoom, 1))`,
                              }}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
              </Document>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Page {currentPage} of {numPages}</span>
          {isSaving && (
            <span className="flex items-center gap-1 text-blue-400">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
              Saving...
            </span>
          )}
          {isDirty && !isSaving && (
            <span className="text-orange-400">●</span>
          )}
        </div>
        <span>Zoom: {Math.round(zoom)}% · Ctrl+scroll to zoom</span>
      </div>
    </div>
  );
};

export default UniversalDocumentViewer;
