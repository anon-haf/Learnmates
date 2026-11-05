export interface PdfDrawingPreferences {
  penColor: string;
  penSize: number;
  eraserSize: number;
  handMode: boolean;
}

export const PDF_PEN_SIZE_MIN = 1;
export const PDF_PEN_SIZE_MAX = 20;
export const PDF_PEN_SIZE_STEP = 1;

const STORAGE_KEY = 'learnmates_pdf_drawing_preferences';
const DEFAULT_PEN_COLOR = '#000000';
const DEFAULT_PEN_SIZE = 2;
const DEFAULT_ERASER_SIZE = 20;

function getDefaultHandMode(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches
  );
}

export function loadPdfDrawingPreferences(): PdfDrawingPreferences {
  const defaults: PdfDrawingPreferences = {
    penColor: DEFAULT_PEN_COLOR,
    penSize: DEFAULT_PEN_SIZE,
    eraserSize: DEFAULT_ERASER_SIZE,
    handMode: getDefaultHandMode(),
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;

    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return defaults;

    const values = parsed as Record<string, unknown>;
    const penSize = values.penSize;
    const eraserSize = values.eraserSize;

    return {
      penColor:
        typeof values.penColor === 'string' &&
        /^#[\da-f]{6}$/i.test(values.penColor)
          ? values.penColor
          : defaults.penColor,
      penSize: typeof penSize === 'number' && Number.isFinite(penSize)
        ? Math.round(
            Math.min(PDF_PEN_SIZE_MAX, Math.max(PDF_PEN_SIZE_MIN, penSize))
          )
        : defaults.penSize,
      eraserSize: typeof eraserSize === 'number' && Number.isFinite(eraserSize)
        ? Math.min(100, Math.max(1, eraserSize))
        : defaults.eraserSize,
      handMode:
        typeof values.handMode === 'boolean'
          ? values.handMode
          : defaults.handMode,
    };
  } catch (error) {
    console.warn('Failed to load PDF drawing preferences', error);
    return defaults;
  }
}

export function savePdfDrawingPreferences(
  preferences: PdfDrawingPreferences
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save PDF drawing preferences', error);
  }
}
