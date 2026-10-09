import React from 'react';
import { Home, Calendar, BarChart2, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ActiveScreen } from '../../types';

export const BottomNavigation: React.FC = () => {
  const { activeScreen, setActiveScreen } = useApp();

  const navItems: { id: ActiveScreen; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full glass-nav border-t border-slate-200/70 dark:border-slate-800/80 px-4 py-2 flex items-center justify-around z-30 select-none pb-5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeScreen === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveScreen(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive 
                ? 'text-brand-500 font-semibold' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Icon 
              size={22} 
              className={`transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} 
            />
            <span className="text-[11px] mt-1 tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
