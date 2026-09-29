import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  mcqOffColors,
  mcqOnColors,
  mcqOptionClassName,
  mcqOptionState,
  mcqToggleBase,
  mcqToggleSize,
  type McqSurface,
} from './mcqCheckerStyles';

export interface McqOptionButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  option: string;
  answer?: string | null;
  selected: boolean;
  showAnswer?: boolean;
  surface?: McqSurface;
}

export const McqOptionButton: React.FC<McqOptionButtonProps> = ({
  option,
  answer,
  selected,
  showAnswer = false,
  surface = 'themed',
  className,
  ...props
}) => (
  <button
    type="button"
    className={twMerge(
      clsx(mcqOptionClassName(mcqOptionState(option, answer, selected, showAnswer), surface), className)
    )}
    {...props}
  >
    {option}
  </button>
);

export interface McqLiveCheckToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  enabled: boolean;
  surface?: McqSurface;
  compact?: boolean;
  label?: React.ReactNode;
}

export const McqLiveCheckToggle: React.FC<McqLiveCheckToggleProps> = ({
  enabled,
  surface = 'themed',
  compact = false,
  label,
  className,
  ...props
}) => (
  <button
    type="button"
    className={twMerge(
      clsx(
        mcqToggleBase,
        mcqToggleSize[compact ? 'sm' : 'md'],
        enabled ? mcqOnColors : mcqOffColors[surface]
      ),
      className
    )}
    {...props}
  >
    {label ?? (compact ? (enabled ? 'Live: On' : 'Live: Off') : enabled ? 'Live check: On' : 'Live check: Off')}
  </button>
);

export interface McqCheckerHeaderProps {
  title?: string;
  subtitle?: string | null;
  surface?: McqSurface;
  compact?: boolean;
  enabled: boolean;
  onToggle: () => void;
  className?: string;
}

export const McqCheckerHeader: React.FC<McqCheckerHeaderProps> = ({
  title = 'MCQ Checker',
  subtitle = 'Choose A–D below.',
  surface = 'themed',
  compact = false,
  enabled,
  onToggle,
  className,
}) => (
  <div className={twMerge(clsx('flex items-start justify-between gap-2', className))}>
    <div className={clsx('flex flex-col', compact ? 'gap-1' : 'gap-0.5')}>
      <h3
        className={
          surface === 'dark'
            ? 'text-sm font-semibold text-gray-200'
            : 'text-sm font-semibold text-gray-900 dark:text-gray-100'
        }
      >
        {title}
      </h3>
      {subtitle ? (
        <p
          className={
            compact
              ? 'text-[10px] lg:text-xs text-gray-400'
              : 'text-xs text-gray-500 dark:text-gray-400'
          }
        >
          {subtitle}
        </p>
      ) : null}
    </div>
    <McqLiveCheckToggle
      enabled={enabled}
      surface={surface}
      compact={compact}
      onClick={onToggle}
      className={compact ? undefined : 'mt-0.5'}
    />
  </div>
);
