import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Play, FileText, Trophy, ArrowRight, Clock } from 'lucide-react';
import { useUser } from '../context/UserContext';

const CurriculumPage: React.FC = () => {
  // Remove useParams, use local state for selection flow
  const { user, addRecentCourse } = useUser();
  // Curriculum level is passed via router
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Mock data - now supports board differentiation
  type BoardKey = 'cambridge' | 'edexcel';
  type Topic = {
    id: string;
    title: string;
    description: string;
    subject: string;
    videoCount: number;
    resourceCount: number;
    quizCount: number;

  };
  type Curriculum = {
    title: string;
    fullName: string;
    description: string;
    boards: Record<BoardKey, { topics: Topic[] }>;
  };
  const curriculumData: Record<string, Curriculum> = {
    'igcse': {
      title: 'IGCSE',
      fullName: 'International General Certificate of Secondary Education',
      description: 'Master your IGCSE subjects with our comprehensive collection of video lessons, resources, and interactive quizzes.',
      boards: {
        cambridge: {
          topics: [
            { id: 'chemistry-4', title: 'Electrochemistry', description: 'Explore the principles of electrochemistry, including redox reactions and Hydrogen fuel cells.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-5', title: 'Chemical energetics', description: 'Explore the principles of chemical energetics, including enthalpy changes and reaction spontaneity.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-6', title: 'Chemical reactions', description: 'Explore the principles of chemical reactions, including redox reactions and Hydrogen fuel cells.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-7', title: 'Acids, bases and salts', description: 'Explore the principles of acids, bases and salts, including pH, neutralization and titration.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-8', title: 'The periodic table', description: 'Explore the principles of the periodic table, including group properties and periodic trends.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-9', title: 'Metals', description: 'Explore the principles of metals and their extraction, including reactivity series and extraction methods.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-10', title: 'Chemistry of the environment', description: 'Explore the principles of air and water, including composition, pollution and treatment methods.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-11', title: 'Organic chemistry', description: 'Explore the principles of organic chemistry, including hydrocarbons, functional groups and polymers.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            


            { id: 'biology-1', title: 'Characteristics and Classifications of living organisms', description: 'Explore the characteristics and classifications of living organisms, including the five kingdoms and their features.', subject: 'Biology', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'biology-4', title: 'Biological Molecules', description: 'Discover the key biological molecules, including carbohydrates, proteins, lipids. And testing for them.', subject: 'Biology', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'biology-5', title: 'Enzymes', description: 'Explore the role of enzymes in biological processes, including their structure, function, and factors affecting enzyme activity.', subject: 'Biology', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'biology-6', title: 'Plant Nutrition', description: 'Investigate the process of photosynthesis and the factors affecting plant growth and nutrition.', subject: 'Biology', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'biology-7', title: 'Human Nutrition', description: 'Examine the components of a balanced diet and the role of nutrients in human health.', subject: 'Biology', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'biology-8', title: 'Transport in Plants', description: 'Explore the process of transport in plants, including xylem and phloem.', subject: 'Biology', videoCount: 0, resourceCount: 1, quizCount: 0 },
          ]
        },
        edexcel: {
          topics: [
          ]
        }
      }
    },
    'a-level': {
      title: 'A-Level',
      fullName: 'Advanced Level',
      description: 'Excel in your A-Level studies with advanced content designed for university preparation.',
      boards: {
        cambridge: {
          topics: [
            
          ]

        },
        edexcel: {
          topics: [
            { id: 'chemistry-T1', title: 'Formulae, Equations and Amount of Substance (U1)', description: 'Understand chemical formulae, writing and balancing equations, and the mole concept for quantitative chemistry.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T2', title: 'Atomic Structure and the Periodic Table (U1)', description: 'Explore atomic models, electronic structure, isotopes, and trends across the periodic table.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T3', title: 'Bonding and Structure (U1)', description: 'Learn ionic, covalent and metallic bonding, molecular shapes, and how bonding relates to properties.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T4', title: 'Introductory Organic Chemistry and Alkanes (U1)', description: 'Introduction to organic nomenclature, structure and properties of alkanes and simple reaction types.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T5', title: 'Alkenes (U1)', description: 'Study structure, reactions and mechanisms of alkenes including addition reactions and polymerisation.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            
            { id: 'chemistry-T6', title: 'Energetics, Group Chemistry, Halogenoalkanes and Alcohols (U2)', description: 'Covers energy changes in reactions, group trends, and the chemistry of halogenoalkanes and alcohols.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T7', title: 'Intermolecular Forces (U2)', description: 'Examine van der Waals, dipole-dipole and hydrogen bonding and their effect on physical properties.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T8', title: 'Redox Chemistry and Groups 1, 2 and 7 (U2)', description: 'Learn oxidation states, redox reactions and the chemistry of key periodic groups.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T9', title: 'Introduction to Kinetics and Equilibria (U2)', description: 'Understand reaction rates, collision theory and the principles of chemical equilibrium.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T10', title: 'Organic Chemistry: Halogenoalkanes, Alcohols and Spectra (U2)', description: 'Explore reaction mechanisms, spectroscopic identification and the behaviour of halogenoalkanes and alcohols.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            
            { id: 'chemistry-T11', title: 'Rates, Equilibria and Further Organic Chemistry (U4)', description: 'Advanced kinetics and equilibria topics plus extended organic chemistry concepts for A-level study.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T12', title: 'Entropy and Energetics (U4)', description: 'Thermodynamics topics including enthalpy, entropy and spontaneity of reactions.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T13', title: 'Chemical Equilibria (U4)', description: 'In-depth study of equilibrium constants, Le Chatelier’s principle and calculations involving equilibria.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T14', title: 'Acid-base Equilibria (U4)', description: 'Acid-base theories, pH calculations, buffers and titration curves for weak/strong acids and bases.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T15', title: 'Organic Chemistry: Carbonyls, Carboxylic Acids and Chirality (U4)', description: 'Study carbonyl compounds, carboxylic acids, derivatives and stereochemistry.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            
            { id: 'chemistry-T16', title: 'Transition Metals and Organic Nitrogen Chemistry (U5)', description: 'Explore the chemistry of transition metals and nitrogen-containing organic molecules.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T17', title: 'Transition Metals and their Chemistry (U5)', description: 'Key properties, complex formation and reactions of transition metals.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T18', title: 'Organic Chemistry – Arenes (U5)', description: 'Aromatic chemistry including electrophilic substitution and properties of arenes.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T19', title: 'Organic Nitrogen Compounds: Amines, Amides, Amino Acids and Proteins (U5)', description: 'Structure, properties and reactions of amines, amides and biologically relevant nitrogen compounds.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            { id: 'chemistry-T20', title: 'Organic Synthesis (U5)', description: 'Strategies and mechanisms for multi-step organic synthesis and functional group interconversions.', subject: 'Chemistry', videoCount: 0, resourceCount: 1, quizCount: 0 },
            // Add more Edexcel-specific topics as needed
          ]
        }
      }
    }
  };

  // Determine selected level from the URL param (e.g. /curriculum/igcse or /curriculum/a-level)
  const params = useParams<{ type?: string; board?: string; subject?: string }>();
  const typeParam = params.type ? params.type.toLowerCase() : undefined;
  const boardParam = params.board ? params.board.toLowerCase() : undefined;
  const subjectParam = params.subject ? decodeURIComponent(params.subject) : undefined;
  const availableLevels = Object.keys(curriculumData);
  const selectedLevel = typeParam && availableLevels.includes(typeParam) ? typeParam : 'igcse';
  const curriculum = curriculumData[selectedLevel as keyof typeof curriculumData];
  const navigate = useNavigate();

  // sync selectedBoard state from URL param
  useEffect(() => {
    if (boardParam === 'cambridge' || boardParam === 'edexcel') {
      setSelectedBoard(boardParam);
    } else {
      setSelectedBoard(null);
    }
  }, [boardParam]);

  // sync subject from URL param
  useEffect(() => {
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    } else {
      setSelectedSubject(null);
    }
  }, [subjectParam]);

  const boardTopics: Topic[] = (curriculum && selectedBoard && (selectedBoard === 'cambridge' || selectedBoard === 'edexcel'))
    ? curriculum.boards[selectedBoard as BoardKey]?.topics || []
    : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectColor = (subject: string) => {
    const colors = {
      'Mathematics': 'from-blue-500 to-blue-600',
      'Physics': 'from-orange-500 to-orange-600',
      'Chemistry': 'from-green-500 to-green-600',
      'Biology': 'from-purple-500 to-purple-600',
      'English': 'from-pink-500 to-pink-600',
      'Computer Science': 'from-indigo-500 to-indigo-600',
      'Further Mathematics': 'from-teal-500 to-teal-600'
    };
    return colors[subject as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  // ...removed curriculum level selection UI...

  // Step 1: Select Board (neater modern card UI)
  if (!selectedBoard) {
    return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Select Your Exam Board</h1>
      <p className="text-base text-gray-500 mb-8">Choose a board to see tailored subjects and topics.</p>
        <div className="flex flex-col sm:flex-row gap-8 w-full justify-center">
          <button
            className="flex-1 rounded-2xl shadow-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white px-8 py-10 text-2xl font-semibold hover:scale-[1.04] transition-transform focus:outline-none focus:ring-4 focus:ring-purple-300 group"
            onClick={() => navigate(`/curriculum/${selectedLevel}/cambridge`)}
          >
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-white opacity-80 group-hover:opacity-100" />
            </div>
            <span className="block mb-2 text-3xl font-bold">Cambridge</span>
            <span className="block text-base opacity-80">International Examinations</span>
          </button>
          <button
            className="flex-1 rounded-2xl shadow-lg bg-gradient-to-br from-pink-500 to-orange-500 text-white px-8 py-10 text-2xl font-semibold hover:scale-[1.04] transition-transform focus:outline-none focus:ring-4 focus:ring-pink-300 group"
            onClick={() => navigate(`/curriculum/${selectedLevel}/edexcel`)}
          >
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-white opacity-80 group-hover:opacity-100" />
            </div>
            <span className="block mb-2 text-3xl font-bold">Edexcel</span>
            <span className="block text-base opacity-80">Edexcel Board</span>
          </button>
        </div>
        <div className="mt-12">
          <Link to="/curriculum" className="inline-flex items-center text-blue-600 hover:underline text-lg font-medium">
            <ArrowRight className="w-5 h-5 mr-2" /> Back to Curriculum
          </Link>
        </div>
      </div>
    );
  }

  // Step 2: Select Subject (rows, random colors)
  if (!selectedSubject) {
    if (!curriculum || !selectedBoard) return null;
    const subjects: string[] = Array.from(new Set(boardTopics.map((t: Topic) => t.subject)));
    // Assign a specific gradient to each subject
    const subjectColorMap: Record<string, string> = {
      'Mathematics': 'from-blue-500 to-blue-600',
      'Physics': 'from-orange-500 to-orange-600',
      'Chemistry': 'from-green-500 to-green-600',
      'Biology': 'from-purple-500 to-purple-600',
      'English': 'from-pink-500 to-pink-600',
      'Computer Science': 'from-indigo-500 to-indigo-600',
      'Further Mathematics': 'from-teal-500 to-teal-600',
      'Advanced Mathematics': 'from-cyan-500 to-blue-500',
      'Essay Writing Skills': 'from-pink-400 to-pink-600',
      'Programming Fundamentals': 'from-indigo-400 to-indigo-600',
      'Cell Biology': 'from-purple-400 to-purple-600',
      'Atomic Structure': 'from-green-400 to-green-600',
      'Mechanics and Motion': 'from-orange-400 to-orange-600',
      'Algebra Fundamentals': 'from-blue-400 to-blue-600',
      'Matrix Mathematics': 'from-teal-400 to-teal-600',
      'Genetics and Evolution': 'from-purple-500 to-pink-500',
      'Organic Chemistry': 'from-green-500 to-teal-500',
      'Calculus and Analysis': 'from-blue-500 to-cyan-500',
      'Waves and Oscillations': 'from-orange-500 to-yellow-500',
      // Edexcel board subjects
      'Algebra (Edexcel)': 'from-blue-500 to-blue-700',
      'Mechanics (Edexcel)': 'from-orange-500 to-orange-700',
      'Calculus (Edexcel)': 'from-cyan-500 to-blue-700',
      'Waves (Edexcel)': 'from-yellow-500 to-orange-700',
    };
    const subjectColors: Record<string, string> = {};
    subjects.forEach((subject) => {
      subjectColors[subject] = subjectColorMap[subject] || 'from-gray-500 to-gray-700';
    });
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Select a Subject</h1>
        <p className="text-base text-gray-500 mb-8">Pick a subject to view topics and start learning.</p>
        <div
          className={
            subjects.length === 1
              ? "w-full flex justify-center"
              : subjects.length === 2
                ? "w-full grid grid-cols-2 gap-8 justify-center"
                : "w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-center"
          }
        >
          {subjects.map((subject: string) => (
            <button
              key={subject}
              className={`flex flex-col items-center justify-center rounded-2xl shadow-lg bg-gradient-to-br ${subjectColors[subject]} text-white px-6 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14 hover:scale-[1.04] transition-transform focus:outline-none focus:ring-4 focus:ring-blue-300 group`}
              onClick={() => navigate(`/curriculum/${selectedLevel}/${selectedBoard}/${encodeURIComponent(subject)}`)}
            >
              <div className="flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white opacity-80 group-hover:opacity-100" />
              </div>
              <span
                className="block mb-2 font-bold text-base sm:text-lg lg:text-xl text-center break-words whitespace-normal leading-tight max-w-xs"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                title={subject}
              >
                {subject}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-12">
          <button
            className="inline-flex items-center text-purple-600 hover:underline text-lg font-medium"
            onClick={() => setSelectedBoard(null)}
          >
            <ArrowRight className="w-5 h-5 mr-2" /> Back to Board Selection
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Show topics for selected subject
  if (!curriculum || !selectedBoard) return null;
  const subjectTopics: Topic[] = boardTopics.filter((t: Topic) => t.subject === selectedSubject);
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-16">
        <div className="flex items-center justify-center mb-6">
          <button
            className="text-blue-600 hover:text-blue-700 font-medium mr-4"
            onClick={() => setSelectedSubject(null)}
          >
            ← Back to Subjects
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {curriculum.title} — {selectedSubject} Topics
        </h1>
        <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {curriculum.description}
        </p>
        <div className="mt-4 text-lg text-gray-700">Board: <span className="font-semibold">{selectedBoard}</span></div>
      </motion.div>

      {/* Stats */}
      <motion.section variants={itemVariants} className="mb-16">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{subjectTopics.length}</div>
              <div className="text-gray-600">Topics Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-600 mb-2">
                {subjectTopics.reduce((sum: number, topic: Topic) => sum + topic.videoCount, 0)}
              </div>
              <div className="text-gray-600">Video Lessons</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {subjectTopics.reduce((sum: number, topic: Topic) => sum + topic.resourceCount, 0)}
              </div>
              <div className="text-gray-600">Resources</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {subjectTopics.reduce((sum: number, topic: Topic) => sum + topic.quizCount, 0)}
              </div>
              <div className="text-gray-600">Interactive Quizzes</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Topics Grid */}
      <motion.section variants={itemVariants}>
        <h2 className="text-3xl font-bold text-gray-900 mb-12">Available Topics</h2>
        <div className="grid lg:grid-cols-2 gap-8">
          {subjectTopics.map((topic: Topic, index: number) => {
            const progress = user?.progress[topic.id] || 0;
            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden group"
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${getSubjectColor(topic.subject)} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">
                      {topic.subject}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{topic.title}</h3>
                  <p className="text-sm opacity-90">{topic.description}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Progress Bar */}
                  {progress > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${getSubjectColor(topic.subject)} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                    <div className="flex flex-col items-center">
                      <Play className="w-5 h-5 text-red-500 mb-1" />
                      <span className="text-sm font-medium text-gray-900">{topic.videoCount}</span>
                      <span className="text-xs text-gray-600">Videos</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <FileText className="w-5 h-5 text-blue-500 mb-1" />
                      <span className="text-sm font-medium text-gray-900">{topic.resourceCount}</span>
                      <span className="text-xs text-gray-600">Resources</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Trophy className="w-5 h-5 text-yellow-500 mb-1" />
                      <span className="text-sm font-medium text-gray-900">{topic.quizCount}</span>
                      <span className="text-xs text-gray-600">Quizzes</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    to={`/topic/${topic.id}`}
                    onClick={() => {
                      if (user) {
                        addRecentCourse({
                          id: topic.id,
                          title: topic.title,
                          progress: progress,
                          type: curriculum.title
                        });
                      }
                    }}
                    className={`block w-full text-center py-3 px-6 bg-gradient-to-r ${getSubjectColor(topic.subject)} text-white rounded-lg hover:shadow-md transition-all duration-200 group-hover:scale-105 font-medium`}
                  >
                    <span className="flex items-center justify-center">
                      {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section variants={itemVariants} className="mt-16 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-12 text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to excel in {curriculum.title}?</h2>
          <p className="text-base mb-6 opacity-90 max-w-2xl mx-auto">
            Start with any topic that interests you, or follow the structured path for best results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {subjectTopics.length > 0 && (
              <Link
                to={`/topic/${subjectTopics[0].id}`}
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-lg"
              >
                Start with First Topic
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
            <Link
              to="/contribute"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-medium"
            >
              Contribute Content
            </Link>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default CurriculumPage;
