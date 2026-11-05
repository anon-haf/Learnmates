import React from 'react';
import type { NibrasUsage } from '../hooks/useNibrasUsage';

interface NibrasUsageIndicatorProps {
  usage: NibrasUsage | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  compact?: boolean;
}

const NibrasUsageIndicator: React.FC<NibrasUsageIndicatorProps> = ({
  usage,
  loading,
  error,
  onRetry,
  compact = false,
}) => (
  <div className={`flex items-center justify-center gap-1.5 text-center text-xs text-gray-500 dark:text-gray-400 ${compact ? 'mt-2' : 'mt-1.5'}`}>
    {loading ? (
      <span role="status">Loading daily AI usage…</span>
    ) : error ? (
      <>
        <span role="status">AI usage unavailable.</span>
        <button type="button" onClick={onRetry} className="font-medium text-blue-600 underline dark:text-blue-400">
          Retry
        </button>
      </>
    ) : usage?.exempt ? (
      <span>Tester account · unlimited AI requests</span>
    ) : usage && usage.used !== undefined && usage.limit !== undefined && usage.remaining !== undefined ? (
      <span>
        Today: {usage.used} of {usage.limit} Nibras requests used · {usage.remaining} left
        {!compact && ' · resets at midnight UTC'}
      </span>
    ) : null}
  </div>
);

export default NibrasUsageIndicator;
