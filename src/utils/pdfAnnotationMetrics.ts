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

/** Discrete device pixel ratio tiers (1×, 2×, 3×). */
export function clampOutputDevicePixelRatio(dpr?: number): number {
  const base = typeof dpr === 'number' && dpr > 0 ? dpr : 1;
  if (base <= 1.25) return 1;
  if (base <= 2.25) return 2;
  return 3;
}

/**
 * Maps continuous view zoom to a small number of PDF render resolutions.
 * Visual zoom stays on `--pdf-zoom`; this only controls canvas re-rasterization.
 */
export function quantizePdfRenderZoomPercent(viewZoomPercent: number): number {
  const z = viewZoomPercent;
  if (z <= 100) return 100;
  if (z <= 165) return 150;
  return 200;
}
