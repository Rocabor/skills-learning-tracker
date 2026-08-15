import type { Session, Skill, SkillStats, OverallStats, StreakStatus } from '../types';
import { getTodayDateString, daysBetween, getMondayOfWeek } from './dateUtils';

/**
 * Calculates current streak and longest streak from a set of unique sorted practice dates.
 * Dates MUST be formatted as 'YYYY-MM-DD' and sorted in ascending order.
 */
export function calculateStreaksFromDates(dates: string[]): {
  currentStreak: number;
  longestStreak: number;
  status: StreakStatus;
} {
  if (!dates || dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, status: 'broken' };
  }

  // Get unique sorted dates in ascending order
  const uniqueDates = Array.from(new Set(dates)).sort();
  const today = getTodayDateString();

  // Calculate longest streak
  let longestStreak = 0;
  let runningStreak = 0;
  let prevDateStr: string | null = null;

  for (const dateStr of uniqueDates) {
    if (!prevDateStr) {
      runningStreak = 1;
    } else {
      const diff = daysBetween(prevDateStr, dateStr);
      if (diff === 1) {
        runningStreak += 1;
      } else if (diff > 1) {
        runningStreak = 1;
      }
      // diff === 0 shouldn't happen with unique set
    }
    if (runningStreak > longestStreak) {
      longestStreak = runningStreak;
    }
    prevDateStr = dateStr;
  }

  // Calculate current streak relative to today
  // Check if today is in the dataset
  const hasToday = uniqueDates.includes(today);

  // Check if yesterday is in the dataset
  const yesterdayObj = new Date(`${today}T00:00:00Z`);
  yesterdayObj.setUTCDate(yesterdayObj.getUTCDate() - 1);
  const yesterday = yesterdayObj.toISOString().split('T')[0];
  const hasYesterday = uniqueDates.includes(yesterday);

  let currentStreak: number;
  let status: StreakStatus;

  if (hasToday) {
    // Current active streak includes today, count backwards
    status = 'active';
    currentStreak = 1;
    const checkDateObj = new Date(`${today}T00:00:00Z`);
    while (true) {
      checkDateObj.setUTCDate(checkDateObj.getUTCDate() - 1);
      const checkDateStr = checkDateObj.toISOString().split('T')[0];
      if (uniqueDates.includes(checkDateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (hasYesterday) {
    // Streak is AT RISK: user has not practiced today, but practiced yesterday
    status = 'at_risk';
    currentStreak = 1;
    const checkDateObj = new Date(`${yesterday}T00:00:00Z`);
    while (true) {
      checkDateObj.setUTCDate(checkDateObj.getUTCDate() - 1);
      const checkDateStr = checkDateObj.toISOString().split('T')[0];
      if (uniqueDates.includes(checkDateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else {
    // Neither today nor yesterday had practice -> streak is broken
    currentStreak = 0;
    status = 'broken';
  }

  return {
    currentStreak,
    longestStreak,
    status,
  };
}

/**
 * Computes detailed stats for a single skill
 */
export function computeSkillStats(skill: Skill, sessions: Session[]): SkillStats {
  const skillSessions = sessions.filter((s) => s.skillId === skill.id);
  const totalMinutes = skillSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const totalSessions = skillSessions.length;

  const dates = skillSessions.map((s) => s.date);
  const { currentStreak, longestStreak, status } = calculateStreaksFromDates(dates);

  // Find last session
  let lastSessionDate: string | null = null;
  let lastSessionMinutes: number | null = null;
  if (skillSessions.length > 0) {
    // sort sessions descending by date, then createdAt
    const sorted = [...skillSessions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
    lastSessionDate = sorted[0].date;
    lastSessionMinutes = sorted[0].durationMinutes;
  }

  // Weekly minutes (current calendar week starting Monday)
  const now = new Date();
  const monday = getMondayOfWeek(now);
  const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

  const weeklySessions = skillSessions.filter((s) => s.date >= mondayStr);
  const weeklyMinutes = weeklySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Goal Progress %
  let goalProgressPercent: number | null = null;
  if (skill.goal) {
    if (skill.goal.type === 'weekly') {
      const targetWeeklyMins = (skill.goal.targetHours || 0) * 60;
      if (targetWeeklyMins > 0) {
        goalProgressPercent = Math.min(Math.round((weeklyMinutes / targetWeeklyMins) * 100), 100);
      }
    } else if (skill.goal.type === 'total') {
      const targetTotalMins = (skill.goal.targetHours || 0) * 60;
      if (targetTotalMins > 0) {
        goalProgressPercent = Math.min(Math.round((totalMinutes / targetTotalMins) * 100), 100);
      }
    }
  }

  return {
    skillId: skill.id,
    totalMinutes,
    totalHours,
    totalSessions,
    currentStreak,
    longestStreak,
    streakStatus: status,
    lastSessionDate,
    lastSessionMinutes,
    weeklyMinutes,
    goalProgressPercent,
  };
}

/**
 * Computes aggregated statistics across all skills and sessions
 */
export function computeOverallStats(skills: Skill[], sessions: Session[]): OverallStats {
  const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const totalSessions = sessions.length;

  const allDates = sessions.map((s) => s.date);
  const { currentStreak, longestStreak, status } = calculateStreaksFromDates(allDates);

  const today = getTodayDateString();
  const todaySessions = sessions.filter((s) => s.date === today);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Active skills count (skills with at least 1 session in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const activeSkillIds = new Set(
    sessions.filter((s) => s.date >= thirtyDaysAgoStr).map((s) => s.skillId)
  );

  return {
    totalMinutes,
    totalHours,
    totalSessions,
    currentStreak,
    longestStreak,
    streakStatus: status,
    activeSkillsCount: activeSkillIds.size || skills.length,
    todayMinutes,
    todaySessionsCount: todaySessions.length,
  };
}
