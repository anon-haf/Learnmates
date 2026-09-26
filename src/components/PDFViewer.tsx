import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Pen } from 'lucide-react';
import { pdfjs, pdfGetDocumentOptions } from '../utils/pdfjsConfig';
import { resolveFromR2, getAssetAuthHeaders } from '../utils/r2Utils';

interface PDFViewerProps {
  pdfUrl: string;
  markSchemePdfUrl?: string;
  onLoadComplete?: (numPages: number) => void;
  onMarkCorrect?: () => void;
  onMarkIncorrect?: () => void;
  showMarkingButtons?: boolean;
}

interface PageRef {
  canvas: HTMLCanvasElement | null;
  annotationCanvas: HTMLCanvasElement | null;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  markSchemePdfUrl,
  onLoadComplete,
  onMarkCorrect,
  onMarkIncorrect,
  showMarkingButtons = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefsMap = useRef<Map<number, PageRef>>(new Map());
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  // Remove zoom state, always render at highest quality
  const ZOOM_SCALE = 2.0; // Highest quality
  const pdfRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [drawMode, setDrawMode] = useState<'pen' | 'eraser'>('pen');
  // For smoothing pen
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [penSize, setPenSize] = useState(3);
  const [eraserSize, setEraserSize] = useState(20);
  const [currentDrawingPageNum, setCurrentDrawingPageNum] = useState<number | null>(null);
  const [showMarkScheme, setShowMarkScheme] = useState(false);

  // Load PDF on mount
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the appropriate PDF URL based on showMarkScheme state
        const currentPdfUrl = showMarkScheme && markSchemePdfUrl ? markSchemePdfUrl : pdfUrl;

        const resolvedUrl = (await resolveFromR2(currentPdfUrl)) || currentPdfUrl;
        let url = resolvedUrl;
        if (!url.startsWith('http') && !url.startsWith('blob:')) {
          url = new URL(resolvedUrl, window.location.origin).href;
        }

