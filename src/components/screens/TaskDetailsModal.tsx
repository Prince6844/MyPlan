import React, { useState } from 'react';
import { 
  ChevronLeft, 
  BookOpen, 
  Check, 
  Calendar as CalendarIcon, 
  Clock, 
  Bell, 
  Repeat, 
  FileText,
  Trash2,
  Edit3,
  AlertTriangle
} from 'lucide-react';
import { TopBar } from '../common/TopBar';
import { useApp } from '../../context/AppContext';
import type { ReminderType, RepeatType, Task, Category } from '../../types';

export const TaskDetailsModal: React.FC = () => {
  const { 
    selectedTaskId, 
    tasks, 
    categories, 
    setActiveScreen, 
    toggleTaskCompletion, 
    deleteTask, 
    updateTask,
    testTaskReminder
  } = useApp();

  const task = tasks.find((t: Task) => t.id === selectedTaskId);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task?.title || '');
  const [editDate, setEditDate] = useState(task?.date || '');
  const [editTime, setEditTime] = useState(task?.time || '');
  const [editCategory, setEditCategory] = useState(task?.category || 'Study');
  const [editNotes, setEditNotes] = useState(task?.notes || '');
  const [editReminder, setEditReminder] = useState<ReminderType>(task?.reminder_type || '10_min');
  const [editRepeat, setEditRepeat] = useState<RepeatType>(task?.repeat_type || 'none');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!task) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900">
        <p className="text-sm text-slate-500 mb-4">Task not found</p>
        <button
          onClick={() => setActiveScreen('home')}
          className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold"
        >
          Return Home
        </button>
      </div>
    );
  }

  const categoryObj = categories.find(
    (c: Category) => c.name.toLowerCase() === task.category.toLowerCase()
  ) || { color: '#1479F5', bgColor: '#EBF3FE' };

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d} ${months[m - 1]} ${y}`;
    } catch {
      return dateStr;
    }
  };

  const getReminderLabel = (type: ReminderType) => {
    const map: Record<ReminderType, string> = {
      none: 'No reminder',
      at_time: 'At time of task',
      '5_min': '5 minutes before',
      '10_min': '10 minutes before',
      '15_min': '15 minutes before',
      '30_min': '30 minutes before',
      '1_hour': '1 hour before',
      custom: 'Custom time',
    };
    return map[type] || '10 minutes before';
  };

  const getRepeatLabel = (type: RepeatType) => {
    const map: Record<RepeatType, string> = {
      none: 'Does not repeat',
      daily: 'Daily',
      weekly: 'Weekly',
      weekdays: 'Weekdays',
      custom: 'Custom',
    };
    return map[type] || 'Does not repeat';
  };

  const handleSaveEdit = async () => {
    await updateTask(task.id, {
      title: editTitle.trim(),
      date: editDate,
      time: editTime,
      category: editCategory,
      notes: editNotes.trim(),
      reminder_type: editReminder,
      repeat_type: editRepeat,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
    setActiveScreen('home');
  };

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col justify-between bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-100 animate-slide-up select-none overflow-hidden">
      <TopBar />

      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveScreen('home')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {isEditing ? 'Edit Task' : 'Task Details'}
        </h2>
        <div className="w-10 flex justify-end">
          {!isEditing && (
            <button
              onClick={() => testTaskReminder(task.id)}
              className="text-slate-400 hover:text-brand-500 p-2"
              title="Test Reminder Notification"
            >
              <Bell size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
        {!isEditing ? (
          <>
            {/* Top Task Card matching Screen 6 */}
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700/60 flex items-start space-x-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: categoryObj.bgColor, color: categoryObj.color }}
              >
                <BookOpen size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-bold truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                  {task.title}
                </h3>
                <span
                  className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: categoryObj.bgColor, color: categoryObj.color }}
                >
                  {task.category}
                </span>
              </div>
            </div>

            {/* Mark as Completed action button */}
            <button
              onClick={() => toggleTaskCompletion(task.id)}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                task.completed
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                  : 'bg-brand-500 text-white shadow-float hover:bg-brand-600 active:scale-[0.98]'
              }`}
            >
              <Check size={18} className="stroke-[3]" />
              <span>{task.completed ? 'Completed (Tap to undo)' : 'Mark as Completed'}</span>
            </button>

            {/* Task Info Rows matching Screen 6 */}
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-2 shadow-sm border border-slate-100 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700/50">
              {/* Date */}
              <div className="flex items-center justify-between p-3 px-4">
                <div className="flex items-center space-x-3 text-slate-400">
                  <CalendarIcon size={18} />
                  <span className="text-xs font-semibold">Date</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {formatDateDisplay(task.date)}
                </span>
              </div>

              {/* Time */}
              <div className="flex items-center justify-between p-3 px-4">
                <div className="flex items-center space-x-3 text-slate-400">
                  <Clock size={18} />
                  <span className="text-xs font-semibold">Time</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {task.time}
                </span>
              </div>

              {/* Reminder */}
              <div className="flex items-center justify-between p-3 px-4">
                <div className="flex items-center space-x-3 text-slate-400">
                  <Bell size={18} />
                  <span className="text-xs font-semibold">Reminder</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {getReminderLabel(task.reminder_type)}
                </span>
              </div>

              {/* Repeat */}
              <div className="flex items-center justify-between p-3 px-4">
                <div className="flex items-center space-x-3 text-slate-400">
                  <Repeat size={18} />
                  <span className="text-xs font-semibold">Repeat</span>
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {getRepeatLabel(task.repeat_type)}
                </span>
              </div>

              {/* Notes */}
              <div className="p-3 px-4">
                <div className="flex items-center space-x-3 text-slate-400 mb-1.5">
                  <FileText size={18} />
                  <span className="text-xs font-semibold">Notes</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium pl-7 leading-relaxed">
                  {task.notes || 'No extra notes recorded for this task.'}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Edit Mode Form */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Time</label>
                <input
                  type="text"
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
                {categories.map((c: Category) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setEditCategory(c.name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      editCategory.toLowerCase() === c.name.toLowerCase() ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reminder</label>
                <select
                  value={editReminder}
                  onChange={e => setEditReminder(e.target.value as ReminderType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="none">No reminder</option>
                  <option value="at_time">At time of task</option>
                  <option value="5_min">5 min before</option>
                  <option value="10_min">10 min before</option>
                  <option value="15_min">15 min before</option>
                  <option value="30_min">30 min before</option>
                  <option value="1_hour">1 hour before</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Repeat</label>
                <select
                  value={editRepeat}
                  onChange={e => setEditRepeat(e.target.value as RepeatType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="weekdays">Weekdays</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons matching Screen 6 */}
      <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        {!isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 rounded-2xl bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 text-brand-600 dark:text-brand-400 font-bold text-xs hover:bg-brand-100 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Edit3 size={16} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center justify-center space-x-1.5 transition-all"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="w-full py-3 rounded-2xl bg-brand-500 text-white font-bold text-xs shadow-float"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-modal max-w-xs w-full text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Task?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="py-2.5 px-4 rounded-xl bg-rose-500 text-white font-semibold text-xs shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
