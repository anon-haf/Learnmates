// topicalPdfExport.ts - Full version with R2 support
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, PDFEmbeddedPage } from 'pdf-lib';
import { Question } from '../components/TopicalQuiz';
import { fetchR2AsBlobUrl, resolveFromR2, getAssetAuthHeaders } from '../utils/r2Utils';
import { topicalConfigs } from '../pages/topicalpagesdata';
import { commitDownloadAward } from './awardDownloadXP';

export type ExportType = 'questions' | 'markschemes';

export interface ExportProgress {
  current: number;
  total: number;
}

// Helper function to check if URL is an R2 asset
const isR2Asset = (url: string): boolean => {
  return url.includes('assets.learnmates.org') ||
    url.includes('/Questions/') ||
    url.includes('/questions/') ||
    url.includes('/topicals/') ||
    url.includes('topicals/') ||
    url.includes('Questions/');
};

// Helper function to fetch file as ArrayBuffer with R2 support
// Helper function to fetch file as ArrayBuffer with R2 support
const fetchFileAsArrayBuffer = async (url: string): Promise<ArrayBuffer | null> => {
  try {
    console.log(`[PDF Export] Fetching: ${url}`);

    // Check if this is an R2 asset
    if (isR2Asset(url)) {
      // Use the same approach as MediaViewer - fetch via blob URL
      let r2Url = url;

      // If it's a relative path, resolve it via r2Utils (never construct the
      // URL by hand here — the bucket is private, r2Utils is the single
      // source of truth for how asset URLs are built).
      if (!url.startsWith('http')) {
        const resolved = await resolveFromR2(url);
        if (!resolved) {
          console.error(`[PDF Export] Could not resolve R2 URL for: ${url}`);
          return null;
        }
        r2Url = resolved;
      }

      // If the URL is still on www.learnmates.org, convert it to assets.learnmates.org
      if (r2Url.includes('www.learnmates.org') || r2Url.includes('learnmates.org')) {
        // Extract the path from the URL
        const urlObj = new URL(r2Url);
        r2Url = `https://assets.learnmates.org${urlObj.pathname}`;
        console.log(`[PDF Export] Converted to assets URL: ${r2Url}`);
      }

      console.log(`[PDF Export] Using R2 URL: ${r2Url}`);

      // Try blob URL approach (same as MediaViewer)
      const blobUrl = await fetchR2AsBlobUrl(r2Url);
      if (blobUrl) {
        try {
          const response = await fetch(blobUrl);
          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';

            // Check if we got HTML instead of a file
            if (contentType.includes('text/html') || contentType.includes('text/plain')) {
              console.warn(`[PDF Export] Received HTML instead of file from blob URL`);
              // Try direct fetch as fallback
              const directResponse = await fetch(r2Url, {
                mode: 'cors',
                headers: {
                  'Accept': 'application/pdf,image/*,*/*',
                  ...getAssetAuthHeaders(),
                },
              });
              if (directResponse.ok) {
                const directContentType = directResponse.headers.get('content-type') || '';
                if (!directContentType.includes('text/html')) {
                  const arrayBuffer = await directResponse.arrayBuffer();
                  if (arrayBuffer.byteLength > 0) {
                    console.log(`[PDF Export] Successfully fetched ${arrayBuffer.byteLength} bytes via direct fetch`);
                    return arrayBuffer;
                  }
                }
              }
              return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            if (arrayBuffer.byteLength === 0) {
              console.warn(`[PDF Export] Empty response from blob URL`);
              return null;
            }

            console.log(`[PDF Export] Successfully fetched ${arrayBuffer.byteLength} bytes via blob URL`);
            return arrayBuffer;
          }
        } catch (err) {
          console.warn('[PDF Export] Blob URL fetch failed:', err);
        } finally {
          if (blobUrl) URL.revokeObjectURL(blobUrl);
        }
      }

      // Fallback: direct fetch with proper headers
      try {
        const directResponse = await fetch(r2Url, {
          mode: 'cors',
          headers: {
            'Accept': 'application/pdf,image/*,*/*',
            ...getAssetAuthHeaders(),
          },
        });

        if (directResponse.ok) {
          const directContentType = directResponse.headers.get('content-type') || '';

          // Check if we got HTML instead of a file
          if (directContentType.includes('text/html') || directContentType.includes('text/plain')) {
            console.warn(`[PDF Export] Received HTML instead of file from direct fetch: ${r2Url}`);
            return null;
          }

          const arrayBuffer = await directResponse.arrayBuffer();
          if (arrayBuffer.byteLength > 0) {
            console.log(`[PDF Export] Successfully fetched ${arrayBuffer.byteLength} bytes via direct fetch`);
            return arrayBuffer;
          }
        } else {
          console.warn(`[PDF Export] Direct fetch failed with status: ${directResponse.status}`);
        }
      } catch (err) {
        console.warn('[PDF Export] Direct fetch failed:', err);
      }

      return null;
    }

    // Non-R2 asset - direct fetch
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[PDF Export] Fetch failed: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      console.warn(`[PDF Export] Received HTML instead of file from: ${url}`);
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error(`[PDF Export] Error fetching file:`, error);
    return null;
  }
};

// ---------------------------------------------------------------------------
// Cover page
// ---------------------------------------------------------------------------

// Resolves the flat checkbox keys (`level||board||subject||unit||displayName`)
// against the topic configuration data, so every key is classified as either a
// major topic or a subtopic instead of being listed as both. Keys that do not
// belong to the subject currently being exported (or that cannot be resolved
// in the config) are dropped — they are stale leftovers from a previous
// Helper to strip/replace non-WinAnsi characters so pdf-lib doesn't throw
const sanitizeForPdf = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/θ/g, 'theta')
    .replace(/ₙ/g, 'n')
    .replace(/Δ/g, 'Delta ')
    .replace(/σ/g, 'sigma')
    .replace(/π/g, 'pi')
    .replace(/ˣ/g, '^x')
    .replace(/ⁿ/g, '^n')
    .replace(/ᵗ/g, '^t')
    .replace(/⁻/g, '^-')
    .replace(/μ/g, 'mu')
    // Remove remaining characters outside standard ascii/winansi range, except bullet
    .replace(/[^\x00-\x7F\x80-\xFF\u2022]/g, '');
};

