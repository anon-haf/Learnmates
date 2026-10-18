import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clock,
  FlaskConical,
  Dna,
  Rocket,
  User,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Plus,
  Menu,
  X,
  Trash2,
  Paperclip,
  ImagePlus,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import { fetchProfile } from '../utils/profileSync';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui';
import UniversalDocumentViewer from '../components/UniversalDocumentViewer';
import { deriveMarkSchemeUrl } from '../utils/quizLoader';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './AiChat.css';
import NibrasIcon from '../assets/logos/nibras.svg?react';
import Nibras1Icon from '../assets/logos/nibras 1.svg?react';
import Nibras2Icon from '../assets/logos/nibras 2.svg?react';

// Stacked, same-center breathing swap of the two Nibras marks.
// Both SVGs use `currentColor`, so they inherit the parent's text color.
// Pure CSS animation (single keyframes + negative half-period delay, see
// index.css `.nibras-breathe-layer`) runs on the compositor for a smooth,
// drift-free loop pinned to the shared center. Used for the AI loading state.
const NibrasAnimatedMark: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <span className={`relative grid shrink-0 place-items-center ${className}`} aria-hidden="true">
    <span className="nibras-breathe-layer h-full w-full">
      <Nibras1Icon className="block h-full w-full" />
    </span>
    <span className="nibras-breathe-layer nibras-breathe-layer--alt h-full w-full">
      <Nibras2Icon className="block h-full w-full" />
    </span>
  </span>
);

/* ─── Types ───────────────────────────────────────────── */
interface AskResponse {
  answer: string;
  topics?: { book_topics?: string[]; pp_topics?: string[]; syllabus_topics?: string[] };
  past_paper_sources?: string[];
  seconds?: number;
  timing_ms?: {
    total?: number;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  response?: AskResponse;
  displayedLen?: number;
  isError?: boolean;
  originalQuestion?: string;
  attachments?: { name: string; file?: File; isImage?: boolean }[];
}

interface ChatSession {
  id: string;
  title: string;
  subject?: string;
  created_at: string;
}

interface PastPaperDocument {
  name: string;
  questionPath: string;
}

const SUBJECTS = [
  { value: 'IG_Phy', label: 'IGCSE Physics', shortLabel: 'IG Phy', icon: Rocket, theme: 'physics', level: 'IGCSE', subjectName: 'Physics' },
  { value: 'A_Phy', label: 'A-Level Physics', shortLabel: 'AL Phy', icon: Rocket, theme: 'physics', level: 'A-Level', subjectName: 'Physics' },
  { value: 'IG_Chem', label: 'IGCSE Chemistry', shortLabel: 'IG Chem', icon: FlaskConical, theme: 'chemistry', level: 'IGCSE', subjectName: 'Chemistry' },
  { value: 'A_Chem', label: 'A-Level Chemistry', shortLabel: 'AL Chem', icon: FlaskConical, theme: 'chemistry', level: 'A-Level', subjectName: 'Chemistry' },
  { value: 'IG_Bio', label: 'IGCSE Biology', shortLabel: 'IG Bio', icon: Dna, theme: 'biology', level: 'IGCSE', subjectName: 'Biology' },
  { value: 'A_Bio', label: 'A-Level Biology', shortLabel: 'AL Bio', icon: Dna, theme: 'biology', level: 'A-Level', subjectName: 'Biology' },
  { value: 'IAL_Chem', label: 'Edexcel IAL Chemistry', shortLabel: 'IAL Chem', icon: FlaskConical, theme: 'chemistry', level: 'IAL', subjectName: 'Chemistry' },
  { value: 'IAL_Phy', label: 'Edexcel IAL Physics', shortLabel: 'IAL Phy', icon: Rocket, theme: 'physics', level: 'IAL', subjectName: 'Physics' },
  { value: 'IAL_Bio', label: 'Edexcel IAL Biology', shortLabel: 'IAL Bio', icon: Dna, theme: 'biology', level: 'IAL', subjectName: 'Biology' },
] as const;

function getPastPaperDocument(subjectValue: string, sourceName: string): PastPaperDocument | null {
  const subject = SUBJECTS.find(item => item.value === subjectValue);
  const cleanSource = sourceName.trim();
  if (
    !subject ||
    !cleanSource.toLowerCase().endsWith('.pdf')
  ) {
    return null;
  }

  const level = subject.level === 'IGCSE' ? 'igcse' : 'a-level';
  const board = subject.level === 'IAL' ? 'edexcel' : 'cambridge';
  const subjectPath = subject.subjectName;
  let questionPath: string;

  if (/^https?:\/\//i.test(cleanSource)) {
    try {
      const url = new URL(cleanSource);
      if (url.hostname !== 'assets.learnmates.org' || !url.pathname.startsWith('/topicals/')) return null;
      const pathParts = url.pathname.split('/');
      if (pathParts.length < 7) return null;
      if (pathParts.some(part => decodeURIComponent(part) === '..' || decodeURIComponent(part) === '.')) return null;
      pathParts[4] = subjectPath;
      url.pathname = pathParts.join('/');
      questionPath = url.toString();
    } catch {
      return null;
    }
  } else {
    const relativePath = cleanSource.replace(/^\/+/, '');
    const pathParts = relativePath.split('/');
    if (pathParts.some(part => part === '..' || part === '')) return null;

    if (pathParts[0] === 'topicals') {
      if (pathParts.length < 6) return null;
      pathParts[3] = subjectPath;
      questionPath = `/${pathParts.join('/')}`;
    } else {
      const sourcePath = relativePath.includes('/')
        ? relativePath
        : `${subjectPath}/${relativePath}`;
      questionPath = `/topicals/${level}/${board}/${subjectPath}/${sourcePath}`;
    }
  }

  return { name: sourceName, questionPath };
}

function getPastPaperDisplayName(sourceName: string): string {
  let fileName = sourceName.trim();
  try {
    const parsedUrl = new URL(fileName);
    fileName = parsedUrl.pathname.split('/').pop() || fileName;
  } catch {
    fileName = fileName.split(/[?#]/, 1)[0].split('/').pop() || fileName;
  }
  try {
    fileName = decodeURIComponent(fileName);
  } catch {
    // Keep the source filename intact if it contains malformed URL encoding.
  }

  return fileName
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const isImageAttachment = (file: File): boolean =>
  IMAGE_EXTENSIONS.has(file.name.split('.').pop()?.toLowerCase() || '');

const ImageAttachmentPreview: React.FC<{
  file: File;
  className?: string;
  onExpand?: (file: File) => void;
}> = ({ file, className = '', onExpand }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <button
      type="button"
      onClick={() => onExpand?.(file)}
      className={`relative inline-flex h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800 ${className}`}
      title={file.name}
      aria-label={file.name}
      disabled={!onExpand}
    >
      {previewUrl && <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />}
    </button>
  );
};

const ExpandedImageDialog: React.FC<{ file: File; onClose: () => void }> = ({ file, onClose }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Image preview: ${file.name}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image preview"
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
      >
        <X size={22} />
      </button>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={file.name}
          className="max-h-[90vh] max-w-[95vw] object-contain"
          onClick={event => event.stopPropagation()}
        />
      )}
      <span className="sr-only">{file.name}</span>
    </div>
  );
};

/* ─── KaTeX + Markdown helpers ───────────────────────── */
function escapeHtml(value: string): string {
  const escapedCharacters: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, char => escapedCharacters[char]);
}

