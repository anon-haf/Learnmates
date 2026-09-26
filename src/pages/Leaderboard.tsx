import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Trophy, Medal, Crown, RefreshCw, Users, TrendingUp, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Card, Badge, Button } from '@/components/ui';

interface LeaderboardEntry {
  rank: number;
  username: string;
  name: string;
  avatar_url: string | null;
  total_xp: number;
  isCurrentUser: boolean;
}

interface LeaderboardResponse {
  period: 'all';
  leaderboard: LeaderboardEntry[];
  currentUser: {
    rank: number;
    total_xp: number;
    inTop: boolean;
    isPrivate?: boolean;
    username?: string | null;
    name?: string | null;
  } | null;
  totalUsers: number;
}

const MATE_LEVELS = [
  { name: 'Curious Mate', threshold: 0 },
  { name: 'Seeking Mate', threshold: 150 },
  { name: 'Discovering Mate', threshold: 350 },
  { name: 'Learning Mate', threshold: 650 },
  { name: 'Applying Mate', threshold: 1000 },
  { name: 'Mastering Mate', threshold: 1500 },
  { name: 'Absolute Mate', threshold: 2500 },
];

function getMateLevel(xp: number) {
  let idx = 0;
  MATE_LEVELS.forEach((lvl, i) => {
    if (xp >= lvl.threshold) idx = i;
  });
  return MATE_LEVELS[idx];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/70 to-amber-500/70 text-white shadow-md shadow-amber-500/20 ring-1 ring-amber-300">
        <Crown className="h-5 w-5" />
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 shadow-sm">
        <Medal className="h-5 w-5" />
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-700/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 shadow-sm">
        <Medal className="h-5 w-5" />
      </span>
    );
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl text-[20px] font-bold text-slate-600 dark:text-slate-300">
      {rank}
    </span>
  );
}

function PodiumSection({ top3 }: { top3: LeaderboardEntry[] }) {
  if (top3.length === 0) return null;

  const first = top3.find((e) => e.rank === 1);
  const second = top3.find((e) => e.rank === 2);
  const third = top3.find((e) => e.rank === 3);

  // 2nd place (left), 1st place (center), 3rd place (right)
  const slots = [
    { entry: second, rank: 2, height: 'h-24 sm:h-32 lg:h-36', label: '2nd' },
    { entry: first, rank: 1, height: 'h-32 sm:h-40 lg:h-48', label: '1st' },
    { entry: third, rank: 3, height: 'h-20 sm:h-24 lg:h-28', label: '3rd' },
  ];

  return (
    <div className="relative mx-auto mt-6 w-full max-w-4xl px-2">
      {/* Glow backdrop behind #1 */}
      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-500/10" />

      {/* Podium grid — always 3 side-by-side columns */}
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4 lg:gap-6">        {slots.map(({ entry, rank, height, label }) => {
        if (!entry) return <div key={rank} className="invisible" />;

        const isFirst = rank === 1;
        const isSecond = rank === 2;

        return (
          <div
            key={rank}
            className={`flex flex-col items-center transition-all duration-300 hover:-translate-y-1.5 ${isFirst ? 'z-10' : 'z-0'
              }`}
          >
            {/* Floating icon overhead */}
            <div className="mb-1 sm:mb-2 min-h-[28px] flex items-center justify-center">
              {isFirst ? (
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center"
                >
                  <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400 fill-amber-400 drop-shadow-[0_2px_4px_rgba(245,158,11,0.5)]" />
                </motion.div>
              ) : isSecond ? (
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 shadow-sm border border-slate-300 dark:border-slate-600">
                  <Medal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              ) : (
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shadow-sm border border-amber-300 dark:border-amber-800">
                  <Medal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              )}
            </div>

            {/* Avatar section */}
            <div className="relative mb-2 flex flex-col items-center">
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt={entry.username}
                  className={`object-cover rounded-full shadow-md transition-transform ${isFirst
                    ? 'h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 ring-4 ring-amber-400 dark:ring-amber-500 shadow-amber-500/20'
                    : isSecond
                      ? 'h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 ring-3 ring-slate-300 dark:ring-slate-600'
                      : 'h-12 w-12 sm:h-14 sm:w-14 lg:h-18 lg:w-18 ring-3 ring-amber-600/50 dark:ring-amber-700/60'
                    }`}
                />
              ) : (
                <div
                  className={`flex items-center justify-center rounded-full font-bold shadow-md ${isFirst
                    ? 'h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 bg-gradient-to-br from-amber-400 to-amber-500 text-white text-xl sm:text-2xl ring-4 ring-amber-300 shadow-amber-500/30'
                    : isSecond
                      ? 'h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-base sm:text-xl ring-3 ring-slate-300 dark:ring-slate-600'
                      : 'h-12 w-12 sm:h-14 sm:w-14 lg:h-18 lg:w-18 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 text-base sm:text-lg ring-3 ring-amber-600/50 dark:ring-amber-700/60'
                    }`}
                >
                  {(entry.name || entry.username || '?').charAt(0).toUpperCase()}
                </div>
              )}

              {/* You badge */}
              {entry.isCurrentUser && (
                <span className="absolute -bottom-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                  You
                </span>
              )}
            </div>

            {/* User details */}
            <div className="w-full text-center px-1 mb-2 min-w-0">
              <p className="truncate text-xs sm:text-sm lg:text-base font-bold text-slate-900 dark:text-white">
                {entry.isCurrentUser ? 'You' : `@${entry.username}`}
              </p>
              {entry.name && !entry.isCurrentUser && (
                <p className="truncate text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                  {entry.name}
                </p>
              )}
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span className="font-bold tabular-nums">{entry.total_xp.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400">XP</span>
              </div>
            </div>

            {/* Podium Base Pedestal Step */}
            <div
              className={`w-full rounded-t-2xl flex flex-col items-center justify-center shadow-lg transition-all ${height} ${isFirst
                ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-white shadow-amber-500/25 border-t-2 border-amber-200'
                : isSecond
                  ? 'bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 text-slate-700 dark:text-slate-200 border-t-2 border-slate-300 dark:border-slate-600'
                  : 'bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 dark:from-amber-900/80 dark:via-amber-950 dark:to-slate-900 text-amber-900 dark:text-amber-300 border-t-2 border-amber-300/60 dark:border-amber-700/60'
                }`}
            >
              <span className="text-2xl sm:text-4xl font-extrabold tracking-tight opacity-90 drop-shadow-sm">
                #{rank}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-75">
                {label}
              </span>
            </div>
          </div>
        );
      })}
      </div>

    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.45 } },
};

