import React, { useState } from 'react';
import {
  Bell, CalendarDays, CheckCircle2, ChevronDown, FolderKanban, LayoutDashboard,
  ListTodo, Menu, Plus, Settings, TrendingUp, X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDateInTimeZone } from '../../lib/dates';
import { useCurrentTime } from '../../lib/useCurrentTime';
import type { ActiveScreen } from '../../types';

interface MobileFrameProps {
  children: React.ReactNode;
}

const navigation: { id: ActiveScreen; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'tasks', label: 'My Tasks', icon: ListTodo },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  { id: 'categories', label: 'Categories', icon: FolderKanban },
  { id: 'stats', label: 'Insights', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const { activeScreen, setActiveScreen, setActiveDate, user, settings, isSupabaseLive, isSyncing } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const now = new Date(useCurrentTime());
  const activeItem = navigation.find(item => item.id === activeScreen);

  const navigate = (screen: ActiveScreen) => {
    setActiveScreen(screen);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-800">
      {menuOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[72px] items-center justify-between border-b border-slate-100 px-6">
          <button className="flex items-center gap-3 text-left" onClick={() => navigate('home')}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">✓</span>
            <span>
              <span className="block text-[17px] font-bold tracking-tight text-slate-900">MyPlan</span>
              <span className="block text-[11px] text-slate-500">Plan with intention</span>
            </span>
          </button>
          <button className="rounded-lg p-1 text-slate-400 md:hidden" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={19} /></button>
        </div>
        <div className="px-4 pt-6">
          <button
            onClick={() => navigate('add_task')}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} /> Add task
          </button>
        </div>
        <nav aria-label="Main navigation" className="mt-7 flex-1 space-y-1 px-3">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
          {navigation.map(item => {
            const Icon = item.icon;
            const selected = activeScreen === item.id ||
              (item.id === 'tasks' && activeScreen === 'edit_task') ||
              (item.id === 'home' && ['add_task', 'task_details'].includes(activeScreen));
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${selected ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                aria-current={selected ? 'page' : undefined}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
              {(user?.name || 'G').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user?.name || 'Guest workspace'}</p>
              <p className="truncate text-xs text-slate-500">{isSyncing ? 'Syncing…' : user && isSupabaseLive ? 'Synced account' : user ? 'Demo workspace' : 'Local, not synced'}</p>
            </div>
            <ChevronDown size={15} className="text-slate-400" />
          </div>
        </div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <div className="hidden text-sm text-slate-400 sm:block">Workspace <span className="mx-2">/</span></div>
            <h1 className="text-sm font-semibold text-slate-800">{activeItem?.label || (activeScreen === 'add_task' ? 'New task' : activeScreen === 'task_details' ? 'Task details' : 'MyPlan')}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-xs text-slate-500 lg:inline">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'full', timeZone: settings.timezone || 'Asia/Kolkata' }).format(now)}</span>
            <button
              onClick={() => navigate('settings')}
              className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Open notification settings"
              title="Notification settings"
            ><Bell size={18} /></button>
            <button onClick={() => { setActiveDate(getDateInTimeZone(settings.timezone || 'Asia/Kolkata', now)); navigate('add_task'); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 sm:px-4 sm:text-sm">
              <Plus size={16} /><span className="hidden sm:inline">New task</span>
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
};
