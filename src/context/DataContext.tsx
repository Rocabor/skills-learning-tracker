import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Skill, Session, User, SkillStats, OverallStats } from '../types';
import { getSeededData } from '../data/sampleData';
import { computeSkillStats, computeOverallStats } from '../utils/streakUtils';
import { useToast } from './ToastContext';
import { useModal } from './ModalContext';
import { usePreferences } from './PreferencesContext';
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
  setAuthToken,
  getAuthToken,
} from '../api/client';

interface DataContextType {
  user: User | null;
  isGuest: boolean;
  skills: Skill[];
  sessions: Session[];
  skillStatsMap: Record<string, SkillStats>;
  overallStats: OverallStats;

  // CRUD Skills
  addSkill: (skillData: Omit<Skill, 'id' | 'createdAt'>) => Promise<Skill>;
  updateSkill: (id: string, updates: Partial<Skill>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;

  // CRUD Sessions
  addSession: (sessionData: Omit<Session, 'id' | 'createdAt'>) => Promise<Session>;
  updateSession: (id: string, updates: Omit<Partial<Session>, 'id' | 'createdAt'>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // Auth & Modes
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  enterGuestMode: () => void;
  resetToSampleData: () => void;
  loadStarterPack: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

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
  email: 'guest@skilltrack.local',
  name: 'Jordan',
  isGuest: true,
  joinedAt: new Date().toISOString(),
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const { selectedSkillId, setSelectedSkillId } = useModal();
  const { reducedMotion } = usePreferences();

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
    if (!token) return;

    // Invalid/expired token or unreachable server: clear the stale token and
    // fall back to a clean guest state instead of leaving stale UI visible.
    const resetToCleanGuest = () => {
      setAuthToken(null);
      setUser(GUEST_USER);
      setSkills(getGuestSkills());
      setSessions(getGuestSessions());
    };

    apiGetMe()
      .then((dbUser) => {
        if (!dbUser) {
          resetToCleanGuest();
          return;
        }
        setUser(dbUser);
        // Load skills and sessions from SQLite database
        return Promise.all([apiGetSkills(), apiGetSessions()])
          .then(([dbSkills, dbSessions]) => {
            setSkills(dbSkills);
            setSessions(dbSessions);
          })
          .catch((err) => {
            console.error('Error loading SQLite data:', err);
          });
      })
      .catch((err) => {
        console.error('Error validating session on startup:', err);
        resetToCleanGuest();
      });
  }, []);

  const isGuest = !user || user.isGuest;

  // Skill CRUD (SQLite synced for logged users, local for guests)
  const addSkill = useCallback(
    async (skillData: Omit<Skill, 'id' | 'createdAt'>): Promise<Skill> => {
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
    },
    [user, showToast],
  );

  const updateSkill = useCallback(
    async (id: string, updates: Partial<Skill>) => {
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
    },
    [user, showToast],
  );

  const deleteSkill = useCallback(
    async (id: string) => {
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
    },
    [user, skills, selectedSkillId, setSelectedSkillId, showToast],
  );

  // Session CRUD (SQLite synced for logged users, local for guests)
  const addSession = useCallback(
    async (sessionData: Omit<Session, 'id' | 'createdAt'>): Promise<Session> => {
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
    },
    [user, skills, reducedMotion, showToast],
  );

  const updateSession = useCallback(
    async (id: string, updates: Omit<Partial<Session>, 'id' | 'createdAt'>) => {
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
    },
    [user, showToast],
  );

  const deleteSession = useCallback(
    async (id: string) => {
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
    },
    [user, showToast],
  );

  // Auth Management connected to Node/Express + SQLite backend (Email + Password)
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await apiLogin(email, password);
        const displayName = res.user.name || email;
        const loggedUser: User = { ...res.user, name: displayName };

        setUser(loggedUser);
        // Fetch user's data from SQLite
        const [userSkills, userSessions] = await Promise.all([apiGetSkills(), apiGetSessions()]);
        setSkills(userSkills);
        setSessions(userSessions);
        setSelectedSkillId(null);

        showToast(`Welcome back, ${displayName}!`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        showToast(message);
        throw err;
      }
    },
    [setSelectedSkillId, showToast],
  );

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        const res = await apiRegister(email, password, name);
        const displayName = res.user.name || email;
        const newUser: User = { ...res.user, name: displayName };

        setUser(newUser);
        setSkills([]);
        setSessions([]);
        setSelectedSkillId(null);

        showToast(`Account created successfully for ${email}!`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error registering user';
        showToast(message);
        throw err;
      }
    },
    [setSelectedSkillId, showToast],
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setSkills([]);
    setSessions([]);
    setSelectedSkillId(null);
    showToast('Signed out successfully');
  }, [setSelectedSkillId, showToast]);

  const enterGuestMode = useCallback(() => {
    setAuthToken(null);
    const guestSkills = getGuestSkills();
    const guestSessions = getGuestSessions();

    setUser(GUEST_USER);
    setSkills(guestSkills);
    setSessions(guestSessions);
    setSelectedSkillId(null);

    showToast('Switched to Guest Mode with sample practice data.');
  }, [setSelectedSkillId, showToast]);

  const resetToSampleData = useCallback(() => {
    const seeded = getSeededData();
    setSkills(seeded.skills);
    setSessions(seeded.sessions);
    showToast('Data reset to standard 6 sample skills & 47 sessions.');
  }, [showToast]);

  const loadStarterPack = useCallback(async () => {
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
  }, [addSkill, showToast]);

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

  const value = useMemo(
    () => ({
      user,
      isGuest,
      skills,
      sessions,
      skillStatsMap,
      overallStats,
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
    }),
    [
      user,
      isGuest,
      skills,
      sessions,
      skillStatsMap,
      overallStats,
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
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
