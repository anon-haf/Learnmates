import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Bookmark, Plus, X, Pencil } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';

import {
  getTopicSlug,
  getTopicMetadata,
  curriculumData,
  type Topic,
} from '../utils/curriculumData';
import {
  FavoriteSubject,
  loadFavoriteSubjects,
  saveFavoriteSubjects,
  getSubjectPaths,
  hasTopicalsForSubject,
  getLevelKey,
} from '../utils/favoriteSubjects';
import { getSubjectIcon } from '../utils/subjectIcons';
import { updateStreakAndDays, StreakData, DayData } from '../utils/streakUtils';
import AddSubjectModal from '../components/AddSubjectModal';
import SubjectProgressBars from '../components/SubjectProgressBars';
import { useEngagementRevision } from '../hooks/useEngagementRevision';
import { getGroupedSubjectProgress } from '../utils/subjectProgressGroups';
import { topicData } from '../data/topicData';
import { fetchProfile, loadFavoriteSubjectsForUser, syncFavoriteSubjectsToDb } from '../utils/profileSync';
import { useRouteBase } from '../utils/routeBase';
import { Card, Button, Badge } from '@/components/ui';

const welcomeVariations = [
  'Welcome back',
  'Great to see you again',
  'Ready to learn',
  'Hey there',
  'Good to have you back',
  "Glad you're here",
  "Let's get started",
];

const motivationalMessages = [
  'Continue your learning journey with curated content, interactive quizzes, and personalized study paths.',
  "Ready to level up? Today's lessons are waiting just for you!",
  'Small progress is still progress. Keep going!',
  'Your next breakthrough is just one lesson away.',
  "Consistency beats intensity. Let's learn something new today!",
];

const getRandomWelcome = () => welcomeVariations[Math.floor(Math.random() * welcomeVariations.length)];
const getRandomMessage = () => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

