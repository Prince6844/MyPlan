import React, { useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { addDays } from '../../lib/dates';

export const DateSelector: React.FC = () => {
  const { activeDate, setActiveDate } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const dates = React.useMemo(() => {
    const list: { fullDate: string; dayName: string; dayNum: number }[] = [];
    for (let i = -4; i <= 6; i++) {
      const fullDate = addDays(activeDate, i);
      const [year, month, day] = fullDate.split('-').map(Number);
      const d = new Date(Date.UTC(year, month - 1, day));
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(d);
      list.push({ fullDate, dayName, dayNum: day });
    }
    return list;
  }, [activeDate]);

  // Auto scroll active date into view
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeDate]);

  return (
    <div 
      ref={scrollRef}
      className="flex items-center space-x-3 overflow-x-auto no-scrollbar py-2 px-1 select-none scroll-smooth"
    >
      {dates.map((item) => {
        const isActive = activeDate === item.fullDate;

        return (
          <button
            key={item.fullDate}
            data-active={isActive}
            onClick={() => setActiveDate(item.fullDate)}
            className={`flex flex-col items-center justify-center min-w-[54px] py-2.5 px-2 rounded-2xl transition-all duration-200 ${
              isActive
                ? 'bg-brand-500 text-white shadow-float font-bold scale-105'
                : 'bg-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span className={`text-[11px] uppercase tracking-wide ${isActive ? 'text-white/90 font-medium' : 'text-slate-400'}`}>
              {item.dayName}
            </span>
            <span className={`text-base mt-0.5 ${isActive ? 'text-white font-extrabold' : 'text-slate-700 dark:text-slate-300 font-semibold'}`}>
              {item.dayNum}
            </span>
          </button>
        );
      })}
    </div>
  );
};
