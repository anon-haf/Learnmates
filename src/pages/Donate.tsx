import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Heart, Users, BookOpen, Zap, Globe } from 'lucide-react';
import { label } from 'framer-motion/client';

const Donate: React.FC = () => {
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center mb-16">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Support <span className="text-transparent bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text">EduHub</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Help us maintain and expand our free educational platform. Your support enables us to serve thousands of students worldwide.
        </p>
      </motion.div>

      {/* Why We Need Support */}
      <motion.section variants={itemVariants} className="mb-16">
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Your Support Matters</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                EduHub is a passion project dedicated to democratizing quality education. We believe that every student, 
                regardless of their economic background, should have access to excellent learning resources.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Currently, our platform is completely free for all users. However, maintaining servers, creating content, 
                and continuously improving the platform requires resources.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Your donation, no matter how small, helps us keep the lights on and continue serving the global student community.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">What you contribute to</h3>
              <div className="space-y-4">
                {[
                  { icon: <Users className="w-6 h-6" />, value: "Students Served" , label:'globally'},
                  { icon: <BookOpen className="w-6 h-6" />, value: "Video Lessons" , label:'available'},
                  { icon: <Globe className="w-6 h-6" />, value: "Countries Reached" , label:'worldwide'},
                  { icon: <Zap className="w-6 h-6" />, value: "Monthly Server Costs" , label:'$200'}
                ].map((stat, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* How Donations Are Used */}
      <motion.section variants={itemVariants} className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How Your Donations Are Used</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Globe className="w-8 h-8" />,
              title: "Server & Hosting",
              description: "Keeping our platform fast, reliable, and accessible 24/7 worldwide.",
              percentage: "40%",
              color: "from-blue-500 to-blue-600"
            },
            {
              icon: <BookOpen className="w-8 h-8" />,
              title: "Content Creation",
              description: "Producing high-quality educational videos, resources, and interactive materials.",
              percentage: "35%",
              color: "from-teal-500 to-teal-600"
            },
            {
              icon: <Zap className="w-8 h-8" />,
              title: "Platform Development",
              description: "Continuously improving features, user experience, and adding new functionality.",
              percentage: "25%",
              color: "from-purple-500 to-purple-600"
            }
          ].map((usage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-200"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${usage.color} rounded-xl flex items-center justify-center text-white mb-6`}>
                {usage.icon}
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{usage.title}</h3>
                <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text">
                  {usage.percentage}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">{usage.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Buy Me a Coffee Widget */}
      <motion.section variants={itemVariants} className="text-center">
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-12 text-white">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Buy Us a Coffee</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Even a small contribution makes a big difference. Help us keep EduHub free and accessible for everyone.
          </p>
          
          {/* Donation Options */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-md mx-auto mb-8">
            {[
              { amount: '$3', description: 'One coffee' },
              { amount: '$10', description: 'A week of hosting' },
              { amount: '$25', description: 'Custom amount' }
            ].map((option, index) => (
              <button
                key={index}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 transition-all duration-200 hover:scale-105"
              >
                <div className="text-2xl font-bold mb-1">{option.amount}</div>
                <div className="text-sm opacity-80">{option.description}</div>
              </button>
            ))}
          </div>

          {/* Buy Me a Coffee Button */}
          <div className="bg-white rounded-xl p-8 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Coffee className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">Buy Me A Coffee</span>
            </div>
            <p className="text-gray-600 mb-6">
              Click the button below to support EduHub through our Buy Me A Coffee page.
            </p>
            <a
              href="https://buymeacoffee.com/eduhub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium text-lg"
            >
              <Coffee className="w-5 h-5 mr-2" />
              Support EduHub
            </a>
          </div>

          <div className="mt-8 text-sm opacity-80">
            All donations are used exclusively for platform maintenance and improvement
          </div>
        </div>
      </motion.section>

      {/* Alternative Support */}
      <motion.section variants={itemVariants} className="mt-16">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Other Ways to Support</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Can't donate right now? No problem! There are other ways you can help EduHub grow and serve more students.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-blue-50 rounded-xl p-6">
              <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Contribute Content</h3>
              <p className="text-gray-600">Share your knowledge by contributing educational resources.</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-6">
              <Users className="w-8 h-8 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Spread the Word</h3>
              <p className="text-gray-600">Tell other students and educators about EduHub.</p>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default Donate;