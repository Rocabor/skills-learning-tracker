import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

interface PreferencesContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'skilltrack_v1_';

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}theme`);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    return (
      localStorage.getItem(`${STORAGE_KEY_PREFIX}reduced_motion`) === 'true' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}high_contrast`) === 'true';
  });

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(`${STORAGE_KEY_PREFIX}theme`, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setReducedMotion = useCallback((val: boolean) => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}reduced_motion`, String(val));
    setReducedMotionState(val);
  }, []);

  const setHighContrast = useCallback((val: boolean) => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}high_contrast`, String(val));
    setHighContrastState(val);
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, reducedMotion, setReducedMotion, highContrast, setHighContrast }),
    [theme, toggleTheme, reducedMotion, setReducedMotion, highContrast, setHighContrast],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