        const pdf = await pdfjs.getDocument({
          ...pdfGetDocumentOptions,
          url,
          httpHeaders: getAssetAuthHeaders(),
        }).promise;

        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        if (onLoadComplete) {
          onLoadComplete(pdf.numPages);
        }
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        setError(`Failed to load PDF: ${errorMsg}`);
        console.error('Error loading PDF:', err);
      } finally {
        setLoading(false);
      }
    };

    if (pdfUrl || markSchemePdfUrl) {
      loadPDF();
    }
  }, [pdfUrl, markSchemePdfUrl, onLoadComplete, showMarkScheme]);


  // Reset pen/eraser size and draw mode when PDF or mark scheme changes
  useEffect(() => {
    setPenSize(3);
    setEraserSize(20);
    setDrawMode('pen');
  }, [pdfUrl, markSchemePdfUrl, showMarkScheme]);

  // Ensure annotation canvases are always sized to match PDF canvases when annotation mode is enabled
  useEffect(() => {
    if (!annotationMode) return;
    // Wait for annotation canvases to be in the DOM
    setTimeout(() => {
      canvasRefsMap.current.forEach((pageRef) => {
        if (pageRef.canvas && pageRef.annotationCanvas) {
          pageRef.annotationCanvas.width = pageRef.canvas.width;
          pageRef.annotationCanvas.height = pageRef.canvas.height;
        }
      });
    }, 0);
  }, [annotationMode, numPages]);

  // Render all pages when numPages changes (fixed zoom)
  useEffect(() => {
    const renderAllPages = async () => {
      if (!pdfRef.current || !numPages) return;
      try {
        setLoading(true);
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const pageRef = canvasRefsMap.current.get(pageNum);
          const canvas = pageRef?.canvas;
          const annotationCanvas = pageRef?.annotationCanvas;
          if (!canvas) continue;
          const page = await pdfRef.current.getPage(pageNum);
          const viewport = page.getViewport({ scale: ZOOM_SCALE });
          const context = canvas.getContext('2d');
          if (!context) continue;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // Also set annotation canvas to match
          if (annotationCanvas) {
            annotationCanvas.width = viewport.width;
            annotationCanvas.height = viewport.height;
          }
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          await page.render(renderContext).promise;
        }
        setError(null);
      } catch (err) {
        setError('Failed to render pages');
        console.error('Error rendering pages:', err);
      } finally {
        setLoading(false);
      }
    };
    renderAllPages();
  }, [numPages]);

  // Zoom controls removed (zoom is fixed at highest quality)

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    // Map mouse position to actual canvas pixel coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    if (!annotationMode) return;
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

  const draw = (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
    if (!isDrawing || !annotationMode || currentDrawingPageNum !== pageNum) return;
    const pageRef = canvasRefsMap.current.get(pageNum);
    const canvas = pageRef?.annotationCanvas;
    if (!canvas) return;
    const { x, y } = getCanvasCoords(e, canvas);
    const ctx = canvas.getContext('2d');
    if (ctx && lastPointRef.current) {
      if (drawMode === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = penSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Always draw a dot for single clicks
        if (lastPointRef.current.x === x && lastPointRef.current.y === y) {
          ctx.beginPath();
          ctx.arc(x, y, penSize / 2, 0, 2 * Math.PI);
          ctx.fillStyle = drawColor;
          ctx.fill();
        }
        // Draw a direct line from last to current point for fast movement
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastPointRef.current = { x, y };
      } else if (drawMode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = eraserSize;
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

  const stopDrawing = () => {
    setIsDrawing(false);
    setCurrentDrawingPageNum(null);
    lastPointRef.current = null;
  };

  const clearAnnotations = () => {
    canvasRefsMap.current.forEach((pageRef) => {
      if (pageRef.annotationCanvas) {
        const ctx = pageRef.annotationCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, pageRef.annotationCanvas.width, pageRef.annotationCanvas.height);
        }
      }
    });
  };

  if (error) {
    return (
      <div className="w-full rounded bg-red-100 dark:bg-red-900 p-4 text-red-700 dark:text-red-200">
        <p className="font-semibold">Error loading PDF</p>
        <p className="text-sm">{error}</p>
        <p className="text-xs mt-2 opacity-75">URL: {pdfUrl}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700"
    >
      {/* Toolbar (zoom controls removed) */}
      <div className="bg-gray-200 dark:bg-gray-800 p-3 flex items-center justify-between border-b border-gray-300 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {loading ? 'Loading...' : `${numPages || '?'} pages`}
          </span>
          {markSchemePdfUrl && (
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              showMarkScheme
                ? 'bg-orange-500 text-white'
                : 'bg-blue-500 text-white'
            }`}>
              {showMarkScheme ? 'MARK SCHEME' : 'QUESTION'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {markSchemePdfUrl && (
            <>
              <button
                onClick={() => setShowMarkScheme(!showMarkScheme)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  showMarkScheme
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title="Toggle mark scheme"
              >
                {showMarkScheme ? 'Question' : 'Mark Scheme'}
              </button>
              <div className="w-px h-6 bg-gray-400 dark:bg-gray-600" />
            </>
          )}

          <button
            onClick={() => setAnnotationMode(!annotationMode)}
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

          {showMarkingButtons && (
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

      {/* Annotation Tools (shown when annotation mode is active) */}
      {annotationMode && (
        <div className="bg-gray-300 dark:bg-gray-700 p-2 flex items-center gap-2 border-b border-gray-400 dark:border-gray-600 sticky top-16 z-10">
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

      {/* Pages Container - all pages stacked vertically */}
      <div
        ref={pagesContainerRef}
        className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-4"
      >
        <div className="flex flex-col gap-4 items-center">
          {numPages &&
            Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
              // Initialize refs for this page if not already done
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
                        maxWidth: '100%',
                        height: 'auto',
                        display: 'block',
                        width: '100%'
                      }}
                    />
                    {annotationMode && (
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
                        className="absolute top-0 left-0 cursor-crosshair rounded"
                        style={{
                          display: 'block',
                          pointerEvents: 'auto',
                          width: '100%',
                          height: '100%'
                        }}
                        onMouseDown={(e) => startDrawing(e, pageNum)}
                        onMouseMove={(e) => draw(e, pageNum)}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    )}
                  </div>
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Page {pageNum}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
