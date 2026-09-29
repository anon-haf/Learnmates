// Shared colour tokens for every "MCQ Checker" panel in the app
// (TopicalQuiz, PaperViewer, MediaViewer - light cards and always-dark viewers).
//
// Colour rules kept identical everywhere:
//   - light view: lighter fill with a darker border
//   - dark view: darker fill with a lighter border
//   - hues: grey = your pick, green = correct, red = wrong, purple = live check
//   - light view uses the pale tint of the hue (300) with a deep outline (700);
//     dark view keeps the solid fill (700) with a lighter outline (500)

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type McqSurface = 'themed' | 'dark';
export type McqOptionState = 'idle' | 'selected' | 'correct' | 'wrong';

export const mcqOnColors =
  'border-purple-500 bg-purple-600 text-white hover:bg-purple-700';

export const mcqOffColors: Record<McqSurface, string> = {
  themed:
    'border-gray-300 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
  dark: 'border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:border-gray-500',
};

const OPTION_SHAPE =
  'border-2 rounded-full uppercase font-bold flex items-center justify-center transition-colors duration-200';

const OPTION_IDLE: Record<McqSurface, string> = {
  themed:
    'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:border-gray-500',
  dark: 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:border-gray-500',
};

const OPTION_FILLED: Record<Exclude<McqOptionState, 'idle'>, Record<McqSurface, string>> = {
  // grey = your pick
  selected: {
    themed:
      'border-gray-700 bg-gray-300 text-gray-900 hover:bg-gray-400 hover:border-gray-800 ' +
      'dark:border-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500',
    dark: 'border-gray-400 bg-gray-700 text-white hover:bg-gray-600 hover:border-gray-300',
  },
  // green = correct
  correct: {
    themed:
      'border-green-700 bg-green-300 text-green-900 hover:bg-green-400 hover:border-green-800 ' +
      'dark:border-green-500 dark:bg-green-700 dark:text-white dark:hover:bg-green-600',
    dark: 'border-green-500 bg-green-700 text-white hover:bg-green-600 hover:border-green-400',
  },
  // red = wrong
  wrong: {
    themed:
      'border-red-700 bg-red-300 text-red-900 hover:bg-red-400 hover:border-red-800 ' +
      'dark:border-red-500 dark:bg-red-700 dark:text-white dark:hover:bg-red-600',
    dark: 'border-red-500 bg-red-700 text-white hover:bg-red-600 hover:border-red-400',
  },
};

export function mcqOptionState(
  option: string,
  answer: string | null | undefined,
  selected: boolean,
  showAnswer: boolean
): McqOptionState {
  if (showAnswer && answer) {
    if (option === answer) return 'correct';
    if (selected) return 'wrong';
    return 'idle';
  }
  return selected ? 'selected' : 'idle';
}

export function mcqOptionClassName(
  state: McqOptionState,
  surface: McqSurface = 'themed'
): string {
  return twMerge(
    clsx(OPTION_SHAPE, state === 'idle' ? OPTION_IDLE[surface] : OPTION_FILLED[state][surface])
  );
}

export const mcqToggleBase =
  'inline-flex items-center justify-center rounded-md border-2 transition-colors shrink-0';

export const mcqToggleSize: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-1 lg:px-2.5 lg:py-1.5 text-[10px] lg:text-xs font-medium',
  md: 'px-3 py-1.5 text-xs sm:text-sm font-semibold',
};
