import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Document, Page } from 'react-pdf';
import type { PDFPageProxy } from 'pdfjs-dist';
import { pdfDocumentOptions } from '../utils/pdfjsConfig';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { X, Download } from 'lucide-react';

interface ReferencePopupProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  /** Page rotation in degrees. Defaults to 0 (unrotated). */
  rotate?: number;
}

/**
 * Full-screen popup that shows a reference PDF (periodic table, physics data
 * sheet, …), scaled to fit the viewport. Multi-page documents are stacked.
 */
export const ReferencePopup: React.FC<ReferencePopupProps> = ({ open, onClose, url, title, rotate = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [numPages, setNumPages] = useState(0);
  const [aspect, setAspect] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

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
    const viewport = page.getViewport({ scale: 1, rotation: rotate });
    if (viewport.height > 0) setAspect(viewport.width / viewport.height);
  };

  const fileName = (() => {
    try {
      const name = decodeURIComponent(new URL(url, window.location.origin).pathname.split('/').pop() || '');
      return name || `${title}.pdf`;
    } catch {
      return `${title}.pdf`;
    }
  })();

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.warn('Failed to download reference document:', error);
    } finally {
      setDownloading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex flex-col bg-black/75 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#0a1628] border-b border-[#1a2d47] shrink-0">
        <h2 className="text-sm sm:text-base font-semibold text-gray-100">{title}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Download ${title.toLowerCase()}`}
            aria-label={`Download ${title.toLowerCase()}`}
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            title={`Close ${title.toLowerCase()}`}
            aria-label={`Close ${title.toLowerCase()}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="lm-scrollbar-dark flex-1 overflow-auto p-4"
      >
        {size.width > 0 && (
          <Document
            file={url}
            options={pdfDocumentOptions}
            onLoadSuccess={({ numPages: total }) => setNumPages(total)}
            loading={<div className="text-gray-300 text-sm py-8 text-center">Loading…</div>}
            error={<div className="text-red-400 text-sm py-8 text-center">Failed to load the document.</div>}
          >
            <div className="flex flex-col items-center justify-start gap-4">
              {Array.from({ length: numPages }, (_, index) => (
                <Page
                  key={index + 1}
                  pageNumber={index + 1}
                  rotate={rotate}
                  width={pageWidth}
                  onLoadSuccess={index === 0 ? handlePageLoad : undefined}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  className="shadow-2xl overflow-hidden rounded"
                  loading={<div className="text-gray-300 text-sm py-8">Rendering…</div>}
                />
              ))}
            </div>
          </Document>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default ReferencePopup;
