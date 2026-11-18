import { PDFDocument, PDFPage } from 'pdf-lib';

// Shared reference-sheet assets (periodic table, A-Level Physics data sheets).

export const PERIODIC_TABLE_URL = '/documents/Periodic table.pdf';
export const PHYSICS_AS_DATA_SHEET_URL = '/documents/physics AS data sheet.pdf';
export const PHYSICS_A2_DATA_SHEET_URL = '/documents/physics A2 data sheet.pdf';

export const A4_WIDTH = 595.28;
export const A4_HEIGHT = 841.89;

export const isIgcseChemistry = (level?: string, subject?: string) =>
  level?.toLowerCase() === 'igcse' && Boolean(subject?.toLowerCase().includes('chemistry'));

export const isCambridgeAlevelChemistry = (level?: string, board?: string, subject?: string) =>
  level?.toLowerCase() === 'a-level' &&
  board?.toLowerCase() === 'cambridge' &&
  Boolean(subject?.toLowerCase().includes('chemistry'));

// IGCSE Chemistry and Cambridge A-Level Chemistry both get the periodic table.
export const shouldAppendPeriodicTable = (level?: string, board?: string, subject?: string) =>
  isIgcseChemistry(level, subject) || isCambridgeAlevelChemistry(level, board, subject);

export const isCambridgeAlevelPhysics = (level?: string, board?: string, subject?: string) =>
  level?.toLowerCase() === 'a-level' &&
  board?.toLowerCase() === 'cambridge' &&
  subject?.toLowerCase() === 'physics';

// AS / A2 (including the *_Practical units) map to their respective data sheet.
// Anything that is not explicitly A2 falls back to the AS sheet.
export const getAlevelPhysicsDataSheetUrl = (unit?: string | null) =>
  unit && /^a2/i.test(unit) ? PHYSICS_A2_DATA_SHEET_URL : PHYSICS_AS_DATA_SHEET_URL;

// Returns the data sheets to include for a set of units, in AS-then-A2 order.
export const getAlevelPhysicsDataSheetUrls = (units: (string | null | undefined)[]): string[] => {
  const urls: string[] = [];
  if (units.some(unit => unit && /^as/i.test(unit))) urls.push(PHYSICS_AS_DATA_SHEET_URL);
  if (units.some(unit => unit && /^a2/i.test(unit))) urls.push(PHYSICS_A2_DATA_SHEET_URL);
  return urls;
};

/**
 * Draws every page of `sourcePdf` onto its own fresh A4 page of `targetDoc`,
 * scaled to fit and centred. Returns the created pages in document order.
 * Reference sheets therefore always end up on full A4 pages regardless of the
 * rest of the document.
 */
export const addReferencePagesAsA4 = async (
  targetDoc: PDFDocument,
  sourcePdf: PDFDocument,
): Promise<PDFPage[]> => {
  const created: PDFPage[] = [];
  const copiedPages = await targetDoc.copyPages(sourcePdf, sourcePdf.getPageIndices());
  for (const page of copiedPages) {
    const { width, height } = page.getSize();
    const newPage = targetDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const embeddedPage = await targetDoc.embedPage(page);
    const scale = Math.min(A4_WIDTH / width, A4_HEIGHT / height);
    const drawWidth = width * scale;
    const drawHeight = height * scale;
    newPage.drawPage(embeddedPage, {
      x: (A4_WIDTH - drawWidth) / 2,
      y: (A4_HEIGHT - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
    created.push(newPage);
  }
  return created;
};

/**
 * Same as {@link addReferencePagesAsA4} but relocates the created A4 pages so
 * they appear starting at `index` (e.g. right after a cover page).
 */
export const insertReferencePagesAsA4 = async (
  targetDoc: PDFDocument,
  sourcePdf: PDFDocument,
  index: number,
): Promise<void> => {
  const before = targetDoc.getPageCount();
  const created = await addReferencePagesAsA4(targetDoc, sourcePdf);
  if (created.length === 0) return;
  for (let i = 0; i < created.length; i++) targetDoc.removePage(before);
  created.forEach((page, i) => targetDoc.insertPage(index + i, page));
};
