import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, BookOpen, CheckCircle, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchProfile } from '../utils/profileSync';
import { Card, Button, Badge } from '@/components/ui';
import NibrasIcon from '../assets/logos/nibras_icon.svg?react';

const Home: React.FC = () => {
  const { user: authUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || !authUser) return;

    const redirectIfComplete = async () => {
      const profile = await fetchProfile(authUser.id);
      if (profile?.username && profile?.profile_complete) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    };

    redirectIfComplete();
  }, [authUser, authLoading, navigate]);

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
      },
    }),
    []
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.6 },
      },
    }),
    []
  );

  if (authLoading || authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <NibrasIcon className="h-7 w-7" />,
      title: 'Fastest Topical Questions',
      description: 'Generate the fastest topical questions for free instantly to test your knowledge on specific subjects.',
    },
    {
      icon: <Users className="h-7 w-7" />,
      title: 'Community Curated Notes',
      description: 'Access high-quality resources and notes built and curated by other successful students.',
    },
    {
      icon: <CheckCircle className="h-7 w-7" />,
      title: 'Progress Tracking',
      description: 'Keep track of your learning journey, maintain streaks, and monitor your improvement over time.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Helmet>
        <title>Learnmates | Free IGCSE and A-Level Learning Resources</title>
        <meta
          name="description"
          content="Learnmates provides free, curriculum-aligned IGCSE and A-Level resources, quizzes, videos, and study tools."
        />
        <meta name="keywords" content="Learnmates, IGCSE, A-Level, education, learning resources" />
      </Helmet>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 w-full"
      >
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-900 dark:via-blue-800 dark:to-slate-900">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full opacity-10 blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full opacity-5 blur-3xl translate-y-1/2 translate-x-1/2"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
            <motion.section variants={itemVariants} className="text-center max-w-4xl mx-auto">
              <h1 className="mt-7 text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
                Meet{' '}
                <span className="text-blue-200">
                  Learnmates
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-blue-50">
                Learnmates is a free learning platform that helps IGCSE and A-Level students understand difficult topics,
                practise with confidence, and keep their learning journey organised.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild variant="primary" className="bg-white text-blue-700 hover:bg-blue-50 dark:bg-white dark:text-blue-800 dark:hover:bg-blue-100">
                  <Link to="/login" className="flex items-center gap-2">
                    Start your journey
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" asChild variant="outline" className="border-white text-white hover:bg-white/10 dark:hover:bg-white/10 dark:border-white dark:text-white">
                  <Link to="/curriculum" className="flex items-center">
                    Explore curriculum
                  </Link>
                </Button>
              </div>
            </motion.section>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.section variants={itemVariants} className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} variant="elevated" padding="lg">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  {feature.icon}
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h2>
                <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">{feature.description}</p>
              </Card>
            ))}
          </motion.section>

          <motion.p variants={itemVariants} className="mt-16 text-center text-sm text-slate-500 dark:text-slate-400">
            Learn more about our mission and resources on the{' '}
            <Link to="/about" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
              About Learnmates
            </Link>{' '}
            page.
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;