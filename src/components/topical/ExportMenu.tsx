import React, { useRef, useState, useEffect } from 'react';
import { btnSecondary, dropdownPanel, dropdownItem } from './ui';
import TopicalCheckbox from './Checkbox';

interface ExportMenuProps {
  onExport: (
    type: 'questions' | 'markschemes',
    options?: {
      extraPage?: boolean;
      headerPage?: boolean;
      worksheet?: boolean;
      interleaveMs?: boolean;
      headerSize?: number;
      defaultFormat?: boolean;
      headerSeparatePage?: boolean;
    }
  ) => void;
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
  interleaveMsEnabled?: boolean;
  onInterleaveMsToggle?: (enabled: boolean) => void;
  defaultFormatEnabled?: boolean;
  onDefaultFormatToggle?: (enabled: boolean) => void;
  headerSeparatePageEnabled?: boolean;
  onHeaderSeparatePageToggle?: (enabled: boolean) => void;
}

const DEFAULT_FORMAT_EXPLANATION =
  "Recommended by LearnMates: Automatically generates questions in compact worksheet style " +
  "with headers attached above each question. This optimizes paper usage while keeping " +
  "question details clear and organized.";

const EXTRA_PAGE_EXPLANATION =
  "Inserts a blank page right after each question in the Questions PDF. Handy for printing " +
  "worksheets that need extra room to work out answers by hand. It only applies to the " +
  "Questions PDF — Mark Schemes are never padded with blank pages.";

const HEADER_PAGE_EXPLANATION =
  "Adds a reference header banner above each question showing the question title and syllabus topic codes.";

const HEADER_SEPARATE_PAGE_EXPLANATION =
  "When enabled, the header for each question is placed on its own dedicated page immediately before the question, " +
  "rather than being attached as a thin band at the top of the question page. " +
  "Only available in non-worksheet mode when headers are turned on.";

const WORKSHEET_EXPLANATION =
  "When enabled, questions are arranged compactly and margins are minimized to save paper. " +
  "When disabled, every question starts on a fresh page with standard margins.";

const INTERLEAVE_MS_EXPLANATION =
  "Exports each question followed immediately by its mark scheme (Q1, MS1, Q2, MS2...). " +
  "Ideal for targeted practice where you want the answer key right next to each problem.";

