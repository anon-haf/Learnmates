import {
  PDFDocument,
  PDFPage,
  PDFEmbeddedPage,
  PDFArray,
  PDFStream,
  PDFRawStream,
  PDFContentStream,
  PDFName,
  decodePDFRawStream,
} from 'pdf-lib';

// ---------------------------------------------------------------------------
// CropBox-aware page embedding with text-layer hard-cropping.
//
// Some source files are "soft cropped" (e.g. with PyMuPDF): only /CropBox is
// set while the page content stream still holds the whole page. When such a
// page is embedded as a form XObject via pdf-lib, the ENTIRE content stream is
// copied into the form and only /BBox is meant to clip it. Different consumers
// behave differently:
//   - MuPDF honours both the page CropBox and the form /BBox.
//   - poppler and pdf.js honour the page CropBox but IGNORE the form /BBox and
//     any clip path when building the text layer.
// As a result, when several cropped questions are placed on one merged page,
// every question's text is picked up from every form, producing duplicated
// "ghost" text (the rendering looks fine, but text selection / search / copy
// shows each line multiple times).
//
// The only reliable fix is to actually REMOVE the text-showing operators whose
// position falls outside the visible window from the embedded content stream,
// while keeping all layout operators intact so the rest of the content keeps
// its position. This is what `filterContentString` does below.
// ---------------------------------------------------------------------------

export interface VisiblePage {
  embedded: PDFEmbeddedPage;
  width: number;
  height: number;
}

type Window = [number, number, number, number]; // left, bottom, right, top

const DELIM = new Set<number>();
for (const ch of ' \t\r\n\x0c\x00/[]<>(){}%#') DELIM.add(ch.charCodeAt(0));

const NUM_RE = /[+-]?(?:\d+\.?\d*|\.\d+)/y;

interface Token {
  kind: 'num' | 'name' | 'str' | 'op' | 'arropen' | 'arrclose' | 'dictopen' | 'dictclose' | 'braceopen' | 'braceclose';
  start: number;
  end: number;
  value: number | string | null;
}

function bytesToLatin1(data: Uint8Array): string {
  const CHUNK = 8192;
  let out = '';
  for (let i = 0; i < data.length; i += CHUNK) {
    const end = Math.min(i + CHUNK, data.length);
    const arr: string[] = [];
    for (let j = i; j < end; j++) arr.push(String.fromCharCode(data[j]));
    out += arr.join('');
  }
  return out;
}