const buildTopicsStructure = (
  selectedTopics: Set<string>,
  levelBoardSubject: { level: string; board: string; subject: string }
) => {
  interface TopicStructure {
    [unit: string]: { [mainTopic: string]: string[] };
  }
  const topicsStructure: TopicStructure = {};
  let totalTopicCount = 0;

  const cfg = topicalConfigs.find(
    c =>
      c.level.toLowerCase() === levelBoardSubject.level.toLowerCase() &&
      c.board.toLowerCase() === levelBoardSubject.board.toLowerCase() &&
      c.subject.toLowerCase() === levelBoardSubject.subject.toLowerCase()
  );

  Array.from(selectedTopics).forEach(key => {
    if (typeof key !== 'string') return;
    const parts = key.split('||');
    if (parts.length < 5) return;

    const [level, board, subject, unit, ...nameParts] = parts;
    const name = nameParts.join('||');
    
    // Ensure the key belongs to the current subject being exported (case-insensitive)
    if (
      level.toLowerCase() !== levelBoardSubject.level.toLowerCase() ||
      board.toLowerCase() !== levelBoardSubject.board.toLowerCase() ||
      subject.toLowerCase() !== levelBoardSubject.subject.toLowerCase()
    ) {
      return;
    }

    if (!topicsStructure[unit]) topicsStructure[unit] = {};

    let isMainTopic = false;
    let parentTopic = name;

    const unitObj = cfg?.units.find(u => u.unit.toLowerCase() === unit.toLowerCase());
    if (unitObj) {
      const mainMatch = unitObj.topics.find(t => t.topic.toLowerCase() === name.toLowerCase());
      if (mainMatch) {
        isMainTopic = true;
        parentTopic = mainMatch.topic;
      } else {
        const parentMatch = unitObj.topics.find(t => t.subtopics?.some(st => st.subtopic.toLowerCase() === name.toLowerCase()));
        if (parentMatch) {
          parentTopic = parentMatch.topic;
        }
      }
    }

    if (!topicsStructure[unit][parentTopic]) {
      topicsStructure[unit][parentTopic] = [];
      totalTopicCount++;
    }

    if (!isMainTopic && parentTopic !== name) {
      if (!topicsStructure[unit][parentTopic].includes(name)) {
        topicsStructure[unit][parentTopic].push(name);
        totalTopicCount++;
      }
    }
  });

  return { topicsStructure, totalTopicCount };
};

const extractTopicCode = (topic: string): string => {
  const trimmed = topic.trim();
  if (!trimmed) return '';

  const directMatch = trimmed.match(/^(\d+(?:\.\d+)*)(?:\s|$)/);
  if (directMatch) return directMatch[1];

  const embeddedMatch = trimmed.match(/(\d+(?:\.\d+)*)(?!.*\d)/);
  if (embeddedMatch) return embeddedMatch[1];

  return trimmed;
};

const formatTopicHeaderText = (topicMatches: string[] = []): string => {
  const topicCodes = topicMatches
    .map(extractTopicCode)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);

  return topicCodes.join(', ');
};

// ---------------------------------------------------------------------------
// CropBox-aware page embedding
//
// Some source files are "soft cropped" with PyMuPDF (fitz): only /CropBox is
// set, the content outside it is never removed. pdf-lib's default embedding
// (and getSize()) only looks at /MediaBox, so merging such a page shows the
// hidden content and shifts the layout. This helper embeds only the visible
// /CropBox region, baking in any page rotation so the result matches what a
// viewer actually shows.
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

  // Map the crop region onto (0,0)-(cropWidth,cropHeight) of the target page,
  // applying the page's own rotation (viewers rotate /Rotate pages clockwise,
  // and that rotation must be baked into the form XObject matrix).
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

  // The bounding box is expressed in the content's own (page) coordinate
  // space and is also used as the clip region when the form XObject is
  // rendered, so it must be the crop box as stored in the file (with its
  // real x/y origin), not a zero-based box — otherwise the content inside
  // the crop region is clipped away.
  const embedded = await targetDoc.embedPage(
    page,
    { left, bottom, right: left + cropWidth, top: bottom + cropHeight },
    matrix
  );

  return { embedded, width, height };
};

// Add a source page to the merged document showing only what is actually
// visible (its /CropBox). Pages without a crop box are added as-is.
const addVisiblePage = async (
  targetDoc: PDFDocument,
  page: PDFPage
): Promise<void> => {
  const mediaBox = page.getMediaBox();
  const cropBox = page.getCropBox();

  const isCropped =
    cropBox.x !== mediaBox.x ||
    cropBox.y !== mediaBox.y ||
    cropBox.width !== mediaBox.width ||
    cropBox.height !== mediaBox.height;

  if (!isCropped) {
    targetDoc.addPage(page);
    return;
  }

  try {
    const { embedded, width, height } = await embedVisiblePage(targetDoc, page);
    const cropPage = targetDoc.addPage([width, height]);
    cropPage.drawPage(embedded, { x: 0, y: 0, xScale: 1, yScale: 1 });
  } catch (error) {
    console.warn('Failed to hard-crop page, adding it as-is:', error);
    targetDoc.addPage(page);
  }
};