const ExportMenu: React.FC<ExportMenuProps> = ({
  onExport,
  showExtraPageOption = false,
  extraPageEnabled = false,
  onExtraPageToggle,
  showHeaderOptions = true,
  headerPageEnabled = true,
  onHeaderPageToggle,
  headerSize = 25,
  onHeaderSizeChange,
  showWorksheetOption = true,
  worksheetEnabled = true,
  onWorksheetToggle,
  interleaveMsEnabled = false,
  onInterleaveMsToggle,
  defaultFormatEnabled = true,
  onDefaultFormatToggle,
  headerSeparatePageEnabled = false,
  onHeaderSeparatePageToggle,
}) => {
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Info tooltip states
  const [defaultInfoOpen, setDefaultInfoOpen] = useState(false);
  const [worksheetInfoOpen, setWorksheetInfoOpen] = useState(false);
  const [headerInfoOpen, setHeaderInfoOpen] = useState(false);
  const [interleaveInfoOpen, setInterleaveInfoOpen] = useState(false);
  const [extraPageInfoOpen, setExtraPageInfoOpen] = useState(false);
  const [headerSepInfoOpen, setHeaderSepInfoOpen] = useState(false);

  // Fallback internal state if parent doesn't provide onDefaultFormatToggle
  const [internalDefaultFormat, setInternalDefaultFormat] = useState(true);
  const isDefaultActive = onDefaultFormatToggle !== undefined ? defaultFormatEnabled : internalDefaultFormat;

  const handleToggleDefault = (nextVal: boolean) => {
    if (onDefaultFormatToggle) {
      onDefaultFormatToggle(nextVal);
    } else {
      setInternalDefaultFormat(nextVal);
    }
    // If user re-enables default format, automatically close advanced settings
    if (nextVal) {
      setAdvancedOpen(false);
    }
  };

  // Local slider value for smooth dragging (avoids re-rendering parent on every tick)
  const [localHeaderSize, setLocalHeaderSize] = useState<number>(headerSize || 25);

  // Keep local in sync if parent changes (e.g. when default format re-enabled)
  useEffect(() => { setLocalHeaderSize(headerSize || 25); }, [headerSize]);

  const ref = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);
  const defaultInfoRef = useRef<HTMLDivElement>(null);
  const worksheetInfoRef = useRef<HTMLDivElement>(null);
  const headerInfoRef = useRef<HTMLDivElement>(null);
  const interleaveInfoRef = useRef<HTMLDivElement>(null);
  const extraPageInfoRef = useRef<HTMLDivElement>(null);
  const headerSepInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        advancedRef.current &&
        !advancedRef.current.contains(target)
      ) {
        setOpen(false);
        setAdvancedOpen(false);
        setDefaultInfoOpen(false);
        setWorksheetInfoOpen(false);
        setHeaderInfoOpen(false);
        setInterleaveInfoOpen(false);
        setExtraPageInfoOpen(false);
        setHeaderSepInfoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportQuestions = () => {
    if (isDefaultActive) {
      onExport('questions', {
        defaultFormat: true,
        worksheet: true,
        headerPage: true,
        headerSize: 25,
        interleaveMs: false,
        extraPage: false,
        headerSeparatePage: false,
      });
    } else {
      onExport('questions', {
        defaultFormat: false,
        worksheet: worksheetEnabled,
        headerPage: headerPageEnabled,
        headerSize: headerSize || 25,
        interleaveMs: interleaveMsEnabled,
        extraPage: extraPageEnabled,
        headerSeparatePage: !worksheetEnabled && headerPageEnabled ? headerSeparatePageEnabled : false,
      });
    }
    setOpen(false);
    setAdvancedOpen(false);
  };

  const handleExportMarkschemes = () => {
    if (isDefaultActive) {
      onExport('markschemes', {
        defaultFormat: true,
        worksheet: true,
        headerPage: true,
        headerSize: 25,
        interleaveMs: false,
        extraPage: false,
        headerSeparatePage: false,
      });
    } else {
      onExport('markschemes', {
        defaultFormat: false,
        worksheet: worksheetEnabled,
        headerPage: headerPageEnabled,
        headerSize: headerSize || 25,
        interleaveMs: false,
        extraPage: false,
        headerSeparatePage: !worksheetEnabled && headerPageEnabled ? headerSeparatePageEnabled : false,
      });
    }
    setOpen(false);
    setAdvancedOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Export trigger button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={`${btnSecondary} relative`}
        title="Export topical questions or mark schemes"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Export</span>
        {!isDefaultActive && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
            title="Custom export settings active"
          />
        )}
        <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Main Export dropdown */}
      {open && (
        <div className={`${dropdownPanel} right-0 w-72 sm:w-80 p-2 shadow-2xl`}>
          {/* Quick export actions */}
          <div className="space-y-1">
            <button
              onClick={handleExportQuestions}
              className={`${dropdownItem} font-medium group transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30`}
            >
              <span className="text-base text-blue-500">📄</span>
              <div className="flex-1 text-left">
                <div className="text-gray-800 dark:text-gray-100 font-medium">Questions PDF</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
                  {isDefaultActive ? 'Worksheet style with headers' : 'Using custom settings'}
                </div>
              </div>
            </button>
            <button
              onClick={handleExportMarkschemes}
              className={`${dropdownItem} font-medium group transition-colors hover:bg-green-50 dark:hover:bg-green-900/30`}
            >
              <span className="text-base text-green-500">📝</span>
              <div className="flex-1 text-left">
                <div className="text-gray-800 dark:text-gray-100 font-medium">Mark Schemes PDF</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
                  {isDefaultActive ? 'Worksheet style with headers' : 'Using custom settings'}
                </div>
              </div>
            </button>
          </div>

          <div className="my-2 border-t border-gray-200 dark:border-gray-700/80" />

          {/* Section title */}
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Export Format & Settings
          </div>

          {/* Default Format Preset Box */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700/80 bg-gray-50/70 dark:bg-gray-800/60 p-2.5">
            <div className="flex items-center justify-between gap-2">
              {/* Default toggle & label */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <TopicalCheckbox
                  checked={isDefaultActive}
                  onChange={() => handleToggleDefault(!isDefaultActive)}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Default format
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    Recommended
                  </span>
                </div>
              </label>

              {/* Action icons row: Info button + Settings button */}
              <div className="flex items-center gap-1.5">
                {/* Info button */}
                <div className="relative" ref={defaultInfoRef}>
                  <button
                    type="button"
                    onClick={() => setDefaultInfoOpen(prev => !prev)}
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                      defaultInfoOpen
                        ? 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-300'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    aria-label="What is default format?"
                    aria-expanded={defaultInfoOpen}
                    title="LearnMates recommendation info"
                  >
                    i
                  </button>

                  {defaultInfoOpen && (
                    <div
                      role="tooltip"
                      className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-600 shadow-xl dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <div className="absolute -top-1 right-2 h-2 w-2 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1">
                        <span>✨ Recommended by LearnMates</span>
                      </div>
                      <p>{DEFAULT_FORMAT_EXPLANATION}</p>
                    </div>
                  )}
                </div>

                {/* Settings (Gear) button */}
                <button
                  type="button"
                  disabled={isDefaultActive}
                  onClick={() => {
                    if (!isDefaultActive) {
                      setAdvancedOpen(prev => !prev);
                    }
                  }}
                  className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs transition-all ${
                    isDefaultActive
                      ? 'border-gray-200 text-gray-300 dark:border-gray-700/60 dark:text-gray-600 opacity-40 cursor-not-allowed pointer-events-none'
                      : advancedOpen
                      ? 'border-blue-500 bg-blue-500 text-white shadow-sm ring-2 ring-blue-500/20'
                      : 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-400 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 cursor-pointer shadow-sm active:scale-95'
                  }`}
                  aria-label="Advanced Export Settings"
                  aria-expanded={advancedOpen}
                  title={
                    isDefaultActive
                      ? 'Disable default format to customize advanced settings'
                      : 'Click to open Advanced Export Settings'
                  }
                >
                  <svg className={`w-4 h-4 ${!isDefaultActive && !advancedOpen ? 'animate-spin-slow' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Helper status text */}
            <div className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              {isDefaultActive ? (
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <svg className="w-3 h-3 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Generates in worksheet style with header attached.
                </span>
              ) : (
                <span className="flex items-center justify-between gap-1 text-blue-600 dark:text-blue-400 font-medium">
                  <span>Custom settings active</span>
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen(prev => !prev)}
                    className="underline text-[11px] hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {advancedOpen ? 'Hide settings' : 'Configure ⚙️'}
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Menu (Attached Popover Menu on desktop, modal on mobile) */}
      {open && advancedOpen && !isDefaultActive && (
        <div
          ref={advancedRef}
          className="fixed inset-x-4 top-24 max-h-[85vh] overflow-y-auto sm:static sm:absolute sm:inset-auto sm:right-full sm:mr-2 sm:top-0 w-auto sm:w-80 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-right-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700/80 mb-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-900 dark:text-gray-100">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <span>Advanced Export Settings</span>
            </div>
            <button
              type="button"
              onClick={() => setAdvancedOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Close advanced settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2.5">
            {/* 1. Worksheet style or not */}
            {showWorksheetOption && (
              <div className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <TopicalCheckbox
                    checked={worksheetEnabled}
                    onChange={() => onWorksheetToggle?.(!worksheetEnabled)}
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                      Worksheet Mode
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Compact questions to minimize paper
                    </div>
                  </div>
                </label>

                <div className="relative shrink-0" ref={worksheetInfoRef}>
                  <button
                    type="button"
                    onClick={() => setWorksheetInfoOpen(prev => !prev)}
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition-colors ${
                      worksheetInfoOpen
                        ? 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-300'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    aria-label="What does worksheet mode do?"
                    aria-expanded={worksheetInfoOpen}
                  >
                    i
                  </button>

                  {worksheetInfoOpen && (
                    <div
                      role="tooltip"
                      className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2.5 text-xs leading-relaxed text-gray-600 shadow-xl dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <div className="absolute -top-1 right-2 h-2 w-2 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
                      {WORKSHEET_EXPLANATION}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Header attached or not */}
            {showHeaderOptions && (
              <div className="rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <TopicalCheckbox
                      checked={headerPageEnabled}
                      onChange={() => onHeaderPageToggle?.(!headerPageEnabled)}
                    />
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                        Header Attached
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        Question title & topic code band
                      </div>
                    </div>
                  </label>

                  <div className="relative shrink-0" ref={headerInfoRef}>
                    <button
                      type="button"
                      onClick={() => setHeaderInfoOpen(prev => !prev)}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition-colors ${
                        headerInfoOpen
                          ? 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-300'
                          : 'border-gray-300 text-gray-500 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                      aria-label="What does header attached do?"
                      aria-expanded={headerInfoOpen}
                    >
                      i
                    </button>

                    {headerInfoOpen && (
                      <div
                        role="tooltip"
                        className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2.5 text-xs leading-relaxed text-gray-600 shadow-xl dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <div className="absolute -top-1 right-2 h-2 w-2 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
                        {HEADER_PAGE_EXPLANATION}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Header size slider (active when Header Attached is checked) */}
                <div className={`mt-2 ml-7 pr-1 pt-1 ${!headerPageEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-300 mb-1">
                    <span className="font-medium">Header height</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[11px]">
                      {localHeaderSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="40"
                    step="1"
                    value={localHeaderSize}
                    onChange={e => setLocalHeaderSize(Number(e.target.value))}
                    onPointerUp={e => onHeaderSizeChange?.(Number((e.target as HTMLInputElement).value))}
                    onMouseUp={e => onHeaderSizeChange?.(Number((e.target as HTMLInputElement).value))}
                    disabled={!headerPageEnabled}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600 dark:accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                    <span>15px (compact)</span>
                    <span>40px (large)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MS after Question (Interleave MS) */}
            <div className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <TopicalCheckbox
                  checked={interleaveMsEnabled}
                  onChange={() => onInterleaveMsToggle?.(!interleaveMsEnabled)}
                />
                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                    MS right after Question
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    Interleave mark schemes (Q1, MS1, Q2, MS2...)
                  </div>
                </div>
              </label>

              <div className="relative shrink-0" ref={interleaveInfoRef}>
                <button
                  type="button"
                  onClick={() => setInterleaveInfoOpen(prev => !prev)}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition-colors ${
                    interleaveInfoOpen
                      ? 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-300'
                      : 'border-gray-300 text-gray-500 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  aria-label="What does MS right after question do?"
                  aria-expanded={interleaveInfoOpen}
                >
                  i
                </button>

                {interleaveInfoOpen && (
                  <div
                    role="tooltip"
                    className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2.5 text-xs leading-relaxed text-gray-600 shadow-xl dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <div className="absolute -top-1 right-2 h-2 w-2 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
                    {INTERLEAVE_MS_EXPLANATION}
                  </div>
                )}
              </div>
            </div>

            {/* 5. Extra blank page */}
            {showExtraPageOption && (
              <div className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <TopicalCheckbox
                    checked={extraPageEnabled}
                    onChange={() => onExtraPageToggle?.(!extraPageEnabled)}
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                      Extra Working Page
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Blank page after each question
                    </div>
                  </div>
                </label>

                <div className="relative shrink-0" ref={extraPageInfoRef}>
                  <button
                    type="button"
                    onClick={() => setExtraPageInfoOpen(prev => !prev)}
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition-colors ${
                      extraPageInfoOpen
                        ? 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-300'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    aria-label="What does extra page do?"
                    aria-expanded={extraPageInfoOpen}
                  >
                    i
                  </button>

                  {extraPageInfoOpen && (
                    <div
                      role="tooltip"
                      className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2.5 text-xs leading-relaxed text-gray-600 shadow-xl dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <div className="absolute -top-1 right-2 h-2 w-2 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
                      {EXTRA_PAGE_EXPLANATION}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. Header as own page (non-worksheet + header enabled only) */}
            {showHeaderOptions && !worksheetEnabled && headerPageEnabled && (
              <div className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors border border-dashed border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/20">
                <label className="flex items-center gap-2 cursor-pointer flex-1">
                  <TopicalCheckbox
                    checked={headerSeparatePageEnabled}
                    onChange={() => onHeaderSeparatePageToggle?.(!headerSeparatePageEnabled)}
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      Header as own page
                      
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                      Puts header on its own page before question
                    </div>
                  </div>
                </label>

                <div className="relative shrink-0" ref={headerSepInfoRef}>
                  <button
                    type="button"
                    onClick={() => setHeaderSepInfoOpen(prev => !prev)}
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition-colors ${
                      headerSepInfoOpen
                        ? 'border-purple-400 bg-purple-50 text-purple-600 dark:border-purple-500 dark:bg-purple-500/20 dark:text-purple-300'
                        : 'border-gray-300 text-gray-500 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                    aria-label="What does header as own page do?"
                    aria-expanded={headerSepInfoOpen}
                  >
                    i
                  </button>

                  {headerSepInfoOpen && (
                    <div
                      role="tooltip"
                      className="absolute right-0 top-full z-50 mt-2 w-60 rounded-lg border border-gray-200 bg-white p-2.5 text-xs leading-relaxed text-gray-600 shadow-xl dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <div className="absolute -top-1 right-2 h-2 w-2 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
                      {HEADER_SEPARATE_PAGE_EXPLANATION}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Done button */}
          <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-700/80 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Settings are saved automatically
            </span>
            <button
              type="button"
              onClick={() => setAdvancedOpen(false)}
              className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;