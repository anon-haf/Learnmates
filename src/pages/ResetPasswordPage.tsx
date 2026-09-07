import { FormEvent, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button } from '@/components/ui';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState<boolean | null>(null);
  const { updatePassword, user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type');
    const hasTokens = searchParams.get('access_token') && searchParams.get('refresh_token');
    
    if (type === 'recovery' && hasTokens) {
      setIsRecoveryFlow(true);
    } else if (type !== 'recovery') {
      setIsRecoveryFlow(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isRecoveryFlow === true && authLoading) {
      return;
    }
    
    if (isRecoveryFlow === true && !authLoading && !user) {
      setIsRecoveryFlow(false);
    }
  }, [isRecoveryFlow, authLoading, user]);

  if (authLoading || isRecoveryFlow === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying reset link...</p>
        </motion.div>
      </div>
    );
  }

  if (isRecoveryFlow === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <Card variant="elevated" padding="lg" className="text-center">
            <CardHeader className="mb-8">
              <div className="w-16 h-16 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-danger-600 dark:text-danger-400" />
              </div>
              <CardTitle className="text-2xl">Invalid or expired reset link</CardTitle>
              <CardDescription className="mt-3 text-sm max-w-xl mx-auto">
                This password reset link is invalid or has expired. Please request a new one from the login page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="primary" fullWidth size="lg" onClick={() => navigate('/login')}>
                Back to login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isRecoveryFlow === true && !user && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <Card variant="elevated" padding="lg" className="text-center">
            <CardHeader className="mb-8">
              <div className="w-16 h-16 bg-danger-100 dark:bg-danger-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-danger-600 dark:text-danger-400" />
              </div>
              <CardTitle className="text-2xl">Session expired</CardTitle>
              <CardDescription className="mt-3 text-sm max-w-xl mx-auto">
                The reset link has expired or was already used. Please request a new one from the login page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="primary" fullWidth size="lg" onClick={() => navigate('/login')}>
                Back to login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await updatePassword(password);

      if (error) {
        setError(error);
        setLoading(false);
        return;
      }

      setSuccess('Password updated successfully! Redirecting to login...');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const passwordRequirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Passwords match', met: confirmPassword.length > 0 && password === confirmPassword },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card variant="elevated" padding="lg">
          <CardHeader className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <CardTitle className="text-2xl">Set new password</CardTitle>
            <CardDescription className="mt-3 text-sm max-w-xl mx-auto">
              Your new password must be different from previously used passwords.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="New password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  }
                />
                <div className="mt-3 space-y-1">
                  {passwordRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <CheckCircle
                        className={`w-4 h-4 flex-shrink-0 ${req.met ? 'text-success-500' : 'text-neutral-300 dark:text-neutral-600'}`}
                      />
                      <span className={req.met ? 'text-success-600 dark:text-success-400' : 'text-neutral-500 dark:text-neutral-400'}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Input
                label="Confirm new password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {error && (
                <div className="rounded-xl border border-danger-300 dark:border-danger-700 px-4 py-3 text-sm bg-danger-50 dark:bg-danger-900/20">
                  <p className="text-danger-600 dark:text-danger-300">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-success-300 dark:border-success-700 px-4 py-3 text-sm bg-success-50 dark:bg-success-900/20 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0" />
                  <p className="text-success-700 dark:text-success-300">{success}</p>
                </div>
              )}

              <Button type="submit" fullWidth size="lg" loading={loading} disabled={password.length < 8 || password !== confirmPassword}>
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button variant="ghost" fullWidth size="sm" onClick={() => navigate('/login')}>
                Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}