export const createCoverPage = async (
  pdf: PDFDocument,
  type: ExportType,
  selectedTopics: Set<string>,
  levelBoardSubject: { level: string; board: string; subject: string },
  boldFont: PDFFont,
  regularFont: PDFFont,
  filters?: { papers?: number[]; years?: number[]; order?: string; strict?: boolean }
) => {
  const width = 612; // Standard letter width
  const height = 792; // Standard letter height
  let page = pdf.addPage([width, height]);
  const coverPages: PDFPage[] = [page];

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.98, 0.98, 0.98) });

  // Load and embed logo
  try {
    const logoUrl = '/logos/logo1.png';
    const logoAbsoluteUrl = new URL(logoUrl, window.location.origin).href;
    const logoResponse = await fetch(logoAbsoluteUrl);

    if (logoResponse.ok) {
      const logoArrayBuffer = await logoResponse.arrayBuffer();
      const contentType = logoResponse.headers.get('content-type') || '';

      let logoImage;
      if (contentType.includes('png')) {
        logoImage = await pdf.embedPng(logoArrayBuffer);
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        logoImage = await pdf.embedJpg(logoArrayBuffer);
      }

      if (logoImage) {
        const imageDims = logoImage.scale(1);
        const maxLogoWidth = 150;
        const maxLogoHeight = 100;
        const scale = Math.min(maxLogoWidth / imageDims.width, maxLogoHeight / imageDims.height, 1);

        const scaledWidth = imageDims.width * scale;
        const scaledHeight = imageDims.height * scale;
        const logoX = (width - scaledWidth) / 2;
        const logoY = height - 150;

        page.drawImage(logoImage, { x: logoX, y: logoY, width: scaledWidth, height: scaledHeight });

        const textLogo = 'Learnmates';
        const textLogoSize = 20;
        const textLogoWidth = boldFont.widthOfTextAtSize(textLogo, textLogoSize);
        page.drawText(textLogo, {
          x: (width - textLogoWidth) / 2,
          y: logoY - 30,
          size: textLogoSize,
          font: boldFont,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
    }
  } catch (error) {
    console.warn('Failed to load logo:', error);
  }

  // Title
  const titleText = 'Content Covered';
  const titleSize = 28;
  const titleWidth = boldFont.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: height - 250,
    size: titleSize,
    font: boldFont,
    color: rgb(0, 0.4, 0.8),
  });

  // Subject info
  const subjectText = `${levelBoardSubject.level} - ${levelBoardSubject.board} - ${levelBoardSubject.subject}`;
  const subjectSize = 14;
  const subjectWidth = regularFont.widthOfTextAtSize(subjectText, subjectSize);
  page.drawText(subjectText, {
    x: (width - subjectWidth) / 2,
    y: height - 280,
    size: subjectSize,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Content type
  const contentTypeText = type === 'questions' ? 'Question Papers' : 'Mark Schemes';
  const contentTypeSize = 12;
  const contentTypeWidth = regularFont.widthOfTextAtSize(contentTypeText, contentTypeSize);
  page.drawText(contentTypeText, {
    x: (width - contentTypeWidth) / 2,
    y: height - 310,
    size: contentTypeSize,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  const { topicsStructure, totalTopicCount } = buildTopicsStructure(selectedTopics, levelBoardSubject);
  const sortedUnits = Object.keys(topicsStructure).sort();

  console.log('[CoverPage] selectedTopics:', selectedTopics);
  console.log('[CoverPage] topicsStructure:', topicsStructure);
  console.log('[CoverPage] totalTopicCount:', totalTopicCount);
  console.log('[CoverPage] sortedUnits:', sortedUnits);

  const leftMargin = 50;
  const rightMargin = 50;
  const contentWidth = width - leftMargin - rightMargin;
  const leftColumnWidth = contentWidth * 0.6;
  const rightColumnWidth = contentWidth * 0.35;
  const rightColumnX = leftMargin + leftColumnWidth + 20;

  let leftY = height - 360;
  let rightY = height - 360;

  // Draw right column box background for filters
  if (filters) {
    const filterLines = [];
    if (filters.papers && filters.papers.length > 0) filterLines.push(`Papers: ${filters.papers.map(p => `P${p}`).join(', ')}`);
    if (filters.years && filters.years.length > 0) {
      const sortedYears = [...filters.years].sort((a, b) => a - b);
      const yearRanges = [];
      let start = sortedYears[0];
      let end = sortedYears[0];
      
      for (let i = 1; i < sortedYears.length; i++) {
        if (sortedYears[i] === end + 1) {
          end = sortedYears[i];
        } else {
          yearRanges.push(start === end ? `${start}` : `${start}-${end}`);
          start = sortedYears[i];
          end = sortedYears[i];
        }
      }
      yearRanges.push(start === end ? `${start}` : `${start}-${end}`);
      filterLines.push(`Years: ${yearRanges.join(', ')}`);
    }
    if (filters.order) filterLines.push(`Order: ${filters.order === 'newest' ? 'New -> Old' : filters.order === 'oldest' ? 'Old -> New' : 'Random'}`);
    if (filters.strict) filterLines.push('Strict: Yes (exclusive topic match)');

    const boxPadding = 10;
    const lineHeight = 14;
    const boxHeight = filterLines.length * lineHeight + boxPadding * 2 + 20; // +20 for title
    const boxY = rightY - boxHeight;

    // Box background
    page.drawRectangle({
      x: rightColumnX,
      y: boxY,
      width: rightColumnWidth,
      height: boxHeight,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });

    // Filters title
    page.drawText('Filters Applied', {
      x: rightColumnX + boxPadding,
      y: rightY - 14,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    rightY -= 24;

    // Filter lines
    for (const line of filterLines) {
      page.drawText(sanitizeForPdf(line), {
        x: rightColumnX + boxPadding,
        y: rightY,
        size: 9,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3),
        maxWidth: rightColumnWidth - boxPadding * 2,
      });
      rightY -= lineHeight;
    }
  }

  // Left column - Topics Selected
  page.drawText('Topics Selected:', {
    x: leftMargin,
    y: leftY,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  leftY -= 18;

  const unitSize = 10;
  const mainTopicSize = 9;
  const topicSize = 8;
  const topicLineHeight = 11;

  const checkNewPage = (threshold: number) => {
    if (leftY < threshold) {
      page = pdf.addPage([width, height]);
      coverPages.push(page);
      page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.98, 0.98, 0.98) });
      leftY = height - 80;
      page.drawText('Topics Selected (continued):', {
        x: leftMargin,
        y: leftY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      leftY -= 25;
    }
  };

  sortedUnits.forEach(unit => {
    checkNewPage(120);

    page.drawText(sanitizeForPdf(`${unit}`), { x: leftMargin, y: leftY, size: unitSize, font: boldFont, color: rgb(0, 0.3, 0.6) });
    leftY -= topicLineHeight;

    const mainTopicsForUnit = Object.keys(topicsStructure[unit]).sort();
    mainTopicsForUnit.forEach(mainTopic => {
      checkNewPage(100);

      page.drawText(sanitizeForPdf(`${mainTopic}`), { x: leftMargin + 20, y: leftY, size: mainTopicSize, font: boldFont, color: rgb(0, 0, 0) });
      leftY -= topicLineHeight;

      const subtopics = topicsStructure[unit][mainTopic].sort();
      subtopics.forEach(subtopic => {
        checkNewPage(100);
        const displayText = `  \u2022 ${subtopic}`;
        page.drawText(sanitizeForPdf(displayText), {
          x: leftMargin + 20,
          y: leftY,
          size: topicSize,
          font: regularFont,
          color: rgb(0.2, 0.2, 0.2),
          maxWidth: leftColumnWidth - 40,
        });
        
        const textWidth = regularFont.widthOfTextAtSize(sanitizeForPdf(displayText), topicSize);
        const lines = Math.ceil(textWidth / (leftColumnWidth - 40));
        leftY -= topicLineHeight * (lines > 0 ? lines : 1);
      });

      leftY -= 2;
    });

    leftY -= 5;
  });

  coverPages.forEach((p, index) => {
    const isLastPage = index === coverPages.length - 1;
    
    if (isLastPage) {
      const topicCountText = `Total Topics: ${totalTopicCount}`;
      const topicCountSize = 9;
      const topicCountWidth = regularFont.widthOfTextAtSize(topicCountText, topicCountSize);
      p.drawText(topicCountText, {
        x: (width - topicCountWidth) / 2,
        y: 60,
        size: topicCountSize,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    const footerText = 'Created using Learnmates.org';
    const footerSize = 9;
    const footerWidth = regularFont.widthOfTextAtSize(footerText, footerSize);
    p.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 30,
      size: footerSize,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    p.drawLine({
      start: { x: width / 2 - 100, y: 40 },
      end: { x: width / 2 + 100, y: 40 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
  });
};

// ---------------------------------------------------------------------------
// Per-question header page
// ---------------------------------------------------------------------------

export const createHeaderPage = async (
  pdf: PDFDocument,
  question: Question,
  questionNumber: number,
  type: ExportType,
  width: number,
  boldFont: PDFFont,
  regularFont: PDFFont,
  headerHeight: number = 25
) => {
  const page = pdf.addPage([width, headerHeight]);

  page.drawRectangle({ x: 0, y: 0, width, height: headerHeight, color: rgb(0.85, 0.85, 0.85) });
  page.drawLine({ start: { x: 0, y: headerHeight - 1 }, end: { x: width, y: headerHeight - 1 }, thickness: 1, color: rgb(0.65, 0.65, 0.65) });
  page.drawLine({ start: { x: 0, y: 0 }, end: { x: width, y: 0 }, thickness: 1, color: rgb(0.65, 0.65, 0.65) });

  const titleText = question.title || `Question ${questionNumber}`;
  const questionRefText = `Question ${questionNumber}`;
  const topicsText = question.topicMatches && question.topicMatches.length > 0
    ? formatTopicHeaderText(question.topicMatches)
    : '';

  const titleSize = 8 + (headerHeight * 0.15);
  const topicSize = 7 + (headerHeight * 0.1);
  const safeTitle = sanitizeForPdf(titleText);
  const safeQuestionRef = sanitizeForPdf(questionRefText);

  const titleWidth = boldFont.widthOfTextAtSize(safeTitle, titleSize);

  page.drawText(safeQuestionRef, { x: 10, y: (headerHeight / 2) - (titleSize / 3), size: titleSize, font: boldFont, color: rgb(0, 0, 0) });

  const centerX = (width - titleWidth) / 2;
  page.drawText(safeTitle, { x: centerX, y: (headerHeight / 2) - (titleSize / 3), size: titleSize, font: boldFont, color: rgb(0, 0, 0) });

  if (topicsText) {
    const maxWidth = width - 20 - 170;
    let rendered = sanitizeForPdf(topicsText);
    while (regularFont.widthOfTextAtSize(rendered, topicSize) > maxWidth && rendered.length > 0) {
      rendered = rendered.slice(0, -1);
    }
    if (rendered !== topicsText) rendered = `${rendered.trimEnd()}…`;

    const renderedWidth = regularFont.widthOfTextAtSize(rendered, topicSize);
    page.drawText(rendered, {
      x: width - renderedWidth - 10,
      y: (headerHeight / 2) - (topicSize / 3),
      size: topicSize,
      font: regularFont,
      color: rgb(0.25, 0.25, 0.25),
    });
  }
};

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

const addBlankPageToPdf = async (pdf: PDFDocument, width: number, height: number) => {
  const page = pdf.addPage([width, height]);
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
};

export const mergeTopicalPDFs = async (
  questions: Question[],
  type: ExportType,
  selectedTopics: Set<string>,
  levelBoardSubject: { level: string; board: string; subject: string },
  onProgress?: (progress: ExportProgress) => void,
  options: { extraPage?: boolean; headerPage?: boolean; mergeHeader?: boolean; headerSize?: number; worksheet?: boolean } = {},
  filters?: { papers?: number[]; years?: number[]; order?: string; strict?: boolean }
): Promise<Blob> => {
  const mergedPdf = await PDFDocument.create();

  const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await mergedPdf.embedFont(StandardFonts.Helvetica);

  try {
    await createCoverPage(mergedPdf, type, selectedTopics, levelBoardSubject, boldFont, regularFont, filters);
  } catch (error) {
    console.warn('Failed to create cover page:', error);
  }

  interface FetchTask {
    questionIndex: number;
    question: Question;
    url: string;
    fileType: string;
  }

  const fetchTasks: FetchTask[] = [];
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    // For mark scheme exports, an MCQ answer letter (from mcq_ans.json) takes
    // priority over question.markScheme. markScheme is a *derived* path built
    // by string-substitution on the question file name - for MCQ questions it
    // often points at a mark scheme PDF that was never generated, so treating
    // it as authoritative causes real 404s. We already know the real answer,
    // so skip the fetch entirely whenever mcqAnswer is available.
    if (type === 'markschemes' && question.mcqAnswer) {
      fetchTasks.push({ questionIndex: i, question, url: '', fileType: 'mcqAnswer' });
      continue;
    }

    const fileUrl = type === 'questions' ? question.questionContent : question.markScheme;
    const fileType = type === 'questions' ? question.questionContentType : question.markSchemeType;

    if (!fileUrl) {
      console.warn(`Skipping question ${i + 1}: no file URL`);
      continue;
    }

    const absoluteUrl = fileUrl.startsWith('http') || fileUrl.startsWith('blob:')
      ? fileUrl
      : new URL(fileUrl, window.location.origin).href;

    fetchTasks.push({ questionIndex: i, question, url: absoluteUrl, fileType: fileType || 'unknown' });
  }

  interface FetchResult {
    task: FetchTask;
    arrayBuffer: ArrayBuffer | null;
    contentType: string;
    error: string | null;
  }

  let completedCount = 0;

  const allResults: FetchResult[] = await Promise.all(
    fetchTasks.map(async task => {
      if (task.fileType === 'mcqAnswer') {
        // No file to fetch — we just need the question data to draw an "Answer: X" page.
        completedCount++;
        onProgress?.({ current: completedCount, total: fetchTasks.length });
        return { task, arrayBuffer: new ArrayBuffer(0), contentType: 'mcq-answer', error: null };
      }
      try {
        // Use the R2-aware fetch function
        const arrayBuffer = await fetchFileAsArrayBuffer(task.url);

        if (!arrayBuffer) {
          return { task, arrayBuffer: null, contentType: '', error: 'Failed to fetch file' };
        }

        // Try to detect content type from the URL or file extension
        let contentType = '';
        if (task.fileType === 'pdf') {
          contentType = 'application/pdf';
        } else if (task.fileType === 'image') {
          // Try to detect from URL extension
          const ext = task.url.split('.').pop()?.toLowerCase();
          if (ext === 'png') contentType = 'image/png';
          else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
          else if (ext === 'gif') contentType = 'image/gif';
          else if (ext === 'webp') contentType = 'image/webp';
          else contentType = 'image/png'; // Default
        }

        return { task, arrayBuffer, contentType, error: null };
      } catch (err) {
        return { task, arrayBuffer: null, contentType: '', error: String(err) };
      } finally {
        completedCount++;
        onProgress?.({ current: completedCount, total: fetchTasks.length });
      }
    })
  );

  // ---------------------------------------------------------------------------
  // Pass 1: collect render items from all fetched results
  // ---------------------------------------------------------------------------

  type RenderItem =
    | { kind: 'pdfPage'; embedded: PDFEmbeddedPage; srcWidth: number; srcHeight: number; question: Question; questionNumber: number; isFirstPage: boolean }
    | { kind: 'image'; image: any; srcWidth: number; srcHeight: number; question: Question; questionNumber: number }
    | { kind: 'mcqAnswer'; question: Question; questionNumber: number };

  const renderItems: RenderItem[] = [];

  for (const result of allResults) {
    const { task, arrayBuffer, contentType, error } = result;
    const questionNumber = task.questionIndex + 1;

    if (error || !arrayBuffer) {
      console.error(`Failed to fetch ${task.fileType}${error ? `: ${error}` : ''}`);
      continue;
    }

    try {
      if (task.fileType === 'pdf') {
        const sourcePdf = await PDFDocument.load(arrayBuffer);
        const sourcePageIndices = sourcePdf.getPageIndices();
        const sourcePages = await mergedPdf.copyPages(sourcePdf, sourcePageIndices);

        for (let i = 0; i < sourcePages.length; i++) {
          const { embedded, width: srcWidth, height: srcHeight } = await embedVisiblePage(mergedPdf, sourcePages[i]);
          renderItems.push({ kind: 'pdfPage', embedded, srcWidth, srcHeight, question: task.question, questionNumber, isFirstPage: i === 0 });
        }
      } else if (task.fileType === 'image') {
        let image;
        if (contentType.includes('png')) {
          image = await mergedPdf.embedPng(arrayBuffer);
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          image = await mergedPdf.embedJpg(arrayBuffer);
        } else {
          try { image = await mergedPdf.embedPng(arrayBuffer); } catch { image = await mergedPdf.embedJpg(arrayBuffer); }
        }
        const imageDims = image.scale(1);
        renderItems.push({ kind: 'image', image, srcWidth: imageDims.width, srcHeight: imageDims.height, question: task.question, questionNumber });
      } else if (task.fileType === 'mcqAnswer') {
        renderItems.push({ kind: 'mcqAnswer', question: task.question, questionNumber });
      }
    } catch (error) {
      console.error(`Error processing question ${questionNumber}:`, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Pass 2: lay out render items onto A4 pages
  // ---------------------------------------------------------------------------

  const isWorksheet = options.worksheet !== false;
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const MARGIN = isWorksheet ? 20 : 40;
  const SPACING = isWorksheet ? 8 : 12;
  const PRINTABLE_WIDTH = A4_WIDTH - 2 * MARGIN;
  const PRINTABLE_HEIGHT = A4_HEIGHT - 2 * MARGIN;

  const headerHeight = options.headerPage ? (options.headerSize || 25) : 0;
  const titleSize = 8 + (headerHeight * 0.15);
  const topicSize = 7 + (headerHeight * 0.1);

  if (!isWorksheet) {
    let lastQuestionNumber = -1;
    for (let i = 0; i < renderItems.length; i++) {
      const item = renderItems[i];
      const needsHeader = options.headerPage && item.kind !== 'mcqAnswer' && item.questionNumber !== lastQuestionNumber;
      if (item.questionNumber !== lastQuestionNumber) {
        lastQuestionNumber = item.questionNumber;
      }

      if (item.kind === 'mcqAnswer') {
        const bandH = 50;
        const p = mergedPdf.addPage([A4_WIDTH, bandH]);
        p.drawRectangle({ x: 0, y: 0, width: A4_WIDTH, height: bandH, color: rgb(0.95, 0.95, 0.95) });
        const safeTitle = sanitizeForPdf(item.question.title || `Question ${item.questionNumber}`);
        const safeRef = sanitizeForPdf(`Question ${item.questionNumber}`);
        const titleW = boldFont.widthOfTextAtSize(safeTitle, 11);
        p.drawText(safeRef, { x: 20, y: bandH / 2 - 11 / 3, size: 11, font: boldFont, color: rgb(0, 0, 0) });
        p.drawText(safeTitle, { x: (A4_WIDTH - titleW) / 2, y: bandH / 2 - 11 / 3, size: 11, font: boldFont, color: rgb(0, 0, 0) });
        const answerText = `Answer: ${item.question.mcqAnswer || '?'}`;
        const answerW = boldFont.widthOfTextAtSize(answerText, 15);
        p.drawText(answerText, { x: A4_WIDTH - answerW - 20, y: bandH / 2 - 15 / 3, size: 15, font: boldFont, color: rgb(0, 0.4, 0.2) });
      } else {
        const addedHeight = needsHeader ? headerHeight : 0;
        const p = mergedPdf.addPage([item.srcWidth, item.srcHeight + addedHeight]);
        
        if (needsHeader) {
          const bandY = item.srcHeight;
          p.drawRectangle({ x: 0, y: bandY, width: item.srcWidth, height: headerHeight, color: rgb(0.95, 0.95, 0.95) });
          p.drawLine({ start: { x: 0, y: bandY }, end: { x: item.srcWidth, y: bandY }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
          
          const safeTitle = sanitizeForPdf(item.question.title || `Question ${item.questionNumber}`);
          const safeRef = sanitizeForPdf(`Question ${item.questionNumber}`);
          const titleW = boldFont.widthOfTextAtSize(safeTitle, titleSize);
          const textY = bandY + headerHeight / 2 - titleSize / 3;
          
          p.drawText(safeRef, { x: 10, y: textY, size: titleSize, font: boldFont, color: rgb(0, 0, 0) });
          p.drawText(safeTitle, { x: (item.srcWidth - titleW) / 2, y: textY, size: titleSize, font: boldFont, color: rgb(0, 0, 0) });

          const topicsText = item.question.topicMatches && item.question.topicMatches.length > 0
            ? formatTopicHeaderText(item.question.topicMatches) : '';
          if (topicsText) {
            const maxW = item.srcWidth - 30 - 150;
            let rendered = sanitizeForPdf(topicsText);
            while (regularFont.widthOfTextAtSize(rendered, topicSize) > maxW && rendered.length > 0) rendered = rendered.slice(0, -1);
            if (rendered !== topicsText) rendered = `${rendered.trimEnd()}…`;
            const renderedW = regularFont.widthOfTextAtSize(rendered, topicSize);
            p.drawText(rendered, { x: item.srcWidth - renderedW - 10, y: textY, size: topicSize, font: regularFont, color: rgb(0.25, 0.25, 0.25) });
          }
        }

        if (item.kind === 'pdfPage') {
          p.drawPage(item.embedded, { x: 0, y: 0, width: item.srcWidth, height: item.srcHeight });
        } else {
          p.drawImage(item.image, { x: 0, y: 0, width: item.srcWidth, height: item.srcHeight });
        }
      }

      if (options.extraPage && type === 'questions') {
        const nextItem = renderItems[i + 1];
        if (!nextItem || nextItem.questionNumber !== item.questionNumber) {
          await addBlankPageToPdf(mergedPdf, item.kind === 'mcqAnswer' ? A4_WIDTH : item.srcWidth, item.kind === 'mcqAnswer' ? A4_HEIGHT : item.srcHeight);
        }
      }
    }
    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  }

  // --- isWorksheet (uses A4 mapping) ---
  let currentPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
  let currentY = A4_HEIGHT - MARGIN;

  const newA4Page = () => {
    currentPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
    currentY = A4_HEIGHT - MARGIN;
  };

  const drawHeaderBand = (item: RenderItem & { question: Question; questionNumber: number }, bandWidth: number) => {
    if (!options.headerPage || headerHeight === 0) return;
    const bandY = currentY - headerHeight;

    currentPage.drawRectangle({ x: MARGIN, y: bandY, width: bandWidth, height: headerHeight, color: rgb(0.95, 0.95, 0.95) });
    currentPage.drawLine({ start: { x: MARGIN, y: bandY }, end: { x: MARGIN + bandWidth, y: bandY }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });

    const titleText = item.question.title || `Question ${item.questionNumber}`;
    const questionRefText = `Question ${item.questionNumber}`;
    const safeTitle = sanitizeForPdf(titleText);
    const safeQuestionRef = sanitizeForPdf(questionRefText);
    const titleW = boldFont.widthOfTextAtSize(safeTitle, titleSize);

    const textY = bandY + headerHeight / 2 - titleSize / 3;
    currentPage.drawText(safeQuestionRef, { x: MARGIN + 10, y: textY, size: titleSize, font: boldFont, color: rgb(0, 0, 0) });
    currentPage.drawText(safeTitle, { x: MARGIN + (bandWidth - titleW) / 2, y: textY, size: titleSize, font: boldFont, color: rgb(0, 0, 0) });

    const topicsText = item.question.topicMatches && item.question.topicMatches.length > 0
      ? formatTopicHeaderText(item.question.topicMatches) : '';
    if (topicsText) {
      const maxW = bandWidth - 30 - 150;
      let rendered = sanitizeForPdf(topicsText);
      while (regularFont.widthOfTextAtSize(rendered, topicSize) > maxW && rendered.length > 0) rendered = rendered.slice(0, -1);
      if (rendered !== topicsText) rendered = `${rendered.trimEnd()}…`;
      const renderedW = regularFont.widthOfTextAtSize(rendered, topicSize);
      currentPage.drawText(rendered, { x: MARGIN + bandWidth - renderedW - 10, y: textY, size: topicSize, font: regularFont, color: rgb(0.25, 0.25, 0.25) });
    }

    currentY -= headerHeight;
  };

  if (options.extraPage && type === 'questions') {
    const questionGroups: { questionNumber: number; question: Question; items: RenderItem[] }[] = [];
    for (const item of renderItems) {
      const qNum = item.questionNumber;
      let group = questionGroups.find(g => g.questionNumber === qNum);
      if (!group) {
        group = { questionNumber: qNum, question: item.question, items: [] };
        questionGroups.push(group);
      }
      group.items.push(item);
    }

    for (let gIdx = 0; gIdx < questionGroups.length; gIdx++) {
      const group = questionGroups[gIdx];

      if (gIdx > 0 && currentY < A4_HEIGHT - MARGIN) {
        newA4Page();
      }

      for (const item of group.items) {
        if (item.kind === 'mcqAnswer') {
          const bandH = 25;
          if (currentY - bandH < MARGIN) newA4Page();
          const bandY = currentY - bandH;

          currentPage.drawRectangle({ x: MARGIN, y: bandY, width: PRINTABLE_WIDTH, height: bandH, color: rgb(0.95, 0.95, 0.95) });
          currentPage.drawLine({ start: { x: MARGIN, y: bandY + bandH - 1 }, end: { x: MARGIN + PRINTABLE_WIDTH, y: bandY + bandH - 1 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
          currentPage.drawLine({ start: { x: MARGIN, y: bandY }, end: { x: MARGIN + PRINTABLE_WIDTH, y: bandY }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });

          const titleText = item.question.title || `Question ${item.questionNumber}`;
          const safeTitle = sanitizeForPdf(titleText);
          const safeRef = sanitizeForPdf(`Question ${item.questionNumber}`);
          const titleW = boldFont.widthOfTextAtSize(safeTitle, 11);
          const textY = bandY + bandH / 2 - 11 / 3;

          currentPage.drawText(safeRef, { x: MARGIN + 10, y: textY, size: 11, font: boldFont, color: rgb(0, 0, 0) });
          currentPage.drawText(safeTitle, { x: MARGIN + (PRINTABLE_WIDTH - titleW) / 2, y: textY, size: 11, font: boldFont, color: rgb(0, 0, 0) });

          const answerText = `Answer: ${item.question.mcqAnswer || '?'}`;
          const answerSize = 15;
          const answerW = boldFont.widthOfTextAtSize(answerText, answerSize);
          currentPage.drawText(answerText, { x: MARGIN + PRINTABLE_WIDTH - answerW - 10, y: textY, size: answerSize, font: boldFont, color: rgb(0, 0.4, 0.2) });

          currentY = bandY - SPACING;
          continue;
        }

        let scale = PRINTABLE_WIDTH / item.srcWidth;
        let scaledWidth = PRINTABLE_WIDTH;
        let scaledHeight = item.srcHeight * scale;

        const maxContentHeight = PRINTABLE_HEIGHT - headerHeight;
        if (scaledHeight > maxContentHeight) {
          scale = maxContentHeight / item.srcHeight;
          scaledWidth = item.srcWidth * scale;
          scaledHeight = maxContentHeight;
        }

        const needsHeader = options.headerPage && item.kind === 'pdfPage' && item.isFirstPage;
        const totalHeight = scaledHeight + (needsHeader ? headerHeight : 0);

        if (currentY - totalHeight < MARGIN) {
          if (currentY < A4_HEIGHT - MARGIN) {
            newA4Page();
          }
        }

        if (needsHeader) {
          drawHeaderBand(item as any, scaledWidth);
        }

        const x = MARGIN + (PRINTABLE_WIDTH - scaledWidth) / 2;
        const y = currentY - scaledHeight;

        if (item.kind === 'pdfPage') {
          currentPage.drawPage(item.embedded, { x, y, width: scaledWidth, height: scaledHeight });
        } else {
          currentPage.drawImage(item.image, { x, y, width: scaledWidth, height: scaledHeight });
        }

        currentY = y - SPACING;
      }

      await addBlankPageToPdf(mergedPdf, A4_WIDTH, A4_HEIGHT);
      if (gIdx < questionGroups.length - 1) {
        newA4Page();
      }
    }
  } else {
    for (const item of renderItems) {
      if (item.kind === 'mcqAnswer') {
        const bandH = 25;
        if (currentY - bandH < MARGIN) newA4Page();
        const bandY = currentY - bandH;

        currentPage.drawRectangle({ x: MARGIN, y: bandY, width: PRINTABLE_WIDTH, height: bandH, color: rgb(0.95, 0.95, 0.95) });
        currentPage.drawLine({ start: { x: MARGIN, y: bandY + bandH - 1 }, end: { x: MARGIN + PRINTABLE_WIDTH, y: bandY + bandH - 1 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
        currentPage.drawLine({ start: { x: MARGIN, y: bandY }, end: { x: MARGIN + PRINTABLE_WIDTH, y: bandY }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });

        const titleText = item.question.title || `Question ${item.questionNumber}`;
        const safeTitle = sanitizeForPdf(titleText);
        const safeRef = sanitizeForPdf(`Question ${item.questionNumber}`);
        const titleW = boldFont.widthOfTextAtSize(safeTitle, 11);
        const textY = bandY + bandH / 2 - 11 / 3;

        currentPage.drawText(safeRef, { x: MARGIN + 10, y: textY, size: 11, font: boldFont, color: rgb(0, 0, 0) });
        currentPage.drawText(safeTitle, { x: MARGIN + (PRINTABLE_WIDTH - titleW) / 2, y: textY, size: 11, font: boldFont, color: rgb(0, 0, 0) });

        const answerText = `Answer: ${item.question.mcqAnswer || '?'}`;
        const answerSize = 15;
        const answerW = boldFont.widthOfTextAtSize(answerText, answerSize);
        currentPage.drawText(answerText, { x: MARGIN + PRINTABLE_WIDTH - answerW - 10, y: textY, size: answerSize, font: boldFont, color: rgb(0, 0.4, 0.2) });

        currentY = bandY - SPACING;
        continue;
      }

      let scale = PRINTABLE_WIDTH / item.srcWidth;
      let scaledWidth = PRINTABLE_WIDTH;
      let scaledHeight = item.srcHeight * scale;

      const maxContentHeight = PRINTABLE_HEIGHT - headerHeight;
      if (scaledHeight > maxContentHeight) {
        scale = maxContentHeight / item.srcHeight;
        scaledWidth = item.srcWidth * scale;
        scaledHeight = maxContentHeight;
      }

      const needsHeader = options.headerPage && item.kind === 'pdfPage' && item.isFirstPage;
      const totalHeight = scaledHeight + (needsHeader ? headerHeight : 0);

      if (currentY - totalHeight < MARGIN) {
        if (currentY < A4_HEIGHT - MARGIN) {
          newA4Page();
        }
      }

      if (needsHeader) {
        drawHeaderBand(item as any, scaledWidth);
      }

      const x = MARGIN + (PRINTABLE_WIDTH - scaledWidth) / 2;
      const y = currentY - scaledHeight;

      if (item.kind === 'pdfPage') {
        currentPage.drawPage(item.embedded, { x, y, width: scaledWidth, height: scaledHeight });
      } else {
        currentPage.drawImage(item.image, { x, y, width: scaledWidth, height: scaledHeight });
      }

      currentY = y - SPACING;
    }
  }

  const pdfBytes = await mergedPdf.save();
  return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
};

// ---------------------------------------------------------------------------
// Top-level "download" action
// ---------------------------------------------------------------------------

export const downloadMergedTopicalPDFs = async (
  type: ExportType,
  questions: Question[],
  selectedTopics: Set<string>,
  levelBoardSubject: { level: string; board: string; subject: string; unit?: string },
  callbacks: {
    onStart?: () => void;
    onProgress?: (progress: ExportProgress) => void;
    onDone?: () => void;
    onError?: (message: string) => void;
  } = {},
  options: { extraPage?: boolean; headerPage?: boolean; mergeHeader?: boolean; headerSize?: number; worksheet?: boolean } = {},
  filters?: { papers?: number[]; years?: number[]; order?: string; strict?: boolean }
) => {
  if (questions.length === 0) {
    callbacks.onError?.('No questions to download');
    return;
  }

  const validQuestions = questions.filter(q => {
    if (type === 'markschemes' && q.mcqAnswer) return true;
    const fileUrl = type === 'questions' ? q.questionContent : q.markScheme;
    const fileType = type === 'questions' ? q.questionContentType : q.markSchemeType;
    return fileUrl && (fileType === 'pdf' || fileType === 'image');
  });

  if (validQuestions.length === 0) {
    callbacks.onError?.(`No ${type === 'questions' ? 'question' : 'mark scheme'} files found to merge.`);
    return;
  }

  const subjectName = levelBoardSubject.subject.charAt(0).toUpperCase() + levelBoardSubject.subject.slice(1);
  const unitPart = levelBoardSubject.unit ? `_${levelBoardSubject.unit.replace(/\s+/g, '_')}` : '';
  const filename = `${levelBoardSubject.level}_${levelBoardSubject.board}_${subjectName}${unitPart}_${type === 'questions' ? 'Questions' : 'Mark_Schemes'}.pdf`;

  try {
    callbacks.onStart?.();
    callbacks.onProgress?.({ current: 0, total: validQuestions.length });

    try {
      await commitDownloadAward({
        resourceId: `${levelBoardSubject.level}_${levelBoardSubject.board}_${levelBoardSubject.subject}_${type}`,
        resourceName: filename,
        resourceType: 'topical_paper',
      });
    } catch (xpError) {
      console.warn('Download XP failed; continuing merge:', xpError);
    }

    const mergedBlob = await mergeTopicalPDFs(validQuestions, type, selectedTopics, levelBoardSubject, callbacks.onProgress, options, filters);

    const downloadUrl = window.URL.createObjectURL(mergedBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    callbacks.onDone?.();
  } catch (error) {
    console.error('Error merging PDFs:', error);
    callbacks.onError?.('Failed to merge PDFs. Please try again.');
    callbacks.onDone?.();
  }
};