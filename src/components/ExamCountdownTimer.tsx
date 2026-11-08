import React, { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';

interface ExamCountdownState {
  remainingMs: number;
  startedAt: number | null;
  error: string | null;
}

interface ExamCountdownTimerProps {
  durationSeconds: number;
  storageKey: string;
  largeView?: boolean;
}

const readExamCountdown = (storageKey: string, durationSeconds: number): ExamCountdownState => {
  const initialState = { remainingMs: durationSeconds * 1000, startedAt: null, error: null };

  try {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return initialState;

    const parsed: unknown = JSON.parse(stored);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('durationSeconds' in parsed) ||
      typeof parsed.durationSeconds !== 'number' ||
      !Number.isFinite(parsed.durationSeconds) ||
      !('remainingMs' in parsed) ||
      typeof parsed.remainingMs !== 'number' ||
      !Number.isFinite(parsed.remainingMs) ||
      parsed.remainingMs < 0 ||
      parsed.remainingMs > parsed.durationSeconds * 1000 ||
      !('startedAt' in parsed) ||
      (parsed.startedAt !== null &&
        (typeof parsed.startedAt !== 'number' || !Number.isFinite(parsed.startedAt)))
    ) {
      throw new Error('Saved timer data is invalid.');
    }
    if (parsed.durationSeconds !== durationSeconds) return initialState;

    const now = Date.now();
    const remainingMs = parsed.startedAt === null
      ? parsed.remainingMs
      : Math.max(0, parsed.remainingMs - Math.max(0, now - parsed.startedAt));
    return {
      remainingMs,
      startedAt: remainingMs > 0 && parsed.startedAt !== null ? now : null,
      error: null,
    };
  } catch (error) {
    console.error('Could not load the past-paper timer from session storage:', error);
    return {
      ...initialState,
      error: 'Timer data could not be loaded for this browser session.',
    };
  }
};

const formatCountdown = (milliseconds: number): string => {
  const totalTenths = Math.ceil(milliseconds / 100);
  const totalSeconds = Math.floor(totalTenths / 10);
  const tenths = totalTenths % 10;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${time}.${tenths}`;
};

const ExamCountdownTimer: React.FC<ExamCountdownTimerProps> = ({
  durationSeconds,
  storageKey,
  largeView = false,
}) => {
  const [timerState, setTimerState] = useState<ExamCountdownState>(
    () => readExamCountdown(storageKey, durationSeconds)
  );
  const [now, setNow] = useState(() => Date.now());
  const displayedRemainingMs = Math.max(
    0,
    timerState.remainingMs - (timerState.startedAt === null ? 0 : now - timerState.startedAt)
  );

  useEffect(() => {
    const startedAt = timerState.startedAt;
    if (startedAt === null) return;

    const intervalId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= startedAt + timerState.remainingMs) {
        setTimerState(previous => ({ ...previous, remainingMs: 0, startedAt: null }));
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [timerState.remainingMs, timerState.startedAt]);

  useEffect(() => {
    if (timerState.error) return;

    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          durationSeconds,
          remainingMs: timerState.remainingMs,
          startedAt: timerState.startedAt,
        })
      );
    } catch (error) {
      console.error('Could not save the past-paper timer to session storage:', error);
      setTimerState(previous => ({
        ...previous,
        error: 'Timer data could not be saved for this browser session.',
      }));
    }
  }, [durationSeconds, storageKey, timerState.error, timerState.remainingMs, timerState.startedAt]);

  const toggleTimer = () => {
    const currentTime = Date.now();
    setNow(currentTime);
    setTimerState(previous => {
      if (previous.startedAt !== null) {
        return {
          ...previous,
          remainingMs: Math.max(0, previous.remainingMs - Math.max(0, currentTime - previous.startedAt)),
          startedAt: null,
        };
      }
      if (previous.remainingMs <= 0) return previous;
      return { ...previous, startedAt: currentTime };
    });
  };

  const resetTimer = () => {
    setNow(Date.now());
    setTimerState(previous => ({
      ...previous,
      remainingMs: durationSeconds * 1000,
      startedAt: null,
    }));
  };

  const isRunning = timerState.startedAt !== null && displayedRemainingMs > 0;
  const timerSurface = largeView
    ? 'border-gray-600 bg-gray-800 text-gray-100'
    : 'border-gray-300 bg-white text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

  return (
    <div
      role="group"
      className={`inline-flex max-w-full items-center gap-1 rounded-lg border px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2 ${timerSurface}`}
      aria-label="Exam countdown"
      title="Preset uses the current official syllabus duration; older paper formats may differ."
    >
      <Timer className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-300 sm:h-5 sm:w-5" aria-hidden="true" />
      <div className="flex flex-col leading-tight">
        <span
          className={`font-mono text-sm font-bold tabular-nums sm:text-lg ${
            displayedRemainingMs === 0 ? 'text-red-600 dark:text-red-400' : ''
          }`}
          aria-label={`Time remaining ${formatCountdown(displayedRemainingMs)}`}
        >
          {formatCountdown(displayedRemainingMs)}
        </span>
      </div>
      <button
        type="button"
        onClick={toggleTimer}
        disabled={displayedRemainingMs === 0 && !isRunning}
        aria-label={isRunning ? 'Pause exam timer' : 'Start exam timer'}
        title={isRunning ? 'Pause timer' : 'Start timer'}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isRunning
            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60'
            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/60'
        }`}
      >
        {isRunning
          ? <Pause className="h-4 w-4" aria-hidden="true" />
          : <Play className="h-4 w-4" aria-hidden="true" />}
        <span className="hidden sm:inline">{isRunning ? 'Pause' : 'Start'}</span>
      </button>
      <button
        type="button"
        onClick={resetTimer}
        aria-label="Reset exam timer"
        title="Reset timer"
        className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
      </button>
      {timerState.error && (
        <span role="alert" title={timerState.error} className="text-[10px] font-medium text-red-600 dark:text-red-400">
          Not saved
        </span>
      )}
    </div>
  );
};

export default ExamCountdownTimer;
