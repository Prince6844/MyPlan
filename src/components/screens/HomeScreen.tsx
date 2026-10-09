import React, { useState } from 'react';
import { Plus, Bell, Moon, Sun, Smartphone } from 'lucide-react';
import { TopBar } from '../common/TopBar';
import { DateSelector } from '../tasks/DateSelector';
import { TaskList } from '../tasks/TaskList';
import { BottomNavigation } from '../layout/BottomNavigation';
import { useApp } from '../../context/AppContext';
import { AuthModal } from './AuthModal';

export const HomeScreen: React.FC = () => {
  const { 
    user, 
    activeDate, 
    tasks, 
    setActiveScreen, 
    testMorningNotification, 
    testNightNotification 
  } = useApp();

  const [showAuthModal, setShowAuthModal] = useState(false);

  // Format date display
  const formatDateTitle = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Filter tasks for active date
  const dateTasks = tasks.filter(t => t.date === activeDate);
  const completedCount = dateTasks.filter(t => t.completed).length;
  const totalCount = dateTasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col justify-between bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-100 animate-fade-in overflow-hidden">
      {/* Top Status Bar */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-4 no-scrollbar">
        {/* User Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center">
              Good Morning, {user?.name || 'Prince'} <span className="ml-1.5 inline-block">👋</span>
            </h1>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
              {formatDateTitle(activeDate)}
            </p>
          </div>

          {/* User Avatar with Profile/Sync trigger */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-brand-500/20 shadow-sm hover:scale-105 active:scale-95 transition-transform"
            title="Profile & Sync Settings"
          >
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-full h-full object-cover"
            />
            {/* Online indicator */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </button>
        </div>

        {/* Quick Simulation Bar (Convenient testing for Morning/Night triggers) */}
        <div className="flex items-center justify-between bg-blue-50/70 dark:bg-slate-800/60 p-2 px-3 rounded-xl border border-blue-100/80 dark:border-slate-700/60 text-[11px]">
          <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center space-x-1">
            <Bell size={12} />
            <span>Test Alerts:</span>
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={testMorningNotification}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-brand-500 font-medium shadow-2xs flex items-center space-x-1"
              title="Test 7:00 AM Morning Summary"
            >
              <Sun size={11} className="text-amber-500" />
              <span>7 AM</span>
            </button>
            <button
              onClick={testNightNotification}
              className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-brand-500 font-medium shadow-2xs flex items-center space-x-1"
              title="Test 9:30 PM Night Review"
            >
              <Moon size={11} className="text-indigo-400" />
              <span>9:30 PM</span>
            </button>
            <button
              onClick={() => setActiveScreen('simulator')}
              className="px-2 py-1 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 shadow-2xs flex items-center space-x-1"
              title="Lock Screen Simulator (Screens 10 & 11)"
            >
              <Smartphone size={11} />
              <span>Lock Screen</span>
            </button>
          </div>
        </div>

        {/* Horizontal Date Picker */}
        <div className="pt-1">
          <DateSelector />
        </div>

        {/* Today's Tasks Section Header */}
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Today's Tasks
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {totalCount} {totalCount === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {/* Progress indicator */}
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {completedCount}/{totalCount}
              </span>
              <div className="w-16 sm:w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="mt-3">
            <TaskList tasks={dateTasks} />
          </div>
        </div>

        {/* + Add Task Button matching Screen 3 */}
        <div className="pt-2 pb-1">
          <button
            onClick={() => setActiveScreen('add_task')}
            className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-sm shadow-float flex items-center justify-center space-x-2 transition-all"
          >
            <Plus size={18} className="stroke-[2.5]" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Auth & Supabase config modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};
