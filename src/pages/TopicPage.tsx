import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Play, FileText, Trophy, ArrowLeft, Plus } from 'lucide-react';
import { useUser } from '../context/UserContext';
import VideoPlayer from '../components/VideoPlayer';
import Resources from '../components/Resources';
import Quiz from '../components/Quiz';

const TopicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'videos' | 'resources' | 'quiz'>('videos');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  // Persistent checkmark state for videos/resources
  const [doneVideos, setDoneVideos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('doneVideos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [doneResources, setDoneResources] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('doneResources');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('doneVideos', JSON.stringify(doneVideos));
  }, [doneVideos]);
  useEffect(() => {
    localStorage.setItem('doneResources', JSON.stringify(doneResources));
  }, [doneResources]);

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  // Mock topic data
  const topicData = {
    'math-algebra-ed': {
      title: 'Algebra Fundamentals',
      subject: 'Mathematics',
      curriculum: 'IGCSE',
      description: 'Master the basics of algebraic expressions, equations, and problem-solving techniques essential for IGCSE Mathematics.',
      videos: [
        { id: 'v1', title: 'Introduction to Algebra', description: 'Learn what algebra is and how it differs from arithmetic.', englishUrl: 'https://www.youtube.com/watch?v=NybHckSEQBI', arabicUrl: 'https://www.youtube.com/watch?v=ZM8ECpBuQYE' },
        { id: 'v2', title: 'Solving Linear Equations', description: 'Step-by-step guide to solving linear equations.', englishUrl: 'https://www.youtube.com/watch?v=9RT_6wbVNvQ' }
      ],
      resources: [
        { id: 'r1', title: 'Algebra Formula Sheet', url: '/documents/1.pdf', description: 'Comprehensive collection of algebraic formulas and identities' },
        { id: 'r2', title: 'Practice Problems Set 1', url: 'https://drive.google.com/file/d/1EgW7OIMDVTBv6OBBvRwXbMjaXcg-j9CX/preview', description: '50 practice problems with solutions' }
      ],
      quizzes: [
        {
          id: 'quiz1',
          title: 'Basic Algebra Quiz',
          questions: [
            {
              id: 'q1',
              question: 'What is the value of x in 2x + 5 = 13?',
              options: ['x = 3', 'x = 4', 'x = 5', 'x = 6'],
              correctAnswer: 1,
              explanation: '2x + 5 = 13 → 2x = 8 → x = 4.',
              image: '/images/2.png'
            }
          ]
        },
        {
          id: 'quiz2',
          title: 'Algebra Expressions Quiz',
          questions: [
            {
              id: 'q2',
              question: 'Simplify: 3x + 2x - x',
              options: ['4x', '5x', '6x', '2x'],
              correctAnswer: 0,
              explanation: '3x + 2x - x = 4x.'
              // No image for this question
            }
          ]
        }
      ]
    },


    'chemistry-T1': {
      title: 'Formulae, Equations and Amount of Substance(U1)',
      subject: 'Chemistry',
      curriculum: 'A-level',
      description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
      videos: [],
      resources: [
        { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U1 topic 1 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
      ],
      quizzes: []
    },
    

    'chemistry-T2': {
      title: 'Atomic Structure and the Periodic Table(U1)',
      subject: 'Chemistry',
      curriculum: 'A-level',
      description: 'Explore the principles of atomic structure and the periodic table in chemistry.',
      videos: [],
      resources: [
        { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U1 topic 2 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
      ],
      quizzes: []
    },

    'chemistry-T3': {
      title: 'Formulae, Equations and Amount of Substance',
      subject: 'Chemistry',
      curriculum: 'A-level',
      description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
      videos: [],
      resources: [
        { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U1 topic 3 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
      ],
      quizzes: []
    },

    'chemistry-T4': {
      title: 'Formulae, Equations and Amount of Substance',
      subject: 'Chemistry',
      curriculum: 'A-level',
      description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
      videos: [],
      resources: [
        { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U1 topic 4 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
      ],
      quizzes: []
    },


        'chemistry-T5': {
      title: 'Formulae, Equations and Amount of Substance',
      subject: 'Chemistry',
      curriculum: 'A-level',
      description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
      videos: [],
      resources: [
        { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U1 topic 5 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
      ],
      quizzes: []
      },

        'chemistry-T6': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U2 topic 6 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T7': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U2 topic 7 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T8': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U2 topic 8 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T9': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U2 topic 9 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T10': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U2 topic 10 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T11': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U4 topic 11 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        // Test topic for new Quiz features (multi-part + written)
        'test-quiz': {
          title: 'Quiz Test Topic',
          subject: 'General',
          curriculum: 'Test',
          description: 'A topic to test multi-part and written question behavior.',
          videos: [],
          resources: [],
          quizzes: [
            {
              id: 'test-quiz-1',
              title: 'Multi-Part Question Demo',
              questions: [
                {
                  id: 'mq1',
                  title: 'Two-part question example',
                  parts: [
                    {
                      id: 'mq1-p1',
                      question: 'Which gas is produced when hydrochloric acid reacts with zinc?',
                      options: ['Oxygen', 'Hydrogen', 'Chlorine', 'Nitrogen'],
                      correctAnswer: 1,
                      explanation: 'Hydrochloric acid reacts with zinc to produce hydrogen gas and zinc chloride.' ,
                      type: 'mcq' as const,
                      image: '/images/2.png'
                    },
                    {
                      id: 'mq1-p2',
                      question: 'Write the balanced equation for the reaction between zinc and hydrochloric acid.',
                      correctAnswer: 'Zn + 2HCl -> ZnCl2 + H2',
                      explanation: 'Zn + 2HCl -> ZnCl2 + H2',
                      type: 'written' as const,
                      image: '/images/2.png'
                    }
                  ]
                }
              ]
            }
          ]
        },

        'chemistry-T12': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U4 topic 12 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T13': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U4 topic 13 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T14': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U4 topic 14 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T15': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U4 topic 15 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T16': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U5 topic 16 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T17': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U5 topic 17 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T18': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U5 topic 18 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T19': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U5 topic 19 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },

        'chemistry-T20': {
          title: 'Formulae, Equations and Amount of Substance',
          subject: 'Chemistry',
          curriculum: 'A-level',
          description: 'Explore the principles of chemical formulae, equations, and the concept of the mole in chemistry.',
          videos: [],
          resources: [
            { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U5 topic 20 Self-Study booklet(@Aeth_en).pdf', description: 'Author:(@Aeth_en) Visits:"https://drive.google.com/file/d/1i8whXNgZpwTswmblrk0PzHo6Fak1kvq6/view?usp=drive_link" for the original version of the booklet.' }
          ],
          quizzes: []
        },


  };

  const topic = topicData[id as keyof typeof topicData];
  const quizzes = topic?.quizzes || [];
  const progress = user?.progress?.[id!] || 0;

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Mathematics': 'from-blue-500 to-blue-600',
      'Physics': 'from-orange-500 to-orange-600',
      'Chemistry': 'from-green-500 to-green-600',
      'Biology': 'from-purple-500 to-purple-600',
      'English': 'from-pink-500 to-pink-600',
      'Computer Science': 'from-indigo-500 to-indigo-600'
    };
    return colors[subject] || 'from-gray-500 to-gray-600';
  };

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Topic Not Found</h1>
        <p className="text-xl text-gray-600 mb-8">The topic you're looking for doesn't exist.</p>
        <Link to="/curriculum" className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Curriculum
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6">
      {/* Logo and Site Title */}

      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center mb-6">
          <Link to={`/curriculum/${topic.curriculum.toLowerCase()}`} className="text-blue-600 hover:text-blue-700 font-medium mr-4 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {topic.curriculum}
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className={`bg-gradient-to-r ${getSubjectColor(topic.subject)} p-8 text-white`}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                {topic.curriculum} • {topic.subject}
              </span>
              {progress > 0 && (
                <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  {progress}% Complete
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">{topic.title}</h1>
            <p className="text-sm sm:text-base opacity-90 mb-4 sm:mb-6">{topic.description}</p>
            {progress > 0 && (
              <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
      {/* Navigation Tabs */}
      <motion.div variants={itemVariants} className="mb-8">
  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg max-w-md mx-auto text-xs sm:text-sm">
          {[
            { id: 'videos', label: 'Videos', icon: Play, count: topic.videos.length },
            { id: 'resources', label: 'Resources', icon: FileText, count: topic.resources.length },
            { id: 'quiz', label: 'Quiz', icon: Trophy, count: quizzes.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-2 py-2 sm:px-4 sm:py-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{tab.count}</span>
            </button>
          ))}
        </div>
      </motion.div>
      {/* Content Area */}
      <motion.div variants={itemVariants}>
        {activeTab === 'videos' && (
          <div className="space-y-4 sm:space-y-8">
            {topic.videos.length > 0 ? (
              topic.videos.map((video) => (
                <VideoPlayer
                  key={video.id}
                  title={video.title}
                  description={video.description}
                  englishUrl={video.englishUrl}
                  arabicUrl={video.arabicUrl}
                  done={doneVideos.includes(video.id)}
                  onToggleDone={() => setDoneVideos((prev) => prev.includes(video.id) ? prev.filter(id => id !== video.id) : [...prev, video.id])}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">No Videos Available</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Videos for this topic haven't been added yet. Help us grow by contributing content!</p>
                <Link to="/contribute" className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-base">
                  <Plus className="w-4 h-4 mr-2" />
                  Contribute Videos
                </Link>
              </div>
            )}
          </div>
        )}
        {activeTab === 'resources' && (
          <Resources
            resources={topic.resources}
            doneResources={doneResources}
            setDoneResources={setDoneResources}
          />
        )}
        {activeTab === 'quiz' && (
          <div>
            {!selectedQuizId ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 mb-6 sm:mb-8">
                {quizzes.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center col-span-1 sm:col-span-2">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-xl font-semibold text-gray-900 mb-2">No Quizzes Available</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">No quizzes have been added for this topic yet. Help us grow by contributing content!</p>
                    <Link to="/contribute" className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg text-xs sm:text-base">
                      Contribute Quizzes
                    </Link>
                  </div>
                ) : (
                  quizzes.map((quiz) => (
                    <button
                      key={quiz.id}
                      className="bg-white rounded-xl shadow-lg p-4 sm:p-8 text-center hover:scale-[1.03] transition-transform border border-gray-200 text-xs sm:text-base"
                      onClick={() => setSelectedQuizId(quiz.id)}
                    >
                      <Trophy className="w-8 h-8 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-base sm:text-xl font-bold text-gray-900 mb-2">{quiz.title}</h3>
                      <span className="text-gray-600 text-xs sm:text-sm">{quiz.questions.length} questions</span>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div>
                <button className="mb-4 sm:mb-6 text-blue-600 hover:underline text-base sm:text-lg font-medium" onClick={() => setSelectedQuizId(null)}>
                  ← Back to Quiz List
                </button>
                {(() => {
                  const quiz = quizzes.find((q) => q.id === selectedQuizId);
                  if (!quiz) return null;
                  return <Quiz questions={quiz.questions} title={quiz.title} quizId={quiz.id} />;
                })()}
              </div>
            )}
          </div>
        )}
      </motion.div>
      {/* Admin Notice */}
      {(topic.videos.length === 0 && topic.resources.length === 0 && quizzes.length === 0) && (
        <motion.div variants={itemVariants} className="mt-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-8 text-center">
            <BookOpen className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-base sm:text-xl font-semibold text-yellow-800 mb-2">Content Coming Soon</h3>
            <p className="text-xs sm:text-sm text-yellow-700 mb-4 sm:mb-6">This topic is being prepared. Check back soon for videos, resources, and quizzes!</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
              <Link to="/contribute" className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xs sm:text-base">
                <Plus className="w-4 h-4 mr-2" />
                Contribute Content
              </Link>
              <Link to="/contact" className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors text-xs sm:text-base">
                Request Content
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TopicPage;