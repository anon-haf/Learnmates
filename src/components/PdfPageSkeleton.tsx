import React from 'react';

const SKELETON_STYLE_ID = 'pdf-page-skeleton-styles';

const skeletonStyles = `
  @keyframes pdf-shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  .pdf-skeleton-loader {
    background: linear-gradient(90deg, #d1d5db 0%, #e5e7eb 45%, #f9fafb 55%, #d1d5db 100%);
    background-size: 1000px 100%;
    animation: pdf-shimmer 2s infinite linear;
  }
  .dark .pdf-skeleton-loader {
    background: linear-gradient(90deg, #374151 0%, #4b5563 45%, #6b7280 55%, #374151 100%);
    background-size: 1000px 100%;
    animation: pdf-shimmer 2s infinite linear;
  }
`;

if (typeof document !== 'undefined' && !document.getElementById(SKELETON_STYLE_ID)) {
  const styleSheet = document.createElement('style');
  styleSheet.id = SKELETON_STYLE_ID;
  styleSheet.textContent = skeletonStyles;
  document.head.appendChild(styleSheet);
}

interface PdfPageSkeletonProps {
  label?: string;
  className?: string;
}

export const PdfPageSkeleton: React.FC<PdfPageSkeletonProps> = ({ label, className = '' }) => (
  <div
    className={`w-full max-w-3xl rounded overflow-hidden bg-gray-200 dark:bg-gray-800 ${className}`}
    role="status"
    aria-label={label ?? 'Loading page'}
  >
    <div className="w-full aspect-[210/297] pdf-skeleton-loader" aria-hidden="true" />
    {label && (
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-2 bg-gray-100 dark:bg-gray-800">{label}</p>
    )}
  </div>
);

interface PdfDocumentSkeletonProps {
  pageCount?: number;
}

export const PdfDocumentSkeleton: React.FC<PdfDocumentSkeletonProps> = ({ pageCount = 2 }) => (
  <div className="flex flex-col items-center gap-3 w-full">
    {Array.from({ length: pageCount }, (_, i) => (
      <PdfPageSkeleton key={i} />
    ))}
  </div>
);
