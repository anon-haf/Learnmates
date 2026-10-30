import type { Question } from '../components/TopicalQuiz';
import { loadPdfDocument } from './pdfThumbnail';
import { getAssetAuthHeaders, resolveFromR2 } from './r2Utils';

export const TOPICAL_EXPLANATION_PROMPT_VERSION = '2026-10-30-v8';
export const TOPICAL_EXPLANATION_MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export interface TopicalExplanationSection {
  kind: 'part' | 'question' | 'option' | 'answer';
  label: string;
  content: string;
  mark?: string;
}

export const NON_MCQ_EXPLANATION_PROMPT = `You are an experienced, patient tutor. The attached images show the question first, followed by the mark scheme. Use the mark-scheme images privately as the authority for correctness, then teach the student how to reason their way to the answer.

Labels may be letters only, e.g. (a), (b), (c), or a letter with roman numerals, e.g. (a i), (a ii), (b i). A question may mix these styles: part (a) may be split into (a i) and (a ii), while part (b) is not split and remains just (b). Follow the labels exactly as they appear. Do not invent subparts or split a part unless the question or mark scheme labels it as split.

Format each part as a block using EXACTLY this structure, one block per part and in order. Preserve all LaTeX exactly as written; do not escape backslashes or convert it to plain text. Wrap every mathematical expression in KaTeX delimiters: use \\(...\\) inline and \\[...\\] for standalone equations. Put only the explanation inside each block; the label is the heading.

:::part <label>
<clear, step-by-step teaching explanation that leads to the answer>
:::

Example:
:::part a i
Use the change in velocity relation, \\(\\Delta v = v - u\\). Substituting the final and initial velocities gives \\(12 - 4 = 8\\) m s⁻¹. Both velocities are to the right, so the change is 8 m s⁻¹ to the right.
:::

If a question has no labelled parts, use one block labelled question:
:::question
<clear, step-by-step teaching explanation that leads to the answer>
:::

Rules:
- Process all attached images/pages in order.
- Before writing, identify every question part and subpart shown across the question images. Explain every one, in order, and include a separate block for each; do not skip any part or subpart.
- Check that the output labels cover the full sequence visible in the question. Do not jump over a label (for example, outputting (a) and then (c) while omitting (b)); if a part is visible but its label or content is unclear, state exactly what is unclear in that part's block instead of omitting it.
- Do not restate, quote, or paraphrase the question. Start directly with the teaching explanation.
- Do not mention the mark scheme or mark allocations. Refer to an accepted alternative only when it helps the student understand the concept.
- Teach the reasoning as an experienced tutor: explain why each step is taken, define needed ideas, and connect the steps to the result.
- Keep exact labels from the question, including mixed styles such as (a i), (a ii), (b), (c i).
- Use one block per labelled part/subpart. Never merge subparts or create subparts for an unsplit part.
- Explain how to reach the answer rather than merely stating it.
- If a part depends on a previous answer, say so.
- Never emit a bare ::: line inside the content.
- If the question or information needed to explain it is unclear, state exactly what is unclear instead of guessing.
- Output only the blocks. No preamble, summary, or commentary.`;

export const MCQ_EXPLANATION_PROMPT = `You are an experienced, patient tutor. The attached image(s) show one or more multiple-choice questions. The authoritative correct answer from the topical MCQ answer key is provided below. Treat it as correct. Teach the reasoning behind each option.

Correct answer from mcq_ans.json: <correct answer letter>

Format each option as a block using EXACTLY this structure, one block per option and in order, for each MCQ. Preserve all LaTeX exactly as written; do not escape backslashes or convert it to plain text. Wrap every mathematical expression in KaTeX delimiters: use \\(...\\) inline and \\[...\\] for standalone equations.

:::option <letter>
<clear teaching explanation of why this option is correct or incorrect>
:::

Example:
:::option B
The resultant force points left, so the acceleration must also point left. Its magnitude is \\(F/m = 6/3 = 2\\) m s⁻². This choice has the right magnitude but the wrong direction.
:::

Rules:
- Use the attached question image to read the question and all options.
- Process all attached question images/pages in order, and each MCQ within a page in order.
- Keep exact option labels from the question: A, B, C, D, or A through E if five options are present. Include every option.
- Use one block per option, even if an option is obviously wrong.
- Do not restate, quote, or paraphrase the question or option text. The option label is the heading; start directly with the reasoning.
- Do not announce the correct letter separately. The supplied answer-key letter is the correct option; explain the concept or calculation that makes it correct.
- For each incorrect option, name the specific error or misconception that makes it wrong. If an option is partially correct but ultimately wrong, say so.
- Do not mention the mark scheme or mark allocations. Focus on teaching the underlying concept like an experienced tutor.
- If an option depends on a previous calculation or result, say so.
- Never emit a bare ::: line inside the content.
- If the question image or an option is unclear, state exactly what is unclear instead of guessing.
- Output only the blocks. No preamble, summary, or commentary.`;

