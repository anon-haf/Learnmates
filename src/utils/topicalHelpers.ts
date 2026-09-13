// Small, dependency-free helpers used by the Topical Pages feature.
// Pulled out of TopicalPages.tsx so that file only has to worry about
// state + composition, not string/number parsing rules.

// Subjects under Cambridge that use a paper-based filter instead of the generic
// MCQ / Theory filter. Cambridge component codes follow the pattern
// <paper><variant>, e.g. 11, 12, 13 => Paper 1; 21, 22, 23 => Paper 2;
// 31, 32, 33 => Paper 3; 41, 42, 43 => Paper 4. For Cambridge A-level science
// subjects we keep the same workflow but limit the available options to papers 1, 2 and 4.
const normalizeSubject = (subject: string) => subject.trim().toLowerCase();

export const PAPER_FILTER_SUBJECTS = ['Biology', 'Physics', 'Chemistry', 'Math', 'Additional Mathematics', 'Mathematics', 'Further Mathematics', 'Computer Science'];
export const CAMBRIDGE_SCIENCE_MCQ_SUBJECTS = ['Biology', 'Physics', 'Chemistry'];

export const isPaperFilterSubject = (level: string, board: string, subject: string) =>
  ['igcse', 'a-level'].includes(level) && board === 'cambridge' &&
  PAPER_FILTER_SUBJECTS.some(candidate => normalizeSubject(candidate) === normalizeSubject(subject));

export const isCambridgeScienceMcqSubject = (level: string, board: string, subject: string) =>
  ['igcse', 'a-level'].includes(level) && board === 'cambridge' &&
  CAMBRIDGE_SCIENCE_MCQ_SUBJECTS.some(candidate => normalizeSubject(candidate) === normalizeSubject(subject));

export const isEdexcelALevelPureMathSubject = (level: string, board: string, subject: string) =>
  level === 'a-level' && board === 'edexcel' &&
  ['pure mathematics', 'pure maths', 'math', 'mathematics', 'mechanics'].some(candidate => normalizeSubject(candidate) === normalizeSubject(subject));

export const getDefaultPaperOptions = (level: string, board: string, subject: string): number[] => {
  const normalized = normalizeSubject(subject);

  if (level === 'a-level' && board === 'cambridge' &&
    CAMBRIDGE_SCIENCE_MCQ_SUBJECTS.some(candidate => normalizeSubject(candidate) === normalized)) {
    return [1, 2, 4];
  }

  if (normalized === 'additional mathematics' || normalized === 'add math' || normalized === 'add maths') {
    return [1, 2];
  }

  if (level === 'a-level' && board === 'cambridge' &&
    ['Mathematics', 'math', 'maths'].some(candidate => normalizeSubject(candidate) === normalized)) {
    return [1, 3, 4, 5];  // Cambridge A-Level Math papers P1-P6
  }
  if (level === 'a-level' && board === 'cambridge' &&
    ['Further Mathematics'].some(candidate => normalizeSubject(candidate) === normalized)) {
    return [1, 2, 3, 4];  // Cambridge A-Level Math papers P1-P6
  }


  return [1, 2, 3, 4];
};

