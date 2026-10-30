/**
 * Quiz Loader Utility
 * Dynamically loads quizzes from folder structures
 * Supports PDF and image files (Q*.pdf/png, MS*.pdf/png pairs)
 * Implements R2 fallback for file resolution
 */

import { getBlobUrl, getBlobUrlSync, isBlobMappingLoaded } from './blobUrl';
import { resolveFromR2, fetchR2AsBlob } from './r2Utils';

export interface Question {
  id: string;
  questionContent?: string;
  questionContentType?: 'image' | 'pdf';
  markScheme?: string;
  markSchemeType?: 'image' | 'pdf';
  title?: string;
  downloadOnly?: boolean; // If true, show download buttons instead of viewer
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  isLoading?: boolean; // Indicates if more questions are still loading
}

// Cache for loaded quizzes to speed up subsequent loads
const quizCache = new Map<string, Promise<Quiz>>();

// Timeouts (ms) — configurable defaults for file checks and progressive loader
export const DEFAULT_FILE_CHECK_TIMEOUT_MS = 2000; // increased from 300ms for flaky servers
export const DEFAULT_PROGRESSIVE_TIMEOUT_MS = 1; // keep the UI responsive; no artificial wait before returning partial results

// Simple in-memory cache for file existence checks to avoid duplicate network requests
const fileExistsCache = new Map<string, boolean>();

/**
 * Checks if a file exists by attempting fetch with timeout and R2 fallback
 * For Questions paths, checks R2 first since files are stored there
 * Uses GET instead of HEAD to avoid SPA/index.html fallbacks
 * @param filePath - Path to the file
 * @returns boolean - true if file exists, false otherwise
 */
