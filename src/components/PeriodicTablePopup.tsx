import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page } from 'react-pdf';
import type { PDFPageProxy } from 'pdfjs-dist';
import { pdfDocumentOptions } from '../utils/pdfjsConfig';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { X } from 'lucide-react';

interface PeriodicTablePopupProps {
  open: boolean;
  onClose: () => void;
  url: string;
}

/**
 * Full-screen popup that shows the periodic table PDF rotated 90° clockwise.
 * Used by IGCSE Chemistry topics in the zoomed-in (large) viewer.
 */
export const PeriodicTablePopup: React.FC<PeriodicTablePopupProps> = ({ open, onClose, url }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setAspect(null);
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const availableWidth = Math.max(200, size.width - 48);
  const availableHeight = Math.max(200, size.height - 48);
  const pageWidth = aspect ? Math.min(availableWidth, availableHeight * aspect) : availableWidth;

  const handlePageLoad = (page: PDFPageProxy) => {
    const viewport = page.getViewport({ scale: 1, rotation: 90 });
    if (viewport.height > 0) setAspect(viewport.width / viewport.height);
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-black/75 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#0a1628] border-b border-[#1a2d47] shrink-0">
        <h2 className="text-sm sm:text-base font-semibold text-gray-100">Periodic Table</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
          title="Close periodic table"
          aria-label="Close periodic table"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div
        ref={containerRef}
        className="lm-scrollbar-dark flex-1 overflow-auto p-4 flex items-start justify-center"
      >
        {size.width > 0 && (
          <Document
            file={url}
            options={pdfDocumentOptions}
            loading={<div className="text-gray-300 text-sm py-8">Loading periodic table…</div>}
            error={<div className="text-red-400 text-sm py-8">Failed to load the periodic table.</div>}
          >
            <Page
              pageNumber={1}
              rotate={90}
              width={pageWidth}
              onLoadSuccess={handlePageLoad}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="shadow-2xl overflow-hidden rounded"
              loading={<div className="text-gray-300 text-sm py-8">Rendering…</div>}
            />
          </Document>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default PeriodicTablePopup;
