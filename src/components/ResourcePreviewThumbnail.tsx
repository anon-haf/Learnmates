import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { pdfjs, pdfGetDocumentOptions } from '../utils/pdfjsConfig';
import './PdfPageSkeleton';

function getGoogleDriveFileId(url: string): string | null {
  const match = url.match(/\/file\/d\/([^/]+)/);
  return match ? match[1] : null;
}

function isLocalPdf(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url) && !url.includes('drive.google.com');
}

function isPreviewableUrl(url: string): boolean {
  return isLocalPdf(url) || url.includes('drive.google.com');
}

interface ResourcePreviewThumbnailProps {
  url: string;
  title: string;
  className?: string;
}

const ResourcePreviewThumbnail: React.FC<ResourcePreviewThumbnailProps> = ({
  url,
  title,
  className = '',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pdfThumbnail, setPdfThumbnail] = useState<string | null>(null);

  const driveFileId = getGoogleDriveFileId(url);
  const driveThumbnail = driveFileId
    ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w600`
    : null;

  useEffect(() => {
    if (!isLocalPdf(url)) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const renderPdfThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);
        setPdfThumbnail(null);

        let pdfUrl = url;
        if (!pdfUrl.startsWith('http') && !pdfUrl.startsWith('blob:')) {
          pdfUrl = new URL(url, window.location.origin).href;
        }

        const pdf = await pdfjs.getDocument({
          ...pdfGetDocumentOptions,
          url: pdfUrl,
        }).promise;

        if (cancelled) return;

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const targetWidth = 1000 * devicePixelRatio;
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        (canvas as any).mozOpaque = true;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
          intent: 'display'
        }).promise;

        if (!cancelled) {
          setPdfThumbnail(canvas.toDataURL('image/jpeg', 0.95));
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    renderPdfThumbnail();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (driveThumbnail && !error) {
    return (
      // overflow-hidden + absolute fill ensures parent's aspect-ratio class is respected
      <div className={`relative bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
        <img
          src={driveThumbnail}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          onLoad={() => setLoading(false)}
        />
        {loading && (
          <div className="absolute inset-0 pdf-skeleton-loader" />
        )}
      </div>
    );
  }

  if (isLocalPdf(url) && pdfThumbnail && !error) {
    return (
      <div className={`relative bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
        <img src={pdfThumbnail} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    );
  }

  if (isLocalPdf(url) && loading) {
    return (
      <div className={`w-full h-full pdf-skeleton-loader ${className}`} />
    );
  }

  if (isPreviewableUrl(url) && !isLocalPdf(url)) {
    return (
      <div className={`relative bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
        <iframe
          src={url}
          title={title}
          className="w-full h-full pointer-events-none border-0 scale-[1.02]"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-red-50 dark:bg-red-900/20 ${className}`}>
      <FileText className="w-12 h-12 text-red-400 dark:text-red-300" />
    </div>
  );
};

export default ResourcePreviewThumbnail;
