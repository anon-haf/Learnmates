import React from 'react';
import UniversalDocumentViewer, {
  UniversalDocumentViewerProps,
  PdfEngagementContext,
} from './UniversalDocumentViewer';

export type { PdfEngagementContext };

export interface PDFViewerModalProps {
  pdfUrl: string;
  fileName?: string;
  onClose?: () => void;
  engagementContext?: PdfEngagementContext;
}

const PDFViewerModal: React.FC<PDFViewerModalProps> = (props) => {
  return <UniversalDocumentViewer {...props} mode="modal" />;
};

export default PDFViewerModal;
