import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Flame,
  Plus,
  Play,
  Pause,
  Square,
  Sun,
  Moon,
  User as UserIcon,
  Sparkles,
  Settings,
  RotateCcw,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenAccessibility: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenAccessibility }) => {
  const {
    user,
    isGuest,
    theme,
    toggleTheme,
    activeTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    openLogModalWithSkill,
    openAddSkillModal,
    overallStats,
    skills,
    resetToSampleData,
    logout,
    setSelectedSkillId,
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const activeTimerSkill = activeTimer
    ? skills.find((s) => s.id === activeTimer.skillId)
    : null;

  const timerMinutes = activeTimer ? Math.floor(activeTimer.elapsedSeconds / 60) : 0;
  const timerSeconds = activeTimer ? activeTimer.elapsedSeconds % 60 : 0;

  const displayName = user?.name || 'User';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#DDDDD6] dark:border-[#262B26] bg-[#FAFAF8]/95 dark:bg-[#131614]/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSelectedSkillId(null)}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg p-1"
            aria-label="SkillTrack Home Dashboard"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-700 dark:bg-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform duration-150">
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
          </button>

          {isGuest && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <Sparkles className="w-3 h-3" />
              Guest Demo Mode
            </span>
          )}
        </div>

        {/* Center: Live Timer if Active */}
        {activeTimer && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#1A2E22] border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 shadow-sm">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeTimerSkill?.color || '#059669' }}
            />
            <span className="text-xs font-semibold max-w-[100px] truncate">
              {activeTimerSkill?.name || 'Practicing'}
            </span>
            <span className="font-mono font-bold text-xs tracking-wider">
              {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1 ml-1">
              {activeTimer.isRunning ? (
                <button
                  onClick={pauseTimer}
                  title="Pause Timer"
                  className="p-1 rounded hover:bg-emerald-200/60 dark:hover:bg-emerald-800/60 cursor-pointer"
                >
                  <Pause className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  title="Resume Timer"
                  className="p-1 rounded hover:bg-emerald-200/60 dark:hover:bg-emerald-800/60 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => stopTimer()}
                title="Stop & Log Session"
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 dark:text-red-400 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* Right: Actions, Streaks & User Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Overall Streak Indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              overallStats.streakStatus === 'active'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                : overallStats.streakStatus === 'at_risk'
                ? 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/50 border-dashed'
                : 'bg-gray-100 dark:bg-[#1C201C] text-[#5F6A5F] dark:text-[#A0AAA0] border-[#DDDDD6] dark:border-[#333A33]'
            }`}
            title={`Overall Practice Streak: ${overallStats.currentStreak} days (${
              overallStats.streakStatus === 'active'
                ? 'Practiced today'
                : overallStats.streakStatus === 'at_risk'
                ? 'Practice today to keep it!'
                : 'No active streak'
            })`}
          >
            <Flame
              className={`w-4 h-4 ${
                overallStats.streakStatus === 'active'
                  ? 'text-amber-500 fill-amber-500'
                  : overallStats.streakStatus === 'at_risk'
                  ? 'text-amber-500/70 fill-amber-500/40'
                  : 'text-gray-400'
              }`}
            />
            <span>{overallStats.currentStreak} day streak</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[#4A524A] dark:text-[#A0AAA0] hover:bg-[#E8E8E3] dark:hover:bg-[#262B26] transition-colors cursor-pointer"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Primary Action: + Log Session */}
          <button
            onClick={() => openLogModalWithSkill()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white font-medium text-xs sm:text-sm shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Log Session</span>
            <span className="sm:hidden">Log</span>
          </button>

          {/* User Profile Avatar / Menu or Sign In */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-emerald-500/50 transition-all cursor-pointer focus:outline-none"
                aria-label={`${initials} user account menu`}
              >
                <div className="w-8 h-8 rounded-full bg-[#E8E8E3] dark:bg-[#262B26] text-[#1A1D1A] dark:text-[#ECF0EC] font-semibold text-xs flex items-center justify-center border border-[#DDDDD6] dark:border-[#333A33]">
                  {initials}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#5F6A5F] dark:text-[#A0AAA0]" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DDDDD6] dark:border-[#333A33] bg-white dark:bg-[#1C201C] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] text-xs font-semibold text-[#1A1D1A] dark:text-[#ECF0EC] transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Sign In</span>
              </button>
            )}

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && user && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] shadow-xl z-50 p-2 text-sm text-[#1A1D1A] dark:text-[#ECF0EC]">
                  <div className="px-3 py-2 border-b border-[#DDDDD6] dark:border-[#262B26]">
                    <p className="font-semibold">{displayName}</p>
                    {user.email && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium truncate">
                        {user.email}
                      </p>
                    )}
                    {user.isGuest && (
                      <span className="mt-1 inline-block text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                        Temporary Guest Session
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        openAddSkillModal();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Add New Skill
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        resetToSampleData();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-[#5F6A5F] dark:text-[#A0AAA0]" />
                      Reset to Sample Data
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onOpenAccessibility();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-[#5F6A5F] dark:text-[#A0AAA0]" />
                      Preferences & Accessibility
                    </button>
                  </div>

                  <div className="pt-1 border-t border-[#DDDDD6] dark:border-[#262B26]">
                    {user.isGuest ? (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2 hover:bg-emerald-100 cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4" />
                        Sign In / Create Account
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
