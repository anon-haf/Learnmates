import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, RotateCcw, Trophy, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import MediaViewer from './MediaViewer';
import { QuestionViewTracker } from './QuestionViewTracker';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { resolveFromR2, fetchR2AsBlobUrl, getAssetAuthHeaders } from '../utils/r2Utils';

export interface Question {
  id: string;
  questionContent?: string;
  questionContentType?: 'image' | 'pdf';
  markScheme?: string;
  markSchemeType?: 'image' | 'pdf';
  title?: string;
  downloadOnly?: boolean; // If true, show download buttons instead of viewer
}

interface QuestionState {
  correct?: boolean;
}


interface SingleQuizProps {
  questions: Question[];
  title: string;
  quizId?: string;
}

interface MultiQuiz {
  id: string;
  title: string;
  questions: Question[];
  folderPath?: string; // Optional: path to folder for lazy loading
  loadQuiz?: (folderPath: string) => Promise<Question[]>; // Optional: callback to load questions
  isLoading?: boolean; // Indicates if more questions are still loading
  questionCount?: number; // Quick count of questions (loaded without loading all questions)
}

interface QuizMenuProps {
  quizzes: MultiQuiz[];
}

type QuizComponentProps = SingleQuizProps | QuizMenuProps;

const shouldUseR2 = (value: string) => {
  if (!value || value.startsWith('blob:')) return false;
  const normalized = value.toLowerCase();
  return normalized.includes('/questions/') || normalized.includes('/topicals/') || normalized.includes('assets.learnmates.org');
};

