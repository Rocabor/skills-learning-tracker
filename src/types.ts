export interface SkillGoal {
  type: 'weekly' | 'total';
  targetHours: number;
}

export interface Skill {
  id: string;
  name: string;
  color: string;
  goal: SkillGoal | null;
  createdAt: string;
  userId?: string;
}

export interface Session {
  id: string;
  skillId: string;
  durationMinutes: number;
  date: string;
  notes: string | null;
  createdAt: string;
  userId?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  isGuest: boolean;
  joinedAt?: string;
}

export type StreakStatus = 'active' | 'at_risk' | 'broken';

export interface SkillStats {
  skillId: string;
  totalMinutes: number;
  totalHours: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  streakStatus: StreakStatus;
  lastSessionDate: string | null;
  lastSessionMinutes: number | null;
  weeklyMinutes: number;
  goalProgressPercent: number | null;
}

export interface OverallStats {
  totalMinutes: number;
  totalHours: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  streakStatus: StreakStatus;
  activeSkillsCount: number;
  todayMinutes: number;
  todaySessionsCount: number;
}

export interface HeatmapDay {
  date: string;
  minutes: number;
  sessions: number;
}

export interface AIInsights {
  summary: string;
  highlights: string[];
  recommendation: string;
  reflectionPrompt: string;
  streakMotivation: string;
  generatedAt: string;
}

export interface ActiveTimer {
  skillId: string;
  startTime: number;
  elapsedSeconds: number;
  isRunning: boolean;
}
