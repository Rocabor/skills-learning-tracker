import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { CURATED_COLOR_PALETTE } from './data/sampleData';
import type { SkillGoal } from './types';
import { SkillFormSchema } from './utils/validators';
import { X, Trash2, Check } from 'lucide-react';

export const SkillModal: React.FC = () => {
  const {
    isSkillModalOpen,
    editingSkill,
    addSkill,
    updateSkill,
    deleteSkill,
    closeModals
  } = useApp();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#059669');
  const [goalType, setGoalType] = useState<SkillGoal['type'] | 'none'>('weekly');
  const [targetHours, setTargetHours] = useState('5');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSkillModalOpen) return;

    if (editingSkill) {
      setName(editingSkill.name);
      setColor(editingSkill.color);
      if (editingSkill.goal) {
        setGoalType(editingSkill.goal.type);
        setTargetHours(String(editingSkill.goal.targetHours));
      } else {
        setGoalType('none');
        setTargetHours('5');
      }
    } else {
      setName('');
      setColor(CURATED_COLOR_PALETTE[Math.floor(Math.random() * CURATED_COLOR_PALETTE.length)].hex);
      setGoalType('weekly');
      setTargetHours('5');
    }
    setError(null);
  }, [isSkillModalOpen, editingSkill]);

  if (!isSkillModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = SkillFormSchema.safeParse({
      name,
      targetHours: goalType !== 'none' ? parseFloat(targetHours) : undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    let goal: SkillGoal | null = null;
    if (goalType !== 'none') {
      goal = {
        type: goalType,
        targetHours: result.data.targetHours!
      };
    }

    if (editingSkill) {
      updateSkill(editingSkill.id, {
        name: result.data.name,
        color,
        goal
      });
    } else {
      addSkill({
        name: result.data.name,
        color,
        goal
      }).catch(() => {});
    }

    closeModals();
  };

  const handleDelete = () => {
    if (!editingSkill) return;
    if (window.confirm(`Are you sure you want to delete "${editingSkill.name}"? This will also remove all its practice sessions.`)) {
      deleteSkill(editingSkill.id);
      closeModals();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-modal-title"
    >
      <div className="fixed inset-0" onClick={closeModals} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] shadow-2xl p-6 text-[#1A1D1A] dark:text-[#ECF0EC] z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DDDDD6] dark:border-[#262B26]">
          <h2 id="skill-modal-title" className="font-display font-bold text-xl text-[#1A1D1A] dark:text-[#ECF0EC]">
            {editingSkill ? 'Edit Skill' : 'Add New Skill'}
          </h2>
          <button
            onClick={closeModals}
            className="p-1.5 rounded-lg text-[#5F6A5F] dark:text-[#A0AAA0] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="p-2.5 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Skill Name */}
          <div>
            <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
              Skill Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spanish, Guitar, Rust, Photography"
              className="w-full text-sm font-medium rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              autoFocus
            />
          </div>

          {/* Curated Color Palette */}
          <div>
            <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
              Accent Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {CURATED_COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform cursor-pointer relative ${
                    color === c.hex ? 'scale-110 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#1C201C]' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  aria-label={`Select ${c.name} color`}
                >
                  {color === c.hex && <Check className="w-4 h-4 text-white stroke-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Practice Goal */}
          <div className="pt-1">
            <label className="block text-xs font-semibold text-[#4A524A] dark:text-[#A0AAA0] mb-1.5">
              Practice Target Goal
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F2F2EE] dark:bg-[#232823] rounded-xl border border-[#DDDDD6] dark:border-[#333A33] text-xs">
              <button
                type="button"
                onClick={() => setGoalType('weekly')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  goalType === 'weekly'
                    ? 'bg-white dark:bg-[#1C201C] text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-[#5F6A5F] dark:text-[#A0AAA0]'
                }`}
              >
                Weekly Goal
              </button>
              <button
                type="button"
                onClick={() => setGoalType('total')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  goalType === 'total'
                    ? 'bg-white dark:bg-[#1C201C] text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-[#5F6A5F] dark:text-[#A0AAA0]'
                }`}
              >
                Total Hours
              </button>
              <button
                type="button"
                onClick={() => setGoalType('none')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  goalType === 'none'
                    ? 'bg-white dark:bg-[#1C201C] text-[#1A1D1A] dark:text-[#ECF0EC] shadow-xs'
                    : 'text-[#5F6A5F] dark:text-[#A0AAA0]'
                }`}
              >
                No Goal
              </button>
            </div>

            {goalType !== 'none' && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                  className="w-24 text-sm font-medium rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0]">
                  {goalType === 'weekly' ? 'hours per week target' : 'total lifetime hours target'}
                </span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#DDDDD6] dark:border-[#262B26]">
            {editingSkill ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Skill
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 text-xs font-medium rounded-xl hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] text-[#4A524A] dark:text-[#A0AAA0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white shadow-sm cursor-pointer"
              >
                {editingSkill ? 'Save Changes' : 'Create Skill'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
