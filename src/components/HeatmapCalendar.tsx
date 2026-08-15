import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { HeatmapDay, Skill } from '../types';
import { getTodayDateString, formatMinutes, formatFullDate } from '../utils/dateUtils';
import { Table as TableIcon, Grid as GridIcon } from 'lucide-react';

interface HeatmapCalendarProps {
  filteredSkillId?: string; // If passed, locks to this skill
  weeksCount?: number;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  filteredSkillId,
  weeksCount = 18,
}) => {
  const { sessions, skills } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>(filteredSkillId || 'all');
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [activeDayModal, setActiveDayModal] = useState<HeatmapDay | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Active skill filter
  const currentFilter = filteredSkillId || selectedFilter;

  // Filter sessions based on selection
  const relevantSessions = useMemo(() => {
    if (currentFilter === 'all') return sessions;
    return sessions.filter((s) => s.skillId === currentFilter);
  }, [sessions, currentFilter]);

  // Skill lookup map for quick access
  const skillsMap = useMemo(() => {
    const map = new Map<string, Skill>();
    for (const skill of skills) {
      map.set(skill.id, skill);
    }
    return map;
  }, [skills]);

  // Build the calendar matrix for the past `weeksCount` weeks
  const { weeks, summaryStats } = useMemo(() => {
    const todayStr = getTodayDateString();
    const todayDate = new Date(`${todayStr}T00:00:00`);

    // Today is day of week (0: Sun, 1: Mon, ... 6: Sat)
    // We want each column to represent a week starting Monday (0: Mon, 6: Sun)
    const currentDayOfWeek = (todayDate.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

    // Total days to generate = weeksCount * 7
    const totalDays = weeksCount * 7;
    // Calculate start date (Monday of the earliest week)
    const startDate = new Date(todayDate);
    startDate.setDate(todayDate.getDate() - (totalDays - 1 - (6 - currentDayOfWeek)));

    // Aggregate sessions by date string
    const sessionsByDate = new Map<string, typeof sessions>();
    for (const session of relevantSessions) {
      const existing = sessionsByDate.get(session.date) || [];
      existing.push(session);
      sessionsByDate.set(session.date, existing);
    }

    const generatedWeeks: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    let totalActiveDays = 0;
    let totalMinutesPeriod = 0;

    for (let i = 0; i < totalDays; i++) {
      const dateObj = new Date(startDate);
      dateObj.setDate(startDate.getDate() + i);

      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      const isFuture = dateStr > todayStr;
      const isToday = dateStr === todayStr;

      const daySessions = sessionsByDate.get(dateStr) || [];
      const totalMinutes = daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

      if (!isFuture && totalMinutes > 0) {
        totalActiveDays++;
        totalMinutesPeriod += totalMinutes;
      }

      // Determine level: 0 (0m), 1 (1-29m), 2 (30-59m), 3 (60m+)
      let level: 0 | 1 | 2 | 3 = 0;
      if (totalMinutes >= 60) level = 3;
      else if (totalMinutes >= 30) level = 2;
      else if (totalMinutes > 0) level = 1;

      const formattedSessions = daySessions.map((s) => {
        const sk = skillsMap.get(s.skillId);
        return {
          id: s.id,
          skillId: s.skillId,
          skillName: sk?.name || 'Unknown Skill',
          skillColor: sk?.color || '#059669',
          durationMinutes: s.durationMinutes,
          notes: s.notes,
        };
      });

      const dayData: HeatmapDay = {
        date: dateStr,
        totalMinutes,
        sessionCount: daySessions.length,
        sessions: formattedSessions,
        level,
        isFuture,
        isToday,
      };

      currentWeek.push(dayData);

      if (currentWeek.length === 7) {
        generatedWeeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return {
      weeks: generatedWeeks,
      summaryStats: {
        totalActiveDays,
        totalMinutesPeriod,
        activePercentage: Math.round((totalActiveDays / (weeksCount * 7)) * 100),
      },
    };
  }, [relevantSessions, weeksCount, skillsMap]);

  // Color classes for heatmap levels
  const getCellColor = (day: HeatmapDay) => {
    if (day.isFuture) return 'bg-transparent opacity-20 border border-dashed border-[#DDDDD6] dark:border-[#333A33]';
    if (day.level === 3) return 'bg-[#059669] dark:bg-[#34D399]';
    if (day.level === 2) return 'bg-[#34D399] dark:bg-[#059669]';
    if (day.level === 1) return 'bg-[#A7F3D0] dark:bg-[#065F46]';
    return 'bg-[#EAEDE8] dark:bg-[#1E231E] hover:bg-[#DDDDD6] dark:hover:bg-[#262B26]';
  };

  return (
    <div className="bg-white dark:bg-[#1C201C] rounded-2xl border border-[#DDDDD6] dark:border-[#333A33] p-5 sm:p-6 shadow-sm transition-all duration-200">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-lg sm:text-xl text-[#1A1D1A] dark:text-[#ECF0EC]">
              Practice Activity
            </h2>
            <span className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0]">
              Last {weeksCount} weeks
            </span>
          </div>
          <p className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0] mt-0.5">
            {summaryStats.totalActiveDays} active days • {formatMinutes(summaryStats.totalMinutesPeriod)} total practice
          </p>
        </div>

        {/* Filter & View mode controls */}
        <div className="flex items-center gap-2">
          {!filteredSkillId && (
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="text-xs font-medium bg-[#F2F2EE] dark:bg-[#262B26] text-[#1A1D1A] dark:text-[#ECF0EC] border border-[#DDDDD6] dark:border-[#333A33] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              aria-label="Filter heatmap by skill"
            >
              <option value="all">All Skills</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          )}

          {/* Table / Grid view switcher for accessibility */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="p-1.5 rounded-lg text-[#5F6A5F] dark:text-[#A0AAA0] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] border border-[#DDDDD6] dark:border-[#333A33] transition-colors cursor-pointer"
            title={viewMode === 'grid' ? 'Switch to accessible table view' : 'Switch to grid view'}
            aria-label={viewMode === 'grid' ? 'Switch to accessible table view' : 'Switch to grid view'}
          >
            {viewMode === 'grid' ? <TableIcon className="w-3.5 h-3.5" /> : <GridIcon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* View Mode: Grid (Default GitHub-style Heatmap) */}
      {viewMode === 'grid' ? (
        <div className="relative overflow-x-auto no-scrollbar pb-2">
          <div className="inline-block min-w-full">
            {/* Month labels row */}
            <div className="flex text-[10px] text-[#5F6A5F] dark:text-[#A0AAA0] mb-1.5 ml-6">
              {weeks.map((week, idx) => {
                const month = new Date(`${week[0].date}T00:00:00`).toLocaleDateString('en-US', { month: 'short' });
                return (
                  <div key={idx} className="w-[14px] sm:w-[15px] mr-[3px] text-center">
                    {idx % 4 === 0 ? month : ''}
                  </div>
                );
              })}
            </div>

            {/* Heatmap Grid */}
            <div className="flex">
              {/* Day of week labels (Mon, Wed, Fri) */}
              <div className="flex flex-col justify-between text-[10px] text-[#5F6A5F] dark:text-[#A0AAA0] pr-2 py-0.5 select-none">
                <span className="h-[14px] sm:h-[15px] leading-[14px]">M</span>
                <span className="h-[14px] sm:h-[15px] leading-[14px]">W</span>
                <span className="h-[14px] sm:h-[15px] leading-[14px]">F</span>
                <span className="h-[14px] sm:h-[15px] leading-[14px]"></span>
              </div>

              {/* Columns of weeks */}
              <div className="flex gap-[3px]">
                {weeks.map((week, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-[3px]">
                    {week.map((day) => {
                      const hasPractice = day.totalMinutes > 0;
                      return (
                        <button
                          key={day.date}
                          onMouseEnter={() => setHoveredDay(day)}
                          onMouseLeave={() => setHoveredDay(null)}
                          onClick={() => hasPractice && setActiveDayModal(day)}
                          className={`w-[14px] h-[14px] sm:w-[15px] sm:h-[15px] rounded-[3px] transition-all cursor-pointer relative focus:outline-none focus:ring-1 focus:ring-emerald-500 ${getCellColor(
                            day,
                          )} ${
                            day.isToday
                              ? 'ring-2 ring-emerald-600 dark:ring-emerald-400 ring-offset-1 dark:ring-offset-[#1C201C]'
                              : ''
                          }`}
                          aria-label={`${formatFullDate(day.date)}: ${
                            hasPractice ? formatMinutes(day.totalMinutes) : 'No practice'
                          }`}
                          disabled={day.isFuture}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-between mt-4 text-[11px] text-[#5F6A5F] dark:text-[#A0AAA0]">
              <span>
                {hoveredDay ? (
                  <strong className="text-[#1A1D1A] dark:text-[#ECF0EC]">
                    {formatFullDate(hoveredDay.date)}:{' '}
                    {hoveredDay.totalMinutes > 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        {formatMinutes(hoveredDay.totalMinutes)} ({hoveredDay.sessionCount} sessions)
                      </span>
                    ) : (
                      'No practice logged'
                    )}
                  </strong>
                ) : (
                  'Hover or tap squares for session details'
                )}
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">Less</span>
                <span className="w-3 h-3 rounded-[2px] bg-[#EAEDE8] dark:bg-[#1E231E]" title="0 minutes" />
                <span className="w-3 h-3 rounded-[2px] bg-[#A7F3D0] dark:bg-[#065F46]" title="1 - 29 minutes" />
                <span className="w-3 h-3 rounded-[2px] bg-[#34D399] dark:bg-[#059669]" title="30 - 59 minutes" />
                <span className="w-3 h-3 rounded-[2px] bg-[#059669] dark:bg-[#34D399]" title="60+ minutes" />
                <span className="text-[10px]">More</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Table View */
        <div className="overflow-x-auto max-h-72 border border-[#DDDDD6] dark:border-[#333A33] rounded-xl">
          <table className="w-full text-left text-xs text-[#1A1D1A] dark:text-[#ECF0EC]">
            <thead className="bg-[#F2F2EE] dark:bg-[#262B26] text-[#4A524A] dark:text-[#A0AAA0] sticky top-0">
              <tr>
                <th className="px-4 py-2 font-semibold">Date</th>
                <th className="px-4 py-2 font-semibold">Practice Time</th>
                <th className="px-4 py-2 font-semibold">Sessions</th>
                <th className="px-4 py-2 font-semibold">Skills Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDDD6] dark:divide-[#333A33]">
              {weeks
                .flatMap((w) => w)
                .filter((d) => !d.isFuture && d.totalMinutes > 0)
                .reverse()
                .map((day) => (
                  <tr key={day.date} className="hover:bg-[#FAFAF8] dark:hover:bg-[#232823]">
                    <td className="px-4 py-2 font-medium">{formatFullDate(day.date)}</td>
                    <td className="px-4 py-2 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatMinutes(day.totalMinutes)}
                    </td>
                    <td className="px-4 py-2">{day.sessionCount}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {day.sessions.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-white"
                            style={{ backgroundColor: s.skillColor }}
                          >
                            {s.skillName} ({formatMinutes(s.durationMinutes)})
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Day Details Modal / Popover on Click */}
      {activeDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C201C] border border-[#DDDDD6] dark:border-[#333A33] rounded-2xl p-5 max-w-md w-full shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#DDDDD6] dark:border-[#262B26] pb-3 mb-3">
              <div>
                <h3 className="font-display font-bold text-base text-[#1A1D1A] dark:text-[#ECF0EC]">
                  {formatFullDate(activeDayModal.date)}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Total: {formatMinutes(activeDayModal.totalMinutes)} • {activeDayModal.sessionCount} sessions
                </p>
              </div>
              <button
                onClick={() => setActiveDayModal(null)}
                className="p-1 rounded-lg hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] text-[#5F6A5F] cursor-pointer"
                aria-label="Close day details"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {activeDayModal.sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: sess.skillColor }}
                      />
                      <span className="font-semibold text-xs text-[#1A1D1A] dark:text-[#ECF0EC]">
                        {sess.skillName}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMinutes(sess.durationMinutes)}
                    </span>
                  </div>
                  {sess.notes && (
                    <p className="text-xs text-[#4A524A] dark:text-[#A0AAA0] italic mt-1 bg-white dark:bg-[#1C201C] p-2 rounded-lg border border-[#E8E8E2] dark:border-[#262B26]">
                      "{sess.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#DDDDD6] dark:border-[#262B26] flex justify-end">
              <button
                onClick={() => setActiveDayModal(null)}
                className="px-4 py-1.5 rounded-lg bg-[#E8E8E3] dark:bg-[#262B26] text-xs font-medium text-[#1A1D1A] dark:text-[#ECF0EC] hover:bg-[#DDDDD6] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
