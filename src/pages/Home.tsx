import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, User, Trophy } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Home: React.FC = () => {
  const { user, setUser } = useUser();
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (!user) {
        setUser(parsedUser);
      }
      setShowNameInput(false);
    } else if (!user) {
      setShowNameInput(true);
    }
  }, [user, setUser]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tempName.trim();
    if (trimmed) {
      const newUser = {
        name: trimmed,
        progress: {},
        recentCourses: []
      };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      setShowNameInput(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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

  return (
    <div className="min-h-screen">
      {/* Name Input Modal */}
      {showNameInput && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-center text-gray-900 mb-3">
                  Welcome to Learnmates
                </h2>
            <p className="text-gray-600 text-center mb-6">
              Let's personalize your learning experience. What should we call you?
            </p>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 font-medium"
              >
                Get Started
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {user ? (
              <>
                Welcome back, <span className="text-transparent bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text">{user.name}</span>!
              </>
            ) : (
              <>
                Master Your <span className="text-transparent bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text">Education</span>
              </>
            )}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {user ? (
              "Ready to continue your learning journey? Pick up where you left off or explore new topics."
            ) : (
              "Your comprehensive platform for IGCSE and A-Level studies. Access curated videos, resources, and interactive quizzes designed to help you excel."
            )}
          </p>
        </motion.div>

        {/* Recent Courses or Get Started */}
        {user && user.recentCourses.length > 0 ? (
          <motion.section variants={itemVariants} className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BookOpen className="w-7 h-7 text-blue-600 mr-3" />
              Continue where you left off
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.recentCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                        {course.type}
                      </span>
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{course.title}</h3>
                    <Link
                      to={`/topic/${course.id}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Course
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/curriculum"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-medium"
              >
                Explore New Things
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.section>
        ) : user ? (
          <motion.section variants={itemVariants} className="mb-16 text-center">
            <div className="bg-white rounded-xl shadow-lg p-12">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Start learning</h2>
              <p className="text-base text-gray-600 mb-6 max-w-xl mx-auto">
                You haven't started any courses yet. Pick a curriculum to begin.
              </p>
              <Link
                to="/curriculum"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-medium"
              >
                Choose Curriculum
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.section>
        ) : null}

        {/* Features Grid */}
        <motion.section variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Why Learnmates?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "Comprehensive Content",
                description: "Access curated videos, resources, and materials for IGCSE and A-Level subjects.",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: "Interactive Quizzes",
                description: "Test your knowledge with interactive quizzes and get instant feedback.",
                color: "from-teal-500 to-teal-600"
              },
              {
                icon: <User className="w-8 h-8" />,
                title: "Personalized Learning",
                description: "Track your progress and get a personalized learning experience.",
                color: "from-purple-500 to-purple-600"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-200"
              >
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white mb-4`}>
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
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-3">Ready to excel?</h2>
            <p className="text-base mb-6 opacity-90 max-w-xl mx-auto">
              Join thousands of learners who use Learnmates to study smarter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/curriculum"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-lg"
              >
                Start Learning
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-medium"
              >
                Learn More
              </Link>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Home;
