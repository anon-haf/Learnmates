import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import UniversalDocumentViewer from '../components/UniversalDocumentViewer';
import { resolvePdfResource, resolveTopicKeyFromParams } from '../utils/curriculumTopicResolver';
import { buildTopicPath } from '../utils/pdfViewerPaths';
import { topicData } from '../data/topicData';
import { Button } from '../components/ui';
const CurriculumPdfViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const { type, board, subject, title, pdfFile } = useParams<{
    type: string;
    board: string;
    subject: string;
    title: string;
    pdfFile: string;
  }>();

  const topicKey = resolveTopicKeyFromParams(topicData, title, subject);
  const topic = topicKey ? topicData[topicKey] : null;
  const resource = topic && pdfFile ? resolvePdfResource(topic, pdfFile) : null;

  const topicSlug = title ? decodeURIComponent(title) : '';
  const topicPath = type && board && subject && topicSlug
    ? buildTopicPath({
        type,
        board,
        subject: decodeURIComponent(subject),
        topicSlug,
      })
    : '/curriculum';

  if (!topic || !resource || !pdfFile?.toLowerCase().endsWith('.pdf')) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <Helmet>
          <title>Resource Not Found | Learnmates</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">PDF Not Found</h1>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-6">
          We couldn&apos;t find that document. It may have moved or the link is incorrect.
        </p>
        <Button asChild leftIcon={<ArrowLeft className="w-4 h-4" />}>
          <Link to={topicPath}>Back to topic</Link>
        </Button>
      </div>
    );
  }

  // Pull the contributor's name out of titles like "Number Notes (Haris)" or "Algebra(@Tim Tam)"
  const contributorMatch = resource.title.match(/\(@?([^)]+)\)\s*$/);
  const contributor = contributorMatch ? contributorMatch[1].trim() : null;

  const pageTitle = `${resource.title} | ${topic.subject} Notes | Learnmates`;
  const pageDescription = resource.description
    ? resource.description
    : `Free ${topic.subject} notes on ${topic.title}${contributor ? ` by ${contributor}` : ''} — part of Learnmates' free ${type?.toUpperCase() === 'IGCSE' ? 'IGCSE' : 'A-Level'} ${board} study resources.`;

  const canonicalUrl = `https://www.learnmates.org/curriculum/${type}/${board}/${encodeURIComponent(subject || '')}/${title}/${pdfFile}`;

  return (
    <div className="fixed inset-0 z-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta
          name="keywords"
          content={[
            'Learnmates',
            'free study notes',
            resource.title,
            topic.subject,
            topic.title,
            board,
            type,
            contributor,
          ]
            .filter(Boolean)
            .join(', ')}
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      </Helmet>
      <UniversalDocumentViewer
        pdfUrl={resource.url}
        fileName={resource.title}
        onClose={() => navigate(topicPath)}
        engagementContext={
          topicKey
            ? { topicId: topicKey, resourceId: resource.id }
            : undefined
        }
      />
    </div>
  );
};

export default CurriculumPdfViewerPage;