import React from 'react';
import { useApp } from '../context/AppContext';
import { Footer } from './Footer';
import {
  Flame,
  ArrowRight,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { enterGuestMode } = useApp();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAFAF8] dark:bg-[#131614] text-[#1A1D1A] dark:text-[#ECF0EC] transition-colors duration-200">
      {/* Top Simple Landing Nav */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4" />
              <path d="m4.93 4.93 2.83 2.83" />
              <path d="M2 12h4" />
              <path d="m4.93 19.07 2.83-2.83" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 18v4" />
              <path d="m19.07 19.07-2.83-2.83" />
              <path d="M18 12h4" />
              <path d="m19.07 4.93-2.83 2.83" />
            </svg>
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-[#1A1D1A] dark:text-[#ECF0EC]">
            SkillTrack
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAuth}
            className="text-xs sm:text-sm font-semibold text-[#4A524A] dark:text-[#A0AAA0] hover:text-[#1A1D1A] dark:hover:text-[#ECF0EC] px-3 py-1.5 transition-colors cursor-pointer"
          >
            Sign In with PIN
          </button>
          <button
            onClick={enterGuestMode}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Try as Guest</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-12 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#1A2E22] border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold mb-6">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>The deliberate practice companion for lifelong learners</span>
        </div>

        <h1 className="font-display font-extrabold text-4xl sm:text-6xl tracking-tight text-[#1A1D1A] dark:text-[#ECF0EC] max-w-4xl mx-auto leading-[1.15]">
          See every hour you invest in <span className="text-emerald-600 dark:text-emerald-400">becoming better</span>.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#4A524A] dark:text-[#A0AAA0] max-w-2xl mx-auto leading-relaxed">
          Sign in instantly with your username and a 4-digit PIN. No email or complex passwords required, with secure persistent SQLite storage.
        </p>

        {/* Dual CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={enterGuestMode}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-semibold text-sm sm:text-base shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-emerald-200" />
            <span>Explore Demo (Guest Mode)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] text-[#1A1D1A] dark:text-[#ECF0EC] font-semibold text-sm sm:text-base shadow-xs transition-colors cursor-pointer"
          >
            Create User with PIN
          </button>
        </div>

        {/* Interactive Dashboard Preview Banner */}
        <div className="mt-14 relative rounded-2xl border border-[#DDDDD6] dark:border-[#333A33] bg-white dark:bg-[#1C201C] p-4 sm:p-6 shadow-2xl overflow-hidden max-w-4xl mx-auto text-left">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DDDDD6] dark:border-[#262B26]">
            <div>
              <p className="text-xs text-[#7A837A] dark:text-[#A0AAA0]">Interactive Preview</p>
              <h2 className="font-display font-bold text-lg text-[#1A1D1A] dark:text-[#ECF0EC]">
                Good afternoon, Jordan • 3 skills practiced today
              </h2>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>8 day streak</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Spanish Feature Card Preview */}
            <div className="p-4 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                Most Practiced
              </span>
              <h3 className="font-display font-bold text-xl mb-3">Spanish</h3>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-display font-extrabold text-2xl text-[#1A1D1A] dark:text-[#ECF0EC]">
                    47.5h
                  </span>
                  <p className="text-[11px] text-[#7A837A]">Total Practice</p>
                </div>
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-display font-bold text-lg">
                  <Flame className="w-4 h-4 fill-current" />
                  <span>12d</span>
                </div>
              </div>
            </div>

            {/* Guitar Card Preview */}
            <div className="p-4 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <h3 className="font-display font-bold text-base">Guitar</h3>
              </div>
              <span className="font-display font-extrabold text-2xl text-[#1A1D1A] dark:text-[#ECF0EC] block mt-2">
                32h
              </span>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" /> 8-day streak
              </p>
            </div>

            {/* TypeScript Card Preview */}
            <div className="p-4 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="font-display font-bold text-base">TypeScript</h3>
              </div>
              <span className="font-display font-extrabold text-2xl text-[#1A1D1A] dark:text-[#ECF0EC] block mt-2">
                18h
              </span>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" /> 3-day streak
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16 border-t border-[#DDDDD6] dark:border-[#262B26]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#1A1D1A] dark:text-[#ECF0EC]">
            Engineered for consistent progress
          </h2>
          <p className="text-xs sm:text-sm text-[#7A837A] dark:text-[#A0AAA0] mt-2">
            Everything you need to turn sporadic practice into lifetime mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#1A1D1A] dark:text-[#ECF0EC] mb-2">
              Streaks & Habit Nudges
            </h3>
            <p className="text-xs sm:text-sm text-[#4A524A] dark:text-[#A0AAA0] leading-relaxed">
              Track consecutive practice days per skill and across your entire journey. Smart "at risk" indicators ensure you never accidentally break a chain.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#1A1D1A] dark:text-[#ECF0EC] mb-2">
              18-Week Practice Heatmap
            </h3>
            <p className="text-xs sm:text-sm text-[#4A524A] dark:text-[#A0AAA0] leading-relaxed">
              GitHub-style activity calendar displaying your practice intensity. Filter by individual skills or view your combined multi-skill momentum.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#1A1D1A] dark:text-[#ECF0EC] mb-2">
              AI Practice Coaching
            </h3>
            <p className="text-xs sm:text-sm text-[#4A524A] dark:text-[#A0AAA0] leading-relaxed">
              Weekly AI practice summaries, tailored reflection prompts, and pattern insights that help you balance deep dives with steady consistency.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
