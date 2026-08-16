import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useModal } from '../context/ModalContext';
import { useTimer } from '../context/TimerContext';
import { HeatmapCalendar } from './HeatmapCalendar';
import { ProgressRing } from './ProgressRing';
import { formatMinutes, formatHoursDecimal, formatFullDate } from '../utils/dateUtils';
import {
  ArrowLeft,
  Flame,
  Plus,
  Play,
  Settings,
  Clock,
  Search,
  Trash2,
  Edit2,
  Share2,
} from 'lucide-react';

interface SkillDetailViewProps {
  skillId: string;
  onBack: () => void;
}

export const SkillDetailView: React.FC<SkillDetailViewProps> = ({ skillId, onBack }) => {
  const { skills, sessions, skillStatsMap, deleteSession } = useData();
  const { openLogModalWithSkill, openEditSkillModal, openEditSessionModal, openShareModal } =
    useModal();
  const { startTimer } = useTimer();

  const [searchQuery, setSearchQuery] = useState('');

  const skill = skills.find((s) => s.id === skillId);
  const stats = skillStatsMap[skillId];

  // Sessions for this skill
  const skillSessions = useMemo(() => {
    return sessions
      .filter((s) => s.skillId === skillId)
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [sessions, skillId]);

  // Filtered session list
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return skillSessions;
    const q = searchQuery.toLowerCase();
    return skillSessions.filter(
      (s) =>
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        s.date.includes(q) ||
        String(s.durationMinutes).includes(q)
    );
  }, [skillSessions, searchQuery]);

  // Weekly hours grouped by last 6 weeks
  const weeklyTrends = useMemo(() => {
    const weeks: { weekLabel: string; hours: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const startStr = weekStart.toISOString().split('T')[0];
      const endStr = weekEnd.toISOString().split('T')[0];

      const weekMins = skillSessions
        .filter((s) => s.date >= startStr && s.date <= endStr)
        .reduce((acc, s) => acc + s.durationMinutes, 0);

      const label = i === 0 ? 'This Wk' : i === 1 ? 'Last Wk' : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      weeks.push({
        weekLabel: label,
        hours: Math.round((weekMins / 60) * 10) / 10
      });
    }
    return weeks;
  }, [skillSessions]);

  const maxWeeklyHours = Math.max(...weeklyTrends.map((w) => w.hours), 1);

  if (!skill || !stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[#5F6A5F] dark:text-[#A0AAA0]">Skill not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-medium cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const averageMinutes =
    stats.totalSessions > 0 ? Math.round(stats.totalMinutes / stats.totalSessions) : 0;

  const handleShareCard = () => {
    openShareModal({
      title: `${skill.name} Practice Summary`,
      subtitle: 'Milestone Achievement',
      headlineValue: formatHoursDecimal(stats.totalMinutes),
      headlineLabel: `Total practice in ${skill.name}`,
      metric1Value: `${stats.currentStreak} Days`,
      metric1Label: 'Active Practice Streak',
      metric2Value: `${stats.totalSessions}`,
      metric2Label: 'Total Completed Sessions',
      skillName: skill.name,
      skillColor: skill.color,
      theme: 'dark'
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5F6A5F] dark:text-[#A0AAA0] hover:text-[#1A1D1A] dark:hover:text-[#ECF0EC] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleShareCard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-white dark:bg-[#1C201C] text-xs font-medium text-[#1A1D1A] dark:text-[#ECF0EC] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] transition-colors cursor-pointer"
            title="Generate Share Card"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Share Card</span>
          </button>

          <button
            onClick={() => openEditSkillModal(skill)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-white dark:bg-[#1C201C] text-xs font-medium text-[#1A1D1A] dark:text-[#ECF0EC] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] transition-colors cursor-pointer"
            title="Edit Skill Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => startTimer(skill.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Timer</span>
          </button>

          <button
            onClick={() => openLogModalWithSkill(skill.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Log Session</span>
          </button>
        </div>
      </div>

      {/* Main Hero Header Card */}
      <div className="bg-white dark:bg-[#1C201C] rounded-2xl border border-[#DDDDD6] dark:border-[#333A33] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: skill.color }}
              />
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1A1D1A] dark:text-[#ECF0EC]">
                {skill.name}
              </h1>
            </div>
            <p className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0]">
              Created on {new Date(skill.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Quick Metrics Badge Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
              <span className="text-[11px] font-medium text-[#5F6A5F] dark:text-[#A0AAA0] block">Total Time</span>
              <span className="font-display font-bold text-xl text-[#1A1D1A] dark:text-[#ECF0EC]">
                {formatHoursDecimal(stats.totalMinutes)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
              <span className="text-[11px] font-medium text-[#5F6A5F] dark:text-[#A0AAA0] block">Current Streak</span>
              <div className="flex items-center gap-1 font-display font-bold text-xl text-amber-600 dark:text-amber-400">
                <Flame className="w-5 h-5 fill-current" />
                <span>{stats.currentStreak}d</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
              <span className="text-[11px] font-medium text-[#5F6A5F] dark:text-[#A0AAA0] block">Best Streak</span>
              <span className="font-display font-bold text-xl text-[#1A1D1A] dark:text-[#ECF0EC]">
                {stats.longestStreak} days
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
              <span className="text-[11px] font-medium text-[#5F6A5F] dark:text-[#A0AAA0] block">Avg Session</span>
              <span className="font-display font-bold text-xl text-[#1A1D1A] dark:text-[#ECF0EC]">
                {formatMinutes(averageMinutes)}
              </span>
            </div>
          </div>
        </div>

        {/* Goal Card if set */}
        {skill.goal && (
          <div className="mt-6 pt-5 border-t border-[#DDDDD6] dark:border-[#262B26] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ProgressRing
                progress={stats.goalProgressPercent || 0}
                size={80}
                strokeWidth={7}
                color={skill.color}
                label=""
              />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {skill.goal.type === 'weekly' ? 'Weekly Goal Progress' : 'Total Target Goal'}
                </span>
                <p className="font-display font-bold text-lg text-[#1A1D1A] dark:text-[#ECF0EC]">
                  {skill.goal.type === 'weekly'
                    ? `${formatHoursDecimal(stats.weeklyMinutes)} / ${skill.goal.targetHours}h this week`
                    : `${formatHoursDecimal(stats.totalMinutes)} / ${skill.goal.targetHours}h total`}
                </p>
                <p className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0]">
                  {stats.goalProgressPercent && stats.goalProgressPercent >= 100
                    ? 'Goal accomplished! Excellent work.'
                    : `${Math.round(100 - (stats.goalProgressPercent || 0))}% remaining`}
                </p>
              </div>
            </div>

            {/* Weekly Hours Trend mini bar chart */}
            <div className="w-full sm:w-64">
              <span className="text-[11px] font-semibold text-[#5F6A5F] dark:text-[#A0AAA0] block mb-2">
                Recent 6 Weeks Trend (Hours)
              </span>
              <div className="flex items-end gap-2 h-14">
                {weeklyTrends.map((w, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${Math.max(12, (w.hours / maxWeeklyHours) * 100)}%`,
                        backgroundColor: w.hours > 0 ? skill.color : 'var(--border-subtle)'
                      }}
                      title={`${w.weekLabel}: ${w.hours}h`}
                    />
                    <span className="text-[9px] text-[#5F6A5F] dark:text-[#A0AAA0] truncate max-w-[36px]">
                      {w.weekLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Heatmap for this Skill */}
      <HeatmapCalendar filteredSkillId={skillId} weeksCount={18} />

      {/* Session History & Reflections */}
      <div className="bg-white dark:bg-[#1C201C] rounded-2xl border border-[#DDDDD6] dark:border-[#333A33] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#DDDDD6] dark:border-[#262B26]">
          <div>
            <h2 className="font-display font-semibold text-xl text-[#1A1D1A] dark:text-[#ECF0EC]">
              Practice Journal History
            </h2>
            <p className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0] mt-0.5">
              {skillSessions.length} total sessions logged
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6A5F] dark:text-[#A0AAA0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes or dates..."
              className="w-full text-xs rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-8 h-8 text-[#5F6A5F] dark:text-[#A0AAA0] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-[#1A1D1A] dark:text-[#ECF0EC]">
              {searchQuery ? 'No matching practice sessions found.' : 'No practice sessions logged yet.'}
            </p>
            <p className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0] mt-1">
              Start practicing and record your first session!
            </p>
            <button
              onClick={() => openLogModalWithSkill(skillId)}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Log First Session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33] hover:border-emerald-500/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-emerald-700 dark:text-emerald-400">
                        {formatMinutes(session.durationMinutes)}
                      </span>
                      <span className="text-xs text-[#5F6A5F] dark:text-[#A0AAA0]">
                        • {formatFullDate(session.date)}
                      </span>
                    </div>

                    {session.notes && (
                      <p className="text-xs text-[#4A524A] dark:text-[#ECF0EC] mt-2 leading-relaxed bg-white dark:bg-[#1C201C] p-3 rounded-lg border border-[#E8E8E2] dark:border-[#262B26]">
                        {session.notes}
                      </p>
                    )}
                  </div>

                  {/* Edit / Delete actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditSessionModal(session)}
                      className="p-1.5 rounded-lg text-[#5F6A5F] dark:text-[#A0AAA0] hover:bg-[#E8E8E3] dark:hover:bg-[#262B26] hover:text-[#1A1D1A] transition-colors cursor-pointer"
                      title="Edit Session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this practice session?')) {
                          deleteSession(session.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-[#5F6A5F] dark:text-[#A0AAA0] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
