import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Skill } from '../types';
import { ProgressRing } from './ProgressRing';
import { HeatmapCalendar } from './HeatmapCalendar';
import { formatMinutes, formatHoursDecimal, formatRelativeDate } from '../utils/dateUtils';
import {
  Flame,
  Plus,
  Play,
  Sparkles,
  BookOpen,
  Trash2,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    user,
    skills,
    sessions,
    skillStatsMap,
    overallStats,
    openLogModalWithSkill,
    openAddSkillModal,
    deleteSession,
    setSelectedSkillId,
    startTimer,
    aiInsight,
    isLoadingAI,
    fetchAIInsights,
    reducedMotion,
    loadStarterPack,
    resetToSampleData
  } = useApp();

  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Find most practiced or featured skill
  const featuredSkill = skills.length > 0
    ? [...skills].sort((a, b) => {
        const statsA = skillStatsMap[a.id]?.totalMinutes || 0;
        const statsB = skillStatsMap[b.id]?.totalMinutes || 0;
        return statsB - statsA;
      })[0]
    : null;

  const featuredStats = featuredSkill ? skillStatsMap[featuredSkill.id] : null;

  // Secondary skills (excluding featured)
  const secondarySkills = featuredSkill
    ? skills.filter((s) => s.id !== featuredSkill.id)
    : skills;

  // Recent 5 sessions
  const recentSessions = [...sessions]
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 5);

  const skillsMap = new Map<string, Skill>(skills.map((s) => [s.id, s]));

  return (
    <div className="space-y-6 pb-16">
      {/* Top Greeting & Daily Momentum Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1A1D1A] dark:text-[#ECF0EC] tracking-tight">
            {greeting}, {user?.name || 'Learner'}
          </h1>
          <p className="text-xs sm:text-sm text-[#4A524A] dark:text-[#A0AAA0] mt-1">
            {overallStats.todaySessionsCount > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                You've practiced {overallStats.todaySessionsCount} {overallStats.todaySessionsCount === 1 ? 'session' : 'sessions'} ({formatMinutes(overallStats.todayMinutes)}) today. Keep it up!
              </span>
            ) : (
              <span>You haven't logged practice today yet. Keep your {overallStats.currentStreak}-day streak alive!</span>
            )}
          </p>
        </div>

        {/* Quick Add Skill button */}
        <button
          onClick={openAddSkillModal}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-white dark:bg-[#1C201C] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] text-xs font-semibold text-[#1A1D1A] dark:text-[#ECF0EC] transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Skill</span>
        </button>
      </div>

      {/* Bento Grid: Featured Hero Card + Secondary Skills + Heatmap */}
      {skills.length === 0 ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1C201C] rounded-2xl border border-[#DDDDD6] dark:border-[#333A33] p-8 shadow-sm text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4 border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="font-display font-bold text-2xl text-[#1A1D1A] dark:text-[#ECF0EC] mb-2">
              Welcome to Your Practice Journal
            </h2>
            <p className="text-xs sm:text-sm text-[#4A524A] dark:text-[#A0AAA0] max-w-md mx-auto mb-6 leading-relaxed">
              No skills added yet for this account. Create your own custom skills with weekly goals, or load a clean starter pack to begin logging your practice.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={openAddSkillModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Skill</span>
              </button>
              <button
                onClick={loadStarterPack}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#DDDDD6] dark:border-[#333A33] bg-[#FAFAF8] dark:bg-[#232823] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] text-xs sm:text-sm font-semibold text-[#1A1D1A] dark:text-[#ECF0EC] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Load Starter Skills (3 Clean Skills)</span>
              </button>
            </div>
            <div className="mt-4">
              <button
                onClick={resetToSampleData}
                className="text-xs text-[#7A837A] dark:text-[#A0AAA0] hover:text-[#1A1D1A] dark:hover:text-[#ECF0EC] hover:underline cursor-pointer"
              >
                Or explore with sample demo data (6 skills, 47 sessions)
              </button>
            </div>
          </div>

          {/* Activity Heatmap Grid */}
          <HeatmapCalendar weeksCount={18} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Featured Most Practiced Skill (Col span 4) */}
          {featuredSkill && featuredStats && (
            <div className="lg:col-span-4 bg-white dark:bg-[#1C201C] rounded-2xl border border-[#DDDDD6] dark:border-[#333A33] p-6 shadow-sm flex flex-col justify-between h-full group hover:border-emerald-500/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Most Practiced
                  </span>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: featuredSkill.color }}
                  />
                </div>

                <h2
                  onClick={() => setSelectedSkillId(featuredSkill.id)}
                  className="font-display font-bold text-2xl sm:text-3xl text-[#1A1D1A] dark:text-[#ECF0EC] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {featuredSkill.name}
                </h2>

                {/* Progress Ring */}
                <div className="my-6 flex justify-center">
                  {featuredSkill.goal ? (
                    <ProgressRing
                      progress={featuredStats.goalProgressPercent || 0}
                      size={140}
                      strokeWidth={12}
                      color={featuredSkill.color}
                      label="of weekly goal"
                      animate={!reducedMotion}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full border-4 border-emerald-500/20 dark:border-emerald-500/30 flex flex-col items-center justify-center text-center p-2">
                      <span className="font-display font-bold text-2xl text-emerald-600 dark:text-emerald-400">
                        {formatHoursDecimal(featuredStats.totalMinutes)}
                      </span>
                      <span className="text-[10px] text-[#7A837A]">total hours</span>
                    </div>
                  )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
                    <span className="font-display font-bold text-xl text-[#1A1D1A] dark:text-[#ECF0EC] block">
                      {formatHoursDecimal(featuredStats.totalMinutes)}
                    </span>
                    <span className="text-[11px] text-[#7A837A] dark:text-[#A0AAA0]">Total hours</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F9F9F7] dark:bg-[#232823] border border-[#DDDDD6] dark:border-[#333A33]">
                    <div className="flex items-center gap-1 font-display font-bold text-xl text-amber-600 dark:text-amber-400">
                      <Flame className="w-4 h-4 fill-current" />
                      <span>{featuredStats.currentStreak}</span>
                    </div>
                    <span className="text-[11px] text-[#7A837A] dark:text-[#A0AAA0]">Day streak</span>
                  </div>
                </div>

                {/* Last Session Meta */}
                {featuredStats.lastSessionDate && (
                  <p className="text-xs text-[#7A837A] dark:text-[#A0AAA0] mb-4">
                    Last session: {formatRelativeDate(featuredStats.lastSessionDate)} — {featuredStats.lastSessionMinutes ? formatMinutes(featuredStats.lastSessionMinutes) : ''}
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-[#DDDDD6] dark:border-[#262B26]">
                <button
                  onClick={() => startTimer(featuredSkill.id)}
                  className="flex-1 py-2 rounded-xl border border-[#DDDDD6] dark:border-[#333A33] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] text-xs font-semibold text-[#1A1D1A] dark:text-[#ECF0EC] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current text-amber-500" />
                  <span>Timer</span>
                </button>

                <button
                  onClick={() => openLogModalWithSkill(featuredSkill.id)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Session</span>
                </button>

                <button
                  onClick={() => setSelectedSkillId(featuredSkill.id)}
                  className="p-2 rounded-xl border border-[#DDDDD6] dark:border-[#333A33] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] text-[#7A837A] transition-colors cursor-pointer"
                  title="View Skill Details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Right Column: Secondary Skill Cards & Heatmap (Col span 8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Secondary Skill Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {secondarySkills.slice(0, 6).map((skill) => {
                const stats = skillStatsMap[skill.id];
                return (
                  <div
                    key={skill.id}
                    onClick={() => setSelectedSkillId(skill.id)}
                    className="bg-white dark:bg-[#1C201C] rounded-2xl border border-[#DDDDD6] dark:border-[#333A33] p-4 shadow-sm hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: skill.color }}
                          />
                          <h3 className="font-display font-semibold text-sm text-[#1A1D1A] dark:text-[#ECF0EC] truncate max-w-[120px]">
                            {skill.name}
                          </h3>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#7A837A] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="flex items-baseline justify-between mt-2">
                        <span className="font-display font-bold text-2xl text-[#1A1D1A] dark:text-[#ECF0EC]">
                          {formatHoursDecimal(stats?.totalMinutes || 0)}
                        </span>
                        {stats && stats.currentStreak > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            {stats.currentStreak}-day streak
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#7A837A]">
                            {stats?.totalSessions || 0} sessions
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Goal mini progress bar if set */}
                    {skill.goal && stats && stats.goalProgressPercent !== null && (
                      <div className="mt-3 pt-2 border-t border-[#E8E8E2] dark:border-[#262B26]">
                        <div className="flex items-center justify-between text-[10px] text-[#7A837A] mb-1">
                          <span>{skill.goal.type === 'weekly' ? 'Weekly goal' : 'Total goal'}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {stats.goalProgressPercent}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EAEDE8] dark:bg-[#262B26] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, stats.goalProgressPercent)}%`,
                              backgroundColor: skill.color
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Practice Activity Heatmap */}
            <HeatmapCalendar weeksCount={18} />
          </div>
        </div>
      )}

      {/* Bottom Row: Recent Sessions + AI Practice Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Recent Sessions List (Col span 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1C201C] rounded-2xl border border-[#DDDDD6] dark:border-[#333A33] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DDDDD6] dark:border-[#262B26]">
            <div>
              <h2 className="font-display font-semibold text-lg text-[#1A1D1A] dark:text-[#ECF0EC]">
                Recent Sessions
              </h2>
              <p className="text-xs text-[#7A837A] dark:text-[#A0AAA0]">
                Latest practice notes & reflections
              </p>
            </div>
            {featuredSkill && (
              <button
                onClick={() => setSelectedSkillId(featuredSkill.id)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                View all
              </button>
            )}
          </div>

          {recentSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7A837A]">
              No practice sessions recorded yet. Click "Log Session" to begin.
            </div>
          ) : (
            <div className="divide-y divide-[#E8E8E2] dark:divide-[#262B26]">
              {recentSessions.map((session) => {
                const sk = skillsMap.get(session.skillId);
                return (
                  <div
                    key={session.id}
                    className="py-3 flex items-start justify-between gap-3 group hover:bg-[#FAFAF8] dark:hover:bg-[#232823] px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: sk?.color || '#059669' }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => sk && setSelectedSkillId(sk.id)}
                            className="font-semibold text-xs text-[#1A1D1A] dark:text-[#ECF0EC] hover:text-emerald-600 transition-colors cursor-pointer"
                          >
                            {sk?.name || 'Skill'}
                          </button>
                        </div>
                        {session.notes && (
                          <p className="text-xs text-[#4A524A] dark:text-[#A0AAA0] mt-0.5 line-clamp-1">
                            {session.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                      <div>
                        <span className="font-display font-bold text-xs text-[#1A1D1A] dark:text-[#ECF0EC] block">
                          {formatMinutes(session.durationMinutes)}
                        </span>
                        <span className="text-[10px] text-[#7A837A] block">
                          {formatRelativeDate(session.date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            if (window.confirm('Delete session?')) {
                              deleteSession(session.id);
                            }
                          }}
                          className="p-1 rounded text-[#7A837A] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 cursor-pointer"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right / AI Practice Coach & Insights (Col span 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1C201C] rounded-2xl border border-[#DDDDD6] dark:border-[#333A33] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#DDDDD6] dark:border-[#262B26]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-display font-semibold text-lg text-[#1A1D1A] dark:text-[#ECF0EC]">
                AI Practice Coach
              </h2>
            </div>

            <button
              onClick={fetchAIInsights}
              disabled={isLoadingAI}
              className="p-1.5 rounded-lg text-[#7A837A] hover:bg-[#F2F2EE] dark:hover:bg-[#262B26] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh AI Insights"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingAI ? (
            <div className="py-8 text-center">
              <Sparkles className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#7A837A]">Analyzing your practice logs with Gemini AI...</p>
            </div>
          ) : aiInsight ? (
            <div className="space-y-3.5 text-xs">
              <p className="text-[#1A1D1A] dark:text-[#ECF0EC] leading-relaxed font-medium">
                {aiInsight.summary}
              </p>

              {aiInsight.highlights && aiInsight.highlights.length > 0 && (
                <div className="space-y-1.5 bg-[#F9F9F7] dark:bg-[#232823] p-3 rounded-xl border border-[#E8E8E2] dark:border-[#262B26]">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                    Key Momentum Highlights
                  </span>
                  {aiInsight.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[#4A524A] dark:text-[#A0AAA0]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiInsight.recommendation && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200">
                  <span className="font-semibold block mb-0.5">Coach Recommendation:</span>
                  <span className="text-[11px] leading-relaxed">{aiInsight.recommendation}</span>
                </div>
              )}

              {aiInsight.reflectionPrompt && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200">
                  <span className="font-semibold block mb-0.5">Today's Reflection Question:</span>
                  <span className="text-[11px] italic">"{aiInsight.reflectionPrompt}"</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#7A837A]">
              Click the refresh icon to generate AI practice insights.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
