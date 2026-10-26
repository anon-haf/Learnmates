import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, BookOpen, Info, MessageCircle, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import NibrasAnimatedMark from './NibrasAnimatedMark';

const PREFERENCE_KEY_PREFIX = 'learnmates:nibras-welcome:';
const SNOOZE_DURATION_MS = 2 * 60 * 60 * 1000;

interface WelcomePreference {
  dismissed: boolean;
  snoozedUntil: number | null;
}

function getPreference(key: string): WelcomePreference {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return { dismissed: false, snoozedUntil: null };
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null) {
      return { dismissed: false, snoozedUntil: null };
    }
    if (
      !('dismissed' in parsed) ||
      !('snoozedUntil' in parsed) ||
      typeof parsed.dismissed !== 'boolean' ||
      (parsed.snoozedUntil !== null && typeof parsed.snoozedUntil !== 'number')
    ) {
      return { dismissed: false, snoozedUntil: null };
    }
    return {
      dismissed: parsed.dismissed,
      snoozedUntil: parsed.snoozedUntil,
    };
  } catch (error) {
    console.error('Could not read Nibras welcome preference from local storage:', error);
    return { dismissed: false, snoozedUntil: null };
  }
}

function savePreference(key: string, preference: WelcomePreference): void {
  try {
    localStorage.setItem(key, JSON.stringify(preference));
  } catch (error) {
    console.error('Could not save Nibras welcome preference to local storage:', error);
  }
}

export default function NibrasTesterWelcome() {
  const { user } = useAuth();
  const { role, loading } = useUserRole(user?.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const handledDevTrigger = useRef(false);
  const snoozeTimer = useRef<number | null>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const isTester = Boolean(user && !loading && role === 'tester');
  const preferenceKey = user ? `${PREFERENCE_KEY_PREFIX}${user.id}` : '';

  useEffect(() => {
    if (!isTester || !user) {
      setIsOpen(false);
      return;
    }

    const forceOpen = import.meta.env.DEV
      && new URLSearchParams(location.search).get('nibras-intro') === 'show';
    if (forceOpen && !handledDevTrigger.current) {
      handledDevTrigger.current = true;
      setIsOpen(true);
      return;
    }

    if (forceOpen) return;
    const preference = getPreference(preferenceKey);
    if (preference.dismissed) return;
    if (preference.snoozedUntil && preference.snoozedUntil > Date.now()) return;
    setIsOpen(true);
  }, [isTester, location.search, preferenceKey, user]);

  const snooze = useCallback(() => {
    if (!preferenceKey) return;
    const snoozedUntil = Date.now() + SNOOZE_DURATION_MS;
    const preference = getPreference(preferenceKey);
    savePreference(preferenceKey, { ...preference, snoozedUntil });
    setIsOpen(false);
    if (snoozeTimer.current !== null) window.clearTimeout(snoozeTimer.current);
    snoozeTimer.current = window.setTimeout(() => {
      const currentPreference = getPreference(preferenceKey);
      if (!currentPreference.dismissed) setIsOpen(true);
    }, SNOOZE_DURATION_MS);
  }, [preferenceKey]);

  useEffect(() => () => {
    if (snoozeTimer.current !== null) {
      window.clearTimeout(snoozeTimer.current);
      snoozeTimer.current = null;
    }
  }, [preferenceKey]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstActionRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        snooze();
        return;
      }
      if (event.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusableElements?.length) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, snooze]);

  const dismissPermanently = () => {
    if (preferenceKey) {
      savePreference(preferenceKey, { dismissed: true, snoozedUntil: null });
    }
    setIsOpen(false);
  };

  const openNibras = () => {
    snooze();
    navigate('/nibras');
  };

  return (
    <AnimatePresence>
      {isOpen && isTester && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={event => {
            if (event.target === event.currentTarget) snooze();
          }}
        >
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="nibras-welcome-title"
            aria-describedby="nibras-welcome-description"
            className="relative max-h-[min(90dvh,900px)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/70 bg-white text-slate-800 shadow-2xl shadow-slate-950/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            onMouseDown={event => event.stopPropagation()}
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 px-6 pb-7 pt-7 text-white sm:px-9 sm:pb-9 sm:pt-8">
              <div className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
              <button
                type="button"
                onClick={snooze}
                aria-label="Close Nibras welcome"
                className="absolute right-4 top-4 rounded-full p-2 text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                  <NibrasAnimatedMark className="h-8 w-8" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Tester preview</p>
                  <p className="text-sm font-semibold text-white/95">Meet Nibras</p>
                </div>
              </div>
              <h2 id="nibras-welcome-title" className="relative mt-5 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
                A study companion built around your exam journey.
              </h2>
              <p id="nibras-welcome-description" className="relative mt-3 max-w-2xl text-sm leading-relaxed text-blue-50 sm:text-base">
                Nibras is Learnmates&apos; AI tutor, designed to help you understand the thinking behind exam answers—not just copy them.
              </p>
            </div>

            <div className="px-5 py-6 sm:px-9 sm:py-8">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                <article className="flex gap-4 py-4 first:pt-0">
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Ask Nibras</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      Chat with an AI tutor for supported IGCSE, CAIE A-Level, and Edexcel IAL Biology, Chemistry, and Physics. Ask follow-up questions and explore concepts in a conversational way.
                    </p>
                  </div>
                </article>
                <article className="flex gap-4 py-4">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Understand past-paper questions</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      On topical questions and individual past papers, Nibras explains how to work toward the answer. For MCQs it explains each option; for written questions you can ask follow-ups or check your answers part by part.
                    </p>
                  </div>
                </article>
                <article className="flex gap-4 py-4 last:pb-0">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Focused on your exams</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      Nibras is developed using past papers, mark schemes, and syllabus or specification content, so its explanations stay focused on what your exams expect.
                    </p>
                  </div>
                </article>
              </div>

              <div className="mt-5 flex gap-3 border-t border-slate-200 pt-4 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p>Nibras is still an AI and can make mistakes. Double-check anything uncertain and let us know if something seems wrong.</p>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={dismissPermanently}
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    Don&apos;t show me again
                  </button>
                  <button
                    ref={firstActionRef}
                    type="button"
                    onClick={snooze}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Show me later
                  </button>
                </div>
                <button
                  type="button"
                  onClick={openNibras}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                  Open Nibras
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
