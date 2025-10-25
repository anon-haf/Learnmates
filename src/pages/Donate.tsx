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
    <div className="min-h-screen bg-gray-50">
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
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Support <span className="text-transparent bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text">Learnmates</span>
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
          Keep Learnmates free and reliable — donations will help cover hosting, content creation and ongoing improvements.
        </p>
      </motion.div>

      {/* Why We Need Support */}
      <motion.section variants={itemVariants} className="mb-16">
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Your Support Matters</h2>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-base text-gray-700 leading-relaxed mb-4">
                Learnmates provides free, high-quality learning resources to students worldwide. We rely on support to pay for hosting, create more content, and keep the site fast and secure.
              </p>
              <p className="text-base text-gray-700 leading-relaxed">
                Even a small contribution helps us maintain the platform and expand what we offer.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Your contribution supports</h3>
              <div className="space-y-4 text-left">
                {[
                  { icon: <Globe className="w-6 h-6" />, title: 'Access', desc: 'Reach learners everywhere' },
                  { icon: <Shield className="w-6 h-6" />, title: 'Reliability', desc: 'Keep the site online and fast' },
                  { icon: <Library className="w-6 h-6" />, title: 'Content', desc: 'Create and maintain learning materials' }
                ].map((s, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mt-1">{s.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{s.title}</div>
                      <div className="text-xs text-gray-600">{s.desc}</div>
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
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-200"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${usage.color} rounded-xl flex items-center justify-center text-white mb-6`}>
                {usage.icon}
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{usage.title}</h3>
              
              </div>
              <p className="text-gray-600 leading-relaxed">{usage.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Buy Me a Coffee Widget (currently disabled) */}
      <motion.section variants={itemVariants} className="text-center">
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-10 sm:p-12 text-white">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Donations coming soon</h2>
          <p className="text-base mb-6 opacity-95 max-w-xl mx-auto">
            We’re preparing a simple, secure donations flow. For now donations are disabled while we finish the work.
          </p>

          <div className="bg-white bg-opacity-10 rounded-xl p-8 max-w-2xl mx-auto">
            <div className="text-lg font-semibold mb-2">Coming soon</div>
            <p className="text-sm opacity-90 mb-4">We’ll announce donation options here once they’re ready. Meanwhile, you can help in other ways:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <a href="/contribute" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-blue-600 font-medium">Contribute content</a>
              <button onClick={() => navigator.clipboard?.writeText('https://your-site.example')}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white font-medium">
                Share Learnmates
              </button>
            </div>
            <div className="mt-4 text-xs opacity-80 text-gray-100">Thanks — even helping to share the site means a lot.</div>
          </div>
        </div>
      </motion.section>

      {/* Alternative Support */}
      <motion.section variants={itemVariants} className="mt-16">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Other Ways to Support</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            If donations aren't an option, you can still make an impact. Here are a few ways to help.
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
              <p className="text-gray-600">Tell other students and educators about Learnmates.</p>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
    </div>
  );
};

export default Donate;