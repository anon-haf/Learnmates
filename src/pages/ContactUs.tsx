import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Send, MessageCircle, Bug, HelpCircle, CheckCircle , Mail } from 'lucide-react';

const ContactUs: React.FC = () => {
  const [state, handleSubmit] = useForm("xblzywqj");
  if (state.succeeded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Message Sent!</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Thank you for reaching out to us. We'll get back to you within 24 hours.
          </p>
        </div>
      </motion.div>
    );
  }

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
     <div className="min-h-screen bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <Helmet>
            <title>Learnmates | Contact Us</title>
            <meta name="description" content="Contact Learnmates for support, feedback, or questions. We're here to help you succeed in your learning journey." />
            <meta name="keywords" content="Learnmates, contact, support, education, feedback, help, learning" />
          </Helmet>
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center mb-12">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Contact Learnmates</h1>
        <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Questions, bugs or feedback — send us a short note and we'll reply within a few days.
        </p>
      </motion.div>

      {/* Contact Types */}
      <motion.section variants={itemVariants} className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">How Can We Help?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <HelpCircle className="w-8 h-8" />,
              title: "General Questions",
              description: "Ask about our platform, features, or educational content.",
              color: "from-blue-500 to-blue-600"
            },
            {
              icon: <Bug className="w-8 h-8" />,
              title: "Report Bugs",
              description: "Found something not working? Let us know so we can fix it.",
              color: "from-red-500 to-red-600"
            },
            {
              icon: <MessageCircle className="w-8 h-8" />,
                title: "Feedback",
                description: "Share your thoughts on how we can improve Learnmates.",
              color: "from-teal-500 to-teal-600"
            }
          ].map((type, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-200"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${type.color} rounded-xl flex items-center justify-center text-white mb-6`}>
                {type.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{type.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{type.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Contact Form */}
      <motion.section variants={itemVariants}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
                />
                <ValidationError prefix="Email" field="email" errors={state.errors} />
              </div>
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message Type *
              </label>
              <select
                id="type"
                name="type"
                className="bg-white dark:bg-gray-700 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="question">General Question</option>
                <option value="bug">Bug Report</option>
                <option value="feedback">Feedback/Suggestion</option>
                <option value="content">Content Issue</option>
                <option value="technical">Technical Support</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="bg-white dark:bg-gray-700 w-full px-4 py-3 border border-gray-300 dark:border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of your message"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                className="bg-white dark:bg-gray-700 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please provide as much detail as possible..."
              />
              <ValidationError prefix="Message" field="message" errors={state.errors} />
            </div>
            <div className="text-center">
              <button
                type="submit"
                disabled={state.submitting}
                className={`inline-flex items-center px-8 py-4 rounded-lg font-medium text-white shadow-lg transition-all duration-200 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 hover:shadow-xl`}
              >
                <Send className="w-5 h-5 mr-2" />
                {state.submitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </motion.section>

      {/* Additional Info */}
      <motion.section variants={itemVariants} className="mt-16">
        <div className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-700 dark:to-teal-700 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Response Time</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            We typically respond to all messages within 24 hours during business days. 
            For urgent technical issues, we aim to respond even faster.
          </p>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              General Questions: 24 hours
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              Bug Reports: 12 hours
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              Urgent Issues: 4 hours
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
    </div>
  );
};

export default ContactUs;