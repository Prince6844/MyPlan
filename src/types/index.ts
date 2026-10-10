export type ReminderType = 
  | 'none'
  | 'at_time' 
  | '5_min' 
  | '10_min' 
  | '15_min' 
  | '30_min' 
  | '1_hour' 
  | 'custom';

export type RepeatType = 
  | 'none' 
  | 'daily' 
  | 'weekly' 
  | 'weekdays' 
  | 'custom';

export interface Category {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  isDefault?: boolean;
}

// Database schema representation for Task
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  task_date: string; // YYYY-MM-DD
  task_time: string; // HH:mm:ss or HH:mm
  completed: boolean;
  category: string;
  reminder_enabled: boolean;
  reminder_minutes: number;
  custom_reminder_at?: string | null;
  repeat_type: RepeatType;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Compatibility aliases for UI convenience
  date?: string;
  time?: string;
  reminder_type?: ReminderType;
}

// Database schema representation for UserSettings
export interface UserSettings {
  id?: string;
  user_id: string;
  morning_summary_enabled: boolean;
  morning_summary_time: string; // "07:00"
  night_review_enabled: boolean;
  night_review_time: string; // "22:00"
  default_reminder_minutes: number; // 10
  notifications_enabled: boolean;
  timezone: string; // "Asia/Kolkata"
  created_at?: string;
  updated_at?: string;

  // UI preferences
  sound_enabled?: boolean;
  dark_mode?: boolean;
  language?: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  notification_type: 'morning_summary' | 'night_review' | 'task_reminder' | 'test';
  title: string;
  body: string;
  scheduled_for?: string;
  sent_at?: string | null;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
}

export type ActiveScreen = 
  | 'splash'
  | 'onboarding'
  | 'auth'
  | 'home'
  | 'tasks'
  | 'completed'
  | 'calendar'
  | 'stats'
  | 'settings'
  | 'categories'
  | 'add_task'
  | 'edit_task'
  | 'task_details'
  | 'night_review'
  | 'simulator';

export type NotificationPermissionState = 
  | 'Notifications not enabled'
  | 'Notifications enabled'
  | 'Notifications blocked'
  | 'Notifications unsupported'
  | 'Notifications require a secure connection';

export type PushSubscriptionState = 'checking' | 'subscribed' | 'not_subscribed' | 'needs_sign_in' | 'error' | 'worker_error' | 'unsupported';
