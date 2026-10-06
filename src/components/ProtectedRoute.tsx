import { ReactNode, useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { fetchProfile } from '../utils/profileSync';
import { useReducedMotion } from '../context/ReducedMotionContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireCompleteProfile?: boolean;
}

export function ProtectedRoute({ children, requireCompleteProfile = false }: ProtectedRouteProps) {
  const location = useLocation();
  const { isReducedMotion } = useReducedMotion();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    let subscription: { unsubscribe: () => void } | null = null;

    const validateAuth = async () => {
      if (!mountedRef.current) return;

      // Always get fresh session on route change
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mountedRef.current) return;

      if (!session?.user) {
        setUser(null);
        setProfileComplete(false);
        setIsLoading(false);
        return;
      }

      setUser({ id: session.user.id });

      if (requireCompleteProfile) {
        try {
          const profile = await fetchProfile(session.user.id);
          if (mountedRef.current) {
            setProfileComplete(Boolean(profile?.username && profile?.profile_complete));
          }
        } catch {
          if (mountedRef.current) {
            setProfileComplete(false);
          }
        }
      } else {
        if (mountedRef.current) {
          setProfileComplete(true);
        }
      }

      if (mountedRef.current) {
        setIsLoading(false);
      }
    };

    validateAuth();

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setProfileComplete(false);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Re-validate on any auth change
        validateAuth();
      }
    });
    subscription = data.subscription;

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [location.pathname, requireCompleteProfile]);

  if (isLoading) {
    // When reduced motion is on, skip all entry animations to avoid
    // the flash caused by elements starting at opacity:0
    const noAnimate = isReducedMotion;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-6">
          {/* Logo with subtle animation */}
          <motion.div
            initial={noAnimate ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={noAnimate ? { duration: 0 } : { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex justify-center"
          >
            <div className="relative w-20 h-20">
              {/* Rotating gradient border — static in reduced motion mode */}
              <motion.div
                animate={noAnimate ? {} : { rotate: 360 }}
                transition={noAnimate ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-teal-500 to-indigo-600 opacity-30 blur-xl"
              />
              {/* Inner logo circle */}
              <div className="absolute inset-2 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-xl flex items-center justify-center border border-slate-200/50 dark:border-gray-700/50">
                <img 
                  src="/logo.svg" 
                  alt="Learnmates" 
                  className="w-10 h-10"
                  style={{ filter: "drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Dots progress indicator */}
          <motion.div
            initial={noAnimate ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={noAnimate ? { duration: 0 } : { delay: 0.3, duration: 0.5 }}
            className="flex justify-center gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={noAnimate ? false : { scale: 0 }}
                animate={noAnimate ? { scale: 1 } : { scale: [1, 1.4, 1] }}
                transition={noAnimate ? { duration: 0 } : {
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
                className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-teal-500"
              />
            ))}
          </motion.div>

          {/* Loading text — no shimmer in reduced motion mode */}
          <motion.div
            initial={noAnimate ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={noAnimate ? { duration: 0 } : { delay: 0.5, duration: 0.4 }}
            className="text-sm text-slate-500 dark:text-slate-400 font-medium relative overflow-hidden inline-block py-1 px-4"
          >
            <span className="relative z-10">Loading your dashboard</span>
            {!noAnimate && (
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
              />
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireCompleteProfile && !profileComplete) {
    return <Navigate to="/login" replace />;
  }

  return <>{children ?? <Outlet />}</>;
}