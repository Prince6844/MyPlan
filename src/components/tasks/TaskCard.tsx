import React from 'react';
import { Check } from 'lucide-react';
import type { Task } from '../../types';
import { useApp } from '../../context/AppContext';

interface TaskCardProps {
  task: Task;
  onOpenDetails?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onOpenDetails }) => {
  const { toggleTaskCompletion, categories, setSelectedTaskId, setActiveScreen } = useApp();

  const categoryObj = categories.find(
    c => c.name.toLowerCase() === task.category.toLowerCase()
  ) || { color: '#64748B', bgColor: '#F1F5F9' };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent if clicked on checkbox directly
    if ((e.target as HTMLElement).closest('.task-checkbox-btn')) {
      return;
    }
    if (onOpenDetails) {
      onOpenDetails(task.id);
    } else {
      setSelectedTaskId(task.id);
      setActiveScreen('task_details');
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTaskCompletion(task.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group w-full flex items-center justify-between p-3.5 px-4 mb-2.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow transition-all duration-200 cursor-pointer ${
        task.completed ? 'opacity-85 bg-slate-50/70 dark:bg-slate-800/40' : ''
      }`}
    >
      <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-2">
        {/* Checkbox button */}
        <button
          type="button"
          onClick={handleCheckboxClick}
          className={`task-checkbox-btn w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 flex-shrink-0 ${
            task.completed
              ? 'bg-brand-500 text-white shadow-sm ring-2 ring-brand-500/20'
              : 'border-2 border-slate-300 dark:border-slate-600 hover:border-brand-500 dark:hover:border-brand-400 bg-white dark:bg-slate-700'
          }`}
          aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
        >
          {task.completed && <Check size={14} className="stroke-[3]" />}
        </button>

        {/* Task Title & Category Indicator */}
        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: categoryObj.color }}
            title={`Category: ${task.category}`}
          />
          <span
            className={`text-sm truncate font-medium transition-all ${
              task.completed
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {task.title}
          </span>
        </div>
      </div>

      {/* Task Time */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">
          {task.time}
        </span>
      </div>
    </div>
  );
};
