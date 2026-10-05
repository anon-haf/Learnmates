import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopicalQuiz, { Question } from '../TopicalQuiz';
import ExportMenu from './ExportMenu';
import { pillActive, btnSecondary } from './ui';

interface MatchesViewerPanelProps {
  topicalQuiz: Question[];
  hasLoadedOnce: boolean;
  loadingProgress: { current: number; total: number; isLoading: boolean };
  showUnitTags: boolean;
  onExport: (type: 'questions' | 'markschemes', options?: { extraPage?: boolean; headerPage?: boolean; worksheet?: boolean }) => void;
  onExpandPicker?: () => void;
  loadFeedback?: string | null;
  showExtraPageOption?: boolean;
  extraPageEnabled?: boolean;
  onExtraPageToggle?: (enabled: boolean) => void;
  showHeaderOptions?: boolean;
  headerPageEnabled?: boolean;
  onHeaderPageToggle?: (enabled: boolean) => void;
  headerSize?: number;
  onHeaderSizeChange?: (size: number) => void;
  showWorksheetOption?: boolean;
  worksheetEnabled?: boolean;
  onWorksheetToggle?: (enabled: boolean) => void;
  loadId?: number;
}

const EmptyState: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 p-6 sm:p-8 text-center shadow-sm">
    <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</p>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">{body}</p>
  </div>
);

const MatchesViewerPanel: React.FC<MatchesViewerPanelProps> = ({
  topicalQuiz,
  hasLoadedOnce,
  loadingProgress,
  showUnitTags,
  onExport,
  onExpandPicker,
  loadFeedback,
  showExtraPageOption = false,
  extraPageEnabled = false,
  onExtraPageToggle,
  showHeaderOptions = false,
  headerPageEnabled = false,
  onHeaderPageToggle,
  headerSize,
  onHeaderSizeChange,
  showWorksheetOption = false,
  worksheetEnabled = true,
  onWorksheetToggle,
  loadId,
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 h-full flex flex-col">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          {hasLoadedOnce && topicalQuiz.length > 0 && onExpandPicker ? (
            <button type="button" onClick={onExpandPicker} className={`${btnSecondary} whitespace-nowrap transition-transform active:scale-95`}>
              Edit topics
            </button>
          ) : (
            <>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">Matching questions</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Based on your selected topics and subtopics.</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasLoadedOnce && topicalQuiz.length > 0 && (
            <ExportMenu
              onExport={onExport}
              showExtraPageOption={showExtraPageOption}
              extraPageEnabled={extraPageEnabled}
              onExtraPageToggle={onExtraPageToggle}
              showHeaderOptions={showHeaderOptions}
              headerPageEnabled={headerPageEnabled}
              onHeaderPageToggle={onHeaderPageToggle}
              headerSize={headerSize}
              onHeaderSizeChange={onHeaderSizeChange}
              showWorksheetOption={showWorksheetOption}
              worksheetEnabled={worksheetEnabled}
              onWorksheetToggle={onWorksheetToggle}
            />
          )}
          {hasLoadedOnce && (
            <span className={pillActive}>
              {topicalQuiz.length} match{topicalQuiz.length === 1 ? '' : 'es'}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 border-t border-gray-200 dark:border-blue-800 pt-5 mt-2 relative">
        {loadingProgress.isLoading && (
          <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Loading questions...</p>
                <div className="mt-2">
                  <div className="w-full bg-blue-200 dark:bg-blue-800/60 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress.total > 0 ? (loadingProgress.current / loadingProgress.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mt-1.5">
                    {loadingProgress.current} of {loadingProgress.total} questions loaded
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={loadId || (hasLoadedOnce ? 'loaded' : 'empty')}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 280, damping: 24, mass: 0.9 }}
          >
            {loadFeedback ? (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-5 text-sm text-red-700 dark:text-red-200 shadow-sm">
                <p className="font-semibold text-base">No matching papers found</p>
                <p className="mt-1.5 opacity-90">{loadFeedback}</p>
              </div>
            ) : topicalQuiz.length > 0 ? (
              <TopicalQuiz
                key={loadId}
                questions={topicalQuiz}
                title={`Topical Matches (${topicalQuiz.length})`}
                quizId="topical"
                showUnitTags={showUnitTags}
                isLoading={loadingProgress.isLoading}
              />
            ) : hasLoadedOnce ? (
              <EmptyState
                title="No matching questions found"
                body='Try selecting more topics or a different unit, then click "Load matching papers" again.'
              />
            ) : (
              <EmptyState
                title="Matches will appear here"
                body='Tick one or more topics on the left, then click "Load matching papers" to see relevant questions.'
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MatchesViewerPanel;