const Quiz: React.FC<QuizComponentProps> = (props) => {
  const resolveAssetUrl = async (url: string): Promise<string> => {
    if (!url || url.startsWith('blob:')) return url;
    if (!shouldUseR2(url)) return url;
    const resolvedUrl = await resolveFromR2(url);
    return resolvedUrl || url;
  };

  // helper: fetch with a short timeout (local files shouldn't take long)
  const fetchWithTimeout = (url: string, timeout = 3000): Promise<Response> => {
    const isR2Asset = shouldUseR2(url);
    const requestInit: RequestInit = {};

    if (isR2Asset) {
      requestInit.mode = 'cors';
      requestInit.headers = {
        Accept: 'application/pdf,image/*,*/*',
        ...getAssetAuthHeaders(),
      };
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), timeout);
      fetch(url, requestInit)
        .then(res => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  // Shared download functions
  const handleDownload = async (url: string, filename: string) => {
    try {
      const resolvedUrl = await resolveAssetUrl(url);
      const isR2Asset = shouldUseR2(resolvedUrl) || shouldUseR2(url);

      if (isR2Asset) {
        const blobUrl = await fetchR2AsBlobUrl(resolvedUrl);
        if (blobUrl) {
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          return;
        }
      }

      // Convert relative URL to absolute if needed
      const absoluteUrl = resolvedUrl.startsWith('http') || resolvedUrl.startsWith('blob:')
        ? resolvedUrl
        : new URL(resolvedUrl, window.location.origin).href;

      let response: Response | null = null;

      try {
        response = await fetchWithTimeout(absoluteUrl, 10000);
      } catch (error) {
        console.log(`[Quiz] Fetch failed for asset: ${(error as Error).message}`);
      }

      if (!response || !response.ok) {
        if (shouldUseR2(url)) {
          throw new Error(`Failed to download managed asset from R2: ${response?.statusText || 'Network error'}`);
        }
        throw new Error(`Failed to download: ${response?.statusText || 'Network error'}`);
      }

      const blob = await response.blob();

      // Create a temporary link and trigger download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: open in new tab
      const absoluteUrl = url.startsWith('http') || url.startsWith('blob:')
        ? url
        : new URL(url, window.location.origin).href;
      window.open(absoluteUrl, '_blank');
    }
  };

  const getFilenameFromUrl = (url: string, defaultName: string): string => {
    try {
      const urlPath = url.split('/').pop() || defaultName;
      // Remove query parameters if any
      let filename = urlPath.split('?')[0];
      // Decode URL-encoded characters (e.g., %20 → space, %26 → &, %2C → ,)
      filename = decodeURIComponent(filename);
      return filename;
    } catch {
      return defaultName;
    }
  };

  // Create a separator page with question number
  const createSeparatorPage = async (pdf: PDFDocument, questionNumber: number, type: 'questions' | 'markschemes'): Promise<void> => {
    const page = pdf.addPage([612, 792]); // US Letter size
    const { width, height } = page.getSize();
    
    // Draw background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(0.95, 0.95, 0.95), // Light gray background
    });
    
    // Draw border
    page.drawRectangle({
      x: 50,
      y: 50,
      width: width - 100,
      height: height - 100,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 3,
    });
    
    // Draw question number text (large and centered)
    const fontSize = 72;
    const text = `${type === 'questions' ? 'Question' : 'Mark Scheme'} ${questionNumber}`;
    
    // Embed font
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize;
    
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2 + textHeight / 2,
      size: fontSize,
      color: rgb(0, 0, 0),
      font: font,
    });
  };

  // Convert image to PDF page
  const addImageToPdf = async (
    pdf: PDFDocument,
    imageUrl: string,
    questionNumber: number
  ): Promise<void> => {
    try {
      const resolvedUrl = await resolveAssetUrl(imageUrl);
      let absoluteUrl = resolvedUrl.startsWith('http') || resolvedUrl.startsWith('blob:')
        ? resolvedUrl
        : new URL(resolvedUrl, window.location.origin).href;
      
      console.log(`[PDF Merge] Fetching image: ${absoluteUrl}`);
      let response = null;
      try {
        response = await fetchWithTimeout(absoluteUrl, 3000);
      } catch (_) {
        response = null;
      }
      
      if (!response || !response.ok) {
        if (shouldUseR2(imageUrl)) {
          console.error(`[PDF Merge] Failed to fetch managed image from R2: ${response?.statusText || 'no response'}`);
          return;
        }
        console.error(`[PDF Merge] Failed to fetch image: ${response?.statusText || 'no response'}`);
        return;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      let image;
      const contentType = response.headers.get('content-type') || '';
      
      console.log(`[PDF Merge] Image content type: ${contentType}`);
      
      if (contentType.includes('png')) {
        image = await pdf.embedPng(arrayBuffer);
        console.log(`[PDF Merge] Successfully embedded as PNG`);
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        image = await pdf.embedJpg(arrayBuffer);
        console.log(`[PDF Merge] Successfully embedded as JPG`);
      } else {
        // Try PNG first, then JPG
        try {
          image = await pdf.embedPng(arrayBuffer);
          console.log(`[PDF Merge] Successfully embedded as PNG (auto-detect)`);
        } catch (e) {
          try {
            image = await pdf.embedJpg(arrayBuffer);
            console.log(`[PDF Merge] Successfully embedded as JPG (auto-detect)`);
          } catch (e2) {
            console.error(`[PDF Merge] Failed to embed image as PNG or JPG:`, e2);
            return;
          }
        }
      }
      
      // Create a page that fits the image (standard letter size)
      const pageWidth = 612; // US Letter width
      const pageHeight = 792; // US Letter height
      const imageDims = image.scale(1);
      
      console.log(`[PDF Merge] Image dimensions: ${imageDims.width} x ${imageDims.height}`);
      
      // Calculate scale to fit image on page (leave space for question number)
      const maxImageHeight = pageHeight - 60; // Leave 60px for text and margins
      const maxImageWidth = pageWidth - 40; // Leave 20px margin on each side
      const scaleX = maxImageWidth / imageDims.width;
      const scaleY = maxImageHeight / imageDims.height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't upscale
      
      const scaledWidth = imageDims.width * scale;
      const scaledHeight = imageDims.height * scale;
      
      console.log(`[PDF Merge] Scaled dimensions: ${scaledWidth} x ${scaledHeight} (scale: ${scale})`);
      
      const page = pdf.addPage([pageWidth, pageHeight]);
      
      // Add question number text at the top (larger and more prominent)
      const textSize = 24;
      const textY = pageHeight - 40;
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      page.drawText(`Question ${questionNumber}`, {
        x: 30,
        y: textY,
        size: textSize,
        color: rgb(0, 0, 0),
        font: font,
      });
      
      // Draw the image centered below the text
      const imageX = (pageWidth - scaledWidth) / 2;
      const imageY = pageHeight - 50 - scaledHeight;
      
      console.log(`[PDF Merge] Drawing image at (${imageX}, ${imageY}) with size ${scaledWidth} x ${scaledHeight}`);
      
      page.drawImage(image, {
        x: imageX,
        y: imageY,
        width: scaledWidth,
        height: scaledHeight,
      });
      
      console.log(`[PDF Merge] Successfully added image page for question ${questionNumber}`);
    } catch (error) {
      console.error(`[PDF Merge] Error adding image ${imageUrl}:`, error);
    }
  };

  // Merge PDFs and images with question numbers and separators
  const mergePDFsAndImages = async (
    questions: Question[],
    type: 'questions' | 'markschemes'
  ): Promise<Blob> => {
    const mergedPdf = await PDFDocument.create();
    
    console.log(`[PDF Merge] Starting merge for ${questions.length} questions`);
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const questionNumber = parseInt(question.id.replace('q', '')) || (i + 1);
      const fileUrl = type === 'questions' ? question.questionContent : question.markScheme;
      const fileType = type === 'questions' ? question.questionContentType : question.markSchemeType;
      
      if (!fileUrl) {
        console.warn(`[PDF Merge] Skipping question ${questionNumber}: no file URL`);
        continue;
      }
      
      try {
        const resolvedUrl = await resolveAssetUrl(fileUrl);
        let absoluteUrl = resolvedUrl.startsWith('http') || resolvedUrl.startsWith('blob:')
          ? resolvedUrl
          : new URL(resolvedUrl, window.location.origin).href;
        
        console.log(`[PDF Merge] Processing question ${questionNumber}: ${fileType} from ${absoluteUrl}`);
        
        if (fileType === 'pdf') {
          // Add separator page before PDF
          await createSeparatorPage(mergedPdf, questionNumber, type);
          console.log(`[PDF Merge] Added separator page for question ${questionNumber}`);
          
          let response: Response | null = null;
          let errorMessage = 'unknown error';

          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              response = await fetchWithTimeout(absoluteUrl, 20000);
              if (response.ok) {
                break;
              }

              errorMessage = `${response.status} ${response.statusText || 'no response'}`;
              console.error(
                `[PDF Merge] Question ${questionNumber} PDF fetch attempt ${attempt}/2 failed for ${absoluteUrl} with status ${response.status} (${response.statusText || 'no response'})`
              );

              if (attempt === 1 && (response.status >= 500 || response.status === 429)) {
                continue;
              }
              break;
            } catch (error) {
              errorMessage = error instanceof Error ? error.message : 'unknown error';
              console.error(
                `[PDF Merge] Question ${questionNumber} PDF fetch attempt ${attempt}/2 threw for ${absoluteUrl}:`,
                error
              );
              if (attempt === 1) {
                continue;
              }
              response = null;
              break;
            }
          }

          if (!response || !response.ok) {
            if (shouldUseR2(fileUrl)) {
              console.error(
                `[PDF Merge] Failed to fetch managed PDF from R2 for question ${questionNumber} after 2 attempts. Status: ${response?.status ?? 'unknown'} (${response?.statusText || 'no response'}). URL: ${absoluteUrl}. Error: ${errorMessage}`
              );
              continue;
            }
            console.error(
              `[PDF Merge] Failed to fetch PDF for question ${questionNumber} after 2 attempts. Status: ${response?.status ?? 'unknown'} (${response?.statusText || 'no response'}). URL: ${absoluteUrl}. Error: ${errorMessage}`
            );
            continue;
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const pdf = await PDFDocument.load(arrayBuffer);
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          
          // Embed font once for all pages
          const font = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
          const headerText = `${type === 'questions' ? 'Question' : 'Mark Scheme'} ${questionNumber}`;
          const headerFontSize = 14;
          const headerHeight = 35;
          
          pages.forEach((page, pageIndex) => {
            const { width, height } = page.getSize();
            
            console.log(`[PDF Merge] Adding header to page ${pageIndex + 1}, size: ${width}x${height}`);
            
            // Draw header background (PDF coordinates: bottom-left is origin)
            // Fill the entire header area
            page.drawRectangle({
              x: 0,
              y: height - headerHeight,
              width: width,
              height: headerHeight,
              color: rgb(0.85, 0.85, 0.85), // Light gray background
            });
            
            // Draw a border rectangle for the header
            page.drawRectangle({
              x: 0,
              y: height - headerHeight,
              width: width,
              height: headerHeight,
              borderColor: rgb(0.5, 0.5, 0.5),
              borderWidth: 1,
            });
            
            // Draw header text (y position accounts for text baseline)
            // Text baseline is at the y coordinate, so we position it in the middle of the header
            const textY = height - headerHeight + (headerHeight / 2) - (headerFontSize / 3); // Center vertically
            page.drawText(headerText, {
              x: 20,
              y: textY,
              size: headerFontSize,
              color: rgb(0, 0, 0),
              font: font,
            });
            
            // Draw page number if multiple pages
            if (pages.length > 1) {
              const pageNumText = `Page ${pageIndex + 1} of ${pages.length}`;
              const pageNumWidth = font.widthOfTextAtSize(pageNumText, headerFontSize);
              page.drawText(pageNumText, {
                x: width - pageNumWidth - 20,
                y: textY,
                size: headerFontSize,
                color: rgb(0, 0, 0),
                font: font,
              });
            }
            
            mergedPdf.addPage(page);
            console.log(`[PDF Merge] Added page ${pageIndex + 1} with header`);
          });
          
          console.log(`[PDF Merge] Added ${pages.length} pages from PDF for question ${questionNumber} with headers`);
        } else if (fileType === 'image') {
          // Add question number and image
          await addImageToPdf(mergedPdf, absoluteUrl, questionNumber);
          console.log(`[PDF Merge] Added image page for question ${questionNumber}`);
        }
      } catch (error) {
        console.error(`[PDF Merge] Error processing ${fileType} ${fileUrl}:`, error);
        // Continue with other files even if one fails
      }
    }
    
    console.log(`[PDF Merge] Final PDF has ${mergedPdf.getPageCount()} pages`);
    const pdfBytes = await mergedPdf.save();
    return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  };

  // Download merged PDFs for a quiz
  const handleDownloadMergedPDFs = async (
    quiz: MultiQuiz,
    type: 'questions' | 'markschemes',
    loadedQuestions: Question[]
  ) => {
    try {
      // If questions aren't loaded yet, try to load them
      let questions = loadedQuestions;
      if (questions.length === 0 && quiz.loadQuiz && quiz.folderPath) {
        try {
          questions = await quiz.loadQuiz(quiz.folderPath);
        } catch (error) {
          console.error('Error loading questions:', error);
          alert('Failed to load questions. Please try opening the quiz first.');
          return;
        }
      }

      // Filter questions that have the requested file type
      const validQuestions = questions.filter(q => {
        const fileUrl = type === 'questions' ? q.questionContent : q.markScheme;
        const fileType = type === 'questions' ? q.questionContentType : q.markSchemeType;
        return fileUrl && (fileType === 'pdf' || fileType === 'image');
      });

      if (validQuestions.length === 0) {
        alert(`No files found to merge for ${type === 'questions' ? 'questions' : 'mark schemes'}`);
        return;
      }

      // Show non-blocking loading notification
      const loadingNotification = document.createElement('div');
      loadingNotification.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:10000;background:#fff;padding:16px 24px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.15);display:flex;align-items:center;gap:12px;max-width:350px;animation:slideIn 0.3s ease-out;';
      
      // Add keyframe animation for slide in
      const style = document.createElement('style');
      style.textContent = '@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
      
      // Spinner
      const spinner = document.createElement('div');
      spinner.style.cssText = 'width:24px;height:24px;border:3px solid #e5e7eb;border-top:3px solid #3b82f6;border-radius:50%;animation:spin 0.8s linear infinite;flex-shrink:0;';
      
      // Text container
      const textContainer = document.createElement('div');
      textContainer.style.cssText = 'flex:1;';
      
      // Title
      const title = document.createElement('div');
      title.style.cssText = 'font-size:14px;font-weight:600;color:#1f2937;margin-bottom:2px;';
      title.textContent = 'Creating PDF';
      
      // Message
      const message = document.createElement('div');
      message.style.cssText = 'font-size:12px;color:#6b7280;';
      message.textContent = `Merging ${validQuestions.length} file${validQuestions.length !== 1 ? 's' : ''}...`;
      
      textContainer.appendChild(title);
      textContainer.appendChild(message);
      loadingNotification.appendChild(spinner);
      loadingNotification.appendChild(textContainer);
      document.body.appendChild(loadingNotification);

      const mergedBlob = await mergePDFsAndImages(validQuestions, type);
      
      // Remove loading notification
      document.body.removeChild(loadingNotification);
      if (style.parentNode) {
        document.head.removeChild(style);
      }

      const downloadUrl = window.URL.createObjectURL(mergedBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const filename = `${quiz.title.replace(/[^a-z0-9]/gi, '_')}_${type === 'questions' ? 'All_Questions' : 'All_Mark_Schemes'}.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('Failed to merge PDFs. Please try again.');
    }
  };

  // If quizzes prop exists, show menu
  if ('quizzes' in props) {
    const { quizzes } = props;
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
    const [loadingQuizzes, setLoadingQuizzes] = useState<Map<string, boolean>>(new Map());
    const [loadedQuizzes, setLoadedQuizzes] = useState<Map<string, Question[]>>(new Map());
    const [isLoadingMore, setIsLoadingMore] = useState<Map<string, boolean>>(new Map());
    
    const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);
    // Use questions from prop if available (for progressive loading), otherwise use loaded state
    const propQuestions = selectedQuiz?.questions || [];
    const stateQuestions = selectedQuizId ? (loadedQuizzes.get(selectedQuizId) || []) : [];
    // Prefer prop questions (they update incrementally), fall back to state
    const selectedQuizQuestions = propQuestions.length > 0 ? propQuestions : (stateQuestions.length > 0 ? stateQuestions : []);
    // Check loading state from prop, local state, or quiz's isLoading flag
    const stillLoading = selectedQuizId ? (
      selectedQuiz?.isLoading !== undefined ? selectedQuiz.isLoading : 
      (isLoadingMore.get(selectedQuizId) || false)
    ) : false;
    
    // Watch for question updates from props (progressive loading) and sync to state
    useEffect(() => {
      if (selectedQuizId && propQuestions.length > 0) {
        const currentLoaded = loadedQuizzes.get(selectedQuizId) || [];
        // Update state if we have more questions in props
        if (propQuestions.length > currentLoaded.length) {
          setLoadedQuizzes(prev => new Map(prev).set(selectedQuizId, propQuestions));
        }
      }
    }, [selectedQuizId, propQuestions.length]);
    
    // Watch for isLoading changes from props to update local loading state
    useEffect(() => {
      if (selectedQuizId && selectedQuiz) {
        // If quiz is marked as not loading, update local state
        if (selectedQuiz.isLoading === false) {
          setIsLoadingMore(prev => new Map(prev).set(selectedQuizId, false));
        } else if (selectedQuiz.isLoading === true && propQuestions.length > 0) {
          // If still loading and we have questions, keep loading indicator
          setIsLoadingMore(prev => new Map(prev).set(selectedQuizId, true));
        }
      }
    }, [selectedQuizId, selectedQuiz?.isLoading, propQuestions.length]);

    const handleSelectQuiz = async (quiz: MultiQuiz) => {
      setSelectedQuizId(quiz.id);
      
      // If questions already loaded or available in props, skip loading
      if (quiz.questions.length > 0) {
        return;
      }
      
      // Load on demand if callback provided and no questions yet
      if (quiz.loadQuiz && quiz.folderPath) {
        setLoadingQuizzes(prev => new Map(prev).set(quiz.id, true));
        setIsLoadingMore(prev => new Map(prev).set(quiz.id, true));
        
        try {
          // This will return partial results after timeout, but questions are added incrementally via callback
          // Questions will be updated in TopicPage and flow through props
          await quiz.loadQuiz(quiz.folderPath);
          
          // Don't automatically mark as not loading - let the continueLoading promise handle it
          // The isLoading flag from the quiz prop will be updated when loading completes
        } catch (error) {
          console.error('Failed to load quiz:', error);
          setIsLoadingMore(prev => new Map(prev).set(quiz.id, false));
        } finally {
          setLoadingQuizzes(prev => new Map(prev).set(quiz.id, false));
        }
      }
    };

    if (!selectedQuizId) {
      if (quizzes.length === 0) {
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-400 dark:text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Quiz Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">No quiz questions have been added for this topic yet. Help us grow by contributing content!</p>
            <Link to="/contribute" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg">
              Contribute Questions
            </Link>
          </motion.div>
        );
      }
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center flex items-center justify-center gap-2">
            <Trophy className="w-7 h-7 text-blue-500 dark:text-teal-400 mr-2" />
            Select a Quiz
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {quizzes.map(q => {
              const isLoading = loadingQuizzes.get(q.id) || false;
              // Prefer quick count, then loaded count, then questions length
              const questionCount = q.questionCount !== undefined 
                ? q.questionCount 
                : (loadedQuizzes.get(q.id)?.length || q.questions.length);
              
              // Check if this is a single-file download-only quiz
              const firstQuestion = q.questions.length > 0 ? q.questions[0] : null;
              const isDownloadOnly = firstQuestion?.downloadOnly === true;

              // If it's a download-only quiz, show download buttons directly (styled similar to folder-based quizzes)
              if (isDownloadOnly && firstQuestion) {
                return (
                  <div
                    key={q.id}
                    className="flex flex-col p-6 bg-blue-500 dark:bg-blue-900 border border-blue-400 dark:border-teal-900 rounded-2xl shadow hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-6 h-6 text-white opacity-90" />
                      <span className="text-lg font-semibold text-white">
                        {q.title}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 pt-2 border-t border-blue-300/60 dark:border-teal-800/80">
                      {firstQuestion.questionContent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(
                              firstQuestion.questionContent!,
                              getFilenameFromUrl(firstQuestion.questionContent!, `Question_Paper.${firstQuestion.questionContentType === 'pdf' ? 'pdf' : 'png'}`)
                            );
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Question</span>
                        </button>
                      )}
                      {firstQuestion.markScheme && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(
                              firstQuestion.markScheme!,
                              getFilenameFromUrl(firstQuestion.markScheme!, `Mark_Scheme.${firstQuestion.markSchemeType === 'pdf' ? 'pdf' : 'png'}`)
                            );
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 text-xs bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Mark Scheme</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // Regular quiz card (clickable with download options)
              const allQuestions = q.questions.length > 0 ? q.questions : (loadedQuizzes.get(q.id) || []);
              const hasPDFQuestions = allQuestions.some(quest => quest.questionContentType === 'pdf' && quest.questionContent);
              const hasPDFMarkschemes = allQuestions.some(quest => quest.markSchemeType === 'pdf' && quest.markScheme);
              // Show download buttons for folder-based quizzes (they can load questions on demand)
              const isFolderBased = q.folderPath !== undefined;
              
              return (
                <div
                  key={q.id}
                  className="flex flex-col p-6 bg-blue-500 dark:bg-blue-900 border border-blue-400 dark:border-teal-900 rounded-2xl shadow hover:shadow-lg transition-all duration-200"
                >
                  <button
                    className="flex flex-col items-start text-left group disabled:opacity-60 mb-3"
                    onClick={() => handleSelectQuiz(q)}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Trophy className="w-6 h-6 text-white opacity-90 group-hover:opacity-100 transition-opacity" />
                      <span className="text-lg font-semibold text-white group-hover:text-yellow-200 transition-colors">{q.title}</span>
                    </div>
                    <span className="text-sm text-blue-100 dark:text-teal-100 opacity-90">
                      {isLoading ? '⏳ Loading...' : `${questionCount} question${questionCount !== 1 ? 's' : ''}`}
                    </span>
                  </button>
                  
                  {/* Download merged PDFs buttons - show for folder-based quizzes */}
                  {isFolderBased && (
                    <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-blue-400 dark:border-teal-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadMergedPDFs(q, 'questions', allQuestions);
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        title="Download all question papers as merged PDF"
                        disabled={isLoading}
                      >
                        <Download className="w-3 h-3" />
                        <span>All Questions PDF</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadMergedPDFs(q, 'markschemes', allQuestions);
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-xs bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        title="Download all mark schemes as merged PDF"
                        disabled={isLoading}
                      >
                        <Download className="w-3 h-3" />
                        <span>All Mark Schemes PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      );
    }

    // Show selected quiz
    if (!selectedQuiz) return null;
    const isLoading = loadingQuizzes.get(selectedQuiz.id) || false;
    
    return (
      <div>
        <button
          className="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-60"
          onClick={() => setSelectedQuizId(null)}
          disabled={isLoading}
        >
          ← Back to Quiz List
        </button>
        {isLoading && selectedQuizQuestions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading quiz questions...</p>
          </div>
        ) : selectedQuizQuestions.length > 0 ? (
          <div>
            <Quiz questions={selectedQuizQuestions} title={selectedQuiz.title} quizId={selectedQuiz.id} />
            {stillLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3"
              >
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Loading more questions...
                </p>
              </motion.div>
            )}
          </div>
        ) : !isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No questions found for this quiz.</p>
          </div>
        ) : null}
      </div>
    );
  }

  // ...existing code for single quiz below
  const { questions, title, quizId } = props;
  
  // Safety check: ensure questions is a valid array
  if (!Array.isArray(questions)) {
    console.error('Quiz component received invalid questions:', questions);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center"
      >
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-gray-400 dark:text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Quiz</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Invalid quiz data received.</p>
      </motion.div>
    );
  }
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showMarkScheme, setShowMarkScheme] = useState(false);

  const [questionStates, setQuestionStates] = useState<QuestionState[]>(() =>
    questions.map(() => ({ correct: undefined }))
  );

  // Update questionStates when questions array changes (for progressive loading)
  useEffect(() => {
    if (questions.length > questionStates.length) {
      const newStates = [...questionStates];
      for (let i = questionStates.length; i < questions.length; i++) {
        newStates.push({ correct: undefined });
      }
      setQuestionStates(newStates);
    }
  }, [questions.length, questionStates.length]);

  // Store annotation canvas data per question/view (base64 encoded image data)
  const [annotations, setAnnotations] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!quizId) return;
    try {
      const saved = localStorage.getItem(`quiz_states_${quizId}`);
      if (saved) {
        setQuestionStates(JSON.parse(saved));
      }
      const savedAnnotations = localStorage.getItem(`quiz_annotations_${quizId}`);
      if (savedAnnotations) {
        const parsed = JSON.parse(savedAnnotations);
        let entries: any[] = [];
        if (Array.isArray(parsed)) {
          entries = parsed;
        } else if (parsed && typeof parsed === 'object') {
          entries = Object.entries(parsed);
        }

        const normalized: Array<[string, string]> = [];
        for (const entry of entries) {
          // entry may be [key, value]
          let key = entry[0];
          const value = entry[1];
          // Numeric legacy keys (0, "0") -> question key
          if (typeof key === 'number' || (/^[0-9]+$/.test(String(key)) && !String(key).includes('_'))) {
            key = `q${key}_q`;
          } else if (typeof key === 'string' && /^[0-9]+$/.test(key)) {
            key = `q${key}_q`;
          } else if (typeof key === 'string' && !key.includes('_')) {
            // unknown legacy single-string key: keep as-is but cast to string
            key = String(key);
          }
          normalized.push([String(key), String(value)]);
        }

        const normalizedMap = new Map<string, string>(normalized);
        setAnnotations(normalizedMap);
        // Persist normalized map back to localStorage so migration is one-time
        try {
          localStorage.setItem(`quiz_annotations_${quizId}`, JSON.stringify(Array.from(normalizedMap.entries())));
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }
  }, [quizId]);

  useEffect(() => {
    if (!quizId) return;
    try {
      localStorage.setItem(`quiz_states_${quizId}`, JSON.stringify(questionStates));
    } catch (e) {
      // ignore
    }
  }, [questionStates, quizId]);

  useEffect(() => {
    if (!quizId) return;
    try {
      localStorage.setItem(`quiz_annotations_${quizId}`, JSON.stringify(Array.from(annotations.entries())));
    } catch (e) {
      // ignore
    }
  }, [annotations, quizId]);

  const handleMarkCorrect = () => {
    const newStates = [...questionStates];
    newStates[currentQuestion].correct = true;
    setQuestionStates(newStates);
    setShowMarkScheme(false);
  };

  const handleMarkIncorrect = () => {
    const newStates = [...questionStates];
    newStates[currentQuestion].correct = false;
    setQuestionStates(newStates);
    setShowMarkScheme(false);
  };

  const getAnnotationKey = (questionIndex: number, isMarkScheme: boolean): string => {
    return `q${questionIndex}_${isMarkScheme ? 'ms' : 'q'}`;
  };

  const handleSaveAnnotation = (annotationData: string, isMarkScheme: boolean = false) => {
    const key = getAnnotationKey(currentQuestion, isMarkScheme);
    setAnnotations(prev => new Map(prev).set(key, annotationData));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowMarkScheme(false);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowMarkScheme(false);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setQuestionStates(questions.map(() => ({ correct: undefined })));
    setShowMarkScheme(false);
    setIsComplete(false);
  };

  const calculateScore = () => {
    let correct = 0;
    questionStates.forEach((state) => {
      if (state.correct === true) correct += 1;
    });
    return { correct, total: questions.length };
  };

  if (questions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center"
      >
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-gray-400 dark:text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Quiz Available</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">No quiz questions have been added for this topic yet. Help us grow by contributing content!</p>
        <Link to="/contribute" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg">
          Contribute Questions
        </Link>
      </motion.div>
    );
  }

  // Safety check: ensure currentQuestion is valid
  const validCurrentQuestion = Math.min(currentQuestion, questions.length - 1);
  const currentQ = questions[validCurrentQuestion];
  const currentState = questionStates[validCurrentQuestion] || { correct: undefined };

  // Detect if this is a single-file download-only quiz
  // If there's only one question and it has downloadOnly flag set to true, treat as download-only
  const isDownloadOnly = questions.length === 1 && currentQ.downloadOnly === true;

  if (isComplete) {
    const { correct, total } = calculateScore();
    const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Quiz Complete!</h2>
        <div className="text-6xl font-bold text-transparent bg-gradient-to-r from-green-500 to-blue-400 bg-clip-text mb-4">{percentage}%</div>
        <p className="text-xl text-gray-600 dark:text-gray-200 mb-8">You marked {correct} out of {total} questions as correct</p>
        <button onClick={handleReset} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg">
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry Quiz
        </button>
      </motion.div>
    );
  }

  // Download-only mode: show simple download interface
  if (isDownloadOnly) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <Link to="/contact" className="p-2 text-gray-400 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Report Quiz">
              <Flag className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {currentQ.title || 'Download Files'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Click the buttons below to download the question paper and mark scheme
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {currentQ.questionContent && (
              <button
                onClick={() => handleDownload(
                  currentQ.questionContent!,
                  getFilenameFromUrl(currentQ.questionContent!, `Question_Paper.${currentQ.questionContentType === 'pdf' ? 'pdf' : 'png'}`)
                )}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[200px] justify-center"
                title="Download question paper"
              >
                <Download className="w-5 h-5" />
                <span className="font-semibold">Download Question Paper</span>
              </button>
            )}
            {currentQ.markScheme && (
              <button
                onClick={() => handleDownload(
                  currentQ.markScheme!,
                  getFilenameFromUrl(currentQ.markScheme!, `Mark_Scheme.${currentQ.markSchemeType === 'pdf' ? 'pdf' : 'png'}`)
                )}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[200px] justify-center"
                title="Download mark scheme"
              >
                <Download className="w-5 h-5" />
                <span className="font-semibold">Download Mark Scheme</span>
              </button>
            )}
          </div>

          {!currentQ.questionContent && !currentQ.markScheme && (
            <div className="text-center mt-8">
              <p className="text-gray-500 dark:text-gray-400">No files available for download</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Normal multi-question quiz mode
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <Link to="/contact" className="p-2 text-gray-400 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Report Quiz">
            <Flag className="w-4 h-4" />
          </Link>
        </div>

        {/* Navigation at the top */}
        <div className="flex justify-between mb-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 dark:from-blue-800 to-teal-500 dark:to-teal-700 text-white rounded-lg hover:from-blue-600 hover:to-teal-600"
          >
            {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Question {currentQuestion + 1} of {questions.length}</p>
        {currentState.correct !== undefined && (
          <p className="text-sm mt-2 font-semibold" style={{ color: currentState.correct ? '#22c55e' : '#ef4444' }}>
            {currentState.correct ? '✓ Marked as Correct' : '✗ Marked as Incorrect'}
          </p>
        )}
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          {currentQ.title && <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{currentQ.title}</h3>}
        </div>

        {/* Question Content Display (with optional side-by-side mark scheme) */}
        <div className="mb-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          {currentQ.questionContent ? (
            <QuestionViewTracker questionId={currentQ.id || `quiz_${quizId || title}_${currentQuestion}`}>
              <MediaViewer
                url={currentQ.questionContent}
                type={(currentQ.questionContentType || 'pdf') as 'pdf' | 'image'}
                markSchemeUrl={currentQ.markScheme}
                markSchemeType={(currentQ.markSchemeType || 'pdf') as 'pdf' | 'image'}
                hasMarkScheme={Boolean(currentQ.markScheme)}
                markSchemeOpen={showMarkScheme}
                onToggleMarkScheme={(open: boolean) => setShowMarkScheme(open)}
                onMarkCorrect={handleMarkCorrect}
                onMarkIncorrect={handleMarkIncorrect}
                showMarkingButtons={true}
                savedAnnotation={annotations.get(getAnnotationKey(currentQuestion, false))}
                savedMarkSchemeAnnotation={annotations.get(getAnnotationKey(currentQuestion, true))}
                onSaveAnnotation={(data) => handleSaveAnnotation(data, false)}
                onSaveMarkSchemeAnnotation={(data) => handleSaveAnnotation(data, true)}
                questionList={questions}
                questionIndex={currentQuestion}
                onChangeQuestion={(i) => setCurrentQuestion(i)}
              />
            </QuestionViewTracker>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No question content provided</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Quiz;
