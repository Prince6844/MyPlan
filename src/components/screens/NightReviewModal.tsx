import React, { useState } from 'react';
import { X, Check, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NightReviewModal: React.FC = () => {
  const { tasks, activeDate, reschedulePendingTasks, setActiveScreen } = useApp();

  const pendingTasks = tasks.filter(t => t.date === activeDate && !t.completed);

  // Selected tasks to reschedule (default all selected)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => pendingTasks.map(t => t.id));
  const [scheduleType, setScheduleType] = useState<'30_min' | '1_hour' | 'tomorrow' | 'custom'>('tomorrow');
  const [customTime, setCustomTime] = useState('10:00 PM');

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApply = async () => {
    if (selectedIds.length === 0) {
      setActiveScreen('home');
      return;
    }
    await reschedulePendingTasks(selectedIds, scheduleType, customTime);
    setActiveScreen('home');
  };

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col justify-end bg-black/60 backdrop-blur-md text-white select-none animate-fade-in p-3 sm:p-4">
      {/* Night Review Card matching Screen 9 */}
      <div className="w-full bg-[#0D1527] border border-slate-700/60 rounded-3xl p-6 shadow-2xl relative animate-slide-up">
        {/* Close Button top right */}
        <button
          onClick={() => setActiveScreen('home')}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Center Header */}
        <div className="flex flex-col items-center text-center mt-2">
          {/* Crescent Moon */}
          <div className="w-14 h-14 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-300 text-3xl mb-3">
            🌙
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-white">
            Daily Review
          </h2>

          <p className="text-xs text-slate-300 max-w-[260px] mt-1.5 leading-relaxed">
            {pendingTasks.length > 0 
              ? `You have ${pendingTasks.length} ${pendingTasks.length === 1 ? 'task' : 'tasks'} pending today. Do you want to set a reminder?`
              : "Great job! All today's tasks are completed."}
          </p>
        </div>

        {/* Pending Tasks Checkbox List */}
        {pendingTasks.length > 0 ? (
          <div className="mt-5 space-y-2 max-h-40 overflow-y-auto no-scrollbar">
            {pendingTasks.map((task) => {
              const isChecked = selectedIds.includes(task.id);
              return (
                <div
                  key={task.id}
                  onClick={() => toggleSelect(task.id)}
                  className={`w-full flex items-center justify-between p-3.5 px-4 rounded-2xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-slate-800/90 border-brand-500/50 text-white'
                      : 'bg-slate-800/40 border-slate-700/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate pr-2">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-brand-500 text-white' : 'border border-slate-500'
                      }`}
                    >
                      {isChecked && <Check size={14} className="stroke-[3]" />}
                    </div>
                    <span className="text-xs font-semibold truncate">{task.title}</span>
                  </div>

                  <span className="text-[11px] font-medium text-slate-400 flex-shrink-0">
                    {task.time}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="my-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
            <p className="text-xs text-emerald-300 font-semibold">
              🎉 No pending tasks! You are all caught up for today.
            </p>
          </div>
        )}

        {/* Quick action grid matching Screen 9 */}
        {pendingTasks.length > 0 && (
          <div className="mt-5 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleType('30_min')}
                className={`py-3 px-2 rounded-2xl text-xs font-semibold border transition-all ${
                  scheduleType === '30_min'
                    ? 'bg-white text-slate-900 border-white font-bold'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-750'
                }`}
              >
                30 minutes later
              </button>

              <button
                type="button"
                onClick={() => setScheduleType('1_hour')}
                className={`py-3 px-2 rounded-2xl text-xs font-semibold border transition-all ${
                  scheduleType === '1_hour'
                    ? 'bg-white text-slate-900 border-white font-bold'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-750'
                }`}
              >
                1 hour later
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleType('tomorrow')}
                className={`py-3 px-2 rounded-2xl text-xs font-semibold border transition-all ${
                  scheduleType === 'tomorrow'
                    ? 'bg-white text-slate-900 border-white font-bold'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-750'
                }`}
              >
                Tomorrow
              </button>

              <button
                type="button"
                onClick={() => setScheduleType('custom')}
                className={`py-3 px-2 rounded-2xl text-xs font-semibold border transition-all ${
                  scheduleType === 'custom'
                    ? 'bg-white text-slate-900 border-white font-bold'
                    : 'bg-slate-800/70 text-slate-300 border-slate-700/60 hover:bg-slate-750'
                }`}
              >
                Custom Time
              </button>
            </div>

            {/* If custom time selected */}
            {scheduleType === 'custom' && (
              <div className="pt-1 flex items-center space-x-2">
                <Clock size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  placeholder="e.g. 10:30 PM"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-xs text-white"
                />
              </div>
            )}
          </div>
        )}

        {/* Set Reminder Button matching Screen 9 */}
        <div className="mt-5">
          <button
            onClick={handleApply}
            className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-sm shadow-float transition-all"
          >
            {pendingTasks.length > 0 ? 'Set Reminder' : 'Close Review'}
          </button>
        </div>
      </div>
    </div>
  );
};
