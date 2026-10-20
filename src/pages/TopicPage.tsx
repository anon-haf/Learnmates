import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Play, FileText, Trophy, ArrowLeft, LayoutGrid, List } from 'lucide-react';
import { useUser } from '../context/UserContext';
import VideoPlayer from '../components/VideoPlayer';
import Resources, { ResourcesViewMode } from '../components/Resources';
import Quiz from '../components/Quiz';
import { loadQuizFromFolderProgressive, Quiz as QuizType, Question, countQuestionsInFolder } from '../utils/quizLoader';
import { getTopicSlug } from '../utils/curriculumData';
import { topicData } from '../data/topicData';
import { resolveTopicKeyFromParams } from '../utils/curriculumTopicResolver';
import { PdfViewerBasePath } from '../utils/pdfViewerPaths';
import { DoneItem, isDoneItem, videoDoneUrl } from '../utils/doneItems';
import { useEngagement } from '../context/EngagementContext';
import { useRouteBase, withBase } from '../utils/routeBase';
import { Card, Badge, Button } from '@/components/ui';


const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.45 } }
};

const TopicPage: React.FC = () => {
  const base = useRouteBase();
  const curriculumPath = (...parts: string[]) => withBase(base, `/curriculum/${parts.join('/')}`);
  const { type: typeParam, board: boardParam, subject: subjectParam, title: titleParam } = useParams<{ type?: string; board?: string; subject?: string; title?: string }>();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'videos' | 'resources' | 'quiz'>('resources');

  const { doneVideos, doneResources, toggleDoneVideo, toggleDoneResource } = useEngagement();

  const [resourcesViewMode, setResourcesViewMode] = useState<ResourcesViewMode>(() => {
    try {
      const saved = localStorage.getItem('resourcesViewMode');
      return saved === 'grid' ? 'grid' : 'list';
    } catch {
      return 'list';
    }
  });
  useEffect(() => {
    localStorage.setItem('resourcesViewMode', resourcesViewMode);
  }, [resourcesViewMode]);

  const [loadedQuizzes, setLoadedQuizzes] = useState<Map<string, QuizType>>(new Map());
  const [, setLoadingQuizzes] = useState<Map<string, boolean>>(new Map());
  const [questionCounts, setQuestionCounts] = useState<Map<string, number>>(new Map());
  const [singleFileQuizzes, setSingleFileQuizzes] = useState<Map<string, QuizType>>(new Map());
  const countingRef = useRef<Set<string>>(new Set());

  const topicKey = resolveTopicKeyFromParams(topicData, titleParam, subjectParam);
  const topic = topicKey ? topicData[topicKey] : null;

  const loadQuizLazy = async (config: { folderPath: string; title: string }): Promise<Question[]> => {
    const cacheKey = config.folderPath;
    
    if (loadedQuizzes.has(cacheKey)) {
      const cached = loadedQuizzes.get(cacheKey);
      return cached?.questions || [];
    }
    
    setLoadingQuizzes(prev => new Map(prev).set(cacheKey, true));
    
    try {
      console.log(`[Quiz Loader] Starting to load quiz from: ${config.folderPath}`);
      const tempQuizId = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      let callbackCount = 0;
      
      const { quiz: partialQuiz, continueLoading } = await loadQuizFromFolderProgressive(
        config.folderPath,
        config.title,
        (question) => {
          callbackCount++;
          console.log(`[Quiz Loader] Callback fired #${callbackCount} for question: ${question.id}`);
          setLoadedQuizzes(prev => {
            const existing = prev.get(cacheKey);
            if (existing) {
              if (!existing.questions.find(q => q.id === question.id)) {
                const updated = { ...existing, questions: [...existing.questions, question], isLoading: true };
                console.log(`[Quiz Loader] Updated quiz: ${updated.questions.length} questions total`);
                return new Map(prev).set(cacheKey, updated);
              }
              return prev;
            } else {
              const newQuiz: QuizType = {
                id: tempQuizId,
                title: config.title,
                questions: [question],
                isLoading: true
              };
              console.log(`[Quiz Loader] Created new quiz with first question: ${question.id}`);
              return new Map(prev).set(cacheKey, newQuiz);
            }
          });
        },
        4000
      );

      console.log(`[Quiz Loader] Partial quiz received: ${partialQuiz.questions.length} questions, isLoading: ${partialQuiz.isLoading}`);
      console.log(`[Quiz Loader] Callback was called ${callbackCount} times before timeout`);

      setLoadedQuizzes(prev => new Map(prev).set(cacheKey, partialQuiz));
      if (partialQuiz.questions.length > 0) {
        setLoadingQuizzes(prev => new Map(prev).set(cacheKey, false));
      }

      continueLoading.then((completeQuiz) => {
        console.log(`[Quiz Loader] continueLoading resolved with ${completeQuiz.questions.length} questions`);
        setLoadedQuizzes(prev => {
          const existing = prev.get(cacheKey);
          const finalQuestions = existing && existing.questions.length > completeQuiz.questions.length 
            ? existing.questions 
            : completeQuiz.questions;
          const finalQuiz: QuizType = { 
            ...completeQuiz, 
            questions: finalQuestions,
            isLoading: false 
          };
          console.log(`[Quiz Loader] Final quiz has ${finalQuiz.questions.length} questions, isLoading: false`);
          return new Map(prev).set(cacheKey, finalQuiz);
        });
        setLoadingQuizzes(prev => new Map(prev).set(cacheKey, false));
      }).catch((error) => {
        console.error('[Quiz Loader] Error completing quiz load:', error);
        setLoadedQuizzes(prev => {
          const existing = prev.get(cacheKey);
          if (existing) {
            return new Map(prev).set(cacheKey, { ...existing, isLoading: false });
          }
          return prev;
        });
        setLoadingQuizzes(prev => new Map(prev).set(cacheKey, false));
      });

      return partialQuiz.questions;
    } catch (error) {
      console.error('Failed to load quiz:', error);
      setLoadingQuizzes(prev => new Map(prev).set(cacheKey, false));
      return [];
    }
  };

  useEffect(() => {
    if (topic?.quizzes) {
      topic.quizzes.forEach((config: { folderPath?: string; questionFile?: string; markSchemeFile?: string; title: string }) => {
        if (config.questionFile !== undefined) {
          const cacheKey = `${config.questionFile}_${config.markSchemeFile || ''}`;
          if (!singleFileQuizzes.has(cacheKey)) {
            import('../utils/quizLoader').then(({ createSingleFileQuiz }) => {
              createSingleFileQuiz(
                config.questionFile!,
                config.markSchemeFile,
                config.title
              ).then(quiz => {
                setSingleFileQuizzes(prev => new Map(prev).set(cacheKey, quiz));
              }).catch(err => {
                console.error('Failed to create single-file quiz:', err);
              });
            });
          }
          return;
        }
        if (!config.folderPath) {
          return;
        }
        const cacheKey = config.folderPath;
        if (!countingRef.current.has(cacheKey)) {
          setQuestionCounts(prevCounts => {
            setLoadedQuizzes(prevLoaded => {
              if (!prevCounts.has(cacheKey) && !prevLoaded.has(cacheKey)) {
                countingRef.current.add(cacheKey);
                countQuestionsInFolder(cacheKey).then(count => {
                  setQuestionCounts(p => new Map(p).set(cacheKey, count));
                }).catch(err => {
                  console.error('Failed to count questions:', err);
                  countingRef.current.delete(cacheKey);
                });
              }
              return prevLoaded;
            });
            return prevCounts;
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic?.quizzes]);

  const quizzes = topic?.quizzes ? topic.quizzes.map((config, idx: number) => {
    const isSingleFile = config.questionFile !== undefined;
    const cacheKey = isSingleFile ? `${config.questionFile}_${config.markSchemeFile || ''}` : config.folderPath!;
    
    if (isSingleFile) {
      const quiz = singleFileQuizzes.get(cacheKey);
      return {
        id: `quiz-${idx}-${cacheKey}`,
        title: config.title,
        questions: quiz?.questions || [],
        folderPath: undefined,
        loadQuiz: async () => quiz?.questions || [],
        isLoading: !quiz,
        questionCount: 1
      };
    } else {
      const cached = loadedQuizzes.get(config.folderPath!);
      const count = questionCounts.get(config.folderPath!);
      return {
        id: `quiz-${idx}-${config.folderPath}`,
        title: config.title,
        questions: cached?.questions || [],
        folderPath: config.folderPath,
        loadQuiz: () => loadQuizLazy(config as { folderPath: string; title: string }),
        isLoading: cached?.isLoading || false,
        questionCount: count
      };
    }
  }) : [];
  const progress = topicKey ? user?.progress?.[topicKey] || 0 : 0;

  const routeType = typeParam ? typeParam.toLowerCase() : (typeof topic?.curriculum === 'string' && topic.curriculum.toLowerCase().includes('igcse') ? 'igcse' : 'a-level');
  const routeBoard = boardParam || 'cambridge';
  const topicSlug = topic ? getTopicSlug({ title: topic.title, group: topic.group }) : '';
  const canonicalPath = topic ? curriculumPath(routeType, routeBoard, encodeURIComponent(topic.subject || ''), topicSlug) : '';

  const [pageMeta, setPageMeta] = useState<any | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/metadata.json');
        if (!res.ok) return;
        const data = await res.json();
        const topicsMap = (data?.topics ?? {}) as Record<string, any>;
        const meta = topicsMap[canonicalPath] || Object.values(topicsMap).find((t: any) => t.url === canonicalPath);
        if (mounted) setPageMeta(meta || null);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [canonicalPath]);

  const pdfViewerBasePath: PdfViewerBasePath = {
    type: routeType,
    board: routeBoard,
    subject: topic?.subject || '',
    topicSlug,
  };

  useEffect(() => {
    const availableTabs = [
      { id: 'videos' as const, count: topic?.videos.length || 0 },
      { id: 'resources' as const, count: topic?.resources.length || 0 },
      { id: 'quiz' as const, count: quizzes.length || 0 }
    ].filter(tab => tab.count > 0);

    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [topic?.videos.length, topic?.resources.length, quizzes.length, activeTab]);

  if (!topic) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">Topic Not Found</h1>
        <p className="text-base text-neutral-600 dark:text-neutral-30 mb-6">We couldn't find that topic. Try another from the curriculum.</p>
        <Link to={curriculumPath()} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Curriculum
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>{pageMeta?.title || `${topic.title} — ${topic.subject} | Learnmates`}</title>
        <meta name="description" content={pageMeta?.description || topic.description} />
        <meta name="keywords" content={pageMeta?.keywords || `Learnmates, free study materials, video lessons, practice quizzes, ${topic.title}, ${routeBoard || ''}, ${topic.subject}, ${routeType}`} />
        <meta property="og:title" content={pageMeta?.title || `${topic.title} — ${topic.subject} | Learnmates`} />
        <meta property="og:description" content={pageMeta?.description || topic.description} />
        <link rel="canonical" href={`https://www.learnmates.org${pageMeta?.url || canonicalPath}`} />
      </Helmet>
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            to={curriculumPath(routeType, routeBoard || 'cambridge', encodeURIComponent(topic.subject))}
            state={{ focusTopicId: topicKey }}
            className="text-primary-600 hover:text-primary-700 font-medium mr-4 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {topic.subject}
          </Link>
        </div>

        <Card variant="elevated" padding="none" className="overflow-hidden">
          <div className={`bg-gradient-to-r ${topic.color || 'from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-800'} p-8 text-white`}>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const seen: Record<string, boolean> = {};
                  const badgeNodes: React.ReactNode[] = [];

                  if (topic.group && !seen[topic.group]) {
                    seen[topic.group] = true;
                    badgeNodes.push(
                      <Badge key={topic.group} variant="outline" size="lg" className="bg-primary-100 dark:bg-primary-900  text-gray-800 dark:text-white">
                        {topic.group}
                      </Badge>
                    );
                  }

                  if (topic.tags) {
                    topic.tags.forEach((tag) => {
                      if (!tag.name || seen[tag.name]) return;
                      seen[tag.name] = true;
                      badgeNodes.push(
                        <Badge key={tag.name} variant="primary" size="sm" className=" text-gray-800 dark:text-white">
                          {tag.name}
                        </Badge>
                      );
                    });
                  }

                  return badgeNodes;
                })()}
              </div>
              {progress > 0 && (
                <span className="text-sm font-medium bg-white dark:bg-neutral-800 bg-opacity-20 px-3 py-1 rounded-full">{progress}% Complete</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-gray-800 dark:text-white">{topic.title}</h1>
            <p className="text-sm sm:text-base opacity-90 mb-4 sm:mb-6  text-gray-800 dark:text-white">{topic.description}</p>
            {progress > 0 && (
              <div className="w-full bg-white dark:bg-gray-800 bg-opacity-20 rounded-full h-2">
                <div className="bg-gray-200 dark:bg-gray-800 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div />
          <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg text-xs sm:text-sm">
            {[
              { id: 'videos', label: 'Videos', icon: Play, count: topic.videos.length },
              { id: 'resources', label: 'Resources', icon: FileText, count: topic.resources.length },
              { id: 'quiz', label: 'Quiz', icon: Trophy, count: quizzes.length }
            ].filter(tab => tab.count > 0).map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                size="sm"
                className="gap-1"
                onClick={() => setActiveTab(tab.id as 'videos' | 'resources' | 'quiz')}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <Badge variant={activeTab === tab.id ? 'default' : 'ghost'} size="xs" className="ml-1">
                  {tab.count}
                </Badge>
              </Button>
            ))}
          </div>
          <div className="flex justify-end">
            {activeTab === 'resources' && topic.resources.length > 0 && (
              <div className="flex items-center bg-gray-200 dark:bg-gray-700 p-1 rounded-lg text-xs sm:text-sm">
                <Button
                  variant={resourcesViewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setResourcesViewMode('list')}
                  leftIcon={<List className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">List</span>
                </Button>
                <Button
                  variant={resourcesViewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setResourcesViewMode('grid')}
                  leftIcon={<LayoutGrid className="w-4 h-4" />}
                >
                  <span className="hidden sm:inline">Grid</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {topic.videos.length === 0 ? (
              <Card variant="elevated" padding="lg" className="text-center">
                No video lessons for this topic yet.
              </Card>
            ) : (
              topic.videos.map((v: any) => {
                const videoUrl = videoDoneUrl(v);
                return (
                  <VideoPlayer
                    key={`${v.id}:${videoUrl}`}
                    title={v.title}
                    description={v.description ?? ''}
                    englishUrl={v.englishUrl}
                    arabicUrl={v.arabicUrl}
                    done={isDoneItem(doneVideos, v.id, videoUrl)}
                    onToggleDone={() => toggleDoneVideo(v.id, videoUrl)}
                  />
                );
              })
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <Resources
            resources={topic.resources}
            topicId={topicKey}
            doneResources={doneResources}
            toggleDoneResource={toggleDoneResource}
            viewMode={resourcesViewMode}
            pdfViewerBasePath={pdfViewerBasePath}
          />
        )}

        {activeTab === 'quiz' && (
          <Quiz quizzes={quizzes} />
        )}
      </motion.div>
    </motion.div>
  );
};

export default TopicPage;