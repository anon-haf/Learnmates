import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { renderPdfPageThumbnail } from '../utils/pdfThumbnail';
import './PdfPageSkeleton';

interface PdfSidebarPageThumbProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  thumbnailWidth: number;
  cacheKey: string;
  scrollRoot: HTMLElement | null;
  eager?: boolean;
  isActive: boolean;
  onSelect: () => void;
}

export const PdfSidebarPageThumb: React.FC<PdfSidebarPageThumbProps> = ({
  pdfDoc,
  pageNumber,
  thumbnailWidth,
  cacheKey,
  scrollRoot,
  eager = false,
  isActive,
  onSelect,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const loadStartedRef = useRef(false);
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadStartedRef.current = false;
    setThumbnailSrc(null);
    setFailed(false);
  }, [cacheKey, pageNumber, thumbnailWidth]);

  useEffect(() => {
    const element = buttonRef.current;
    if (!element || thumbnailWidth <= 0) return;

    let cancelled = false;

    const loadThumbnail = () => {
      if (cancelled || loadStartedRef.current) return;
      loadStartedRef.current = true;

      void renderPdfPageThumbnail(pdfDoc, pageNumber, thumbnailWidth, cacheKey)
        .then((src) => {
          if (!cancelled) setThumbnailSrc(src);
        })
        .catch((error) => {
          console.warn(`Sidebar thumbnail failed for page ${pageNumber}:`, error);
          if (!cancelled) setFailed(true);
        });
    };

    if (eager) {
      loadThumbnail();
      return () => {
        cancelled = true;
      };
    }

    if (typeof IntersectionObserver === 'undefined') {
      loadThumbnail();
      return () => {
        cancelled = true;
      };
    }

    const root = scrollRoot ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (!isVisible || cancelled) return;
        loadThumbnail();
        observer.disconnect();
      },
      {
        root,
        rootMargin: '160px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [pdfDoc, pageNumber, thumbnailWidth, cacheKey, scrollRoot, eager]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      className={`group relative w-full rounded overflow-hidden border-2 transition ${
        isActive
          ? 'border-blue-500 ring-2 ring-blue-500/40'
          : 'border-gray-600 hover:border-gray-500'
      }`}
      title={`Page ${pageNumber}`}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative bg-white aspect-[210/297] w-full">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt=""
            className="w-full h-full object-contain bg-white"
            draggable={false}
          />
        ) : (
          <div
            className={`absolute inset-0 ${failed ? 'bg-gray-700' : 'pdf-skeleton-loader'}`}
            aria-hidden="true"
          />
        )}
        {failed && !thumbnailSrc && (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            {pageNumber}
          </span>
        )}
      </div>
      <span
        className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium tabular-nums ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'bg-gray-900/75 text-gray-200 group-hover:bg-gray-900/90'
        }`}
      >
        {pageNumber}
      </span>
    </button>
  );
};
