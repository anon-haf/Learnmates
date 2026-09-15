import React, { useEffect, useRef, useState } from 'react';
import { Pen, Maximize2 } from 'lucide-react';
import { pdfjs, pdfGetDocumentOptions } from '../utils/pdfjsConfig';
import { resolveFromR2, fetchR2AsBlobUrl, getAssetAuthHeaders } from '../utils/r2Utils';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface MediaViewerProps {
  url: string;
  type: 'pdf' | 'image';
  markSchemeUrl?: string;
  markSchemeType?: 'pdf' | 'image';
  onLoadComplete?: (numPages: number) => void;
  onMarkCorrect?: () => void;
  onMarkIncorrect?: () => void;
  showMarkingButtons?: boolean;
  savedAnnotation?: string; // Base64 encoded canvas data
  onSaveAnnotation?: (annotationData: string) => void; // Callback to save annotation
  hasMarkScheme?: boolean;
  markSchemeOpen?: boolean;
  onToggleMarkScheme?: (open: boolean) => void;
  // separate mark-scheme annotation props
  savedMarkSchemeAnnotation?: string;
  onSaveMarkSchemeAnnotation?: (annotationData: string) => void;
  // Optional: allow modal to navigate between questions
  questionList?: Array<{ questionContent?: string; questionContentType?: 'image' | 'pdf'; markScheme?: string; markSchemeType?: 'image' | 'pdf'; mcqAnswer?: string }>;
  questionIndex?: number;
  onChangeQuestion?: (newIndex: number) => void;
  // Optional MCQ answer state (used to show A-D choices inside the Large View overlay)
  mcqSelection?: string | null;
  mcqLiveCheck?: boolean;
  onMcqSelect?: (option: string) => void;
  onMcqLiveCheckToggle?: () => void;
  disableR2?: boolean; // when true, skip all R2 fetch attempts
  // When true, hide the internal toolbar so parent can render its own controls
  hideToolbar?: boolean;
  // Optional external control of annotation mode (used when toolbar is hidden)
  forceAnnotationMode?: boolean;
  // When true, hides the "Large View" maximize button
  hideLargeView?: boolean;
}

interface PageRef {
  canvas: HTMLCanvasElement | null;
  annotationCanvas: HTMLCanvasElement | null;
}

