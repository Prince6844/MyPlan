import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface TopBarProps {
  light?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ light = false }) => {
  const [timeStr, setTimeStr] = useState('9:41');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`w-full flex items-center justify-between px-6 pt-3 pb-1 select-none text-xs font-semibold ${
      light ? 'text-white' : 'text-slate-900 dark:text-white'
    }`}>
      {/* Time */}
      <span className="tracking-tight font-medium text-[13px]">{timeStr}</span>

      {/* Dynamic island / speaker subtle notch */}
      <div className="w-20 h-4 bg-black/10 dark:bg-white/10 rounded-full mx-auto -mt-1 hidden sm:block"></div>

      {/* Status icons */}
      <div className="flex items-center space-x-1.5 opacity-90">
        <Signal size={13} className="stroke-[2.2]" />
        <Wifi size={13} className="stroke-[2.2]" />
        <BatteryMedium size={15} className="stroke-[2.2]" />
      </div>
    </div>
  );
};