const Leaderboard: React.FC = () => {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`/api/xp/leaderboard?period=all&limit=50`, {
        cache: 'no-store',
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = (await res.json()) as LeaderboardResponse;
      setData(json);
    } catch (e) {
      console.error(e);
      setError('Could not load the leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBoard();
  }, [fetchBoard]);

  const top3 = data?.leaderboard.slice(0, 3) ?? [];
  const rest = data?.leaderboard.slice(3) ?? [];

  return (
    <>
      <Helmet>
        <title>Learnmates | Leaderboard</title>
        <meta name="description" content="See the top learners on Learnmates ranked by Mate Points (XP)." />
      </Helmet>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-6xl px-0 sm:px-2 py-8 sm:py-12"
      >
        {/* Header — matches Dashboard hero */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">

              Leaderboard
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1.5">

                Ranked by Mate Points (XP)
              </span>
              {data && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {data.totalUsers.toLocaleString()} learners
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => fetchBoard()}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all bg-blue-400 dark:bg-blue-900 text-white shadow-sm`}
              >
                All-time
              </button>
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => fetchBoard()}
              aria-label="Refresh leaderboard"
              className="shrink-0 border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </motion.div>

        {/* Private account notice */}
        {data?.currentUser?.isPrivate && (
          <motion.div variants={itemVariants} className="mt-8">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-5 py-3.5">
              <EyeOff className="h-5 w-5 text-slate-400 shrink-0" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your account is <span className="font-semibold">private</span> — you won't appear on the leaderboard for other users. You can change this in your{' '}
                <a href="/profile" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">profile settings</a>.
              </p>
            </div>
          </motion.div>
        )}

        {/* Your rank — Dashboard streak-card style */}
        {data?.currentUser && (
          <motion.div variants={itemVariants} className="mt-8">
            <Card
              variant="elevated"
              padding="none"
              className="overflow-hidden border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            >
              <div className="h-1.5 w-full bg-blue-400 dark:bg-blue-900" />
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white">
                    <span className="text-xl font-bold">#{data.currentUser.rank}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Your rank
                    </p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">#{data.currentUser.rank}</span>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        · {data.currentUser.total_xp.toLocaleString()} XP
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                        <TrendingUp className="h-3 w-3" /> {getMateLevel(data.currentUser.total_xp).name}
                      </span>
                    </p>
                  </div>
                </div>
                <Badge variant="primary" size="md" className="w-fit bg-blue-400 dark:bg-blue-900 text-white border-transparent">
                  {getMateLevel(data.currentUser.total_xp).name}
                </Badge>
              </div>
              <p className="border-t border-slate-200/70 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 px-5 py-2 text-[11px] leading-tight text-slate-400 dark:text-slate-500">
                *During beta, points are temporary and will reset before official release.
              </p>
            </Card>
          </motion.div>
        )}

        {/* Loading skeleton — matches Dashboard skeletons */}
        {loading ? (
          <motion.div variants={itemVariants} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 p-6 shadow-sm ${i === 2 ? 'sm:pb-10' : ''}`}
                >
                  <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
            <Card variant="elevated" padding="none" className="overflow-hidden">
              <div className="animate-pulse space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-2 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ) : error ? (
          <motion.div variants={itemVariants} className="mt-8">
            <Card padding="lg" className="text-center border-dashed">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => fetchBoard()} className="mt-3">
                Try again
              </Button>
            </Card>
          </motion.div>
        ) : !data || data.leaderboard.length === 0 ? (
          <motion.div variants={itemVariants} className="mt-8">
            <Card variant="outlined" padding="lg" className="text-center border-dashed">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Trophy className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">No rankings yet</p>
              <p className="mt-1 text-sm text-slate-500">
                No rankings yet. Earn XP by studying to appear here.
              </p>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Podium — side-by-side elevated 3D podium stage */}
            <motion.div variants={itemVariants} className="mt-6">
              <PodiumSection top3={top3} />
            </motion.div>

            {/* Rest of list — matches Dashboard card rows */}
            {rest.length > 0 && (
              <motion.div variants={itemVariants} className="mt-6">
                <Card
                  variant="elevated"
                  padding="none"
                  className="overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/20 px-4 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Rank 4 — {data.leaderboard.length}
                    </p>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{rest.length} learners</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rest.map((entry) => (
                      <div
                        key={entry.rank}
                        className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${entry.isCurrentUser ? 'bg-blue-50/70 dark:bg-blue-950/20' : ''
                          }`}
                      >
                        <span className="hidden sm:flex">
                          <RankBadge rank={entry.rank} />
                        </span>
                        <span className="flex sm:hidden h-9 w-9 items-center justify-center rounded-xl  text-[14px] font-bold text-slate-600 dark:text-slate-300">
                          {entry.rank}
                        </span>

                        {entry.avatar_url ? (
                          <img
                            src={entry.avatar_url}
                            alt={entry.username}
                            className="h-10 w-10 shrink-0 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                            {(entry.name || entry.username || '?').charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 truncate text-sm font-semibold text-slate-900 dark:text-white">
                            <span className="truncate">{entry.isCurrentUser ? 'You' : `@${entry.username}`}</span>
                            {entry.isCurrentUser && (
                              <Badge variant="primary" size="xs" className="bg-blue-400 dark:bg-blue-900 text-white">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {entry.name} · {getMateLevel(entry.total_xp).name}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                            {entry.total_xp.toLocaleString()}
                            <span className="ml-1 text-xs font-semibold text-slate-400">XP</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {data.currentUser && !data.currentUser.inTop && data.currentUser.username && (
              <motion.div variants={itemVariants} className="mt-4">
                <Card
                  variant="outlined"
                  padding="md"
                  className="border-dashed bg-slate-50/50 dark:bg-slate-900/30 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    You’re ranked <span className="font-bold text-slate-900 dark:text-white">#{data.currentUser.rank}</span> with{' '}
                    <span className="font-semibold">{data.currentUser.total_xp.toLocaleString()} XP</span> — keep studying to crack the top{' '}
                    {data.leaderboard.length}.
                  </p>
                  <Badge variant="outline" size="sm" className="mx-auto sm:mx-0 w-fit">
                    Keep pushing
                  </Badge>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </>
  );
};

export default Leaderboard;
