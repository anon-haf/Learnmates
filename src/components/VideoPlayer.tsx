import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Flag, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

interface VideoPlayerProps {
  title: string;
  description: string;
  englishUrl?: string;
  arabicUrl?: string;
  onReport?: () => void;
  done?: boolean;
  onToggleDone?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  title,
  description,
  englishUrl,
  arabicUrl,
  onReport,
  done,
  onToggleDone
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>('en');
  const [isPlaying, setIsPlaying] = useState(false);

  const videoUrl = selectedLanguage === 'en' ? englishUrl : arabicUrl;
  const hasContent = englishUrl || arabicUrl;

  const getVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  if (!hasContent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
  className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 text-center"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Play className="w-8 h-8 text-gray-400" />
        </div>
  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2">No Content Available</h3>
  <p className="text-gray-500 text-sm sm:text-base mb-6">
          This video hasn't been added yet. Help us grow by contributing content!
        </p>
        <Link
          to="/contribute"
    className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
        >
          Contribute Content
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
  className="bg-white rounded-xl shadow-lg overflow-hidden text-sm sm:text-base"
    >
      {/* Video Header */}
  <div className="p-4 sm:p-6 border-b border-gray-200">
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words">{title}</h2>
          <div className="flex items-center space-x-2">
            {/* Language Toggle */}
            {englishUrl && arabicUrl && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSelectedLanguage('en')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedLanguage === 'en'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Globe className="w-4 h-4 inline mr-1" />
                  EN
                </button>
                <button
                  onClick={() => setSelectedLanguage('ar')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedLanguage === 'ar'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Globe className="w-4 h-4 inline mr-1" />
                  AR
                </button>
              </div>
            )}
            {/* Report Button */}
            <Link
              to="/contact"
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Report Content"
            >
              <Flag className="w-4 h-4" />
            </Link>
            {/* Done Button - styled like resources and grouped with other buttons */}
            {typeof done !== 'undefined' && onToggleDone && (
              <button
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'}`}
                onClick={onToggleDone}
                title={done ? 'Mark as not done' : 'Mark as done'}
              >
                <svg className={`w-5 h-5 mr-1 ${done ? 'text-green-600' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="16" height="16" rx="4" fill={done ? '#22c55e' : '#e5e7eb'} stroke={done ? '#22c55e' : '#d1d5db'} strokeWidth="2" />
                  {done && <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
                {done ? 'Done' : 'Mark as Done'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Video Player */}
      {videoUrl && (
        <div className="relative aspect-video bg-gray-900">
          <iframe
            src={`https://www.youtube.com/embed/${getVideoId(videoUrl)}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {/* Description */}
      <div className="p-4 sm:p-6">
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed break-words">{description}</p>
      </div>
    </motion.div>
  );
};

export default VideoPlayer;