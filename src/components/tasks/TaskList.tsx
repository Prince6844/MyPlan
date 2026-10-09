import React from 'react';
import { CalendarX2, Plus } from 'lucide-react';
import type { Task } from '../../types';
import { TaskCard } from './TaskCard';
import { useApp } from '../../context/AppContext';

interface TaskListProps {
  tasks: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const { setActiveScreen } = useApp();

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 my-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center text-brand-500 mb-3">
          <CalendarX2 size={28} />
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No tasks for this day
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
          Stay ahead of your schedule. Tap below to create your first task.
        </p>
        <button
          onClick={() => setActiveScreen('add_task')}
          className="mt-4 flex items-center space-x-1.5 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-semibold hover:bg-brand-100 transition-colors"
        >
          <Plus size={14} />
          <span>Add Task</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1 mt-2">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};
