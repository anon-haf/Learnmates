import React, { useRef, useState, useEffect } from 'react';

interface ImageViewerProps {
  src: string;
  alt?: string;
  className?: string;
  onMarkCorrect?: () => void;
  onMarkIncorrect?: () => void;
  showMarkingButtons?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt = '', className = '', onMarkCorrect, onMarkIncorrect, showMarkingButtons = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const [annotationMode, setAnnotationMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [penSize, setPenSize] = useState(2);
  const [drawMode, setDrawMode] = useState<'pen' | 'eraser'>('pen');
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getTransformStyle = () => ({
    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
    transition: isPanning ? 'none' : 'transform 0.2s'
  });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.25, Math.min(5, z - (e.deltaY * 0.002))));
  };

  const startPanHandler = (e: React.MouseEvent) => {
    if (annotationMode) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const movePanHandler = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPosition({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const endPanHandler = () => setIsPanning(false);

  const toCanvasCoords = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = (clientX - rect.left - position.x) / zoom;
    const y = (clientY - rect.top - position.y) / zoom;
    return { x, y };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!annotationMode) return;
    setIsDrawing(true);
    const p = toCanvasCoords(e.clientX, e.clientY);
    lastPoint.current = p;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!annotationMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const p = toCanvasCoords(e.clientX, e.clientY);
    if (isDrawing && lastPoint.current) {
      ctx.save();
      ctx.lineCap = 'round';
      if (drawMode === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = penSize;
      } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = penSize * 2;
      }
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
      lastPoint.current = p;
    }
  };

  const handleCanvasMouseUp = () => {
    if (!annotationMode) return;
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clearAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!canvas || !rect) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);
  }, [zoom, position.x, position.y, src]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-black ${className}`}
      style={{ width: '100%', height: '24rem', cursor: annotationMode ? (isDrawing ? 'crosshair' : 'crosshair') : (isPanning ? 'grabbing' : 'grab') }}
      onWheel={handleWheel}
      onMouseDown={startPanHandler}
      onMouseMove={movePanHandler}
      onMouseUp={endPanHandler}
      onMouseLeave={endPanHandler}
    >
      <div style={getTransformStyle()}>
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            maxWidth: 'none',
            maxHeight: 'none',
            userSelect: 'none',
            pointerEvents: 'none',
            display: 'block'
          }}
        />
      </div>

      <canvas
        ref={canvasRef}
        className="absolute left-0 top-0 w-full h-full"
        onMouseDown={(e) => { e.stopPropagation(); handleCanvasMouseDown(e); }}
        onMouseMove={(e) => { e.stopPropagation(); handleCanvasMouseMove(e); }}
        onMouseUp={(e) => { e.stopPropagation(); handleCanvasMouseUp(); }}
      />

      <div className="absolute top-2 right-2 flex gap-2 z-20">
        <button className="bg-white/80 rounded p-1 hover:bg-white" onClick={e => { e.stopPropagation(); setZoom(z => Math.min(z + 0.2, 5)); }}>+</button>
        <button className="bg-white/80 rounded p-1 hover:bg-white" onClick={e => { e.stopPropagation(); setZoom(z => Math.max(z - 0.2, 0.25)); }}>-</button>
        <button className="bg-white/80 rounded p-1 hover:bg-white" onClick={e => { e.stopPropagation(); setZoom(1); setPosition({ x: 0, y: 0 }); }}>Reset</button>
        <button className={`bg-white/80 rounded p-1 hover:bg-white ${annotationMode ? 'ring-2 ring-blue-400' : ''}`} onClick={e => { e.stopPropagation(); setAnnotationMode(a => !a); }} title="Toggle annotation mode">Annotate</button>
        <button className="bg-white/80 rounded p-1 hover:bg-white" onClick={e => { e.stopPropagation(); clearAnnotations(); }} title="Clear annotations">Clear</button>
      </div>

      {annotationMode && (
        <div className="absolute top-2 left-2 z-20 bg-white/90 rounded p-2 flex items-center gap-2">
          <label className="flex items-center gap-1">Color
            <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} />
          </label>
          <label className="flex items-center gap-1">Size
            <input type="range" min={1} max={30} value={penSize} onChange={e => setPenSize(Number(e.target.value))} />
          </label>
          <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => setDrawMode('pen')}>Pen</button>
          <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => setDrawMode('eraser')}>Eraser</button>
        </div>
      )}

      {showMarkingButtons && (
        <div className="absolute bottom-3 right-3 z-30 flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); onMarkIncorrect && onMarkIncorrect(); }} className="px-3 py-2 rounded bg-red-500 text-white">I got it wrong</button>
          <button onClick={(e) => { e.stopPropagation(); onMarkCorrect && onMarkCorrect(); }} className="px-3 py-2 rounded bg-green-500 text-white">I got it right</button>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;