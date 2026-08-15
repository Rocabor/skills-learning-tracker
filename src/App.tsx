import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SkillDetailView } from './components/SkillDetailView';
import { LogSessionModal } from './components/LogSessionModal';
import { SkillModal } from './SkillModal';
import { AuthModal } from './components/AuthModal';
import { AccessibilityDialog } from './components/AccessibilityDialog';
import { ShareCardModal } from './components/ShareCardModal';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { CheckCircle2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    user,
    isGuest,
    selectedSkillId,
    setSelectedSkillId,
    toastMessage,
    openLogModalWithSkill,
    toggleTheme,
    closeModals,
    isLogModalOpen,
    isSkillModalOpen,
    isShareModalOpen,
    highContrast
  } = useApp();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);

  // Global Keyboard Shortcuts (N / L for log, T for theme, ? for help, Esc for back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        if (e.key === 'Escape') {
          closeModals();
          setIsAuthModalOpen(false);
          setIsAccessibilityOpen(false);
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        openLogModalWithSkill();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsAccessibilityOpen(true);
      } else if (e.key === 'Escape') {
        if (isLogModalOpen || isSkillModalOpen || isAuthModalOpen || isAccessibilityOpen || isShareModalOpen) {
          closeModals();
          setIsAuthModalOpen(false);
          setIsAccessibilityOpen(false);
        } else if (selectedSkillId) {
          setSelectedSkillId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isLogModalOpen,
    isSkillModalOpen,
    isShareModalOpen,
    isAuthModalOpen,
    isAccessibilityOpen,
    selectedSkillId,
    openLogModalWithSkill,
    toggleTheme,
    closeModals,
    setSelectedSkillId
  ]);

  // If user is not signed in and not in guest demo mode, show Landing Page
  if (!user && !isGuest) {
    return (
      <>
        <LandingPage onOpenAuth={() => setIsAuthModalOpen(true)} />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-[#131614] text-[#1A1D1A] dark:text-[#ECF0EC] transition-colors duration-200 ${
        highContrast ? 'high-contrast' : ''
      }`}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white dark:bg-[#1C201C] border border-emerald-500/30 text-[#1A1D1A] dark:text-[#ECF0EC] shadow-xl text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Persistent App Header */}
      <Navbar
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
      />

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1">
        {selectedSkillId ? (
          <SkillDetailView
            skillId={selectedSkillId}
            onBack={() => setSelectedSkillId(null)}
          />
        ) : (
          <Dashboard />
        )}
      </main>

      {/* Attribution Footer */}
      <Footer />

      {/* Global Modals */}
      <LogSessionModal />
      <SkillModal />
      <ShareCardModal />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <AccessibilityDialog
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
