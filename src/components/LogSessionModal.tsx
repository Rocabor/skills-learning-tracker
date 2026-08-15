import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { parseFlexibleDuration, getTodayDateString } from '../utils/dateUtils';
import { X, Clock, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

export const LogSessionModal: React.FC = () => {
  const {
    isLogModalOpen,
    logModalDefaultSkillId,
    editingSession,
    skills,
    sessions,
    addSession,
    updateSession,
    closeModals
  } = useApp();

  const [skillId, setSkillId] = useState<string>('');
  const [durationInput, setDurationInput] = useState<string>('45');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const durationInputRef = useRef<HTMLInputElement>(null);

  // Initialize form state when opened
  useEffect(() => {
    if (!isLogModalOpen) return;

    if (editingSession) {
      setSkillId(editingSession.skillId);
      setDurationInput(String(editingSession.durationMinutes));
      setDate(editingSession.date);
      setNotes(editingSession.notes || '');
    } else {
      // Find most recent practiced skill or default
      if (logModalDefaultSkillId) {
        setSkillId(logModalDefaultSkillId);
      } else if (sessions.length > 0) {
        setSkillId(sessions[0].skillId);
      } else if (skills.length > 0) {
        setSkillId(skills[0].id);
      }
      setDurationInput('45');
      setDate(getTodayDateString());
      setNotes('');
    }
    setError(null);

    setTimeout(() => {
      durationInputRef.current?.focus();
    }, 100);
  }, [isLogModalOpen, editingSession, logModalDefaultSkillId, skills, sessions]);

  if (!isLogModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!skillId) {
      setError('Please select a skill.');
      return;
    }

    const parsedMins = parseFlexibleDuration(durationInput);
    if (!parsedMins || parsedMins < 1) {
      setError('Please enter a valid duration (e.g. 45, 1h 30m, or 1.5).');
      return;
    }

    if (parsedMins > 480) {
      // Warning for > 8 hours
      if (!window.confirm(`You entered ${parsedMins} minutes (${(parsedMins / 60).toFixed(1)} hours). Are you sure?`)) {
        return;
      }
    }

    if (!date) {
      setError('Please choose a practice date.');
      return;
    }

    const today = getTodayDateString();
    if (date > today) {
      setError('Practice date cannot be in the future.');
      return;
    }

    if (editingSession) {
      updateSession(editingSession.id, {
        skillId,
        durationMinutes: parsedMins,
        date,
        notes: notes.trim() || null
      });
    } else {
      addSession({
        skillId,
        durationMinutes: parsedMins,
        date,
        notes: notes.trim() || null
      });
    }

    closeModals();
  };

  const setPresetDuration = (preset: string) => {
    setDurationInput(preset);
    setError(null);
  };

  const selectedSkill = skills.find((s) => s.id === skillId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-session-title"
    >
      <div
        className="fixed inset-0"
        onClick={closeModals}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] shadow-2xl p-6 text-[#1A1D1A] dark:text-[#ECF0EC] z-10 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#DDDDD6] dark:border-[#262B26]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: selectedSkill?.color || '#059669' }}
            />
            <h2 id="log-session-title" className="font-display font-bold text-xl text-[#1A1D1A] dark:text-[#ECF0EC]">
              {editingSession ? 'Edit Practice Session' : 'Log Practice Session'}
            </h2>
          </div>
          <button
            onClick={closeModals}
            className="p-1.5 rounded-lg text-[#7A837A] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Skill Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
              Skill <span className="text-red-500">*</span>
            </label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="w-full text-sm font-medium rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              required
            >
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Input & Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0]">
                Duration <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-[#7A837A] dark:text-[#6B766B]">
                e.g. 45, 1h 30m, or 1.5
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A837A]">
                <Clock className="w-4 h-4" />
              </div>
              <input
                ref={durationInputRef}
                type="text"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                placeholder="45 or 1h 30m"
                className="w-full text-sm font-medium rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['15m', '30m', '45m', '1h', '1.5h', '2h'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPresetDuration(preset)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#F2F2EE] dark:bg-[#262B26] hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 border border-[#DDDDD6] dark:border-[#333A33] transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
              Practice Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A837A]">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <input
                type="date"
                max={getTodayDateString()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm font-medium rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Session Notes / Reflections */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0]">
                Reflection Notes <span className="text-xs font-normal text-[#7A837A]">(Optional)</span>
              </label>
              <span className="text-[11px] text-[#7A837A]">What went well? What was challenging?</span>
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Practiced fingerpicking technique on Blackbird. Chord switches felt much smoother..."
              className="w-full text-sm rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-[#7A837A]/60"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DDDDD6] dark:border-[#262B26]">
            <button
              type="button"
              onClick={closeModals}
              className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] text-[#4A524A] dark:text-[#A0AAA0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
            >
              {editingSession ? 'Save Changes' : 'Save Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};