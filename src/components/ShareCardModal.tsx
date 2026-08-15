import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateShareCardCanvas } from '../utils/shareUtils';
import { X, Download, Copy, Check, Sparkles } from 'lucide-react';

export const ShareCardModal: React.FC = () => {
  const { isShareModalOpen, setIsShareModalOpen, shareCardData } = useApp();
  const [cardTheme, setCardTheme] = useState<'dark' | 'emerald' | 'sunset'>('dark');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isShareModalOpen || !shareCardData) return;

    generateShareCardCanvas({
      ...shareCardData,
      theme: cardTheme
    }).then((url) => {
      setPreviewUrl(url);
    });
  }, [isShareModalOpen, shareCardData, cardTheme]);

  if (!isShareModalOpen || !shareCardData) return null;

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `skilltrack-${shareCardData.skillName ? shareCardData.skillName.toLowerCase() : 'summary'}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyImage = async () => {
    if (!previewUrl) return;
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      handleDownload();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="fixed inset-0" onClick={() => setIsShareModalOpen(false)} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] shadow-2xl p-6 text-[#1A1D1A] dark:text-[#ECF0EC] z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DDDDD6] dark:border-[#262B26]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 id="share-modal-title" className="font-display font-bold text-xl text-[#1A1D1A] dark:text-[#ECF0EC]">
              Practice Achievement Card
            </h2>
          </div>
          <button
            onClick={() => setIsShareModalOpen(false)}
            className="p-1.5 rounded-lg text-[#5F6A5F] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Picker */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold text-[#5F6A5F] dark:text-[#A0AAA0]">
            Card Theme:
          </span>
          <div className="flex items-center gap-1.5 bg-[#F2F2EE] dark:bg-[#262B26] p-1 rounded-xl">
            <button
              onClick={() => setCardTheme('dark')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                cardTheme === 'dark'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-[#5F6A5F] hover:text-[#1A1D1A]'
              }`}
            >
              Dark Minimal
            </button>
            <button
              onClick={() => setCardTheme('emerald')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                cardTheme === 'emerald'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#5F6A5F] hover:text-[#1A1D1A]'
              }`}
            >
              Emerald Lush
            </button>
            <button
              onClick={() => setCardTheme('sunset')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                cardTheme === 'sunset'
                  ? 'bg-orange-700 text-white shadow-xs'
                  : 'text-[#5F6A5F] hover:text-[#1A1D1A]'
              }`}
            >
              Sunset Ember
            </button>
          </div>
        </div>

        {/* Image Preview Box */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#DDDDD6] dark:border-[#333A33] bg-[#131614] flex items-center justify-center shadow-inner">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Shareable Practice Card"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-xs text-emerald-400 animate-pulse">
              Generating high-res card...
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-[#DDDDD6] dark:border-[#262B26]">
          <button
            onClick={handleCopyImage}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDDDD6] dark:border-[#333A33] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] text-xs font-medium transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Image'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
