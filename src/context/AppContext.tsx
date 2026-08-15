import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Skill, Session, User, SkillStats, OverallStats, ActiveTimer, AIInsights } from '../types';
import { getSeededData } from '../data/sampleData';
import { computeSkillStats, computeOverallStats } from '../utils/streakUtils';
import type { ShareCardData } from '../utils/shareUtils';
import confetti from 'canvas-confetti';
import {
  apiRegister,
  apiLogin,
  apiGetMe,
  apiGetSkills,
  apiCreateSkill,
  apiUpdateSkill,
  apiDeleteSkill,
  apiGetSessions,
  apiCreateSession,
  apiUpdateSession,
  apiDeleteSession,
  apiGetInsights,
  setAuthToken,
  getAuthToken,
} from '../api/client';

interface AppContextType {
  user: User | null;
  isGuest: boolean;
  skills: Skill[];
  sessions: Session[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;

  // Active Timer
  activeTimer: ActiveTimer | null;
  startTimer: (skillId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => number;
  resetTimer: () => void;

  // CRUD Skills
  addSkill: (skillData: Omit<Skill, 'id' | 'createdAt'>) => Promise<Skill>;
  updateSkill: (id: string, updates: Partial<Skill>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;

  // CRUD Sessions
  addSession: (sessionData: Omit<Session, 'id' | 'createdAt'>) => Promise<Session>;
  updateSession: (id: string, updates: Omit<Partial<Session>, 'id' | 'createdAt'>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // Auth & Modes
  login: (username: string, pin: string) => Promise<void>;
  signup: (username: string, pin: string, name?: string) => Promise<void>;
  logout: () => void;
  enterGuestMode: () => void;
  resetToSampleData: () => void;
  loadStarterPack: () => void;

  // Navigation & Modals
  selectedSkillId: string | null;
  setSelectedSkillId: (id: string | null) => void;
  isLogModalOpen: boolean;
  setIsLogModalOpen: (open: boolean) => void;
  logModalDefaultSkillId: string | null;
  openLogModalWithSkill: (skillId?: string) => void;
  editingSession: Session | null;
  openEditSessionModal: (session: Session) => void;
  isSkillModalOpen: boolean;
  setIsSkillModalOpen: (open: boolean) => void;
  editingSkill: Skill | null;
  openEditSkillModal: (skill: Skill) => void;
  openAddSkillModal: () => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  shareCardData: ShareCardData | null;
  openShareModal: (data: ShareCardData) => void;
  closeModals: () => void;

  // Stats
  overallStats: OverallStats;
  skillStatsMap: Record<string, SkillStats>;

  // AI Insights
  aiInsight: AIInsights | null;
  isLoadingAI: boolean;
  fetchAIInsights: () => Promise<void>;

  // Toast Notification
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'skilltrack_v1_';

const getGuestSkills = (): Skill[] => {
  const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}guest_skills`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fall through to seeded data
    }
  }
  return getSeededData().skills;
};

const getGuestSessions = (): Session[] => {
  const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}guest_sessions`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fall through to seeded data
    }
  }
  return getSeededData().sessions;
};

const GUEST_USER: User = {
  id: 'guest-1',
  username: 'guest',
  name: 'Jordan',
  isGuest: true,
  joinedAt: new Date().toISOString(),
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}theme`);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return (
      localStorage.getItem(`${STORAGE_KEY_PREFIX}reduced_motion`) === 'true' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}high_contrast`) === 'true';
  });

  // User state (defaults to Guest)
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fall through to guest
      }
    }
    return GUEST_USER;
  });

  // Skills & Sessions state
  const [skills, setSkills] = useState<Skill[]>(() => {
    const savedUser = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (!u.isGuest) return [];
      } catch {
        // fall through
      }
    }
    return getGuestSkills();
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    const savedUser = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (!u.isGuest) return [];
      } catch {
        // fall through
      }
    }
    return getGuestSessions();
  });

  // Active Timer state
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

  // Navigation & Modals
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalDefaultSkillId, setLogModalDefaultSkillId] = useState<string | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCardData, setShareCardData] = useState<ShareCardData | null>(null);

  // AI Insights
  const [aiInsight, setAiInsight] = useState<AIInsights | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }, []);

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

  // Persist user and guest states
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(user));
      if (user.isGuest) {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}guest_skills`, JSON.stringify(skills));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}guest_sessions`, JSON.stringify(sessions));
      }
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}user`);
    }
  }, [user, skills, sessions]);

  // Check auth session on startup against SQLite backend
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      apiGetMe().then((dbUser) => {
        if (dbUser) {
          setUser(dbUser);
          // Load skills and sessions from SQLite database
          Promise.all([apiGetSkills(), apiGetSessions()])
            .then(([dbSkills, dbSessions]) => {
              setSkills(dbSkills);
              setSessions(dbSessions);
            })
            .catch((err) => {
              console.error('Error loading SQLite data:', err);
            });
        }
      });
    }
  }, []);

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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Timer controls
  const startTimer = (skillId: string) => {
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
  };

  const pauseTimer = () => {
    if (!activeTimer || !activeTimer.isRunning) return;
    setActiveTimer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        isRunning: false,
      };
    });
    showToast('Timer paused');
  };

  const resumeTimer = () => {
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
  };

  const stopTimer = (): number => {
    if (!activeTimer) return 0;
    const totalMinutes = Math.max(1, Math.round(activeTimer.elapsedSeconds / 60));
    setActiveTimer(null);
    return totalMinutes;
  };

  const resetTimer = () => {
    setActiveTimer(null);
  };

  // Skill CRUD (SQLite synced for logged users, local for guests)
  const addSkill = async (skillData: Omit<Skill, 'id' | 'createdAt'>): Promise<Skill> => {
    if (user && !user.isGuest) {
      const tempId = `temp-skill-${Date.now()}`;
      const optimistic: Skill = {
        ...skillData,
        id: tempId,
        createdAt: new Date().toISOString(),
        userId: user.id,
      };
      // Optimistic: render immediately, roll back on failure
      setSkills((prev) => [optimistic, ...prev]);
      try {
        const created = await apiCreateSkill(skillData);
        setSkills((prev) => prev.map((s) => (s.id === tempId ? created : s)));
        showToast(`Saved "${created.name}" to your SQLite database`);
        return created;
      } catch (err) {
        setSkills((prev) => prev.filter((s) => s.id !== tempId));
        const message = err instanceof Error ? err.message : 'Failed to save skill';
        showToast(`Failed to save: ${message}`);
        throw err;
      }
    } else {
      const newSkill: Skill = {
        ...skillData,
        id: `skill-${Date.now()}`,
        createdAt: new Date().toISOString(),
        userId: user?.id,
      };
      setSkills((prev) => [newSkill, ...prev]);
      showToast(`Added skill "${newSkill.name}"`);
      return newSkill;
    }
  };

  const updateSkill = async (id: string, updates: Partial<Skill>) => {
    if (user && !user.isGuest) {
      try {
        const updated = await apiUpdateSkill(id, updates);
        setSkills((prev) => prev.map((s) => (s.id === id ? updated : s)));
        showToast('Skill updated in SQLite database');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Update error';
        showToast(`Update error: ${message}`);
      }
    } else {
      setSkills((prev) =>
        prev.map((skill) => (skill.id === id ? { ...skill, ...updates } : skill)),
      );
      showToast('Skill updated successfully');
    }
  };

  const deleteSkill = async (id: string) => {
    const skillToDelete = skills.find((s) => s.id === id);
    if (user && !user.isGuest) {
      try {
        await apiDeleteSkill(id);
        setSkills((prev) => prev.filter((s) => s.id !== id));
        setSessions((prev) => prev.filter((sess) => sess.skillId !== id));
        if (selectedSkillId === id) setSelectedSkillId(null);
        showToast(`Deleted "${skillToDelete?.name || 'Skill'}" from SQLite database`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Deletion error';
        showToast(`Deletion error: ${message}`);
      }
    } else {
      setSkills((prev) => prev.filter((s) => s.id !== id));
      setSessions((prev) => prev.filter((sess) => sess.skillId !== id));
      if (selectedSkillId === id) setSelectedSkillId(null);
      showToast(`Deleted skill "${skillToDelete?.name || 'Skill'}"`);
    }
  };

  // Session CRUD (SQLite synced for logged users, local for guests)
  const addSession = async (sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> => {
    if (user && !user.isGuest) {
      const tempId = `temp-session-${Date.now()}`;
      const optimistic: Session = {
        ...sessionData,
        id: tempId,
        createdAt: new Date().toISOString(),
        userId: user.id,
      };
      // Optimistic: show the new session immediately, roll back on failure
      setSessions((prev) => [optimistic, ...prev]);
      try {
        const createdSession = await apiCreateSession(sessionData);
        setSessions((prev) => prev.map((sess) => (sess.id === tempId ? createdSession : sess)));
        showToast(`Logged ${createdSession.durationMinutes}m to SQLite database!`);
        if (!reducedMotion) {
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 },
              colors: ['#059669', '#34D399', '#F59E0B', '#10B981'],
            });
          } catch {
            // confetti is best-effort
          }
        }
        return createdSession;
      } catch (err) {
        setSessions((prev) => prev.filter((sess) => sess.id !== tempId));
        const message = err instanceof Error ? err.message : 'Failed to save session';
        showToast(`Couldn't save your session. ${message}`);
        throw err;
      }
    } else {
      const createdSession: Session = {
        ...sessionData,
        id: `s-${Date.now()}`,
        createdAt: new Date().toISOString(),
        userId: user?.id,
      };
      setSessions((prev) => [createdSession, ...prev]);
      const skill = skills.find((s) => s.id === sessionData.skillId);
      showToast(`Logged ${sessionData.durationMinutes}m of ${skill?.name || 'practice'}!`);
      if (!reducedMotion) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
            colors: ['#059669', '#34D399', '#F59E0B', '#10B981'],
          });
        } catch {
          // confetti is best-effort
        }
      }
      return createdSession;
    }
  };

  const updateSession = async (
    id: string,
    updates: Omit<Partial<Session>, 'id' | 'createdAt'>,
  ) => {
    if (user && !user.isGuest) {
      try {
        const updated = await apiUpdateSession(id, updates);
        setSessions((prev) => prev.map((sess) => (sess.id === id ? updated : sess)));
        showToast('Session updated successfully!');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error updating session';
        showToast(`Error updating session: ${message}`);
      }
    } else {
      const updatedAt = new Date().toISOString();
      setSessions((prev) =>
        prev.map((sess) => (sess.id === id ? { ...sess, ...updates, updatedAt } : sess)),
      );
      showToast('Session updated');
    }
  };

  const deleteSession = async (id: string) => {
    if (user && !user.isGuest) {
      try {
        await apiDeleteSession(id);
        setSessions((prev) => prev.filter((sess) => sess.id !== id));
        showToast('Session removed from SQLite database');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error deleting session';
        showToast(`Error deleting session: ${message}`);
      }
    } else {
      setSessions((prev) => prev.filter((sess) => sess.id !== id));
      showToast('Session removed');
    }
  };

  // Auth Management connected to Node/Express + SQLite backend (Username + 4-Digit PIN)
  const login = async (username: string, pin: string) => {
    try {
      const res = await apiLogin(username, pin);
      const displayName = res.user.name || res.user.username || username;
      const loggedUser: User = { ...res.user, name: displayName };

      setUser(loggedUser);
      // Fetch user's data from SQLite
      const [userSkills, userSessions] = await Promise.all([apiGetSkills(), apiGetSessions()]);
      setSkills(userSkills);
      setSessions(userSessions);
      setActiveTimer(null);
      setSelectedSkillId(null);
      setAiInsight(null);

      showToast(`Welcome back, ${displayName}!`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      showToast(message);
      throw err;
    }
  };

  const signup = async (username: string, pin: string, name?: string) => {
    try {
      const res = await apiRegister(username, pin, name);
      const displayName = res.user.name || username;
      const newUser: User = { ...res.user, name: displayName };

      setUser(newUser);
      setSkills([]);
      setSessions([]);
      setActiveTimer(null);
      setSelectedSkillId(null);
      setAiInsight(null);

      showToast(`Account created successfully for @${username}!`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error registering user';
      showToast(message);
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setSkills([]);
    setSessions([]);
    setActiveTimer(null);
    setSelectedSkillId(null);
    setAiInsight(null);
    showToast('Signed out successfully');
  };

  const enterGuestMode = () => {
    setAuthToken(null);
    const guestSkills = getGuestSkills();
    const guestSessions = getGuestSessions();

    setUser(GUEST_USER);
    setSkills(guestSkills);
    setSessions(guestSessions);
    setActiveTimer(null);
    setSelectedSkillId(null);

    showToast('Switched to Guest Mode with sample practice data.');
  };

  const resetToSampleData = () => {
    const seeded = getSeededData();
    setSkills(seeded.skills);
    setSessions(seeded.sessions);
    showToast('Data reset to standard 6 sample skills & 47 sessions.');
  };

  const loadStarterPack = async () => {
    const starters: Omit<Skill, 'id' | 'createdAt'>[] = [
      {
        name: 'Programming & Logic',
        color: '#3178C6',
        goal: { type: 'weekly', targetHours: 5 },
      },
      {
        name: 'Language Acquisition',
        color: '#059669',
        goal: { type: 'weekly', targetHours: 3 },
      },
      {
        name: 'Creative Writing',
        color: '#D97706',
        goal: { type: 'total', targetHours: 50 },
      },
    ];

    for (const starter of starters) {
      await addSkill(starter);
    }
    showToast('Loaded 3-skill starter pack into your account!');
  };

  // Compute stats
  const skillStatsMap = useMemo(() => {
    const map: Record<string, SkillStats> = {};
    skills.forEach((skill) => {
      map[skill.id] = computeSkillStats(skill, sessions);
    });
    return map;
  }, [skills, sessions]);

  const overallStats = useMemo(() => {
    return computeOverallStats(skills, sessions);
  }, [skills, sessions]);

  // AI Practice Insights from Server
  const fetchAIInsights = async () => {
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
  };

  // Modal helpers
  const openLogModalWithSkill = (skillId?: string) => {
    setLogModalDefaultSkillId(skillId || null);
    setIsLogModalOpen(true);
  };

  const openEditSessionModal = (session: Session) => {
    setEditingSession(session);
    setIsLogModalOpen(true);
  };

  const openEditSkillModal = (skill: Skill) => {
    setEditingSkill(skill);
    setIsSkillModalOpen(true);
  };

  const openAddSkillModal = () => {
    setEditingSkill(null);
    setIsSkillModalOpen(true);
  };

  const openShareModal = (data: ShareCardData) => {
    setShareCardData(data);
    setIsShareModalOpen(true);
  };

  const closeModals = () => {
    setIsLogModalOpen(false);
    setIsSkillModalOpen(false);
    setEditingSkill(null);
    setEditingSession(null);
    setIsShareModalOpen(false);
  };

  const value: AppContextType = {
    user,
    isGuest: !user || user.isGuest,
    skills,
    sessions,
    theme,
    toggleTheme,
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast,
    activeTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    addSkill,
    updateSkill,
    deleteSkill,
    addSession,
    updateSession,
    deleteSession,
    login,
    signup,
    logout,
    enterGuestMode,
    resetToSampleData,
    loadStarterPack,
    selectedSkillId,
    setSelectedSkillId,
    isLogModalOpen,
    setIsLogModalOpen,
    logModalDefaultSkillId,
    openLogModalWithSkill,
    editingSession,
    openEditSessionModal,
    isSkillModalOpen,
    setIsSkillModalOpen,
    editingSkill,
    openEditSkillModal,
    openAddSkillModal,
    isShareModalOpen,
    setIsShareModalOpen,
    shareCardData,
    openShareModal,
    closeModals,
    overallStats,
    skillStatsMap,
    aiInsight,
    isLoadingAI,
    fetchAIInsights,
    toastMessage,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