const DashboardSubjectSkeleton = () => (
  <div className="flex flex-col gap-6">
    {[1, 2].map((item) => (
      <div
        key={item}
        className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-gray-800"
      >
        <div className="h-10 animate-pulse bg-slate-200 dark:bg-slate-700" />
        <div className="p-6">
          <div className="flex items-start gap-5">
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Dashboard: React.FC = () => {
  const { user, setUser } = useUser();
  const { user: authUser } = useAuth();
  useRouteBase();
  const [favoriteSubjects, setFavoriteSubjects] = useState<FavoriteSubject[]>([]);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [streakLoading, setStreakLoading] = useState(true);
  const [displayName, setDisplayName] = useState(user?.name ?? 'Student');
  const [randomWelcome] = useState(getRandomWelcome);
  const [randomMessage] = useState(getRandomMessage);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const engagementRevision = useEngagementRevision();

  useEffect(() => {
    if (!authUser) return;

    const init = async () => {
      setIsLoadingSubjects(true);
      try {
        const profile = await fetchProfile(authUser.id);
        const name =
          profile?.name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split('@')[0] ||
          'Student';

        setDisplayName(name);
        setUser({
          name,
          progress: user?.progress ?? {},
          recentCourses: user?.recentCourses ?? [],
        });

        const subjects = await loadFavoriteSubjectsForUser(authUser.id);
        setFavoriteSubjects(subjects.length > 0 ? subjects : loadFavoriteSubjects());
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  useEffect(() => {
    setStreakLoading(true);
    updateStreakAndDays()
      .then(({ streak, days }) => {
        setStreak(streak);
        setDayData(days);
      })
      .catch(console.error)
      .finally(() => setStreakLoading(false));
  }, []);

  useEffect(() => {
    const syncSubjects = () => setFavoriteSubjects(loadFavoriteSubjects());
    window.addEventListener('favoriteSubjectsUpdated', syncSubjects);
    return () => window.removeEventListener('favoriteSubjectsUpdated', syncSubjects);
  }, []);

  const getTopicsForFavorite = (fav: FavoriteSubject): Topic[] => {
    const levelKey = getLevelKey(fav.level);
    const curriculum = curriculumData[levelKey];
    if (!curriculum) return [];
    return curriculum.boards[fav.board]?.topics.filter((topic) => topic.subject === fav.subject) ?? [];
  };

  const getTopicResources = (topicId: string) => topicData[topicId]?.resources ?? [];

  const subjectProgressByKey = useMemo(() => {
    void engagementRevision;
    const map = new Map<string, ReturnType<typeof getGroupedSubjectProgress>>();
    for (const fav of favoriteSubjects) {
      const key = `${fav.level}|${fav.board}|${fav.subject}`;
      const topics = getTopicsForFavorite(fav);
      map.set(key, getGroupedSubjectProgress(topics, getTopicResources));
    }
    return map;
  }, [favoriteSubjects, engagementRevision]);

  const persistSubjects = useCallback(
    async (subjects: FavoriteSubject[]) => {
      setFavoriteSubjects(subjects);
      saveFavoriteSubjects(subjects);
      if (authUser) {
        await syncFavoriteSubjectsToDb(authUser.id, subjects);
      }
    },
    [authUser]
  );

  const handleRemoveSubject = useCallback(
    (subject: FavoriteSubject) => {
      const newSubjects = favoriteSubjects.filter(
        (s) => !(s.subject === subject.subject && s.level === subject.level && s.board === subject.board)
      );
      persistSubjects(newSubjects);
      if (newSubjects.length === 0) {
        setIsEditingSubjects(false);
      }
    },
    [favoriteSubjects, persistSubjects]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } },
  };

  return (
    <>
      <Helmet>
        <title>Learnmates | Dashboard</title>
        <meta
          name="description"
          content="Your personalized Learnmates learning dashboard for IGCSE and A-Level studies."
        />
      </Helmet>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div variants={itemVariants}>
              <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white">
                {randomWelcome},{' '}
                <span className="text-primary-600 dark:text-primary-400">
                  {displayName}
                </span>
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mt-4">{randomMessage}</p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">My Subjects</h2>
                <div className="flex items-center gap-3">
                  {favoriteSubjects.length > 0 && (
                    <Button
                      variant={isEditingSubjects ? 'primary' : 'ghost'}
                      size="icon"
                      onClick={() => setIsEditingSubjects((prev) => !prev)}
                      aria-label={isEditingSubjects ? 'Done editing subjects' : 'Edit subjects'}
                    >
                      <Pencil className="w-5 h-5" />
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => setShowAddSubjectModal(true)} leftIcon={<Plus className="w-5 h-5" />}>
                    Add Subject
                  </Button>
                </div>
              </div>

              {isLoadingSubjects ? (
                <DashboardSubjectSkeleton />
              ) : favoriteSubjects.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {favoriteSubjects.map((fav, index) => {
                    const paths = getSubjectPaths(fav);
                    const showTopicals = hasTopicalsForSubject(fav);
                    const progressKey = `${fav.level}|${fav.board}|${fav.subject}`;
                    const progressGroups = subjectProgressByKey.get(progressKey) ?? [];

                    return (
                      <motion.div
                        key={`${fav.board}-${fav.level}-${fav.subject}`}
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          variant="elevated"
                          padding="none"
                          className="overflow-hidden bg-white dark:bg-gray-800 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:border-2 hover:shadow-lg dark:hover:border-slate-600"
                        >
                          <div className="h-12 bg-blue-400 dark:bg-blue-900" />
                          <div className="p-6">
                            <div className="flex items-start gap-5">
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-primary-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-primary-400">
                                {getSubjectIcon(fav.subject, 'w-8 h-8')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                                  <span className="font-semibold text-neutral-900 dark:text-white text-2xl">
                                    {fav.subject}
                                  </span>
                                  <Badge variant="outline" size="sm">
                                    {fav.level}
                                  </Badge>
                                  <Badge variant="outline" size="sm">
                                    {fav.board}
                                  </Badge>
                                </div>
                                <SubjectProgressBars groups={progressGroups} compact />
                              </div>
                              {isEditingSubjects && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveSubject(fav)}
                                  aria-label={`Remove ${fav.subject}`}
                                >
                                  <X className="w-5 h-5" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-gray-800/50">
                            <Button
                              asChild
                              variant="ghost"
                              size="lg"
                              fullWidth
                              className="py-4 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 rounded-none transition-colors duration-200"
                            >
                              <Link to={paths.resources}>Resources</Link>
                            </Button>
                            {showTopicals && (
                              <>
                                <div className="w-px shrink-0 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="lg"
                                  fullWidth
                                  className="py-4 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 rounded-none transition-colors duration-200"
                                >
                                  <Link to={paths.topicals}>Topicals</Link>
                                </Button>
                              </>
                            )}
                            {showTopicals && (
                              <>
                                <div className="w-px shrink-0 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="lg"
                                  fullWidth
                                  className="py-4 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 rounded-none transition-colors duration-200"
                                >
                                  <Link to={paths.pastpapers}>Past Papers</Link>
                                </Button>
                              </>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card variant="outlined" padding="lg" className="text-center border-dashed">
                  <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-4">
                    No subjects added yet. Add your first subject to get started.
                  </p>
                  <Button variant="primary" onClick={() => setShowAddSubjectModal(true)} leftIcon={<Plus className="h-4 w-4" />}>
                    Add Subject
                  </Button>
                </Card>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            {streakLoading ? (
              <motion.div variants={itemVariants}>
                <Card variant="elevated" padding="lg" className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="animate-pulse space-y-3">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
                    <div className="h-6 w-8 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 35 }).map((_, i) => (
                          <div key={i} className="w-5 h-5 bg-slate-200 dark:bg-slate-800/50 rounded" />
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : streak && dayData.length > 0 ? (
              <motion.div variants={itemVariants}>
                <Card variant="elevated" padding="lg" className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="space-y-3 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-300 uppercase font-semibold mb-1">
                        Current Streak
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {streak.currentStreak}🔥
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg p-2 text-center bg-slate-100 dark:bg-slate-800/70">
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Best</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{streak.longestStreak}</p>
                      </div>
                      <div className="rounded-lg p-2 text-center bg-slate-100 dark:bg-slate-800/70">
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Visited</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                          {streak.visitedDates.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                      Last 30 Days
                    </h4>
                    <div className="grid grid-cols-7 gap-1">
                      {dayData.map((day, index) => (
                        <motion.div
                          key={day.date}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.01 }}
                          title={day.date}
                        >
                          <div
                            className={`w-5 h-5 rounded text-xs flex items-center justify-center font-semibold ${day.isVisited
                              ? 'bg-green-400 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-200 text-[0.6rem]'
                              }`}
                          >
                            {day.dayOfMonth}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : null}

            {user && user.recentCourses.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card variant="elevated" padding="lg" className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-5 flex items-center">
                    <Bookmark className="w-7 h-7 fill-slate-600 text-slate-600 dark:fill-slate-400 dark:text-slate-300 mr-2" />
                    Pick Up Where You Left Off
                  </h3>
                  <div className="space-y-2">
                    {user.recentCourses.slice(0, 3).map((course, index) => {
                      const metadata = getTopicMetadata(course.id);
                      const hasBoardAndSubject = course.board && course.subject;
                      const link = hasBoardAndSubject
                        ? `/curriculum/${course.type.toLowerCase()}/${course.board}/${course.subject}/${getTopicSlug({ title: course.title, group: course.group })}`
                        : `/topic/${course.id}`;

                      return (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 1, y: 10, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card variant="outlined" padding="lg" className="hover:border-slate-400 hover:border-4 hover:shadow-lg transition-all bg-slate-50 dark:bg-slate-900">
                            <div className="flex gap-3">
                              {course.subject && (
                                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center flex-shrink-0 text-slate-700 dark:text-slate-200">
                                  {getSubjectIcon(course.subject, 'w-7 h-7')}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mr-3">
                                    {course.title}
                                  </h4>
                                  {course.type && (
                                    <Badge variant="outline" size="xs" className="ml-2 flex-shrink-0 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700">
                                      {course.type}
                                    </Badge>
                                  )}
                                </div>
                                {metadata?.tags && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {metadata.tags.slice(0, 2).map((tag) => (
                                      <Badge key={tag.name} variant="outline" size="xs" className="text-[0.6rem] text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700">
                                        {tag.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                <Link
                                  to={link}
                                  className="inline-flex items-center text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-50 font-semibold text-xs"
                                >
                                  Continue
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      <AddSubjectModal
        isOpen={showAddSubjectModal}
        onClose={() => setShowAddSubjectModal(false)}
        favoriteSubjects={favoriteSubjects}
        onSubjectsChange={persistSubjects}
      />
    </>
  );
};

export default Dashboard;