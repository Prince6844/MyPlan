import type { Category, Task, UserSettings } from '../types';
import { addDays, getDateInTimeZone } from './dates';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'study', name: 'Study', color: '#1479F5', bgColor: '#EBF3FE', isDefault: true },
  { id: 'college', name: 'College', color: '#10B981', bgColor: '#ECFDF5', isDefault: true },
  { id: 'work', name: 'Work', color: '#F97316', bgColor: '#FFF7ED', isDefault: true },
  { id: 'personal', name: 'Personal', color: '#8B5CF6', bgColor: '#F5F3FF', isDefault: true },
  { id: 'health', name: 'Health', color: '#EC4899', bgColor: '#FDF2F8', isDefault: true },
  { id: 'other', name: 'Other', color: '#64748B', bgColor: '#F1F5F9', isDefault: true },
];

export const INITIAL_SETTINGS: UserSettings = {
  user_id: '',
  morning_summary_time: '07:00',
  morning_summary_enabled: true,
  night_review_time: '21:30',
  night_review_enabled: true,
  default_reminder_minutes: 10,
  notifications_enabled: false,
  timezone: 'Asia/Kolkata',
  sound_enabled: true,
  dark_mode: false,
  language: 'English',
};

// These sample records are only used in offline guest mode, never for Supabase users.
const demoDate = getDateInTimeZone();
const createdAt = new Date().toISOString();

export const INITIAL_TASKS: Task[] = [
  {
    id: 'demo-task-1', user_id: 'guest-usr', title: 'Plan the week',
    description: 'Review priorities and choose the most important next step.',
    task_date: demoDate, task_time: '09:00:00', date: demoDate, time: '09:00',
    completed: false, category: 'Personal', reminder_enabled: true, reminder_minutes: 10,
    reminder_type: '10_min', repeat_type: 'none', notes: '',
    created_at: createdAt, updated_at: createdAt,
  },
  {
    id: 'demo-task-2', user_id: 'guest-usr', title: 'Focused work session',
    description: 'Make progress on the task that matters most.',
    task_date: demoDate, task_time: '11:00:00', date: demoDate, time: '11:00',
    completed: false, category: 'Work', reminder_enabled: true, reminder_minutes: 10,
    reminder_type: '10_min', repeat_type: 'none', notes: '',
    created_at: createdAt, updated_at: createdAt,
  },
  {
    id: 'demo-task-3', user_id: 'guest-usr', title: 'Take a short walk',
    description: 'Step away from the desk and get some fresh air.',
    task_date: demoDate, task_time: '16:00:00', date: demoDate, time: '16:00',
    completed: false, category: 'Health', reminder_enabled: false, reminder_minutes: 10,
    reminder_type: 'none', repeat_type: 'none', notes: '',
    created_at: createdAt, updated_at: createdAt,
  },
  {
    id: 'demo-task-4', user_id: 'guest-usr', title: 'Review today',
    description: 'Capture a win and set up tomorrow.',
    task_date: addDays(demoDate, 1), task_time: '18:00:00',
    date: addDays(demoDate, 1), time: '18:00',
    completed: false, category: 'Personal', reminder_enabled: true, reminder_minutes: 15,
    reminder_type: '15_min', repeat_type: 'none', notes: '',
    created_at: createdAt, updated_at: createdAt,
  },
];
