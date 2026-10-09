import React, { useState } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Layers, 
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ActiveScreen } from '../../types';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const { 
    activeScreen, 
    setActiveScreen, 
    settings, 
    updateSettings,
    testMorningNotification,
    testNightNotification
  } = useApp();

  const [isFullWidth, setIsFullWidth] = useState(false);

  const screens: { id: ActiveScreen; label: string; number: string }[] = [
    { id: 'splash', label: '1. Splash Screen', number: '1' },
    { id: 'onboarding', label: '2. Onboarding', number: '2' },
    { id: 'home', label: '3. Home Screen', number: '3' },
    { id: 'add_task', label: '4. Add Task', number: '4' },
    { id: 'calendar', label: '5. Calendar View', number: '5' },
    { id: 'task_details', label: '6. Task Details', number: '6' },
    { id: 'settings', label: '7. Settings', number: '7' },
    { id: 'categories', label: '8. Categories', number: '8' },
    { id: 'night_review', label: '9. Night Review', number: '9' },
    { id: 'simulator', label: '10 & 11. Lock Screen', number: '10/11' },
    { id: 'stats', label: 'Stats Screen', number: '📊' },
  ];

  const resetAllData = () => {
    if (confirm('Reset to default tasks and reference state?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-6 lg:p-8">
      {/* Top Application Header & Screen Navigation Bar */}
      <header className="w-full max-w-5xl mb-5 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-800/80 backdrop-blur-md p-3.5 px-5 rounded-2xl border border-slate-700/70 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-sm shadow-md">
            ✓
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-base tracking-tight text-white">
                MyPlan
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                Production App
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Plan Today. Build a Better Tomorrow.
            </p>
          </div>
        </div>

        {/* Screen Switcher */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700/60">
            <Layers size={14} className="text-brand-400 ml-2" />
            <select
              value={activeScreen}
              onChange={(e) => setActiveScreen(e.target.value as ActiveScreen)}
              className="bg-transparent text-xs font-semibold text-slate-200 py-1 px-2 pr-6 outline-none cursor-pointer"
            >
              {screens.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-800 text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Notification triggers */}
          <button
            onClick={testMorningNotification}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
            title="Trigger 7:00 AM Morning Summary"
          >
            <Sun size={13} />
            <span className="hidden sm:inline">Morning Alert</span>
          </button>

          <button
            onClick={testNightNotification}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors"
            title="Trigger 9:30 PM Night Review"
          >
            <Moon size={13} />
            <span className="hidden sm:inline">Night Review</span>
          </button>

          {/* Frame & Theme Controls */}
          <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
            <button
              onClick={() => updateSettings({ dark_mode: !settings.dark_mode })}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title={settings.dark_mode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {settings.dark_mode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => updateSettings({ sound_enabled: !settings.sound_enabled })}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title={settings.sound_enabled ? 'Mute Sounds' : 'Enable Sounds'}
            >
              {settings.sound_enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              onClick={() => setIsFullWidth(!isFullWidth)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title={isFullWidth ? 'Switch to Mobile Frame' : 'Expand Responsive Full Width'}
            >
              {isFullWidth ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={resetAllData}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
              title="Reset Sample Data to Reference Mockup"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <main className="w-full flex justify-center items-center pb-8">
        <div
          className={`transition-all duration-300 ${
            isFullWidth
              ? 'w-full max-w-4xl h-[840px] rounded-3xl shadow-2xl overflow-hidden border border-slate-700 bg-white dark:bg-slate-900'
              : 'w-full max-w-[392px] h-[780px] sm:h-[812px] rounded-[48px] shadow-[0_25px_60px_rgba(0,0,0,0.6)] ring-[10px] ring-slate-800 border-[3px] border-slate-700/60 overflow-hidden bg-white dark:bg-slate-900 relative'
          }`}
        >
          {children}
        </div>
      </main>
    </div>
  );
};
