import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  PieChart as PieIcon,
  Flame
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StatsScreen: React.FC = () => {
  const { tasks, categories, getTodayStats, getWeeklyStats } = useApp();

  const today = getTodayStats();
  const weekly = getWeeklyStats();

  // Category counts
  const categoryStats = categories.map(cat => {
    const total = tasks.filter(t => t.category.toLowerCase() === cat.name.toLowerCase()).length;
    const completed = tasks.filter(t => t.category.toLowerCase() === cat.name.toLowerCase() && t.completed).length;
    return { ...cat, total, completed };
  }).filter(c => c.total > 0);

  return (
    <section className="mx-auto max-w-5xl space-y-5 animate-fade-in text-slate-800">

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Productivity Stats
          </h1>
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200/60 dark:border-amber-800/40">
            <Flame size={14} className="fill-amber-500 text-amber-500" />
            <span>{weekly.completedThisWeek} completed this week</span>
          </div>
        </div>

        {/* Top 2x2 Metric Cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Today Card */}
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Today</span>
              <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-brand-500 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {today.completed}/{today.total}
              </span>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Tasks completed</p>
            </div>
          </div>

          {/* This Week Card */}
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">This Week</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {weekly.completedThisWeek}
              </span>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Completed</p>
            </div>
          </div>

          {/* Pending Tasks Card */}
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Pending</span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-amber-500">
                {today.pending}
              </span>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Need attention</p>
            </div>
          </div>

          {/* Completion Rate Card */}
          <div className="bg-white dark:bg-slate-800/90 p-4 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Success Rate</span>
              <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center">
                <PieIcon size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-brand-500">
                {today.percent}%
              </span>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Goal efficiency</p>
            </div>
          </div>
        </div>

        {/* Weekly Chart Container */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Activity</h3>
              <p className="text-[11px] text-slate-400 font-medium">Tasks completed per day</p>
            </div>
            <span className="text-xs font-bold text-brand-500">Last 7 Days</span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between h-32 pt-2 px-1">
            {weekly.dayCounts.map((item, idx) => {
              const maxCount = 8;
              const heightPercent = Math.min(100, Math.round((item.count / maxCount) * 100));
              const isToday = item.day === 'Thu'; // matching reference Thu 2 Oct

              return (
                <div key={idx} className="flex flex-col items-center space-y-2 flex-1">
                  <span className="text-[10px] font-bold text-slate-400">{item.count}</span>
                  <div className="w-6 sm:w-7 bg-slate-100 dark:bg-slate-700 rounded-full h-24 flex items-end p-0.5 overflow-hidden">
                    <div
                      className={`w-full rounded-full transition-all duration-500 ${
                        isToday ? 'bg-brand-500 shadow-md shadow-brand-500/30' : 'bg-brand-300 dark:bg-brand-700'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${isToday ? 'text-brand-500 font-extrabold' : 'text-slate-400'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-3xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Category Breakdown
          </h3>

          <div className="space-y-3">
            {categoryStats.map(cat => {
              const percent = Math.round((cat.completed / cat.total) * 100);
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold text-slate-700 dark:text-slate-200">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-slate-400">
                      {cat.completed}/{cat.total} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </section>
  );
};