export function getTopicalAiSubject(question: Question): string | null {
  const questionUrl = question.questionContent;
  if (!questionUrl) return null;

  try {
    const pathname = new URL(questionUrl, window.location.origin).pathname;
    const parts = pathname.split('/').filter(Boolean).map(part => decodeURIComponent(part));
    if (parts[0] !== 'topicals' || parts.length < 4) return null;

    const [, level, board, subject] = parts;
    const normalizedLevel = level.toLowerCase();
    const normalizedBoard = board.toLowerCase();
    const levelPrefix = normalizedLevel === 'igcse'
      ? 'IG'
      : normalizedLevel === 'ial' || (normalizedLevel === 'a-level' && normalizedBoard === 'edexcel')
        ? 'IAL'
        : normalizedLevel === 'a-level'
          ? 'A'
          : null;
    const subjectSuffix: Record<string, string> = {
      physics: 'Phy',
      chemistry: 'Chem',
      biology: 'Bio',
    };
    const suffix = subjectSuffix[subject.toLowerCase()];
    return levelPrefix && suffix ? `${levelPrefix}_${suffix}` : null;
  } catch {
    return null;
  }
}

export function createTopicalExplanationCacheKey(
  questionUrl: string,
  markSchemeUrl: string | null,
  isMcq: boolean,
  correctAnswer?: string,
  promptVersion = TOPICAL_EXPLANATION_PROMPT_VERSION,
): Promise<string> {
  const content = [
    promptVersion,
    isMcq ? 'mcq' : 'non-mcq',
    questionUrl,
    isMcq ? correctAnswer?.trim().toUpperCase() || '' : markSchemeUrl || '',
  ].join('\n');
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(content)).then(digest =>
    Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  );
}

export function parseTopicalExplanation(
  answer: string,
  expectedKind: 'part' | 'option',
): { sections: TopicalExplanationSection[]; isStructured: boolean } {
  const sections: TopicalExplanationSection[] = [];
  const blockPattern = /^:::(part|question|option)\s+(.+?)\s*\r?$/gm;
  let match: RegExpExecArray | null;
  let previousMatch: RegExpExecArray | null = null;

  while ((match = blockPattern.exec(answer)) !== null) {
    if (previousMatch) {
      const kind = previousMatch[1] as TopicalExplanationSection['kind'];
      const content = answer
        .slice(previousMatch.index + previousMatch[0].length, match.index)
        .replace(/^\r?\n/, '')
        .replace(/(?:^|\r?\n)[ \t]*:::[ \t]*(?=\r?\n|$)/g, '\n')
        .trim();
      if (kind === 'question' || kind === expectedKind) {
        sections.push({ kind, label: previousMatch[2].trim(), content });
      }
    }
    previousMatch = match;
  }

  if (previousMatch) {
    const kind = previousMatch[1] as TopicalExplanationSection['kind'];
    const content = answer
      .slice(previousMatch.index + previousMatch[0].length)
      .replace(/^\r?\n/, '')
      .replace(/(?:^|\r?\n)[ \t]*:::[ \t]*(?=\r?\n|$)/g, '\n')
      .trim();
    if (kind === 'question' || kind === expectedKind) {
      sections.push({ kind, label: previousMatch[2].trim(), content });
    }
  }

  if (sections.length > 0) return { sections, isStructured: true };
  return {
    sections: [{ kind: 'answer', label: 'Explanation', content: answer.trim() }],
    isStructured: false,
  };
}

