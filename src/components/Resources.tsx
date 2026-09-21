// No default React import needed with react-jsx transform
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Flag, ExternalLink, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PrivacyNotice from './PrivacyNotice';
import ResourcePreviewThumbnail from './ResourcePreviewThumbnail';
import { buildPdfViewerPath, PdfViewerBasePath } from '../utils/pdfViewerPaths';
import { linkifyText } from '../utils/linkifyText';
import {
  detectThirdPartyService,
  getPrivacyTips,
  getServiceDescription,
  stripTrackingParams,
  hasServiceConsent,
  setServiceConsent,
} from '../utils/privacyUtils';
import { DoneItem, isDoneItem } from '../utils/doneItems';
import { useEngagement } from '../context/EngagementContext';
import { awardDownloadXP } from '../utils/awardDownloadXP';

interface Resource {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export type ResourcesViewMode = 'list' | 'grid';

// Helper function to check if URL is a PDF
const isPdfUrl = (url: string): boolean => {
  return /\.pdf(\?|$)/i.test(url) && !url.includes('drive.google.com');
};

interface ResourcesProps {
  resources: Resource[];
  topicId?: string;
  viewMode?: ResourcesViewMode;
  pdfViewerBasePath?: PdfViewerBasePath;
}

const Resources: React.FC<ResourcesProps> = ({
  resources,
  topicId,
  viewMode = 'list',
  pdfViewerBasePath,
}: ResourcesProps) => {
  const navigate = useNavigate();
  const [showPrivacyNotice, setShowPrivacyNotice] = useState<boolean>(false);
  const [privacyConsent, setPrivacyConsent] = useState<Record<string, boolean>>({});
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  const { doneResources, toggleDoneResource, setEngagementFlag } = useEngagement();
  const [expandedResources, setExpandedResources] = useState<string[]>([]);

  useEffect(() => {
    const newConsent: Record<string, boolean> = {};
    resources.forEach(resource => {
      const service = detectThirdPartyService(resource.url);
      if (service) {
        newConsent[service] = hasServiceConsent(service);
      }
    });
    setPrivacyConsent(newConsent);
  }, [resources]);

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    if (isPdfUrl(url) && pdfViewerBasePath) {
      e.preventDefault();
      navigate(buildPdfViewerPath(pdfViewerBasePath, url));
      return;
    }

    const detectedService = detectThirdPartyService(url);
    if (detectedService && !hasServiceConsent(detectedService)) {
      e.preventDefault();
      setPendingLink(url);
      setShowPrivacyNotice(true);
    }
  };

  const toggleDone = (resource: Resource) => {
    if (toggleDoneResource) {
      toggleDoneResource(resource.id, resource.url);
    }
  };

  const handleDownload = async (resource: Resource) => {
    if (topicId) {
      setEngagementFlag(topicId, resource.id, resource.url, 'downloaded');
    }
    try {
      await awardDownloadXP({
        resourceId: resource.id,
        resourceName: resource.title,
        resourceType: 'file',
      });
    } catch (xpError) {
      console.warn('XP award failed, proceeding with download:', xpError);
    }
  };