async function fileExists(filePath: string): Promise<boolean> {
  // Fast-path: cached answer
  if (fileExistsCache.has(filePath)) {
    return fileExistsCache.get(filePath)!;
  }

  // For Questions paths, check R2 first since files are stored there
  if (filePath.includes('/Questions/')) {
    try {
      const r2Url = await resolveFromR2(filePath);
      if (r2Url && r2Url !== filePath) {
        console.log(`[fileExists] Checking R2 for Questions path: ${r2Url}`);
        try {
          // Try HEAD request first (lighter weight)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), DEFAULT_FILE_CHECK_TIMEOUT_MS);
          
          try {
            const headResponse = await fetch(r2Url, { 
              method: 'HEAD', 
              signal: controller.signal 
            });
            clearTimeout(timeoutId);
            
            if (headResponse.ok) {
              const contentType = (headResponse.headers.get('content-type') || '').toLowerCase();
              const isValidType = contentType.includes('application/pdf') || contentType.startsWith('image/');
              console.log(`[fileExists] R2 HEAD check: exists=${isValidType}, type: ${contentType}`);
              fileExistsCache.set(filePath, isValidType);
              return isValidType;
            }
          } catch (headErr) {
            clearTimeout(timeoutId);
            // HEAD might fail due to CORS, try blob fetch instead
            console.log(`[fileExists] R2 HEAD failed (likely CORS), trying blob fetch: ${(headErr as Error).message}`);
          }
          
          // Fallback: Try to fetch as blob to check existence (handles CORS)
          const blob = await fetchR2AsBlob(r2Url);
          if (blob) {
            // Check if it's a valid PDF or image by checking blob type
            const isValidType = blob.type.includes('pdf') || blob.type.startsWith('image/');
            console.log(`[fileExists] R2 blob check: exists=${isValidType}, type: ${blob.type}`);
            fileExistsCache.set(filePath, isValidType);
            return isValidType;
          }
        } catch (r2Err) {
          console.log(`[fileExists] R2 fetch failed, will try local: ${(r2Err as Error).message}`);
        }
      }
    } catch (r2ResolveErr) {
      console.log(`[fileExists] R2 resolution failed, will try local: ${(r2ResolveErr as Error).message}`);
    }
  }

  const maxAttempts = 2; // retry once on transient errors/timeouts
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      // Use GET and check Content-Type to avoid SPA/index.html fallbacks
      // Some dev servers return 200 for unknown asset paths and serve index.html
      // which would cause a HEAD request to return ok but the resource isn't a PDF/image.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_FILE_CHECK_TIMEOUT_MS);

      console.log(`[fileExists] Attempt ${attempt}: Fetching ${filePath}`);
      const response = await fetch(filePath, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);

      console.log(`[fileExists] Response status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

      if (!response.ok) {
        // For Questions paths, if local fails, we already tried R2 above
        // For non-Questions paths, this is expected
        console.log(`[fileExists] File not found (status ${response.status}): ${filePath}`);
        fileExistsCache.set(filePath, false);
        return false;
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const exists = contentType.includes('application/pdf') || contentType.startsWith('image/');
      console.log(`[fileExists] Content-Type check: exists=${exists}, contentType=${contentType}`);
      fileExistsCache.set(filePath, exists);
      return exists;
    } catch (err) {
      // If it was an abort (timeout) or other transient error, retry once
      const name = (err as any)?.name;
      const isAbort = name === 'AbortError' || name === 'DOMException';
      console.log(`[fileExists] Error attempt ${attempt}: ${name} - ${(err as any)?.message}`);
      if (attempt < maxAttempts) {
        console.warn(`[Quiz Loader] fileExists attempt ${attempt} for ${filePath} failed (${name}). Retrying...`);
        continue; // retry
      }

      // Final failure – cache negative result to avoid repeated failing requests
      console.warn(`[Quiz Loader] fileExists final failure for ${filePath}:`, err);
      fileExistsCache.set(filePath, false);
      return false;
    }
  }

  // Shouldn't reach here, but be safe
  fileExistsCache.set(filePath, false);
  return false;
}

// Cache for question counts to avoid repeated checks
const questionCountCache = new Map<string, Promise<number>>();

/**
 * Quickly counts the number of questions in a folder by checking Q*.ext files
 * Uses parallel checks with short timeout and stops after 3 consecutive misses
 * @param folderPath - Path to the folder
 * @returns Promise resolving to the number of questions found
 */
export async function countQuestionsInFolder(folderPath: string): Promise<number> {
  // Return cached count if available
  const cacheKey = folderPath;
  if (questionCountCache.has(cacheKey)) {
    return questionCountCache.get(cacheKey)!;
  }

  const promise = (async () => {
    const maxQuestions = 50;
    const exts = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
    let count = 0;
    let consecutiveMissing = 0;
    const maxConsecutiveMissing = 3;

    // Check questions in batches for faster counting
    const batchSize = 10;
    
    for (let batchStart = 1; batchStart <= maxQuestions && consecutiveMissing < maxConsecutiveMissing; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, maxQuestions);
      const batchPromises: Promise<boolean>[] = [];
      
      // Check all questions in this batch in parallel
      for (let i = batchStart; i <= batchEnd; i++) {
        // Try all extensions in parallel for each question
        const extPromises = exts.map(async (ext) => {
          const tryPath = `${folderPath}/Q${i}.${ext}`;
          return await fileExists(tryPath);
        });
        
        batchPromises.push(
          Promise.all(extPromises).then(results => results.some(r => r))
        );
      }

      const batchResults = await Promise.all(batchPromises);
      
      // Count found questions and track consecutive misses
      for (let i = 0; i < batchResults.length; i++) {
        if (batchResults[i]) {
          count++;
          consecutiveMissing = 0; // Reset counter when we find a question
        } else {
          consecutiveMissing++;
          if (consecutiveMissing >= maxConsecutiveMissing) {
            // Stop early if we hit the limit
            break;
          }
        }
      }
    }

    return count;
  })();

  questionCountCache.set(cacheKey, promise);
  return promise;
}

/**
 * Attempts to load quiz from manifest.json if it exists
 * This is faster than probing individual files
 * Checks both local and R2 for manifest files
 * @param folderPath - Path to the folder
 * @param quizTitle - Title for the quiz
 * @returns Quiz if manifest exists and is valid, otherwise null
 */
async function loadQuizFromManifest(folderPath: string, quizTitle: string): Promise<Quiz | null> {
  try {
    const manifestPath = `${folderPath}/manifest.json`;
    console.log(`[Quiz Loader] Trying to load manifest from: ${manifestPath}`);
    
    let response: Response | null = null;
    
    // For Questions paths, check R2 first (where manifests are stored)
    if (manifestPath.includes('/Questions/')) {
      console.log(`[Quiz Loader] Questions path detected, checking R2 first for manifest: ${manifestPath}`);
      const r2Url = await resolveFromR2(manifestPath);
      if (r2Url && r2Url !== manifestPath) {
        console.log(`[Quiz Loader] Attempting to load manifest from R2: ${r2Url}`);
        try {
          response = await fetch(r2Url);
          if (response.ok) {
            console.log(`[Quiz Loader] Successfully loaded manifest from R2`);
          } else {
            console.log(`[Quiz Loader] R2 manifest not found (${response.status}), trying local: ${manifestPath}`);
            response = null; // Reset to try local
          }
        } catch (r2Err) {
          console.log(`[Quiz Loader] R2 manifest fetch failed, trying local:`, r2Err);
          response = null; // Reset to try local
        }
      }
    }
    
    // If R2 didn't work or it's not a Questions path, try local
    if (!response) {
      try {
        response = await fetch(manifestPath);
      } catch (localErr) {
        console.log(`[Quiz Loader] Local manifest fetch failed:`, localErr);
      }
    }
    
    if (!response || !response.ok) {
      console.log(`[Quiz Loader] Manifest not found (${response?.status || 'network error'}): ${manifestPath}`);
      return null;
    }

    const manifest = await response.json();
    console.log(`[Quiz Loader] Manifest loaded successfully with ${manifest.questions?.length || 0} questions`);
    
    // Validate manifest structure
    if (!Array.isArray(manifest.questions)) {
      console.warn(`[Quiz Loader] Manifest has invalid structure (no questions array)`);
      return null;
    }

    // Map manifest questions to Question objects
    // Resolve paths through getBlobUrl() to get R2 URLs for Questions directory files
    const questions: Question[] = await Promise.all(
      manifest.questions.map(async (q: any) => ({
        id: q.id || `q${Math.random()}`,
        questionContent: q.questionContent ? await getBlobUrl(q.questionContent) : undefined,
        questionContentType: q.questionContentType || 'pdf',
        markScheme: q.markScheme ? await getBlobUrl(q.markScheme) : undefined,
        markSchemeType: q.markSchemeType,
        title: q.title || 'Question'
      }))
    );

    return {
      id: `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: quizTitle,
      questions,
      isLoading: false
    };
  } catch (error) {
    console.log(`[Quiz Loader] Error loading manifest:`, error);
    return null;
  }
}


