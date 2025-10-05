import React from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { motion } from 'framer-motion';
import { Upload, FileText, Video, Send, CheckCircle, Users, BookOpen } from 'lucide-react';

const Contribute: React.FC = () => {
  const [hasReadGuidelines, setHasReadGuidelines] = React.useState(false);
  const [showWordModal, setShowWordModal] = React.useState(false);
  const [state, handleSubmit] = useForm("xblzywqj");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [dropboxLink, setDropboxLink] = React.useState("");
  const [uploading, setUploading] = React.useState(false);

  // Upload file to Dropbox and get link
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-to-dropbox', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    setDropboxLink(data.url);
    setUploading(false);
  };
  if (state.succeeded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Thank You for Contributing!</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your contribution has been submitted successfully. Our team will review it and get back to you within 2-3 business days.
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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center mb-16">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-8">
          <Users className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Help Us <span className="text-transparent bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text">Grow</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Join our community of educators and contributors. Share your knowledge and help students worldwide achieve academic excellence.
        </p>
      </motion.div>

      {/* Why Contribute Section */}
      <motion.section variants={itemVariants} className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Your Contribution Matters</h2>
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
        <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Contribution Guidelines</h2>
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
          
          <div className="mt-8 p-6 bg-white rounded-xl border-l-4 border-blue-500">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="guidelines"
                checked={hasReadGuidelines}
                onChange={(e) => setHasReadGuidelines(e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="guidelines" className="ml-3 text-sm font-medium text-gray-900">
                I have read and agree to follow these contribution guidelines
                <span className="mx-2">|</span>
                <button
                  type="button"
                  className="text-blue-700 underline hover:text-blue-900 focus:outline-none"
                  onClick={() => setShowWordModal(true)}
                >
                  Submission guidelines
                </button>
              </label>
            </div>
          </div>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Submit Your Contribution</h2>
          
          <form
            onSubmit={handleSubmit}
            encType="multipart/form-data"
            className="space-y-8"
          >
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a descriptive title"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
                <ValidationError prefix="Email" field="email" errors={state.errors} />
              </div>
            </div>

            {/* Content Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Content Type *
              </label>
              <select
                id="type"
                name="type"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="video">Video Content</option>
                <option value="pdf">PDF Resource</option>
                <option value="quiz">Quiz Questions</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Provide a detailed description of your contribution, including subject, topic, and learning objectives..."
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resources
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Drag and drop your files here, or click to browse
                </p>
                <input
                  type="file"
                  name="resources"
                  accept=".pdf,.mp4,.mov,.avi,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </label>
                {/* File list preview */}
                {selectedFile && (
                  <div className="mt-4 text-sm text-gray-700">
                    <FileText className="inline w-4 h-4 mr-1 text-gray-400" />
                    {selectedFile.name}
                    {uploading && <span className="ml-2 text-blue-500">Uploading...</span>}
                    {dropboxLink && !uploading && (
                      <span className="ml-2 text-green-600">Uploaded!</span>
                    )}
                  </div>
                )}
                {/* Dropbox link hidden field for Formspree */}
                {dropboxLink && (
                  <input type="hidden" name="dropboxLink" value={dropboxLink} />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={!hasReadGuidelines || state.submitting || uploading || !dropboxLink}
                className={`inline-flex items-center px-8 py-4 rounded-lg font-medium text-white shadow-lg transition-all duration-200 ${
                  !hasReadGuidelines || state.submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 hover:shadow-xl'
                }`}
              >
                <Send className="w-5 h-5 mr-2" />
                {state.submitting ? 'Submitting...' : 'Submit Contribution'}
              </button>
            </div>
          </form>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default Contribute;