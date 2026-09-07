import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { SubjectConfig } from '../utils/topicalConfig';
import { topicalConfigs } from './topicalpagesdata';
import { downloadMergedTopicalPDFs } from '../utils/topicalPdfExport';
import {
  isPaperFilterSubject,
  isEdexcelALevelPureMathSubject,
  getDefaultPaperOptions,
  makeKey,
  formatRangeSummary,
} from '../utils/topicalHelpers';
import { useTopicalMatches } from '../hooks/useTopicalMatches';
import LevelBoardSubjectPicker from '../components/topical/LevelBoardSubjectPicker';
import TopicPickerPanel from '../components/topical/TopicPickerPanel';
import FilterBar from '../components/topical/FilterBar';
import MatchesViewerPanel from '../components/topical/MatchesViewerPanel';
import { useRouteBase, withBase } from '../utils/routeBase';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
};

const TopicalPages: React.FC = () => {
  const base = useRouteBase();
  const topicalsPath = (...parts: string[]) => withBase(base, `/topicals/${parts.join('/')}`);
  const { level: urlLevel, board: urlBoard, subject: urlSubject } = useParams<{ level?: string; board?: string; subject?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // ---------------------------------------------------------------------
  // Level / board / subject selection
  // ---------------------------------------------------------------------
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
      const newPathUrl = topicalsPath(selectedLevel, selectedBoard, selectedSubject);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, selectedBoard, selectedSubject]);

  const matches = React.useMemo(
    () => configs.filter(c => c.level === selectedLevel && c.board === selectedBoard && c.subject === selectedSubject),
    [configs, selectedLevel, selectedBoard, selectedSubject]
  );

  // ---------------------------------------------------------------------
  // Query-param <-> state syncing (topics / mcq / papers)
  // ---------------------------------------------------------------------
  const getTopicsFromQuery = useCallback((): Set<string> => {
    const params = new URLSearchParams(location.search);
    const topicsStr = params.get('topics');
    if (!topicsStr) return new Set();

    const topicKeys = new Set<string>();

    let keysArray: string[] = [];
    if (topicsStr.includes(';;')) {
      keysArray = topicsStr.split(';;');
    } else {
      const partsByComma = topicsStr.split(',');
      const allPartsHaveDoublePipe = partsByComma.every(p => p.includes('||'));
      if (allPartsHaveDoublePipe && partsByComma.length > 1) {
        keysArray = partsByComma;
      } else {
        keysArray = [topicsStr];
      }
    }

    const currentCfg = configs.find(c => c.level === selectedLevel && c.board === selectedBoard && c.subject === selectedSubject);

    keysArray.forEach(key => {
      if (!key) return;
      const parts = key.split('||');

      let unit = '';
      let topic = '';

      if (parts.length === 5) {
        const [keyLevel, keyBoard, keySubject, u, t] = parts;
        if (keyLevel === selectedLevel && keyBoard === selectedBoard && keySubject === selectedSubject) {
          unit = u;
          topic = t;
        }
      } else if (parts.length >= 2) {
        unit = parts[0];
        topic = parts.slice(1).join('||');
      }

      if (unit && topic && currentCfg) {
        // Validate against current config to prevent interference from other subjects' query parameters
        const unitObj = currentCfg.units.find(u => u.unit === unit);
        if (unitObj) {
          const topicObj = unitObj.topics.find(t => t.topic === topic || t.subtopics?.some(st => st.subtopic === topic));
          if (topicObj) {
            topicKeys.add(`${selectedLevel}||${selectedBoard}||${selectedSubject}||${unit}||${topic}`);
          }
        }
      }
    });
    return topicKeys;
  }, [location.search, selectedLevel, selectedBoard, selectedSubject, configs]);

  const getMcqFilterFromQuery = useCallback((): 'all' | 'mcq' | 'theory' => {
    const mcq = new URLSearchParams(location.search).get('mcq');
    return mcq === 'mcq' || mcq === 'theory' ? mcq : 'all';
  }, [location.search]);

  const getPaperFilterFromQuery = useCallback((): Set<number> => {
    const papersStr = new URLSearchParams(location.search).get('papers');
    if (!papersStr || papersStr === 'none') return new Set();
    if (papersStr === 'all') return new Set(getDefaultPaperOptions(selectedLevel, selectedBoard, selectedSubject));
    const papers = new Set<number>();
    papersStr.split(',').forEach(p => {
      const n = parseInt(p, 10);
      if (!isNaN(n)) papers.add(n);
    });
    return papers;
  }, [location.search, selectedLevel, selectedBoard, selectedSubject]);

  const getYearFilterFromQuery = useCallback((): Set<number> => {
    const yearsStr = new URLSearchParams(location.search).get('years');
    if (!yearsStr || yearsStr === 'all') return new Set();
    const years = new Set<number>();
    yearsStr.split(',').forEach(year => {
      const n = parseInt(year, 10);
      if (!isNaN(n)) years.add(n);
    });
    return years;
  }, [location.search]);

  const getOrderFilterFromQuery = useCallback((): 'newest' | 'oldest' | 'random' => {
    const order = new URLSearchParams(location.search).get('order');
    if (order === 'oldest' || order === 'random') return order;
    return 'newest';
  }, [location.search]);

  const getLimitFilterFromQuery = useCallback((): string => {
    return new URLSearchParams(location.search).get('limit') || '';
  }, [location.search]);

  const getStrictFilterFromQuery = useCallback((): boolean => {
    const strict = new URLSearchParams(location.search).get('strict');
    return strict === '1' || strict === 'true';
  }, [location.search]);

  const getMonthFilterFromQuery = useCallback((): Set<string> => {
    const str = new URLSearchParams(location.search).get('months');
    if (!str || str === 'all') return new Set();
    return new Set(str.split(','));
  }, [location.search]);

  const getVariantFilterFromQuery = useCallback((): Set<number> => {
    const str = new URLSearchParams(location.search).get('variants');
    if (!str || str === 'all') return new Set();
    const variants = new Set<number>();
    str.split(',').forEach(v => {
      const n = parseInt(v, 10);
      if (!isNaN(n)) variants.add(n);
    });
    return variants;
  }, [location.search]);

  const updateQueryParams = (
    newChecked: Set<string>,
    newMcqFilter: 'all' | 'mcq' | 'theory',
    newPaperFilter?: Set<number>,
    newYearFilter?: Set<number>,
    newOrderFilter?: 'newest' | 'oldest' | 'random',
    newLimitFilter?: string,
    newStrictFilter?: boolean,
    newMonthFilter?: Set<string>,
    newVariantFilter?: Set<number>
  ) => {
    const params = new URLSearchParams();
    if (newChecked.size > 0) {
      const simplifiedTopics = Array.from(newChecked)
        .map(key => {
          const parts = key.split('||');
          return parts.length > 3 ? parts.slice(3).join('||') : key;
        })
        .join(';;');
      params.set('topics', simplifiedTopics);
    }
    if (newMcqFilter !== 'all') params.set('mcq', newMcqFilter);
    if (newPaperFilter) {
      params.set('papers', newPaperFilter.size === 0 ? 'none' : Array.from(newPaperFilter).sort().join(','));
    }
    if (newYearFilter !== undefined) {
      params.set('years', newYearFilter.size === 0 ? 'all' : Array.from(newYearFilter).sort().join(','));
    }
    if (newOrderFilter && newOrderFilter !== 'newest') {
      params.set('order', newOrderFilter);
    }
    if (newLimitFilter) {
      params.set('limit', newLimitFilter);
    }
    if (newStrictFilter) {
      params.set('strict', '1');
    }
    if (newMonthFilter && newMonthFilter.size > 0) {
      params.set('months', Array.from(newMonthFilter).join(','));
    }
    if (newVariantFilter && newVariantFilter.size > 0) {
      params.set('variants', Array.from(newVariantFilter).join(','));
    }
    const queryString = params.toString();
    const newUrl = `${topicalsPath(selectedLevel, selectedBoard, selectedSubject)}${queryString ? '?' + queryString : ''}`;
    navigate(newUrl, { replace: true });
  };

  // ---------------------------------------------------------------------
  // Selection state (topics, expansion, filters)
  // ---------------------------------------------------------------------
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [needLoad, setNeedLoad] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [mcqFilter, setMcqFilterState] = useState<'all' | 'mcq' | 'theory'>(() => getMcqFilterFromQuery());
  const [paperFilter, setPaperFilterState] = useState<Set<number>>(() => getPaperFilterFromQuery());
  const [yearFilter, setYearFilterState] = useState<Set<number>>(() => getYearFilterFromQuery());
  const [orderFilter, setOrderFilterState] = useState<'newest' | 'oldest' | 'random'>(() => getOrderFilterFromQuery());
  const [limitFilter, setLimitFilterState] = useState<string>(() => getLimitFilterFromQuery());
  const [strictFilter, setStrictFilterState] = useState<boolean>(() => getStrictFilterFromQuery());
  const [monthFilter, setMonthFilterState] = useState<Set<string>>(() => getMonthFilterFromQuery());
  const [variantFilter, setVariantFilterState] = useState<Set<number>>(() => getVariantFilterFromQuery());
  // Collapses the topic tree into a compact summary strip once results have
  // been requested, so the matches viewer can grow into the freed space.
  const [pickerCollapsed, setPickerCollapsed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [loadFeedback, setLoadFeedback] = useState<string | null>(null);
  const [extraPageEnabled, setExtraPageEnabled] = useState(false);
  const [headerPageEnabled, setHeaderPageEnabled] = useState(true);
  const [mergeHeaderEnabled, setMergeHeaderEnabled] = useState(true);
  const [headerSize, setHeaderSize] = useState<number>(25);
  const [loadId, setLoadId] = useState<number>(0);

  const {
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
  } = useTopicalMatches();

  // Reset everything when the subject (or higher) changes
  useEffect(() => {
    setChecked(new Set());
    setExpanded(new Set());
    setExpandedUnits(new Set());
    setHasLoadedOnce(false);
    setPickerCollapsed(false);
    setLoadFeedback(null);
    setExtraPageEnabled(false);
    setHeaderPageEnabled(true);
    setMergeHeaderEnabled(true);
    setHeaderSize(25);
    resetResults();
    setMcqFilterState('all');
    setPaperFilterState(new Set(getDefaultPaperOptions(selectedLevel, selectedBoard, selectedSubject)));
    setYearFilterState(new Set());
    setOrderFilterState('newest');
    setLimitFilterState('');
    setStrictFilterState(false);
    setMonthFilterState(new Set());
    setVariantFilterState(new Set());

    if (selectedLevel && selectedBoard && selectedSubject) {
      navigate(topicalsPath(selectedLevel, selectedBoard, selectedSubject), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLevel, selectedBoard, selectedSubject]);

  useEffect(() => {
    const topicsFromQuery = getTopicsFromQuery();
    setChecked(prev =>
      prev.size !== topicsFromQuery.size || ![...prev].every(item => topicsFromQuery.has(item)) ? topicsFromQuery : prev
    );
  }, [getTopicsFromQuery]);

  useEffect(() => {
    const mcqFromQuery = getMcqFilterFromQuery();
    setMcqFilterState(prev => (prev !== mcqFromQuery ? mcqFromQuery : prev));
  }, [getMcqFilterFromQuery]);

  useEffect(() => {
    const papersFromQuery = getPaperFilterFromQuery();
    setPaperFilterState(prev =>
      prev.size !== papersFromQuery.size || ![...prev].every(p => papersFromQuery.has(p)) ? papersFromQuery : prev
    );
  }, [getPaperFilterFromQuery]);

  useEffect(() => {
    const yearsFromQuery = getYearFilterFromQuery();
    setYearFilterState(prev =>
      prev.size !== yearsFromQuery.size || ![...prev].every(year => yearsFromQuery.has(year)) ? yearsFromQuery : prev
    );
  }, [getYearFilterFromQuery]);

  useEffect(() => {
    const orderFromQuery = getOrderFilterFromQuery();
    setOrderFilterState(prev => (prev !== orderFromQuery ? orderFromQuery : prev));
  }, [getOrderFilterFromQuery]);

  useEffect(() => {
    const limitFromQuery = getLimitFilterFromQuery();
    setLimitFilterState(prev => (prev !== limitFromQuery ? limitFromQuery : prev));
  }, [getLimitFilterFromQuery]);

  useEffect(() => {
    const strictFromQuery = getStrictFilterFromQuery();
    setStrictFilterState(prev => (prev !== strictFromQuery ? strictFromQuery : prev));
  }, [getStrictFilterFromQuery]);

  useEffect(() => {
    const fromQuery = getMonthFilterFromQuery();
    setMonthFilterState(prev => prev.size !== fromQuery.size || ![...prev].every(m => fromQuery.has(m)) ? fromQuery : prev);
  }, [getMonthFilterFromQuery]);

  useEffect(() => {
    const fromQuery = getVariantFilterFromQuery();
    setVariantFilterState(prev => prev.size !== fromQuery.size || ![...prev].every(v => fromQuery.has(v)) ? fromQuery : prev);
  }, [getVariantFilterFromQuery]);

  const isPaperMode = isPaperFilterSubject(selectedLevel, selectedBoard, selectedSubject);
  const showMcqTheoryFilter = !isEdexcelALevelPureMathSubject(selectedLevel, selectedBoard, selectedSubject);
  const showExtraPageOption = isEdexcelALevelPureMathSubject(selectedLevel, selectedBoard, selectedSubject);
  const availablePaperNumbers = getDefaultPaperOptions(selectedLevel, selectedBoard, selectedSubject).filter(n => availablePapers.has(n));
  const isAllPapersSelected = availablePaperNumbers.length > 0 && availablePaperNumbers.every(n => paperFilter.has(n));
  const selectedPaperSummary = isAllPapersSelected
    ? 'All'
    : paperFilter.size === 0
      ? 'No paper selected'
      : availablePaperNumbers.filter(n => paperFilter.has(n)).map(n => `P${n}`).join(', ');
  const availableYearNumbers = Array.from(availableYears).sort((a, b) => a - b);
  const isAllYearsSelected = availableYearNumbers.length > 0 && availableYearNumbers.every(year => yearFilter.has(year));
  const selectedYearSummary = isAllYearsSelected
    ? 'All years'
    : yearFilter.size === 0
      ? 'No year selected'
      : formatRangeSummary(availableYearNumbers.filter(year => yearFilter.has(year)));

  const availableMonthsArr = Array.from(availableMonths).sort();
  const isAllMonthsSelected = availableMonthsArr.length > 0 && availableMonthsArr.every(m => monthFilter.has(m));
  const selectedMonthSummary = isAllMonthsSelected ? 'All sessions' : monthFilter.size === 0 ? 'No session selected' : availableMonthsArr.filter(m => monthFilter.has(m)).join(', ');

  const availableVariantsArr = Array.from(availableVariants).sort();
  const isAllVariantsSelected = availableVariantsArr.length > 0 && availableVariantsArr.every(v => variantFilter.has(v));
  const selectedVariantSummary = isAllVariantsSelected ? 'All variants' : variantFilter.size === 0 ? 'No variant selected' : availableVariantsArr.filter(v => variantFilter.has(v)).join(', ');

  const setMcqFilter = (filter: 'all' | 'mcq' | 'theory') => {
    setLoadFeedback(null);
    setMcqFilterState(filter);
    updateQueryParams(checked, filter, paperFilter, yearFilter, orderFilter, limitFilter, strictFilter);
  };

  const togglePaperFilter = (paperNum: number | 'all') => {
    setLoadFeedback(null);
    if (paperNum === 'all') {
      const nextSet = isAllPapersSelected ? new Set<number>() : new Set<number>(availablePaperNumbers);
      setPaperFilterState(nextSet);
      updateQueryParams(checked, mcqFilter, nextSet, yearFilter, orderFilter, limitFilter, strictFilter);
      return;
    }
    const nextSet = new Set<number>(paperFilter);
    if (nextSet.has(paperNum)) nextSet.delete(paperNum);
    else nextSet.add(paperNum);
    setPaperFilterState(nextSet);
    updateQueryParams(checked, mcqFilter, nextSet, yearFilter, orderFilter, limitFilter, strictFilter);
  };

  const toggleYearFilter = (yearNum: number | 'all') => {
    setLoadFeedback(null);
    if (yearNum === 'all') {
      const nextSet = isAllYearsSelected ? new Set<number>() : new Set<number>(availableYearNumbers);
      setYearFilterState(nextSet);
      updateQueryParams(checked, mcqFilter, paperFilter, nextSet, orderFilter, limitFilter, strictFilter);
      return;
    }
    const nextSet = new Set<number>(yearFilter);
    if (nextSet.has(yearNum)) nextSet.delete(yearNum);
    else nextSet.add(yearNum);
    setYearFilterState(nextSet);
    updateQueryParams(checked, mcqFilter, paperFilter, nextSet, orderFilter, limitFilter, strictFilter);
  };

  const setOrderFilter = (order: 'newest' | 'oldest' | 'random') => {
    setOrderFilterState(order);
    updateQueryParams(checked, mcqFilter, paperFilter, yearFilter, order, limitFilter, strictFilter);
  };

  const setLimitFilter = (limit: string) => {
    setLimitFilterState(limit);
    updateQueryParams(checked, mcqFilter, paperFilter, yearFilter, orderFilter, limit, strictFilter);
  };

  const setStrictFilter = (strict: boolean) => {
    setLoadFeedback(null);
    setStrictFilterState(strict);
    updateQueryParams(checked, mcqFilter, paperFilter, yearFilter, orderFilter, limitFilter, strict, monthFilter, variantFilter);
  };

  const toggleMonthFilter = (month: string | 'all') => {
    setLoadFeedback(null);
    if (month === 'all') {
      const nextSet = isAllMonthsSelected ? new Set<string>() : new Set<string>(availableMonthsArr);
      setMonthFilterState(nextSet);
      updateQueryParams(checked, mcqFilter, paperFilter, yearFilter, orderFilter, limitFilter, strictFilter, nextSet, variantFilter);
      return;
    }
    const nextSet = new Set<string>(monthFilter);
    if (nextSet.has(month)) nextSet.delete(month);
    else nextSet.add(month);
    setMonthFilterState(nextSet);
    updateQueryParams(checked, mcqFilter, paperFilter, yearFilter, orderFilter, limitFilter, strictFilter, nextSet, variantFilter);
  };

  const toggleVariantFilter = (variant: number | 'all') => {
    setLoadFeedback(null);
    if (variant === 'all') {
      const nextSet = isAllVariantsSelected ? new Set<number>() : new Set<number>(availableVariantsArr);
      setVariantFilterState(nextSet);
      updateQueryParams(checked, mcqFilter, paperFilter, yearFilter, orderFilter, limitFilter, strictFilter, monthFilter, nextSet);
      return;
    }
    const nextSet = new Set<number>(variantFilter);
    if (nextSet.has(variant)) nextSet.delete(variant);
    else nextSet.add(variant);
    setVariantFilterState(nextSet);
    updateQueryParams(checked, mcqFilter, paperFilter, yearFilter, orderFilter, limitFilter, strictFilter, monthFilter, nextSet);
  };

  // ---------------------------------------------------------------------
  // Topic / subtopic checkbox handling
  // ---------------------------------------------------------------------
  const isTopicChecked = (cfg: SubjectConfig, unitName: string, topicName: string) => {
    const topicKey = makeKey(cfg.level, cfg.board, cfg.subject, unitName, topicName);
    const unitObj = cfg.units.find(u => u.unit === unitName);
    const topicObj = unitObj?.topics.find(t => t.topic === topicName);
    if (!topicObj) return false;
    if (topicObj.subtopics && topicObj.subtopics.length > 0) {
      return topicObj.subtopics.every(sub => checked.has(makeKey(cfg.level, cfg.board, cfg.subject, unitName, sub.subtopic)));
    }
    return checked.has(topicKey);
  };

  const isTopicPartiallyChecked = (cfg: SubjectConfig, unitName: string, topicName: string) => {
    const unitObj = cfg.units.find(u => u.unit === unitName);
    const topicObj = unitObj?.topics.find(t => t.topic === topicName);
    if (!topicObj?.subtopics || topicObj.subtopics.length === 0) return false;
    const subKeys = topicObj.subtopics.map(sub => makeKey(cfg.level, cfg.board, cfg.subject, unitName, sub.subtopic));
    const checkedCount = subKeys.filter(k => checked.has(k)).length;
    return checkedCount > 0 && checkedCount < subKeys.length;
  };

  const toggleTopic = (cfg: SubjectConfig, unitName: string, topicName: string) => {
    setLoadFeedback(null);
    const topicKey = makeKey(cfg.level, cfg.board, cfg.subject, unitName, topicName);
    const unitObj = cfg.units.find(u => u.unit === unitName);
    const topicObj = unitObj?.topics.find(t => t.topic === topicName);
    const newSet = new Set(checked);
    if (topicObj?.subtopics && topicObj.subtopics.length > 0) {
      const subKeys = topicObj.subtopics.map(sub => makeKey(cfg.level, cfg.board, cfg.subject, unitName, sub.subtopic));
      const allChecked = subKeys.every(k => newSet.has(k));
      if (allChecked) {
        subKeys.forEach(k => newSet.delete(k));
        newSet.delete(topicKey);
      } else {
        subKeys.forEach(k => newSet.add(k));
        newSet.add(topicKey);
      }
    } else {
      if (newSet.has(topicKey)) newSet.delete(topicKey);
      else newSet.add(topicKey);
    }
    setChecked(newSet);
    updateQueryParams(newSet, mcqFilter, paperFilter, yearFilter, orderFilter, limitFilter, strictFilter);
  };

  const toggleSubtopic = (cfg: SubjectConfig, unitName: string, topicName: string, subtopicName: string) => {
    setLoadFeedback(null);
    const subKey = makeKey(cfg.level, cfg.board, cfg.subject, unitName, subtopicName);
    const topicKey = makeKey(cfg.level, cfg.board, cfg.subject, unitName, topicName);
    const unitObj = cfg.units.find(u => u.unit === unitName);
    const topicObj = unitObj?.topics.find(t => t.topic === topicName);
    const newSet = new Set(checked);
    if (newSet.has(subKey)) newSet.delete(subKey);
    else newSet.add(subKey);

    const subKeys = topicObj?.subtopics?.map(sub => makeKey(cfg.level, cfg.board, cfg.subject, unitName, sub.subtopic)) || [];
    if (subKeys.length > 0 && subKeys.every(k => newSet.has(k))) newSet.add(topicKey);
    else newSet.delete(topicKey);

    setChecked(newSet);
    updateQueryParams(newSet, mcqFilter, paperFilter, yearFilter, orderFilter, limitFilter, strictFilter);
  };

  const toggleExpanded = (cfg: SubjectConfig, unitName: string, topicName: string) => {
    const topicKey = makeKey(cfg.level, cfg.board, cfg.subject, unitName, topicName);
    const newSet = new Set(expanded);
    if (newSet.has(topicKey)) newSet.delete(topicKey);
    else newSet.add(topicKey);
    setExpanded(newSet);
  };

  const toggleUnitExpanded = (cfg: SubjectConfig, unitName: string) => {
    const unitKey = `${cfg.level}||${cfg.board}||${cfg.subject}||${unitName}`;
    const newSet = new Set(expandedUnits);
    if (newSet.has(unitKey)) newSet.delete(unitKey);
    else newSet.add(unitKey);
    setExpandedUnits(newSet);
  };

  // ---------------------------------------------------------------------
  // Load / export actions
  // ---------------------------------------------------------------------
  const getLoadFeedbackMessage = () => {
    if (checked.size === 0) {
      return 'Please select at least one topic before loading matching questions.';
    }
    if (isPaperMode && paperFilter.size === 0) {
      return 'Please select at least one paper before loading matching questions.';
    }
    if (yearFilter.size === 0) {
      return 'Please select at least one year before loading matching questions.';
    }
    return null;
  };

  const handleLoad = () => {
    const validationMessage = getLoadFeedbackMessage();
    setLoadFeedback(validationMessage);
    setHasLoadedOnce(true);

    if (validationMessage) {
      resetResults();
      setPickerCollapsed(false);
      setNeedLoad(false);
      return;
    }

    localStorage.removeItem('quiz_annotations_topical');
    localStorage.removeItem('quiz_mcq_answers_topical');

    setLoadId(prev => prev + 1);
    setNeedLoad(true);
  };

  const handleExport = (type: 'questions' | 'markschemes', options?: { extraPage?: boolean; headerPage?: boolean; mergeHeader?: boolean; headerSize?: number }) => {
    // Get topics from localStorage if checked is empty
    const key = `topical_checked_${selectedLevel}_${selectedBoard}_${selectedSubject}`;
    const storedTopicsStr = localStorage.getItem(key);
    let storedTopics: Set<string> | null = null;
    if (storedTopicsStr) {
      try {
        const parsed = JSON.parse(storedTopicsStr);
        if (Array.isArray(parsed)) {
          storedTopics = new Set(parsed);
        }
      } catch (e) {
        console.error('Failed to parse stored topics', e);
      }
    }
    const exportTopics = checked.size > 0 ? checked : (storedTopics || checked);

    console.log('[Export] checked.size:', checked.size);
    console.log('[Export] storedTopics:', storedTopics);
    console.log('[Export] exportTopics.size:', exportTopics.size);
    console.log('[Export] exportTopics:', [...exportTopics]);

    downloadMergedTopicalPDFs(
      type,
      topicalQuiz,
      exportTopics,
      { level: selectedLevel, board: selectedBoard, subject: selectedSubject },
      {
        onStart: () => setIsExporting(true),
        onProgress: progress => setExportProgress(progress),
        onDone: () => {
          setIsExporting(false);
          setExportProgress(null);
        },
        onError: message => alert(message),
      },
      {
        extraPage: options?.extraPage ?? extraPageEnabled,
        headerPage: options?.headerPage ?? headerPageEnabled,
        mergeHeader: options?.mergeHeader ?? mergeHeaderEnabled,
        headerSize: options?.headerSize ?? headerSize
      },
      {
        papers: Array.from(paperFilter),
        years: Array.from(yearFilter),
        order: orderFilter,
        strict: strictFilter
      }
    );
  };

  useEffect(() => {
    if (checked.size > 0) {
      computeAvailableFilters({ configs, checked, matches, strict: strictFilter });
    } else {
      setAvailableFilters({ hasMCQ: true, hasTheory: true });
      setAvailablePapers(new Set(getDefaultPaperOptions(selectedLevel, selectedBoard, selectedSubject)));
      setAvailableYears(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, matches, configs, selectedBoard, selectedLevel, selectedSubject, strictFilter]);

  useEffect(() => {
    if (mcqFilter === 'mcq' && !availableFilters.hasMCQ) setMcqFilter('all');
    else if (mcqFilter === 'theory' && !availableFilters.hasTheory) setMcqFilter('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableFilters, mcqFilter]);

  useEffect(() => {
    if (!isPaperMode || paperFilter.size === 0) return;
    const stillValid = Array.from(paperFilter).filter(p => availablePapers.has(p));
    if (stillValid.length !== paperFilter.size) {
      const newSet = new Set(stillValid);
      setPaperFilterState(newSet);
      updateQueryParams(checked, mcqFilter, newSet, yearFilter, orderFilter, limitFilter, strictFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePapers, checked, isPaperMode, mcqFilter, paperFilter, yearFilter, strictFilter]);

  useEffect(() => {
    if (yearFilter.size === 0) return;
    const stillValid = Array.from(yearFilter).filter(year => availableYears.has(year));
    if (stillValid.length !== yearFilter.size) {
      const newSet = new Set(stillValid);
      setYearFilterState(newSet);
      updateQueryParams(checked, mcqFilter, paperFilter, newSet, orderFilter, limitFilter, strictFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableYears, checked, mcqFilter, paperFilter, yearFilter, strictFilter]);

  useEffect(() => {
    if (!needLoad) return;

    const runLoad = async () => {
      const parsedLimit = parseInt(limitFilter, 10);
      const limitVal = !isNaN(parsedLimit) ? parsedLimit : null;
      const results = await computeMatches({ configs, checked, matches, mcqFilter, paperFilter, yearFilter, isPaperMode, strict: strictFilter, orderFilter, limitFilter: limitVal, monthFilter, variantFilter });
      setNeedLoad(false);

      if (results.length === 0) {
        setLoadFeedback('This combination does not match any paper. Please contact learnmates.share@gmail.com if you think something is wrong.');
        setPickerCollapsed(false);
      } else {
        setLoadFeedback(null);
        setPickerCollapsed(true);
        // Persist selected topics for export cover page
        const key = `topical_checked_${selectedLevel}_${selectedBoard}_${selectedSubject}`;
        localStorage.setItem(key, JSON.stringify([...checked]));
        console.log('[Load] Saved to localStorage:', key, [...checked]);
      }
    };

    void runLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needLoad, checked, matches, mcqFilter, paperFilter, yearFilter, configs, isPaperMode, orderFilter, limitFilter, strictFilter, monthFilter, variantFilter]);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Topical Questions Generator | Learnmates</title>
        <meta name="description" content="Generate topical questions from structured IGCSE/A-Level configuration, with filtered past paper questions and downloadable PDFs." />
        <meta name="keywords" content="Learnmates, topical questions, past papers, IGCSE, A-Level, curriculum, practice questions, exam preparation" />
        <meta property="og:title" content="Topical Questions Generator | Learnmates" />
        <meta property="og:description" content="Generate topical questions from structured IGCSE/A-Level configuration, with filtered past paper questions and downloadable PDFs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.learnmates.org/topicals" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Topical Questions Generator | Learnmates" />
        <meta name="twitter:description" content="Generate topical questions from structured IGCSE/A-Level configuration, with filtered past paper questions and downloadable PDFs." />
      </Helmet>

      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold mb-4">Topical questions Generator</h1>
        <p className="mb-6 text-gray-700 dark:text-gray-300">Choose a level, board and subject from the dropdowns.</p>
      </motion.div>

      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <LevelBoardSubjectPicker
          levels={levels}
          selectedLevel={selectedLevel}
          onLevelChange={setSelectedLevel}
          boardsForLevel={boardsForLevel}
          selectedBoard={selectedBoard}
          onBoardChange={setSelectedBoard}
          subjectsForLevelBoard={subjectsForLvlBoard}
          selectedSubject={selectedSubject}
          onSubjectChange={setSelectedSubject}
        />
      </div>

      {!selectedLevel || !selectedBoard || !selectedSubject ? (
        <p className="text-gray-500">Please select a level, board, and subject to get started.</p>
      ) : matches.length === 0 ? (
        <p className="text-gray-500">No configuration exists for the selected combination.</p>
      ) : (
        matches.map((cfg, idx) => {
          const selectedTopicsCount = cfg.units.reduce((unitAcc, unit) => {
            const countInUnit = unit.topics.reduce((topicAcc, topic) => {
              const topicKey = makeKey(cfg.level, cfg.board, cfg.subject, unit.unit, topic.topic);
              const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;
              if (hasSubtopics) {
                const selectedSubtopicsCount = (topic.subtopics || []).filter(sub =>
                  checked.has(makeKey(cfg.level, cfg.board, cfg.subject, unit.unit, sub.subtopic))
                ).length;
                return topicAcc + selectedSubtopicsCount;
              }
              return topicAcc + (checked.has(topicKey) ? 1 : 0);
            }, 0);
            return unitAcc + countInUnit;
          }, 0);
          const hasAnySelectedTopics = selectedTopicsCount > 0;

          const showUnitTags = cfg.units.length > 1;

          return (
            <div key={idx} className="mt-8">
              <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <FilterBar
                    onLoad={handleLoad}
                    isPaperMode={isPaperMode}
                    showMcqTheoryFilter={showMcqTheoryFilter}
                    mcqFilter={mcqFilter}
                    onMcqFilterChange={setMcqFilter}
                    availableFilters={availableFilters}
                    availablePaperNumbers={availablePaperNumbers}
                    paperFilter={paperFilter}
                    isAllPapersSelected={isAllPapersSelected}
                    selectedPaperSummary={selectedPaperSummary}
                    onTogglePaper={togglePaperFilter}
                    availableYears={availableYearNumbers}
                    yearFilter={yearFilter}
                    isAllYearsSelected={isAllYearsSelected}
                    selectedYearSummary={selectedYearSummary}
                    onToggleYear={toggleYearFilter}
                    orderFilter={orderFilter}
                    onOrderFilterChange={setOrderFilter}
                    limitFilter={limitFilter}
                    onLimitFilterChange={setLimitFilter}
                    strict={strictFilter}
                    onStrictChange={setStrictFilter}
                    availableMonths={availableMonthsArr}
                    monthFilter={monthFilter}
                    isAllMonthsSelected={isAllMonthsSelected}
                    selectedMonthSummary={selectedMonthSummary}
                    onToggleMonth={toggleMonthFilter}
                    availableVariants={availableVariantsArr}
                    variantFilter={variantFilter}
                    isAllVariantsSelected={isAllVariantsSelected}
                    selectedVariantSummary={selectedVariantSummary}
                    onToggleVariant={toggleVariantFilter}
                    hasSelectedTopics={hasAnySelectedTopics}
                  />
                </div>

              </div>

              <div className="md:border-t md:pt-6">
                <div className="flex flex-col md:flex-row justify-start md:gap-6 md:min-h-screen">
                  {/* topic picker column: collapses to a summary strip once results are loaded */}
                  <div
                    className={`w-full mb-6 md:mb-0 transition-all duration-300 ease-in-out ${pickerCollapsed ? 'md:w-0 md:overflow-hidden' : 'md:w-2/6'
                      }`}
                  >
                    <TopicPickerPanel
                      cfg={cfg}
                      checked={checked}
                      expanded={expanded}
                      expandedUnits={expandedUnits}
                      isTopicChecked={isTopicChecked}
                      isTopicPartiallyChecked={isTopicPartiallyChecked}
                      toggleTopic={toggleTopic}
                      toggleSubtopic={toggleSubtopic}
                      toggleExpanded={toggleExpanded}
                      toggleUnitExpanded={toggleUnitExpanded}
                      selectedTopicsCount={selectedTopicsCount}
                      hasAnySelectedTopics={hasAnySelectedTopics}
                      collapsed={pickerCollapsed}
                      onExpandPicker={() => setPickerCollapsed(false)}
                    />
                  </div>

                  {/* viewer column: grows to fill the space the picker gave up */}
                  <div className="w-full md:flex-1 md:min-w-0 md:ml-0 pt-6 md:pt-0 transition-all duration-300 ease-in-out">
                    <MatchesViewerPanel
                      topicalQuiz={topicalQuiz}
                      hasLoadedOnce={hasLoadedOnce}
                      loadingProgress={loadingProgress}
                      showUnitTags={showUnitTags}
                      onExport={handleExport}
                      onExpandPicker={() => setPickerCollapsed(false)}
                      loadFeedback={loadFeedback}
                      showExtraPageOption={showExtraPageOption}
                      extraPageEnabled={extraPageEnabled}
                      onExtraPageToggle={setExtraPageEnabled}
                      showHeaderOptions={true}
                      headerPageEnabled={headerPageEnabled}
                      mergeHeaderEnabled={mergeHeaderEnabled}
                      onHeaderPageToggle={setHeaderPageEnabled}
                      onMergeHeaderToggle={setMergeHeaderEnabled}
                      headerSize={headerSize}
                      onHeaderSizeChange={setHeaderSize}
                      loadId={loadId}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {isExporting && exportProgress && (
        <div
          className="fixed bottom-5 right-5 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 max-w-sm"
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(400px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-gray-300 border-t-blue-500 rounded-full flex-shrink-0" style={{ animation: 'spin 0.8s linear infinite' }} />
            <div className="flex-1">
              <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Creating PDF</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Merging {exportProgress.current} / {exportProgress.total}...
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};



export default TopicalPages;