  const renderActionButtons = (
    resource: Resource,
    done: boolean,
    expanded: boolean,
    service: string | null,
    hasConsent: boolean,
    options: { showExpand: boolean; compact?: boolean } = { showExpand: true }
  ) => (
    <div className={`flex items-center flex-wrap gap-2 ${options.compact ? '' : 'mb-3 sm:mb-0'}`}>
      <button
        className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          done
            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300 text-gray-700 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900 dark:hover:text-green-300'
        }`}
        onClick={() => toggleDone(resource)}
        title={done ? 'Mark as not done' : 'Mark as done'}
      >
        <svg
          className={`w-5 h-5 mr-1 ${done ? 'text-green-600' : 'text-gray-400'}`}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="2"
            y="2"
            width="16"
            height="16"
            rx="4"
            fill={done ? '#22c55e' : '#e5e7eb'}
            stroke={done ? '#22c55e' : '#d1d5db'}
            strokeWidth="2"
          />
          {done && (
            <path
              d="M6 10l3 3 5-5"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        {done ? 'Done' : 'Mark as Done'}
      </button>

      {options.showExpand && (
        <button
          className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-500 transition-colors"
          onClick={() =>
            setExpandedResources(prev =>
              expanded ? prev.filter(id => id !== resource.id) : [...prev, resource.id]
            )
          }
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
          {expanded ? 'Hide' : 'Expand'}
        </button>
      )}

      {service && (
        <div
          className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            hasConsent
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
          }`}
          title={hasConsent ? 'Privacy approved' : 'Needs privacy review'}
        >
          <Lock className="w-3 h-3 mr-1" />
          {hasConsent ? 'Safe' : 'Review'}
        </div>
      )}

      {isPdfUrl(resource.url) ? (
        <button
          onClick={e => handleLinkClick(e, resource.url)}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          title="View in PDF Viewer"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      ) : (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => handleLinkClick(e, resource.url)}
          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          title="View Resource"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
      <a
        href={stripTrackingParams(resource.url)}
        download
        onClick={() => handleDownload(resource)}
        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
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
  );

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

  return (
    <>
      {showPrivacyNotice && pendingLink && (
        <PrivacyNotice
          service={getServiceDescription(detectThirdPartyService(pendingLink) || 'Unknown')}
          tips={getPrivacyTips(pendingLink)}
          onAccept={() => {
            const service = detectThirdPartyService(pendingLink);
            if (service) {
              setServiceConsent(service, true);
              setPrivacyConsent(prev => ({ ...prev, [service]: true }));
            }
            window.open(stripTrackingParams(pendingLink), '_blank', 'noopener,noreferrer');
            setShowPrivacyNotice(false);
            setPendingLink(null);
          }}
          onDecline={() => {
            setShowPrivacyNotice(false);
            setPendingLink(null);
          }}
          isEmbedded={false}
        />
      )}

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
      {resources.map((resource, index) => {
        const done = isDoneItem(doneResources, resource.id, resource.url);
        const expanded = expandedResources.includes(resource.id);
        const service = detectThirdPartyService(resource.url);
        const hasConsent = service ? privacyConsent[service] : true;

        if (viewMode === 'grid') {
          return (
            <motion.div
              key={`${resource.id}:${resource.url}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col ${
                done ? 'ring-2 ring-green-400 dark:ring-green-500' : ''
              }`}
            >
             {isPdfUrl(resource.url) ? (
  <button
    onClick={e => handleLinkClick(e, resource.url)}
    className="block relative aspect-[10/9] bg-gray-100 dark:bg-gray-700 group w-full text-left"
  >
    <ResourcePreviewThumbnail
      url={resource.url}
      title={resource.title}
      className="absolute inset-0 w-full h-full"
    />
    
    {/* Hover overlay */}
    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
      {resource.description ? (
        <p className="text-xs text-white text-center line-clamp-6">
          {linkifyText(resource.description)}
        </p>
      ) : (
        <p className="text-sm text-white text-center font-semibold line-clamp-3">{resource.title}</p>
      )}
    </div>
    
    {done && (
      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
        Done
      </div>
    )}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
      <h3 className="text-sm font-semibold text-white line-clamp-2">{resource.title}</h3>
    </div>
  </button>
) : (
  <a
    href={resource.url}
    target="_blank"
    rel="noopener noreferrer"
    onClick={e => handleLinkClick(e, resource.url)}
    className="block relative aspect-[10/9] bg-gray-100 dark:bg-gray-700 group"
  >
    <ResourcePreviewThumbnail
      url={resource.url}
      title={resource.title}
      className="absolute inset-0 w-full h-full"
    />
    
    {/* Hover overlay */}
    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
      {resource.description ? (
        <p className="text-xs text-white text-center line-clamp-6">
          {linkifyText(resource.description)}
        </p>
      ) : (
        <p className="text-sm text-white text-center font-semibold line-clamp-3">{resource.title}</p>
      )}
    </div>
    
    {done && (
      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
        Done
      </div>
    )}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
      <h3 className="text-sm font-semibold text-white line-clamp-2">{resource.title}</h3>
    </div>
  </a>
)}

<div className="p-3 border-t border-gray-100 dark:border-gray-700">
  {renderActionButtons(resource, done, expanded, service, hasConsent, {
    showExpand: false,
    compact: true,
  })}
</div>
            </motion.div>
          );
        }
        return (
          <motion.div
            key={`${resource.id}:${resource.url}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex flex-col sm:flex-row items-start justify-between mb-4">
              <div className="flex items-center space-x-2 mb-3 sm:mb-0 order-1 sm:order-2 flex-wrap gap-2">
                {renderActionButtons(resource, done, expanded, service, hasConsent, { showExpand: true })}
              </div>
              <div className="flex items-center space-x-3 order-2 sm:order-1">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-800 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600 dark:text-red-200" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{resource.title}</h3>
                  {resource.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {linkifyText(resource.description)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {expanded && (
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                <iframe src={resource.url} title={resource.title} className="w-full h-96 rounded border" />
              </div>
            )}
          </motion.div>
        );
      })}
      </div>
    </>
  );
};

export default Resources;
