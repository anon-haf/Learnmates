import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BookOpen,
  Flame,
  Lock,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Sun,
  Trophy,
  User,
  X,
  Layers,
  LibraryBig,
  Coffee,
  RotateCcw,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useUser } from '../context/UserContext';
import { fetchProfile } from '../utils/profileSync';
import { useLockInSession } from '../components/lock-in/LockInContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems: { name: string; href: string; icon: typeof Trophy; disabled?: boolean; beta?: boolean }[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Curriculum', href: '/curriculum', icon: LibraryBig },
  { name: 'Past Papers', href: '/pastpapers', icon: FileText },
  { name: 'Topicals', href: '/topicals', icon: Layers },
  { name: 'Lock in', href: '/lock_in', icon: Lock },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'AI Tutor', href: '/ai', icon: MessageCircle, beta: true },
];

interface ProfileSectionProps {
  displayName: string;
  username: string | null;
  sidebarExpanded: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

function ProfileSection({ displayName, username, sidebarExpanded, isMobile = false, onClose }: ProfileSectionProps) {
  const textTransition = isMobile ? '' : `overflow-hidden transition-all duration-500 ease-in-out ${sidebarExpanded ? 'max-w-[220px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}`;
  const textClassName = isMobile ? 'ml-3 overflow-hidden' : textTransition;

  return (
    <Link
      to="/dashboard/profile"
      onClick={onClose}
      className={isMobile
        ? 'flex items-center rounded-xl px-4 py-3 transition-colors hover:bg-blue-50 dark:hover:bg-gray-800'
        : 'flex items-center rounded-xl -mx-2 px-2 py-1.5 transition-colors hover:bg-blue-50 dark:hover:bg-gray-800'
      }
    >
      <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${isMobile ? 'bg-blue-400 dark:bg-blue-900' : 'bg-blue-400 dark:bg-blue-900'} text-white`}>
        <User className="h-6 w-6" />
      </span>
      <div className={textClassName}>
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
        {username && (
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">@{username}</p>
        )}
      </div>
    </Link>
  );
}

interface SignOutButtonProps {
  onClick: () => void;
  sidebarExpanded: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

function SignOutButton({ onClick, sidebarExpanded, isMobile = false, onClose }: SignOutButtonProps) {
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={() => { onClick(); onClose?.(); }}
        className="mt-3 flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
      >
        <LogOut className="h-6 w-6" />
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative mt-3 flex h-12 items-center rounded-xl bg-red-600 text-white transition-all duration-300 ease-in-out overflow-hidden hover:bg-red-700 dark:hover:bg-red-500 ${sidebarExpanded ? 'w-full px-3 justify-start' : 'w-12 justify-center'
        }`}
      aria-label="Sign out"
    >
      <span className="absolute left-3 flex h-12 items-center justify-center">
        <LogOut className="h-6 w-6" />
      </span>
      <span className={`absolute left-14 top-1/2 -translate-y-1/2 w-[96px] transition-opacity duration-500 ease-in-out ${sidebarExpanded ? 'opacity-100' : 'opacity-0'
        }`}>
        log out
      </span>
    </button>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user: authUser, signOut } = useAuth();
  const { user, setUser } = useUser();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [displayName, setDisplayName] = useState('Student');
  const [username, setUsername] = useState<string | null>(null);

  const { sessionState, currentDevice, updateSessionState, endSessionContext } = useLockInSession();

  const isLocked = currentDevice?.status === 'locked' && !!sessionState;
  const isOpen = currentDevice?.status === 'open' && !!sessionState;
  const isInSession = isLocked || isOpen;

  const handleEndSession = async () => {
    if (!authUser) return;
    const { supabase } = await import('../lib/supabaseClient');
    await supabase
      .from('user_devices')
      .update({ status: 'lobby', lock_until: null })
      .eq('user_id', authUser.id);
    await endSessionContext();
    navigate('/lock_in');
  };

  const handleTakeBreak = async () => {
    if (!sessionState) return;
    if (sessionState.breaks_taken >= sessionState.breaks_allowed) return;
    await updateSessionState({ current_break_started_at: new Date().toISOString() });
  };

