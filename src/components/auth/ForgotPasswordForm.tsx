import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { ForgotPasswordSchema, ResetPasswordSchema } from '../../utils/validators';
import { apiRequestPasswordReset, apiResetPassword } from '../../api/client';
import { resolveErrorField } from './errorFields';

interface ForgotPasswordFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  emailInputRef: React.Ref<HTMLInputElement>;
  errorField: string | null;
  onError: (message: string | null, field: string | null) => void;
  onSuccess: (message: string) => void;
  onSwitchToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  email,
  onEmailChange,
  emailInputRef,
  errorField,
  onError,
  onSuccess,
  onSwitchToLogin,
}) => {
  const [resetCode, setResetCode] = useState('');
  const [resetDevCode, setResetDevCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError(null, null);

    const result = ForgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      onError(result.error.issues[0]?.message || 'Please enter a valid email', result.error.issues[0]?.path[0] === 'email' ? 'auth-forgot-email' : null);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequestPasswordReset(result.data.email);
      // In development (no email service), the reset code is returned to display
      if (res.devCode) {
        setResetDevCode(res.devCode);
        onSuccess(res.message);
      } else {
        onSuccess(res.message);
        setResetCode('');
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not request password reset', null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError(null, null);

    const result = ResetPasswordSchema.safeParse({ email, code: resetCode, newPassword });
    if (!result.success) {
      onError(result.error.issues[0]?.message || 'Please check the code and password', resolveErrorField(result.error.issues[0]?.path[0]));
      return;
    }

    setIsSubmitting(true);
    try {
      await apiResetPassword(result.data.email, result.data.code, result.data.newPassword);
      onSuccess('Password reset successfully. You can now sign in.');
      setResetDevCode(null);
      setNewPassword('');
      setResetCode('');
      setTimeout(() => onSwitchToLogin(), 1800);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not reset password', null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dev reset code display (no email service in this environment) */}
      {resetDevCode && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800 flex items-start gap-2">
          <div>
            <p className="font-semibold">Your reset code (demo delivery):</p>
            <p className="font-mono font-bold text-base tracking-[0.3em] mt-1">{resetDevCode}</p>
          </div>
        </div>
      )}

      {!resetDevCode ? (
        /* ---------- REQUEST RESET CODE ---------- */
        <form onSubmit={handleRequestSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="auth-forgot-email" className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6A5F] dark:text-[#A0AAA0]" />
              <input
                ref={emailInputRef}
                id="auth-forgot-email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-describedby={errorField === 'auth-forgot-email' ? 'auth-form-error' : undefined}
                required
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
        /* ---------- ENTER CODE + NEW PASSWORD ---------- */
        <form onSubmit={handleResetSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="auth-reset-code" className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
              Reset Code
            </label>
            <input
              id="auth-reset-code"
              type="text"
              inputMode="numeric"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="w-full text-sm font-mono tracking-widest rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-describedby={errorField === 'auth-reset-code' ? 'auth-form-error' : undefined}
              required
            />
          </div>
          <div>
            <label htmlFor="auth-new-password" className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6A5F] dark:text-[#A0AAA0]" />
              <input
                id="auth-new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-describedby={errorField === 'auth-new-password' ? 'auth-form-error' : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6A5F] dark:text-[#A0AAA0] hover:text-[#1A1D1A] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
  );
};
