import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, Target, Heart, Award, Globe, Gift} from 'lucide-react';

const About: React.FC = () => {
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
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          About <span className="text-transparent bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text">EduHub</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          EduHub is a comprehensive educational platform designed to empower students in their IGCSE and A-Level journey. 
          We believe that quality education should be accessible to everyone, everywhere.
        </p>
      </motion.div>

      {/* Mission Section */}
      <motion.section variants={itemVariants} className="mb-16">
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <div className="flex items-center mb-6">
            <Target className="w-8 h-8 text-blue-600 mr-4" />
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            To democratize quality education by providing students with comprehensive, accessible, and engaging learning resources. 
            We strive to bridge the gap between traditional classroom learning and modern digital education, ensuring every student 
            has the tools they need to succeed.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-6 h-6" />,
                title: "Community-Driven",
                description: " A platform built for the students by the students where everyone could contribute."
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Accessible",
                description: "Available to any student globally, anytime, anywhere."
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: "Quality Focused",
                description: "Curated content that meets the highest educational standards."
              }
            ].map((value, index) => (
              <div key={index} className="text-center p-6 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <div className="text-blue-600">{value.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Story Section */}
      <motion.section variants={itemVariants} className="mb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                EduHub was born from the recognition that students worldwide deserve access to high-quality educational resources, 
                regardless of their geographical location or economic circumstances.
              </p>
              <p>
                Our founders, current students themselves, understood the challenges faced by learners 
                preparing for crucial examinations like IGCSE and A-Levels. They envisioned a platform that would not only 
                provide content but also create an engaging, personalized learning experience.
              </p>

            </div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section variants={itemVariants} className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What Makes Us Different</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              title: "Interactive Learning",
              description: "Engage with interactive quizzes, videos, and resources provided by your peers that understand first-hand what works best.",
              icon: <Target className="w-8 h-8" />,
              color: "from-teal-500 to-teal-600"
            },
            {
              title: "Community Support",
              description: "Join a supportive community where students are both educators and learners contributing to each other's success.",
              icon: <Heart className="w-8 h-8" />,
              color: "from-pink-500 to-pink-600"
            },{
              title: "Completely free",
              description: "Access all the resources and features with no cost involved. We believe in an accessible free education for all.",
              icon: <Gift className="w-8 h-8" />,
              color: "from-blue-500 to-blue-600"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-200"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white mb-6`}>
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
          <h2 className="text-4xl font-bold mb-4">Join Our Learning Community</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Be part of a global community of learners and educators committed to academic excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/curriculum"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-lg"
            >
              Start Learning Today
            </a>
            <a
              href="/contribute"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-medium"
            >
              Contribute Content
            </a>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default About;