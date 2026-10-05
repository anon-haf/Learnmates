import React, { useRef, useState, useEffect } from 'react';
import { btnSecondary, dropdownPanel, dropdownItem } from './ui';
import TopicalCheckbox from './Checkbox';

interface ExportMenuProps {
  onExport: (type: 'questions' | 'markschemes', options?: { extraPage?: boolean; headerPage?: boolean; worksheet?: boolean }) => void;
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
}

const EXTRA_PAGE_EXPLANATION =
  "Inserts a blank page right after each question in the Questions PDF. Handy for printing " +
  "worksheets that need extra room to work out answers by hand. It only applies to the " +
  "Questions PDF — Mark Schemes are never padded with blank pages.";

const HEADER_PAGE_EXPLANATION =
  "Adds a separate reference page above each question showing the question title and topic codes. " +
  "Useful for quickly identifying questions when printing or reviewing.";

const WORKSHEET_EXPLANATION =
  "By default (enabled), questions are squeezed together and margins are minimized to save space. " +
  "When disabled, every question starts on a fresh page with standard margins.";



// Same height/padding/font as every other control now (btnSecondary),
// instead of the old oversized purple button.
const ExportMenu: React.FC<ExportMenuProps> = ({ 
  onExport, 
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
  onWorksheetToggle
}) => {
  const [open, setOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [headerInfoOpen, setHeaderInfoOpen] = useState(false);
  const [worksheetInfoOpen, setWorksheetInfoOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const headerInfoRef = useRef<HTMLDivElement>(null);
  const worksheetInfoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setInfoOpen(false);
      } else if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        // Clicked somewhere else inside the menu — just close the popover.
        setInfoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(prev => !prev)} className={btnSecondary}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={`${dropdownPanel} right-0 w-64`}>
          <button
            onClick={() => {
              onExport('questions', { extraPage: extraPageEnabled, headerPage: headerPageEnabled, headerSize: headerSize, worksheet: worksheetEnabled });
              setOpen(false);
            }}
            className={dropdownItem}
          >
            <span className="text-blue-500">📄</span>
            Questions PDF
          </button>
          <button
            onClick={() => {
              onExport('markschemes', { extraPage: false, headerPage: headerPageEnabled, headerSize: headerSize, worksheet: worksheetEnabled });
              setOpen(false);
            }}
            className={dropdownItem}
          >
            <span className="text-green-500">📝</span>
            Mark Schemes PDF
          </button>

          {(showExtraPageOption || showHeaderOptions || showWorksheetOption) && (
            <>
              <div className="my-1.5 border-t border-gray-200 dark:border-gray-700" />

              <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Additional Options
              </div>

              {showExtraPageOption && (
                <div className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
                  <label className="flex cursor-pointer items-center gap-2">
                    <TopicalCheckbox
                      checked={extraPageEnabled}
                      onChange={() => onExtraPageToggle?.(!extraPageEnabled)}
                    />
                    <span>Extra page</span>
                  </label>

                  <div className="relative" ref={infoRef}>
                    <button
                      type="button"
                      onClick={() => setInfoOpen(prev => !prev)}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition-colors ${
                        infoOpen
                          ? 'border-purple-400 bg-purple-50 text-purple-600 dark:border-purple-500 dark:bg-purple-500/10 dark:text-purple-300'
                          : 'border-gray-300 text-gray-500 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      aria-label="What does extra page do?"
                      aria-expanded={infoOpen}
                    >
                      i
                    </button>

                    {infoOpen && (
                      <div
                        role="tooltip"
                        className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-600 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <div className="absolute -top-1 right-1.5 h-2 w-2 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
                        {EXTRA_PAGE_EXPLANATION}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showWorksheetOption && (
                <div className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
                  <label className="flex cursor-pointer items-center gap-2">
                    <TopicalCheckbox
                      checked={worksheetEnabled}
                      onChange={() => onWorksheetToggle?.(!worksheetEnabled)}
                    />
                    <span>Worksheet Mode</span>
                  </label>

                  <div className="relative" ref={worksheetInfoRef}>
                    <button
                      type="button"
                      onClick={() => setWorksheetInfoOpen(prev => !prev)}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition-colors ${
                        worksheetInfoOpen
                          ? 'border-purple-400 bg-purple-50 text-purple-600 dark:border-purple-500 dark:bg-purple-500/10 dark:text-purple-300'
                          : 'border-gray-300 text-gray-500 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                      aria-label="What does worksheet mode do?"
                      aria-expanded={worksheetInfoOpen}
                    >
                      i
                    </button>

                    {worksheetInfoOpen && (
                      <div
                        role="tooltip"
                        className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-600 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <div className="absolute -top-1 right-1.5 h-2 w-2 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
                        {WORKSHEET_EXPLANATION}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showHeaderOptions && (
                <>
                  <div className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
                    <label className="flex cursor-pointer items-center gap-2">
                      <TopicalCheckbox
                        checked={headerPageEnabled}
                        onChange={() => onHeaderPageToggle?.(!headerPageEnabled)}
                      />
                      <span>Header page per question</span>
                    </label>

                    <div className="relative" ref={headerInfoRef}>
                      <button
                        type="button"
                        onClick={() => setHeaderInfoOpen(prev => !prev)}
                        className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] transition-colors ${
                          headerInfoOpen
                            ? 'border-purple-400 bg-purple-50 text-purple-600 dark:border-purple-500 dark:bg-purple-500/10 dark:text-purple-300'
                            : 'border-gray-300 text-gray-500 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                        aria-label="What does header page do?"
                        aria-expanded={headerInfoOpen}
                      >
                        i
                      </button>

                      {headerInfoOpen && (
                        <div
                          role="tooltip"
                          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-600 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        >
                          <div className="absolute -top-1 right-1.5 h-2 w-2 rotate-45 border-l border-t border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
                          {HEADER_PAGE_EXPLANATION}
                        </div>
                      )}
                    </div>
                  </div>


                  <div className="flex flex-col gap-1 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-200 ml-6 pt-1">
                    <label className={`flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 ${!headerPageEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                      <span>Header size</span>
                      <span>{headerSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="40"
                      step="1"
                      value={headerSize || 25}
                      onChange={(e) => onHeaderSizeChange?.(Number(e.target.value))}
                      disabled={!headerPageEnabled}
                      className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 ${!headerPageEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExportMenu;