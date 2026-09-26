import { FormEvent, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, BookOpen, Loader2, FlaskConical, Dna, Rocket, Sigma, PieChart, Gauge, User, FileText, Settings, Check } from 'lucide-react';
import {
  getAvailableLevels,
  getAvailableBoardsForLevel,
  getAvailableSubjectsForLevelAndBoard,
  BoardKey,
} from '../utils/curriculumData';
import {
  ensureProfile,
  isUsernameAvailable,
} from '../utils/authHelpers';
import { saveFavoriteSubjects } from '../utils/favoriteSubjects';
import { fetchProfile, saveFavoriteSubjectsForUser } from '../utils/profileSync';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from '@/components/ui';

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  'Chemistry': <FlaskConical className="" />,
  'Biology': <Dna className="" />,
  'Physics': <Rocket className="" />,
  'Mathematics': <Sigma className="" />,
  'Pure Mathematics': <Sigma className="" />,
  'Statistics': <PieChart className="" />,
  'Mechanics': <Gauge className="" />,

};



const LEVEL_COLORS: Record<string, string> = {
  'IGCSE': 'bg-blue-500',
  'A-Level': 'bg-purple-500',

};

const BOARD_COLORS: Record<string, string> = {
  cambridge: 'bg-gray-800',
  edexcel: 'bg-gray-800',

};

const CambridgeLogo = () => (
  <img
    src="/logos/Cambridge.svg"
    alt="Cambridge Logo"
    className="w-9 h-9 text-white"
  />
);

const EdexcelLogo = () => (
  <img
    src="/logos/Pearson.svg"
    alt="Edexcel Logo"
    className="w-9 h-9 text-white"
  />
);


