import { useRef, useState, useEffect } from 'react';
import { SubjectConfig } from '../utils/topicalConfig';
import { Question } from '../components/TopicalQuiz';
import {
  isCambridgeScienceMcqSubject,
  getPaperNumberFromFileName,
  getPaperKeyFromFileName,
  getYearFromFileName,
  sortQuestionsByRecency,
  sortQuestionsByOldest,
  shuffleArray,
  getMonthFromFileName,
  getVariantFromFileName,
} from '../utils/topicalHelpers';
import { deriveMarkSchemeUrl } from '../utils/quizLoader';
import { resolveFromR2, getAssetAuthHeaders } from '../utils/r2Utils';

interface LoadingProgress {
  current: number;
  total: number;
  isLoading: boolean;
}

interface ComputeParams {
  configs: SubjectConfig[];
  checked: Set<string>;
  matches: SubjectConfig[];
  mcqFilter: 'all' | 'mcq' | 'theory';
  paperFilter: Set<number>;
  yearFilter: Set<number>;
  isPaperMode: boolean;
  strict?: boolean;
  orderFilter?: 'newest' | 'oldest' | 'random';
  limitFilter?: number | null;
  monthFilter?: Set<string>;
  variantFilter?: Set<number>;
}

const normalizeTopicMatchTerm = (value: string) => value.trim().toLowerCase();

// Loose mode: a question matches when ANY of its topics is selected.
// Strict mode: a question matches only when ALL of its topics are selected
// (i.e. it covers exclusively the selected topics and nothing else).
const doesEntryMatchSelectedTopics = (topicMatches: unknown, selectedTopicsForUnit: Set<string>, strict = false) => {
  if (!Array.isArray(topicMatches) || topicMatches.length === 0) return false;

  const normalizedSelectedTopics = new Set(
    Array.from(selectedTopicsForUnit).map(term => normalizeTopicMatchTerm(term))
  );

  return topicMatches[strict ? 'every' : 'some']((match: unknown) => {
    if (typeof match !== 'string') return false;
    return normalizedSelectedTopics.has(normalizeTopicMatchTerm(match));
  });
};

// Builds a `unit -> Set<searchTerm>` map from the raw "level||board||subject||unit||topic"
// checkbox keys, resolving each display name back to its underlying search term.
const buildSelectedTopicsByUnit = (checked: Set<string>, configs: SubjectConfig[]) => {
  const selectedTopicsByUnit = new Map<string, Set<string>>();

  checked.forEach(key => {
    const parts = key.split('||');
    if (parts.length !== 5) return;
    const [level, board, subject, unit, displayName] = parts;

    const cfg = configs.find(c => c.level === level && c.board === board && c.subject === subject);
    if (!cfg) return;
    const unitObj = cfg.units.find(u => u.unit === unit);
    if (!unitObj) return;

    let searchTerm: string | undefined = '';
    for (const topic of unitObj.topics) {
      if (topic.subtopics) {
        const subtopic = topic.subtopics.find(st => st.subtopic === displayName);
        if (subtopic) {
          searchTerm = subtopic.search;
          break;
        }
      } else if (topic.topic === displayName) {
        searchTerm = topic.search;
        break;
      }
    }

    if (searchTerm) {
      if (!selectedTopicsByUnit.has(unit)) selectedTopicsByUnit.set(unit, new Set());
      selectedTopicsByUnit.get(unit)!.add(searchTerm);
    }
  });

  return selectedTopicsByUnit;
};

