import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, PlusCircle, BookOpen, User, Users } from 'lucide-react';

const Contribute: React.FC = () => {
  const [showWordModal, setShowWordModal] = React.useState(false);

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
          <title>Learnmates | Contribute</title>
          <meta name="description" content="Contribute to Learnmates by sharing lessons, notes, or quizzes. Help students worldwide access quality educational resources and join our global community." />
          <meta name="keywords" content="Learnmates, contribute, share, education, lessons, notes, quizzes, curriculum, community" />
        </Helmet>
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <PlusCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Contribute</h1>
          <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">Share lessons, notes, or quizzes to help learners everywhere.</p>
      </motion.div>

      {/* Why Contribute Section */}
      <motion.section variants={itemVariants} className="mb-16">
  <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Why contribute?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <BookOpen className="w-8 h-8" />,
              title: "Impact Learning",
              description: "Your content directly helps students understand complex concepts and achieve better grades.",
              color: "from-blue-500 to-blue-600"
            },
            {
              icon: <Users className="w-8 h-8" />,
              title: "Build Community",
              description: "Join a global network of educators committed to making quality education accessible.",
              color: "from-teal-500 to-teal-600"
            },
            {
              icon: <CheckCircle className="w-8 h-8" />,
              title: "Recognition",
              description: "Get credited for your contributions and build your reputation in the education community.",
              color: "from-purple-500 to-purple-600"
            }
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-200"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${benefit.color} rounded-xl flex items-center justify-center text-white mb-6`}>
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
              <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Guidelines Section */}
      <motion.section variants={itemVariants} className="mb-16">
       <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contribution guidelines</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Standards</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  Content must be curriculum-aligned (IGCSE/A-Level standards)
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  Materials should be original or properly credited
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  Video quality should be clear with good audio
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  PDFs should be well-formatted and readable
                </li>
              </ul>
            </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Review Process</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  All submissions are reviewed by our education team
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  Review process typically takes 2-3 business days
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  You'll receive feedback regardless of approval status
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-xl border-l-4 border-blue-500 text-center">
            <button
              type="button"
              className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => setShowWordModal(true)}
            >
              View submission guidelines
            </button>
          </div>
      </motion.section>

      {/* Contribution Form */}
      {/* Word Contribution Modal */}
      {showWordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
          onClick={() => setShowWordModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-4xl mx-auto relative flex flex-col"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl"
              onClick={() => setShowWordModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-3xl font-bold mb-6 text-gray-900 text-center">Contribution Guidelines</h3>
            <div className="flex-1 flex justify-center items-center">
              <iframe
                src="/documents/Submission.pdf"
                title="Word Contribution Guidelines PDF"
                className="w-full h-[70vh] border rounded-lg shadow"
              />
            </div>
          </div>
        </div>
      )}
      <motion.section variants={itemVariants}>
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit your contribution</h2>
          <p className="text-gray-700 mb-6">Open the contributor form in a new tab and follow the instructions.</p>

          <div className="text-center">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfOHzdrN-UlAWhRcgUtCGdjuK9LG5-0H2UOjMap8sZV5JajMg/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open contribution form
            </a>
          </div>
        </div>
      </motion.section>
    </motion.div>
    </div>
  );
};

export default Contribute;
