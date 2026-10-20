import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getAuthRedirectUrl, supabase } from '../lib/supabaseClient';
import { updateStreak } from '../utils/streakUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; data?: any }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const streakUpdatedUserIds = useRef(new Set<string>());

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const updateStreakForUser = (userId: string) => {
      if (streakUpdatedUserIds.current.has(userId)) return;
      streakUpdatedUserIds.current.add(userId);
      void updateStreak().catch((error) => {
        streakUpdatedUserIds.current.delete(userId);
        console.error('Failed to update user streak:', error);
      });
    };

    const initAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const oauthError = params.get('error') ?? hashParams.get('error');
      if (oauthError) {
        const description =
          (params.get('error_description') ?? hashParams.get('error_description') ?? oauthError)
            .replace(/\+/g, ' ');
        sessionStorage.setItem('oauth_error', description);

        const cleanPath = window.location.pathname || '/';
        window.history.replaceState({}, document.title, cleanPath);

        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
          return;
        }
      }

      if (import.meta.env.DEV) {
        (window as any).mockLogin = () => {
          localStorage.setItem('DEV_MOCK_LOGIN', 'true');
          window.location.reload();
        };
        (window as any).mockLogout = () => {
          localStorage.removeItem('DEV_MOCK_LOGIN');
          window.location.reload();
        };
        
        if (localStorage.getItem('DEV_MOCK_LOGIN') === 'true') {
          const mockUser = {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'dev@localhost',
            user_metadata: { name: 'Dev User' },
            role: 'authenticated',
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          } as User;
          const mockSession = {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: mockUser
          } as Session;
          
          setSession(mockSession);
          setUser(mockUser);
          setLoading(false);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        updateStreakForUser(session.user.id);
      }
    };

    void initAuth();

    if (import.meta.env.DEV && localStorage.getItem('DEV_MOCK_LOGIN') === 'true') {
      return; // Skip setting up real auth listener
    }

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          updateStreakForUser(session.user.id);
        }
      }
    );
    subscription = authSubscription;

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null, data };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const redirectTo = getAuthRedirectUrl('/login');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error('Google sign-in error:', error.message);
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    return { error: error?.message ?? null };
  };

  const resetPassword = async (email: string) => {
    const redirectTo = getAuthRedirectUrl('/reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
        verifyOtp,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}