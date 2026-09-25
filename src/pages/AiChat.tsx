import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Clock,
  Atom,
  FlaskConical,
  Leaf,
  User,
  ArrowRight,
  MessageSquare,
  Plus,
  Menu,
  X,
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
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

const SUBJECTS = [
  { value: 'IG_Phy', label: 'IGCSE Physics', shortLabel: 'IG Phy', icon: Atom },
  { value: 'A_Phy', label: 'A-Level Physics', shortLabel: 'AL Phy', icon: Atom },
  { value: 'IG_Chem', label: 'IGCSE Chemistry', shortLabel: 'IG Chem', icon: FlaskConical },
  { value: 'A_Chem', label: 'A-Level Chemistry', shortLabel: 'AL Chem', icon: FlaskConical },
  { value: 'IG_Bio', label: 'IGCSE Biology', shortLabel: 'IG Bio', icon: Leaf },
  { value: 'A_Bio', label: 'A-Level Biology', shortLabel: 'AL Bio', icon: Leaf },
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

  // $$...$$ display
  raw = raw.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => placeholder(tex, true));
  // \[...\] display
  raw = raw.replace(/\\\[([\s\S]+?)\\\]/g, (_m, tex) => placeholder(tex, true));
  // \(...\) inline
  raw = raw.replace(/\\\(([\s\S]+?)\\\)/g, (_m, tex) => placeholder(tex, false));
  // $...$ inline (not $$)
  raw = raw.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_m, tex) => placeholder(tex, false));

  // 2. Markdown → HTML (now math-free, so <br/> won't leak into formulas)
  let html = raw;
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
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
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/\n{2,}/g, '<div style="height: 0.5rem; width: 100%"></div>');
  html = html.replace(/\n/g, '<br/>');

  // 3. Restore math placeholders with rendered KaTeX HTML
  html = html.replace(/(?:<br\/>\s*)*%%MATH_(\d+)%%(?:\s*<br\/>)*/g, (match, idxStr) => {
    const p = placeholders[Number(idxStr)];
    if (p.display) return p.html;
    return match.replace(`%%MATH_${idxStr}%%`, p.html);
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
  const [subject, setSubject] = useState<string>('A_Phy');
  const [loading, setLoading] = useState(false);
  const { user: authUser, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(authUser?.id);
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typewriterRef = useRef<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // New Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fetchingSessions, setFetchingSessions] = useState(true);

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
        .select('id, title, created_at')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setSessions(data);
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

  const handleLoadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setMessages([]);
    setLoading(true);
    if (window.innerWidth < 1024) setSidebarOpen(false);

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

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading || !authUser) return;

    const userMsgId = `u-${Date.now()}`;
    const userMsg: ChatMessage = { id: userMsgId, role: 'user', text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let activeSessionId = currentSessionId;
      
      // If no active session, create one
      if (!activeSessionId) {
        const words = question.split(/\s+/);
        const title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
        
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({ user_id: authUser.id, title })
          .select('id')
          .single();

        if (sessionError || !sessionData) throw new Error('Failed to create session');
        
        activeSessionId = sessionData.id;
        setCurrentSessionId(activeSessionId);
        setSessions(prev => [{ id: activeSessionId, title, created_at: new Date().toISOString() }, ...prev]);
      }

      // Save user message to Supabase
      await supabase.from('chat_messages').insert({
        session_id: activeSessionId,
        role: 'user',
        content: question,
      });

      // Fetch AI response
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: 'student', subject, question, topic: null }),
      });
      const data: AskResponse | { detail?: string; error?: string } = await res.json();

      if (!res.ok) {
        const errText = (data as any).detail || (data as any).error || 'Something went wrong';
        setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: `⚠️ ${errText}` }]);
        return;
      }

      const answer = (data as AskResponse).answer || '';
      const botMsgId = `a-${Date.now()}`;
      
      // Save AI message to Supabase
      await supabase.from('chat_messages').insert({
        session_id: activeSessionId,
        role: 'assistant',
        content: answer,
        metadata: data,
      });

      const botMsg: ChatMessage = {
        id: botMsgId, role: 'assistant', text: answer,
        response: data as AskResponse, displayedLen: 0,
      };
      setMessages((prev) => [...prev, botMsg]);
      startTypewriter(botMsg.id, answer);
    } catch {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: '⚠️ Network error — could not reach the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const selectedSubject = SUBJECTS.find((s) => s.value === subject);

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
    <div className="flex h-[calc(100dvh-5rem)] lg:h-[calc(100vh-5rem)] text-gray-900 dark:text-gray-100 overflow-hidden bg-slate-50 dark:bg-gray-950 relative">
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

      {/* ── Sidebar ── */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <Button onClick={handleNewChat} className="flex-1" variant="outline" leftIcon={<Plus size={16} />}>
            New Chat
          </Button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-3 p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {fetchingSessions ? (
            <div className="animate-pulse flex flex-col gap-2">
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              No recent chats
            </div>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleLoadSession(s.id)}
                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-3 transition-colors ${
                  currentSessionId === s.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <MessageSquare size={16} className="shrink-0 opacity-70" />
                <span className="truncate">{s.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full">
        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5"
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
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-400 dark:bg-blue-900 text-white shadow-lg shadow-blue-500/20 mb-5">
                  <Sparkles size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Ask me anything
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                  I'm your AI tutor for IGCSE &amp; A-Level Sciences. Ask a question about Physics, Chemistry, or Biology and I'll explain it using your curriculum resources.
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
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                        isBot
                          ? 'bg-blue-400 dark:bg-blue-900'
                          : avatarUrl
                          ? 'bg-transparent'
                          : 'bg-gray-400 dark:bg-gray-600'
                      }`}
                    >
                      {isBot ? (
                        '✦'
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
                            : 'bg-blue-400 dark:bg-blue-900 text-white shadow-md shadow-blue-500/20 rounded-tr-md'
                        }`}
                      >
                        {isBot ? (
                          <div className="ai-answer-content text-gray-800 dark:text-gray-200">
                            <span dangerouslySetInnerHTML={{ __html: formatAnswer(visibleText) }} />
                            {isTyping && <span className="ai-cursor" />}
                          </div>
                        ) : (
                          <span>{msg.text}</span>
                        )}
                      </div>

                      {/* Meta — timing + chunks (after typing finishes) */}
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
                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-400 dark:bg-blue-900">
                  ✦
                </div>
                <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
                  <div className="ai-thinking-dots text-gray-400 dark:text-gray-500">
                    <span /><span /><span />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 p-4 w-full">
          <div className="max-w-4xl mx-auto rounded-[2rem] border border-gray-200/80 dark:border-gray-700/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-5 sm:px-6 py-4 shadow-lg shadow-blue-500/5">
            {/* Subject pills */}
            <div className="flex gap-1.5 flex-wrap mb-3 items-center justify-between">
              <div className="flex gap-1.5 flex-wrap">
                {SUBJECTS.map((s) => {
                  const Icon = s.icon;
                  const active = subject === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSubject(s.value)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        active
                          ? 'bg-blue-400 dark:bg-blue-900 text-white shadow-md shadow-blue-500/20'
                          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon size={13} />
                      <span className="hidden sm:inline">{s.label}</span>
                      <span className="sm:hidden">{s.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input row */}
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                className="flex-1 resize-none rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 text-sm leading-relaxed text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all duration-200 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                rows={1}
                placeholder={`Ask about ${selectedSubject?.label ?? 'a subject'}…`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                style={{ maxHeight: '8rem', overflowY: 'auto' }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center bg-blue-500 dark:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:bg-blue-600 dark:hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
                aria-label="Send"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
