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

/** Baseline density; narrower pages increase DPR to preserve raster detail. */
export const PDF_OUTPUT_DEVICE_PIXEL_RATIO = 2;

const PDF_MIN_RENDER_WIDTH_PX = 1280;
const PDF_MAX_OUTPUT_DEVICE_PIXEL_RATIO = 5;

export function getPdfOutputDevicePixelRatio(displayWidth: number): number {
  if (!Number.isFinite(displayWidth) || displayWidth <= 0) {
    return PDF_OUTPUT_DEVICE_PIXEL_RATIO;
  }

  return Math.max(
    PDF_OUTPUT_DEVICE_PIXEL_RATIO,
    Math.min(
      PDF_MAX_OUTPUT_DEVICE_PIXEL_RATIO,
      PDF_MIN_RENDER_WIDTH_PX / displayWidth
    )
  );
}