export function useTopicalMatches() {
  const infoCache = useRef<Map<string, any[]>>(new Map());
  const mcqAnswerCacheRef = useRef<Record<string, Record<string, string>>>({});
  const abortControllerRef = useRef<AbortController>(new AbortController());

  const [topicalQuiz, setTopicalQuiz] = useState<Question[]>([]);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({ current: 0, total: 0, isLoading: false });
  const [availableFilters, setAvailableFilters] = useState({ hasMCQ: true, hasTheory: true });
  const [availablePapers, setAvailablePapers] = useState<Set<number>>(new Set());
  const [availableYears, setAvailableYears] = useState<Set<number>>(new Set());
  const [availableMonths, setAvailableMonths] = useState<Set<string>>(new Set());
  const [availableVariants, setAvailableVariants] = useState<Set<number>>(new Set());

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    return () => abortControllerRef.current.abort();
  }, []);

  const fetchInfoForUnit = async (basePath: string): Promise<any[] | undefined> => {
    let info: any[] | undefined = infoCache.current.get(basePath);
    if (info) return info;

    try {
      const infoUrl = `${basePath}/info.json`;
      const resolvedInfoUrl = await resolveFromR2(infoUrl);
      const res = await fetch(resolvedInfoUrl || infoUrl, { signal: abortControllerRef.current.signal, headers: getAssetAuthHeaders() });
      if (res.ok) {
        const text = await res.text();
        try {
          info = JSON.parse(text);
        } catch {
          // Some info.json files are actually several concatenated JSON arrays; recover them.
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
                // ignore unparsable segment
              }
            });
            if (combined.length > 0) info = combined;
          }
        }
        if (info) infoCache.current.set(basePath, info);
      }
    } catch {
      // ignore fetch errors (including AbortError)
    }
    return info;
  };

  const computeAvailableFilters = async ({ configs, checked, matches, strict = false }: Pick<ComputeParams, 'configs' | 'checked' | 'matches' | 'strict'>) => {
    const selectedTopicsByUnit = buildSelectedTopicsByUnit(checked, configs);
    let hasMCQ = false;
    let hasTheory = false;
    const papersFound = new Set<number>();
    const yearsFound = new Set<number>();
    const monthsFound = new Set<string>();
    const variantsFound = new Set<number>();

    const baseUrlPrefix = ((import.meta as any).env?.BASE_URL as string) || '/';

    for (const cfg of matches) {
      for (const unit of cfg.units) {
        const selectedTopicsForUnit = selectedTopicsByUnit.get(unit.unit);
        if (!selectedTopicsForUnit || selectedTopicsForUnit.size === 0) continue;

        const basePath = `${baseUrlPrefix}topicals/${cfg.level}/${cfg.board}/${cfg.subject}/${unit.unit}`;
        const info = await fetchInfoForUnit(basePath);

        if (info && Array.isArray(info)) {
          info.forEach((entry: any) => {
            const matchesList = Array.isArray(entry.topic_matches) ? entry.topic_matches : [];
            const doesMatch = doesEntryMatchSelectedTopics(matchesList, selectedTopicsForUnit, strict);
            if (doesMatch) {
              const isMCQ = entry.MCQ === 'yes' || entry.MCQ === true;
              if (isMCQ) hasMCQ = true;
              else hasTheory = true;

              const paperNum = getPaperNumberFromFileName(entry.file_name);
              if (paperNum !== null) papersFound.add(paperNum);

              const year = getYearFromFileName(entry.file_name);
              if (year !== null) yearsFound.add(year);

              const month = getMonthFromFileName(entry.file_name);
              if (month !== null) monthsFound.add(month);

              const variant = getVariantFromFileName(entry.file_name);
              if (variant !== null) variantsFound.add(variant);
            }
          });
        }
      }
    }

    setAvailableFilters({ hasMCQ, hasTheory });
    setAvailablePapers(papersFound);
    setAvailableYears(yearsFound);
    setAvailableMonths(monthsFound);
    setAvailableVariants(variantsFound);
  };

  const computeMatches = async ({ configs, checked, matches, mcqFilter, paperFilter, yearFilter, isPaperMode, strict = false, orderFilter = 'newest', limitFilter = null, monthFilter = new Set(), variantFilter = new Set() }: ComputeParams) => {
    const selectedTopicsByUnit = buildSelectedTopicsByUnit(checked, configs);
    const baseUrlPrefix = ((import.meta as any).env?.BASE_URL as string) || '/';

    // First pass: count total potential questions for progress tracking
    let totalQuestions = 0;
    for (const cfg of matches) {
      for (const unit of cfg.units) {
        const selectedTopicsForUnit = selectedTopicsByUnit.get(unit.unit);
        if (!selectedTopicsForUnit || selectedTopicsForUnit.size === 0) continue;

        const basePath = `${baseUrlPrefix}topicals/${cfg.level}/${cfg.board}/${cfg.subject}/${unit.unit}`;
        const info = await fetchInfoForUnit(basePath);

        if (info && Array.isArray(info)) {
          info.forEach((entry: any) => {
            const matchesList = Array.isArray(entry.topic_matches) ? entry.topic_matches : [];
            const doesMatch = doesEntryMatchSelectedTopics(matchesList, selectedTopicsForUnit, strict);
            if (doesMatch) totalQuestions++;
          });
        }
      }
    }

    setLoadingProgress({ current: 0, total: totalQuestions, isLoading: true });
    setTopicalQuiz([]);

    // Second pass: load questions progressively
    let currentCount = 0;
    const newQuestions: Question[] = [];

    const applyOrderingAndLimit = (qs: Question[], isFinal: boolean) => {
      let result = qs;
      if (orderFilter === 'oldest') {
        result = sortQuestionsByOldest(result);
      } else if (orderFilter === 'random') {
        // Only shuffle at the very end to prevent flickering during progressive load,
        // unless you want the "slot machine" effect. For stability, we'll wait for final.
        if (isFinal) {
          result = shuffleArray(result);
        } else {
          // While loading, just show newest so it's stable
          result = sortQuestionsByRecency(result);
        }
      } else {
        result = sortQuestionsByRecency(result);
      }

      if (limitFilter !== null && limitFilter > 0) {
        result = result.slice(0, limitFilter);
      }
      return result;
    };

    for (const cfg of matches) {
      const isMcqSubject = isCambridgeScienceMcqSubject(cfg.level, cfg.board, cfg.subject);
      const mcqAnswerCacheKey = `${cfg.level}/${cfg.board}/${cfg.subject}`;
      let subjectMcqAnswers: Record<string, string> | null = null;

      if (isMcqSubject) {
        subjectMcqAnswers = mcqAnswerCacheRef.current[mcqAnswerCacheKey] || null;
        if (!subjectMcqAnswers) {
          try {
            let mcqAnswersUrl;
            
            // If board is a_level, check AS folder first
            if (cfg.level === 'a-level') {
              mcqAnswersUrl = `${baseUrlPrefix}topicals/${cfg.level}/${cfg.board}/${cfg.subject}/AS/mcq_ans.json`;
            } else {
              mcqAnswersUrl = `${baseUrlPrefix}topicals/${cfg.level}/${cfg.board}/${cfg.subject}/${cfg.subject}/mcq_ans.json`;
            }
            
            const resolvedMcqAnswersUrl = await resolveFromR2(mcqAnswersUrl);
            const res = await fetch(resolvedMcqAnswersUrl || mcqAnswersUrl, { signal: abortControllerRef.current.signal, headers: getAssetAuthHeaders() });
            
            if (res.ok) {
              const data = await res.json();
              if (data && typeof data === 'object') {
                mcqAnswerCacheRef.current[mcqAnswerCacheKey] = data as Record<string, string>;
                subjectMcqAnswers = mcqAnswerCacheRef.current[mcqAnswerCacheKey];
              }
            }
          } catch {
            // Handle error silently
          }
        }
      }

      for (const unit of cfg.units) {
        const selectedTopicsForUnit = selectedTopicsByUnit.get(unit.unit);
        if (!selectedTopicsForUnit || selectedTopicsForUnit.size === 0) continue;

        const basePath = `${baseUrlPrefix}topicals/${cfg.level}/${cfg.board}/${cfg.subject}/${unit.unit}`;
        const info = infoCache.current.get(basePath); // already loaded in first pass

        if (info && Array.isArray(info)) {
          for (const entry of info) {
            const matchesList = Array.isArray(entry.topic_matches) ? entry.topic_matches : [];
            const doesMatch = doesEntryMatchSelectedTopics(matchesList, selectedTopicsForUnit, strict);
            if (!doesMatch) continue;

            let passFilter: boolean;
            if (isPaperMode) {
              const paperNum = getPaperNumberFromFileName(entry.file_name);
              passFilter = paperFilter.size === 0 ? false : paperNum !== null && paperFilter.has(paperNum);
            } else {
              const isMCQ = entry.MCQ === 'yes' || entry.MCQ === true;
              passFilter = mcqFilter === 'all' || (mcqFilter === 'mcq' && isMCQ) || (mcqFilter === 'theory' && !isMCQ);
            }

            if (passFilter) {
              const year = getYearFromFileName(entry.file_name);
              passFilter = yearFilter.size === 0 || (year !== null && yearFilter.has(year));
            }
            if (passFilter && monthFilter.size > 0) {
              const month = getMonthFromFileName(entry.file_name);
              passFilter = month !== null && monthFilter.has(month);
            }
            if (passFilter && variantFilter.size > 0) {
              const variant = getVariantFromFileName(entry.file_name);
              passFilter = variant !== null && variantFilter.has(variant);
            }

            if (passFilter) {
              const paperNumber = getPaperNumberFromFileName(entry.file_name);
              // For IGCSE: both Paper 1 and Paper 2 are MCQ
// For A-Level/Other: only Paper 1 is MCQ
              const mcqPaperNumbers = (cfg.level === 'igcse' || cfg.level === 'IGCSE') 
                ? [1, 2] 
                : [1];

              const shouldEnableMcqChecker = isMcqSubject && paperNumber !== null && mcqPaperNumbers.includes(paperNumber);
              const paperKey = getPaperKeyFromFileName(entry.file_name);
              const questionNumber = entry.file_name.match(/Q(\d+)$/i)?.[1];
              const mcqAnswer =
                shouldEnableMcqChecker && subjectMcqAnswers && paperKey && questionNumber
                  ? subjectMcqAnswers[paperKey]?.[parseInt(questionNumber, 10) - 1]
                  : undefined;

              const q: Question = {
                id: `${cfg.level}-${cfg.board}-${cfg.subject}-${unit.unit}-${entry.file_name}`,
                questionContent: `${basePath}/${entry.file_name}.pdf`,
                questionContentType: 'pdf',
                markScheme: deriveMarkSchemeUrl(`${basePath}/${entry.file_name}.pdf`) || undefined,
                markSchemeType: 'pdf',
                title: entry.file_name,
                topicMatches: Array.isArray(entry.topic_matches) ? entry.topic_matches : [],
                unit: unit.unit,
                isMcq: shouldEnableMcqChecker,
                mcqAnswer,
              };

              newQuestions.push(q);
              currentCount++;
              if (currentCount % 5 === 0 || currentCount === totalQuestions) {
                setLoadingProgress({ current: currentCount, total: totalQuestions, isLoading: true });
                setTopicalQuiz(applyOrderingAndLimit(newQuestions, false));
              }
            } else {
              currentCount++;
              if (currentCount % 5 === 0 || currentCount === totalQuestions) {
                setLoadingProgress({ current: currentCount, total: totalQuestions, isLoading: true });
              }
            }
          }
        }
      }
    }

    setLoadingProgress({ current: currentCount, total: totalQuestions, isLoading: false });
    const finalQuestions = applyOrderingAndLimit(newQuestions, true);
    setTopicalQuiz(finalQuestions);
    return finalQuestions;
  };

  const resetResults = () => {
    setTopicalQuiz([]);
    setLoadingProgress({ current: 0, total: 0, isLoading: false });
  };

  return {
    topicalQuiz,
    loadingProgress,
    availableFilters,
    availablePapers,
    availableYears,
    availableMonths,
    availableVariants,
    setAvailableFilters,
    setAvailablePapers,
    setAvailableYears,
    setAvailableMonths,
    setAvailableVariants,
    computeMatches,
    computeAvailableFilters,
    resetResults,
  };
}
