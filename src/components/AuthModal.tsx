import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { X, KeyRound, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { apiGetProfiles } from '../api/client';
import { LoginForm } from './auth/LoginForm';
import { SignupForm } from './auth/SignupForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'login' | 'signup' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, enterGuestMode } = useData();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [recentProfiles, setRecentProfiles] = useState<{ email: string; name: string }[]>([]);
  // Remounts the active form (clearing its local state) on open / profile select
  const [formKey, setFormKey] = useState(0);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, isOpen);

  const reportError = (message: string | null, field: string | null) => {
    setErrorMessage(message);
    setErrorField(field);
    setSuccessMessage(null);
  };

  const reportSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage(null);
    setErrorField(null);
  };

  // Fetch local profiles on modal open
  useEffect(() => {
    if (isOpen) {
      // Non-blocking: a failed lookup keeps the selector empty, never an
      // unhandled rejection.
      apiGetProfiles()
        .then(setRecentProfiles)
        .catch((err) => {
          console.error('Error loading recent profiles:', err);
          setRecentProfiles([]);
        });
      reportError(null, null);
      setFormKey((k) => k + 1);
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const switchView = (next: View) => {
    setView(next);
    reportError(null, null);
  };

  const selectExistingProfile = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setView('login');
    reportError(null, null);
    setFormKey((k) => k + 1);
  };

  const isForgot = view === 'forgot';
  const isSignup = view === 'signup';

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
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
              <h2 id="auth-modal-title" className="font-display font-bold text-lg text-[#1A1D1A] dark:text-[#ECF0EC]">
                {isForgot ? 'Reset Password' : isSignup ? 'Create Your Account' : 'Sign In'}
              </h2>
              <p className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0]">
                {isForgot
                  ? 'We will send a reset code to your email'
                  : 'Your practice history, securely saved'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5F6A5F] dark:text-[#A0AAA0] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] cursor-pointer"
            aria-label="Close dialog"
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
                      ? 'bg-emerald-700 text-white shadow-xs'
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
          <div id="auth-form-error" role="alert" className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-800 flex items-start gap-2">
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

        {view === 'forgot' ? (
          <ForgotPasswordForm
            key={formKey}
            email={email}
            onEmailChange={setEmail}
            emailInputRef={emailInputRef}
            errorField={errorField}
            onError={reportError}
            onSuccess={reportSuccess}
            onSwitchToLogin={() => switchView('login')}
          />
        ) : view === 'signup' ? (
          <SignupForm
            key={formKey}
            email={email}
            onEmailChange={setEmail}
            emailInputRef={emailInputRef}
            errorField={errorField}
            onError={reportError}
            onSignup={signup}
            onClose={onClose}
          />
        ) : (
          <LoginForm
            key={formKey}
            email={email}
            onEmailChange={setEmail}
            emailInputRef={emailInputRef}
            errorField={errorField}
            onError={reportError}
            onLogin={login}
            onClose={onClose}
            onForgotPassword={() => switchView('forgot')}
          />
        )}

        {/* Security assurance */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#5F6A5F] dark:text-[#889488]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Passwords are securely hashed with bcrypt in SQLite.</span>
        </div>

        {/* Tab switch & Guest Option */}
        <div className="mt-4 pt-3.5 border-t border-[#DDDDD6] dark:border-[#262B26] text-center space-y-2">
          {!isForgot && (
            <p className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0]">
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
            <p className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0]">
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
              className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0] hover:text-[#1A1D1A] dark:hover:text-[#ECF0EC] flex items-center justify-center gap-1.5 mx-auto font-medium cursor-pointer"
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
