import React, { useRef, useState } from 'react';
import { 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Repeat, 
  Bell, 
  ChevronRight,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ReminderType, RepeatType } from '../../types';
import { isValidTaskDate, normalizeTaskTime } from '../../lib/dates';

export const AddTaskModal: React.FC = () => {
  const { setActiveScreen, activeDate, categories, addTask, settings, showToast } = useApp();
  const reminderTypeByMinutes: Record<number, ReminderType> = {
    0: 'at_time',
    5: '5_min',
    10: '10_min',
    15: '15_min',
    30: '30_min',
    60: '1_hour',
  };
  const defaultReminder = reminderTypeByMinutes[settings.default_reminder_minutes] || '10_min';

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(activeDate);
  const [time, setTime] = useState('10:00 AM');
  const [repeat, setRepeat] = useState<RepeatType>('none');
  const [reminder, setReminder] = useState<ReminderType>(defaultReminder);
  const [category, setCategory] = useState(categories[0]?.name || 'Study');
  const [notes, setNotes] = useState('');
  const [customReminderAt, setCustomReminderAt] = useState('');
  const savingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dropdown modal selectors
  const [activePicker, setActivePicker] = useState<'date' | 'time' | 'repeat' | 'reminder' | null>(null);

  const repeatOptions: { label: string; value: RepeatType }[] = [
    { label: 'Does not repeat', value: 'none' },
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Weekdays', value: 'weekdays' },
    { label: 'Custom', value: 'custom' },
  ];

  const reminderOptions: { label: string; value: ReminderType }[] = [
    { label: 'At time of task', value: 'at_time' },
    { label: '5 minutes before', value: '5_min' },
    { label: '10 minutes before', value: '10_min' },
    { label: '15 minutes before', value: '15_min' },
    { label: '30 minutes before', value: '30_min' },
    { label: '1 hour before', value: '1_hour' },
    { label: 'Custom', value: 'custom' },
  ];

  const getReminderLabel = (type: ReminderType) => {
    return reminderOptions.find(r => r.value === type)?.label || '10 minutes before';
  };

  const getRepeatLabel = (type: RepeatType) => {
    return repeatOptions.find(r => r.value === type)?.label || 'Does not repeat';
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d} ${months[m - 1]} ${y}`;
    } catch {
      return dateStr;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent double-submit/double-click from creating duplicate tasks.
    if (savingRef.current) return;
    if (!title.trim()) {
      showToast('Please enter a task title.', 'error');
      return;
    }
    const normalizedTime = normalizeTaskTime(time);
    if (!isValidTaskDate(date)) {
      showToast('Choose a valid task date.', 'error');
      return;
    }
    if (!/^\d{2}:\d{2}:\d{2}$/.test(normalizedTime)) {
      showToast('Enter a valid task time.', 'error');
      return;
    }
    if (reminder === 'custom' && !customReminderAt) {
      showToast('Choose a date and time for the custom reminder.', 'error');
      return;
    }

    savingRef.current = true;
    setIsSaving(true);

    const reminderMinutesMap: Record<string, number> = {
      none: 0,
      at_time: 0,
      '5_min': 5,
      '10_min': 10,
      '15_min': 15,
      '30_min': 30,
      '1_hour': 60,
      custom: 10,
    };

    const isReminderEnabled = reminder !== 'none';
    const reminderMinutes = reminderMinutesMap[reminder] ?? 10;

    try {
      await addTask({
      title: title.trim(),
      description: description.trim(),
      task_date: date,
      task_time: time,
      date,
      time,
      completed: false,
      category,
      reminder_enabled: isReminderEnabled,
      reminder_minutes: reminderMinutes,
      reminder_type: reminder,
      custom_reminder_at: reminder === 'custom' ? new Date(customReminderAt).toISOString() : null,
      repeat_type: repeat,
        notes: notes.trim() || undefined,
      });

      setActiveScreen('home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save the task.';
      showToast(message, 'error');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="relative mx-auto max-h-[calc(100vh-110px)] max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm animate-slide-up">

      {/* Screen Header */}
      <div className="w-full flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveScreen('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Add Task
        </h2>
        <div className="w-10"></div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="space-y-4 px-5 py-4">
        {/* Task Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Task Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Python Practice"
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
            required
            autoFocus
          />
        </div>

        {reminder === 'custom' && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">Custom reminder date and time</span>
            <input
              type="datetime-local"
              value={customReminderAt}
              onChange={event => setCustomReminderAt(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              required
            />
          </label>
        )}

        {/* Description (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Description <span className="font-normal text-slate-400">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 resize-none transition-all"
          />
        </div>

        {/* Options List with icons matching Screen 4 */}
        <div className="space-y-2 pt-1">
          {/* Date Row */}
          <div
            onClick={() => setActivePicker('date')}
            className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <CalendarIcon size={18} className="text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Date</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold">
              <span>{formatDateDisplay(date)}</span>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>

          {/* Time Row */}
          <div
            onClick={() => setActivePicker('time')}
            className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Clock size={18} className="text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Time</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold">
              <span>{time}</span>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>

          {/* Repeat Row */}
          <div
            onClick={() => setActivePicker('repeat')}
            className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Repeat size={18} className="text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Repeat</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold">
              <span>{getRepeatLabel(repeat)}</span>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>

          {/* Reminder Row */}
          <div
            onClick={() => setActivePicker('reminder')}
            className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Bell size={18} className="text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reminder</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold">
              <span>{getReminderLabel(reminder)}</span>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
          </div>
        </div>

        {/* Category Pills matching Screen 4 */}
        <div className="pt-1">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Category
          </label>
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => {
              const isSelected = category.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                    isSelected
                      ? 'shadow-md scale-105 ring-2 ring-brand-500/20'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? cat.color : cat.bgColor,
                    color: isSelected ? '#ffffff' : cat.color,
                  }}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Practice NumPy and Pandas"
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Save Task Button matching Screen 4 */}
        <div className="pt-3 pb-6">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-sm shadow-float transition-all"
          >
            {isSaving ? 'Saving...' : 'Save Task'}
          </button>
        </div>
      </form>

      {/* Sub-picker Modals */}
      {activePicker && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl p-5 shadow-modal max-h-[80%] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                Select {activePicker}
              </h3>
              <button
                onClick={() => setActivePicker(null)}
                className="text-xs font-semibold text-brand-500"
              >
                Done
              </button>
            </div>

            {/* Picker Content */}
            <div className="py-3">
              {activePicker === 'date' && (
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold"
                />
              )}

              {activePicker === 'time' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '07:00 PM', '09:00 PM'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTime(t);
                          setActivePicker(null);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-colors ${
                          time === t ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="text-xs text-slate-400 font-medium block mb-1">Custom Time:</label>
                    <input
                      type="text"
                      placeholder="e.g. 03:30 PM"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
                    />
                  </div>
                </div>
              )}

              {activePicker === 'repeat' && (
                <div className="space-y-1">
                  {repeatOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setRepeat(opt.value);
                        setActivePicker(null);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors"
                    >
                      <span className={`text-xs font-medium ${repeat === opt.value ? 'text-brand-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {opt.label}
                      </span>
                      {repeat === opt.value && <Check size={16} className="text-brand-500" />}
                    </button>
                  ))}
                </div>
              )}

              {activePicker === 'reminder' && (
                <div className="space-y-1">
                  {reminderOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setReminder(opt.value);
                        setActivePicker(null);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left transition-colors"
                    >
                      <span className={`text-xs font-medium ${reminder === opt.value ? 'text-brand-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                        {opt.label}
                      </span>
                      {reminder === opt.value && <Check size={16} className="text-brand-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