/**
 * Loads quizzes progressively with a timeout to show partial results
 * After the timeout, returns partial results while continuing to load in background
 * @param folderPath - Path to the folder
 * @param quizTitle - Title for the quiz
 * @param onQuestionFound - Callback when a question is found (for progressive loading)
 * @param timeoutMs - Timeout in ms before returning partial results (default: `DEFAULT_PROGRESSIVE_TIMEOUT_MS`)
 * @returns Promise that resolves with partial results after timeout, then continues loading
 */
export async function loadQuizFromFolderProgressive(
  folderPath: string,
  quizTitle: string,
  onQuestionFound?: (question: Question) => void,
  timeoutMs: number = DEFAULT_PROGRESSIVE_TIMEOUT_MS
): Promise<{ quiz: Quiz; continueLoading: Promise<Quiz> }> {
  const cacheKey = folderPath;
  
  // Return cached quiz if available
  if (quizCache.has(cacheKey)) {
    const cached = await quizCache.get(cacheKey)!;
    return { quiz: cached, continueLoading: Promise.resolve(cached) };
  }

  // Try loading from manifest first - it's much faster than probing individual files
  console.log(`[Quiz Loader] Attempting to load from manifest for ${folderPath}`);
  const manifestQuiz = await loadQuizFromManifest(folderPath, quizTitle);
  if (manifestQuiz && manifestQuiz.questions.length > 0) {
    console.log(`[Quiz Loader] Successfully loaded ${manifestQuiz.questions.length} questions from manifest`);
    // Call onQuestionFound for each question as if they were found progressively
    if (onQuestionFound) {
      for (const question of manifestQuiz.questions) {
        onQuestionFound(question);
      }
    }
    // Cache and return the manifest-loaded quiz immediately
    quizCache.set(cacheKey, Promise.resolve(manifestQuiz));
    return {
      quiz: manifestQuiz,
      continueLoading: Promise.resolve(manifestQuiz)
    };
  }

  // Manifest not available - this is expected for some quiz folders
  // Instead of probing files (which creates excessive network requests),
  // return an empty quiz with a clear message
  console.warn(`[Quiz Loader] Manifest not available for ${folderPath} - skipping file probing to avoid excessive network requests`);
  
  const emptyQuiz: Quiz = {
    id: `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: quizTitle,
    questions: [],
    isLoading: false
  };
  
  quizCache.set(cacheKey, Promise.resolve(emptyQuiz));
  return {
    quiz: emptyQuiz,
    continueLoading: Promise.resolve(emptyQuiz)
  };
}

/**
 * Creates a single-file download-only quiz
 * This is for cases where you have one PDF file and optionally one markscheme file
 * @param questionFile - Path to the question PDF file
 * @param markSchemeFile - Optional path to the markscheme PDF file
 * @param quizTitle - Title for the quiz
 * @returns Quiz object with a single question marked as downloadOnly
 */
export async function createSingleFileQuiz(
  questionFile: string,
  markSchemeFile?: string,
  quizTitle: string = 'Download Files'
): Promise<Quiz> {
  const question: Question = {
    id: 'q1',
    questionContent: await getBlobUrl(questionFile),
    questionContentType: questionFile.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
    markScheme: markSchemeFile ? await getBlobUrl(markSchemeFile) : undefined,
    markSchemeType: markSchemeFile ? (markSchemeFile.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image') : undefined,
    title: quizTitle,
    downloadOnly: true
  };

  return {
    id: `quiz-single-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: quizTitle,
    questions: [question]
  };
}

