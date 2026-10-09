import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TopBar } from '../common/TopBar';
import { BottomNavigation } from '../layout/BottomNavigation';
import { TaskList } from '../tasks/TaskList';
import { useApp } from '../../context/AppContext';

export const CalendarScreen: React.FC = () => {
  const { tasks, activeDate, setActiveDate } = useApp();

  // Month navigation based on October 2026 reference
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed, 9 = October

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Build calendar matrix
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarDays.push({
      day: d,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete 35 or 42 cells
  const remaining = 35 - calendarDays.length > 0 ? 35 - calendarDays.length : 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarDays.push({
      day: d,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  // Format selected date display header
  const formatDateDisplay = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dayNames[d.getDay()]}, ${d.getDate()} ${mNames[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const tasksForSelectedDate = tasks.filter(t => t.date === activeDate);

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col justify-between bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-100 animate-fade-in overflow-hidden select-none">
      <TopBar />

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-4 no-scrollbar">
        {/* Header */}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
          Calendar
        </h1>

        {/* Month Selector matching Screen 5 */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-sm font-bold text-slate-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </span>

          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid Container */}
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/60">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d} className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Month Days */}
          <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center">
            {calendarDays.map((item, idx) => {
              const isSelected = item.dateStr === activeDate;
              const hasTasks = tasks.some(t => t.date === item.dateStr);

              return (
                <button
                  key={idx}
                  onClick={() => setActiveDate(item.dateStr)}
                  className={`relative flex flex-col items-center justify-center h-10 w-full rounded-2xl text-xs transition-all ${
                    isSelected
                      ? 'bg-brand-500 text-white font-extrabold shadow-float scale-105 z-10'
                      : item.isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold'
                      : 'text-slate-300 dark:text-slate-600 font-normal'
                  }`}
                >
                  <span>{item.day}</span>
                  {/* Task indicator dot */}
                  {hasTasks && (
                    <span
                      className={`w-1 h-1 rounded-full mt-0.5 ${
                        isSelected ? 'bg-white' : 'bg-brand-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {formatDateDisplay(activeDate)}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {tasksForSelectedDate.length} {tasksForSelectedDate.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          <TaskList tasks={tasksForSelectedDate} />
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};
