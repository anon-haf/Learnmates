import { pdfjs } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
}

/**
 * Options required for JPEG 2000 images, CJK text, and legacy standard fonts.
 * Hardware-accelerated canvas compositing does not change the raster pdf.js
 * produces; it only avoids a readback-backed context.
 */
export const pdfDocumentOptions: NonNullable<DocumentProps['options']> = {
  cMapUrl: '/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/standard_fonts/',
  wasmUrl: '/wasm/',
  enableHWA: true,
  disableStream: false,
};

/** Same options for direct pdfjs.getDocument() calls (MediaViewer, thumbnails, etc.). */
export const pdfGetDocumentOptions: any = {
  ...pdfDocumentOptions,
  withCredentials: false,
  rangeChunkSize: 131072,
  httpHeaders: undefined,
};

export { pdfjs };
