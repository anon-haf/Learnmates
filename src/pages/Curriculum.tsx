import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, GraduationCap, Award } from 'lucide-react';

const Curriculum: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
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

  const curriculums = [
    {
      id: 'igcse',
      title: 'IGCSE',
      fullName: 'International General Certificate of Secondary Education',
      description: 'Comprehensive resources for IGCSE subjects, designed to help students aged 14-16 excel in their examinations.',
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      icon: <BookOpen className="w-12 h-12" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100'
    },
    {
      id: 'a-level',
      title: 'A-Level',
      fullName: 'Advanced Level',
      description: 'Advanced study materials for A-Level students aged 16-18, preparing them for university and beyond.',
      subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      icon: <GraduationCap className="w-12 h-12" />,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'from-teal-50 to-teal-100'
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center mb-16">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <Award className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Choose Your <span className="text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">Curriculum</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Select the curriculum that matches your educational path. Each program offers comprehensive resources, 
          interactive content, and structured learning paths designed for success.
        </p>
      </motion.div>

      {/* Curriculum Cards */}
      <motion.section variants={itemVariants} className="mb-16">
        <div className="grid lg:grid-cols-2 gap-8">
          {curriculums.map((curriculum, index) => (
            <motion.div
              key={curriculum.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.2 }}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
                {/* Header */}
                <div className={`bg-gradient-to-r ${curriculum.bgColor} p-8`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${curriculum.color} rounded-xl flex items-center justify-center text-white`}>
                      {curriculum.icon}
                    </div>
                    <div className="text-right">
                      <h2 className="text-3xl font-bold text-gray-900">{curriculum.title}</h2>
                      <p className="text-sm text-gray-600">{curriculum.fullName}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{curriculum.description}</p>
                </div>

                {/* Content */}
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Available Subjects</h3>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {curriculum.subjects.map((subject, subIndex) => (
                      <div
                        key={subIndex}
                        className="flex items-center space-x-2 text-gray-700"
                      >
                        <div className={`w-4 h-1.5 bg-gradient-to-r ${curriculum.color} rounded-full`}></div>
                        <span className="text-lg">{subject}</span>
                      </div>
                    ))}
                  </div>


                  {/* CTA Button */}
                  <Link
                    to={`/curriculum/${curriculum.id}`}
                    className={`block w-full text-center py-4 px-6 bg-gradient-to-r ${curriculum.color} text-white rounded-xl hover:shadow-lg transition-all duration-200 group-hover:scale-105 font-medium`}
                  >
                    <span className="flex items-center justify-center">
                      Explore {curriculum.title}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section variants={itemVariants} className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What You'll Get</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <BookOpen className="w-8 h-8" />,
              title: "Comprehensive Content",
              description: "Complete coverage of all curriculum topics with detailed explanations and examples.",
              color: "from-blue-500 to-blue-600"
            },
            {
              icon: <Award className="w-8 h-8" />,
              title: "Interactive Quizzes",
              description: "Test your knowledge with carefully crafted questions and instant feedback.",
              color: "from-green-500 to-green-600"
            },
            {
              icon: <GraduationCap className="w-8 h-8" />,
              title: "Progress Tracking",
              description: "Monitor your learning progress and identify areas that need more attention.",
              color: "from-purple-500 to-purple-600"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-200 text-center"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white mx-auto mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section variants={itemVariants} className="text-center">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of students who have improved their grades with our comprehensive curriculum resources.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/curriculum/igcse"
              className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-lg"
            >
              Start with IGCSE
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/curriculum/a-level"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-indigo-600 transition-colors font-medium"
            >
              Explore A-Level
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default Curriculum;