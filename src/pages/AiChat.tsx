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
  ArrowRight,
  MessageSquare,
  Plus,
  Menu,
  X,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import { fetchProfile } from '../utils/profileSync';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './AiChat.css';

/* ─── Types ───────────────────────────────────────────── */
interface AskResponse {
  answer: string;
  topics?: { book_topics?: string[]; pp_topics?: string[] };
  chunks_used?: { past_paper?: number; main_reference?: number };
  timing_ms?: {
    topic_resolution?: number;
    retrieval?: number;
    generation?: number;
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
}

interface ChatSession {
  id: string;
  title: string;
  subject?: string;
  created_at: string;
}

const SUBJECTS = [
  { value: 'IG_Phy', label: 'IGCSE Physics', shortLabel: 'IG Phy', icon: Rocket, theme: 'physics', level: 'IGCSE', subjectName: 'Physics' },
  { value: 'A_Phy', label: 'A-Level Physics', shortLabel: 'AL Phy', icon: Rocket, theme: 'physics', level: 'A-Level', subjectName: 'Physics' },
  { value: 'IG_Chem', label: 'IGCSE Chemistry', shortLabel: 'IG Chem', icon: FlaskConical, theme: 'chemistry', level: 'IGCSE', subjectName: 'Chemistry' },
  { value: 'A_Chem', label: 'A-Level Chemistry', shortLabel: 'AL Chem', icon: FlaskConical, theme: 'chemistry', level: 'A-Level', subjectName: 'Chemistry' },
  { value: 'IG_Bio', label: 'IGCSE Biology', shortLabel: 'IG Bio', icon: Dna, theme: 'biology', level: 'IGCSE', subjectName: 'Biology' },
  { value: 'A_Bio', label: 'A-Level Biology', shortLabel: 'AL Bio', icon: Dna, theme: 'biology', level: 'A-Level', subjectName: 'Biology' },
] as const;

/* ─── KaTeX + Markdown helpers ───────────────────────── */
function formatAnswer(raw: string): string {
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

  // 3. Markdown → HTML
  let html = raw;
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
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

  html = html.replace(/((?:<br\/>|<div[^>]*><\/div>|\s)*)(%%MATH_(\d+)%%)((?:<br\/>|<div[^>]*><\/div>|\s)*)/g, (match, prefix, placeholder, idxStr, suffix) => {
    const p = placeholders[Number(idxStr)];
    if (p.display) {
      return p.html; 
    }
    return prefix + p.html + suffix;
  });

  return html;
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
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user: authUser, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(authUser?.id);
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const startTypewriter = useCallback(
    (msgId: string, fullText: string) => {
      let charIdx = 0;
      const CHARS_PER_TICK = 3;
      const TICK_MS = 18;
      const tick = () => {
        charIdx = Math.min(charIdx + CHARS_PER_TICK, fullText.length);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, displayedLen: charIdx } : m))
        );
        scrollToBottom();
        if (charIdx < fullText.length) typewriterRef.current = window.setTimeout(tick, TICK_MS);
      };
      typewriterRef.current = window.setTimeout(tick, TICK_MS);
    },
    [scrollToBottom]
  );

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
      setMessages(data.map((m: any) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        text: m.content,
        response: m.metadata || undefined,
      })));
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

  // Core fetch with one automatic retry
  const fetchAnswer = async (contextualQuestion: string): Promise<{ data: AskResponse; retried: boolean }> => {
    const doFetch = async () => {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: 'student', subject: activeSubjectValue, question: contextualQuestion, topic: null }),
      });
      const json: AskResponse | { detail?: string; error?: string } = await res.json();
      if (!res.ok) {
        const errDetail = (json as any).detail || (json as any).error || (json as any).message || null;
        throw new Error(`HTTP ${res.status}${errDetail ? ': ' + errDetail : ''}`);
      }
      return json as AskResponse;
    };

    try {
      const data = await doFetch();
      return { data, retried: false };
    } catch {
      // wait 1.5 s then try once more
      await new Promise(r => setTimeout(r, 1500));
      const data = await doFetch();
      return { data, retried: true };
    }
  };

  const handleSend = async (questionOverride?: string) => {
    const question = (questionOverride ?? input).trim();
    if (!question || loading || !authUser) return;

    // If resending, remove the previous error bubble so the user message stays visible
    if (questionOverride) {
      setMessages(prev => prev.filter(m => !m.isError));
    } else {
      const userMsgId = `u-${Date.now()}`;
      const userMsg: ChatMessage = { id: userMsgId, role: 'user', text: question };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
    }

    setLoading(true);
    startLoadingPhases();

    try {
      let activeSessionId = currentSessionId;

      if (!activeSessionId) {
        const words = question.split(/\s+/);
        const title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');

        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({ user_id: authUser.id, title, subject: activeSubjectValue })
          .select('id')
          .single();

        if (sessionError || !sessionData) {
          const code = sessionError?.code ? ` (code: ${sessionError.code})` : '';
          const msg = sessionError?.message || 'Unknown database error';
          throw new Error(`Failed to create chat session: ${msg}${code}. Please refresh the page and try again.`);
        }

        activeSessionId = sessionData.id;
        setCurrentSessionId(activeSessionId);
        setSessions(prev => [{ id: activeSessionId, title, subject: activeSubjectValue, created_at: new Date().toISOString() }, ...prev]);
      }

      let contextualQuestion = question;
      // Build context from non-error messages only
      const historyMsgs = messages.filter(m => !m.isError);
      if (historyMsgs.length > 0) {
        const historyText = historyMsgs.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n\n');
        contextualQuestion = `[Previous Context]\n${historyText}\n\n[Current Question]\n${question}`;
      }

      const { data } = await fetchAnswer(contextualQuestion);
      const answer = data.answer || '';
      const botMsgId = `a-${Date.now()}`;

      // Write user + assistant as a pair — only after a successful reply
      await supabase.from('chat_messages').insert([
        { session_id: activeSessionId, role: 'user', content: question },
        { session_id: activeSessionId, role: 'assistant', content: answer, metadata: data },
      ]);

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

  const handleResend = (question: string) => {
    handleSend(question);
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
  const isAccessLoading = authLoading || (!!authUser && roleLoading);

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
                      handleNewChat();
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
                      {s.level === 'IGCSE' ? 'IG' : 'AL'}
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
          <Button onClick={handleNewChat} className="w-full justify-start shadow-sm" variant="default" leftIcon={<Plus size={16} />}>
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
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5 relative z-10"
          style={{ scrollBehavior: 'smooth' }}
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
                  Welcome to your specialized {activeSubject.subjectName} workspace. Ask questions, explore concepts, and get help aligned with the Cambridge {activeSubject.level} syllabus.
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

                return (
                  <motion.div
                    key={msg.id}
                    variants={msgVariants}
                    initial="hidden"
                    animate="visible"
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ${
                        isBot
                          ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 theme-avatar'
                          : avatarUrl
                          ? 'bg-transparent'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                    >
                      {isBot ? (
                        <activeSubject.icon size={16} className="theme-icon" />
                      ) : avatarUrl ? (
                        <img src={avatarUrl} alt="You" className="w-full h-full object-cover" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>

                    {/* Bubble + meta */}
                    <div className={`flex flex-col gap-1.5 min-w-0 max-w-[85%] sm:max-w-[75%]`}>
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
                                  onClick={() => msg.originalQuestion && handleResend(msg.originalQuestion)}
                                  className="self-start flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700 transition-colors"
                                >
                                  ↩ Resend
                                </button>
                              </div>
                            ) : (
                              <>
                                <div dangerouslySetInnerHTML={{ __html: formatAnswer(visibleText) }} />
                                {isTyping && <span className="ai-cursor" />}
                              </>
                            )}
                          </div>
                        ) : (
                          <span>{msg.text}</span>
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
                            {msg.response.timing_ms?.total && (
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {(msg.response.timing_ms.total / 1000).toFixed(1)}s
                              </span>
                            )}
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
                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 theme-avatar">
                   <activeSubject.icon size={16} className="theme-icon" />
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
                  <span>This chat is getting long. Starting a new chat helps the AI maintain better context!</span>
                  <button onClick={handleNewChat} className="font-semibold underline ml-1 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">New Chat</button>
                </div>
              </motion.div>
            )}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 p-4 w-full relative z-10 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-gray-950 dark:via-gray-950 pt-8 -mt-8">
          <div className="max-w-4xl mx-auto rounded-[2rem] border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-900 shadow-lg px-5 sm:px-6 py-4">
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                className="flex-1 resize-none bg-transparent border-0 px-0 py-3 text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-0"
                rows={1}
                placeholder={`Ask about ${activeSubject.label}…`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{ maxHeight: '150px', overflowY: 'auto' }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Send"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
          <div className="max-w-4xl mx-auto mt-2 text-center">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              AI Tutor can make mistakes. Check important information.
            </p>
          </div>
        </div>
      </div>

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
                  {/* Board (Locked) */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">Board</label>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800/50">
                      <span className="font-medium text-blue-800 dark:text-blue-300">Cambridge International</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">Included</span>
                    </div>
                  </div>
                  
                  {/* Available Subjects Grid */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">Select Subject</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SUBJECTS.map((s, idx) => {
                        const isAdded = activeSections.includes(s.value);
                        const Icon = s.icon;
                        return (
                          <motion.button
                            key={s.value}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.06, type: 'spring', stiffness: 350, damping: 28 }}
                            whileHover={!isAdded ? { scale: 1.03, y: -2 } : {}}
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
                              whileHover={!isAdded ? { rotate: [0, -8, 8, 0], scale: 1.1 } : {}}
                              transition={{ duration: 0.35 }}
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
