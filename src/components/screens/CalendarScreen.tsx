import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { addDays, formatTaskTime, getDateInTimeZone } from '../../lib/dates';
import { useCurrentTime } from '../../lib/useCurrentTime';
import type { Task } from '../../types';

type CalendarView = 'month' | 'week' | 'day';

const parseDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatLongDate = (value: string, timeZone: string, options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { ...options, timeZone }).format(new Date(Date.UTC(year, month - 1, day, 12)));
};

export const CalendarScreen: React.FC = () => {
  const { tasks, activeDate, setActiveDate, setActiveScreen, setSelectedTaskId, settings } = useApp();
  const timeZone = settings.timezone || 'Asia/Kolkata';
  const now = new Date(useCurrentTime());
  const [view, setView] = useState<CalendarView>('month');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const [year, month] = activeDate.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });
  const today = getDateInTimeZone(timeZone, now);
  const monthLabel = new Intl.DateTimeFormat('en-IN', {
    month: 'long', year: 'numeric', timeZone,
  }).format(new Date(Date.UTC(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12)));
  const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const selectedDayTasks = useMemo(
    () => tasks.filter(task => (task.task_date || task.date) === activeDate).sort((a, b) => (a.task_time || a.time || '').localeCompare(b.task_time || b.time || '')),
    [tasks, activeDate],
  );

  const shiftCalendar = (amount: number) => {
    if (view === 'month') {
      const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1);
      setVisibleMonth(next);
    } else {
      const days = view === 'week' ? amount * 7 : amount;
      const nextDate = addDays(activeDate, days);
      setActiveDate(nextDate);
      const next = parseDate(nextDate);
      setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const goToday = () => {
    setActiveDate(today);
    const current = parseDate(today);
    setVisibleMonth(new Date(current.getFullYear(), current.getMonth(), 1));
  };

  const chooseDate = (date: string) => {
    setActiveDate(date);
    const chosen = parseDate(date);
    setVisibleMonth(new Date(chosen.getFullYear(), chosen.getMonth(), 1));
  };

  const addTaskForDate = () => {
    setActiveScreen('add_task');
  };

  const openTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setActiveScreen('task_details');
  };

  const days = useMemo(() => {
    if (view === 'month') {
      const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
      const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
      return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
        return { date: formatDate(date), inCurrentMonth: date.getMonth() === visibleMonth.getMonth() };
      });
    }
    const selected = parseDate(activeDate);
    if (view === 'day') return [{ date: activeDate, inCurrentMonth: true }];
    const start = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate() - selected.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { date: formatDate(date), inCurrentMonth: date.getMonth() === visibleMonth.getMonth() };
    });
  }, [view, visibleMonth, activeDate]);

  const taskIsOverdue = (task: Task) => {
    const date = task.task_date || task.date || '';
    const time = (task.task_time || task.time || '').slice(0, 5);
    return !task.completed && (date < today || (date === today && time < currentTime));
  };
  const title = view === 'month' ? monthLabel : view === 'week'
    ? `${formatLongDate(days[0].date, timeZone, { day: 'numeric', month: 'short' })} – ${formatLongDate(days[6].date, timeZone, { day: 'numeric', month: 'short', year: 'numeric' })}`
    : formatLongDate(activeDate, timeZone);

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-slate-500">Plan by date</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Calendar</h2></div>
        <button onClick={addTaskForDate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={17} /> Add task</button>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <button onClick={() => shiftCalendar(-1)} aria-label="Previous period" className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><ChevronLeft size={17} /></button>
            <button onClick={() => shiftCalendar(1)} aria-label="Next period" className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><ChevronRight size={17} /></button>
            <h3 className="min-w-36 text-base font-semibold text-slate-900">{title}</h3>
            <button onClick={goToday} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Today</button>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="Calendar view">
            {(['month', 'week', 'day'] as const).map(option => (
              <button key={option} onClick={() => setView(option)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${view === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} aria-pressed={view === option}>{option}</button>
            ))}
          </div>
        </div>

        {view !== 'day' && (
          <div className={`grid grid-cols-7 border-b border-slate-200 ${view === 'month' ? 'px-2 sm:px-4' : ''}`}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2 text-center text-xs font-medium text-slate-500">{day}</div>)}
          </div>
        )}

        <div className={view === 'month' ? 'grid grid-cols-7 px-2 pb-2 sm:px-4' : view === 'week' ? 'grid grid-cols-7 divide-x divide-slate-100' : 'p-4'}>
          {days.map(({ date, inCurrentMonth }) => {
            const dayTasks = tasks.filter(task => (task.task_date || task.date) === date).sort((a, b) => (a.task_time || a.time || '').localeCompare(b.task_time || b.time || ''));
            const isSelected = date === activeDate;
            const isToday = date === today;
            return (
              <div key={date} className={view === 'month' ? 'min-h-[105px] border-b border-r border-slate-100 p-1 sm:min-h-[122px] sm:p-2' : 'min-h-[260px] p-1.5 sm:p-2'}>
                <button
                  onClick={() => chooseDate(date)}
                  aria-label={`Select ${formatLongDate(date, timeZone)}`}
                  className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${isSelected ? 'bg-blue-600 text-white' : isToday ? 'border border-blue-600 text-blue-700' : inCurrentMonth || view !== 'month' ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300'}`}
                >{parseDate(date).getDate()}</button>
                {view === 'month' ? (
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <button key={task.id} onClick={() => openTask(task)} className={`block w-full truncate rounded px-1.5 py-1 text-left text-[10px] sm:text-xs ${task.completed ? 'bg-emerald-50 text-emerald-700 line-through' : taskIsOverdue(task) ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                        {task.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && <p className="px-1 text-[10px] text-slate-400">+{dayTasks.length - 3} more</p>}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {dayTasks.map(task => (
                      <button key={task.id} onClick={() => openTask(task)} className={`block w-full rounded-md border px-1.5 py-1.5 text-left text-[10px] leading-tight sm:text-xs ${task.completed ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : taskIsOverdue(task) ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-blue-100 bg-blue-50 text-blue-800 hover:bg-blue-100'}`}>
                        <span className="block font-medium">{task.title}</span>
                        <span className="mt-0.5 block opacity-75">{formatTaskTime(task.task_time || task.time || '')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-medium text-slate-500">{formatLongDate(activeDate, timeZone)}</p><h3 className="mt-0.5 font-semibold text-slate-900">Tasks on this date</h3></div>
          <button onClick={addTaskForDate} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Plus size={15} /> Add for this date</button>
        </div>
        {selectedDayTasks.length ? (
          <div className="divide-y divide-slate-100">
            {selectedDayTasks.map(task => (
              <button key={task.id} onClick={() => openTask(task)} className="flex w-full items-start gap-4 py-3 text-left hover:bg-slate-50">
                <span className="w-14 shrink-0 pt-0.5 text-xs font-medium text-slate-500">{formatTaskTime(task.task_time || task.time || '')}</span>
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${task.completed ? 'bg-emerald-500' : taskIsOverdue(task) ? 'bg-rose-500' : 'bg-blue-500'}`} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{task.category}{task.description ? ` · ${task.description}` : ''}</span>
                </span>
                {task.completed && <span className="text-xs font-medium text-emerald-600">Completed</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 px-6 py-8 text-center text-sm text-slate-500">No tasks scheduled for this date.</div>
        )}
      </section>
    </section>
  );
};
