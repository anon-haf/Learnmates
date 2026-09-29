import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send } from 'lucide-react';
import { Question } from './TopicalQuiz';
import { topicalConfigs } from '../pages/topicalpagesdata';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
}

type ReportType = 'mismatched' | 'other' | null;

function parseQuestionContent(url?: string, title?: string) {
  if (!url) return { urlFormatted: title || 'unknown', level: '', board: '', subject: '', filename: title || 'unknown' };
  
  let path = url;
  try {
    const urlObj = new URL(url);
    path = urlObj.pathname;
  } catch (e) {
    // Relative URL
  }
  
  const parts = path.split('/').filter(p => p);
  
  let level = '';
  let board = '';
  let subject = '';
  let filename = title || 'unknown';
  
  // Support both regular /Questions/ path and /topicals/ path
  const qIndex = parts.findIndex(p => p.toLowerCase() === 'questions' || p.toLowerCase() === 'topicals');
  if (qIndex !== -1 && parts.length > qIndex + 3) {
    level = parts[qIndex + 1];
    board = parts[qIndex + 2];
    subject = parts[qIndex + 3];
  }
  
  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    filename = decodeURIComponent(lastPart).replace(/\.[^/.]+$/, "");
  }
  
  if (title) {
    filename = title;
  }
  
  let urlFormatted = filename;
  if (level && board && subject) {
    urlFormatted = `${level}-${board}-${subject}-${filename}`;
  }
  
  return { urlFormatted, level, board, subject, filename };
}

function getTopicsForSubject(level: string, board: string, subject: string) {
  const normLevel = level.toLowerCase() === 'alevel' ? 'a-level' : level.toLowerCase();
  const normBoard = board.toLowerCase();
  const normSubject = subject.toLowerCase();
  
  let cfg = topicalConfigs.find(
    c =>
      c.level.toLowerCase() === normLevel &&
      c.board.toLowerCase() === normBoard &&
      c.subject.toLowerCase() === normSubject
  );

  if (!cfg) {
    cfg = topicalConfigs.find(
      c =>
        c.level.toLowerCase() === normLevel &&
        c.board.toLowerCase() === normBoard &&
        (c.subject.toLowerCase().includes(normSubject) ||
         normSubject.includes(c.subject.toLowerCase()))
    );
  }

  if (!cfg) return [];

  const allTopics: { id: string, title: string }[] = [];
  cfg.units.forEach(u => {
    u.topics.forEach(t => {
      if (t.subtopics && t.subtopics.length > 0) {
        t.subtopics.forEach(st => {
          allTopics.push({ id: st.subtopic, title: st.subtopic });
        });
      } else {
        allTopics.push({ id: t.topic, title: t.topic });
      }
    });
  });

  // Unique topics by ID
  return Array.from(new Map(allTopics.map(item => [item.id, item])).values());
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, question }) => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>(null);
  const [description, setDescription] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { urlFormatted, level, board, subject, filename } = parseQuestionContent(question?.questionContent, question?.title);
  const availableTopics = getTopicsForSubject(level, board, subject);
  
  useEffect(() => {
    if (isOpen) {
      setReportType(null);
      setDescription('');
      setSelectedTopics([]);
      setSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !question) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalDescription = '';
      if (reportType === 'mismatched') {
        finalDescription = selectedTopics.map(t => `"${t}"`).join(', ');
      } else {
        finalDescription = description;
      }
      
      const userIdToStore = user?.id || 'Guest';

      const { error } = await supabase
        .from('reports')
        .insert({
          user_id: userIdToStore,
          url: urlFormatted,
          description: finalDescription
        });
        
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTopic = (topicTitle: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicTitle) 
        ? prev.filter(t => t !== topicTitle)
        : [...prev, topicTitle]
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report Question</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Report Submitted!</h3>
                <p className="text-gray-500 dark:text-gray-400">Thank you for helping us improve our platform.</p>
              </div>
            ) : !reportType ? (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm sm:text-base">
                  What seems to be the problem with this question?
                </p>
                <button
                  onClick={() => setReportType('mismatched')}
                  className="w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Mismatched Question
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    This question is labeled with the wrong topic.
                  </p>
                </button>
                <button
                  onClick={() => setReportType('other')}
                  className="w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Other Issue
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Poor image quality, missing mark scheme, etc.
                  </p>
                </button>
              </div>
            ) : reportType === 'mismatched' ? (
              <div className="space-y-5">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">File Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{filename}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-2">
                    Current Topic matches
                  </h4>
                  <div className="flex flex-wrap gap-2 min-h-[3rem] items-center">
                    {question.topicMatches && question.topicMatches.length > 0 ? (
                      question.topicMatches.map((t, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 italic">None</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-2">
                    Expected Topic matches
                  </h4>
                  <div className="flex flex-wrap gap-2 min-h-[3rem] items-center mb-4">
                    {selectedTopics.length > 0 ? (
                      selectedTopics.map((t, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center gap-2">
                          {t}
                          <button onClick={() => toggleTopic(t)} className="hover:text-blue-900 dark:hover:text-blue-100">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 italic">Select topics from below</span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">All Topics for this subject</p>
                  <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800/30">
                    {availableTopics.length > 0 ? (
                      availableTopics.map((topic) => (
                        <label key={topic.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedTopics.includes(topic.title)}
                            onChange={() => toggleTopic(topic.title)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-200 select-none">{topic.title}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 p-2">Could not find topics for this subject.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Description of the issue
                  </span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please explain what is wrong with this question..."
                    className="w-full h-32 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 outline-none resize-none text-gray-900 dark:text-white"
                  />
                </label>
              </div>
            )}
          </div>

          {!success && (
            <div className="p-5 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end gap-3">
              {reportType && (
                <button
                  onClick={() => setReportType(null)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              )}
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {reportType && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (reportType === 'mismatched' && selectedTopics.length === 0) || (reportType === 'other' && !description.trim())}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Report
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