  const handleEndBreak = async () => {
    if (!sessionState?.current_break_started_at) return;
    const started = new Date(sessionState.current_break_started_at).getTime();
    const now = new Date().getTime();
    const durationMs = now - started;
    const isShortBreak = durationMs < 2 * 60 * 1000;
    await updateSessionState({
      current_break_started_at: null,
      breaks_taken: isShortBreak ? sessionState.breaks_taken : sessionState.breaks_taken + 1,
      paused_duration_ms: sessionState.paused_duration_ms + durationMs
    });
  };

  const isBreak = !!sessionState?.current_break_started_at;

  useEffect(() => {
    if (!authUser) return;

    const loadProfile = async () => {
      const profile = await fetchProfile(authUser.id);
      const name =
        profile?.name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split('@')[0] ||
        'Student';

      setDisplayName(name);
      setUsername(profile?.username ?? null);

      if (user?.name !== name) {
        setUser({
          name,
          progress: user?.progress ?? {},
          recentCourses: user?.recentCourses ?? [],
        });
      }
    };

    loadProfile();
  }, [authUser, setUser, user?.name, user?.progress, user?.recentCourses]);

  const handleSignOut = async () => {
    await signOut();
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex text-gray-900 dark:text-gray-100">
      {/* Desktop sidebar */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 border-r border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm overflow-hidden transition-[width,box-shadow,background-color] duration-500 ease-in-out ${sidebarExpanded ? 'w-72 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50' : 'w-20'
          }`}
      >
        <div className="flex h-20 items-center border-b border-gray-200/80 dark:border-gray-700/80 transition-all duration-500 px-4 justify-start">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center">
            <img src="/logo.svg" alt="Learnmates" className="h-12 w-12" />
          </span>
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${sidebarExpanded ? 'max-w-[220px] opacity-100 ml-3' : 'max-w-0 opacity-0 ml-0'}`}>
            <p className="text-base font-bold bg-blue-600 bg-clip-text text-transparent whitespace-nowrap">
              Learnmates
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            if (item.disabled) {
              return (
                <div
                  key={item.name}
                  title={`${item.name} — coming soon`}
                  aria-disabled="true"
                  className="group flex items-center rounded-xl py-3.5 text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed px-0 justify-start"
                >
                  <span className="flex h-6 w-20 min-w-[5rem] flex-shrink-0 items-center justify-start pl-5">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className={`flex items-center gap-2 overflow-hidden transition-all duration-500 ease-in-out ${sidebarExpanded ? 'opacity-100 max-w-[220px] ml-1' : 'opacity-0 max-w-0'}`}>
                    <span className="whitespace-nowrap">{item.name}</span>
                    <span className="whitespace-nowrap rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Soon
                    </span>
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                to={item.href}
                title={item.name}
                className={`group flex items-center rounded-xl py-3.5 text-sm font-medium transition-all duration-300 ease-in-out ${active
                  ? 'bg-blue-400 dark:bg-blue-900 text-white shadow-md shadow-blue-500/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800'
                  } px-0 justify-start`}
              >
                <span className="flex h-6 w-20 min-w-[5rem] flex-shrink-0 items-center justify-start pl-5">
                  <Icon className="h-6 w-6" />
                </span>
                <span className={`flex items-center gap-2 overflow-hidden transition-all duration-500 ease-in-out ${sidebarExpanded ? 'opacity-100 max-w-[220px] ml-1' : 'opacity-0 max-w-0'}`}>
                  <span className="whitespace-nowrap">{item.name}</span>
                  {item.beta && (
                    <span className="whitespace-nowrap rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      Beta
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-200/80 dark:border-gray-700/80 p-4">
          <ProfileSection
            displayName={displayName}
            username={username}
            sidebarExpanded={sidebarExpanded}
          />
          <SignOutButton
            onClick={handleSignOut}
            sidebarExpanded={sidebarExpanded}
          />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 lg:hidden flex flex-col"
            >
              <div className="flex h-16 items-center justify-between px-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <img src="/logo.svg" alt="Learnmates" className="h-8 w-8" />
                  <span className="font-bold text-blue-600">Learnmates</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  if (item.disabled) {
                    return (
                      <div
                        key={item.name}
                        aria-disabled="true"
                        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed"
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-6 w-6" />
                          {item.name}
                        </span>
                        <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          Soon
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-6 w-6" />
                        {item.name}
                      </span>
                      {item.beta && (
                        <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                          Beta
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <ProfileSection
                  displayName={displayName}
                  username={username}
                  sidebarExpanded={true}
                  isMobile={true}
                  onClose={() => setSidebarOpen(false)}
                />
                <SignOutButton
                  onClick={handleSignOut}
                  sidebarExpanded={true}
                  isMobile={true}
                  onClose={() => setSidebarOpen(false)}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen lg:pl-20">
        <LockInHeader setSidebarOpen={setSidebarOpen} />
        {!isInSession && (
          <header className="sticky top-0 z-30 h-20 border-b border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
            <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="rounded-lg p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? (
                    <Sun className="h-6 w-6 text-yellow-500" />
                  ) : (
                    <Moon className="h-6 w-6 text-gray-600" />
                  )}
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </header>
        )}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function LockInHeader({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const { sessionState, currentDevice, updateSessionState, endSessionContext } = useLockInSession();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');

  const isLocked = currentDevice?.status === 'locked' && !!sessionState;
  const isOpen = currentDevice?.status === 'open' && !!sessionState;
  const isInSession = isLocked || isOpen;
  const isBreak = !!sessionState?.current_break_started_at;

  const handleEndSession = async () => {
    if (!authUser) return;
    const { supabase } = await import('../lib/supabaseClient');
    await supabase
      .from('user_devices')
      .update({ status: 'lobby', lock_until: null })
      .eq('user_id', authUser.id);
    await endSessionContext();
    navigate('/lock_in');
  };

  const handleTakeBreak = async () => {
    if (!sessionState) return;
    if (sessionState.breaks_taken >= sessionState.breaks_allowed) return;
    await updateSessionState({ current_break_started_at: new Date().toISOString() });
  };

  const handleEndBreak = async () => {
    if (!sessionState?.current_break_started_at) return;
    const started = new Date(sessionState.current_break_started_at).getTime();
    const now = new Date().getTime();
    const durationMs = now - started;
    const isShortBreak = durationMs < 2 * 60 * 1000;
    await updateSessionState({
      current_break_started_at: null,
      breaks_taken: isShortBreak ? sessionState.breaks_taken : sessionState.breaks_taken + 1,
      paused_duration_ms: sessionState.paused_duration_ms + durationMs
    });
  };

  useEffect(() => {
    if (!currentDevice?.lock_until) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(currentDevice.lock_until).getTime() + (sessionState?.paused_duration_ms || 0);
      const distance = end - now;

      if (distance < 0 && !isBreak) {
        setTimeLeft('00:00:00');
        handleEndSession();
        return;
      } else if (distance < 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentDevice?.lock_until, sessionState?.paused_duration_ms, isBreak, handleEndSession]);

  const breaksRemaining = (sessionState?.breaks_allowed || 0) - (sessionState?.breaks_taken || 0);
  const canTakeBreak = breaksRemaining > 0 && !isBreak;

  if (!isInSession) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              {isLocked ? (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              ) : (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isLocked ? 'Locked In' : 'Device Open'}
              </span>
            </div>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
            <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">
              {timeLeft}
            </span>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {breaksRemaining} break{breaksRemaining !== 1 ? 's' : ''} left
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isBreak && canTakeBreak && (
            <button
              type="button"
              onClick={handleTakeBreak}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors text-sm font-medium"
            >
              <Coffee className="w-4 h-4" />
              Take Break
            </button>
          )}
          {isBreak && (
            <button
              type="button"
              onClick={handleEndBreak}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              End Break
            </button>
          )}
          <button
            type="button"
            onClick={handleEndSession}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
          >
            <Lock className="w-4 h-4" />
            End Session
          </button>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="rounded-lg p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="h-6 w-6 text-yellow-500" />
            ) : (
              <Moon className="h-6 w-6 text-gray-600" />
            )}
          </button>
          <button
            type="button"
            className="rounded-lg p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Notifications "
          >
            <Bell className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
}