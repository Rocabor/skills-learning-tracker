import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Eye, Zap, Keyboard } from 'lucide-react';
import { Switch } from './Switch';

interface AccessibilityDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityDialog: React.FC<AccessibilityDialogProps> = ({ isOpen, onClose }) => {
  const {
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast
  } = useApp();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-dialog-title"
    >
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] shadow-2xl p-6 text-[#1A1D1A] dark:text-[#ECF0EC] z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DDDDD6] dark:border-[#262B26]">
          <h2 id="accessibility-dialog-title" className="font-display font-bold text-xl text-[#1A1D1A] dark:text-[#ECF0EC]">
            Accessibility & Preferences
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5F6A5F] dark:text-[#A0AAA0] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Reduced Motion Toggle */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-[#1A1D1A] dark:text-[#ECF0EC]">
                  Reduced Motion
                </h3>
                <p className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0] mt-0.5">
                  Disables progress ring animations and smooth transitions.
                </p>
              </div>
            </div>
            <Switch
              checked={reducedMotion}
              onChange={setReducedMotion}
              label="Reduce motion"
            />
          </div>

          {/* High Contrast Mode Toggle */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-[#1A1D1A] dark:text-[#ECF0EC]">
                  High Contrast Borders
                </h3>
                <p className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0] mt-0.5">
                  Enhances border visibility and contrast ratios across cards and heatmap cells.
                </p>
              </div>
            </div>
            <Switch
              checked={highContrast}
              onChange={setHighContrast}
              label="High contrast borders"
            />
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="p-3.5 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
            <div className="flex items-center gap-2 mb-2">
              <Keyboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5F6A5F] dark:text-[#A0AAA0]">
                Keyboard Shortcuts
              </h3>
            </div>
            <div className="space-y-1.5 text-xs text-[#1A1D1A] dark:text-[#ECF0EC]">
              <div className="flex items-center justify-between">
                <span>Open Log Session modal</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] font-mono text-[10px]">
                  N or L
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Toggle light/dark theme</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] font-mono text-[10px]">
                  T
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Close active dialog</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] font-mono text-[10px]">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#DDDDD6] dark:border-[#262B26] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
