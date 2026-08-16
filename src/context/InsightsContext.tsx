import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { AIInsights } from '../types';
import { useData } from './DataContext';
import { useToast } from './ToastContext';
import { apiGetInsights } from '../api/client';

interface InsightsContextType {
  aiInsight: AIInsights | null;
  isLoadingAI: boolean;
  fetchAIInsights: () => Promise<void>;
}

const InsightsContext = createContext<InsightsContextType | undefined>(undefined);

export const InsightsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, skills, sessions, overallStats } = useData();
  const { showToast } = useToast();

  const [aiInsight, setAiInsight] = useState<AIInsights | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Clear stored insights whenever the signed-in user changes
  const userId = user?.id ?? null;
  useEffect(() => {
    setAiInsight(null);
  }, [userId]);

  // AI Practice Insights from Server
  const fetchAIInsights = useCallback(async () => {
    setIsLoadingAI(true);
    try {
      const data = await apiGetInsights(skills, sessions, {
        totalHours: overallStats.totalHours,
        currentStreak: overallStats.currentStreak,
        longestStreak: overallStats.longestStreak,
        activeSkillsCount: overallStats.activeSkillsCount,
      });
      if (data) {
        setAiInsight(data);
        showToast('AI Practice Insights updated!');
      } else {
        showToast('Generated practice insights based on your log');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      showToast('Generated practice insights based on your log');
    } finally {
      setIsLoadingAI(false);
    }
  }, [skills, sessions, overallStats, showToast]);

  const value = useMemo(
    () => ({ aiInsight, isLoadingAI, fetchAIInsights }),
    [aiInsight, isLoadingAI, fetchAIInsights],
  );

  return <InsightsContext.Provider value={value}>{children}</InsightsContext.Provider>;
};

export const useInsights = () => {
  const context = useContext(InsightsContext);
  if (!context) {
    throw new Error('useInsights must be used within an InsightsProvider');
  }
  return context;
};
