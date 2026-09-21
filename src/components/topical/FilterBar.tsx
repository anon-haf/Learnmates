import React, { useState } from 'react';
import { btnPrimary, btnToggleBase, btnToggleActive, btnToggleInactive } from './ui';
import Dropdown from './Dropdown';
import { Filter } from 'lucide-react';
interface FilterBarProps {
  onLoad: () => void;
  isPaperMode: boolean;
  showMcqTheoryFilter?: boolean;

  // MCQ / Theory mode
  mcqFilter: 'all' | 'mcq' | 'theory';
  onMcqFilterChange: (filter: 'all' | 'mcq' | 'theory') => void;
  availableFilters: { hasMCQ: boolean; hasTheory: boolean };

  // Paper mode
  availablePaperNumbers: number[];
  paperFilter: Set<number>;
  isAllPapersSelected: boolean;
  selectedPaperSummary: string;
  onTogglePaper: (paperNum: number | 'all') => void;

  // Year mode
  availableYears: number[];
  yearFilter: Set<number>;
  isAllYearsSelected: boolean;
  selectedYearSummary: string;
  onToggleYear: (year: number | 'all') => void;

  // Strict mode: only questions covering exclusively the selected topics
  strict?: boolean;
  onStrictChange?: (strict: boolean) => void;

  // Order & Limit
  orderFilter?: 'newest' | 'oldest' | 'random';
  onOrderFilterChange?: (order: 'newest' | 'oldest' | 'random') => void;
  limitFilter?: string;
  onLimitFilterChange?: (limit: string) => void;

  // Month mode
  availableMonths?: string[];
  monthFilter?: Set<string>;
  isAllMonthsSelected?: boolean;
  selectedMonthSummary?: string;
  onToggleMonth?: (month: string | 'all') => void;

  // Variant mode
  availableVariants?: number[];
  variantFilter?: Set<number>;
  isAllVariantsSelected?: boolean;
  selectedVariantSummary?: string;
  onToggleVariant?: (variant: number | 'all') => void;

  hasSelectedTopics?: boolean;
}