function tokenize(s: string): Token[] {
  const toks: Token[] = [];
  const n = s.length;
  let i = 0;

  while (i < n) {
    const c = s.charCodeAt(i);
    if (c === 32 || c === 9 || c === 13 || c === 10 || c === 12 || c === 0) {
      i++;
      continue;
    }
    if (c === 37) {
      // comment: `% ...` up to end of line
      const j = s.indexOf('\n', i);
      i = j < 0 ? n : j + 1;
      continue;
    }
    if (c === 47) {
      // name: `/Foo`
      let j = i + 1;
      while (j < n && !DELIM.has(s.charCodeAt(j))) j++;
      toks.push({ kind: 'name', start: i, end: j, value: s.slice(i + 1, j) });
      i = j;
      continue;
    }
    if (c === 40) {
      // literal string: balanced parentheses with escapes
      let depth = 0;
      let j = i;
      while (j < n) {
        const ch = s.charCodeAt(j);
        if (ch === 92) {
          j += 2;
          continue;
        }
        if (ch === 40) depth++;
        else if (ch === 41) {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
        j++;
      }
      toks.push({ kind: 'str', start: i, end: j, value: s.slice(i, j) });
      i = j;
      continue;
    }
    if (c === 60) {
      // `<<` dict open or `<hex>` string
      if (s.charCodeAt(i + 1) === 60) {
        toks.push({ kind: 'dictopen', start: i, end: i + 2, value: null });
        i += 2;
        continue;
      }
      let j = s.indexOf('>', i);
      if (j < 0) j = n - 1;
      toks.push({ kind: 'str', start: i, end: j + 1, value: s.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    if (c === 62) {
      // `>` (stray) or `>>` dict close
      if (s.charCodeAt(i + 1) === 62) {
        toks.push({ kind: 'dictclose', start: i, end: i + 2, value: null });
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (c === 91) {
      toks.push({ kind: 'arropen', start: i, end: i + 1, value: null });
      i++;
      continue;
    }
    if (c === 93) {
      toks.push({ kind: 'arrclose', start: i, end: i + 1, value: null });
      i++;
      continue;
    }
    if (c === 123) {
      toks.push({ kind: 'braceopen', start: i, end: i + 1, value: null });
      i++;
      continue;
    }
    if (c === 125) {
      toks.push({ kind: 'braceclose', start: i, end: i + 1, value: null });
      i++;
      continue;
    }

    NUM_RE.lastIndex = i;
    const m = NUM_RE.exec(s);
    if (m && m.index === i) {
      toks.push({ kind: 'num', start: i, end: m.index + m[0].length, value: parseFloat(m[0]) });
      i = m.index + m[0].length;
      continue;
    }

    let j = i;
    while (j < n && !DELIM.has(s.charCodeAt(j))) j++;
    toks.push({ kind: 'op', start: i, end: j, value: s.slice(i, j) });
    i = j;
  }

  return toks;
}

// Multiply two PDF matrices [a b c d e f].
function mmul(m: number[], n: number[]): number[] {
  const [a1, b1, c1, d1, e1, f1] = m;
  const [a2, b2, c2, d2, e2, f2] = n;
  return [
    a1 * a2 + b1 * c2,
    a1 * b2 + b1 * d2,
    c1 * a2 + d1 * c2,
    c1 * b2 + d1 * d2,
    e1 * a2 + f1 * c2 + e2,
    e1 * b2 + f1 * d2 + f2,
  ];
}

function glyphCount(tok: Token): number {
  if (tok.kind !== 'str') return 0;
  const v = tok.value as string;
  if (v.charCodeAt(0) === 60) {
    // hex string `<...>`: 2 hex digits per byte/glyph
    return Math.max(0, (v.length - 2) >> 1);
  }
  return Math.max(0, v.length - 2);
}

function boxIntersects(bx: number[], win: Window): boolean {
  const [L, B, R, T] = win;
  return !(bx[2] < L || bx[0] > R || bx[3] < B || bx[1] > T);
}

/**
 * Remove text-showing operators (`Tj`, `TJ`, `'`, `"`) whose approximate
 * rendered box does not intersect the visible window. All other operators are
 * preserved so the remaining content keeps its layout.
 *
 * The window is expressed in the content stream's own user space (the page's
 * unrotated coordinate system), i.e. the /CropBox rectangle.
 */
export function filterContentString(s: string, win: Window): string {
  const toks = tokenize(s);
  const out: string[] = [];
  let pos = 0;

  let operands: Array<[string, number | string]> = [];
  let argsStart = -1;
  let ctm = [1, 0, 0, 1, 0, 0];
  const gstack: number[][] = [];
  let tm = [1, 0, 0, 1, 0, 0];
  let tlm = [1, 0, 0, 1, 0, 0];
  let fsize = 1;
  let leading = 0;
  let arrDepth = 0;
  let arrGlyphs = 0;

  const emitUpto = (start: number, end: number, replacement?: string) => {
    out.push(s.slice(pos, start));
    if (replacement) out.push(replacement);
    pos = end;
  };

  for (const tok of toks) {
    const { kind, start, end } = tok;

    if (kind === 'num' || kind === 'name' || kind === 'str') {
      if (arrDepth > 0) {
        arrGlyphs += glyphCount(tok);
      } else {
        if (operands.length === 0) argsStart = start;
        if (kind === 'str') operands.push(['str', glyphCount(tok)]);
        else operands.push([kind, tok.value as number | string]);
      }
      continue;
    }
    if (kind === 'arropen') {
      if (arrDepth === 0) {
        arrGlyphs = 0;
        if (operands.length === 0) argsStart = start;
      }
      arrDepth++;
      continue;
    }
    if (kind === 'arrclose') {
      arrDepth--;
      if (arrDepth === 0) {
        operands.push(['array', arrGlyphs]);
        arrGlyphs = 0;
      }
      continue;
    }
    if (kind === 'dictopen' || kind === 'dictclose' || kind === 'braceopen' || kind === 'braceclose') {
      continue;
    }

    const op = tok.value as string;

    if (op === 'q') {
      gstack.push(ctm.slice());
    } else if (op === 'Q') {
      if (gstack.length) ctm = gstack.pop()!;
    } else if (op === 'cm') {
      const nums = operands.filter((t) => t[0] === 'num').map((t) => t[1] as number).slice(-6);
      if (nums.length === 6) ctm = mmul(nums, ctm);
    } else if (op === 'BT') {
      tm = [1, 0, 0, 1, 0, 0];
      tlm = tm.slice();
    } else if (op === 'Tf') {
      const nums = operands.filter((t) => t[0] === 'num').map((t) => t[1] as number);
      if (nums.length) fsize = nums[nums.length - 1];
    } else if (op === 'Tm') {
      const nums = operands.filter((t) => t[0] === 'num').map((t) => t[1] as number).slice(-6);
      if (nums.length === 6) {
        tm = nums.slice();
        tlm = nums.slice();
      }
    } else if (op === 'Td' || op === 'TD') {
      const nums = operands.filter((t) => t[0] === 'num').map((t) => t[1] as number).slice(-2);
      if (nums.length === 2) {
        tlm = mmul([1, 0, 0, 1, nums[0], nums[1]], tlm);
        tm = tlm.slice();
        if (op === 'TD') leading = -nums[1];
      }
    } else if (op === 'TL') {
      const nums = operands.filter((t) => t[0] === 'num').map((t) => t[1] as number);
      if (nums.length) leading = nums[nums.length - 1];
    } else if (op === 'T*') {
      tlm = mmul([1, 0, 0, 1, 0, -leading], tlm);
      tm = tlm.slice();
    } else if (op === 'Tj' || op === 'TJ' || op === "'" || op === '"') {
      const nglyphs = operands
        .filter((t) => t[0] === 'str' || t[0] === 'array')
        .reduce((acc, t) => acc + (t[1] as number), 0);

      const m = mmul(tm, ctm);
      const ex = m[4];
      const ey = m[5];
      const h = fsize * Math.sqrt(m[2] * m[2] + m[3] * m[3]);
      const w = h ? nglyphs * Math.sqrt(m[0] * m[0] + m[1] * m[1]) * h * 0.6 : 0;
      const bx = [ex, ey - 0.25 * h, ex + w, ey + h];

      if (!boxIntersects(bx, win)) {
        const from = argsStart >= 0 ? argsStart : start;
        if (op === "'") {
          emitUpto(from, end, 'T*');
        } else if (op === '"') {
          const nums = operands.filter((t) => t[0] === 'num').map((t) => t[1] as number);
          let rep = '';
          if (nums.length >= 2) rep = `${nums[nums.length - 2]} Tw ${nums[nums.length - 1]} Tc `;
          emitUpto(from, end, rep + 'T*');
        } else {
          emitUpto(from, end, '');
        }
      }
      if (op === "'" || op === '"') {
        tlm = mmul([1, 0, 0, 1, 0, -leading], tlm);
        tm = tlm.slice();
      }
    }

    operands = [];
    argsStart = -1;
  }

  out.push(s.slice(pos));
  return out.join('');
}

function decodeStreamToString(stream: PDFStream): string {
  if (stream instanceof PDFRawStream) return bytesToLatin1(decodePDFRawStream(stream).decode());
  if (stream instanceof PDFContentStream) return bytesToLatin1(stream.getUnencodedContents());
  throw new Error('Unrecognized content stream type');
}

/**
 * Hard-crop a source page's content stream in place: drop text that lies
 * outside `win` so it can never leak into the merged document's text layer.
 */
function hardCropPageContents(page: PDFPage, win: Window): void {
  const node = page.node;
  const contents = node.Contents();
  if (!contents) return;

  let full: string;
  if (contents instanceof PDFArray) {
    const parts: string[] = [];
    for (let idx = 0; idx < contents.size(); idx++) {
      parts.push(decodeStreamToString(contents.lookup(idx, PDFStream)));
      parts.push('\n');
    }
    full = parts.join('');
  } else if (contents instanceof PDFStream) {
    full = decodeStreamToString(contents);
  } else {
    return;
  }

  const filtered = filterContentString(full, win);
  if (filtered === full) return;

  const ctx = node.context;
  const stream = ctx.flateStream(filtered);
  node.set(PDFName.of('Contents'), ctx.register(stream));
}

/**
 * Embed a source page showing only its visible /CropBox region, baking in any
 * page rotation. Text outside the crop region is removed from the embedded
 * content stream so no duplicated "ghost" text appears in the merged output.
 */
export const embedVisiblePage = async (
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

  try {
    hardCropPageContents(page, [left, bottom, left + cropWidth, bottom + cropHeight]);
  } catch (err) {
    console.warn('[PDF Merge] Content hard-crop failed, embedding page as-is:', err);
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
