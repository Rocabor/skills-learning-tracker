import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { X, User as UserIcon, KeyRound, ArrowRight, Sparkles, Loader2, ShieldCheck, Users } from 'lucide-react';
import { RegisterSchema, LoginSchema } from '../utils/validators';
import { apiGetProfiles } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, enterGuestMode } = useApp();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentProfiles, setRecentProfiles] = useState<{ username: string; name: string }[]>([]);

  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Fetch local profiles on modal open
  useEffect(() => {
    if (isOpen) {
      apiGetProfiles().then(setRecentProfiles);
      setErrorMessage(null);
      setPin(['', '', '', '']);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePinChange = (index: number, value: string) => {
    // Only accept single digit
    const digit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    if (digit && index < 3) {
      pinInputRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    }
  };

  const handlePastePin = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length > 0) {
      const newPin = ['', '', '', ''];
      for (let i = 0; i < 4; i++) {
        newPin[i] = pasted[i] || '';
      }
      setPin(newPin);
      const nextIndex = Math.min(pasted.length, 3);
      pinInputRefs[nextIndex].current?.focus();
    }
  };

  const selectExistingProfile = (selectedUsername: string) => {
    setUsername(selectedUsername);
    setTab('login');
    setErrorMessage(null);
    setPin(['', '', '', '']);
    setTimeout(() => {
      pinInputRefs[0].current?.focus();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const pinString = pin.join('');

    if (tab === 'login') {
      const result = LoginSchema.safeParse({ username, pin: pinString });
      if (!result.success) {
        setErrorMessage(result.error.issues[0]?.message || 'Invalid username or 4-digit PIN');
        return;
      }

      setIsSubmitting(true);
      try {
        await login(result.data.username, result.data.pin);
        onClose();
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Incorrect PIN or username');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const result = RegisterSchema.safeParse({
        username,
        name: displayName || undefined,
        pin: pinString
      });

      if (!result.success) {
        setErrorMessage(result.error.issues[0]?.message || 'Please check your inputs');
        return;
      }

      setIsSubmitting(true);
      try {
        await signup(result.data.username, result.data.pin, result.data.name);
        onClose();
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Error creating user profile');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

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
                {tab === 'login' ? 'Sign In with PIN' : 'Create User & 4-Digit PIN'}
              </h2>
              <p className="text-xs text-[#7A837A] dark:text-[#A0AAA0]">
                No email or complex password required · Zod validated
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

        {/* Existing Local Profiles Picker */}
        {recentProfiles.length > 0 && tab === 'login' && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#F6F6F2] dark:bg-[#232823] border border-[#E5E5DE] dark:border-[#2E352E]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5A635A] dark:text-[#A0AAA0] mb-2 px-1">
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Saved profiles on this device:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentProfiles.map((p) => (
                <button
                  key={p.username}
                  type="button"
                  onClick={() => selectExistingProfile(p.username)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    username.toLowerCase() === p.username.toLowerCase()
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-[#1C201C] text-[#333A33] dark:text-[#D5DDD5] border border-[#DDDDD6] dark:border-[#384038] hover:border-emerald-500'
                  }`}
                >
                  @{p.username} {p.name !== p.username ? `(${p.name})` : ''}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#7A837A]">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alex, coder99, sarah"
                className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
          </div>

          {tab === 'signup' && (
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

          {/* 4-Digit PIN Input Blocks */}
          <div>
            <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
              4-Digit PIN
            </label>
            <div className="flex items-center justify-center gap-3 py-1">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={pinInputRefs[index]}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={pin[index]}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  onPaste={handlePastePin}
                  className="w-12 h-13 text-center text-xl font-mono font-bold rounded-xl border-2 border-[#DDDDD6] dark:border-[#3A423A] bg-[#FAFAF8] dark:bg-[#232823] text-[#1A1D1A] dark:text-[#ECF0EC] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              ))}
            </div>
            <p className="text-[11px] text-center text-[#7A837A] dark:text-[#A0AAA0] mt-1.5">
              {tab === 'signup' ? 'Choose 4 numbers you can easily remember' : 'Enter your 4-digit numeric PIN'}
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{tab === 'login' ? 'Sign In to Account' : 'Create Profile with PIN'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security assurance */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#7A837A] dark:text-[#889488]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>PIN is securely encrypted with bcrypt in SQLite.</span>
        </div>

        {/* Tab switch & Guest Option */}
        <div className="mt-4 pt-3.5 border-t border-[#DDDDD6] dark:border-[#262B26] text-center space-y-2">
          {tab === 'login' ? (
            <p className="text-xs text-[#7A837A] dark:text-[#A0AAA0]">
              New to SkillTrack?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setErrorMessage(null);
                  setPin(['', '', '', '']);
                }}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Create new profile with PIN
              </button>
            </p>
          ) : (
            <p className="text-xs text-[#7A837A] dark:text-[#A0AAA0]">
              Already have a username & PIN?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMessage(null);
                  setPin(['', '', '', '']);
                }}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Sign In
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