export function parseMarkedTopicalExplanation(answer: string): TopicalExplanationSection[] {
  const sections: TopicalExplanationSection[] = [];
  const headerPattern = /^:::part\s+(.+?)\s+(\d+\s*\/\s*\d+|\?\/\?)\s*$/gm;
  let match: RegExpExecArray | null;
  let previousMatch: RegExpExecArray | null = null;

  while ((match = headerPattern.exec(answer)) !== null) {
    if (previousMatch) {
      const content = answer
        .slice(previousMatch.index + previousMatch[0].length, match.index)
        .replace(/^\r?\n/, '')
        .replace(/(?:^|\r?\n)[ \t]*:::[ \t]*(?=\r?\n|$)/g, '\n')
        .trim();
      sections.push({
        kind: 'part',
        label: previousMatch[1].trim(),
        mark: previousMatch[2].replace(/\s/g, ''),
        content,
      });
    }
    previousMatch = match;
  }

  if (previousMatch) {
    const content = answer
      .slice(previousMatch.index + previousMatch[0].length)
      .replace(/^\r?\n/, '')
      .replace(/(?:^|\r?\n)[ \t]*:::[ \t]*(?=\r?\n|$)/g, '\n')
      .trim();
    sections.push({
      kind: 'part',
      label: previousMatch[1].trim(),
      mark: previousMatch[2].replace(/\s/g, ''),
      content,
    });
  }
  return sections;
}

function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

async function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Could not encode a PDF page as an image.')),
      'image/jpeg',
      quality,
    );
  });
}

async function renderPdfPages(
  question: Question,
  markSchemeUrl: string | null,
): Promise<File[]> {
  const sources = [
    {
      url: question.questionContent!,
      type: question.questionContentType || 'pdf',
      name: 'question',
    },
    ...(markSchemeUrl ? [{
      url: markSchemeUrl,
      type: question.markSchemeType || (/\.(?:png|jpe?g|webp|gif)(?:$|[?#])/i.test(markSchemeUrl) ? 'image' : 'pdf'),
      name: 'mark-scheme',
    }] : []),
  ];
  const pdfs: Array<Awaited<ReturnType<typeof loadPdfDocument>> | null> = [];

  try {
    for (const source of sources) {
      pdfs.push(source.type === 'pdf' ? await loadPdfDocument(source.url) : null);
    }

    const totalPages = sources.reduce((total, source, index) =>
      total + (source.type === 'pdf' ? (pdfs[index]?.numPages || 0) : 1), 0);
    let maxWidth = Math.min(1400, Math.max(620, Math.floor(2200 / Math.sqrt(totalPages))));
    let quality = 0.65;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const files: File[] = [];
      for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex += 1) {
        const source = sources[sourceIndex];
        const pdf = pdfs[sourceIndex];
        if (source.type === 'pdf' && pdf) {
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const page = await pdf.getPage(pageNumber);
            const unscaledViewport = page.getViewport({ scale: 1 });
            const scale = Math.min(1.5, maxWidth / unscaledViewport.width);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Your browser could not prepare PDF page images.');
            canvas.width = Math.max(1, Math.floor(viewport.width));
            canvas.height = Math.max(1, Math.floor(viewport.height));
            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvas, canvasContext: context, viewport }).promise;
            const blob = await canvasToJpeg(canvas, quality);
            canvas.width = 0;
            canvas.height = 0;
            page.cleanup();
            files.push(blobToFile(
              blob,
              `${source.name}-page-${String(pageNumber).padStart(3, '0')}.jpg`,
            ));
          }
        } else {
          const resolvedUrl = (await resolveFromR2(source.url)) || source.url;
          const absoluteUrl = resolvedUrl.startsWith('http') || resolvedUrl.startsWith('blob:')
            ? resolvedUrl
            : new URL(resolvedUrl, window.location.origin).href;
          const response = await fetch(absoluteUrl, { headers: getAssetAuthHeaders() });
          if (!response.ok) throw new Error(`Could not load the ${source.name} image (${response.status}).`);
          const image = await createImageBitmap(await response.blob());
          const scale = Math.min(1, maxWidth / image.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.floor(image.width * scale));
          canvas.height = Math.max(1, Math.floor(image.height * scale));
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Your browser could not prepare document images.');
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          image.close();
          const blob = await canvasToJpeg(canvas, quality);
          canvas.width = 0;
          canvas.height = 0;
          files.push(blobToFile(blob, `${source.name}-page-001.jpg`));
        }
      }

      const totalBytes = files.reduce((total, file) => total + file.size, 0);
      if (totalBytes <= TOPICAL_EXPLANATION_MAX_IMAGE_BYTES) return files;
      maxWidth = Math.max(420, Math.floor(maxWidth * 0.78));
      quality = Math.max(0.35, quality * 0.82);
    }

    throw new Error('These documents are too large to send together. Please use shorter PDFs or smaller image files.');
  } finally {
    await Promise.all(pdfs.map(pdf => pdf?.destroy()));
  }
}

export function buildTopicalExplanationImages(question: Question, markSchemeUrl: string | null): Promise<File[]> {
  if (!question.questionContent) throw new Error('The question document is missing.');
  return renderPdfPages(question, markSchemeUrl);
}
