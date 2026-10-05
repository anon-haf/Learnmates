import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Download, Search, X } from 'lucide-react';
import { topicalConfigs } from './topicalpagesdata';
import { useRouteBase, withBase } from '../utils/routeBase';
import { resolveFromR2, getAssetAuthHeaders } from '../utils/r2Utils';
import { getYearFromFileName, getMonthFromFileName, getPaperNumberFromFileName, getVariantFromFileName, isCambridgeScienceMcqSubject, getPaperKeyFromFileName } from '../utils/topicalHelpers';
import { deriveMarkSchemeUrl } from '../utils/quizLoader';
import { generateMergedPDF, MergeItem } from '../utils/pdfMerger';
import { commitDownloadAward } from '../utils/awardDownloadXP';

import Dropdown from '../components/topical/Dropdown';

interface PaperEntry {
  fileName: string;
  year: number | null;
  month: string | null;
  paperNumber: number | null;
  variant: number | null;
  questionNumber: number | null;
  pdfUrl: string;
  msUrl: string | undefined;
  topicMatches: string[];
  unit: string;
  isMCQ: boolean;
  mcqAnswer?: string;
}

interface PaperGroup {
  key: string;
  displayName: string;
  shortName: string;
  year: number;
  month: string;
  paperNumber: number | null;
  variant: number | null;
  unit: string;
  entries: PaperEntry[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

// ── Smart search helpers ──────────────────────────────────────────────────────

const MONTH_ALIASES: Record<string, string> = {
  january: 'jan', jan: 'jan',
  february: 'feb', feb: 'feb',
  march: 'mar', mar: 'mar',
  april: 'apr', apr: 'apr',
  may: 'may',
  june: 'jun', jun: 'jun',
  july: 'jul', jul: 'jul',
  august: 'aug', aug: 'aug',
  september: 'sep', sept: 'sep', sep: 'sep',
  october: 'oct', oct: 'oct',
  november: 'nov', nov: 'nov',
  december: 'dec', dec: 'dec',
};

/**
 * Normalise a raw search query into tokens that can be matched against paper names.
 * Handles:
 *   - Full month names → 3-letter abbrev  (January → jan)
 *   - "paper N" / "p N" / "pN"  → p{N}   (paper 12 → p12)
 *   - "variant N" / "v N" / "vN" → v{N}  (variant 2 → v2)
 */
function normaliseQuery(raw: string): string {
  let q = raw.toLowerCase().trim();
  q = q.replace(/\b(january|february|march|april|may|june|july|august|september|sept|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/g,
    (m) => MONTH_ALIASES[m] || m);
  q = q.replace(/\bpaper\s*(\d+)/g, 'p$1');
  q = q.replace(/\bvariant\s*(\d+)/g, 'v$1');
  return q.replace(/\s+/g, ' ').trim();
}

function normalisePaper(paper: PaperGroup): string {
  // displayName e.g. "May 2022 P12" → "may 2022 p12"
  return paper.displayName.toLowerCase().replace(/\s+/g, ' ');
}

/** Returns true if every space-separated token in the query appears in the paper. */
function paperMatchesQuery(paper: PaperGroup, normalisedQuery: string): boolean {
  if (!normalisedQuery) return true;
  const haystack = normalisePaper(paper) + ' ' + paper.unit.toLowerCase();
  return normalisedQuery.split(' ').every(token => haystack.includes(token));
}


// ── Download helpers ──────────────────────────────────────────────────────────

/**
 * Generate & download the merged QP PDF for a single paper group,
 * exactly the same way PaperViewer does it.
 */
async function downloadPaperQP(
  paper: PaperGroup,
  subject: string,
  level: string,
  board: string,
  onStart: () => void,
  onEnd: () => void
) {
  onStart();
  try {
    const qItems: MergeItem[] = paper.entries.map(p => ({
      id: `q${p.questionNumber}`,
      url: p.pdfUrl,
      type: 'pdf',
    }));
    const subtitle = `${level.toUpperCase()} ${board.charAt(0).toUpperCase() + board.slice(1)} ${subject} - ${paper.unit}`;
    const filename = `${paper.unit} ${paper.displayName} - Questions.pdf`;
    const blob = await generateMergedPDF(qItems, 'Question', {
      title: paper.displayName,
      subtitle,
      level,
      board,
      subject,
      unit: paper.unit,
    });
    await commitDownloadAward({
      resourceId: `${paper.key}_questions`,
      resourceName: filename,
      resourceType: 'paper',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[Pastpapers] QP download error:', err);
  } finally {
    onEnd();
  }
}

/**
 * Generate & download the merged MS PDF for a single paper group.
 */
async function downloadPaperMS(
  paper: PaperGroup,
  subject: string,
  level: string,
  board: string,
  onStart: () => void,
  onEnd: () => void
) {
  onStart();
  try {
    // Include both PDF mark schemes AND mcqAnswer entries (same logic as PaperViewer)
    const msPapers = paper.entries.filter(p => p.msUrl || p.mcqAnswer);
    if (msPapers.length === 0) return;
    const msItems: MergeItem[] = msPapers.map(p => ({
      id: `q${p.questionNumber}`,
      url: p.msUrl || '',
      type: p.mcqAnswer ? 'mcqAnswer' : 'pdf',
      mcqAnswer: p.mcqAnswer,
    }));
    const subtitle = `${level.toUpperCase()} ${board.charAt(0).toUpperCase() + board.slice(1)} ${subject} - ${paper.unit} (Mark Scheme)`;
    const filename = `${paper.unit} ${paper.displayName} - Mark Scheme.pdf`;
    const blob = await generateMergedPDF(msItems, 'Mark Scheme', {
      title: paper.displayName,
      subtitle,
      level,
      board,
      subject,
      unit: paper.unit,
    });
    await commitDownloadAward({
      resourceId: `${paper.key}_markschemes`,
      resourceName: filename,
      resourceType: 'paper',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[Pastpapers] MS download error:', err);
  } finally {
    onEnd();
  }
}

/**
 * Generate all QP PDFs for a year and bundle them into a ZIP.
 */
async function downloadYearQPZip(
  year: number,
  yearPapers: PaperGroup[],
  subject: string,
  level: string,
  board: string,
  onStart: () => void,
  onEnd: () => void
) {
  onStart();
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    await Promise.all(
      yearPapers.map(async (paper) => {
        try {
          const qItems: MergeItem[] = paper.entries.map(p => ({
            id: `q${p.questionNumber}`,
            url: p.pdfUrl,
            type: 'pdf' as const,
          }));
          const subtitle = `${level.toUpperCase()} ${board.charAt(0).toUpperCase() + board.slice(1)} ${subject} - ${paper.unit}`;
          const blob = await generateMergedPDF(qItems, 'Question', {
            title: paper.displayName,
            subtitle,
            level,
            board,
            subject,
            unit: paper.unit,
          });
          const arrayBuffer = await blob.arrayBuffer();
          zip.file(`${paper.unit} ${paper.displayName} - Questions.pdf`, arrayBuffer);
        } catch (err) {
          console.warn(`[Pastpapers] Skipping QP for ${paper.displayName}:`, err);
        }
      })
    );

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subject} ${year} - All Question Papers.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[Pastpapers] Year QP zip error:', err);
  } finally {
    onEnd();
  }
}

/**
 * Generate all MS PDFs for a year and bundle them into a ZIP.
 */
async function downloadYearMSZip(
  year: number,
  yearPapers: PaperGroup[],
  subject: string,
  level: string,
  board: string,
  onStart: () => void,
  onEnd: () => void
) {
  onStart();
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    await Promise.all(
      yearPapers.map(async (paper) => {
        try {
          // Include MCQ answer entries the same way PaperViewer does
          const msPapers = paper.entries.filter(p => p.msUrl || p.mcqAnswer);
          if (msPapers.length === 0) return;
          const msItems: MergeItem[] = msPapers.map(p => ({
            id: `q${p.questionNumber}`,
            url: p.msUrl || '',
            type: (p.mcqAnswer ? 'mcqAnswer' : 'pdf') as 'mcqAnswer' | 'pdf',
            mcqAnswer: p.mcqAnswer,
          }));
          const subtitle = `${level.toUpperCase()} ${board.charAt(0).toUpperCase() + board.slice(1)} ${subject} - ${paper.unit} (Mark Scheme)`;
          const blob = await generateMergedPDF(msItems, 'Mark Scheme', {
            title: paper.displayName,
            subtitle,
            level,
            board,
            subject,
            unit: paper.unit,
          });
          const arrayBuffer = await blob.arrayBuffer();
          zip.file(`${paper.unit} ${paper.displayName} - Mark Scheme.pdf`, arrayBuffer);
        } catch (err) {
          console.warn(`[Pastpapers] Skipping MS for ${paper.displayName}:`, err);
        }
      })
    );

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subject} ${year} - All Mark Schemes.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[Pastpapers] Year MS zip error:', err);
  } finally {
    onEnd();
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PastpapersPage: React.FC = () => {
  const base = useRouteBase();
  const pastpapersPath = (...parts: string[]) => withBase(base, `/pastpapers/${parts.join('/')}`);
  const { level: urlLevel, board: urlBoard, subject: urlSubject } = useParams<{ level?: string; board?: string; subject?: string }>();
  const navigate = useNavigate();

  const configs = topicalConfigs;
  const levels = Array.from(new Set(configs.map(c => c.level)));
  const boardsForLevel = (lvl: string) => Array.from(new Set(configs.filter(c => c.level === lvl).map(c => c.board)));
  const subjectsForLvlBoard = (lvl: string, bd: string) =>
    Array.from(new Set(configs.filter(c => c.level === lvl && c.board === bd).map(c => c.subject)));

  const [selectedLevel, setSelectedLevel] = useState<string>(urlLevel || '');
  const [selectedBoard, setSelectedBoard] = useState<string>(urlBoard || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(urlSubject || '');

  useEffect(() => {
    setSelectedLevel(urlLevel || '');
    setSelectedBoard(urlBoard || '');
    setSelectedSubject(urlSubject || '');
  }, [urlLevel, urlBoard, urlSubject]);

  useEffect(() => {
    if (selectedLevel && selectedBoard && selectedSubject) {
      const newPathUrl = pastpapersPath(selectedLevel, selectedBoard, selectedSubject);
      if (window.location.pathname !== newPathUrl) {
        navigate(newPathUrl, { replace: true });
      }
    }
  }, [selectedLevel, selectedBoard, selectedSubject]);

  useEffect(() => {
    if (!selectedLevel) return;
    const newBoards = boardsForLevel(selectedLevel);
    if (newBoards.length === 0 || !newBoards.includes(selectedBoard)) {
      setSelectedBoard('');
      setSelectedSubject('');
    } else {
      const subjects = subjectsForLvlBoard(selectedLevel, selectedBoard);
      if (!subjects.includes(selectedSubject)) setSelectedSubject('');
    }
  }, [selectedLevel, selectedBoard, selectedSubject]);

  const matches = useMemo(
    () => configs.filter(c => c.level === selectedLevel && c.board === selectedBoard && c.subject === selectedSubject),
    [configs, selectedLevel, selectedBoard, selectedSubject]
  );

  const hasMultipleUnits = useMemo(
    () => matches.length > 0 && matches[0].units.length > 1,
    [matches]
  );

  const [papers, setPapers] = useState<PaperGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());

  // ── Auto-detected units from loaded papers ────────────────────────────────
  const availableUnits = useMemo<string[]>(() => {
    const units = Array.from(new Set(papers.map(p => p.unit))).filter(Boolean);
    return units.sort();
  }, [papers]);

  const toggleUnit = (unit: string) => {
    setSelectedUnits(prev => {
      const next = new Set(prev);
      if (next.has(unit)) next.delete(unit);
      else next.add(unit);
      return next;
    });
  };

  // ── Filtered papers (text search + unit filter) ───────────────────────────
  const normalisedQuery = useMemo(() => normaliseQuery(searchQuery), [searchQuery]);

  const filteredPapers = useMemo(() => {
    return papers.filter(p => {
      const passesUnit = selectedUnits.size === 0 || selectedUnits.has(p.unit);
      const passesText = !normalisedQuery || paperMatchesQuery(p, normalisedQuery);
      return passesUnit && passesText;
    });
  }, [papers, normalisedQuery, selectedUnits]);

  // Auto-expand years that have matching papers while any filter is active
  useEffect(() => {
    const hasActiveFilter = normalisedQuery || selectedUnits.size > 0;
    if (!hasActiveFilter) return;
    const yearsWithMatches = new Set(filteredPapers.map(p => p.year));
    setExpandedYears(prev => {
      const next = new Set(prev);
      yearsWithMatches.forEach(y => next.add(y));
      return next;
    });
  }, [normalisedQuery, selectedUnits, filteredPapers]);

  // Clear search + unit filters when the subject selection changes
  useEffect(() => {
    setSearchQuery('');
    setSelectedUnits(new Set());
  }, [selectedLevel, selectedBoard, selectedSubject]);

  // Per-paper download loading states
  const [downloadingQP, setDownloadingQP] = useState<Record<string, boolean>>({});
  const [downloadingMS, setDownloadingMS] = useState<Record<string, boolean>>({});
  // Per-year zip download loading states
  const [downloadingYearQP, setDownloadingYearQP] = useState<Record<number, boolean>>({});
  const [downloadingYearMS, setDownloadingYearMS] = useState<Record<number, boolean>>({});

  const infoCache = useMemo(() => new Map<string, any[]>(), []);

  const fetchInfoForUnit = useCallback(async (basePath: string): Promise<any[] | undefined> => {
    let info = infoCache.get(basePath);
    if (info) return info;

    try {
      const infoUrl = `${basePath}/info.json`;
      const resolvedInfoUrl = await resolveFromR2(infoUrl);
      const res = await fetch(resolvedInfoUrl || infoUrl, { headers: getAssetAuthHeaders() });
      if (res.ok) {
        const text = await res.text();
        try {
          info = JSON.parse(text);
        } catch {
          const parts = text.split(/\]\s*\n\s*\[/);
          if (parts.length > 1) {
            const combined: any[] = [];
            parts.forEach((seg, idx) => {
              let candidate = seg;
              if (idx > 0) candidate = '[' + candidate;
              if (idx < parts.length - 1) candidate = candidate + ']';
              try {
                const arr = JSON.parse(candidate);
                if (Array.isArray(arr)) combined.push(...arr);
              } catch {
              }
            });
            if (combined.length > 0) info = combined;
          }
        }
        if (info) infoCache.set(basePath, info);
      }
    } catch {
    }
    return info;
  }, [infoCache]);

  const loadPapers = useCallback(async () => {
    if (!selectedLevel || !selectedBoard || !selectedSubject || matches.length === 0) {
      setPapers([]);
      return;
    }

    setLoading(true);
    const paperGroupsMap = new Map<string, PaperGroup>();

    for (const cfg of matches) {
      for (const unit of cfg.units) {
        const baseUrlPrefix = ((import.meta as any).env?.BASE_URL as string) || '/';
        const basePath = `${baseUrlPrefix}topicals/${cfg.level}/${cfg.board}/${cfg.subject}/${unit.unit}`;
        const info = await fetchInfoForUnit(basePath);

        // Load MCQ answers if this is an MCQ subject — exactly like PaperViewer
        let subjectMcqAnswers: Record<string, string> | null = null;
        const isMcqSubject = isCambridgeScienceMcqSubject(cfg.level, cfg.board, cfg.subject);
        if (isMcqSubject) {
          try {
            const mcqAnswersUrl = cfg.level === 'a-level'
              ? `${baseUrlPrefix}topicals/${cfg.level}/${cfg.board}/${cfg.subject}/AS/mcq_ans.json`
              : `${baseUrlPrefix}topicals/${cfg.level}/${cfg.board}/${cfg.subject}/${cfg.subject}/mcq_ans.json`;
            const resolvedMcqUrl = await resolveFromR2(mcqAnswersUrl);
            const res = await fetch(resolvedMcqUrl || mcqAnswersUrl, { headers: getAssetAuthHeaders() });
            if (res.ok) {
              const data = await res.json();
              if (data && typeof data === 'object') subjectMcqAnswers = data;
            }
          } catch { }
        }

        if (info && Array.isArray(info)) {
          for (const entry of info) {
            const fileName = entry.file_name;
            const year = getYearFromFileName(fileName);
            const month = getMonthFromFileName(fileName);
            const paperNumber = getPaperNumberFromFileName(fileName);
            const variant = getVariantFromFileName(fileName);
            const questionNumber = fileName.match(/Q(\d+)$/i)?.[1];
            const isMCQ = entry.MCQ === 'yes' || entry.MCQ === true;

            if (year === null) continue;

            const paperStr = paperNumber ? `P${paperNumber}${variant !== null ? variant : ''}` : '';
            const shortName = `${month} ${year} ${paperStr}`.trim().replace(/\s+/g, '_');
            const displayName = `${month} ${year} ${paperStr}`.trim();

            const pdfUrl = `${basePath}/${fileName}.pdf`;
            let msUrl: string | null = deriveMarkSchemeUrl(pdfUrl);

            // Resolve MCQ answer (same logic as PaperViewer)
            const mcqPaperNumbers = (cfg.level === 'igcse' || cfg.level === 'IGCSE') ? [1, 2] : [1];
            const shouldEnableMcqChecker = isMcqSubject && paperNumber !== null && mcqPaperNumbers.includes(paperNumber);
            const pKey = getPaperKeyFromFileName(fileName);
            const mcqAnswer = shouldEnableMcqChecker && subjectMcqAnswers && pKey && questionNumber
              ? subjectMcqAnswers[pKey]?.[parseInt(questionNumber, 10) - 1]
              : undefined;

            // When it's an MCQ answer, there's no PDF mark scheme
            if (mcqAnswer) msUrl = null;

            const paperEntry: PaperEntry = {
              fileName,
              year,
              month,
              paperNumber,
              variant,
              questionNumber: questionNumber ? parseInt(questionNumber, 10) : null,
              pdfUrl,
              msUrl: msUrl || undefined,
              topicMatches: Array.isArray(entry.topic_matches) ? entry.topic_matches : [],
              unit: unit.unit,
              isMCQ,
              mcqAnswer,
            };

            const groupKey = `${unit.unit}_${shortName}`;

            if (!paperGroupsMap.has(groupKey)) {
              paperGroupsMap.set(groupKey, {
                key: groupKey,
                displayName,
                shortName,
                year,
                month: month || '',
                paperNumber,
                variant,
                unit: unit.unit,
                entries: [],
              });
            }
            paperGroupsMap.get(groupKey)!.entries.push(paperEntry);
          }
        }
      }
    }

    const allGroups = Array.from(paperGroupsMap.values());
    allGroups.forEach(group => {
      group.entries.sort((a, b) => {
        const aQ = a.questionNumber || 0;
        const bQ = b.questionNumber || 0;
        return aQ - bQ;
      });
    });

    allGroups.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const cleanMonth = (m: string) => m.replace(/\s*\([A-Za-z]\)/i, '').trim();
      const aMonthIdx = monthOrder.indexOf(cleanMonth(a.month));
      const bMonthIdx = monthOrder.indexOf(cleanMonth(b.month));
      if (aMonthIdx !== bMonthIdx) return bMonthIdx - aMonthIdx;
      if (a.month !== b.month) return a.month.localeCompare(b.month);
      const aPaper = a.paperNumber || 0;
      const bPaper = b.paperNumber || 0;
      return aPaper - bPaper;
    });

    setPapers(allGroups);
    setLoading(false);
    setExpandedYears(new Set());
  }, [selectedLevel, selectedBoard, selectedSubject, matches, fetchInfoForUnit]);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const navigateToPaper = (paper: PaperGroup) => {
    const paperPath = pastpapersPath(
      selectedLevel,
      selectedBoard,
      selectedSubject,
      paper.year.toString(),
      paper.shortName,
      paper.unit
    );
    navigate(paperPath);
  };

  const getUnitBadgeColor = (_unit: string) => {
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
  };

  // ── Per-paper download handlers ──────────────────────────────────────────

  const handleDownloadQP = (e: React.MouseEvent, paper: PaperGroup) => {
    e.stopPropagation();
    downloadPaperQP(
      paper,
      selectedSubject,
      selectedLevel,
      selectedBoard,
      () => setDownloadingQP(prev => ({ ...prev, [paper.key]: true })),
      () => setDownloadingQP(prev => ({ ...prev, [paper.key]: false }))
    );
  };

  const handleDownloadMS = (e: React.MouseEvent, paper: PaperGroup) => {
    e.stopPropagation();
    downloadPaperMS(
      paper,
      selectedSubject,
      selectedLevel,
      selectedBoard,
      () => setDownloadingMS(prev => ({ ...prev, [paper.key]: true })),
      () => setDownloadingMS(prev => ({ ...prev, [paper.key]: false }))
    );
  };

  // ── Per-year ZIP download handlers ───────────────────────────────────────

  const handleDownloadYearQP = (e: React.MouseEvent, year: number, yearPapers: PaperGroup[]) => {
    e.stopPropagation();
    downloadYearQPZip(
      year,
      yearPapers,
      selectedSubject,
      selectedLevel,
      selectedBoard,
      () => setDownloadingYearQP(prev => ({ ...prev, [year]: true })),
      () => setDownloadingYearQP(prev => ({ ...prev, [year]: false }))
    );
  };

  const handleDownloadYearMS = (e: React.MouseEvent, year: number, yearPapers: PaperGroup[]) => {
    e.stopPropagation();
    downloadYearMSZip(
      year,
      yearPapers,
      selectedSubject,
      selectedLevel,
      selectedBoard,
      () => setDownloadingYearMS(prev => ({ ...prev, [year]: true })),
      () => setDownloadingYearMS(prev => ({ ...prev, [year]: false }))
    );
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Past Papers | Learnmates</title>
        <meta name="description" content="Browse and practice full past papers for IGCSE and A-Level exams." />
        <meta property="og:title" content="Past Papers | Learnmates" />
        <meta property="og:description" content="Browse and practice full past papers for IGCSE and A-Level exams." />
        <meta property="og:type" content="website" />
      </Helmet>

      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold mb-2">Past Papers</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Select a level, board, and subject to browse complete exam papers grouped by year.</p>
      </motion.div>

      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Dropdown
              label="Level"
              fullWidth
              buttonLabel={selectedLevel ? selectedLevel.toUpperCase() : 'Select Level'}
              options={levels.map(l => ({ value: l, label: l.toUpperCase() }))}
              selectedValue={selectedLevel}
              onSelect={setSelectedLevel as any}
            />
          </div>
          <div>
            <Dropdown
              label="Board"
              fullWidth
              buttonLabel={selectedBoard ? (selectedBoard.charAt(0).toUpperCase() + selectedBoard.slice(1)) : 'Select Board'}
              options={boardsForLevel(selectedLevel).map(b => ({ value: b, label: b.charAt(0).toUpperCase() + b.slice(1) }))}
              selectedValue={selectedBoard}
              onSelect={setSelectedBoard as any}
              disabled={!selectedLevel}
            />
          </div>
          <div>
            <Dropdown
              label="Subject"
              fullWidth
              buttonLabel={selectedSubject || 'Select Subject'}
              options={subjectsForLvlBoard(selectedLevel, selectedBoard).map(s => ({ value: s, label: s }))}
              selectedValue={selectedSubject}
              onSelect={setSelectedSubject as any}
              disabled={!selectedLevel || !selectedBoard}
            />
          </div>
        </div>
      </div>

      {/* ── Smart search bar — only visible once papers are loaded ── */}
      {papers.length > 0 && !loading && (
        <motion.div variants={itemVariants} className="mb-6 space-y-3">
          {/* Text input */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="pastpapers-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder='Search papers… e.g. "January 2022", "p12", "may p11", "2019"'
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 pl-11 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-blue-400 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:focus:ring-blue-500/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Unit filter chips — auto-shown when subject has multiple units */}
          {availableUnits.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Unit:</span>
              {availableUnits.map(unit => {
                const isActive = selectedUnits.has(unit);
                const count = papers.filter(p => p.unit === unit).length;
                return (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => toggleUnit(unit)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    {unit}
                    <span className={`text-[10px] px-1 rounded-full ${
                      isActive
                        ? 'bg-blue-500 dark:bg-blue-400 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
              {selectedUnits.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedUnits(new Set())}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Result count summary */}
          {(searchQuery || selectedUnits.size > 0) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">
              {filteredPapers.length === 0
                ? 'No papers match your filters.'
                : `${filteredPapers.length} paper${filteredPapers.length !== 1 ? 's' : ''} match${filteredPapers.length === 1 ? 'es' : ''}`
              }
              {(searchQuery || selectedUnits.size > 0) && filteredPapers.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedUnits(new Set()); }}
                  className="ml-2 text-blue-500 dark:text-blue-400 hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </p>
          )}
        </motion.div>
      )}

      {!selectedLevel || !selectedBoard || !selectedSubject ? (
        <div className="text-center py-12 text-gray-500">
          <p>Please select a level, board, and subject to view past papers.</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No past papers available for this combination.</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading papers...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No past papers found for this subject.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const yearGroups = new Map<number, PaperGroup[]>();
            filteredPapers.forEach(p => {
              if (!yearGroups.has(p.year)) yearGroups.set(p.year, []);
              yearGroups.get(p.year)!.push(p);
            });

            if (yearGroups.size === 0 && (searchQuery || selectedUnits.size > 0)) {
              return (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <Search className="mx-auto h-10 w-10 mb-3 opacity-25" />
                  <p className="font-medium text-gray-700 dark:text-gray-200">No papers match your filters</p>
                  <p className="text-sm mt-1">
                    {searchQuery && selectedUnits.size > 0
                      ? `No results for "${searchQuery}" in the selected unit${selectedUnits.size > 1 ? 's' : ''}`
                      : searchQuery
                        ? `Try "May 2022", "p12", "jan 2020 p11", or just a year like "2019"`
                        : `No papers found for the selected unit${selectedUnits.size > 1 ? 's' : ''}`
                    }
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedUnits(new Set()); }}
                    className="mt-4 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              );
            }

            return Array.from(yearGroups.entries())
              .sort(([a], [b]) => b - a)
              .map(([year, yearPapers]) => (
                <motion.div key={year} variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

                  {/* ── Year header ── */}
                  <div className="flex items-center bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleYear(year)}
                      className="flex-1 px-6 py-4 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors text-left group/toggle"
                    >
                      <span className={`transition-transform duration-200 shrink-0 ${expandedYears.has(year) ? 'rotate-180' : ''}`}>
                        <svg className="w-5 h-5 text-gray-400 group-hover/toggle:text-blue-500 dark:group-hover/toggle:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                      <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">{year}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                        {yearPapers.length} paper{yearPapers.length !== 1 ? 's' : ''}
                      </span>
                    </button>

                    {/* Bulk year download buttons — styled exactly like PaperViewer's download buttons */}
                    <div className="flex items-center gap-2 px-4 shrink-0">
                      <button
                        onClick={(e) => handleDownloadYearQP(e, year, yearPapers)}
                        disabled={!!downloadingYearQP[year]}
                        title={`Download all ${year} Question Papers as ZIP`}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                      >
                        {downloadingYearQP[year] ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>{downloadingYearQP[year] ? 'Generating…' : 'All QP'}</span>
                      </button>

                      <button
                        onClick={(e) => handleDownloadYearMS(e, year, yearPapers)}
                        disabled={!!downloadingYearMS[year]}
                        title={`Download all ${year} Mark Schemes as ZIP`}
                        className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                      >
                        {downloadingYearMS[year] ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        <span>{downloadingYearMS[year] ? 'Generating…' : 'All MS'}</span>
                      </button>
                    </div>
                  </div>

                  {/* ── Papers grid ── */}
                  <div className={`overflow-hidden transition-all duration-300 ${expandedYears.has(year) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {yearPapers.map((paper) => {
                          const hasMsEntries = paper.entries.some(e => !!e.msUrl || !!e.mcqAnswer);
                          return (
                            <div
                              key={paper.key}
                              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all overflow-hidden flex flex-col"
                            >
                              {/* Paper info row — navigates to viewer */}
                              <button
                                onClick={() => navigateToPaper(paper)}
                                className="flex items-center gap-2.5 p-4 text-left w-full cursor-pointer min-w-0 flex-1"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap truncate">
                                    {paper.displayName.replace('Paper ', '').replace(' Variant ', ' V')}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {hasMultipleUnits && (
                                      <span
                                        title={paper.unit}
                                        className={`inline-block truncate px-1.5 py-0.5 rounded text-[10px] font-medium ${getUnitBadgeColor(paper.unit)}`}
                                      >
                                        {paper.unit}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      {paper.entries.length} q
                                    </span>
                                  </div>
                                </div>
                              </button>

                              {/* Download buttons row — same style as PaperViewer */}
                              <div className="flex items-center gap-1.5 px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2">
                                <button
                                  onClick={(e) => handleDownloadQP(e, paper)}
                                  disabled={!!downloadingQP[paper.key]}
                                  title="Download Question Paper PDF"
                                  className="flex items-center justify-center gap-1.5 flex-1 px-2 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                                >
                                  {downloadingQP[paper.key] ? (
                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                  ) : (
                                    <Download className="w-3 h-3" />
                                  )}
                                  {downloadingQP[paper.key] ? 'Generating…' : 'QP'}
                                </button>

                                {hasMsEntries && (
                                  <button
                                    onClick={(e) => handleDownloadMS(e, paper)}
                                    disabled={!!downloadingMS[paper.key]}
                                    title="Download Mark Scheme PDF"
                                    className="flex items-center justify-center gap-1.5 flex-1 px-2 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                                  >
                                    {downloadingMS[paper.key] ? (
                                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                      </svg>
                                    ) : (
                                      <Download className="w-3 h-3" />
                                    )}
                                    {downloadingMS[paper.key] ? 'Generating…' : 'MS'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ));
          })()}
        </div>
      )}
    </motion.div>
  );
};

export default PastpapersPage;