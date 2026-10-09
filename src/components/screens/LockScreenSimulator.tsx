import React, { useState } from 'react';
import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { TopBar } from '../common/TopBar';
import { useApp } from '../../context/AppContext';

export const LockScreenSimulator: React.FC = () => {
  const { user, tasks, activeDate, setActiveScreen } = useApp();
  const [mode, setMode] = useState<'morning' | 'night'>('morning');

  const todayTasks = tasks.filter(t => t.date === activeDate);
  const pendingTasks = todayTasks.filter(t => !t.completed);

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col justify-between overflow-hidden select-none animate-fade-in text-white">
      {/* Background Wallpaper */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ${
          mode === 'morning'
            ? 'bg-gradient-to-b from-[#6D4C61] via-[#B87071] to-[#E59866]' // Warm dawn sky
            : 'bg-gradient-to-b from-[#0B132B] via-[#1C2541] to-[#3A506B]' // Dark starry night sky
        }`}
      >
        {/* Soft mountain silhouette at bottom */}
        <div className="absolute bottom-0 w-full h-44 opacity-40">
          <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
            <path d="M0,150 L0,80 L70,40 L160,95 L260,20 L380,85 L460,50 L500,75 L500,150 Z" fill="#000000" />
            <path d="M0,150 L0,110 L90,75 L190,110 L280,60 L390,115 L500,90 L500,150 Z" fill="#080e1a" opacity="0.6" />
          </svg>
        </div>

        {/* Night Crescent Moon in night mode */}
        {mode === 'night' && (
          <div className="absolute top-14 right-10 w-9 h-9 text-slate-100/90 text-3xl animate-pulse-subtle">
            🌙
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="relative z-10">
        <TopBar light />
      </div>

      {/* Mode Switcher pill */}
      <div className="relative z-10 flex items-center justify-center pt-2">
        <div className="bg-black/35 backdrop-blur-md p-1 rounded-full border border-white/20 flex items-center space-x-1 text-xs">
          <button
            onClick={() => setMode('morning')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-bold transition-all ${
              mode === 'morning' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            <Sun size={13} className="text-amber-500" />
            <span>Screen 10: 7:00 AM</span>
          </button>
          <button
            onClick={() => setMode('night')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-bold transition-all ${
              mode === 'night' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            <Moon size={13} className="text-indigo-400" />
            <span>Screen 11: 9:30 PM</span>
          </button>
        </div>
      </div>

      {/* Lock Screen Clock & Notification */}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-8 px-5">
        {/* Large Digital Clock */}
        <div className="text-center">
          <h1 className="text-6xl sm:text-7xl font-extralight tracking-tight text-white drop-shadow-md">
            {mode === 'morning' ? '7:00' : '9:30'}
          </h1>
          <p className="text-sm font-medium text-white/90 mt-1 tracking-wide">
            Thu, 2 Oct
          </p>
        </div>

        {/* NOTIFICATION CARD MATCHING SCREENS 10 & 11 */}
        <div className="w-full max-w-sm mt-8 animate-slide-up">
          <div className="bg-white/95 text-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl border border-white/40">
            {/* Notification Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
                  ✓
                </div>
                <span className="text-xs font-bold text-slate-700 tracking-wide">
                  MyPlan
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">now</span>
            </div>

            {/* Notification Body */}
            {mode === 'morning' ? (
              /* SCREEN 10: MORNING NOTIFICATION */
              <div className="pt-2.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Good Morning, {user?.name || 'Prince'}! 👋
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-semibold">
                  Aaj ke {todayTasks.length} tasks hain:
                </p>
                <div className="mt-2 space-y-1 text-xs text-slate-700 font-medium pl-1">
                  {todayTasks.slice(0, 5).map((t, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5">
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-slate-600">{(t.time || t.task_time.substring(0, 5)).replace(':00', '').replace(' AM', '').replace(' PM', '')}:00</span>
                      <span>—</span>
                      <span className="truncate">{t.title}</span>
                    </div>
                  ))}
                  {todayTasks.length === 0 && (
                    <p className="text-slate-500 italic">No tasks planned for today.</p>
                  )}
                </div>
              </div>
            ) : (
              /* SCREEN 11: NIGHT NOTIFICATION */
              <div className="pt-2.5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1">
                  <span>Daily Review</span>
                  <span>🌙</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  You have {pendingTasks.length} {pendingTasks.length === 1 ? 'task' : 'tasks'} pending today.<br />
                  Do you want to set a reminder?
                </p>

                {pendingTasks.length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-slate-700 font-medium pl-1">
                    {pendingTasks.slice(0, 3).map((t, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5">
                        <span className="text-slate-400">•</span>
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons matching Screen 11 */}
                <div className="mt-4 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setActiveScreen('night_review')}
                    className="py-2.5 px-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all text-center"
                  >
                    Set Reminder
                  </button>
                  <button
                    onClick={() => setActiveScreen('home')}
                    className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all text-center"
                  >
                    Later
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unlock / Return to Home Bar */}
      <div className="relative z-10 pb-8 px-6 flex flex-col items-center">
        <button
          onClick={() => setActiveScreen('home')}
          className="flex items-center space-x-2 py-2.5 px-5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs tracking-wide transition-all shadow-sm"
        >
          <ChevronLeft size={16} />
          <span>Unlock & Open MyPlan</span>
        </button>
        <div className="w-32 h-1 bg-white/60 rounded-full mt-4"></div>
      </div>
    </div>
  );
};
