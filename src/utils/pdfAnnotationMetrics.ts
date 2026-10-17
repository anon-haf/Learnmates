/**
 * Annotation geometry is defined in PDF user space (1 unit ≈ 1/72 inch),
 * matching pdf.js viewport coordinates at scale 1.
 */

export function pdfStrokeWidthInCanvasPixels(
  sizeInPdfUnits: number,
  canvasWidthPx: number,
  pdfPageWidthAtScale1: number
): number {
  if (!Number.isFinite(sizeInPdfUnits) || sizeInPdfUnits <= 0) return 1;
  if (!Number.isFinite(canvasWidthPx) || canvasWidthPx <= 0) return sizeInPdfUnits;
  if (!Number.isFinite(pdfPageWidthAtScale1) || pdfPageWidthAtScale1 <= 0) {
    return sizeInPdfUnits;
  }
  return sizeInPdfUnits * (canvasWidthPx / pdfPageWidthAtScale1);
}

/** Bound PDF canvas backing stores to 2× to avoid excessive memory use on high-DPI screens. */
export function clampOutputDevicePixelRatio(dpr?: number): number {
  const base = typeof dpr === 'number' && dpr > 0 ? dpr : 1;
  if (base <= 1.25) return 1;
  return 2;
}