const MediaViewer: React.FC<MediaViewerProps> = ({
  url,
  type,
  markSchemeUrl,
  markSchemeType,
  onLoadComplete,
  onMarkCorrect,
  onMarkIncorrect,
  showMarkingButtons = false,
  savedAnnotation,
  onSaveAnnotation,
  hasMarkScheme = false,
  markSchemeOpen = false,
  onToggleMarkScheme,
  savedMarkSchemeAnnotation,
  onSaveMarkSchemeAnnotation,
  questionList,
  questionIndex,
  onChangeQuestion,
  mcqSelection,
  mcqLiveCheck = false,
  onMcqSelect,
  onMcqLiveCheckToggle,
  disableR2 = false,
  hideToolbar = false,
  forceAnnotationMode = false,
  hideLargeView = false,
}) => {
  const effectiveUrl = (markSchemeOpen && markSchemeUrl) ? markSchemeUrl : url;
  const effectiveType = (markSchemeOpen && markSchemeType) ? markSchemeType : type;
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefsMap = useRef<Map<number, PageRef>>(new Map());
  const imageRef = useRef<HTMLImageElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);

  // Move marking buttons below content when the content area is too small
  const markingButtonsRef = useRef<HTMLDivElement | null>(null);
  const [showMarkingBelow, setShowMarkingBelow] = useState(false);
  const MIN_MARKING_CONTENT_HEIGHT = 220; // px
  const MIN_MARKING_CONTENT_WIDTH = 360; // px

  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const ZOOM_SCALE = 5.0;
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [drawMode, setDrawMode] = useState<'pen' | 'eraser'>('pen');
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  // Persistent pen/eraser settings (stored in localStorage)
  const STORAGE_PEN_KEY = 'lm_penSize';
  const STORAGE_ERASER_KEY = 'lm_eraserSize';
  const STORAGE_COLOR_KEY = 'lm_drawColor';

  const [penSize, setPenSize] = useState<number>(() => {
    try {
      const v = localStorage.getItem(STORAGE_PEN_KEY);
      return v ? Number(v) : 3;
    } catch {
      return 3;
    }
  });
  const [eraserSize, setEraserSize] = useState<number>(() => {
    try {
      const v = localStorage.getItem(STORAGE_ERASER_KEY);
      return v ? Number(v) : 20;
    } catch {
      return 20;
    }
  });
  // override drawColor initialiser to load from storage if present
  useEffect(() => {
    try {
      const c = localStorage.getItem(STORAGE_COLOR_KEY);
      if (c) setDrawColor(c);
    } catch {
      // ignore
    }
  }, []);
  const [currentDrawingPageNum, setCurrentDrawingPageNum] = useState<number | null>(null);
  // viewer always shows primary content (question). Parent handles mark-scheme pane.
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageFallbackUrlRef = useRef<string>('');

  // Minimum width (px) required before annotation is enabled; below this, annotation is disabled
  const MIN_ANNOTATION_WIDTH_PX = 360;
  const [canAnnotate, setCanAnnotate] = useState(true);
  // Zoom modal state (opens via the Large View button overlay)
  const [zoomOpen, setZoomOpen] = useState(false);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pdfCanvasObserverRef = useRef<ResizeObserver | null>(null);

  // Zoom modal refs/state (view-only)
  const zoomImageRef = useRef<HTMLImageElement | null>(null);
  const [zoomImageSrc, setZoomImageSrc] = useState<string | null>(null);
  const [modalPages, setModalPages] = useState<string[]>([]); // data URLs or image URLs for modal
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMode, setModalMode] = useState<'question' | 'markscheme'>('question');
  const [modalQuestionIndex, setModalQuestionIndex] = useState<number>(0);
  const modalWrapperRef = useRef<HTMLDivElement | null>(null);
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const [modalZoom, setModalZoom] = useState<number>(1);
  const [topicTags, setTopicTags] = useState<string[]>([]);

  // Modal (Large View) annotation state
  const [modalAnnotate, setModalAnnotate] = useState(false);
  const modalCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const modalImgRefs = useRef<Map<number, HTMLImageElement>>(new Map());
  const modalDrawingPageRef = useRef<number | null>(null);

  // Sync external annotation mode when provided (mainly when toolbar is hidden)
  useEffect(() => {
    if (typeof forceAnnotationMode === 'boolean') {
      // Only enable annotation if allowed by size
      setAnnotationMode(forceAnnotationMode && canAnnotate);
    }
  }, [forceAnnotationMode, canAnnotate]);

  // Helper to remove file extension
  const removeExtension = (url: string): string => {
    return url.replace(/\.(pdf|png|jpg|jpeg|gif|webp)$/i, '');
  };

  // Load topic tags from info.json
  const loadTopicsForFile = async (fileUrl: string) => {
    try {
      setTopicTags([]);
      if (!fileUrl) return;

      // Extract directory path from URL
      let normalizedUrl = fileUrl;
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        try {
          const parsedUrl = new URL(fileUrl);
          normalizedUrl = `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
        } catch {
          normalizedUrl = fileUrl;
        }
      }

      const urlPath = normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`;
      const lastSlash = urlPath.lastIndexOf('/');
      const dirPath = urlPath.substring(0, lastSlash);
      const fileName = urlPath.substring(lastSlash + 1);
      
      // Remove file extension to get the base name (e.g., "Jan 2021 Q1" from "Jan 2021 Q1.pdf")
      const baseFileName = fileName.replace(/\.(pdf|png|jpg|jpeg|gif|webp)$/i, '');
      
      // Try to fetch info.json from the same directory
      const infoJsonPath = `${dirPath}/info.json`;
      const resolvedInfoUrl = shouldUseR2(fileUrl) ? await resolveFromR2(infoJsonPath) : null;
      if (!resolvedInfoUrl) {
        return;
      }
      const response = await fetch(resolvedInfoUrl, { headers: getAssetAuthHeaders() });
      
      if (response.ok) {
        const infoData = await response.json();
        
        // Find the entry that matches this file name
        const matchingEntry = Array.isArray(infoData) 
          ? infoData.find((item) => item.file_name === baseFileName)
          : null;
        
        if (matchingEntry && Array.isArray(matchingEntry.topic_matches)) {
          setTopicTags(matchingEntry.topic_matches);
        }
      }
    } catch (error) {
      console.warn('Failed to load topic tags:', error);
    }
  };

  const shouldUseR2 = (value: string) => {
    if (!value || disableR2) return false;
    const normalized = value.toLowerCase();
    if (normalized.includes('/questions/') || normalized.includes('/topicals/')) return true;
    if (normalized.includes('assets.learnmates.org')) return true;
    return false;
  };

  // Load content (PDF or image)
  useEffect(() => {
    // Cancel any previous render
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const load = async () => {
      const currentUrl = effectiveUrl;
      const currentType = effectiveType;
      
      try {
        setLoading(true);
        setError(null);
        // Reset previous pages so React unmounts old canvases before new PDF renders
        setNumPages(null);
        canvasRefsMap.current.clear();
        renderedPagesRef.current.clear();

        if (currentType === 'pdf') {
          // Clear all canvas content when loading new PDF
          canvasRefsMap.current.forEach((pageRef) => {
            if (pageRef.canvas) {
              const ctx = pageRef.canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, pageRef.canvas.width, pageRef.canvas.height);
              }
            }
            if (pageRef.annotationCanvas) {
              const ctx = pageRef.annotationCanvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, pageRef.annotationCanvas.width, pageRef.annotationCanvas.height);
              }
            }
          });
          
          let pdfUrl = currentUrl;
          if (!pdfUrl.startsWith('http') && !pdfUrl.startsWith('blob:')) {
            pdfUrl = new URL(pdfUrl, window.location.origin).href;
          }

          let pdf: PDFDocumentProxy | null = null;
          if (shouldUseR2(currentUrl) && !disableR2) {
            const r2Url = await resolveFromR2(currentUrl);
            if (!r2Url) {
              throw new Error(`Could not resolve managed asset URL: ${currentUrl}`);
            }

            pdfUrl = r2Url;
            console.log(`[MediaViewer] Using assets URL only: ${pdfUrl}`);

            const blobUrl = await fetchR2AsBlobUrl(pdfUrl);
            if (blobUrl) {
              pdf = await pdfjs.getDocument({
                ...pdfGetDocumentOptions,
                url: blobUrl,
              }).promise;
            } else {
              pdf = await pdfjs.getDocument({
                ...pdfGetDocumentOptions,
                url: pdfUrl,
                httpHeaders: {
                  ...getAssetAuthHeaders(),
                  Accept: 'application/pdf,application/octet-stream,*/*',
                },
              }).promise;
            }
          } else {
            pdf = await pdfjs.getDocument({
              ...pdfGetDocumentOptions,
              url: pdfUrl,
            }).promise;
          }

          if (signal.aborted) return;
          pdfRef.current = pdf;
          setNumPages(pdf.numPages);
          if (onLoadComplete) {
            onLoadComplete(pdf.numPages);
          }
          setImageLoaded(false);
          setError(null);
        } else {
          // Image - for Questions paths, try R2 first
          setNumPages(1);
          setImageLoaded(false);
          imageFallbackUrlRef.current = removeExtension(currentUrl); // Store base URL without extension
          
          if (shouldUseR2(currentUrl) && !disableR2) {
            console.log(`[MediaViewer] Using assets URL only for image: ${currentUrl}`);
            resolveFromR2(currentUrl).then(async r2Url => {
              if (r2Url && imageRef.current) {
                // Native <img src> can never send custom headers, so fetch
                // via blob (which carries the auth header) instead of
                // pointing the <img> tag straight at the R2 URL.
                const blobUrl = await fetchR2AsBlobUrl(r2Url);
                if (blobUrl && imageRef.current) {
                  console.log(`[MediaViewer] Using blob URL for image (from R2)`);
                  imageRef.current.src = blobUrl;
                } else if (imageRef.current) {
                  setError('Failed to resolve image from R2 storage');
                  setLoading(false);
                }
              } else if (imageRef.current) {
                setError('Failed to resolve image from R2 storage');
                setLoading(false);
              }
            }).catch(err => {
              console.error(`[MediaViewer] R2 resolution failed for image:`, err);
              setError('Failed to resolve image from R2 storage');
              setLoading(false);
            });
          } else if (imageRef.current) {
            imageRef.current.src = currentUrl;
          }
        }
      } catch (err: unknown) {
        if (signal.aborted) return;
        const errMsg = err instanceof Error ? err.message : String(err);

        // If PDF parsing fails for a managed asset, surface the direct R2 error instead of falling back to the legacy host.
        if (currentType === 'pdf' && shouldUseR2(currentUrl)) {
          console.error('[MediaViewer] Managed asset load failed:', errMsg);
          setError(`Failed to load managed asset from R2: ${errMsg}`);
          return;
        }
        
        // If PDF parsing fails (or R2 fallback failed), try treating it as an image instead
        if (currentType === 'pdf') {
          console.warn('PDF parsing failed, attempting to load as image:', errMsg);
          try {
            setNumPages(1);
            setImageLoaded(false);
            
            // Extract base URL without extension
            const baseUrl = removeExtension(currentUrl);
            imageFallbackUrlRef.current = baseUrl;
            
            // Try image extensions in order: first try original URL, then alternatives
            // Start with attempt 0 which will use the original URL as-is
            if (imageRef.current) {
              // First attempt: try the original URL as an image (might work if server serves it correctly)
              imageRef.current.src = currentUrl;
            }
            setError(null);
            return;
          } catch {
            // Both PDF and image load failed
          }
        }
        
        const errorMsg = errMsg;
        setError(`Failed to load: ${errorMsg}`);
        console.error('Error loading:', err);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [effectiveUrl, effectiveType, onLoadComplete]);

  useEffect(() => {
    // reset draw mode when content changes but keep user's chosen sizes/colors
    setDrawMode('pen');
    imageFallbackUrlRef.current = ''; // Reset fallback URL
  }, [url, type]);

  // Load topic tags when URL changes
  useEffect(() => {
    loadTopicsForFile(effectiveUrl);
  }, [effectiveUrl]);

  // Watch displayed image or first PDF page size and enable/disable annotation accordingly
  useEffect(() => {
    const updateCanAnnotateFromImage = () => {
      const w = imageRef.current?.clientWidth || 0;
      setCanAnnotate(w >= MIN_ANNOTATION_WIDTH_PX);
    };

    const updateCanAnnotateFromPdf = () => {
      const firstCanvas = canvasRefsMap.current.get(1)?.canvas;
      const w = firstCanvas?.getBoundingClientRect().width || 0;
      setCanAnnotate(w >= MIN_ANNOTATION_WIDTH_PX);
    };

    // Observe image element if present
    if (imageRef.current) {
      updateCanAnnotateFromImage();
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      resizeObserverRef.current = new ResizeObserver(updateCanAnnotateFromImage);
      resizeObserverRef.current.observe(imageRef.current);
      window.addEventListener('resize', updateCanAnnotateFromImage);
    }

    // Observe first PDF canvas if present
    const firstCanvas = canvasRefsMap.current.get(1)?.canvas;
    if (firstCanvas) {
      updateCanAnnotateFromPdf();
      if (pdfCanvasObserverRef.current) pdfCanvasObserverRef.current.disconnect();
      pdfCanvasObserverRef.current = new ResizeObserver(updateCanAnnotateFromPdf);
      pdfCanvasObserverRef.current.observe(firstCanvas);
      window.addEventListener('resize', updateCanAnnotateFromPdf);
    }

    return () => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      if (pdfCanvasObserverRef.current) pdfCanvasObserverRef.current.disconnect();
      window.removeEventListener('resize', updateCanAnnotateFromImage);
      window.removeEventListener('resize', updateCanAnnotateFromPdf);
    };
  }, [imageLoaded, numPages]);

  // If content becomes too small, ensure annotation mode is turned off to avoid UI confusion
  useEffect(() => {
    if (!canAnnotate && annotationMode) {
      setAnnotationMode(false);
    }
  }, [canAnnotate, annotationMode]);

  // Decide whether the marking buttons should be moved below the content if the display area is small
  useEffect(() => {
    const contentEl = pagesContainerRef.current;
    if (!contentEl) return;

    const updateMarkingPosition = () => {
      const rect = contentEl.getBoundingClientRect();
      const tooSmall = rect.width < MIN_MARKING_CONTENT_WIDTH || rect.height < MIN_MARKING_CONTENT_HEIGHT;
      setShowMarkingBelow(tooSmall);
    };

    updateMarkingPosition();
    window.addEventListener('resize', updateMarkingPosition);
    const ro = new ResizeObserver(updateMarkingPosition);
    ro.observe(contentEl);

    return () => {
      window.removeEventListener('resize', updateMarkingPosition);
      ro.disconnect();
    };
  }, [imageLoaded, numPages]);

  // Persist pen/eraser settings and color to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PEN_KEY, String(penSize));
      localStorage.setItem(STORAGE_ERASER_KEY, String(eraserSize));
      localStorage.setItem(STORAGE_COLOR_KEY, drawColor);
    } catch {
      // ignore storage errors
    }
  }, [penSize, eraserSize, drawColor]);

  // Restore saved annotation when content, image load, or annotation mode changes
  useEffect(() => {
    const annotationToRestore = markSchemeOpen ? savedMarkSchemeAnnotation : savedAnnotation;
    if (!annotationToRestore) return;

    // Delay restoration to allow canvases to be properly sized
    const restoreTimer = setTimeout(() => {
      // Make sure annotation canvases match the page canvases before drawing
      canvasRefsMap.current.forEach((pageRef) => {
        if (pageRef.canvas && pageRef.annotationCanvas && pageRef.canvas.width > 0
          && pageRef.annotationCanvas.width !== pageRef.canvas.width) {
          pageRef.annotationCanvas.width = pageRef.canvas.width;
          pageRef.annotationCanvas.height = pageRef.canvas.height;
        }
      });
      if (effectiveType === 'image' && imageRef.current && annotationCanvasRef.current
        && imageRef.current.naturalWidth > 0) {
        annotationCanvasRef.current.width = imageRef.current.naturalWidth;
        annotationCanvasRef.current.height = imageRef.current.naturalHeight;
      }
      restoreAnnotationToPageCanvases(annotationToRestore);
    }, 50);

    return () => clearTimeout(restoreTimer);
  }, [savedAnnotation, savedMarkSchemeAnnotation, imageLoaded, numPages, markSchemeOpen, annotationMode]);

  useEffect(() => {
    setTimeout(() => {
      canvasRefsMap.current.forEach((pageRef) => {
        if (pageRef.canvas && pageRef.annotationCanvas && pageRef.canvas.width > 0) {
          pageRef.annotationCanvas.width = pageRef.canvas.width;
          pageRef.annotationCanvas.height = pageRef.canvas.height;
        }
      });
      // Size image annotation canvas to match image
      if (effectiveType === 'image' && imageRef.current && annotationCanvasRef.current) {
        annotationCanvasRef.current.width = imageRef.current.naturalWidth;
        annotationCanvasRef.current.height = imageRef.current.naturalHeight;
      }
    }, 0);
  }, [annotationMode, numPages, effectiveType, imageLoaded, markSchemeOpen]);

  // Render all PDF pages
  useEffect(() => {
    if (effectiveType !== 'pdf') return;
    const signal = abortControllerRef.current?.signal;

    let observer: IntersectionObserver | null = null;

    const renderAllPages = async () => {
      if (!pdfRef.current || !numPages) return;
      try {
        setLoading(true);
        // Wait for canvas elements to be rendered to the DOM
        await new Promise((resolve) => setTimeout(resolve, 0));

        if (signal?.aborted) return;

        // Save current annotation before rendering new PDF
        let savedAnnotationData: string | null = null;
        try {
          savedAnnotationData = compositeMainAnnotations();
        } catch {
          savedAnnotationData = null;
        }
        const currentPropAnnotation = markSchemeOpen ? savedMarkSchemeAnnotation : savedAnnotation;
        // Prefer the persisted annotation prop (it is authoritative). 
        const annotationToRestore = currentPropAnnotation || savedAnnotationData;

        const renderPage = async (pageNum: number) => {
          if (signal?.aborted || !pdfRef.current) return;
          const pageRef = canvasRefsMap.current.get(pageNum);
          const canvas = pageRef?.canvas;
          const annotationCanvas = pageRef?.annotationCanvas;
          if (!canvas) return;
          
          try {
            const page = await pdfRef.current.getPage(pageNum);
            const viewport = page.getViewport({ scale: ZOOM_SCALE });
            const context = canvas.getContext('2d');
            if (!context) return;
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            if (annotationCanvas) {
              annotationCanvas.width = viewport.width;
              annotationCanvas.height = viewport.height;
            }
            
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };
            
            await page.render(renderContext).promise;
            
            // Remove the placeholder minHeight and set aspect ratio
            canvas.style.minHeight = 'auto';
            canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
            
            if (pageNum === 1) {
              setLoading(false); // Show page 1 immediately
            }
            
            // Restore annotations after this page is rendered so strokes on it appear
            if (annotationToRestore) {
              restoreAnnotationToPageCanvases(annotationToRestore);
            }
          } catch (e) {
            console.error(`Failed to render page ${pageNum}:`, e);
          }
        };

        // Render page 1 first for immediate visual feedback
        renderedPagesRef.current.add(1);
        await renderPage(1);

        // Setup IntersectionObserver for the rest of the pages
        observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const pageNum = Number((entry.target as HTMLElement).dataset.page);
              if (pageNum && !renderedPagesRef.current.has(pageNum)) {
                renderedPagesRef.current.add(pageNum);
                renderPage(pageNum);
              }
            }
          });
        }, { 
          root: pagesContainerRef.current, 
          // Load 1.5 screens ahead and behind to make scrolling seamless
          rootMargin: '150% 0px 150% 0px' 
        });

        // Observe all canvases
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const pageRef = canvasRefsMap.current.get(pageNum);
          if (pageRef?.canvas) {
             pageRef.canvas.dataset.page = String(pageNum);
             if (pageNum > 1) {
               // Give a placeholder minHeight to prevent all pages from intersecting at once initially
               pageRef.canvas.style.minHeight = '80vh';
             }
             observer.observe(pageRef.canvas);
          }
        }

        setError(null);
      } catch (err) {
        if (signal?.aborted) return;
        setError('Failed to render pages');
        console.error('Error rendering pages:', err);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    };
    
    renderAllPages();
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [numPages, effectiveType, effectiveUrl]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const getImageCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    if (!annotationMode) return;
    // Only respond to left-click
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    setCurrentDrawingPageNum(pageNum);
    const pageRef = canvasRefsMap.current.get(pageNum);
    const canvas = pageRef?.annotationCanvas;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(e, canvas);
    lastPointRef.current = { x, y };
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const startImageDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!annotationMode) return;
    // Only respond to left-click
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    setCurrentDrawingPageNum(1);
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getImageCanvasCoords(e, canvas);
    lastPointRef.current = { x, y };
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    if (!isDrawing || !annotationMode || currentDrawingPageNum !== pageNum) return;
    e.preventDefault();
    e.stopPropagation();
    const pageRef = canvasRefsMap.current.get(pageNum);
    const canvas = pageRef?.annotationCanvas;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(e, canvas);
    const ctx = canvas.getContext('2d');
    if (ctx && lastPointRef.current) {
      if (drawMode === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawColor;
        // scale pen size to canvas pixel ratio so visual thickness matches across PDFs/images
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width || 1;
        ctx.lineWidth = penSize * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (lastPointRef.current.x === x && lastPointRef.current.y === y) {
          ctx.beginPath();
          ctx.arc(x, y, (penSize / 2) * scale, 0, 2 * Math.PI);
          ctx.fillStyle = drawColor;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPointRef.current = { x, y };
      } else if (drawMode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width || 1;
        ctx.lineWidth = eraserSize * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPointRef.current = { x, y };
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  const drawImage = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !annotationMode || currentDrawingPageNum !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getImageCanvasCoords(e, canvas);
    const ctx = canvas.getContext('2d');
    if (ctx && lastPointRef.current) {
      if (drawMode === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawColor;
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width || 1;
        ctx.lineWidth = penSize * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (lastPointRef.current.x === x && lastPointRef.current.y === y) {
          ctx.beginPath();
          ctx.arc(x, y, (penSize / 2) * scale, 0, 2 * Math.PI);
          ctx.fillStyle = drawColor;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPointRef.current = { x, y };
      } else if (drawMode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        const rect = canvas.getBoundingClientRect();
        const scale = canvas.width / rect.width || 1;
        ctx.lineWidth = eraserSize * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPointRef.current = { x, y };
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDrawing(false);
    setCurrentDrawingPageNum(null);
    lastPointRef.current = null;
    
    // Save annotation after stroke ends
    let data: string | null = null;
    if (effectiveType === 'pdf') {
      data = compositeMainAnnotations();
    } else {
      const canvas = annotationCanvasRef.current;
      if (canvas) data = canvas.toDataURL();
    }
    if (data) {
      if (markSchemeOpen) {
        if (onSaveMarkSchemeAnnotation) onSaveMarkSchemeAnnotation(data);
      } else {
        if (onSaveAnnotation) onSaveAnnotation(data);
      }
    }
  };

  // Touch-friendly drawing helpers (for mobile/small screens)
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>, pageNum: number) => {
    if (!annotationMode) return;
    e.preventDefault();
    setIsDrawing(true);
    setCurrentDrawingPageNum(pageNum);
    const pageRef = canvasRefsMap.current.get(pageNum);
    const canvas = pageRef?.annotationCanvas;
    if (!canvas) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width || 1;
    const x = (touch.clientX - rect.left) * scale;
    const y = (touch.clientY - rect.top) * scale;
    lastPointRef.current = { x, y };
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>, pageNum: number) => {
    if (!isDrawing || !annotationMode || currentDrawingPageNum !== pageNum) return;
    e.preventDefault();
    const pageRef = canvasRefsMap.current.get(pageNum);
    const canvas = pageRef?.annotationCanvas;
    if (!canvas) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width || 1);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height || 1);
    const ctx = canvas.getContext('2d');
    if (ctx && lastPointRef.current) {
      if (drawMode === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawColor;
        const scale = canvas.width / rect.width || 1;
        ctx.lineWidth = penSize * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (lastPointRef.current.x === x && lastPointRef.current.y === y) {
          ctx.beginPath();
          ctx.arc(x, y, (penSize / 2) * scale, 0, 2 * Math.PI);
          ctx.fillStyle = drawColor;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPointRef.current = { x, y };
      } else if (drawMode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        const scale = canvas.width / rect.width || 1;
        ctx.lineWidth = eraserSize * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPointRef.current = { x, y };
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  const startImageDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!annotationMode) return;
    e.preventDefault();
    setIsDrawing(true);
    setCurrentDrawingPageNum(1);
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width || 1);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height || 1);
    lastPointRef.current = { x, y };
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const drawImageTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !annotationMode || currentDrawingPageNum !== 1) return;
    e.preventDefault();
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width || 1);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height || 1);
    const ctx = canvas.getContext('2d');
    if (ctx && lastPointRef.current) {
      if (drawMode === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawColor;
        const scale = canvas.width / rect.width || 1;
        ctx.lineWidth = penSize * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (lastPointRef.current.x === x && lastPointRef.current.y === y) {
          ctx.beginPath();
          ctx.arc(x, y, (penSize / 2) * scale, 0, 2 * Math.PI);
          ctx.fillStyle = drawColor;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPointRef.current = { x, y };
      } else if (drawMode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        const scale = canvas.width / rect.width || 1;
        ctx.lineWidth = eraserSize * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPointRef.current = { x, y };
        ctx.globalCompositeOperation = 'source-over';
      }
    }
  };

  const stopDrawingTouch = () => {
    // reuse stop logic which also saves the annotation
    stopDrawing();
  };

  // --- Modal (Large View) annotation ---
  const getModalCoords = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width || 1);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height || 1);
    return { x, y };
  };

  const strokeModalSegment = (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width || 1;
    if (drawMode === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = penSize * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (from.x === to.x && from.y === to.y) {
        ctx.beginPath();
        ctx.arc(to.x, to.y, (penSize / 2) * scale, 0, 2 * Math.PI);
        ctx.fillStyle = drawColor;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const sizeModalCanvas = (index: number) => {
    const canvas = modalCanvasRefs.current.get(index);
    const imgEl = modalImgRefs.current.get(index);
    if (canvas && imgEl && imgEl.naturalWidth && imgEl.naturalHeight) {
      if (canvas.width !== imgEl.naturalWidth || canvas.height !== imgEl.naturalHeight) {
        canvas.width = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
      }
    }
  };

  const startModalDrawing = (e: React.MouseEvent<HTMLCanvasElement>, index: number) => {
    if (!modalAnnotate) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    modalDrawingPageRef.current = index;
    const canvas = modalCanvasRefs.current.get(index);
    if (!canvas) return;
    const { x, y } = getModalCoords(e, canvas);
    lastPointRef.current = { x, y };
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const drawModal = (e: React.MouseEvent<HTMLCanvasElement>, index: number) => {
    if (modalDrawingPageRef.current !== index || !lastPointRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = modalCanvasRefs.current.get(index);
    if (!canvas) return;
    const { x, y } = getModalCoords(e, canvas);
    const ctx = canvas.getContext('2d');
    if (ctx && lastPointRef.current) {
      strokeModalSegment(ctx, lastPointRef.current, { x, y }, canvas);
    }
    lastPointRef.current = { x, y };
  };

  const stopModalDrawing = () => {
    if (modalDrawingPageRef.current === null) return;
    modalDrawingPageRef.current = null;
    lastPointRef.current = null;
    // Save the combined annotation layer back to the parent
    const combined = compositeModalAnnotations();
    if (combined) {
      if (modalMode === 'question') {
        if (onSaveAnnotation) onSaveAnnotation(combined);
      } else {
        if (onSaveMarkSchemeAnnotation) onSaveMarkSchemeAnnotation(combined);
      }
    }
  };

  const startModalDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>, index: number) => {
    if (!modalAnnotate) return;
    e.preventDefault();
    e.stopPropagation();
    modalDrawingPageRef.current = index;
    const canvas = modalCanvasRefs.current.get(index);
    if (!canvas) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width || 1);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height || 1);
    lastPointRef.current = { x, y };
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const drawModalTouch = (e: React.TouchEvent<HTMLCanvasElement>, index: number) => {
    if (modalDrawingPageRef.current !== index || !lastPointRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = modalCanvasRefs.current.get(index);
    if (!canvas) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width || 1);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height || 1);
    const ctx = canvas.getContext('2d');
    if (ctx && lastPointRef.current) {
      strokeModalSegment(ctx, lastPointRef.current, { x, y }, canvas);
    }
    lastPointRef.current = { x, y };
  };

  // Combine the modal page annotation canvases into one full-height annotation layer
  const compositeModalAnnotations = (): string | null => {
    const canvases = Array.from(modalCanvasRefs.current.keys())
      .sort((a, b) => a - b)
      .map((i) => modalCanvasRefs.current.get(i))
      .filter((c): c is HTMLCanvasElement => !!c);
    if (canvases.length === 0) return null;

    const totalW = Math.max(...canvases.map((c) => c.width));
    const totalH = canvases.reduce((sum, c) => sum + c.height, 0);
    const out = document.createElement('canvas');
    out.width = totalW;
    out.height = totalH;
    const octx = out.getContext('2d');
    if (!octx) return null;

    let y = 0;
    for (const c of canvases) {
      octx.drawImage(c, 0, y, c.width, c.height);
      y += c.height;
    }
    return out.toDataURL('image/png');
  };

  // Restore the saved annotation layer into the modal canvases (sliced per page)
  const restoreModalAnnotations = () => {
    const ann = modalMode === 'question' ? savedAnnotation : savedMarkSchemeAnnotation;
    if (!ann) return;
    const keys = Array.from(modalCanvasRefs.current.keys()).sort((a, b) => a - b);
    if (keys.length === 0) return;
    const img = new Image();
    img.onload = () => {
      const first = modalCanvasRefs.current.get(keys[0]);
      if (!first) return;
      // Single-frame annotation: draw whole layer on the first page
      if (keys.length === 1 || img.height <= first.height + 2) {
        const canvas = first;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        return;
      }
      // Tall per-page-stacked layer: slice each page's band proportionally
      const totalH = keys.reduce((sum, k) => {
        const c = modalCanvasRefs.current.get(k);
        return sum + (c ? c.height : 0);
      }, 0);
      if (totalH === 0) return;
      let y = 0;
      for (const k of keys) {
        const canvas = modalCanvasRefs.current.get(k);
        if (!canvas) continue;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const srcY = Math.round(img.height * (y / totalH));
        const srcH = Math.round(img.height * (canvas.height / totalH));
        if (srcH > 0) {
          ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, canvas.width, canvas.height);
        }
        y += canvas.height;
      }
    };
    img.src = ann;
  };

  // Size + restore modal annotation canvases whenever modal content is ready
  const refreshModalAnnotations = () => {
    modalCanvasRefs.current.forEach((_, i) => sizeModalCanvas(i));
    restoreModalAnnotations();
  };
  useEffect(() => {
    if (!zoomOpen) return;
    const t = setTimeout(refreshModalAnnotations, 60);
    return () => clearTimeout(t);
  }, [zoomOpen, modalPages, zoomImageSrc]);

  const clearModalAnnotations = () => {
    modalCanvasRefs.current.forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    // Persist the cleared annotation layer
    const combined = compositeModalAnnotations();
    if (combined) {
      if (modalMode === 'question') {
        if (onSaveAnnotation) onSaveAnnotation(combined);
      } else {
        if (onSaveMarkSchemeAnnotation) onSaveMarkSchemeAnnotation(combined);
      }
    }
  };

  // --- Main viewer annotation layer helpers (per-page slicing) ---

  // Stack all PDF page annotation canvases into one tall annotation layer
  const compositeMainAnnotations = (): string | null => {
    const canvases = Array.from(canvasRefsMap.current.entries())
      .filter(([, ref]) => ref.annotationCanvas)
      .sort(([a], [b]) => a - b)
      .map(([, ref]) => ref.annotationCanvas as HTMLCanvasElement);
    if (canvases.length === 0) return null;
    const totalW = Math.max(...canvases.map((c) => c.width));
    const totalH = canvases.reduce((sum, c) => sum + c.height, 0);
    const out = document.createElement('canvas');
    out.width = totalW;
    out.height = totalH;
    const octx = out.getContext('2d');
    if (!octx) return null;
    let y = 0;
    for (const c of canvases) {
      octx.drawImage(c, 0, y, c.width, c.height);
      y += c.height;
    }
    return out.toDataURL('image/png');
  };

  // Restore a (possibly tall, per-page-stacked) annotation layer into the main viewer canvases
  const restoreAnnotationToPageCanvases = (annotationData: string) => {
    if (effectiveType === 'image') {
      const canvas = annotationCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = () => console.warn('Failed to restore annotation');
      img.src = annotationData;
      return;
    }

    const refs = Array.from(canvasRefsMap.current.entries())
      .filter(([, ref]) => ref.annotationCanvas)
      .sort(([a], [b]) => a - b);
    if (refs.length === 0) return;
    const img = new Image();
    img.onload = () => {
      const firstCanvas = refs[0][1].annotationCanvas as HTMLCanvasElement;
      // Single-frame annotation (e.g. saved by the main viewer): draw whole layer on the first page
      if (refs.length === 1 || img.height <= firstCanvas.height + 2) {
        const ctx = firstCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, firstCanvas.width, firstCanvas.height);
          ctx.drawImage(img, 0, 0, firstCanvas.width, firstCanvas.height);
        }
        return;
      }
      // Tall per-page-stacked layer: slice each page's band proportionally
      const totalH = refs.reduce((sum, [, ref]) => sum + (ref.annotationCanvas as HTMLCanvasElement).height, 0);
      if (totalH === 0) return;
      let y = 0;
      for (const [, ref] of refs) {
        const canvas = ref.annotationCanvas as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const srcY = Math.round(img.height * (y / totalH));
        const srcH = Math.round(img.height * (canvas.height / totalH));
        if (srcH > 0) {
          ctx.drawImage(img, 0, srcY, img.width, srcH, 0, 0, canvas.width, canvas.height);
        }
        y += canvas.height;
      }
    };
    img.onerror = () => console.warn('Failed to restore annotation');
    img.src = annotationData;
  };

  // --- Zoom modal helpers ---
  const absUrl = (u: string) => u.startsWith('/') ? new URL(u, window.location.origin).href : u;

  // Load modal content for a specific question index (uses questionList if provided)
  const loadModalForQuestion = async (index: number, mode: 'question' | 'markscheme' = 'question') => {
    setModalPages([]);
    setModalLoading(false);
    setModalMode(mode);

    const q = (questionList && questionList[index]) || null;
    if (q) {
      const url = mode === 'question' ? (q.questionContent || '') : (q.markScheme || '');
      const type = mode === 'question' ? (q.questionContentType || 'image') : (q.markSchemeType || 'image');
      if (!url) {
        setZoomImageSrc(null);
        return;
      }
      if (type === 'image') {
        const src = absUrl(url);
        setZoomImageSrc(src);
        setModalPages([src]);
      } else {
        // pdf - render at a larger scale for the modal
        setZoomImageSrc(null);
        await loadPdfPagesForModal(url);
      }
    } else {
      // Fallback to current effective content
      if (mode === 'question') {
        if (effectiveType === 'image') {
          const src = absUrl(effectiveUrl);
          setZoomImageSrc(src);
          setModalPages([src]);
        } else {
          setZoomImageSrc(null);
          await loadPdfPagesForModal(effectiveUrl);
        }
      } else {
        if (markSchemeType === 'image' && markSchemeUrl) {
          setZoomImageSrc(absUrl(markSchemeUrl));
          setModalPages([absUrl(markSchemeUrl)]);
        } else if (markSchemeType === 'pdf' && markSchemeUrl) {
          setZoomImageSrc(null);
          await loadPdfPagesForModal(markSchemeUrl);
        }
      }
    }
  };

  const openZoomModal = async () => {
    // If a question index is provided, start from that question
    const startIndex = typeof questionIndex === 'number' ? questionIndex : 0;
    setModalQuestionIndex(startIndex);
    await loadModalForQuestion(startIndex, 'question');
    setZoomOpen(true);
    // Scroll to top after modal opens
    setTimeout(() => {
      if (modalContentRef.current) {
        modalContentRef.current.scrollTop = 0;
      }
    }, 0);
  };

  const closeZoomModal = () => {
    setZoomOpen(false);
    setModalZoom(1); // Reset zoom when closing modal
    setModalAnnotate(false);
    modalDrawingPageRef.current = null;
    lastPointRef.current = null;
    modalCanvasRefs.current.clear();
    modalImgRefs.current.clear();
    // If main content is too small, disable annotation mode
    if (!canAnnotate) setAnnotationMode(false);
  }; 

  // Load PDF pages for modal - same as normal but with higher zoom
  const loadPdfPagesForModal = async (pdfUrl: string) => {
    try {
      setModalLoading(true);
      setModalPages([]);
      let url = pdfUrl;
      if (!url.startsWith('http') && !url.startsWith('blob:')) {
        url = new URL(url, window.location.origin).href;
      }
      
      let pdf: PDFDocumentProxy;
      
      if (shouldUseR2(pdfUrl) && !disableR2) {
        const r2Url = await resolveFromR2(pdfUrl);
        if (!r2Url) {
          throw new Error(`Could not resolve managed asset URL: ${pdfUrl}`);
        }

        console.log('[loadPdfPagesForModal] Using assets URL only:', r2Url);
        const blobUrl = await fetchR2AsBlobUrl(r2Url);
        if (blobUrl) {
          pdf = await pdfjs.getDocument({ ...pdfGetDocumentOptions, url: blobUrl }).promise;
        } else {
          pdf = await pdfjs.getDocument({ ...pdfGetDocumentOptions, url: r2Url, httpHeaders: getAssetAuthHeaders() }).promise;
        }
      } else {
        pdf = await pdfjs.getDocument({ ...pdfGetDocumentOptions, url }).promise;
      }
      
      const total = Math.min(pdf.numPages, 50);
      
      // Get first page to determine target width
      let targetWidth = 1000; // default fallback
      try {
        const firstPage = await pdf.getPage(1);
        const firstViewport = firstPage.getViewport({ scale: 5.0 });
        targetWidth = Math.floor(firstViewport.width);
        console.log('[loadPdfPagesForModal] Target width (from first page at 5.0x):', targetWidth);
      } catch (e) {
        console.warn('[loadPdfPagesForModal] Failed to get first page for width calculation:', e);
      }

      for (let p = 1; p <= total; p++) {
        try {
          const page = await pdf.getPage(p);
          // Get unscaled viewport to calculate aspect ratio
          const unscaled = page.getViewport({ scale: 1.0 });
          // Calculate scale needed to match target width
          const scale = targetWidth / unscaled.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          // Set canvas width to EXACTLY targetWidth to ensure all pages have identical width
          canvas.width = targetWidth;
          // Compute height based on aspect ratio to preserve proportions
          canvas.height = Math.round(targetWidth * (unscaled.height / unscaled.width));
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Use the original viewport but set exact canvas dimensions
            // This ensures pdfjs renders all pages consistently at the same pixel width
            await page.render({ canvasContext: ctx, viewport }).promise;
            const data = canvas.toDataURL('image/png');
            setModalPages(prev => [...prev, data]);
          }
        } catch (e) {
          console.warn('Failed to render PDF page for modal', p, e);
        }
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (e) {
      console.error('Error loading pdf for modal:', e);
    } finally {
      setModalLoading(false);
    }
  };

  // Load PDF pages into data URLs progressively (used by modal)
  const loadPdfPages = async (pdfUrl: string) => {
    try {
      setModalLoading(true);
      setModalPages([]);
      let url = pdfUrl;
      if (!url.startsWith('http') && !url.startsWith('blob:')) {
        url = new URL(url, window.location.origin).href;
      }
      
      let pdf: PDFDocumentProxy;
      
      if (shouldUseR2(pdfUrl) && !disableR2) {
        const r2Url = await resolveFromR2(pdfUrl);
        if (!r2Url) {
          throw new Error(`Could not resolve managed asset URL: ${pdfUrl}`);
        }

        console.log('[loadPdfPages] Using assets URL only:', r2Url);
        const blobUrl = await fetchR2AsBlobUrl(r2Url);
        if (blobUrl) {
          pdf = await pdfjs.getDocument({ ...pdfGetDocumentOptions, url: blobUrl }).promise;
        } else {
          pdf = await pdfjs.getDocument({ ...pdfGetDocumentOptions, url: r2Url, httpHeaders: getAssetAuthHeaders() }).promise;
        }
      } else {
        pdf = await pdfjs.getDocument({ ...pdfGetDocumentOptions, url }).promise;
      }
      
      const total = Math.min(pdf.numPages, 50);
      // Just use simple zoom scale for basic PDF rendering (fallback function)
      const ZOOM_SCALE = 5.0;

      for (let p = 1; p <= total; p++) {
        try {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: ZOOM_SCALE });
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          const ctx = canvas.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            const data = canvas.toDataURL('image/png');
            setModalPages(prev => [...prev, data]);
          }
        } catch (e) {
          console.warn('Failed to render PDF page for modal', p, e);
        }
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (e) {
      console.error('Error loading pdf for modal:', e);
    } finally {
      setModalLoading(false);
    }
  };

  // Scroll modal content to top whenever pages load
  useEffect(() => {
    if (modalContentRef.current && modalPages.length > 0) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [modalPages]);

  // Handle Ctrl+scroll zoom in modal (works in Firefox and other browsers)
  useEffect(() => {
    if (!zoomOpen || !modalContentRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setModalZoom(prev => {
          const newZoom = e.deltaY > 0 
            ? Math.max(0.5, prev - 0.1) 
            : Math.min(3, prev + 0.1);
          return newZoom;
        });
      }
    };

    const element = modalContentRef.current;
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [zoomOpen]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomOpen) closeZoomModal();
      if (!zoomOpen) return;
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && questionList && questionList.length > 0) {
        if (e.key === 'ArrowLeft') {
          const prev = Math.max(0, modalQuestionIndex - 1);
          if (prev !== modalQuestionIndex) {
            setModalQuestionIndex(prev);
            loadModalForQuestion(prev, modalMode);
            if (onChangeQuestion) onChangeQuestion(prev);
          }
        } else if (e.key === 'ArrowRight') {
          const next = Math.min(questionList.length - 1, modalQuestionIndex + 1);
          if (next !== modalQuestionIndex) {
            setModalQuestionIndex(next);
            loadModalForQuestion(next, modalMode);
            if (onChangeQuestion) onChangeQuestion(next);
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomOpen, modalQuestionIndex, modalMode, questionList, onChangeQuestion]);
  
  const clearAnnotations = () => {
    canvasRefsMap.current.forEach((pageRef) => {
      if (pageRef.annotationCanvas) {
        const ctx = pageRef.annotationCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, pageRef.annotationCanvas.width, pageRef.annotationCanvas.height);
        }
      }
    });
    if (annotationCanvasRef.current) {
      const ctx = annotationCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, annotationCanvasRef.current.width, annotationCanvasRef.current.height);
      }
    }
    // Persist the cleared annotation layer so it stays cleared
    let data: string | null = null;
    if (effectiveType === 'pdf') {
      data = compositeMainAnnotations();
    } else {
      const canvas = annotationCanvasRef.current;
      if (canvas) data = canvas.toDataURL();
    }
    if (data) {
      if (markSchemeOpen) {
        if (onSaveMarkSchemeAnnotation) onSaveMarkSchemeAnnotation(data);
      } else {
        if (onSaveAnnotation) onSaveAnnotation(data);
      }
    }
  }; 

  // Current MCQ answer for the modal question (if it is an MCQ question)
  const currentMcqAnswer = questionList?.[modalQuestionIndex]?.mcqAnswer;

  if (error) {
    return (
      <div className="w-full rounded bg-red-100 dark:bg-red-900 p-4 text-red-700 dark:text-red-200">
        <p className="font-semibold">Error loading content</p>
        <p className="text-sm">{error}</p>
        <p className="text-xs mt-2 opacity-75">URL: {url}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col min-h-0 overflow-visible h-full w-full bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700"
    >
      {/* Toolbar */}
      {!hideToolbar && (
      <div className="bg-gray-200 dark:bg-gray-800 p-3 flex items-center justify-between border-b border-gray-300 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {loading ? 'Loading...' : (effectiveType === 'pdf' ? `${numPages || '?'} pages` : (markSchemeOpen ? 'Mark Scheme Image' : 'Question Image'))}
          </span>
          {hasMarkScheme && (
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              markSchemeOpen ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {markSchemeOpen ? 'MARK SCHEME' : 'QUESTION'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasMarkScheme && (
            <>
              <div className="w-px h-6 bg-gray-400 dark:bg-gray-600" />
              <button
                onClick={() => onToggleMarkScheme && onToggleMarkScheme(!markSchemeOpen)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  markSchemeOpen
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="Toggle mark scheme"
              >
                {markSchemeOpen ? 'Question' : 'Mark Scheme'}
              </button>
            </>
          )}

          {canAnnotate && (
            <button
              onClick={() => setAnnotationMode(prev => !prev)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                annotationMode
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
              title="Toggle annotation mode"
            >
              <Pen className="w-4 h-4" />
              Annotate
            </button>
          )}  


          {showMarkingButtons && !showMarkingBelow && (
            <>
              <div className="w-px h-6 bg-gray-400 dark:bg-gray-600" />
              <button
                onClick={onMarkCorrect}
                className="px-3 py-1.5 rounded text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
                title="Mark as correct"
              >
                ✓ Correct
              </button>
              <button
                onClick={onMarkIncorrect}
                className="px-3 py-1.5 rounded text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                title="Mark as incorrect"
              >
                ✗ Wrong
              </button>
            </>
          )} 
        </div>
      </div>
      )}

      {/* Topic Tags Section */}
      {topicTags.length > 0 && !hideToolbar && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Topics:</span>
          {topicTags.map((topic, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Marking buttons moved below content when screen is small */}
      {showMarkingBelow && showMarkingButtons && (
        <div ref={markingButtonsRef} className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={onMarkCorrect}
            className="px-4 py-2 rounded text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
            title="Mark as correct"
          >
            ✓ Correct
          </button>
          <button
            onClick={onMarkIncorrect}
            className="px-4 py-2 rounded text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
            title="Mark as incorrect"
          >
            ✗ Wrong
          </button>
        </div>
      )}

      {/* Zoom Modal (in-app, opens via the Large View button) */}
      {zoomOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-60 p-6">
          <div ref={modalWrapperRef} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden max-w-[90vw] max-h-[90vh] w-full flex flex-col">
                  <div className="p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-lg font-semibold whitespace-nowrap">Large View</h3>
                {modalLoading && (
                  <span className="text-xs sm:text-sm text-gray-500">Loading...</span>
                )}
                {/* Show question index when available */}
                {typeof questionIndex === 'number' && questionList && (
                  <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                    <span className="sm:hidden">Q</span>
                    <span className="hidden sm:inline">Question</span> {modalQuestionIndex + 1} of {questionList.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Prev/Next question buttons (work when questionList is provided) */}
                {questionList && questionList.length > 0 && (
                  <>
                    <button
                      onClick={async () => {
                        const prev = Math.max(0, modalQuestionIndex - 1);
                        setModalQuestionIndex(prev);
                        await loadModalForQuestion(prev, modalMode);
                        if (onChangeQuestion) onChangeQuestion(prev);
                        // Scroll to top after loading
                        setTimeout(() => {
                          if (modalContentRef.current) modalContentRef.current.scrollTop = 0;
                        }, 0);
                      }}
                      disabled={modalQuestionIndex === 0}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-white dark:bg-gray-800 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-200"
                      title="Previous question"
                    >
                      <span className="sm:hidden">←</span>
                      <span className="hidden sm:inline">← Prev</span>
                    </button>
                    <button
                      onClick={async () => {
                        const next = Math.min((questionList?.length || 1) - 1, modalQuestionIndex + 1);
                        setModalQuestionIndex(next);
                        await loadModalForQuestion(next, modalMode);
                        if (onChangeQuestion) onChangeQuestion(next);
                        // Scroll to top after loading
                        setTimeout(() => {
                          if (modalContentRef.current) modalContentRef.current.scrollTop = 0;
                        }, 0);
                      }}
                      disabled={modalQuestionIndex >= (questionList.length - 1)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-white dark:bg-gray-800 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-200"
                      title="Next question"
                    >
                      <span className="hidden sm:inline">Next →</span>
                      <span className="sm:hidden">→</span>
                    </button>
                  </>
                )}

                {/* Toggle between Question and Mark Scheme inside modal (hidden for MCQ questions) */}
                {hasMarkScheme && markSchemeUrl && !currentMcqAnswer && (
                  <button
                    onClick={async () => {
                      const nextMode = modalMode === 'question' ? 'markscheme' : 'question';
                      setModalMode(nextMode);
                      if (questionList && questionList[modalQuestionIndex]) {
                        await loadModalForQuestion(modalQuestionIndex, nextMode);
                      } else {
                        // fallback to effective urls
                        if (nextMode === 'markscheme') {
                          if (markSchemeType === 'pdf' && markSchemeUrl) await loadPdfPages(markSchemeUrl);
                          else if (markSchemeUrl) setModalPages([absUrl(markSchemeUrl)]);
                        } else {
                          if (effectiveType === 'pdf') await loadPdfPages(effectiveUrl);
                          else setModalPages([absUrl(effectiveUrl)]);
                        }
                      }
                      // Scroll to top after loading
                      setTimeout(() => {
                        if (modalContentRef.current) modalContentRef.current.scrollTop = 0;
                      }, 0);
                    }}
                    title="Toggle mark scheme"
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-200"
                  >
                    {modalMode === 'question' ? 'Mark Scheme' : 'Question'}
                  </button>
                )}

                {/* Annotate toggle inside modal */}
                <button
                  onClick={() => setModalAnnotate(prev => !prev)}
                  className={`hidden sm:flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm md:text-base transition-colors ${
                    modalAnnotate
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title="Toggle annotation mode"
                >
                  <Pen className="w-4 h-4" />
                  Annotate
                </button>

                {/* Zoom controls */}
                <button
                  onClick={() => setModalZoom(prev => Math.max(0.5, prev - 0.1))}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-200"
                  title="Zoom out"
                >
                  −
                </button>
                <span className="text-xs text-gray-600 dark:text-gray-400 px-2">{Math.round(modalZoom * 100)}%</span>
                <button
                  onClick={() => setModalZoom(prev => Math.min(3, prev + 0.1))}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-200"
                  title="Zoom in"
                >
                  +
                </button>

                <button onClick={closeZoomModal} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-red-500 text-white text-sm">Close</button>
              </div>
            </div>

            {/* Modal annotation toolbar */}
            {modalAnnotate && (
              <div className="bg-gray-300 dark:bg-gray-700 p-2 flex flex-wrap items-center gap-2 border-b border-gray-400 dark:border-gray-600">
                <button
                  onClick={() => setDrawMode('pen')}
                  className={`px-2 py-1 rounded text-sm ${
                    drawMode === 'pen'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  Pen
                </button>
                <button
                  onClick={() => setDrawMode('eraser')}
                  className={`px-2 py-1 rounded text-sm ${
                    drawMode === 'eraser'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  Eraser
                </button>
                <label className="flex items-center gap-1 text-xs">
                  <span>Size</span>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={penSize}
                    onChange={e => setPenSize(Number(e.target.value))}
                    disabled={drawMode !== 'pen'}
                  />
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <span>Eraser</span>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={eraserSize}
                    onChange={e => setEraserSize(Number(e.target.value))}
                    disabled={drawMode !== 'eraser'}
                  />
                </label>
                <input
                  type="color"
                  value={drawColor}
                  onChange={(e) => setDrawColor(e.target.value)}
                  className="w-8 h-8 cursor-pointer rounded"
                  title="Pen color"
                />
                <button
                  onClick={clearModalAnnotations}
                  className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Clear
                </button>
              </div>
            )}

            <div 
              ref={modalContentRef} 
              className="p-4 overflow-auto flex-1 min-h-0 flex flex-col items-center justify-start" 
              style={{ minHeight: 320 }}
            >
              {modalLoading ? (
                <div className="text-center text-gray-500">Loading pages…</div>
              ) : modalPages.length > 0 ? (
                <div className="flex flex-col items-center gap-6" style={{ transform: `scale(${modalZoom})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out' }}>
                  {modalPages.map((p, i) => {
                    // Calculate dynamic margins based on zoom level
                    // Higher zoom = less margin, lower zoom = more margin
                    const marginMultiplier = 1 / modalZoom;
                    const marginVw = 5 * marginMultiplier;
                    const marginRem = 1 * marginMultiplier;
                    const widthVw = 10 * marginMultiplier;
                    const widthRem = 2 * marginMultiplier;
                    
                    return (
                      <div key={i} className="relative" style={{
                        maxWidth: `calc(100% - max(${widthVw}vw, ${widthRem}rem))`,
                        marginLeft: `max(${marginVw}vw, ${marginRem}rem)`,
                        marginRight: `max(${marginVw}vw, ${marginRem}rem)`
                      }}>
                        <img
                          src={p}
                          alt={`Page ${i + 1}`}
                          ref={(el) => {
                            if (el) {
                              modalImgRefs.current.set(i, el);
                              sizeModalCanvas(i);
                            } else {
                              modalImgRefs.current.delete(i);
                            }
                          }}
                          onLoad={() => { sizeModalCanvas(i); setTimeout(refreshModalAnnotations, 0); }}
                          className="block"
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            display: 'block'
                          }}
                        />
                        <canvas
                          ref={(el) => {
                            if (el) {
                              modalCanvasRefs.current.set(i, el);
                              sizeModalCanvas(i);
                            } else {
                              modalCanvasRefs.current.delete(i);
                            }
                          }}
                          className={`absolute top-0 left-0 ${modalAnnotate ? 'cursor-crosshair' : 'pointer-events-none'}`}
                          style={{
                            display: 'block',
                            width: '100%',
                            height: '100%',
                            zIndex: 10
                          }}
                          onMouseDown={(e) => startModalDrawing(e, i)}
                          onMouseMove={(e) => drawModal(e, i)}
                          onMouseUp={(e) => { e.stopPropagation(); stopModalDrawing(); }}
                          onMouseLeave={(e) => { e.stopPropagation(); stopModalDrawing(); }}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onTouchStart={(e) => startModalDrawingTouch(e, i)}
                          onTouchMove={(e) => drawModalTouch(e, i)}
                          onTouchEnd={(e) => { e.stopPropagation(); stopModalDrawing(); }}
                          onTouchCancel={(e) => { e.stopPropagation(); stopModalDrawing(); }}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : zoomImageSrc ? (
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <img
                    ref={(el) => {
                      zoomImageRef.current = el;
                      if (el) {
                        modalImgRefs.current.set(0, el);
                        sizeModalCanvas(0);
                      } else {
                        modalImgRefs.current.delete(0);
                      }
                    }}
                    src={zoomImageSrc}
                    alt="Zoomed content"
                    onLoad={() => { sizeModalCanvas(0); setTimeout(refreshModalAnnotations, 0); }}
                    className="block"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      maxHeight: '80vh'
                    }}
                  />
                  <canvas
                    ref={(el) => {
                      if (el) {
                        modalCanvasRefs.current.set(0, el);
                        sizeModalCanvas(0);
                      } else {
                        modalCanvasRefs.current.delete(0);
                      }
                    }}
                    className={`absolute top-0 left-0 ${modalAnnotate ? 'cursor-crosshair' : 'pointer-events-none'}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      zIndex: 10
                    }}
                    onMouseDown={(e) => startModalDrawing(e, 0)}
                    onMouseMove={(e) => drawModal(e, 0)}
                    onMouseUp={(e) => { e.stopPropagation(); stopModalDrawing(); }}
                    onMouseLeave={(e) => { e.stopPropagation(); stopModalDrawing(); }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onTouchStart={(e) => startModalDrawingTouch(e, 0)}
                    onTouchMove={(e) => drawModalTouch(e, 0)}
                    onTouchEnd={(e) => { e.stopPropagation(); stopModalDrawing(); }}
                    onTouchCancel={(e) => { e.stopPropagation(); stopModalDrawing(); }}
                  />
                </div>
              ) : (
                <p className="text-gray-500">Unable to prepare zoom view</p>
              )}
            </div>

            {/* MCQ practice panel (shown below content for MCQ questions) */}
            {currentMcqAnswer && (
              <div className="shrink-0 mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100/70 dark:bg-gray-800/60 p-3 sm:p-4 w-full">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">MCQ practice</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Choose A–D below. Live checking is optional.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { if (onMcqLiveCheckToggle) onMcqLiveCheckToggle(); }}
                      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors mt-0.5 ${
                        mcqLiveCheck
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      }`}
                    >
                      {mcqLiveCheck ? 'Live check: On' : 'Live check: Off'}
                    </button>
                  </div>

                  <div className="flex items-stretch justify-center py-4">
                    <div className="flex items-stretch gap-4 w-full max-w-md mx-auto">
                      {['A', 'B', 'C', 'D'].map(option => {
                        const isSelected = mcqSelection === option;
                        const showAnswers = mcqLiveCheck && mcqSelection !== null;
                        const isCorrectOption = showAnswers && currentMcqAnswer === option;
                        const isSelectedWrong = showAnswers && isSelected && currentMcqAnswer !== option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => { if (onMcqSelect) onMcqSelect(option); }}
                            className={`flex-1 aspect-square min-w-[56px] max-w-[120px] rounded-full border text-lg font-bold uppercase transition-colors duration-200 flex items-center justify-center ${
                              isCorrectOption
                                ? 'border-green-600 bg-green-600 text-white'
                                : isSelectedWrong
                                  ? 'border-red-600 bg-red-600 text-white'
                                  : isSelected
                                    ? 'border-gray-700 bg-gray-700 dark:border-gray-500 dark:bg-gray-600 text-white'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between h-5">
                    {mcqSelection ? (
                      !mcqLiveCheck && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Answer recorded.</p>
                      )
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Annotation Tools */}
      {annotationMode && (
        <div className="bg-gray-300 dark:bg-gray-700 p-2 flex items-center gap-2 border-b border-gray-400 dark:border-gray-600">
          <button
            onClick={() => setDrawMode('pen')}
            className={`px-2 py-1 rounded text-sm ${
              drawMode === 'pen'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200'
            }`}
          >
            Pen
          </button>
          <label className="flex items-center gap-1 text-xs">
            <span>Size</span>
            <input
              type="range"
              min={1}
              max={20}
              value={penSize}
              onChange={e => setPenSize(Number(e.target.value))}
              disabled={drawMode !== 'pen'}
            />
            <span>{penSize}</span>
          </label>
          <button
            onClick={() => setDrawMode('eraser')}
            className={`px-2 py-1 rounded text-sm ${
              drawMode === 'eraser'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200'
            }`}
          >
            Eraser
          </button>
          <label className="flex items-center gap-1 text-xs">
            <span>Size</span>
            <input
              type="range"
              min={5}
              max={60}
              value={eraserSize}
              onChange={e => setEraserSize(Number(e.target.value))}
              disabled={drawMode !== 'eraser'}
            />
            <span>{eraserSize}</span>
          </label>
          <input
            type="color"
            value={drawColor}
            onChange={(e) => setDrawColor(e.target.value)}
            className="w-8 h-8 cursor-pointer rounded"
            title="Pen color"
          />
          <button
            onClick={clearAnnotations}
            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Clear
          </button>
        </div>
      )}

      {/* Content Container */}
      <div className="relative flex-1 min-h-0 w-full">
        {/* Large View button overlay — sticky so it stays put while the PDF scrolls */}
        {!hideLargeView && (
          <div className="sticky top-0 z-20 flex justify-end pr-3 pointer-events-none" style={{ height: 0 }}>
            <button
              onClick={openZoomModal}
              title="Large View"
              aria-label="Open large view"
              className="pointer-events-auto mt-3 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        )}
        <div
          ref={pagesContainerRef}
          data-type={markSchemeOpen ? 'marking_scheme' : 'question'}
          className={`h-full w-full bg-gray-50 dark:bg-gray-950 p-0 overflow-y-auto overflow-x-hidden`}
          style={{ minHeight: 0 }}
        >
        <div className="flex flex-col gap-2 items-start w-full justify-start">
          {effectiveType === 'pdf' && numPages ? (
            Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
              if (!canvasRefsMap.current.has(pageNum)) {
                canvasRefsMap.current.set(pageNum, {
                  canvas: null,
                  annotationCanvas: null
                });
              }

              return (
                <div key={pageNum} className="relative inline-block">
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <canvas
                      ref={(el) => {
                        if (el) {
                          const pageRef = canvasRefsMap.current.get(pageNum) || {
                            canvas: null,
                            annotationCanvas: null
                          };
                          pageRef.canvas = el;
                          canvasRefsMap.current.set(pageNum, pageRef);
                        }
                      }}
                      className="bg-white shadow-lg rounded block"
                      style={{
                        height: 'auto',
                        display: 'block',
                        width: '100%'
                      }}
                    />
                    <canvas
                      ref={(el) => {
                        if (el) {
                          const pageRef = canvasRefsMap.current.get(pageNum) || {
                            canvas: null,
                            annotationCanvas: null
                          };
                          pageRef.annotationCanvas = el;
                          canvasRefsMap.current.set(pageNum, pageRef);
                        }
                      }}
                      className={`absolute top-0 left-0 rounded ${annotationMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        zIndex: 10
                      }}
                      onMouseDown={(e) => { e.stopPropagation(); startDrawing(e, pageNum); }}
                      onMouseMove={(e) => { e.stopPropagation(); draw(e, pageNum); }}
                      onMouseUp={(e) => { e.stopPropagation(); stopDrawing(e); }}
                      onMouseLeave={(e) => { e.stopPropagation(); stopDrawing(e); }}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onTouchStart={(e) => { e.stopPropagation(); startDrawingTouch(e, pageNum); }}
                      onTouchMove={(e) => { e.stopPropagation(); drawTouch(e, pageNum); }}
                      onTouchEnd={(e) => { e.stopPropagation(); stopDrawingTouch(); }}
                      onTouchCancel={(e) => { e.stopPropagation(); stopDrawingTouch(); }} 
                    />
                  </div>
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Page {pageNum}
                  </div>
                </div>
              );
            })
          ) : effectiveType === 'image' ? (
            <div className="relative inline-block">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  ref={imageRef}
                  onLoad={() => {
                    setImageLoaded(true);
                    setLoading(false);
                  }}
                  onError={() => {
                    console.error(`[MediaViewer] Failed to load image from asset URL: ${effectiveUrl}`);
                    setError('Failed to load image from R2 storage');
                    setLoading(false);
                  }}
                  className="bg-white shadow-lg rounded max-w-full h-auto"
                  alt="Content"
                  style={{
                    display: 'block',
                    width: '100%'
                  }}
                />
                <canvas
                  ref={annotationCanvasRef}
                  className={`absolute top-0 left-0 rounded ${annotationMode && imageLoaded ? 'cursor-crosshair' : 'pointer-events-none'}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 10
                  }}
                  width={imageRef.current?.width || 0}
                  height={imageRef.current?.height || 0}
                  onMouseDown={(e) => { e.stopPropagation(); startImageDrawing(e); }}
                  onMouseMove={(e) => { e.stopPropagation(); drawImage(e); }}
                  onMouseUp={(e) => { e.stopPropagation(); stopDrawing(e); }}
                  onMouseLeave={(e) => { e.stopPropagation(); stopDrawing(e); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onTouchStart={(e) => { e.stopPropagation(); startImageDrawingTouch(e); }}
                  onTouchMove={(e) => { e.stopPropagation(); drawImageTouch(e); }}
                  onTouchEnd={(e) => { e.stopPropagation(); stopDrawingTouch(); }}
                  onTouchCancel={(e) => { e.stopPropagation(); stopDrawingTouch(); }}
                />
              </div>
            </div>
          ) : null}
          </div>
        </div>
      </div>

    </div>
  );
};

export default MediaViewer;
 