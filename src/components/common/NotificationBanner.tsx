import React from 'react';
import { X, Bell, Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationBanner: React.FC = () => {
  const { currentNotification, dismissNotification, setActiveScreen, toggleTaskCompletion, setSelectedTaskId } = useApp();

  if (!currentNotification) return null;

  const handleAction = (actionStr: string) => {
    if (actionStr === 'open_night_review') {
      setActiveScreen('night_review');
    } else if (actionStr === 'view_today') {
      setActiveScreen('home');
    } else if (actionStr.startsWith('mark_task_done_')) {
      const id = actionStr.replace('mark_task_done_', '');
      toggleTaskCompletion(id);
    } else if (actionStr.startsWith('open_task_')) {
      const id = actionStr.replace('open_task_', '');
      setSelectedTaskId(id);
      setActiveScreen('task_details');
    }
    dismissNotification();
  };

  const getIcon = () => {
    if (currentNotification.type === 'night') {
      return <Moon size={16} className="text-amber-400" />;
    }
    if (currentNotification.type === 'morning') {
      return <Sun size={16} className="text-amber-400" />;
    }
    return <Bell size={16} className="text-brand-500" />;
  };

  return (
    <div className="fixed top-3 left-4 right-4 sm:max-w-md sm:mx-auto z-50 animate-slide-up">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 shadow-modal rounded-2xl p-4 text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-[10px] shadow-sm">
              ✓
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              MyPlan
            </span>
            <span className="text-[11px] text-slate-400">now</span>
          </div>

          <button 
            onClick={dismissNotification}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-1">
          <div className="flex items-center space-x-1.5">
            {getIcon()}
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {currentNotification.title}
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line leading-relaxed">
            {currentNotification.body}
          </p>
        </div>

        {/* Action buttons */}
        {currentNotification.actions && currentNotification.actions.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-end space-x-2">
            {currentNotification.actions.map((act, i) => (
              <button
                key={i}
                onClick={() => handleAction(act.action)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all ${
                  act.primary
                    ? 'bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:scale-95'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
