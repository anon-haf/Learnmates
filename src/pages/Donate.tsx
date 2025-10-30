import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, HandHeart, Users, BookOpen, Zap, Globe ,Server, LibraryBigIcon, LibraryBig, Library, Code, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Helmet>
        <title>Learnmates | Donate</title>
        <meta name="description" content="Help keep Learnmates free and accessible for all students. Your donation supports hosting, content creation, and platform improvements." />
        <meta name="keywords" content="Learnmates, donate, support, education, hosting, content creation, learning, contributions, free resources" />
      </Helmet>
    
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center mb-16">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <HandHeart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Support <span className="text-transparent bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text">Learnmates</span>
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Keep Learnmates free and reliable — donations will help cover hosting, content creation and ongoing improvements.
        </p>
      </motion.div>

      {/* Why We Need Support */}
      <motion.section variants={itemVariants} className="mb-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Why Your Support Matters</h2>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Learnmates provides free, high-quality learning resources to students worldwide. We rely on support to pay for hosting, create more content, and keep the site fast and secure.
              </p>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                Even a small contribution helps us maintain the platform and expand what we offer.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-700 dark:to-teal-700 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your contribution supports</h3>
              <div className="space-y-4 text-left">
                {[
                  { icon: <Globe className="w-6 h-6" />, title: 'Access', desc: 'Reach learners everywhere' },
                  { icon: <Shield className="w-6 h-6" />, title: 'Reliability', desc: 'Keep the site online and fast' },
                  { icon: <Library className="w-6 h-6" />, title: 'Content', desc: 'Create and maintain learning materials' }
                ].map((s, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mt-1">{s.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{s.desc}</div>
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
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">How Your Donations Are Used</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Server className="w-8 h-8" />,
              title: "Server & Hosting",
              description: "Keeping our platform fast, reliable, and accessible 24/7 worldwide.",
              
              color: "from-blue-500 to-blue-600"
            },
            {
              icon: <LibraryBig className="w-8 h-8" />,
              title: "Content Creation",
              description: "Producing high-quality educational videos, resources, and interactive materials.",
              
              color: "from-teal-500 to-teal-600"
            },
            {
              icon: <Code className="w-8 h-8" />,
              title: "Platform Development",
              description: "Continuously improving features, user experience, and adding new functionality.",
             
              color: "from-purple-500 to-purple-600"
            }
          ].map((usage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-200"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${usage.color} rounded-xl flex items-center justify-center text-white mb-6`}>
                {usage.icon}
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{usage.title}</h3>
              
              </div>
              <p className="text-gray-600 leading-relaxed dark:text-gray-300">{usage.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Buy Me a Coffee Widget (currently disabled) */}
      <motion.section variants={itemVariants} className="text-center">
        <div className="bg-gradient-to-r from-orange-500 dark:from-orange-700 to-pink-500 dark:to-pink-700 rounded-2xl p-10 sm:p-12 text-white">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Support Learnmates</h2>
          <p className="text-base mb-6 opacity-95 max-w-xl mx-auto">
            If you find our resources helpful, consider buying us a coffee. Every contribution helps keep Learnmates running!
          </p>

          <div className="flex flex-col items-center justify-center space-y-6">
            <a
              href="https://buymeacoffee.com/learnmates"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-yellow-400 dark:bg-yellow-500 hover:bg-yellow-500 dark:hover:bg-yellow-400 text-gray-900 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Coffee className="w-6 h-6 mr-3" />
              Buy me a coffee
            </a>
            <div className="text-sm opacity-80">Even if you can’t donate financially, you can help by:</div>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl w-full">
              <a
                href="/contribute"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white dark:bg-gray-300 text-blue-600 dark:text-blue-500 font-medium hover:bg-opacity-90 dark:hover:bg-opacity-80 transition-colors"
              >
                Contribute content
              </a>
              <button
                onClick={() => navigator.clipboard?.writeText('https://learnmates.org')}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white bg-opacity-20 text-white font-medium hover:bg-opacity-30 transition-colors"
              >
                Share Learnmates
              </button>
            </div>
            <div className="text-sm opacity-80">Every form of support helps us grow — thank you!</div>
          </div>
        </div>
      </motion.section>

      {/* Alternative Support */}
    
    </motion.div>
    </div>
  );
};

export default Donate;