const McqTheoryToggle: React.FC<{
  mcqFilter: 'all' | 'mcq' | 'theory';
  onChange: (f: 'all' | 'mcq' | 'theory') => void;
  availableFilters: { hasMCQ: boolean; hasTheory: boolean };
}> = ({ mcqFilter, onChange, availableFilters }) => {
  const options: { key: 'all' | 'mcq' | 'theory'; label: string; disabled?: boolean }[] = [
    { key: 'all', label: 'All' },
    { key: 'mcq', label: 'MCQ', disabled: !availableFilters.hasMCQ },
    { key: 'theory', label: 'Theory', disabled: !availableFilters.hasTheory },
  ];

  return (
    <div className="inline-flex" role="group" aria-label="Filter by MCQ or theory">
      {options.map(opt => (
        <button
          key={opt.key}
          type="button"
          disabled={opt.disabled}
          onClick={() => onChange(opt.key)}
          className={`${btnToggleBase} ${mcqFilter === opt.key ? btnToggleActive : btnToggleInactive}`}
          title={opt.disabled ? `No ${opt.label.toLowerCase()} questions in current selection` : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const StrictToggle: React.FC<{
  strict: boolean;
  onChange: (strict: boolean) => void;
}> = ({ strict, onChange }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!strict)}
      className={`${btnToggleBase} ${strict ? btnToggleActive : btnToggleInactive} rounded-lg`}
      title="Strict mode: only show questions that cover exclusively the selected topics"
    >
      Strict
    </button>
  );
};

const FilterBar: React.FC<FilterBarProps> = ({
  onLoad,
  isPaperMode,
  showMcqTheoryFilter = true,
  mcqFilter,
  onMcqFilterChange,
  availableFilters,
  availablePaperNumbers,
  paperFilter,
  isAllPapersSelected,
  selectedPaperSummary,
  onTogglePaper,
  availableYears,
  yearFilter,
  isAllYearsSelected,
  selectedYearSummary,
  onToggleYear,
  strict,
  onStrictChange,
  orderFilter,
  onOrderFilterChange,
  limitFilter,
  onLimitFilterChange,
  availableMonths,
  monthFilter,
  isAllMonthsSelected,
  selectedMonthSummary,
  onToggleMonth,
  availableVariants,
  variantFilter,
  isAllVariantsSelected,
  selectedVariantSummary,
  onToggleVariant,
  hasSelectedTopics,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const hasAdvancedFilters = Boolean(onToggleMonth || onToggleVariant);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
      <button className={btnPrimary} onClick={onLoad}>
          Load matching questions
        </button>

      {isPaperMode ? (
        <Dropdown
          multi
          showAllOption
          buttonLabel={selectedPaperSummary}
          allSelected={isAllPapersSelected}
          onToggleAll={() => onTogglePaper('all')}
          options={availablePaperNumbers.map(n => ({ value: n, label: `P${n}` }))}
          selected={paperFilter}
          onToggle={n => onTogglePaper(Number(n))}
          className="max-w-[220px]"
          title="Filter matches by paper"
        />
      ) : showMcqTheoryFilter ? (
        <McqTheoryToggle mcqFilter={mcqFilter} onChange={onMcqFilterChange} availableFilters={availableFilters} />
      ) : null}

      <Dropdown
        multi
        showAllOption
        buttonLabel={selectedYearSummary}
        allSelected={isAllYearsSelected}
        onToggleAll={() => onToggleYear('all')}
        options={availableYears.map(year => ({ value: year, label: String(year) }))}
        selected={yearFilter}
        onToggle={year => onToggleYear(Number(year))}
        className="max-w-[220px]"
        disabled={availableYears.length === 0}
        title={
          yearFilter.size > 0
            ? `Filter matches by year (${availableYears.filter(y => yearFilter.has(y)).sort((a, b) => a - b).join(', ')})`
            : 'Filter matches by year'
        }
      />

      {onOrderFilterChange && (
        <Dropdown
          buttonLabel={
            orderFilter === 'oldest'
              ? 'Old → new'
              : orderFilter === 'random'
                ? 'Random / shuffle'
                : 'New → old'
          }
          options={[
            { value: 'newest', label: 'New → old' },
            { value: 'oldest', label: 'Old → new' },
            { value: 'random', label: 'Random / shuffle' },
          ]}
          selectedValue={orderFilter || 'newest'}
          onSelect={value => onOrderFilterChange(value as 'newest' | 'oldest' | 'random')}
          className="min-w-[140px]"
          title="Order of matching questions"
        />
      )}

      {onLimitFilterChange && (
        <input
          type="number"
          min="1"
          placeholder="Max questions"
          className="h-9 w-32 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 placeholder:text-gray-400 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500 dark:hover:border-gray-600"
          value={limitFilter}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || (Number(val) >= 1 && !val.includes('-'))) {
              onLimitFilterChange(val);
            }
          }}
          title="Leave empty to show all matches"
        />
      )}

      {onStrictChange && (
        <StrictToggle
          strict={strict || false}
          onChange={onStrictChange}
        />
      )}

      {hasAdvancedFilters && (
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`${btnToggleBase} ${showAdvanced ? btnToggleActive : btnToggleInactive} rounded-lg flex items-center gap-1.5`}
          title="Toggle advanced filters"
        >
          <Filter className="w-4 h-4" />
          Advanced
        </button>
      )}
      </div>

      {showAdvanced && hasAdvancedFilters && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {!hasSelectedTopics ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              Please choose a topic first to see available months and variants.
            </div>
          ) : (
            <>
              {onToggleMonth && availableMonths && availableMonths.length > 0 && (
                <Dropdown
                  multi
                  showAllOption
                  buttonLabel={selectedMonthSummary || 'Months'}
                  allSelected={isAllMonthsSelected || false}
                  onToggleAll={() => onToggleMonth('all')}
                  options={availableMonths.map(m => ({ value: m, label: m }))}
                  selected={monthFilter || new Set()}
                  onToggle={m => onToggleMonth(m as string)}
                  className="max-w-[220px]"
                  title={
                    (monthFilter && monthFilter.size > 0)
                      ? `Filter matches by month (${availableMonths.filter(m => monthFilter.has(m)).join(', ')})`
                      : 'Filter matches by month'
                  }
                />
              )}

              {onToggleVariant && availableVariants && availableVariants.length > 0 && (
                <Dropdown
                  multi
                  showAllOption
                  buttonLabel={selectedVariantSummary || 'Variants'}
                  allSelected={isAllVariantsSelected || false}
                  onToggleAll={() => onToggleVariant('all')}
                  options={availableVariants.map(v => ({ value: v, label: `Variant ${v}` }))}
                  selected={variantFilter || new Set()}
                  onToggle={v => onToggleVariant(Number(v))}
                  className="max-w-[220px]"
                  title={
                    (variantFilter && variantFilter.size > 0)
                      ? `Filter matches by variant (${availableVariants.filter(v => variantFilter.has(v)).sort((a, b) => a - b).join(', ')})`
                      : 'Filter matches by variant'
                  }
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