/**
 * Derives a mark scheme URL from a question URL by replacing Q with MS.
 *
 * For example:
 * - /Questions/igcse/chem/q1/Q1.pdf -> /Questions/igcse/chem/q1/MS1.pdf
 * - /Questions/alevel/phy/Paper_Q.pdf -> /Questions/alevel/phy/Paper_MS.pdf
 *
 * If the URL already includes query parameters, they are preserved.
 */
export function deriveMarkSchemeUrl(questionUrl?: string | null): string | null {
  if (!questionUrl) return null;

  try {
    const [base, query] = questionUrl.split('?');
    const lastSlash = base.lastIndexOf('/');
    const dir = lastSlash >= 0 ? base.slice(0, lastSlash + 1) : '';
    const file = lastSlash >= 0 ? base.slice(lastSlash + 1) : base;

    const match = file.match(/^(.+)\.(pdf|png|jpg|jpeg)$/i);
    const name = match ? match[1] : file;
    const ext = match ? match[2] : '';

    let msName = name;

    // Prefer replacing the trailing 'Q' or '_Q' pattern so we don't accidentally replace
    // letters in the rest of the filename.
    if (/_Q(\d*)$/i.test(name)) {
      msName = name.replace(/_Q(\d*)$/i, '_MS$1');
    } else if (/Q(\d*)$/i.test(name)) {
      msName = name.replace(/Q(\d*)$/i, 'MS$1');
    } else if (/Q$/i.test(name)) {
      msName = name.replace(/Q$/i, 'MS');
    } else {
      // Fallback: replace all Q's (case-insensitive) - may be noisy but is better than nothing
      msName = name.replace(/Q/gi, 'MS');
    }

    const extensionPart = ext ? `.${ext}` : '';
    const queryPart = query ? `?${query}` : '';
    return `${dir}${msName}${extensionPart}${queryPart}`;
  } catch {
    return null;
  }
}



