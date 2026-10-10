import React, { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Plus, Settings2, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDateInTimeZone } from '../../lib/dates';
import { useCurrentTime } from '../../lib/useCurrentTime';
import type { Task } from '../../types';
import { TaskCard } from '../tasks/TaskCard';
import { AuthModal } from './AuthModal';

type HomeView = 'dashboard' | 'tasks' | 'completed';

interface HomeScreenProps {
  view?: HomeView;
}

const compareTaskTime = (first: Task, second: Task) =>
  (first.task_date || first.date || '').localeCompare(second.task_date || second.date || '') ||
  (first.task_time || first.time || '').localeCompare(second.task_time || second.time || '');

export const HomeScreen: React.FC<HomeScreenProps> = ({ view = 'dashboard' }) => {
  const { user, tasks, settings, setActiveScreen, setActiveDate, isSyncing, isSupabaseLive } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const now = useCurrentTime();
  const nowDate = new Date(now);
  const today = getDateInTimeZone(settings.timezone || 'Asia/Kolkata', nowDate);
  const timeNow = new Intl.DateTimeFormat('en-GB', {
    timeZone: settings.timezone || 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(nowDate);
  const ordered = useMemo(() => [...tasks].sort(compareTaskTime), [tasks]);
  const todayTasks = ordered.filter(task => (task.task_date || task.date) === today);
  const upcomingTasks = ordered.filter(task => !task.completed && (
    (task.task_date || task.date || '') > today ||
    ((task.task_date || task.date) === today && (task.task_time || task.time || '').slice(0, 5) >= timeNow)
  )).slice(0, 5);
  const overdueTasks = ordered.filter(task => !task.completed && (
    (task.task_date || task.date || '') < today ||
    ((task.task_date || task.date) === today && (task.task_time || task.time || '').slice(0, 5) < timeNow)
  ));
  const completedTasks = ordered.filter(task => task.completed);
  const pendingTasks = ordered.filter(task => !task.completed);
  const title = view === 'tasks' ? 'My Tasks' : view === 'completed' ? 'Completed tasks' : 'Good day';
  const subtitle = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: settings.timezone || 'Asia/Kolkata',
  }).format(nowDate);

  const openAddTask = () => {
    setActiveDate(today);
    setActiveScreen('add_task');
  };

  if (view !== 'dashboard') {
    const list = view === 'completed' ? completedTasks : pendingTasks;
    return (
      <section className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{view === 'completed' ? 'Your accomplishments' : 'All your open work'}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
          </div>
          <button onClick={openAddTask} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={17} /> Add task</button>
        </header>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{list.length} {view === 'completed' ? 'completed' : 'open'} {list.length === 1 ? 'task' : 'tasks'}</h3>
            {isSyncing && <span className="text-xs text-slate-500">Syncing with your account…</span>}
          </div>
          {list.length ? <div className="space-y-2">{list.map(task => <TaskCard key={task.id} task={task} />)}</div> : (
            <div className="rounded-lg border border-dashed border-slate-200 px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto mb-3 text-slate-300" size={28} />
              <p className="font-medium text-slate-700">{view === 'completed' ? 'Nothing completed yet' : 'You’re all caught up'}</p>
              <p className="mt-1 text-sm text-slate-500">{view === 'completed' ? 'Completed tasks will appear here.' : 'Create a task to start planning your work.'}</p>
              {view === 'tasks' && <button onClick={openAddTask} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">Create a task</button>}
            </div>
          )}
        </div>
      </section>
    );
  }

  const summaries = [
    { label: "Today's tasks", value: todayTasks.length, detail: `${todayTasks.filter(task => task.completed).length} completed`, icon: CalendarDays, screen: 'calendar' as const, color: 'blue' },
    { label: 'Upcoming', value: upcomingTasks.length, detail: 'Scheduled ahead', icon: Clock3, screen: 'tasks' as const, color: 'violet' },
    { label: 'Overdue', value: overdueTasks.length, detail: 'Need your attention', icon: TrendingUp, screen: 'tasks' as const, color: 'rose' },
    { label: 'Completed', value: completedTasks.length, detail: 'Tasks finished', icon: CheckCircle2, screen: 'completed' as const, color: 'emerald' },
  ];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{subtitle}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h2>
          <p className="mt-1 text-sm text-slate-500">Here’s what’s on your schedule today.</p>
        </div>
        <div className="flex items-center gap-2">
          {!user && <button onClick={() => setShowAuthModal(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Sign in / sync</button>}
          <button onClick={() => setActiveScreen('settings')} className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50" aria-label="Open settings"><Settings2 size={17} /></button>
          <button onClick={openAddTask} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={17} /> New task</button>
        </div>
      </header>

      {!user && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {isSupabaseLive
            ? 'You’re viewing a local workspace. Sign in to sync tasks securely to your Supabase account.'
            : 'Demo workspace — sample tasks are stored locally and are not mixed with signed-in Supabase data.'}
        </div>
      )}
      {isSyncing && <div role="status" className="text-sm text-slate-500">Syncing your tasks…</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaries.map(({ label, value, detail, icon: Icon, screen, color }) => (
          <button key={label} onClick={() => setActiveScreen(screen)} className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-200 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{label}</span>
              <span className={`rounded-lg p-2 ${color === 'blue' ? 'bg-blue-50 text-blue-600' : color === 'violet' ? 'bg-violet-50 text-violet-600' : color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}><Icon size={17} /></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2"><span className="text-2xl font-bold text-slate-900">{value}</span><span className="text-xs text-slate-500">{detail}</span></div>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div><h3 className="font-semibold text-slate-900">Today’s schedule</h3><p className="mt-0.5 text-xs text-slate-500">{todayTasks.length} tasks planned</p></div>
            <button onClick={() => setActiveScreen('calendar')} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">Open calendar <ArrowRight size={15} /></button>
          </div>
          {todayTasks.length ? <div className="space-y-2">{todayTasks.map(task => <TaskCard key={task.id} task={task} />)}</div> : (
            <div className="rounded-lg border border-dashed border-slate-200 px-5 py-10 text-center">
              <CalendarDays className="mx-auto mb-3 text-slate-300" size={26} />
              <p className="font-medium text-slate-700">Nothing planned for today</p>
              <p className="mt-1 text-sm text-slate-500">Add a task to make a little progress.</p>
              <button onClick={openAddTask} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600"><Plus size={15} /> Add a task</button>
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div><h3 className="font-semibold text-slate-900">Upcoming</h3><p className="mt-0.5 text-xs text-slate-500">Coming up next</p></div>
              <button onClick={() => setActiveScreen('tasks')} className="text-xs font-medium text-blue-600 hover:text-blue-700">See all</button>
            </div>
            {upcomingTasks.length ? <div className="space-y-2">{upcomingTasks.map(task => <TaskCard key={task.id} task={task} />)}</div> : <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">No upcoming reminders. Your schedule is clear.</p>}
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <div><h3 className="font-semibold text-slate-900">Overdue</h3><p className="mt-0.5 text-xs text-slate-500">Unfinished tasks past their time</p></div>
              <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600">{overdueTasks.length}</span>
            </div>
            {overdueTasks.length ? <div className="space-y-2">{overdueTasks.slice(0, 4).map(task => <TaskCard key={task.id} task={task} />)}</div> : <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">You’re all caught up. Nice work.</p>}
          </section>
        </div>
      </div>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </section>
  );
};