// Extracts the paper number (1-4, or whatever the first digit of the
// component code is) from a past-paper file name. Looks for patterns like
// "qp_12", "ms-41", "_p11", or a bare "p13" in the file name and returns the
// first digit of the two-digit component code. Returns null if no such
// pattern can be found.
export const getPaperNumberFromFileName = (fileName: string | undefined | null): number | null => {
  if (!fileName) return null;
  const match = fileName.match(/\b(?:qp|ms|p)(?:[-_ ]?)([1-6])\d\b/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

export const getPaperKeyFromFileName = (fileName: string | undefined | null): string | null => {
  if (!fileName) return null;
  return fileName.replace(/Q\d+$/i, 'MS');
};

export const getYearFromFileName = (fileName: string | undefined | null): number | null => {
  if (!fileName) return null;
  const match = fileName.match(/\b(?:19|20)\d{2}\b/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return null;
};

export const getMonthFromFileName = (fileName: string | undefined | null): string | null => {
  if (!fileName) return null;
  const firstThree = fileName.substring(0, 3).toLowerCase();
  if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(firstThree)) {
    return firstThree.charAt(0).toUpperCase() + firstThree.slice(1);
  }
  const match = fileName.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
  if (match) {
    const month = match[1].toLowerCase();
    return month.charAt(0).toUpperCase() + month.slice(1);
  }
  return null;
};

export const getVariantFromFileName = (fileName: string | undefined | null): number | null => {
  if (!fileName) return null;
  const match = fileName.match(/P[1-6](\d)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

// ---------------------------------------------------------------------------
// Recency ordering (newest -> oldest), driven purely by the exam session
// embedded in the file name/title, e.g. "Jun 2028 P44 Q1" (Cambridge) or
// "Jan 2020 Q1" (Edexcel). Works regardless of paper numbers/labels since it
// never needs to know the board's paper-numbering convention to do the sort -
// it only needs the month name + year that every board writes somewhere in
// the file name.
// ---------------------------------------------------------------------------

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const monthIndexFromWord = (word: string): number | null => {
  const key = word.toLowerCase().slice(0, 3);
  return key in MONTH_NAME_TO_INDEX ? MONTH_NAME_TO_INDEX[key] : null;
};

// Returns a single sortable integer (larger = more recent) derived from the
// "<Month> <Year>" session written in a file name/title, or null if no
// recognizable month+year pair is present.
export const getSessionSortKeyFromFileName = (fileName: string | undefined | null): number | null => {
  if (!fileName) return null;
  const match = fileName.match(/([A-Za-z]{3,9})\.?\s+((?:19|20)\d{2})\b/);
  if (!match) return null;

  const monthIndex = monthIndexFromWord(match[1]);
  if (monthIndex === null) return null;

  const year = parseInt(match[2], 10);
  if (isNaN(year)) return null;

  return year * 12 + monthIndex;
};

export const getQuestionNumberFromFileName = (fileName: string | undefined | null): number | null => {
  if (!fileName) return null;
  const match = fileName.match(/Q(\d+)\b/i);
  return match ? parseInt(match[1], 10) : null;
};

// Compares two questions purely by "how recent is this paper", newest first.
// Falls back to grouping by paper number, then question number, when two
// entries share the same session - this keeps Q1, Q2, Q3... in order within
// a paper instead of leaving them in whatever order they were discovered.
// Entries whose file name/title doesn't contain a recognizable month+year are
// sent to the end rather than disrupting the ordering of everything else.
export const compareByRecency = (a: { title?: string }, b: { title?: string }): number => {
  const aKey = getSessionSortKeyFromFileName(a.title);
  const bKey = getSessionSortKeyFromFileName(b.title);

  if (aKey === null && bKey === null) return 0;
  if (aKey === null) return 1;
  if (bKey === null) return -1;
  if (aKey !== bKey) return bKey - aKey; // newer (larger key) first

  const aPaper = getPaperNumberFromFileName(a.title) ?? 0;
  const bPaper = getPaperNumberFromFileName(b.title) ?? 0;
  if (aPaper !== bPaper) return aPaper - bPaper;

  const aQNum = getQuestionNumberFromFileName(a.title) ?? 0;
  const bQNum = getQuestionNumberFromFileName(b.title) ?? 0;
  return aQNum - bQNum;
};

export const compareByOldest = (a: { title?: string }, b: { title?: string }): number => {
  const aKey = getSessionSortKeyFromFileName(a.title);
  const bKey = getSessionSortKeyFromFileName(b.title);

  if (aKey === null && bKey === null) return 0;
  if (aKey === null) return 1;
  if (bKey === null) return -1;
  if (aKey !== bKey) return aKey - bKey; // older (smaller key) first

  const aPaper = getPaperNumberFromFileName(a.title) ?? 0;
  const bPaper = getPaperNumberFromFileName(b.title) ?? 0;
  if (aPaper !== bPaper) return aPaper - bPaper;

  const aQNum = getQuestionNumberFromFileName(a.title) ?? 0;
  const bQNum = getQuestionNumberFromFileName(b.title) ?? 0;
  return aQNum - bQNum;
};

// Non-mutating: returns a new array sorted newest -> oldest.
export const sortQuestionsByRecency = <T extends { title?: string }>(questions: T[]): T[] =>
  [...questions].sort(compareByRecency);

export const sortQuestionsByOldest = <T extends { title?: string }>(questions: T[]): T[] =>
  [...questions].sort(compareByOldest);

export const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const makeKey = (level: string, board: string, subject: string, unit: string, name: string) =>
  `${level}||${board}||${subject}||${unit}||${name}`;

// Collapses a sorted list of numbers into compact ranges, e.g.
// [2020, 2022, 2023, 2024, 2025] => "2020, 2022-2025". If the joined result is
// longer than maxLength it is cut at the last whole range and given a trailing
// ellipsis.
export const formatRangeSummary = (values: number[], maxLength = 25): string => {
  if (values.length === 0) return '';

  const parts: string[] = [];
  let start = values[0];
  let prev = values[0];
  for (let i = 1; i <= values.length; i++) {
    const curr = values[i];
    if (curr === prev + 1) {
      prev = curr;
      continue;
    }
    parts.push(start === prev ? String(start) : `${start}-${prev}`);
    start = curr;
    prev = curr;
  }

  const joined = parts.join(', ');
  if (joined.length <= maxLength) return joined;

  let truncated = '';
  for (const part of parts) {
    const candidate = truncated ? `${truncated}, ${part}` : part;
    if (candidate.length > maxLength - 1) break;
    truncated = candidate;
  }
  return truncated ? `${truncated}…` : `${joined.slice(0, maxLength - 1)}…`;
};
