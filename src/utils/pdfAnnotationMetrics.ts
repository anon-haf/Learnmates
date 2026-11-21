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

/** Fallback density used only when the display width is unavailable. */
export const PDF_OUTPUT_DEVICE_PIXEL_RATIO = 2;

// Every page is rasterised to this fixed pixel width no matter the device or the
// on-screen container size. Because the canvas buffer = displayWidth * DPR, we
// derive the DPR from the target width, so phones, tablets and laptops all get
// the exact same resolution instead of a per-screen one.
export const PDF_TARGET_RENDER_WIDTH_PX = 2048;

export function getPdfOutputDevicePixelRatio(displayWidth: number): number {
  if (!Number.isFinite(displayWidth) || displayWidth <= 0) {
    return PDF_OUTPUT_DEVICE_PIXEL_RATIO;
  }
  return PDF_TARGET_RENDER_WIDTH_PX / displayWidth;
}
