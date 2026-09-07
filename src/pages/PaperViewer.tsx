import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Download, Flag } from 'lucide-react';
import { useRouteBase, withBase } from '../utils/routeBase';
import { resolveFromR2, getAssetAuthHeaders } from '../utils/r2Utils';
import { getYearFromFileName, getMonthFromFileName, getPaperNumberFromFileName, getVariantFromFileName, isCambridgeScienceMcqSubject, getPaperKeyFromFileName } from '../utils/topicalHelpers';
import { deriveMarkSchemeUrl } from '../utils/quizLoader';
import PDFViewerModal from '../components/PDFViewerModal';
import MediaViewer from '../components/MediaViewer';
import { ReportModal } from '../components/ReportModal';
import { generateMergedPDF, MergeItem } from '../utils/pdfMerger';

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

interface PaperViewerProps {
  level: string;
  board: string;
  subject: string;
  year: string;
  paperKey: string;
  unit: string;
}

const PaperViewerPage: React.FC = () => {
  const base = useRouteBase();
  const { level, board, subject, year, paperKey, unit } = useParams<PaperViewerProps>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [questionIndex, setQuestionIndex] = useState(0);
  const [papers, setPapers] = useState<PaperEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [currentPdf, setCurrentPdf] = useState<PaperEntry | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'full'>('single');
  const [markSchemeOpen, setMarkSchemeOpen] = useState(false);
  const [markSchemeOpenFull, setMarkSchemeOpenFull] = useState(false);
  const [mcqPanelOpenFull, setMcqPanelOpenFull] = useState(true);
  
  const [isMerging, setIsMerging] = useState(false);
  const [fullPaperPdfUrl, setFullPaperPdfUrl] = useState<string | null>(null);
  const [fullPaperMsUrl, setFullPaperMsUrl] = useState<string | null>(null);

  // Annotation temp states
  const [annotations, setAnnotations] = useState<Record<string, string>>({});
  const [msAnnotations, setMsAnnotations] = useState<Record<string, string>>({});

  // MCQ checker states
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Full Paper MCQ states
  const [fullMcqSelections, setFullMcqSelections] = useState<Record<number, string>>({});
  const [fullMcqChecked, setFullMcqChecked] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (fullPaperPdfUrl) URL.revokeObjectURL(fullPaperPdfUrl);
    };
  }, [fullPaperPdfUrl]);

  useEffect(() => {
    return () => {
      if (fullPaperMsUrl) URL.revokeObjectURL(fullPaperMsUrl);
    };
  }, [fullPaperMsUrl]);

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

  const loadPaperQuestions = useCallback(async () => {
    if (!level || !board || !subject || !unit || !paperKey) return;

    setLoading(true);
    const baseUrlPrefix = ((import.meta as any).env?.BASE_URL as string) || '/';
    const basePath = `${baseUrlPrefix}topicals/${level}/${board}/${subject}/${unit}`;
    const info = await fetchInfoForUnit(basePath);

    let subjectMcqAnswers: Record<string, string> | null = null;
    const isMcqSubject = isCambridgeScienceMcqSubject(level, board, subject);
    if (isMcqSubject) {
      try {
        let mcqAnswersUrl = level === 'a-level' 
          ? `${baseUrlPrefix}topicals/${level}/${board}/${subject}/AS/mcq_ans.json`
          : `${baseUrlPrefix}topicals/${level}/${board}/${subject}/${subject}/mcq_ans.json`;
          
        const resolvedMcqAnswersUrl = await resolveFromR2(mcqAnswersUrl);
        const res = await fetch(resolvedMcqAnswersUrl || mcqAnswersUrl, { headers: getAssetAuthHeaders() });
        if (res.ok) {
           const data = await res.json();
           if (data && typeof data === 'object') subjectMcqAnswers = data;
        }
      } catch (e) {}
    }

    if (info && Array.isArray(info)) {
      const filtered = info
        .filter((entry: any) => {
          const fileName = entry.file_name;
          const entryYear = getYearFromFileName(fileName);
          const entryMonth = getMonthFromFileName(fileName);
          const entryPaperNum = getPaperNumberFromFileName(fileName);
          const entryVariant = getVariantFromFileName(fileName);

          if (entryYear === null) return false;

          const entryPaperStr = entryPaperNum ? `P${entryPaperNum}${entryVariant !== null ? entryVariant : ''}` : '';
          const entryShortName = `${entryMonth} ${entryYear} ${entryPaperStr}`.trim().replace(/\s+/g, '_');

          return entryShortName === paperKey;
        })
        .map((entry: any) => {
          const fileName = entry.file_name;
          const questionNumber = fileName.match(/Q(\d+)$/i)?.[1];
          const pdfUrl = `${basePath}/${fileName}.pdf`;
          let msUrl = deriveMarkSchemeUrl(pdfUrl);
          const isMCQ = entry.MCQ === 'yes' || entry.MCQ === true;
          
          const entryPaperNum = getPaperNumberFromFileName(fileName);
          const mcqPaperNumbers = (level === 'igcse' || level === 'IGCSE') ? [1, 2] : [1];
          const shouldEnableMcqChecker = isMcqSubject && entryPaperNum !== null && mcqPaperNumbers.includes(entryPaperNum);
          const pKey = getPaperKeyFromFileName(fileName);
          const mcqAnswer = shouldEnableMcqChecker && subjectMcqAnswers && pKey && questionNumber 
            ? subjectMcqAnswers[pKey]?.[parseInt(questionNumber, 10) - 1] 
            : undefined;

          if (mcqAnswer) {
             msUrl = undefined;
          }

          return {
            fileName,
            year: getYearFromFileName(fileName),
            month: getMonthFromFileName(fileName),
            paperNumber: getPaperNumberFromFileName(fileName),
            variant: getVariantFromFileName(fileName),
            questionNumber: questionNumber ? parseInt(questionNumber, 10) : null,
            pdfUrl,
            msUrl: msUrl || undefined,
            topicMatches: Array.isArray(entry.topic_matches) ? entry.topic_matches : [],
            unit,
            isMCQ,
            mcqAnswer,
          } as PaperEntry;
        })
        .sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

      setPapers(filtered);
      if (filtered.length > 0) {
        setCurrentPdf(filtered[0]);
        setQuestionIndex(0);
      }
    }
    setLoading(false);
  }, [level, board, subject, unit, paperKey, year, fetchInfoForUnit]);

  useEffect(() => {
    loadPaperQuestions();
  }, [loadPaperQuestions]);

  useEffect(() => {
    if (viewMode === 'full' && !fullPaperPdfUrl && !isMerging && papers.length > 0) {
      setIsMerging(true);
      const mergeQ = async () => {
        try {
          const qItems: MergeItem[] = papers.map(p => ({ id: `q${p.questionNumber}`, url: p.pdfUrl, type: 'pdf' }));
          const qBlob = await generateMergedPDF(qItems, 'Question', {
            title: paperDisplayName,
            subtitle: `${level.toUpperCase()} ${board.charAt(0).toUpperCase() + board.slice(1)} ${subject} - ${unit}`
          });
          setFullPaperPdfUrl(URL.createObjectURL(qBlob));
        } catch (error) {
          console.error("Error generating question paper:", error);
        } finally {
          setIsMerging(false);
        }
      };
      mergeQ();
    }
  }, [viewMode, fullPaperPdfUrl, isMerging, papers]);

  const [isMergingMs, setIsMergingMs] = useState(false);

  useEffect(() => {
    if (viewMode === 'full' && !fullPaperMsUrl && !isMergingMs && papers.length > 0) {
      setIsMergingMs(true);
      const mergeMs = async () => {
        try {
          const msPapers = papers.filter(p => p.msUrl || p.mcqAnswer);
          if (msPapers.length > 0) {
            const msItems: MergeItem[] = msPapers.map(p => ({ 
              id: `q${p.questionNumber}`, 
              url: p.msUrl || '', 
              type: p.mcqAnswer ? 'mcqAnswer' : 'pdf',
              mcqAnswer: p.mcqAnswer 
            }));
            const msBlob = await generateMergedPDF(msItems, 'Mark Scheme', {
              title: paperDisplayName,
              subtitle: `${level.toUpperCase()} ${board.charAt(0).toUpperCase() + board.slice(1)} ${subject} - ${unit} (Mark Scheme)`
            });
            setFullPaperMsUrl(URL.createObjectURL(msBlob));
          }
        } catch (error) {
          console.error("Error generating mark scheme:", error);
        } finally {
          setIsMergingMs(false);
        }
      };
      mergeMs();
    }
  }, [viewMode, fullPaperMsUrl, isMergingMs, papers]);

  const handleQuestionClick = (entry: PaperEntry, index: number) => {
    setCurrentPdf(entry);
    setQuestionIndex(index);
    setPdfViewerOpen(true);
    setSelectedOption(null);
    setIsAnswerChecked(false);
  };

  const closePdfViewer = () => {
    setPdfViewerOpen(false);
    setCurrentPdf(null);
    setSelectedOption(null);
    setIsAnswerChecked(false);
  };

  const goToNext = () => {
    if (questionIndex < papers.length - 1) {
      setQuestionIndex(i => i + 1);
      setCurrentPdf(papers[questionIndex + 1]);
      setMarkSchemeOpen(false);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    }
  };

  const goToPrev = () => {
    if (questionIndex > 0) {
      setQuestionIndex(i => i - 1);
      setCurrentPdf(papers[questionIndex - 1]);
      setMarkSchemeOpen(false);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    }
  };

  // Reconstruct display name from loaded papers
  const firstPaper = papers[0];
  const paperDisplayName = firstPaper ? `${firstPaper.month} ${firstPaper.year} ${firstPaper.paperNumber ? `P${firstPaper.paperNumber}${firstPaper.variant !== null ? firstPaper.variant : ''}` : ''}`.trim() : paperKey.replace(/_/g, ' ');

  const hasRealMs = papers.some(p => p.msUrl);

  if (!level || !board || !subject) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-gray-500">
        <p>Invalid paper link.</p>
      </div>
    );
  }

  const backUrl = `/pastpapers/${level}/${board}/${subject}`;

  return (
    <motion.div initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>{paperDisplayName} | Past Papers | Learnmates</title>
        <meta name="description" content={`View questions from ${paperDisplayName} for ${subject} (${level.toUpperCase()} ${board.charAt(0).toUpperCase() + board.slice(1)})`} />
        <meta property="og:title" content={`${paperDisplayName} | Past Papers | Learnmates`} />
        <meta property="og:description" content={`View questions from ${paperDisplayName} for ${subject} (${level.toUpperCase()} ${board.charAt(0).toUpperCase() + board.slice(1)})`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="mb-6">
        <button
          onClick={() => navigate(backUrl)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Papers
        </button>
      </div>

      <motion.div className="mb-8">

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{paperDisplayName}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{papers.length} questions</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('single')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'single'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Single Question
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'full'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Full Paper
            </button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading questions...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No questions found for this paper.</p>
        </div>
      ) : viewMode === 'single' && currentPdf ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col w-full border border-gray-200 dark:border-gray-700">
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <button
              onClick={goToPrev}
              disabled={questionIndex === 0}
              className="px-3 sm:px-4 py-2 text-base text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Question {currentPdf.questionNumber || questionIndex + 1} of {papers.length}
            </div>
            <button
              onClick={goToNext}
              disabled={questionIndex === papers.length - 1}
              className="px-3 sm:px-6 py-2 text-base bg-gray-700 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Question {currentPdf.questionNumber || '?'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {currentPdf.msUrl && (
                  <button
                    onClick={() => setMarkSchemeOpen(!markSchemeOpen)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
                      markSchemeOpen
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {markSchemeOpen ? 'Hide Mark Scheme' : 'Show Mark Scheme'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                  title="Report this question"
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">Report</span>
                </button>
              </div>
            </div>
            <div className={`grid gap-4 ${markSchemeOpen && currentPdf.msUrl ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              <div className="flex flex-col gap-4 w-full">
                {currentPdf.mcqAnswer ? (
                  <div className="flex flex-col lg:flex-row gap-4">
                     <div className="flex-1 w-full relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-[50vh] lg:max-h-[85vh]">
                        <MediaViewer
                          url={currentPdf.pdfUrl}
                          type="pdf"
                          savedAnnotation={annotations[currentPdf.pdfUrl]}
                          onSaveAnnotation={(data) => setAnnotations(prev => ({ ...prev, [currentPdf.pdfUrl]: data }))}
                          hasMarkScheme={false}
                          markSchemeOpen={false}
                          hideLargeView={true}
                        />
                     </div>
                     <div className="w-full lg:w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col shrink-0 max-h-[50vh] lg:max-h-[85vh]">
                        <div className="p-4 flex flex-col items-center flex-1 overflow-y-auto">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Select Answer</h4>
                          <div className="flex gap-2 w-full mb-4 justify-center">
                             {['A', 'B', 'C', 'D'].map(opt => {
                               const isSelected = selectedOption === opt;
                               const isCorrect = isAnswerChecked && currentPdf.mcqAnswer === opt;
                               const isWrong = isAnswerChecked && isSelected && currentPdf.mcqAnswer !== opt;
                               return (
                                 <button 
                                   key={opt}
                                   onClick={() => { setSelectedOption(opt); setIsAnswerChecked(false); }}
                                   className={`flex-1 aspect-square max-w-[56px] rounded-full border text-lg font-bold uppercase transition-colors duration-200 flex items-center justify-center ${
                                     isCorrect
                                       ? 'border-green-600 bg-green-600 text-white'
                                       : isWrong
                                         ? 'border-red-600 bg-red-600 text-white'
                                         : isSelected
                                           ? 'border-gray-700 bg-gray-700 dark:border-gray-500 dark:bg-gray-600 text-white'
                                           : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                   }`}
                                 >
                                   {opt}
                                 </button>
                               );
                             })}
                          </div>
                          <button
                            onClick={() => setIsAnswerChecked(true)}
                            disabled={!selectedOption}
                            className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Check
                          </button>
                          {isAnswerChecked && (
                            <div className={`mt-4 p-3 rounded-lg w-full text-center font-bold ${selectedOption === currentPdf.mcqAnswer ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                              {selectedOption === currentPdf.mcqAnswer ? 'Correct!' : 'Incorrect'}
                            </div>
                          )}
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className={`w-full relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${markSchemeOpen && currentPdf.msUrl ? 'max-h-[50vh] lg:max-h-[85vh]' : 'max-h-[85vh]'}`}>
                    <MediaViewer
                      url={currentPdf.pdfUrl}
                      type="pdf"
                      savedAnnotation={annotations[currentPdf.pdfUrl]}
                      onSaveAnnotation={(data) => setAnnotations(prev => ({ ...prev, [currentPdf.pdfUrl]: data }))}
                      hasMarkScheme={false}
                      markSchemeOpen={false}
                      hideLargeView={true}
                    />
                  </div>
                )}
              </div>
              
              {markSchemeOpen && currentPdf.msUrl && (
                <div className="flex flex-col gap-4 w-full">
                  <div className="w-full relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col max-h-[50vh] lg:max-h-[85vh]">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl shrink-0 flex justify-between items-center lg:hidden">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mark Scheme</h4>
                      <button onClick={() => setMarkSchemeOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium">Close</button>
                    </div>
                    <div className="flex-1 relative w-full h-full min-h-[40vh]">
                      <MediaViewer
                        url={currentPdf.msUrl}
                        type="pdf"
                        savedAnnotation={msAnnotations[currentPdf.msUrl]}
                        onSaveAnnotation={(data) => setMsAnnotations(prev => ({ ...prev, [currentPdf.msUrl]: data }))}
                        hasMarkScheme={false}
                        markSchemeOpen={false}
                        hideLargeView={true}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col w-full border border-gray-200 dark:border-gray-700">
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Full Paper Viewer
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {fullPaperPdfUrl && (
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = fullPaperPdfUrl;
                    a.download = `${paperDisplayName} - Questions.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                  title="Download all question papers as merged PDF"
                  disabled={isMerging}
                >
                  <Download className="w-3 h-3" />
                  <span>All Questions PDF</span>
                </button>
              )}
              {fullPaperMsUrl && (
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = fullPaperMsUrl;
                    a.download = `${paperDisplayName} - Mark Scheme.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                  title="Download all mark schemes as merged PDF"
                  disabled={isMergingMs}
                >
                  <Download className="w-3 h-3" />
                  <span>All Mark Schemes PDF</span>
                </button>
              )}
              {hasRealMs && (
                <button
                  onClick={() => setMarkSchemeOpenFull(!markSchemeOpenFull)}
                  disabled={isMerging || isMergingMs}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                    markSchemeOpenFull
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {isMergingMs ? (
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : null}
                  {markSchemeOpenFull ? 'Hide Mark Schemes' : 'Show Mark Schemes'}
                </button>
              )}
              {papers.some(p => p.mcqAnswer) && (
                <button
                  onClick={() => setMcqPanelOpenFull(!mcqPanelOpenFull)}
                  disabled={isMerging}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                    mcqPanelOpenFull
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {mcqPanelOpenFull ? 'Hide MCQ Checker' : 'Show MCQ Checker'}
                </button>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-900">
            {isMerging ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Generating full paper...</p>
                <p className="text-sm text-gray-500 mt-2">Merging {papers.length} questions together</p>
              </div>
            ) : fullPaperPdfUrl ? (
              <div className="flex flex-col lg:flex-row gap-4 relative">
                <div className="flex-1 flex flex-col lg:flex-row gap-4 relative w-full">
                  <div className={`w-full lg:flex-1 relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col ${markSchemeOpenFull || (papers.some(p => p.mcqAnswer) && mcqPanelOpenFull) ? 'h-[50vh] lg:h-auto lg:max-h-[85vh]' : 'h-[85vh] lg:h-auto lg:max-h-[85vh]'}`}>
                    <MediaViewer
                      url={fullPaperPdfUrl}
                      type="pdf"
                      savedAnnotation={annotations[fullPaperPdfUrl]}
                      onSaveAnnotation={(data) => setAnnotations(prev => ({ ...prev, [fullPaperPdfUrl]: data }))}
                      hasMarkScheme={false}
                      markSchemeOpen={false}
                      hideLargeView={true}
                    />
                  </div>
                  {markSchemeOpenFull && fullPaperMsUrl && (
                    <div className="w-full lg:flex-1 relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl lg:shadow-none flex flex-col h-[50vh] lg:h-auto lg:max-h-[85vh]">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl shrink-0 flex justify-between items-center lg:hidden">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mark Scheme</h4>
                        <button onClick={() => setMarkSchemeOpenFull(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium">Close</button>
                      </div>
                      <div className="flex-1 relative w-full h-full min-h-[40vh]">
                        <MediaViewer
                          url={fullPaperMsUrl}
                          type="pdf"
                          savedAnnotation={msAnnotations[fullPaperMsUrl]}
                          onSaveAnnotation={(data) => setMsAnnotations(prev => ({ ...prev, [fullPaperMsUrl]: data }))}
                          hasMarkScheme={false}
                          markSchemeOpen={false}
                          hideLargeView={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {papers.some(p => p.mcqAnswer) && mcqPanelOpenFull && (
                  <div className="w-full lg:w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl lg:shadow-none flex flex-col shrink-0 h-[50vh] lg:h-auto lg:max-h-[calc(100vh-200px)]">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl shrink-0 flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">MCQ Answer Sheet</h4>
                      <button onClick={() => setMcqPanelOpenFull(false)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium">Close</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                      {papers.filter(p => p.mcqAnswer).map((p) => {
                        const qNum = p.questionNumber || 0;
                        const selected = fullMcqSelections[qNum];
                        return (
                          <div key={qNum} className="flex items-center gap-3">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 w-6 text-right shrink-0">{qNum}.</span>
                            <div className="flex gap-2 w-full justify-start">
                              {['A', 'B', 'C', 'D'].map(opt => {
                                const isSelected = selected === opt;
                                const isCorrect = fullMcqChecked && selected && p.mcqAnswer === opt;
                                const isWrong = fullMcqChecked && isSelected && p.mcqAnswer !== opt;
                                return (
                                  <button
                                    key={opt}
                                    onClick={() => {
                                      setFullMcqSelections(prev => ({ ...prev, [qNum]: opt }));
                                      setFullMcqChecked(false);
                                    }}
                                    className={`w-10 h-10 shrink-0 rounded-full border text-sm font-bold uppercase transition-colors duration-200 flex items-center justify-center ${
                                      isCorrect
                                        ? 'border-green-600 bg-green-600 text-white'
                                        : isWrong
                                          ? 'border-red-600 bg-red-600 text-white'
                                          : isSelected
                                            ? 'border-gray-700 bg-gray-700 dark:border-gray-500 dark:bg-gray-600 text-white'
                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl shrink-0">
                      <button
                        onClick={() => setFullMcqChecked(true)}
                        className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                      >
                        Check Answers
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {pdfViewerOpen && currentPdf && (
        <PDFViewerModal
          onClose={closePdfViewer}
          pdfUrl={currentPdf.pdfUrl}
          fileName={`${paperDisplayName} - Q${currentPdf.questionNumber}.pdf`}
        />
      )}

      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        question={currentPdf ? {
          id: currentPdf.fileName,
          title: currentPdf.fileName,
          questionContent: currentPdf.pdfUrl,
          questionContentType: 'pdf',
          markScheme: currentPdf.msUrl,
          markSchemeType: 'pdf',
          topicMatches: currentPdf.topicMatches,
          unit: currentPdf.unit,
        } : null} 
      />
    </motion.div>
  );
};

export default PaperViewerPage;