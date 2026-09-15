import { PDFDocument, rgb, StandardFonts, PDFPage, PDFEmbeddedPage } from 'pdf-lib';
import { resolveFromR2, getAssetAuthHeaders, fetchR2AsBlob } from './r2Utils';

export interface MergeItem {
  id: string; // Used to identify the question number
  url?: string;
  type?: 'pdf' | 'image' | 'mcqAnswer';
  mcqAnswer?: string;
}

// Helper to add footers to all pages
const addHeadersAndFooters = async (
  pdf: PDFDocument,
  boldFont: any,
  regularFont: any,
  options: {
    title: string;
    subtitle: string;
  }
) => {
  const pages = pdf.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const pageNum = i + 1;
    const totalPages = pages.length;

    // Footer line
    page.drawLine({
      start: { x: 40, y: 35 },
      end: { x: width - 40, y: 35 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Filename + tag (title + subtitle) left-aligned in footer
    let footerLeftText = options.title;
    if (options.subtitle) {
      footerLeftText += ' | ' + options.subtitle;
    }
    const footerLeftSize = 7;
    const maxFooterLeftWidth = width - 120;
    let renderedFooterLeft = footerLeftText;
    while (regularFont.widthOfTextAtSize(renderedFooterLeft, footerLeftSize) > maxFooterLeftWidth && renderedFooterLeft.length > 0) {
      renderedFooterLeft = renderedFooterLeft.slice(0, -1);
    }
    if (renderedFooterLeft !== footerLeftText) renderedFooterLeft = renderedFooterLeft.trimEnd() + '...';

    page.drawText(renderedFooterLeft, {
      x: 40,
      y: 15,
      size: footerLeftSize,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Page number (centered)
    const pageNumText = `Page ${pageNum} of ${totalPages}`;
    const pageNumSize = 8;
    const pageNumWidth = regularFont.widthOfTextAtSize(pageNumText, pageNumSize);
    page.drawText(pageNumText, {
      x: (width - pageNumWidth) / 2,
      y: 15,
      size: pageNumSize,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Learnmates.org right-aligned in footer
    const footerText = 'Learnmates.org';
    const footerSize = 7;
    const footerWidth = regularFont.widthOfTextAtSize(footerText, footerSize);
    page.drawText(footerText, {
      x: width - 40 - footerWidth,
      y: 15,
      size: footerSize,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
};

// Keep embedLogo for potential future use but no longer called
const embedLogo = async (pdf: PDFDocument, logoUrl: string) => {
  try {
    const absoluteUrl = logoUrl.startsWith('http') ? logoUrl : new URL(logoUrl, window.location.origin).href;
    const response = await fetch(absoluteUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('png')) {
      return await pdf.embedPng(arrayBuffer);
    } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      return await pdf.embedJpg(arrayBuffer);
    }
  } catch (e) {
    console.warn('Failed to embed logo:', e);
  }
  return null;
};

// helper: fetch with a short timeout
const fetchWithTimeout = (url: string, timeout = 3000): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeout);
    fetch(url)
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// ---------------------------------------------------------------------------
// CropBox-aware page embedding
// ---------------------------------------------------------------------------

interface VisiblePage {
  embedded: PDFEmbeddedPage;
  width: number;
  height: number;
}

const embedVisiblePage = async (
  targetDoc: PDFDocument,
  page: PDFPage
): Promise<VisiblePage> => {
  const cropBox = page.getCropBox();
  const left = cropBox.x;
  const bottom = cropBox.y;
  const cropWidth = cropBox.width;
  const cropHeight = cropBox.height;

  let width = cropWidth;
  let height = cropHeight;
  let matrix: [number, number, number, number, number, number];

  switch (((page.getRotation().angle % 360) + 360) % 360) {
    case 90:
      matrix = [0, -1, 1, 0, -bottom, left + cropWidth];
      width = cropHeight;
      height = cropWidth;
      break;
    case 180:
      matrix = [-1, 0, 0, -1, left + cropWidth, bottom + cropHeight];
      break;
    case 270:
      matrix = [0, 1, -1, 0, bottom + cropHeight, -left];
      width = cropHeight;
      height = cropWidth;
      break;
    default:
      matrix = [1, 0, 0, 1, -left, -bottom];
  }

  const embedded = await targetDoc.embedPage(
    page,
    { left, bottom, right: left + cropWidth, top: bottom + cropHeight },
    matrix
  );

  return { embedded, width, height };
};

const resolveAssetUrl = async (url: string): Promise<string> => {
  if (!url) return url;
  if (url.startsWith('blob:')) return url;
  const resolvedUrl = await resolveFromR2(url);
  return resolvedUrl || url;
};

// Convert image to a renderable item
const fetchImageItem = async (
  pdf: PDFDocument,
  imageUrl: string,
  questionNumber: number | string
): Promise<{ image: any; width: number; height: number; questionNumber: number | string } | null> => {
  try {
    const resolvedUrl = await resolveAssetUrl(imageUrl);
    const absoluteUrl = resolvedUrl.startsWith('http') || resolvedUrl.startsWith('blob:')
      ? resolvedUrl
      : new URL(resolvedUrl, window.location.origin).href;

    console.log(`[PDF Merge] Fetching image: ${absoluteUrl}`);
    let response: Response | null = null;
    try {
      response = await fetchWithTimeout(absoluteUrl, 3000);
    } catch {
      response = null;
    }

    if (!response || !response.ok) {
      console.error(`[PDF Merge] Failed to fetch image: ${response ? response.statusText : 'no response'}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    let image;
    const contentType = response.headers.get('content-type') || '';

    console.log(`[PDF Merge] Image content type: ${contentType}`);

    if (contentType.includes('png')) {
      image = await pdf.embedPng(arrayBuffer);
      console.log(`[PDF Merge] Successfully embedded as PNG`);
    } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      image = await pdf.embedJpg(arrayBuffer);
      console.log(`[PDF Merge] Successfully embedded as JPG`);
    } else {
      // Try PNG first, then JPG
      try {
        image = await pdf.embedPng(arrayBuffer);
        console.log(`[PDF Merge] Successfully embedded as PNG (auto-detect)`);
      } catch {
        try {
          image = await pdf.embedJpg(arrayBuffer);
          console.log(`[PDF Merge] Successfully embedded as JPG (auto-detect)`);
        } catch (e2) {
          console.error(`[PDF Merge] Failed to embed image as PNG or JPG:`, e2);
          return null;
        }
      }
    }

    const imageDims = image.scale(1);
    return { image, width: imageDims.width, height: imageDims.height, questionNumber };
  } catch (error) {
    console.error(`[PDF Merge] Error adding image ${imageUrl}:`, error);
    return null;
  }
};

const fetchR2AsArrayBuffer = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    // First, try to get the direct R2 URL
    const r2Url = await resolveFromR2(url);
    if (!r2Url) {
      console.warn(`[R2] Could not resolve URL: ${url}`);
      return null;
    }

    console.log(`[R2] Fetching: ${r2Url}`);

    // Fetch directly from R2
    const response = await fetch(r2Url, {
      mode: 'cors',
      headers: {
        'Accept': 'application/pdf,image/*',
        ...getAssetAuthHeaders(),
      },
    });

    if (!response.ok) {
      console.warn(`[R2] Fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      console.warn(`[R2] Received HTML instead of file`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`[R2] Successfully fetched ${arrayBuffer.byteLength} bytes`);
    return arrayBuffer;
  } catch (error) {
    console.error(`[R2] Error fetching:`, error);
    return null;
  }
};

export const generateMergedPDF = async (
  items: MergeItem[],
  typeLabel: 'Question' | 'Mark Scheme',
  options?: {
    title?: string;
    subtitle?: string;
  }
): Promise<Blob> => {
  const mergedPdf = await PDFDocument.create();

  console.log(`[PDF Merge] Starting merge for ${items.length} items`);

  const fetchedItems = await Promise.all(items.map(async (item, i) => {
    const questionNumber = item.id.replace('q', '') || (i + 1);
    const fileUrl = item.url;
    const fileType = item.type;

    if (fileType === 'mcqAnswer') {
      return null;
    }

    if (!fileUrl) {
      console.warn(`[PDF Merge] Skipping question ${questionNumber}: no file URL`);
      return null;
    }

    try {
      const resolvedUrl = await resolveAssetUrl(fileUrl);
      const absoluteUrl = resolvedUrl.startsWith('http') || resolvedUrl.startsWith('blob:')
        ? resolvedUrl
        : new URL(resolvedUrl, window.location.origin).href;

      console.log(`[PDF Merge] Fetching question ${questionNumber}: ${fileType} from ${absoluteUrl}`);

      let arrayBuffer: ArrayBuffer | null = null;

      const isR2Asset = absoluteUrl.includes('assets.learnmates.org') ||
        absoluteUrl.includes('/questions/') ||
        absoluteUrl.includes('/topicals/');

      if (isR2Asset && !absoluteUrl.startsWith('https://assets.learnmates.org')) {
        console.error(`[PDF Merge] Question ${questionNumber}: expected R2 URL but got same-origin fallback (${absoluteUrl}). Skipping.`);
        return null;
      }

      if (isR2Asset) {
        arrayBuffer = await fetchR2AsArrayBuffer(absoluteUrl);

        if (!arrayBuffer) {
          const blob = await fetchR2AsBlob(absoluteUrl);
          if (blob) {
            arrayBuffer = await blob.arrayBuffer();
          } else {
            console.warn(`[PDF Merge] Fallback fetch failed for question ${questionNumber}`);
          }
        }
      } else {
        try {
          const response = await fetchWithTimeout(absoluteUrl, 20000);
          if (response && response.ok) {
            arrayBuffer = await response.arrayBuffer();
          }
        } catch (err) {
          console.warn(`[PDF Merge] Fetch failed for question ${questionNumber}: ${(err as Error).message}`);
        }
      }

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        console.warn(`[PDF Merge] No data received for question ${questionNumber}`);
        return null;
      }

      console.log(`[PDF Merge] Received ${arrayBuffer.byteLength} bytes for question ${questionNumber}`);
      return { arrayBuffer, questionNumber };
    } catch (error) {
      console.error(`[PDF Merge] Error processing question ${questionNumber}:`, error);
      return null;
    }
  }));

  type RenderItem = { type: 'pdfPage', embedded: any, width: number, height: number, questionNumber: number | string }
    | { type: 'image', image: any, width: number, height: number, questionNumber: number | string };

  const renderItems: RenderItem[] = [];

  for (const fetched of fetchedItems) {
    if (!fetched) continue;
    const { arrayBuffer, questionNumber } = fetched;

    const isPDF = arrayBuffer.byteLength > 4 &&
      new Uint8Array(arrayBuffer.slice(0, 4))[0] === 0x25 &&
      new Uint8Array(arrayBuffer.slice(0, 4))[1] === 0x50 &&
      new Uint8Array(arrayBuffer.slice(0, 4))[2] === 0x44 &&
      new Uint8Array(arrayBuffer.slice(0, 4))[3] === 0x46;

    if (isPDF) {
      try {
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = pdf.getPages();
        for (const page of pages) {
          const { embedded, width, height } = await embedVisiblePage(mergedPdf, page);
          renderItems.push({ type: 'pdfPage', embedded, width, height, questionNumber });
        }
        console.log(`[PDF Merge] Embedded ${pages.length} pages from PDF for question ${questionNumber}`);
      } catch (pdfError) {
        console.error(`[PDF Merge] Failed to load PDF for question ${questionNumber}:`, pdfError);
      }
    } else {
      try {
        let image;
        try {
          image = await mergedPdf.embedPng(arrayBuffer);
        } catch {
          image = await mergedPdf.embedJpg(arrayBuffer);
        }
        const imageDims = image.scale(1);
        renderItems.push({ type: 'image', image, width: imageDims.width, height: imageDims.height, questionNumber });
      } catch (imageError) {
        console.error(`[PDF Merge] Failed to embed image for question ${questionNumber}:`, imageError);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 10)); // tiny delay to keep UI responsive
  }

  // A4 dimensions: [595.28, 841.89]
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const MARGIN = 40;
  const SPACING = 20;
  const PRINTABLE_WIDTH = A4_WIDTH - 2 * MARGIN;
  const PRINTABLE_HEIGHT = A4_HEIGHT - 2 * MARGIN;

  let currentPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
  let currentY = A4_HEIGHT - MARGIN;

  const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await mergedPdf.embedFont(StandardFonts.Helvetica);

  const mcqItems = items.filter(i => i.type === 'mcqAnswer' && i.mcqAnswer);
  if (mcqItems.length > 0) {
    currentPage.drawText('MCQ Answers', { x: MARGIN, y: currentY, size: 16, font: boldFont, color: rgb(0, 0, 0) });
    currentY -= 30;

    const col1X = MARGIN;
    const col2X = MARGIN + PRINTABLE_WIDTH / 2;
    const midPoint = Math.ceil(mcqItems.length / 2);

    for (let i = 0; i < mcqItems.length; i++) {
      const item = mcqItems[i];
      const qNum = item.id.replace('q', '');
      const text = `${qNum}. ${item.mcqAnswer}`;

      const isCol2 = i >= midPoint;
      const x = isCol2 ? col2X : col1X;
      const rowIdx = isCol2 ? i - midPoint : i;

      // Calculate y
      const y = currentY - (rowIdx * 20);

      currentPage.drawText(text, { x, y, size: 12, font: regularFont, color: rgb(0, 0, 0) });
    }

    const maxRows = Math.ceil(mcqItems.length / 2);
    currentY = currentY - (maxRows * 20) - (SPACING * 2);

    // If there are other items, ensure we have enough space or start a new page
    if (renderItems.length > 0 && currentY < MARGIN + 100) {
      currentPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
      currentY = A4_HEIGHT - MARGIN;
    }
  }

  for (const item of renderItems) {
    let scale = PRINTABLE_WIDTH / item.width;
    let scaledWidth = PRINTABLE_WIDTH;
    let scaledHeight = item.height * scale;

    // If a single item is taller than a whole A4 page, scale it down to fit the page height
    if (scaledHeight > PRINTABLE_HEIGHT) {
      scale = PRINTABLE_HEIGHT / item.height;
      scaledWidth = item.width * scale;
      scaledHeight = PRINTABLE_HEIGHT;
    }

    // Check if it fits on the current page
    if (currentY - scaledHeight < MARGIN) {
      // If the current page isn't empty, create a new one
      if (currentY < A4_HEIGHT - MARGIN) {
        currentPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
        currentY = A4_HEIGHT - MARGIN;
      }
    }

    const x = MARGIN + (PRINTABLE_WIDTH - scaledWidth) / 2; // Center horizontally
    const y = currentY - scaledHeight;

    if (item.type === 'pdfPage') {
      currentPage.drawPage(item.embedded, { x, y, width: scaledWidth, height: scaledHeight });
    } else {
      currentPage.drawImage(item.image, { x, y, width: scaledWidth, height: scaledHeight });
    }

    currentY = y - SPACING;
  }

  console.log(`[PDF Merge] Final PDF has ${mergedPdf.getPageCount()} pages`);

  // Add footers (fonts already embedded earlier)
  await addHeadersAndFooters(mergedPdf, boldFont, regularFont, {
    title: options?.title || `${typeLabel} Papers`,
    subtitle: options?.subtitle || ''
  });

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
};
