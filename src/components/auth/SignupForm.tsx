import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { RegisterSchema } from '../../utils/validators';
import { resolveErrorField } from './errorFields';

interface SignupFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  emailInputRef: React.Ref<HTMLInputElement>;
  errorField: string | null;
  onError: (message: string | null, field: string | null) => void;
  onSignup: (email: string, password: string, name?: string) => Promise<void>;
  onClose: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({
  email,
  onEmailChange,
  emailInputRef,
  errorField,
  onError,
  onSignup,
  onClose,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError(null, null);

    const result = RegisterSchema.safeParse({ email, name: displayName || undefined, password });
    if (!result.success) {
      onError(result.error.issues[0]?.message || 'Please check your inputs', resolveErrorField(result.error.issues[0]?.path[0]));
      return;
    }

    if (password !== confirmPassword) {
      onError('Passwords do not match', 'auth-confirm-password');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSignup(result.data.email, result.data.password, result.data.name);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error creating account', null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="auth-email" className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6A5F] dark:text-[#A0AAA0]" />
          <input
            ref={emailInputRef}
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@example.com"
            className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-describedby={errorField === 'auth-email' ? 'auth-form-error' : undefined}
            required
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
      </div>

      <div>
        <label htmlFor="auth-display-name" className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
          Display Name (Optional)
        </label>
        <div className="relative">
          <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6A5F] dark:text-[#A0AAA0]" />
          <input
            id="auth-display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Alex Vance"
            className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-describedby={errorField === 'auth-display-name' ? 'auth-form-error' : undefined}
          />
        </div>
      </div>

      <div>
        <label htmlFor="auth-password" className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
          Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6A5F] dark:text-[#A0AAA0]" />
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-describedby={errorField === 'auth-password' ? 'auth-form-error' : undefined}
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

      <div>
        <label htmlFor="auth-confirm-password" className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F6A5F] dark:text-[#A0AAA0]" />
          <input
            id="auth-confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-describedby={errorField === 'auth-confirm-password' ? 'auth-form-error' : undefined}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
