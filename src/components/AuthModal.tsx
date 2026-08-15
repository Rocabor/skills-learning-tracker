import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, Mail, Lock, User as UserIcon, ArrowRight, Sparkles, Loader2, ShieldCheck, Users, Eye, EyeOff, KeyRound } from 'lucide-react';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../utils/validators';
import { apiGetProfiles, apiRequestPasswordReset, apiResetPassword } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'login' | 'signup' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, enterGuestMode } = useApp();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentProfiles, setRecentProfiles] = useState<{ email: string; name: string }[]>([]);

  // Password reset state
  const [resetCode, setResetCode] = useState('');
  const [resetDevCode, setResetDevCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Fetch local profiles on modal open
  useEffect(() => {
    if (isOpen) {
      apiGetProfiles().then(setRecentProfiles);
      setErrorMessage(null);
      setSuccessMessage(null);
      setPassword('');
      setConfirmPassword('');
      setResetCode('');
      setResetDevCode(null);
      setNewPassword('');
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectExistingProfile = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setView('login');
    setErrorMessage(null);
    setPassword('');
  };

  const switchView = (next: View) => {
    setView(next);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
    setResetCode('');
    setResetDevCode(null);
    setNewPassword('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = LoginSchema.safeParse({ email, password });
    if (!result.success) {
      setErrorMessage(result.error.issues[0]?.message || 'Invalid credentials');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(result.data.email, result.data.password);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Incorrect email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = RegisterSchema.safeParse({ email, name: displayName || undefined, password });
    if (!result.success) {
      setErrorMessage(result.error.issues[0]?.message || 'Please check your inputs');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(result.data.email, result.data.password, result.data.name);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error creating account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = ForgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setErrorMessage(result.error.issues[0]?.message || 'Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequestPasswordReset(result.data.email);
      // In development (no email service), the reset code is returned to display
      if (res.devCode) {
        setResetDevCode(res.devCode);
        setSuccessMessage(res.message);
      } else {
        setSuccessMessage(res.message);
        setResetCode('');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not request password reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = ResetPasswordSchema.safeParse({ email, code: resetCode, newPassword });
    if (!result.success) {
      setErrorMessage(result.error.issues[0]?.message || 'Please check the code and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiResetPassword(result.data.email, result.data.code, result.data.newPassword);
      setSuccessMessage('Password reset successfully. You can now sign in.');
      setResetDevCode(null);
      setNewPassword('');
      setResetCode('');
      setTimeout(() => switchView('login'), 1800);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isForgot = view === 'forgot';
  const isSignup = view === 'signup';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] shadow-2xl p-6 text-[#1A1D1A] dark:text-[#ECF0EC] z-10">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DDDDD6] dark:border-[#262B26]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[#1A1D1A] dark:text-[#ECF0EC]">
                {isForgot ? 'Reset Password' : isSignup ? 'Create Your Account' : 'Sign In'}
              </h2>
              <p className="text-xs text-[#7A837A] dark:text-[#A0AAA0]">
                {isForgot
                  ? 'We will send a reset code to your email'
                  : 'Your practice history, securely saved'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7A837A] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Profiles Picker (login only) */}
        {recentProfiles.length > 0 && view === 'login' && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#F6F6F2] dark:bg-[#232823] border border-[#E5E5DE] dark:border-[#2E352E]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5A635A] dark:text-[#A0AAA0] mb-2 px-1">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Accounts on this device:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentProfiles.map((p) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => selectExistingProfile(p.email)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    email.toLowerCase() === p.email.toLowerCase()
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#1C201C] text-[#333A33] dark:text-[#D5DDD5] border border-[#DDDDD6] dark:border-[#384038] hover:border-emerald-500'
                  }`}
                >
                  {p.email} {p.name ? `(${p.name})` : ''}
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-800 flex items-start gap-2">
            <span className="font-semibold">Error:</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800 flex items-start gap-2">
            <span className="font-semibold">Success:</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Dev reset code display (no email service in this environment) */}
        {resetDevCode && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800 flex items-start gap-2">
            <div>
              <p className="font-semibold">Your reset code (demo delivery):</p>
              <p className="font-mono font-bold text-base tracking-[0.3em] mt-1">{resetDevCode}</p>
            </div>
          </div>
        )}

        {view === 'forgot' ? (
          /* ---------- FORGOT PASSWORD ---------- */
          <div className="space-y-4">
            {!resetDevCode ? (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A837A]" />
                    <input
                      ref={emailInputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Reset Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
                    Reset Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    className="w-full text-sm font-mono tracking-widest rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A837A]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A837A] hover:text-[#1A1D1A] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ---------- LOGIN / SIGNUP ---------- */
          <form
            onSubmit={isSignup ? handleSignupSubmit : handleLoginSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A837A]" />
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
                  Display Name (Optional)
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A837A]" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A837A]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                  className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A837A] hover:text-[#1A1D1A] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignup ? (
              <div>
                <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A837A]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isSignup ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Security assurance */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#7A837A] dark:text-[#889488]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Passwords are securely hashed with bcrypt in SQLite.</span>
        </div>

        {/* Tab switch & Guest Option */}
        <div className="mt-4 pt-3.5 border-t border-[#DDDDD6] dark:border-[#262B26] text-center space-y-2">
          {!isForgot && (
            <p className="text-xs text-[#7A837A] dark:text-[#A0AAA0]">
              {isSignup ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  New to SkillTrack?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('signup')}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                </>
              )}
            </p>
          )}

          {isForgot && (
            <p className="text-xs text-[#7A837A] dark:text-[#A0AAA0]">
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => switchView('login')}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Back to Sign In
              </button>
            </p>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                enterGuestMode();
                onClose();
              }}
              className="text-xs text-[#7A837A] hover:text-[#1A1D1A] dark:hover:text-[#ECF0EC] flex items-center justify-center gap-1.5 mx-auto font-medium cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Continue in Guest Demo Mode</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
