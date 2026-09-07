import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { topicalConfigs } from './topicalpagesdata';
import { useRouteBase, withBase } from '../utils/routeBase';
import { resolveFromR2, getAssetAuthHeaders } from '../utils/r2Utils';
import { getYearFromFileName, getMonthFromFileName, getPaperNumberFromFileName, getVariantFromFileName } from '../utils/topicalHelpers';
import { deriveMarkSchemeUrl } from '../utils/quizLoader';
import PDFViewerModal from '../components/PDFViewerModal';
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
            const msUrl = deriveMarkSchemeUrl(pdfUrl);

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
      const aMonthIdx = monthOrder.indexOf(a.month);
      const bMonthIdx = monthOrder.indexOf(b.month);
      if (aMonthIdx !== bMonthIdx) return bMonthIdx - aMonthIdx;
      const aPaper = a.paperNumber || 0;
      const bPaper = b.paperNumber || 0;
      return aPaper - bPaper;
    });

    setPapers(allGroups);
    setLoading(false);

    const years = [...new Set(allGroups.map(g => g.year))].sort((a, b) => b - a);
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

  const getUnitBadgeColor = (unit: string) => {
    return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
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
              onSelect={setSelectedLevel}
            />
          </div>
          <div>
            <Dropdown
              label="Board"
              fullWidth
              buttonLabel={selectedBoard ? (selectedBoard.charAt(0).toUpperCase() + selectedBoard.slice(1)) : 'Select Board'}
              options={boardsForLevel(selectedLevel).map(b => ({ value: b, label: b.charAt(0).toUpperCase() + b.slice(1) }))}
              selectedValue={selectedBoard}
              onSelect={setSelectedBoard}
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
              onSelect={setSelectedSubject}
              disabled={!selectedLevel || !selectedBoard}
            />
          </div>
        </div>
      </div>

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
            papers.forEach(p => {
              if (!yearGroups.has(p.year)) yearGroups.set(p.year, []);
              yearGroups.get(p.year)!.push(p);
            });
            return Array.from(yearGroups.entries())
              .sort(([a], [b]) => b - a)
              .map(([year, yearPapers]) => (
                <motion.div key={year} variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => toggleYear(year)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">{year}</span>
                    <span className={`transition-transform duration-200 ${expandedYears.has(year) ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${expandedYears.has(year) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {yearPapers.map((paper) => (
                          <button
                            key={paper.key}
                            onClick={() => navigateToPaper(paper)}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer text-left"
                          >
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{paper.displayName.replace('Paper ', '').replace(' Variant ', ' V')}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {paper.entries.some(e => e.isMCQ) && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                    MCQ
                                  </span>
                                )}
                                {hasMultipleUnits && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getUnitBadgeColor(paper.unit)}`}>
                                    {paper.unit}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  {paper.entries.length}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
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