function formatAnswer(raw: string): { html: string; pastPaperPaths: string[] } {
  const pastPaperPaths: string[] = [];
  raw = raw.replace(/\[\[(?:pp:)?(.+?)\]\]/g, (_match, source: string) => {
    pastPaperPaths.push(source.trim());
    return `%%PAST_PAPER_${pastPaperPaths.length - 1}%%`;
  });
  raw = raw.replace(/\[\[(?:pp:)?[^\]]*$/g, '');

  // 1. Extract all math blocks, replace with placeholders so markdown won't touch them
  const placeholders: { html: string; display: boolean }[] = [];
  const placeholder = (tex: string, display: boolean): string => {
    try {
      placeholders.push({
        html: katex.renderToString(tex.trim(), { displayMode: display, throwOnError: false }),
        display,
      });
    } catch {
      placeholders.push({ html: `<code>${tex}</code>`, display });
    }
    return `%%MATH_${placeholders.length - 1}%%`;
  };

  raw = raw.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => placeholder(tex, true));
  raw = raw.replace(/\\\[([\s\S]+?)\\\]/g, (_m, tex) => placeholder(tex, true));
  raw = raw.replace(/\\\(([\s\S]+?)\\\)/g, (_m, tex) => placeholder(tex, false));
  raw = raw.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_m, tex) => placeholder(tex, false));

  // 2. Extract fenced code blocks FIRST so no markdown rule corrupts their content
  const preBlocks: string[] = [];
  raw = raw.replace(/```(?:\w+)?\n?([\s\S]*?)```/g, (_m, inner) => {
    preBlocks.push(inner);
    return `%%PRE_${preBlocks.length - 1}%%`;
  });

  raw = escapeHtml(raw);
  for (let index = 0; index < preBlocks.length; index++) {
    preBlocks[index] = escapeHtml(preBlocks[index]);
  }

  // 3. Markdown → HTML
  let html = raw;
  const inlineCodeBlocks: string[] = [];
  html = html.replace(/`([^`]+)`/g, (_match, code: string) => {
    inlineCodeBlocks.push(code);
    return `%%INLINE_CODE_${inlineCodeBlocks.length - 1}%%`;
  });
  html = html.replace(/\b([A-Za-z][A-Za-z0-9]*)_([A-Za-z0-9]+)\b/g, '$1<sub>$2</sub>');
  html = html.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾]+)/g, '<sup>$1</sup>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  html = html.replace(/^\d+\. (.+)$/gm, '<ol-item>$1</ol-item>');
  html = html.replace(/((?:<ol-item>[^\n]*<\/ol-item>\n?)+)/g, (m) =>
    '<ol>' + m.replace(/<ol-item>/g, '<li>').replace(/<\/ol-item>/g, '</li>') + '</ol>'
  );

  const lines = html.split('\n');
  const newLines = [];
  let inTable = false;
  let hasTbody = false;
  let tableHtml = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHtml = '<div class="table-container"><table class="markdown-table">';
        hasTbody = false;
      }
      
      if (/^\|[\s-:]+\|$/.test(line)) {
        if (!hasTbody) {
          tableHtml += '<tbody>';
          hasTbody = true;
        }
        continue;
      }
      
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      const isHeaderRow = !hasTbody && i + 1 < lines.length && /^\|[\s-:]+\|$/.test(lines[i + 1].trim());
      const cellTag = isHeaderRow ? 'th' : 'td';
      
      const rowHtml = '<tr>' + cells.map(c => `<${cellTag}>${c}</${cellTag}>`).join('') + '</tr>';
      
      if (isHeaderRow) {
        tableHtml += '<thead>' + rowHtml + '</thead>';
      } else {
        tableHtml += rowHtml;
      }
    } else {
      if (inTable) {
        if (hasTbody) tableHtml += '</tbody>';
        tableHtml += '</table></div>';
        newLines.push(tableHtml);
        inTable = false;
        hasTbody = false;
        tableHtml = "";
      }
      newLines.push(lines[i]); 
    }
  }
  if (inTable) {
    if (hasTbody) tableHtml += '</tbody>';
    tableHtml += '</table></div>';
    newLines.push(tableHtml);
  }
  html = newLines.join('\n');

  html = html.replace(/\n{2,}/g, '<div style="height: 0.5rem; width: 100%"></div>');
  html = html.replace(/\n/g, '<br/>');

  html = html.replace(/%%PRE_(\d+)%%/g, (_m, idx) => `<pre><code class="code-block">${preBlocks[Number(idx)]}</code></pre>`);
  html = html.replace(/%%INLINE_CODE_(\d+)%%/g, (_m, idx) => `<code>${inlineCodeBlocks[Number(idx)]}</code>`);

  html = html.replace(/((?:<br\/>|<div[^>]*><\/div>|\s)*)(%%MATH_(\d+)%%)((?:<br\/>|<div[^>]*><\/div>|\s)*)/g, (match, prefix, placeholder, idxStr, suffix) => {
    const p = placeholders[Number(idxStr)];
    if (p.display) {
      return p.html; 
    }
    return prefix + p.html + suffix;
  });

  return { html, pastPaperPaths };
}

const MAX_QUESTION_LENGTH = 4000;
const MAX_FILES = 5;
const MAX_IMAGES = 4;
const getMockConsentStorageKey = (userId: string) => `nibras_disclosure_accepted:${userId}`;
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const DOCUMENT_MAX_SIZE = 15 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);
const DOCUMENT_EXTENSIONS = new Set(['pdf', 'docx', 'txt', 'md', 'csv', 'json', 'tsv']);
const CHAT_ATTACHMENT_DATABASE = 'learnmates-ai-chat-attachments';
const CHAT_ATTACHMENT_STORE = 'message-files';

function openChatAttachmentDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(CHAT_ATTACHMENT_DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(CHAT_ATTACHMENT_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local attachment storage.'));
    request.onblocked = () => reject(new Error('Local attachment storage is blocked by another tab.'));
  });
}

async function storeChatAttachments(key: string, files: File[]): Promise<void> {
  const database = await openChatAttachmentDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(CHAT_ATTACHMENT_STORE, 'readwrite');
    transaction.objectStore(CHAT_ATTACHMENT_STORE).put(files, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save attachments locally.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Local attachment storage was interrupted.'));
  }).finally(() => database.close());
}

async function readChatAttachments(key: string): Promise<File[]> {
  const database = await openChatAttachmentDatabase();
  return new Promise<File[]>((resolve, reject) => {
    const transaction = database.transaction(CHAT_ATTACHMENT_STORE, 'readonly');
    const request = transaction.objectStore(CHAT_ATTACHMENT_STORE).get(key);
    request.onsuccess = () => resolve(
      Array.isArray(request.result)
        ? request.result.filter((item: unknown): item is File => item instanceof File)
        : [],
    );
    request.onerror = () => reject(request.error ?? new Error('Could not read locally stored attachments.'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => database.close();
    transaction.onabort = () => database.close();
  });
}

function validateAttachment(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || (!IMAGE_EXTENSIONS.has(extension) && !DOCUMENT_EXTENSIONS.has(extension))) {
    return `${file.name} is not a supported file type.`;
  }

  const maxSize = IMAGE_EXTENSIONS.has(extension) ? IMAGE_MAX_SIZE : DOCUMENT_MAX_SIZE;
  if (file.size > maxSize) {
    const maxSizeLabel = IMAGE_EXTENSIONS.has(extension) ? '5 MB' : '15 MB';
    return `${file.name} exceeds the ${maxSizeLabel} limit.`;
  }

  return null;
}

function getErrorDetail(detail: unknown): string | null {
  if (typeof detail === 'string') return detail;
  if (!Array.isArray(detail)) return null;

  const messages = detail.map((item: unknown) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string') return item.msg;
    return null;
  }).filter((message): message is string => !!message);

  return messages.length ? messages.join(' ') : null;
}

function getStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getAskResponse(value: unknown): AskResponse | undefined {
  if (!isRecord(value) || typeof value.answer !== 'string') return undefined;
  const topics = isRecord(value.topics) ? value.topics : null;
  const timing = isRecord(value.timing_ms) ? value.timing_ms : null;
  return {
    answer: value.answer,
    topics: topics ? {
      book_topics: getStringArray(topics.book_topics),
      pp_topics: getStringArray(topics.pp_topics),
      syllabus_topics: getStringArray(topics.syllabus_topics),
    } : undefined,
    past_paper_sources: getStringArray(value.past_paper_sources),
    seconds: typeof value.seconds === 'number' ? value.seconds : undefined,
    timing_ms: typeof timing?.total === 'number' ? { total: timing.total } : undefined,
  };
}

/* ─── Framer motion variants ─────────────────────────── */
const msgVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ─── Component ──────────────────────────────────────── */
const AiChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  
  // Section Management
  const [activeSections, setActiveSections] = useState<string[]>(() => {
    const saved = localStorage.getItem('ai_chat_sections');
    return saved ? JSON.parse(saved) : ['A_Phy'];
  });
  const [activeSubjectValue, setActiveSubjectValue] = useState<string>(activeSections[0] || 'A_Phy');
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<File | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copyErrorMessageId, setCopyErrorMessageId] = useState<string | null>(null);
  const [markSchemeVisible, setMarkSchemeVisible] = useState<Record<string, boolean>>({});
  const [pastPaperExpanded, setPastPaperExpanded] = useState<Record<string, boolean>>({});
  const [selectedBoard, setSelectedBoard] = useState<'cambridge' | 'edexcel'>('cambridge');
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user: authUser, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(authUser?.id);
  const [consentStatus, setConsentStatus] = useState<'loading' | 'required' | 'accepted' | 'error'>('loading');
  const [consentUserId, setConsentUserId] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [consentSaving, setConsentSaving] = useState(false);
  const [consentRetry, setConsentRetry] = useState(0);
  const [consentChecked, setConsentChecked] = useState(false);
  const location = useLocation();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typewriterRef = useRef<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fetchingSessions, setFetchingSessions] = useState(true);

  // Custom confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  useEffect(() => {
    if (authUser) {
      fetchProfile(authUser.id).then(profile => {
        setAvatarUrl(profile?.avatar_url || null);
      });
    }
  }, [authUser]);

  useEffect(() => {
    if (!authUser || roleLoading || role !== 'tester') return;

    let isMounted = true;
    setConsentStatus('loading');
    setConsentUserId(null);
    setConsentError(null);
    setConsentChecked(false);

    const loadConsent = async () => {
      if (import.meta.env.DEV && localStorage.getItem('DEV_MOCK_LOGIN') === 'true') {
        try {
          const acceptedAt = localStorage.getItem(getMockConsentStorageKey(authUser.id));
          setConsentUserId(authUser.id);
          setConsentStatus(acceptedAt ? 'accepted' : 'required');
        } catch (error) {
          console.error('Failed to load local Nibras disclosure consent:', error);
          setConsentError('We could not load your local agreement. Check your browser storage and try again.');
          setConsentUserId(authUser.id);
          setConsentStatus('error');
        }
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('nibras_disclosure_accepted_at')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Failed to load Nibras disclosure consent:', error.message);
        setConsentError('We could not verify your consent. Please try again.');
        setConsentUserId(authUser.id);
        setConsentStatus('error');
        return;
      }

      if (!data) {
        console.error('Could not find a profile while loading Nibras disclosure consent.');
        setConsentError('We could not find your profile. Please try again later.');
        setConsentUserId(authUser.id);
        setConsentStatus('error');
        return;
      }

      setConsentUserId(authUser.id);
      setConsentStatus(data.nibras_disclosure_accepted_at ? 'accepted' : 'required');
    };

    void loadConsent();

    return () => {
      isMounted = false;
    };
  }, [authUser, role, roleLoading, consentRetry]);

  const acceptNibrasDisclosure = async () => {
    if (!authUser || consentSaving) return;

    setConsentSaving(true);
    setConsentError(null);
    const acceptedAt = new Date().toISOString();
    if (import.meta.env.DEV && localStorage.getItem('DEV_MOCK_LOGIN') === 'true') {
      try {
        localStorage.setItem(getMockConsentStorageKey(authUser.id), acceptedAt);
        setConsentUserId(authUser.id);
        setConsentStatus('accepted');
      } catch (error) {
        console.error('Failed to save local Nibras disclosure consent:', error);
        setConsentError('We could not save your local agreement. Check your browser storage and try again.');
      } finally {
        setConsentSaving(false);
      }
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ nibras_disclosure_accepted_at: acceptedAt })
      .eq('id', authUser.id)
      .select('nibras_disclosure_accepted_at')
      .single();

    if (error || !data) {
      console.error('Failed to save Nibras disclosure consent:', error?.message ?? 'No profile row was updated.');
      setConsentError('We could not save your agreement. Please try again.');
      setConsentSaving(false);
      return;
    }

    setConsentUserId(authUser.id);
    setConsentStatus('accepted');
    setConsentSaving(false);
  };

  useEffect(() => {
    if (!authUser) return;
    const loadSessions = async () => {
      setFetchingSessions(true);
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, title, subject, created_at')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setSessions(data);
        
        // Auto-add sections that exist in chat_sessions but not in localStorage
        const distinctSubjects = Array.from(new Set(data.map(s => s.subject).filter(Boolean))) as string[];
        setActiveSections(prev => {
          const newSections = [...prev];
          let changed = false;
          distinctSubjects.forEach(sub => {
            if (!newSections.includes(sub)) {
              newSections.push(sub);
              changed = true;
            }
          });
          if (changed) {
            localStorage.setItem('ai_chat_sections', JSON.stringify(newSections));
            return newSections;
          }
          return prev;
        });
      }
      setFetchingSessions(false);
    };
    loadSessions();
  }, [authUser]);

  const scrollToLatestMessage = () => {
    requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
  };

  const startTypewriter = useCallback((msgId: string, fullText: string) => {
    let charIdx = 0;
    const CHARS_PER_TICK = 3;
    const TICK_MS = 18;
    const tick = () => {
      charIdx = Math.min(charIdx + CHARS_PER_TICK, fullText.length);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, displayedLen: charIdx } : m))
      );
      if (charIdx < fullText.length) typewriterRef.current = window.setTimeout(tick, TICK_MS);
    };
    typewriterRef.current = window.setTimeout(tick, TICK_MS);
  }, []);

  useEffect(() => () => { if (typewriterRef.current) clearTimeout(typewriterRef.current); }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 128)}px`; }
  }, [input]);

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setConfirmModal({
      open: true,
      message: 'Are you sure you want to delete this chat? This cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }));
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
        await supabase.from('chat_sessions').delete().eq('id', sessionId);
      },
    });
  };

  const handleLoadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setMessages([]);
    setLoading(true);
    setAttachmentError(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);

    const session = sessions.find(s => s.id === sessionId);
    if (session?.subject && session.subject !== activeSubjectValue) {
      setActiveSubjectValue(session.subject);
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const loadedMessages = await Promise.all(data.map(async (message: any): Promise<ChatMessage> => {
        const metadata = isRecord(message.metadata) ? message.metadata : null;
        const attachmentDescriptors = Array.isArray(metadata?.attachments)
          ? metadata.attachments.filter((item): item is { name: string; isImage: boolean } =>
            isRecord(item) && typeof item.name === 'string' && typeof item.isImage === 'boolean')
          : [];
        let localFiles: File[] = [];

        if (message.role === 'user' && typeof metadata?.attachmentStorageKey === 'string') {
          try {
            localFiles = await readChatAttachments(metadata.attachmentStorageKey);
            if (localFiles.length < attachmentDescriptors.length) {
              setAttachmentError('Some attachments are not available in local storage on this device.');
            }
          } catch {
            setAttachmentError('Some attachments could not be loaded from this device.');
          }
        }

        return {
          id: message.id,
          role: message.role as 'user' | 'assistant',
          text: message.content,
          response: message.role === 'assistant' ? getAskResponse(metadata) : undefined,
          attachments: attachmentDescriptors.map((attachment, index) => ({
            name: attachment.name,
            isImage: attachment.isImage,
            file: localFiles[index],
          })),
        };
      }));
      setMessages(loadedMessages);
    }
    setLoading(false);
  };

  const LOADING_PHASES = [
    'Thinking it through…',
    'Looking that up…',
    'Searching the notes…',
    'Almost there…',
    'Taking longer than usual…',
    'Still working on it…',
  ];

  const startLoadingPhases = () => {
    setLoadingPhase(0);
    let phase = 0;
    loadingTimerRef.current = setInterval(() => {
      phase = Math.min(phase + 1, LOADING_PHASES.length - 1);
      setLoadingPhase(phase);
    }, 4000);
  };

  const stopLoadingPhases = () => {
    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    setLoadingPhase(0);
  };

  const isReplyTyping = messages.some(message =>
    message.role === 'assistant'
    && message.displayedLen !== undefined
    && message.displayedLen < message.text.length);

  const addAttachments = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    if (attachments.length + selectedFiles.length > MAX_FILES) {
      setAttachmentError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }

    const currentImageCount = attachments.filter(file =>
      IMAGE_EXTENSIONS.has(file.name.split('.').pop()?.toLowerCase() || '')
    ).length;
    const selectedImageCount = selectedFiles.filter(file =>
      IMAGE_EXTENSIONS.has(file.name.split('.').pop()?.toLowerCase() || '')
    ).length;
    if (currentImageCount + selectedImageCount > MAX_IMAGES) {
      setAttachmentError(`You can attach up to ${MAX_IMAGES} images.`);
      return;
    }

    const invalidFile = selectedFiles.map(validateAttachment).find(Boolean);
    if (invalidFile) {
      setAttachmentError(invalidFile);
      return;
    }

    setAttachments(previous => [...previous, ...selectedFiles]);
    setAttachmentError(null);
  };

  const handleAttachmentSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    addAttachments(selectedFiles);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedImages = Array.from(event.clipboardData.items)
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (pastedImages.length === 0) return;

    if (!event.clipboardData.getData('text/plain')) event.preventDefault();
    const namedImages = pastedImages.map((file, index) => {
      if (file.name && file.name.includes('.')) return file;
      const extension = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
      return new File([file], `pasted-image-${Date.now()}-${index}.${extension}`, {
        type: file.type,
        lastModified: Date.now(),
      });
    });
    addAttachments(namedImages);
  };

  const fetchAnswer = async (question: string, files: File[]): Promise<AskResponse> => {
    const formData = new FormData();
    formData.append('subject', activeSubjectValue);
    formData.append('question', question);
    files.forEach(file => formData.append('files', file, file.name));

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 120_000);
    let response: Response;
    let responseText: string;

    try {
      response = await fetch('/api/ask', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      responseText = await response.text();
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        throw new Error('This request took too long. Please try again.');
      }
      throw new Error(error instanceof TypeError
        ? 'Could not reach the tutor service. Please check your connection and try again.'
        : 'The tutor request could not be completed. Please try again.');
    } finally {
      window.clearTimeout(timeoutId);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = null;
    }

    const responseObject = isRecord(payload) ? payload : null;
    const detail = getErrorDetail(responseObject?.detail);

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(detail ? `Please check your question or attachments: ${detail}` : 'Please check your question and attachments.');
      }
      if (response.status === 401) {
        throw new Error('The tutor service could not authenticate this request. Please try again later.');
      }
      if (response.status === 413) {
        throw new Error('The total upload is too large. Please remove one or more attachments and try again.');
      }
      if (response.status === 422) {
        throw new Error(detail ? `The request could not be validated: ${detail}` : 'The request could not be validated. Please check your question and attachments.');
      }
      if (response.status === 429) {
        throw new Error('The tutor is receiving too many requests. Please wait a moment and try again.');
      }
      if (response.status === 502) {
        throw new Error('The tutor is temporarily unavailable. Please try again.');
      }
      throw new Error(detail || 'The tutor request failed. Please try again.');
    }

    if (!responseObject || typeof responseObject.answer !== 'string') {
      throw new Error('The tutor returned an unexpected response. Please try again.');
    }
    const responseTopics = isRecord(responseObject.topics) ? responseObject.topics : null;
    const responseTiming = isRecord(responseObject.timing_ms) ? responseObject.timing_ms : null;

    return {
      answer: responseObject.answer,
      topics: responseTopics ? {
        book_topics: getStringArray(responseTopics.book_topics),
        pp_topics: getStringArray(responseTopics.pp_topics),
        syllabus_topics: getStringArray(responseTopics.syllabus_topics),
      } : undefined,
      past_paper_sources: getStringArray(responseObject.past_paper_sources),
      seconds: typeof responseObject.seconds === 'number' ? responseObject.seconds : undefined,
      timing_ms: typeof responseTiming?.total === 'number' ? { total: responseTiming.total } : undefined,
    };
  };

  const handleSend = async (
    questionOverride?: string,
    retry?: { messageId: string; files: File[] },
  ) => {
    const question = (questionOverride ?? input).trim();
    const filesToSend = retry?.files ?? attachments;
    const userMessageId = retry?.messageId ?? `u-${Date.now()}`;
    if ((!question && filesToSend.length === 0) || loading || isReplyTyping || !authUser) return;
    if (!SUBJECTS.some(subject => subject.value === activeSubjectValue)) {
      setAttachmentError('Please select a valid subject.');
      return;
    }
    if (filesToSend.length > MAX_FILES) {
      setAttachmentError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }
    const imageCount = filesToSend.filter(file =>
      IMAGE_EXTENSIONS.has(file.name.split('.').pop()?.toLowerCase() || '')
    ).length;
    if (imageCount > MAX_IMAGES) {
      setAttachmentError(`You can attach up to ${MAX_IMAGES} images.`);
      return;
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      setAttachmentError(`Questions can be up to ${MAX_QUESTION_LENGTH} characters.`);
      return;
    }
    const invalidFile = filesToSend.map(validateAttachment).find(Boolean);
    if (invalidFile) {
      setAttachmentError(invalidFile);
      return;
    }
    setAttachmentError(null);

    // If resending, remove the previous error bubble so the user message stays visible
    if (questionOverride) {
      setMessages(prev => prev.filter(m => !m.isError));
    } else {
      const userMsg: ChatMessage = {
        id: userMessageId,
        role: 'user',
        text: question,
        attachments: filesToSend.map(file => ({
          name: file.name,
          file,
          isImage: isImageAttachment(file),
        })),
      };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setAttachments([]);
      scrollToLatestMessage();
    }
    setAttachmentError(null);

    setLoading(true);
    startLoadingPhases();

    try {
      let activeSessionId = currentSessionId;

      if (!activeSessionId) {
        const words = question.split(/\s+/);
        const title = words.length > 0 && words[0]
          ? words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '')
          : `Attachments: ${filesToSend.map(file => file.name).join(', ')}`;

        let sessionData, sessionError;
        
        if (import.meta.env.DEV && localStorage.getItem('DEV_MOCK_LOGIN') === 'true') {
          sessionData = { id: `mock-session-${Date.now()}` };
          sessionError = null;
        } else {
          const res = await supabase
            .from('chat_sessions')
            .insert({ user_id: authUser.id, title, subject: activeSubjectValue })
            .select('id')
            .single();
          sessionData = res.data;
          sessionError = res.error;
        }

        if (sessionError || !sessionData) {
          const code = sessionError?.code ? ` (code: ${sessionError.code})` : '';
          const msg = sessionError?.message || 'Unknown database error';
          throw new Error(`Failed to create chat session: ${msg}${code}. Please refresh the page and try again.`);
        }

        activeSessionId = sessionData.id;
        setCurrentSessionId(activeSessionId);
        setSessions(prev => [{ id: activeSessionId, title, subject: activeSubjectValue, created_at: new Date().toISOString() }, ...prev]);
      }

      const attachmentStorageKey = filesToSend.length
        ? `${authUser.id}:${activeSessionId}:${userMessageId}`
        : undefined;
      if (attachmentStorageKey) {
        try {
          await storeChatAttachments(attachmentStorageKey, filesToSend);
        } catch (error: unknown) {
          const detail = error instanceof Error ? ` ${error.message}` : '';
          setAttachmentError(`Attachments could not be saved on this device.${detail}`);
        }
      }

      const data = await fetchAnswer(question, filesToSend);
      const answer = data.answer || '';
      const botMsgId = `a-${Date.now()}`;
      const storedQuestion = question || `Attached files: ${filesToSend.map(file => file.name).join(', ')}`;

      // Write user + assistant as a pair — only after a successful reply
      if (!(import.meta.env.DEV && localStorage.getItem('DEV_MOCK_LOGIN') === 'true')) {
        await supabase.from('chat_messages').insert([
          {
            session_id: activeSessionId,
            role: 'user',
            content: storedQuestion,
            metadata: filesToSend.length ? {
              attachmentStorageKey,
              attachments: filesToSend.map(file => ({
                name: file.name,
                isImage: isImageAttachment(file),
              })),
            } : null,
          },
          { session_id: activeSessionId, role: 'assistant', content: answer, metadata: data },
        ]);
      }

      const botMsg: ChatMessage = {
        id: botMsgId, role: 'assistant', text: answer,
        response: data, displayedLen: 0,
      };
      setMessages(prev => [...prev, botMsg]);
      startTypewriter(botMsg.id, answer);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Could not reach the server.';
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: errMsg,
          isError: true,
          originalQuestion: question,
        },
      ]);
    } finally {
      stopLoadingPhases();
      setLoading(false);
    }
  };

  const handleResend = (question: string, originalMessage?: ChatMessage) => {
    handleSend(question, originalMessage ? {
      messageId: originalMessage.id,
      files: originalMessage.attachments?.flatMap(attachment => attachment.file ? [attachment.file] : []) ?? [],
    } : undefined);
  };

  const handleCopyMessage = async (message: ChatMessage) => {
    setCopyErrorMessageId(null);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable.');
      await navigator.clipboard.writeText(message.text);
      setCopiedMessageId(message.id);
      window.setTimeout(() => {
        setCopiedMessageId(current => current === message.id ? null : current);
      }, 1800);
    } catch {
      setCopiedMessageId(null);
      setCopyErrorMessageId(message.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Cleanup loading timer on unmount
  useEffect(() => () => { stopLoadingPhases(); }, []);

  const handleAddSection = (subjectValue: string) => {
    if (!activeSections.includes(subjectValue)) {
      const newSections = [...activeSections, subjectValue];
      setActiveSections(newSections);
      localStorage.setItem('ai_chat_sections', JSON.stringify(newSections));
    }
    setActiveSubjectValue(subjectValue);
    setIsAddSectionModalOpen(false);
    handleNewChat();
  };
  
  const handleRemoveSection = (e: React.MouseEvent, subjectValue: string) => {
    e.stopPropagation();
    setConfirmModal({
      open: true,
      message: 'Remove this section from your workspace? Your chats will remain saved in history.',
      onConfirm: async () => {
        setConfirmModal(m => ({ ...m, open: false }));
        const newSections = activeSections.filter(s => s !== subjectValue);
        setActiveSections(newSections);
        localStorage.setItem('ai_chat_sections', JSON.stringify(newSections));

        // Delete all chat sessions for this subject in DB
        await supabase.from('chat_sessions').delete().eq('subject', subjectValue);
        setSessions(prev => prev.filter(s => s.subject !== subjectValue));

        if (activeSubjectValue === subjectValue) {
          if (newSections.length > 0) {
            setActiveSubjectValue(newSections[0]);
          } else {
            // Fallback to IG_Phy if everything is removed
            setActiveSections(['IG_Phy']);
            setActiveSubjectValue('IG_Phy');
            localStorage.setItem('ai_chat_sections', JSON.stringify(['IG_Phy']));
          }
          handleNewChat();
        }
      },
    });
  };

  const activeSubject = SUBJECTS.find((s) => s.value === activeSubjectValue) || SUBJECTS[0];
  const activeSectionChats = sessions.filter(s => s.subject === activeSubjectValue);

  /* ─── Render ─────────────────────────────────────────── */
  const isAccessLoading = authLoading || (!!authUser && roleLoading) ||
    (role === 'tester' && (consentStatus === 'loading' || consentUserId !== authUser?.id));

  if (isAccessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="h-8 w-8 text-blue-500 animate-pulse" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Sign in required</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            Please sign in to your Learnmates account to use the AI Tutor.
          </p>
          <Link to="/login" state={{ from: location }}>
            <Button className="w-full h-12 text-base font-semibold shadow-md">
              Sign In to Continue
            </Button>
          </Link>
          <div className="mt-6 text-sm text-gray-400">
            <Link to="/" className="hover:text-blue-500 transition-colors">
              Return to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (role !== 'tester') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Early Access Only</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            The AI Tutor is currently in beta and is only available to registered testers. You can get early access if you contact us via{' '}
            <a
              href="https://discord.gg/qCQTxTQkRh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Discord
            </a>{' '}
            or{' '}
            <a
              href="mailto:learnmates.share@gmail.com"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              email
            </a>
            .
          </p>
          <Link to="/">
            <Button className="w-full h-12 text-base font-semibold bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white shadow-md">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (consentStatus !== 'accepted') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
        <Helmet>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap"
            rel="stylesheet"
          />
        </Helmet>
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="nibras-disclosure-title"
          aria-describedby="nibras-disclosure-copy"
          className="nibras-consent-dialog max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-8"
        >
          <div className="mb-5 border-b border-slate-200 pb-5 dark:border-slate-700">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
              <NibrasIcon className="h-6 w-6 shrink-0" />
              <span>Nibras · AI tutor</span>
            </div>
            <h1 id="nibras-disclosure-title" className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Please read before continuing
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              A short message from HAF, the creator of Nibras.
            </p>
          </div>
          <div id="nibras-disclosure-copy" className="nibras-consent-copy space-y-3 text-base leading-relaxed text-slate-700 dark:text-slate-200 sm:text-lg">
            <p>
              Hi there! I&apos;m HAF, the creator of Nibras, the AI tutor here on Learnmates. First, thanks for using Learnmates, and I hope it&apos;s been a good experience so far.
            </p>
            <p>
              Quick word on Nibras: it&apos;s built on past papers, mark schemes, and the syllabus/specification, so it stays within the curriculum and knows what examiners are actually looking for. That said, Nibras is still an AI, and like any AI it can get things wrong. If something doesn&apos;t make sense, we advise double-checking it yourself, and please report any issues to us. We&apos;d genuinely rather hear about it.
            </p>
            <p>
              One more thing, because we think you should know: your chats are stored on our database and may be used to improve Nibras. When we review them, we look at the chat linked to an ID rather than your username, though that ID is linked to your account. Your chats are never shared or sold, and you can delete them anytime.
            </p>
            <p>
              Thanks for trusting us with your studying. If you&apos;re happy with all this, just hit the button below to agree and carry on.
            </p>
          </div>
          {consentError && (
            <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {consentError}
            </p>
          )}
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={event => setConsentChecked(event.target.checked)}
              disabled={consentStatus !== 'required' || consentSaving}
              className="mt-0.5 h-5 w-5 shrink-0 accent-blue-600"
            />
            <span>I have read and agree to the Nibras disclosure above.</span>
          </label>
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="button" variant="outline" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  Back to dashboard
                </Link>
              </Button>
              {consentStatus === 'error' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConsentRetry(retry => retry + 1)}
                >
                  Try again
                </Button>
              )}
            </div>
            <Button
              type="button"
              onClick={acceptNibrasDisclosure}
              disabled={consentStatus !== 'required' || consentSaving || !consentChecked}
              className="min-h-12 px-6 text-base font-semibold"
            >
              {consentSaving ? 'Saving…' : 'I agree and continue'}
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`flex h-[calc(100dvh-5rem)] lg:h-[calc(100vh-5rem)] text-gray-900 dark:text-gray-100 overflow-hidden bg-slate-50 dark:bg-gray-950 relative theme-${activeSubject.theme}`}>
      <Helmet>
        <title>AI Tutor | Learnmates</title>
        <meta name="description" content="Ask your IGCSE and A-Level science questions and get instant, curriculum-aligned answers with Learnmates AI Tutor." />
      </Helmet>

      {/* Mobile Sidebar Toggle Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden absolute top-4 left-4 z-20 p-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
        >
          <Menu size={20} />
        </button>
      )}

      {/* ── Unified Sidebar (Sections + Chats) ── */}
      {/* Overlay — sits behind the sidebar panel itself */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Single sliding container wrapping both columns */}
      <div className={`
        fixed inset-y-0 left-0 z-40 flex
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-30
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

      {/* ── Outer column: Section Icons ── */}
      <div className="w-[72px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center py-4 gap-3 shrink-0">
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-3 px-2 no-scrollbar">
          <AnimatePresence initial={false}>
            {activeSections.map((val, idx) => {
              const s = SUBJECTS.find(sub => sub.value === val);
              if (!s) return null;
              const Icon = s.icon;
              const isActive = activeSubjectValue === s.value;
              
              return (
                <motion.div
                  key={s.value}
                  layout
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28, delay: idx * 0.04 }}
                  className="relative group w-full flex justify-center"
                >
                  
                  <motion.button
                    onClick={() => {
                      setActiveSubjectValue(s.value);
                      // Only clear chat, do NOT close sidebar on mobile when switching subject
                      setCurrentSessionId(null);
                      setMessages([]);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    animate={isActive ? { borderRadius: '16px' } : { borderRadius: '12px' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`w-12 h-12 flex items-center justify-center relative ${
                      isActive 
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-gray-200'
                    }`}
                    title={s.label}
                  >
                    <motion.div
                      animate={isActive ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                      <Icon size={22} />
                    </motion.div>
                    
                    {/* Subject Badge */}
                    <motion.div
                      animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.85, opacity: 0.8 }}
                      className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-gray-900 shadow-sm ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {s.level === 'IGCSE' ? 'IG' : s.level === 'IAL' ? 'IAL' : 'AL'}
                    </motion.div>
                  </motion.button>
                  
                  {/* Delete button — always visible for non-active sections */}
                  {!isActive && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={(e) => handleRemoveSection(e, s.value)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-100 dark:bg-red-900/80 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center shadow-sm border border-white dark:border-gray-900"
                    >
                      <X size={12} />
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          <button
            onClick={() => setIsAddSectionModalOpen(true)}
            className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 flex items-center justify-center hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:rounded-2xl shrink-0 mt-1"
            title="Add Section"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* ── Inner column: Chat List ── */}
      <div className="w-64 bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
        <div className="p-4 flex flex-col border-b border-gray-200/50 dark:border-gray-800/50 h-[72px] justify-center">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200 truncate flex items-center gap-2">
              {activeSubject.shortLabel}
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="p-3">
          <Button onClick={handleNewChat} className="w-full justify-start shadow-sm bg-gray-900 hover:bg-gray-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white" variant="primary" leftIcon={<Plus size={16} />}>
            New Chat
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
          {fetchingSessions ? (
            <div className="animate-pulse flex flex-col gap-2">
              <div className="h-10 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg w-full"></div>
              <div className="h-10 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg w-full"></div>
            </div>
          ) : activeSectionChats.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500 flex flex-col items-center gap-2">
              <MessageSquare size={24} className="opacity-20" />
              <span>No chats yet</span>
            </div>
          ) : (
            activeSectionChats.map((s) => (
              <button
                key={s.id}
                onClick={() => handleLoadSession(s.id)}
                className={`group w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center justify-between transition-colors ${
                  currentSessionId === s.id
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium shadow-sm border border-gray-200/50 dark:border-gray-700/50'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="truncate">{s.title}</span>
                </div>
                <div
                  onClick={(e) => handleDeleteSession(e, s.id)}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md shrink-0 ml-2 transition-colors"
                  title="Delete chat"
                >
                  <Trash2 size={14} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Close the unified sidebar container */}
      </div>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative">
        
        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5 relative z-10"
        >
          <div className="max-w-4xl mx-auto flex flex-col space-y-5">
            {/* Empty state */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center py-16 sm:py-24 text-center"
              >
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {activeSubject.label}
                </h1>
                <p className="text-base text-gray-500 dark:text-gray-400 max-w-md leading-relaxed mb-6">
                  Welcome to your specialized {activeSubject.subjectName} workspace. Ask questions, explore concepts, and get help aligned with the {activeSubject.level === 'IAL' ? 'Edexcel International A-Level' : `Cambridge ${activeSubject.level}`} syllabus.
                </p>

              </motion.div>
            )}

            {/* Messages list */}
            <AnimatePresence>
              {messages.map((msg) => {
                const isBot = msg.role === 'assistant';
                const isTyping = isBot && msg.displayedLen !== undefined && msg.displayedLen < msg.text.length;
                const visibleText =
                  isBot && msg.displayedLen !== undefined ? msg.text.slice(0, msg.displayedLen) : msg.text;
                const formattedAnswer = isBot && !msg.isError ? formatAnswer(visibleText) : null;
                const answerParts = formattedAnswer?.html.split(/(%%PAST_PAPER_\d+%%)/g) || [];
                const responseSeconds = msg.response?.seconds
                  ?? (msg.response?.timing_ms?.total === undefined ? undefined : msg.response.timing_ms.total / 1000);

                return (
                  <motion.div
                    key={msg.id}
                    variants={msgVariants}
                    initial="hidden"
                    animate="visible"
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={isBot
                          ? 'flex-shrink-0 flex items-center justify-center text-xs font-bold theme-avatar'
                          : avatarUrl
                          ? 'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden bg-transparent'
                          : 'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden bg-gray-200 dark:bg-gray-700 text-gray-500'}
                    >
                      {isBot ? (
                        <NibrasIcon className="h-6 w-6 theme-icon" />
                      ) : avatarUrl ? (
                        <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>

                    {/* Bubble + meta */}
                    <div className={`flex flex-col gap-1.5 min-w-0 max-w-[85%] sm:max-w-[75%] ${isBot ? 'items-start' : 'items-end'}`}>
                      {!isBot && !!msg.attachments?.length && (
                        <div className="flex max-w-full flex-wrap justify-end gap-2">
                          {msg.attachments.map((attachment, index) => (
                            attachment.isImage && attachment.file ? (
                              <ImageAttachmentPreview
                                key={`${attachment.name}-${index}`}
                                file={attachment.file}
                                onExpand={setExpandedImage}
                                className="h-20 w-20 cursor-zoom-in"
                              />
                            ) : (
                              <div
                                key={`${attachment.name}-${index}`}
                                title={attachment.name}
                                className="inline-flex max-w-40 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                              >
                                {attachment.isImage
                                  ? <ImagePlus size={18} className="shrink-0 text-blue-500" aria-hidden="true" />
                                  : <FileText size={18} className="shrink-0 text-red-500" aria-hidden="true" />}
                                <span className="truncate">{attachment.name}</span>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isBot
                            ? 'bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 shadow-sm rounded-tl-md'
                            : 'bg-blue-600 dark:bg-blue-600 text-white shadow-md shadow-blue-500/20 rounded-tr-md'
                        }`}
                      >
                        {isBot ? (
                          <div className="ai-answer-content text-gray-800 dark:text-gray-200">
                            {msg.isError ? (
                              <div className="flex flex-col gap-2">
                                <span className="text-red-500 dark:text-red-400 text-sm flex items-center gap-1.5">⚠️ {msg.text}</span>
                                <button
                                  onClick={() => {
                                    const originalMessage = [...messages].reverse().find(message =>
                                      message.role === 'user' && message.text === msg.originalQuestion);
                                    if (msg.originalQuestion) handleResend(msg.originalQuestion, originalMessage);
                                  }}
                                  className="self-start flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700 transition-colors"
                                >
                                  ↩ Resend
                                </button>
                              </div>
                            ) : (
                              <>
                                {answerParts.map((part, partIndex) => {
                                  const paperMatch = part.match(/^%%PAST_PAPER_(\d+)%%$/);
                                  if (paperMatch && formattedAnswer) {
                                    const paper = getPastPaperDocument(
                                      activeSubjectValue,
                                      formattedAnswer.pastPaperPaths[Number(paperMatch[1])],
                                    );
                                    if (!paper) return null;
                                    const paperFileName = paper.name.split('/').pop() || paper.name;
                                    const paperDisplayName = getPastPaperDisplayName(paper.name);
                                    const hasQuestionMarker = /(?:^|[_\s])Q\d*(?=\.pdf$)/i.test(paperFileName);
                                    const markSchemePath = hasQuestionMarker
                                      ? deriveMarkSchemeUrl(paper.questionPath)
                                      : null;
                                    const paperViewKey = `${msg.id}:${paper.questionPath}`;
                                    const isExpanded = pastPaperExpanded[paperViewKey] === true;
                                    const showingMarkScheme = !!markSchemePath && markSchemeVisible[paperViewKey] === true;

                                    return (
                                      <React.Fragment key={`${msg.id}-paper-${paperMatch[1]}`}>
                                        {isExpanded ? (
                                          <div className="my-2 min-w-0 overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm dark:border-blue-900 dark:bg-gray-900">
                                            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-blue-100 bg-blue-50/70 px-3 py-2 dark:border-blue-900/70 dark:bg-blue-950/30">
                                              <button
                                                type="button"
                                                onClick={() => setPastPaperExpanded(previous => ({
                                                  ...previous,
                                                  [paperViewKey]: false,
                                                }))}
                                                aria-expanded={isExpanded}
                                                className="min-w-0 max-w-full break-words text-left text-sm font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:decoration-blue-700 dark:hover:text-blue-200"
                                              >
                                                {paperDisplayName}
                                              </button>
                                              {markSchemePath && (
                                                <button
                                                  type="button"
                                                  onClick={() => setMarkSchemeVisible(previous => ({
                                                    ...previous,
                                                    [paperViewKey]: !previous[paperViewKey],
                                                  }))}
                                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                                >
                                                  {showingMarkScheme ? 'View question paper' : 'View mark scheme'}
                                                </button>
                                              )}
                                            </div>
                                            <div className="aspect-[3/4] max-h-[65vh] w-full overflow-hidden bg-white dark:bg-gray-900">
                                              <div className="h-full min-w-0">
                                                <UniversalDocumentViewer
                                                  key={showingMarkScheme ? markSchemePath : paper.questionPath}
                                                  mode="inline"
                                                  pdfUrl={showingMarkScheme && markSchemePath ? markSchemePath : paper.questionPath}
                                                  fileName={showingMarkScheme
                                                    ? paperFileName.replace(/Q(?=\d)/i, 'MS')
                                                    : paperFileName}
                                                  readOnly
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setPastPaperExpanded(previous => ({
                                              ...previous,
                                              [paperViewKey]: true,
                                            }))}
                                            aria-expanded={false}
                                            className="inline max-w-full break-words rounded bg-blue-50 px-1.5 py-0.5 text-left text-sm font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 transition-colors hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:decoration-blue-700 dark:hover:bg-blue-900/50"
                                          >
                                            {paperDisplayName}
                                          </button>
                                        )}
                                      </React.Fragment>
                                    );
                                  }
                                  if (!part) return null;
                                  return (
                                    <span
                                      key={`${msg.id}-text-${partIndex}`}
                                      className="contents"
                                      dangerouslySetInnerHTML={{ __html: part }}
                                    />
                                  );
                                })}
                                {isTyping && <span className="ai-cursor" />}
                              </>
                            )}
                          </div>
                        ) : (
                          msg.text && <span>{msg.text}</span>
                        )}
                      </div>

                      <div className={`flex items-center gap-2 px-1 ${isBot ? 'self-start' : 'self-end'}`}>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg)}
                          aria-label={copiedMessageId === msg.id ? 'Message copied' : 'Copy message'}
                          title={copiedMessageId === msg.id ? 'Copied' : 'Copy message'}
                          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                        >
                          {copiedMessageId === msg.id
                            ? <Check size={14} aria-hidden="true" />
                            : <Copy size={14} aria-hidden="true" />}
                        </button>
                        {copyErrorMessageId === msg.id && (
                          <span role="status" className="text-xs text-red-500">Could not copy message.</span>
                        )}
                      </div>

                      {/* Meta */}
                      {isBot && msg.response && !isTyping && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col gap-1.5 pl-1"
                        >
                          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                            {responseSeconds !== undefined ? (
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {responseSeconds.toFixed(1)}s
                              </span>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Thinking indicator */}
            {loading && (
              <motion.div variants={msgVariants} initial="hidden" animate="visible" className="flex gap-3">
                <div className="flex-shrink-0 theme-avatar">
                   <NibrasAnimatedMark className="h-6 w-6" />
                </div>
                <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex items-center gap-3">
                  <motion.span
                    key={loadingPhase}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="text-sm text-gray-500 dark:text-gray-400 italic animate-pulse"
                  >
                    {LOADING_PHASES[loadingPhase]}
                  </motion.span>
                </div>
              </motion.div>
            )}

            {/* Long chat warning */}
            {messages.filter(m => m.role === 'assistant').length >= 4 && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-2 pb-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 flex items-center gap-2 shadow-sm">
                  <Sparkles size={14} className="opacity-70" />
                  <span>Each tutor request is independent and does not include earlier messages. Start a new chat to keep things organized.</span>
                  <button onClick={handleNewChat} className="font-semibold underline ml-1 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">New Chat</button>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 p-3 w-full relative z-10 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-gray-950 dark:via-gray-950 pt-6 -mt-6">
          <div className="max-w-4xl mx-auto rounded-[1.5rem] border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-900 shadow-lg px-4 sm:px-5 py-2">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2 pt-1">
                {attachments.map((file, index) => (
                  isImageAttachment(file) ? (
                    <span key={`${file.name}-${file.lastModified}-${index}`} className="group relative">
                      <ImageAttachmentPreview file={file} />
                      <button
                        type="button"
                        onClick={() => setAttachments(previous => previous.filter((_, fileIndex) => fileIndex !== index))}
                        className="absolute -right-1.5 -top-1.5 rounded-full bg-gray-900 p-1 text-white opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ) : (
                    <span
                      key={`${file.name}-${file.lastModified}-${index}`}
                      title={file.name}
                      className="group relative inline-flex w-24 flex-col items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-2 text-center text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <FileText size={24} className="text-red-500 dark:text-red-400" aria-hidden="true" />
                      <span className="w-full truncate" title={file.name}>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(previous => previous.filter((_, fileIndex) => fileIndex !== index))}
                        className="absolute -right-1.5 -top-1.5 rounded-full bg-gray-900 p-1 text-white opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )
                ))}
              </div>
            )}
            {attachments.some(isImageAttachment) && (
              <p className="pb-2 text-xs text-gray-500 dark:text-gray-400">
                Images: {attachments.filter(isImageAttachment).length}/{MAX_IMAGES} · 5 MB max each
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.csv,.json,.tsv"
                onChange={handleAttachmentSelection}
                className="sr-only"
                aria-label="Choose documents"
              />
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAttachmentSelection}
                className="sr-only"
                aria-label="Choose images"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.length >= MAX_FILES}
                className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Attach files"
                title="Attach files"
              >
                <Paperclip size={18} />
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={attachments.length >= MAX_FILES || attachments.filter(file =>
                  IMAGE_EXTENSIONS.has(file.name.split('.').pop()?.toLowerCase() || '')
                ).length >= MAX_IMAGES}
                className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Attach images"
                title={`Attach images (up to ${MAX_IMAGES}, 5 MB each)`}
              >
                <ImagePlus size={18} />
              </button>
              <textarea
                ref={textareaRef}
                className="flex-1 resize-none bg-transparent border-0 px-0 py-2 text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-0"
                rows={1}
                placeholder={`Ask about ${activeSubject.label}…`}
                value={input}
                maxLength={MAX_QUESTION_LENGTH}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                style={{ maxHeight: '120px', overflowY: 'auto' }}
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading || isReplyTyping || (!input.trim() && attachments.length === 0)}
                className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Send"
              >
                <ArrowRight size={18} />
              </button>
            </div>
            {attachmentError && (
              <p role="alert" className="pt-2 text-xs text-red-500 dark:text-red-400">{attachmentError}</p>
            )}
          </div>
          <div className="max-w-4xl mx-auto mt-1.5 text-center">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              AI Tutor can make mistakes. Check important information.
            </p>
          </div>
        </div>
      </div>

      {expandedImage && (
        <ExpandedImageDialog file={expandedImage} onClose={() => setExpandedImage(null)} />
      )}

      {/* ── Custom Confirm Modal ── */}
      <AnimatePresence>
        {confirmModal.open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmModal(m => ({ ...m, open: false }))}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 size={22} className="text-red-500 dark:text-red-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{confirmModal.message}</p>
                <div className="flex gap-3 w-full mt-1">
                  <button
                    onClick={() => setConfirmModal(m => ({ ...m, open: false }))}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Section Modal ── */}
      <AnimatePresence>
        {isAddSectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsAddSectionModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add to Workspace</h3>
                  <button 
                    onClick={() => setIsAddSectionModalOpen(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Board */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Board</label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: 'cambridge', label: 'Cambridge' },
                        { value: 'edexcel', label: 'Edexcel' },
                      ] as const).map(board => (
                        <button
                          key={board.value}
                          type="button"
                          onClick={() => setSelectedBoard(board.value)}
                          aria-pressed={selectedBoard === board.value}
                          className={`rounded-xl border p-3 text-sm font-semibold transition-colors duration-150 ${
                            selectedBoard === board.value
                              ? 'border-blue-400 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-blue-700'
                          }`}
                        >
                          {board.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Available Subjects Grid */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Select Subject</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SUBJECTS.filter(subject =>
                        selectedBoard === 'edexcel' ? subject.level === 'IAL' : subject.level !== 'IAL'
                      ).map((s, idx) => {
                        const isAdded = activeSections.includes(s.value);
                        const Icon = s.icon;
                        return (
                          <motion.button
                            key={s.value}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02, type: 'spring', stiffness: 550, damping: 32 }}
                            whileHover={!isAdded ? { scale: 1.02, y: -1, transition: { duration: 0.12 } } : {}}
                            whileTap={!isAdded ? { scale: 0.97 } : {}}
                            onClick={() => handleAddSection(s.value)}
                            disabled={isAdded}
                            className={`flex flex-col items-start p-4 rounded-xl border text-left relative ${
                              isAdded 
                                ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed' 
                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md cursor-pointer'
                            }`}
                          >
                            <motion.div
                              whileHover={!isAdded ? { scale: 1.05 } : {}}
                              transition={{ duration: 0.12 }}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isAdded ? 'bg-gray-200 dark:bg-gray-700 text-gray-500' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}
                            >
                              <Icon size={20} />
                            </motion.div>
                            <span className="font-semibold text-gray-900 dark:text-white">{s.subjectName}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{s.level}</span>
                            
                            {isAdded && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute top-3 right-3 text-[10px] font-bold text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full"
                              >
                                ✓ Added
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiChat;