const AQALogo = () => (
  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" stroke="currentColor" strokeWidth="2.5" />
    <path d="M8 12H16M12 8V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const OCALogo = () => (
  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" stroke="currentColor" strokeWidth="2.5" />
    <path d="M8 12L11 15L16 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const boardLogos: Record<BoardKey, () => React.ReactNode> = {
  cambridge: CambridgeLogo,
  edexcel: EdexcelLogo,
  aqa: AQALogo,
  ocr: OCALogo,
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const { signIn, signUp, signInWithGoogle, verifyOtp, user: authUser, loading: authLoading } = useAuth();
  const [verificationToken, setVerificationToken] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const navigate = useNavigate();

  // Onboarding state - simplified steps
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [setupStep, setSetupStep] = useState<'username' | 'preferences' | 'terms' | 'complete'>('username');
  const [authUsername, setAuthUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authUsernameError, setAuthUsernameError] = useState('');
  const [authDisplayNameError, setAuthDisplayNameError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [modalLevel, setModalLevel] = useState<string | null>(null);
  const [selectedBoards, setSelectedBoards] = useState<BoardKey[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<{ subject: string; board: BoardKey }[]>([]);

  // Validation patterns
  const usernameValidationPattern = /^[a-z0-9._-]{3,30}$/i;
  const inappropriateUsernamePattern = /\b(?:admin|root|support|staff|moderator|god|sex|fuck|shit|bitch|cunt|pussy|dick|asshole)\b/i;
  const sanitizeUsername = (value: string) => value.trim().toLowerCase().replace(/^@+/, '');
  const isValidUsername = (value: string) => usernameValidationPattern.test(value) && !inappropriateUsernamePattern.test(value);
  const isValidDisplayName = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length >= 3 && trimmed.length <= 50 && !inappropriateUsernamePattern.test(trimmed);
  };

  const sessionOptions = ['May/Jun', 'Jan', 'Oct/Nov', 'Feb/Mar'];
  const availableLevels = getAvailableLevels();
  const availableBoards = modalLevel ? getAvailableBoardsForLevel(modalLevel) : [];
  const availableSubjects = modalLevel && selectedBoards.length > 0
    ? selectedBoards.flatMap((board) =>
      getAvailableSubjectsForLevelAndBoard(modalLevel, board).map((subject) => ({
        subject,
        board,
      }))
    )
    : [];

  const [checkingSession, setCheckingSession] = useState(true);
  const onboardingBootstrapped = useRef(false);
  const checkedAuthUserId = useRef<string | null>(null);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    const oauthError = sessionStorage.getItem('oauth_error');
    if (!oauthError) return;

    sessionStorage.removeItem('oauth_error');
    setError(oauthError);
  }, []);

  // Check if user just logged in and needs onboarding
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (authLoading) return;

      if (!authUser) {
        checkedAuthUserId.current = null;
        onboardingBootstrapped.current = false;
        setCheckingSession(false);
        return;
      }

      if (checkedAuthUserId.current === authUser.id) {
        setCheckingSession(false);
        return;
      }

      const profileReady = await ensureProfile(authUser);
      if (!profileReady) {
        setError('Unable to set up your profile. Please refresh and try again.');
        setCheckingSession(false);
        return;
      }

      const profile = await fetchProfile(authUser.id);
      checkedAuthUserId.current = authUser.id;

      if (profile?.username && profile?.profile_complete) {
        navigate('/dashboard', { replace: true });
        return;
      }

      if (!onboardingBootstrapped.current) {
        onboardingBootstrapped.current = true;
        setShowOnboarding(true);

        if (!profile?.username) {
          setDisplayName(
            profile?.name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || ''
          );
          setSetupStep('username');
        } else {
          setModalLevel(profile.study_level);
          setSelectedBoards((profile.boards ?? []) as BoardKey[]);
          setSelectedSession(profile.exam_session);
          setAuthUsername(profile.username);
          setDisplayName(profile.name || '');
          setSetupStep(profile.study_level ? 'preferences' : 'username');
        }
      }

      setCheckingSession(false);
    };

    checkProfileCompletion();
  }, [authUser, authLoading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      if (isCreatingAccount) {
        const { error, data } = await signUp(normalizedEmail, password);
        if (error) {
          setError(error);
        } else if (data?.user?.identities?.length === 0) {
          // Supabase returns a fake success if the email already exists.
          setError('An account with this email already exists. Try signing in.');
          setLoading(false);
          return;
        } else if (data?.session) {
          setSuccess('Account created successfully!');
          // useEffect will redirect to onboarding
        } else {
          setSuccess('We sent a verification code to your email. Please check your inbox and enter the code below.');
          setShowOtpInput(true);
        }
      } else {
        const { error } = await signIn(normalizedEmail, password);
        if (error) {
          if (error.toLowerCase().includes('email not confirmed')) {
            setError('Please verify your email first. Enter the code we sent you, or request a new one.');
            setShowOtpInput(true);
          } else {
            setError(error);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const handleVerifyToken = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await verifyOtp(email.trim().toLowerCase(), verificationToken);

      if (error) {
        setError(error || 'Invalid verification code. Please check your email and try again.');
        setLoading(false);
        return;
      }

      setShowOtpInput(false);
      setIsCreatingAccount(false);
      setVerificationToken('');
      setSuccess('Email verified successfully! Setting up your account...');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthUsernameError('');
    setAuthDisplayNameError('');

    const usernameValue = sanitizeUsername(authUsername);
    const nameValue = displayName.trim();

    if (!usernameValue) {
      setAuthUsernameError('Choose a username to continue.');
      return;
    }

    if (!isValidUsername(usernameValue)) {
      setAuthUsernameError('Usernames must be 3-30 characters and may include letters, numbers, dots, dashes, and underscores.');
      return;
    }

    if (!isValidDisplayName(nameValue)) {
      setAuthDisplayNameError('Display name must be at least 3 characters and cannot contain inappropriate words.');
      return;
    }

    if (!authUser) {
      setAuthUsernameError('Sign in before continuing.');
      return;
    }

    const profileReady = await ensureProfile(authUser);
    if (!profileReady) {
      setAuthUsernameError('Unable to set up your profile. Please refresh and try again.');
      return;
    }

    const available = await isUsernameAvailable(usernameValue, authUser.id);
    if (!available) {
      setAuthUsernameError('That username is already taken. Please choose another one.');
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: usernameValue, name: nameValue })
      .eq('id', authUser.id);

    if (updateError) {
      console.error('Failed to save profile:', updateError.message);
      setAuthUsernameError('Unable to save your profile right now. Please try again.');
      return;
    }

    setAuthUsername(usernameValue);
    setDisplayName(nameValue);
    setSetupStep('preferences');
  };

  const handleTermsContinue = () => {
    if (!acceptedTerms) return;
    setSetupStep('complete');
  };

  const handleLevelSelect = (level: string) => {
    setModalLevel(level);
    setSelectedBoards([]);
    setSelectedSession(null);
    setSelectedSubjects([]);
  };

  const handleToggleBoard = (board: BoardKey) => {
    setSelectedBoards((prev) =>
      prev.includes(board) ? prev.filter((item) => item !== board) : [...prev, board]
    );
    setSelectedSubjects([]);
  };

  const handleSubjectToggle = (subject: string, board: BoardKey) => {
    setSelectedSubjects((prev) => {
      const exists = prev.some((s) => s.subject === subject && s.board === board);
      return exists
        ? prev.filter((s) => !(s.subject === subject && s.board === board))
        : [...prev, { subject, board }];
    });
  };

  const handleCompleteOnboarding = async () => {
    if (!selectedSession || !authUser || !modalLevel || selectedSubjects.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const profileReady = await ensureProfile(authUser);
      if (!profileReady) {
        setError('Unable to set up your profile. Please refresh and try again.');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          study_level: modalLevel,
          boards: selectedBoards,
          exam_session: selectedSession,
          profile_complete: true,
          onboarding_skipped: false,
        })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('Failed to update profile:', updateError.message);
        setError('Unable to save your profile. Please try again.');
        setLoading(false);
        return;
      }

      const localSubjects = selectedSubjects.map((item) => ({
        subject: item.subject,
        level: modalLevel,
        board: item.board,
      }));

      if (localSubjects.length > 0) {
        const { error: subjectsError } = await saveFavoriteSubjectsForUser(authUser.id, localSubjects);

        if (subjectsError) {
          console.error('Failed to save favorite subjects:', subjectsError);
          setError('Profile saved, but subjects could not be saved. You can add them from your dashboard.');
        } else {
          saveFavoriteSubjects(localSubjects);
        }
      }

      setSetupStep('complete');

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('Onboarding completion error:', err);
      setError('Something went wrong while finishing setup. Please try again.');
    }

    setLoading(false);
  };

  if (authLoading || checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const renderAuthForm = () => (
    <Card variant="elevated" padding="lg" className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Learnmates account
        </p>
        <CardTitle className="text-3xl sm:text-4xl">
          {isCreatingAccount ? 'Create your account' : 'Welcome back'}
        </CardTitle>
        <CardDescription className="mt-3 text-sm max-w-xl mx-auto">
          {isCreatingAccount
            ? 'Start learning with a Learnmates account. Use your email to create a new account and access resources instantly.'
            : 'Sign in to access your personalized dashboard, saved subjects, and topicals generator.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {showOtpInput ? (
          <VerificationForm
            email={email}
            verificationToken={verificationToken}
            setVerificationToken={setVerificationToken}
            error={error}
            success={success}
            loading={loading}
            handleVerifyToken={handleVerifyToken}
            onBack={() => {
              setShowOtpInput(false);
              setError('');
              setSuccess('');
              setVerificationToken('');
            }}
            onResend={async () => {
              setLoading(true);
              setError('');
              const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
              });
              if (error) {
                setError(error.message || 'Failed to resend code. Please try again.');
              } else {
                setSuccess('New verification code sent! Please check your email.');
              }
              setLoading(false);
            }}
          />
        ) : (
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            error={error}
            success={success}
            loading={loading}
            isCreatingAccount={isCreatingAccount}
            handleSubmit={handleSubmit}
            signInWithGoogle={signInWithGoogle}
            onToggleAuth={() => {
              setIsCreatingAccount(!isCreatingAccount);
              setError('');
              setSuccess('');
              setShowOtpInput(false);
              setVerificationToken('');
            }}
          />
        )}
      </CardContent>
    </Card>
  );

  const steps = [
    { id: 'username', label: 'Username', icon: <User className="w-6 h-6" /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings className="w-6 h-6" /> },
    { id: 'terms', label: 'Terms', icon: <FileText className="w-6 h-6" /> },
    { id: 'complete', label: 'Complete', icon: <Check className="w-6 h-6" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === setupStep);
  const completedSteps = new Set<string>();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AnimatePresence mode="wait">
        {!showOnboarding ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex items-center justify-center px-4 py-10"
          >
            {renderAuthForm()}
          </motion.div>
        ) : (
          <motion.div
            key="onboarding-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex flex-col"
          >
            {/* Progress Header */}
            <header className="px-4 py-6 max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl text-primary-600 dark:text-primary-400">{steps[currentStepIndex]?.icon}</span>
                  <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                      {steps[currentStepIndex]?.label || 'Welcome'}
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Step {currentStepIndex + 1} of {steps.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step Indicator Line */}
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center flex-1 relative"
                  >
                    {/* Connecting line */}
                    {index < steps.length - 1 && (
                      <motion.div
                        className="absolute top-[20px] left-1/2 w-full h-0.5 -translate-y-1/2"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: index < currentStepIndex ? 1 : 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        style={{ transformOrigin: 'left center' }}
                      >
                        <div
                          className="w-full h-full bg-neutral-200 dark:bg-neutral-700 rounded-full"
                          style={{
                            background: index < currentStepIndex
                              ? '#2563eb'
                              : 'transparent'
                          }}
                        />
                      </motion.div>
                    )}

                    <div className="relative flex items-center justify-center w-full">

                      {/* Step circle/square */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: index * 0.1 }}
                        className={`relative w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${index < currentStepIndex
                          ? 'bg-primary-600 text-white'
                          : index === currentStepIndex
                            ? 'bg-white dark:bg-neutral-800 border-3 border-blue-500 text-blue-500'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500'
                          }`}
                      >
                        {index < currentStepIndex ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="flex items-center justify-center">{step.icon}</span>
                        )}
                      </motion.div>
                    </div>
                    <span className={`text-xs font-medium mt-2 transition-colors ${index <= currentStepIndex
                      ? 'text-neutral-900 dark:text-neutral-50'
                      : 'text-neutral-400 dark:text-neutral-500'
                      }`}>
                      {step.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </header>

            {/* Onboarding Content */}
            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={setupStep}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  {setupStep === 'username' && (
                    <UsernameStep
                      authUsername={authUsername}
                      setAuthUsername={setAuthUsername}
                      displayName={displayName}
                      setDisplayName={setDisplayName}
                      authUsernameError={authUsernameError}
                      authDisplayNameError={authDisplayNameError}
                      handleSubmit={handleUsernameSubmit}
                      loading={loading}
                    />
                  )}

                  {setupStep === 'preferences' && (
                    <PreferencesStep
                      availableLevels={availableLevels}
                      modalLevel={modalLevel}
                      setModalLevel={setModalLevel}
                      availableBoards={availableBoards}
                      selectedBoards={selectedBoards}
                      setSelectedBoards={setSelectedBoards}
                      availableSubjects={availableSubjects}
                      selectedSubjects={selectedSubjects}
                      setSelectedSubjects={setSelectedSubjects}
                      sessionOptions={sessionOptions}
                      selectedSession={selectedSession}
                      setSelectedSession={setSelectedSession}
                      onBack={() => setSetupStep('username')}
                      onContinue={() => setSetupStep('terms')}
                      loading={loading}
                      canContinue={modalLevel && selectedBoards.length > 0 && selectedSubjects.length > 0 && selectedSession}
                    />
                  )}

                  {setupStep === 'terms' && (
                    <TermsStep
                      acceptedTerms={acceptedTerms}
                      setAcceptedTerms={setAcceptedTerms}
                      onContinue={handleCompleteOnboarding}
                      onBack={() => setSetupStep('preferences')}
                      loading={loading}
                    />
                  )}

                  {setupStep === 'complete' && (
                    <CompleteStep onFinish={handleCompleteOnboarding} />
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Step Components

function UsernameStep({
  authUsername,
  setAuthUsername,
  displayName,
  setDisplayName,
  authUsernameError,
  authDisplayNameError,
  handleSubmit,
  loading,
}: {
  authUsername: string;
  setAuthUsername: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  authUsernameError: string;
  authDisplayNameError: string;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Create your identity
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Choose a unique username and display name. Your username can&apos;t be changed later.
        </p>
      </div>

      <Input
        label="Username"
        value={authUsername}
        onChange={(e) => setAuthUsername(e.target.value)}
        placeholder="yourname"
        required
        autoFocus
        leftIcon={<span className="text-neutral-500 dark:text-neutral-400 font-semibold">@</span>}
        error={authUsernameError}
      />
      <Input
        label="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="How should we call you?"
        required
        error={authDisplayNameError}
      />
      <Button type="submit" fullWidth size="lg" className="mt-2" loading={loading}>
        Continue
      </Button>
    </form>
  );
}

function TermsStep({
  acceptedTerms,
  setAcceptedTerms,
  onContinue,
  onBack,
  loading,
}: {
  acceptedTerms: boolean;
  setAcceptedTerms: (v: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
          Privacy & Terms
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Please review and accept to continue
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1 w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
        />
        <div className="flex-1 text-left">
          <p className="font-medium text-neutral-900 dark:text-neutral-50">
            I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline underline">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline underline">Privacy Policy</a>
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            I understand how Learnmates works, my responsibilities as a user, and what data is collected and how it&apos;s used to improve my learning experience.
          </p>
        </div>
      </label>

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" fullWidth size="lg" onClick={onBack} leftIcon={<ArrowLeft className="w-5 h-5" />}>
          Back
        </Button>
        <Button variant="primary" fullWidth size="lg" onClick={onContinue} disabled={!acceptedTerms} loading={loading}>
          Finish
        </Button>
      </div>
    </div>
  );
}

function PreferencesStep({
  availableLevels,
  modalLevel,
  setModalLevel,
  availableBoards,
  selectedBoards,
  setSelectedBoards,
  availableSubjects,
  selectedSubjects,
  setSelectedSubjects,
  sessionOptions,
  selectedSession,
  setSelectedSession,
  onBack,
  onContinue,
  loading,
  canContinue,
}: {
  availableLevels: string[];
  modalLevel: string | null;
  setModalLevel: (v: string | null) => void;
  availableBoards: { id: BoardKey; name: string }[];
  selectedBoards: BoardKey[];
  setSelectedBoards: (v: BoardKey[] | ((prev: BoardKey[]) => BoardKey[])) => void;
  availableSubjects: { subject: string; board: BoardKey }[];
  selectedSubjects: { subject: string; board: BoardKey }[];
  setSelectedSubjects: (v: { subject: string; board: BoardKey }[] | ((prev: { subject: string; board: BoardKey }[]) => { subject: string; board: BoardKey }[])) => void;
  sessionOptions: string[];
  selectedSession: string | null;
  setSelectedSession: (v: string | null) => void;
  onBack: () => void;
  onContinue: () => void;
  loading: boolean;
  canContinue: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'level' | 'boards' | 'subjects' | 'session'>('level');

  const handleLevelSelect = (level: string) => {
    setModalLevel(level);
    setSelectedBoards([]);
    setSelectedSession(null);
    setSelectedSubjects([]);
    setActiveTab('boards');
  };

  const handleToggleBoard = (board: BoardKey) => {
    setSelectedBoards((prev) =>
      prev.includes(board) ? prev.filter((item) => item !== board) : [...prev, board]
    );
    setSelectedSubjects([]);
  };

  const handleSubjectToggle = (subject: string, board: BoardKey) => {
    setSelectedSubjects((prev) => {
      const exists = prev.some((s) => s.subject === subject && s.board === board);
      return exists
        ? prev.filter((s) => !(s.subject === subject && s.board === board))
        : [...prev, { subject, board }];
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
        {[
          { id: 'level', label: 'Level', disabled: false },
          { id: 'boards', label: 'Boards', disabled: !modalLevel },
          { id: 'subjects', label: 'Subjects', disabled: !modalLevel || selectedBoards.length === 0 },
          { id: 'session', label: 'Session', disabled: !modalLevel || selectedBoards.length === 0 || selectedSubjects.length === 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id as typeof activeTab)}
            disabled={tab.disabled}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
              ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-50'
              : tab.disabled
                ? 'text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-500'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
        {activeTab === 'level' && (
          <LevelSelection availableLevels={availableLevels} onSelect={handleLevelSelect} modalLevel={modalLevel} />
        )}

        {activeTab === 'boards' && (
          <BoardSelection
            availableBoards={availableBoards}
            selectedBoards={selectedBoards}
            onToggle={handleToggleBoard}
            modalLevel={modalLevel}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectSelection
            availableSubjects={availableSubjects}
            selectedSubjects={selectedSubjects}
            onToggle={handleSubjectToggle}
          />
        )}

        {activeTab === 'session' && (
          <SessionSelection
            sessionOptions={sessionOptions}
            selectedBoards={selectedBoards}
            selectedSession={selectedSession}
            onSelect={setSelectedSession}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" fullWidth size="lg" onClick={onBack} leftIcon={<ArrowLeft className="w-5 h-5" />}>
          Back
        </Button>
        {activeTab === 'session' ? (
          <Button variant="primary" fullWidth size="lg" onClick={onContinue} disabled={!canContinue || loading} loading={loading}>
            Complete Setup
          </Button>
        ) : (
          <Button variant="primary" fullWidth size="lg" onClick={() => {
            const tabs = ['level', 'boards', 'subjects', 'session'];
            const currentIndex = tabs.indexOf(activeTab);
            if (currentIndex < tabs.length - 1) {
              const nextTab = tabs[currentIndex + 1];
              setActiveTab(nextTab as typeof activeTab);
            }
          }} disabled={
            (activeTab === 'level' && !modalLevel) ||
            (activeTab === 'boards' && selectedBoards.length === 0) ||
            (activeTab === 'subjects' && selectedSubjects.length === 0)
          }>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}

function BoardSelection({ availableBoards, selectedBoards, onToggle, modalLevel }: { availableBoards: { id: BoardKey; name: string }[]; selectedBoards: BoardKey[]; onToggle: (board: BoardKey) => void; modalLevel: string | null }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-1">Choose your exam board(s)</h3>
        <p className="text-neutral-600 dark:text-neutral-400">Select one or more for {modalLevel}</p>
      </div>
      <div className="space-y-3">
        {availableBoards.map((board) => {
          const isSelected = selectedBoards.includes(board.id);
          return (
            <button
              key={board.id}
              onClick={() => onToggle(board.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${isSelected
                ? `border-${BOARD_COLORS[board.id] || 'blue'}-500 bg-${BOARD_COLORS[board.id] || 'blue'}-50 dark:bg-${BOARD_COLORS[board.id] || 'blue'}-900/20`
                : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${BOARD_COLORS[board.id] || 'bg-blue-500'}`}>
                  {boardLogos[board.id]()}
                </div>
                <span className="font-medium text-neutral-900 dark:text-neutral-50">{board.name}</span>
              </div>
              {isSelected && <CheckCircle className="w-6 h-6 text-primary-500" />}
            </button>
          );
        })}
      </div>
      {selectedBoards.length === 0 && (
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-4">
          Select at least one board to continue
        </p>
      )}
    </div>
  );
}


function LevelSelection({ availableLevels, onSelect, modalLevel }: { availableLevels: string[]; onSelect: (level: string) => void; modalLevel: string | null }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-1">What level are you studying?</h3>
        <p className="text-neutral-600 dark:text-neutral-400">This helps us personalize your content</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableLevels.map((level) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${modalLevel === level
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-xl flex items-center justify-center ${LEVEL_COLORS[level] || 'bg-blue-500'}`}>

              </div>
              <span className="font-medium text-neutral-900 dark:text-neutral-50">{level}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SubjectSelection({ availableSubjects, selectedSubjects, onToggle }: { availableSubjects: { subject: string; board: BoardKey }[]; selectedSubjects: { subject: string; board: BoardKey }[]; onToggle: (subject: string, board: BoardKey) => void }) {
  // Group subjects by board
  const subjectsByBoard = availableSubjects.reduce((acc, item) => {
    if (!acc[item.board]) {
      acc[item.board] = [];
    }
    acc[item.board].push(item);
    return acc;
  }, {} as Record<BoardKey, { subject: string; board: BoardKey }[]>);

  const boardOrder: BoardKey[] = ['cambridge', 'edexcel', 'aqa', 'ocr'];
  const iconBgColor = 'dark:bg-gray-700 bg-gray-200';

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-1">Select your subjects</h3>
        <p className="text-neutral-600 dark:text-neutral-400">Pick the subjects you want to study</p>
      </div>
      <div className="max-h-[500px] overflow-y-auto space-y-6">
        {boardOrder.map((board) => {
          const boardSubjects = subjectsByBoard[board];
          if (!boardSubjects || boardSubjects.length === 0) return null;

          const boardName = board.charAt(0).toUpperCase() + board.slice(1);
          const boardColor = BOARD_COLORS[board] || 'bg-blue-500';

          return (
            <div key={board} className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <span className={`w-2 h-2 rounded-full ${boardColor.replace('bg-', '')}-500`} />
                {boardName} Board
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {boardSubjects.map((item) => {
                  const isSelected = selectedSubjects.some(
                    (s) => s.subject === item.subject && s.board === item.board
                  );
                  const IconComponent = SUBJECT_ICONS[item.subject];
                  return (
                    <button
                      key={`${item.board}-${item.subject}`}
                      onClick={() => onToggle(item.subject, item.board)}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-start gap-1 h-full min-h-[80px] ${isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700'
                        }`}
                    >
                      <div className="flex items-center w-full">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgColor} flex-shrink-0 w-14yas h-14 dark:text-white text-neutral-900`}>
                          {IconComponent}
                        </div>
                        <div className=" min-w-0 ml-7 ">
                          <div className="font-medium text-neutral-900 dark:text-neutral-50 truncate">{item.subject}</div>
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-primary-500 ml-auto" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {selectedSubjects.length === 0 && (
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 py-4">
          Select at least one subject to continue
        </p>
      )}
    </div>
  );
}

function SessionSelection({ sessionOptions, selectedBoards, selectedSession, onSelect }: { sessionOptions: string[]; selectedBoards: BoardKey[]; selectedSession: string | null; onSelect: (session: string) => void }) {
  const filteredSessions = sessionOptions.filter((session) =>
    (session === 'Jan' && selectedBoards.includes('edexcel')) ||
    (session === 'Feb/Mar' && selectedBoards.includes('cambridge')) ||
    session === 'May/Jun' ||
    session === 'Oct/Nov'
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-1">Choose your exam session</h3>
        <p className="text-neutral-600 dark:text-neutral-400">When are you taking your exams?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredSessions.map((session) => (
          <button
            key={session}
            onClick={() => onSelect(session)}
            className={`p-4 rounded-xl border-2 text-center transition-all font-medium ${selectedSession === session
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 text-neutral-900 dark:text-neutral-50'
              }`}
          >
            {session}
          </button>
        ))}
      </div>
    </div>
  );
}

function CompleteStep({ onFinish }: { onFinish: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="max-w-md mx-auto text-center py-12"
    >
      <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
        <CheckCircle className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">All set!</h2>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6">
        Welcome to Learnmates!
      </p>
      <Button variant="primary" size="lg" onClick={onFinish} className="mt-4 w-full max-w-xs">
        Finish
      </Button>
    </motion.div>
  );
}

// Auth Forms

interface VerificationFormProps {
  email: string;
  verificationToken: string;
  setVerificationToken: (value: string) => void;
  error: string;
  success: string;
  loading: boolean;
  handleVerifyToken: (e: FormEvent) => void;
  onBack: () => void;
  onResend: () => void;
}

function VerificationForm({
  email,
  verificationToken,
  setVerificationToken,
  error,
  success,
  loading,
  handleVerifyToken,
  onBack,
  onResend,
}: VerificationFormProps) {
  return (
    <form onSubmit={handleVerifyToken}>
      <div className="text-center mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Verify your email
        </p>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50">
          Enter verification code
        </h1>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto">
          We sent an 8-digit verification code to{' '}
          <span className="font-medium">{email}</span>
          . Please enter it below to complete your registration.
        </p>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          Check your spam folder if you don&apos;t see the email.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            placeholder="Enter 8-Digit code"
            value={verificationToken}
            onChange={(e) => {
              const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
              setVerificationToken(value.toUpperCase());
            }}
            maxLength={8}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-primary-400 dark:focus:ring-primary-400/30 text-center text-2xl tracking-widest font-mono uppercase"
            required
            autoFocus
          />
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 text-center">
            {verificationToken.length}/8 Digits
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-danger-300 dark:border-danger-700 px-4 py-3 text-sm bg-danger-50 dark:bg-danger-900/20">
            <p className="text-danger-600 dark:text-danger-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-success-300 dark:border-success-700 px-4 py-3 text-sm bg-success-50 dark:bg-success-900/20">
            <p className="text-success-700 dark:text-success-300">{success}</p>
          </div>
        )}

        <Button type="submit" fullWidth size="lg" loading={loading} disabled={verificationToken.length < 8}>
          Verify Code
        </Button>

        <div className="flex flex-col gap-3">
          <Button type="button" variant="ghost" fullWidth size="sm" onClick={onBack}>
            ← Back to sign in
          </Button>
          <Button type="button" variant="ghost" fullWidth size="sm" onClick={onResend} loading={loading}>
            Resend verification code
          </Button>
        </div>
      </div>
    </form>
  );
}

interface LoginFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  success: string;
  loading: boolean;
  isCreatingAccount: boolean;
  handleSubmit: (e: FormEvent) => void;
  signInWithGoogle: () => void;
  onToggleAuth: () => void;
}

function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  error,
  success,
  loading,
  isCreatingAccount,
  handleSubmit,
  signInWithGoogle,
  onToggleAuth,
}: LoginFormProps) {
  const { resetPassword } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail.trim()) {
      setForgotError('Enter your email address.');
      setForgotLoading(false);
      return;
    }

    const { error: resetError } = await resetPassword(forgotEmail.trim().toLowerCase());
    if (resetError) {
      setForgotError(resetError);
    } else {
      setForgotSuccess('Password reset email sent! Check your inbox.');
      setForgotEmail('');
      setTimeout(() => setShowForgotPassword(false), 3000);
    }
    setForgotLoading(false);
  };

  if (showForgotPassword) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Reset password
          </p>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-neutral-50">
            Forgot your password?
          </h1>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-6">
          <Input
            label="Email address"
            type="email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
            autoFocus
          />

          {forgotError && (
            <div className="rounded-xl border border-danger-300 dark:border-danger-700 px-4 py-3 text-sm bg-danger-50 dark:bg-danger-900/20">
              <p className="text-danger-600 dark:text-danger-300">{forgotError}</p>
            </div>
          )}

          {forgotSuccess && (
            <div className="rounded-xl border border-success-300 dark:border-success-700 px-4 py-3 text-sm bg-success-50 dark:bg-success-900/20">
              <p className="text-success-700 dark:text-success-300">{forgotSuccess}</p>
            </div>
          )}

          <Button type="submit" fullWidth size="lg" loading={forgotLoading}>
            Send reset link
          </Button>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="ghost"
              fullWidth
              size="sm"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotError('');
                setForgotSuccess('');
                setForgotEmail('');
              }}
            >
              ← Back to sign in
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div className="rounded-xl border border-danger-300 dark:border-danger-700 px-4 py-3 text-sm bg-danger-50 dark:bg-danger-900/20">
            <p className="text-danger-600 dark:text-danger-300">{error}</p>
          </div>
        )}

        {success && !isCreatingAccount && (
          <div className="rounded-xl border border-success-300 dark:border-success-700 px-4 py-3 text-sm bg-success-50 dark:bg-success-900/20">
            <p className="text-success-700 dark:text-success-300">{success}</p>
          </div>
        )}

        <Button type="submit" fullWidth size="lg" loading={loading}>
          {isCreatingAccount ? 'Create account' : 'Sign in'}
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        <Button
          type="button"
          variant="secondary"
          fullWidth
          size="lg"
          onClick={signInWithGoogle}
        >
          Sign in with Google
        </Button>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {isCreatingAccount ? 'Already have an account?' : "Don't have an account?"}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onToggleAuth}>
          {isCreatingAccount ? 'Back to sign in' : 'Create account'}
        </Button>
      </div>

      {!isCreatingAccount && (
        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm"
          >
            Forgot password?
          </Button>
        </div>
      )}
    </form>
  );
}