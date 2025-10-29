import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Flag, ExternalLink, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Resource {
  id: string;
  title: string;
  url: string;
  description?: string;
}

interface ResourcesProps {
  resources: Resource[];
  doneResources?: string[];
  setDoneResources?: React.Dispatch<React.SetStateAction<string[]>>;
}

const Resources: React.FC<ResourcesProps> = ({ resources, doneResources: externalDoneResources, setDoneResources: externalSetDoneResources }) => {
  if (resources.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8 text-center"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resources Available</h3>
        <p className="text-gray-600 mb-6">
          No resources have been added for this topic yet. Help us grow by contributing content!
        </p>
        <Link
          to="/contribute"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Contribute Resources
        </Link>
      </motion.div>
    );
  }

  // Support external doneResources state passed from parent (TopicPage) or use local state
  const [localDoneResources, setLocalDoneResources] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('doneResources');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  // Persist local state to localStorage
  React.useEffect(() => {
    // Only persist when using internal state
    if (!externalDoneResources) {
      localStorage.setItem('doneResources', JSON.stringify(localDoneResources));
    }
  }, [localDoneResources, externalDoneResources]);

  const doneResources = externalDoneResources ?? localDoneResources;
  const setDoneResources = externalSetDoneResources ?? setLocalDoneResources;
  const [expandedResources, setExpandedResources] = React.useState<string[]>([]);

  return (
    <div className="space-y-4">
      {resources.map((resource, index) => {
        const done = doneResources.includes(resource.id);
        const expanded = expandedResources.includes(resource.id);
        return (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex flex-col sm:flex-row items-start justify-between mb-4">
              {/* Buttons first on mobile, content first on desktop */}
              <div className="flex items-center space-x-2 mb-3 sm:mb-0 order-1 sm:order-2">
                {/* action buttons (will be moved above title on small screens) */}
                <button
                  className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${done ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300 text-gray-700 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900 dark:hover:text-green-300'}`}
                  onClick={() => setDoneResources((prev) => prev.includes(resource.id) ? prev.filter(id => id !== resource.id) : [...prev, resource.id])}
                  title={done ? 'Mark as not done' : 'Mark as done'}
                >
                  <svg className={`w-5 h-5 mr-1 ${done ? 'text-green-600' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="16" height="16" rx="4" fill={done ? '#22c55e' : '#e5e7eb'} stroke={done ? '#22c55e' : '#d1d5db'} strokeWidth="2" />
                    {done && <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                  </svg>
                  {done ? 'Done' : 'Mark as Done'}
                </button>
                <button
                  className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-500  transition-colors"
                  onClick={() => setExpandedResources((prev) => expanded ? prev.filter(id => id !== resource.id) : [...prev, resource.id])}
                  title={expanded ? 'Collapse' : 'Expand'}
                >
                  {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                  {expanded ? 'Hide' : 'Expand'}
                </button>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Resource"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={resource.url}
                  download
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download Resource"
                >
                  <Download className="w-4 h-4" />
                </a>
                <Link
                  to="/contact"
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Report Resource"
                >
                  <Flag className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex items-center space-x-3 order-2 sm:order-1">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600 dark:text-red-200" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{resource.title}</h3>
                  {resource.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{resource.description}</p>
                  )}
                </div>
              </div>
              
            </div>
            {expanded && (
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                <iframe
                  src={resource.url}
                  title={resource.title}
                  className="w-full h-96 rounded border"
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default Resources;
