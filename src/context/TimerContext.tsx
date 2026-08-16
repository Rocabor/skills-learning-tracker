import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ActiveTimer } from '../types';
import { useData } from './DataContext';
import { useToast } from './ToastContext';

interface TimerContextType {
  activeTimer: ActiveTimer | null;
  startTimer: (skillId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => number;
  resetTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'skilltrack_v1_';

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, skills } = useData();
  const { showToast } = useToast();

  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}active_timer`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Reset the active timer whenever the signed-in user changes
  const userId = user?.id ?? null;
  useEffect(() => {
    setActiveTimer(null);
  }, [userId]);

  // Timer ticker
  const timerIsRunning = Boolean(activeTimer?.isRunning);
  const timerStart = activeTimer?.startTime;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerIsRunning) {
      interval = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev || !prev.isRunning) return prev;
          const currentElapsed = Math.floor((Date.now() - prev.startTime) / 1000);
          return {
            ...prev,
            elapsedSeconds: currentElapsed,
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerIsRunning, timerStart]);

  // Persist active timer across reloads
  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}active_timer`, JSON.stringify(activeTimer));
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}active_timer`);
    }
  }, [activeTimer]);

  const startTimer = useCallback(
    (skillId: string) => {
      const now = Date.now();
      const newTimer: ActiveTimer = {
        skillId,
        startTime: now,
        elapsedSeconds: 0,
        isRunning: true,
      };
      setActiveTimer(newTimer);
      const skill = skills.find((s) => s.id === skillId);
      showToast(`Started practice timer for "${skill?.name || 'Skill'}"`);
    },
    [skills, showToast],
  );

  const pauseTimer = useCallback(() => {
    if (!activeTimer || !activeTimer.isRunning) return;
    setActiveTimer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        isRunning: false,
      };
    });
    showToast('Timer paused');
  }, [activeTimer, showToast]);

  const resumeTimer = useCallback(() => {
    if (!activeTimer || activeTimer.isRunning) return;
    const now = Date.now();
    const adjustedStart = now - activeTimer.elapsedSeconds * 1000;
    setActiveTimer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        startTime: adjustedStart,
        isRunning: true,
      };
    });
    showToast('Timer resumed');
  }, [activeTimer, showToast]);

  const stopTimer = useCallback((): number => {
    if (!activeTimer) return 0;
    const totalMinutes = Math.max(1, Math.round(activeTimer.elapsedSeconds / 60));
    setActiveTimer(null);
    return totalMinutes;
  }, [activeTimer]);

  const resetTimer = useCallback(() => {
    setActiveTimer(null);
  }, []);

  const value = useMemo(
    () => ({ activeTimer, startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer }),
    [activeTimer, startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
