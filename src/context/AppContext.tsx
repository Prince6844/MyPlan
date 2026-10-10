import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { 
  Task, 
  Category, 
  UserSettings, 
  UserProfile, 
  ActiveScreen, 
  NotificationPermissionState,
  PushSubscriptionState,
} from '../types';
import { DEFAULT_CATEGORIES, INITIAL_TASKS } from '../lib/constants';
import { soundService } from '../lib/sound';
import { notificationService, type InAppNotification } from '../lib/notifications';
import { 
  getSupabase, 
  isSupabaseConfigured,
  supabaseSignIn, 
  supabaseSignUp, 
  supabaseSignOut, 
  supabaseResetPassword 
} from '../lib/supabase';
import { 
  getNotificationPermissionStatus, 
  getPushSubscriptionState,
  subscribeUserToPush, 
  sendPushViaEdgeFunction, 
  registerServiceWorker 
} from '../lib/push';
import { addDays, getDateInTimeZone, isValidTaskDate, normalizeTaskTime } from '../lib/dates';

interface AppContextType {
  tasks: Task[];
  categories: Category[];
  settings: UserSettings;
  user: UserProfile | null;
  activeScreen: ActiveScreen;
  activeDate: string; // YYYY-MM-DD
  selectedTaskId: string | null;
  isSupabaseLive: boolean;
  isSyncing: boolean;
  currentNotification: InAppNotification | null;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  permissionStatus: NotificationPermissionState;
  pushSubscriptionStatus: PushSubscriptionState;
  notificationStatusMessage: string | null;
  refreshNotificationStatus: () => Promise<void>;

  // Navigation
  setActiveScreen: (screen: ActiveScreen) => void;
  setActiveDate: (date: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  dismissNotification: () => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;

  // Task operations
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  reschedulePendingTasks: (taskIds: string[], type: '30_min' | '1_hour' | 'tomorrow' | 'custom', customTime?: string) => Promise<void>;

  // Category operations
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Settings
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;

  // Real Push Notifications
  enablePushNotifications: () => Promise<boolean>;
  sendTestPush: () => Promise<void>;

  // Auth
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: { name?: string; phone?: string; avatar_url?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Notifications simulation & triggers
  testMorningNotification: () => void;
  testNightNotification: () => void;
  testTaskReminder: (taskId: string) => void;

  // Stats
  getTodayStats: () => { total: number; completed: number; pending: number; percent: number };
  getWeeklyStats: () => { completedThisWeek: number; completionRate: number; dayCounts: { day: string; count: number }[] };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
  user_id: '',
  morning_summary_enabled: true,
  morning_summary_time: '07:00',
  night_review_enabled: true,
  night_review_time: '22:00',
  default_reminder_minutes: 10,
  notifications_enabled: false,
  timezone: 'Asia/Kolkata',
  sound_enabled: true,
  dark_mode: false,
  language: 'English',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('splash');
  const [activeDate, setActiveDate] = useState<string>(() => getDateInTimeZone());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Authentication State
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('myplan_user_session_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Entities scoped to user
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('myplan_categories_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_CATEGORIES;
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('myplan_settings_v2');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<InAppNotification | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionState>(getNotificationPermissionStatus);
  const [pushSubscriptionStatus, setPushSubscriptionStatus] = useState<PushSubscriptionState>('checking');
  const [notificationStatusMessage, setNotificationStatusMessage] = useState<string | null>(null);

  // Toast feedback helper
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 3200);
  }, []);

  // Update sound settings
  useEffect(() => {
    soundService.enabled = settings.sound_enabled ?? true;
  }, [settings.sound_enabled]);

  // Update dark mode class
  useEffect(() => {
    if (settings.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.dark_mode]);

  const refreshNotificationStatus = useCallback(async () => {
    const status = getNotificationPermissionStatus();
    setPermissionStatus(status);
    if (status === 'Notifications unsupported' || status === 'Notifications require a secure connection') {
      setPushSubscriptionStatus('unsupported');
      setNotificationStatusMessage(null);
      return;
    }
    try {
      const registration = await registerServiceWorker();
      const expectedScope = new URL(import.meta.env.BASE_URL, window.location.origin).href;
      if (registration.scope !== expectedScope) throw new Error(`Expected service-worker scope ${expectedScope}, got ${registration.scope}.`);
      setPushSubscriptionStatus(await getPushSubscriptionState(user?.id ?? null));
      setNotificationStatusMessage(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Could not register the MyPlan notification worker:', error);
      setPushSubscriptionStatus('worker_error');
      setNotificationStatusMessage(message);
    }
  }, [user?.id]);

  useEffect(() => {
    void refreshNotificationStatus();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshNotificationStatus();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshNotificationStatus]);

  // Check query params on mount for notification click navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const screenParam = params.get('screen');
      const taskIdParam = params.get('taskId');

      if (screenParam) {
        if (screenParam === 'home') setActiveScreen('home');
        else if (screenParam === 'night_review') setActiveScreen('night_review');
        else if (screenParam === 'task_details' && taskIdParam) {
          setSelectedTaskId(taskIdParam);
          setActiveScreen('task_details');
        }
      }

      // Listen for postMessage from Service Worker
      const handleMessage = (e: MessageEvent) => {
        if (e.data?.type === 'NOTIFICATION_CLICK') {
          const payload = e.data.data || {};
          if (payload.type === 'night_review') {
            setActiveScreen('night_review');
          } else if (payload.type === 'task_reminder' && payload.taskId) {
            setSelectedTaskId(payload.taskId);
            setActiveScreen('task_details');
          } else {
            setActiveScreen('home');
          }
        }
      };

      navigator.serviceWorker?.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker?.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // Handle in-app notifications
  useEffect(() => {
    const unsub = notificationService.onNotification((notif) => {
      setCurrentNotification(notif);
    });
    return unsub;
  }, []);

  // Splash auto-advance
  useEffect(() => {
    if (activeScreen === 'splash') {
      const timer = setTimeout(() => {
        const hasOnboarded = localStorage.getItem('myplan_has_onboarded_v1');
        setActiveScreen(hasOnboarded ? 'home' : 'onboarding');
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [activeScreen]);

  // ============================================================================
  // Supabase Auth Listener & User-Specific Data Loading
  // ============================================================================
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) {
      setIsSupabaseLive(false);
      // If no Supabase configured, provide sample tasks for testing
      if (!user) {
        const guestUser: UserProfile = {
          id: 'guest-usr',
          name: 'Prince',
          email: 'prince@myplan.app',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setUser(guestUser);
        setTasks(INITIAL_TASKS.map(t => ({ ...t, user_id: guestUser.id })));
      }
      return;
    }

    setIsSupabaseLive(true);

    // Check existing auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Prince',
          avatar_url: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setUser(u);
        localStorage.setItem('myplan_user_session_v2', JSON.stringify(u));
        loadUserData(session.user.id);
      } else {
        // No session: clear user-scoped tasks
        setUser(null);
        setTasks([]);
        localStorage.removeItem('myplan_user_session_v2');
      }
    });

    // Subscribe to auth state changes (Login, Logout, Token refreshed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Prince',
          avatar_url: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        };
        setUser(u);
        localStorage.setItem('myplan_user_session_v2', JSON.stringify(u));
        loadUserData(session.user.id);
      } else {
        setUser(null);
        setTasks([]);
        localStorage.removeItem('myplan_user_session_v2');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch only this user's tasks and settings from Supabase
  const loadUserData = async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setIsSyncing(true);

      // 1. Fetch user's tasks (Row Level Security ensures only own records are returned)
      const { data: dbTasks, error: taskErr } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('task_time', { ascending: true });

      if (!taskErr && dbTasks) {
        // Normalize tasks with compatibility getters
        const normalized = dbTasks.map(t => ({
          ...t,
          date: t.task_date,
          time: t.task_time.substring(0, 5),
        }));
        setTasks(normalized);
      }

      // 2. Fetch user_settings
      const { data: dbSettings, error: setErr } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!setErr && dbSettings) {
        setSettings(prev => ({
          ...prev,
          ...dbSettings,
          morning_summary_time: dbSettings.morning_summary_time?.substring(0, 5) || '07:00',
          night_review_time: dbSettings.night_review_time?.substring(0, 5) || '22:00',
        }));
      } else if (setErr?.code === 'PGRST116') {
        // Record doesn't exist yet, insert default
        await supabase.from('user_settings').insert({
          user_id: userId,
          timezone: 'Asia/Kolkata',
          morning_summary_time: '07:00',
          night_review_time: '22:00',
          morning_summary_enabled: true,
          night_review_enabled: true,
        });
      }
    } catch (err) {
      console.warn('Error loading user data from Supabase:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Realtime subscription for authenticated user's tasks
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) return;

    const channel = supabase
      .channel(`tasks_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const raw = payload.new as Task;
            const newTask: Task = { ...raw, date: raw.task_date, time: raw.task_time?.substring(0, 5) };
            setTasks(prev => (prev.some(t => t.id === newTask.id) ? prev : [...prev, newTask]));
          } else if (payload.eventType === 'UPDATE') {
            const raw = payload.new as Task;
            const updated: Task = { ...raw, date: raw.task_date, time: raw.task_time?.substring(0, 5) };
            setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
          } else if (payload.eventType === 'DELETE') {
            const oldItem = payload.old as { id: string };
            setTasks(prev => prev.filter(t => t.id !== oldItem.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // ============================================================================
  // Task Operations
  // ============================================================================
  const addTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Task> => {
    const currentUserId = user?.id || 'guest-usr';
    const nowIso = new Date().toISOString();

    const taskDate = taskData.task_date || taskData.date || activeDate;
    const taskTime = normalizeTaskTime(taskData.task_time || taskData.time || '10:00:00');
    if (!taskData.title.trim()) throw new Error('A task title is required.');
    if (!isValidTaskDate(taskDate)) throw new Error('Choose a valid task date.');
    if (!/^\d{2}:\d{2}:\d{2}$/.test(taskTime)) {
      throw new Error('Choose a valid task time.');
    }

    // Use a UUID client-side so the same ID is used by the optimistic UI,
    // Supabase row, and Realtime INSERT event. This prevents duplicate tasks.
    const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : '00000000-0000-4000-8000-' + Math.random().toString(16).slice(2).padEnd(12, '0').slice(0, 12);

    const newTask: Task = {
      id: generatedId,
      user_id: currentUserId,
      title: taskData.title,
      description: taskData.description || '',
      task_date: taskDate,
      task_time: taskTime,
      date: taskDate,
      time: taskTime.substring(0, 5),
      completed: false,
      category: taskData.category || 'Study',
      reminder_enabled: taskData.reminder_enabled ?? true,
      reminder_minutes: taskData.reminder_minutes ?? 10,
      custom_reminder_at: taskData.custom_reminder_at || null,
      repeat_type: taskData.repeat_type || 'none',
      notes: taskData.notes || '',
      created_at: nowIso,
      updated_at: nowIso,
    };

    setTasks(prev => [...prev, newTask]);

    const supabase = getSupabase();
    if (supabase && user && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('tasks').insert([
          {
            id: newTask.id,
            user_id: user.id,
            title: newTask.title,
            description: newTask.description,
            task_date: newTask.task_date,
            task_time: newTask.task_time,
            completed: newTask.completed,
            category: newTask.category,
            reminder_enabled: newTask.reminder_enabled,
            reminder_minutes: newTask.reminder_minutes,
            custom_reminder_at: newTask.custom_reminder_at,
            repeat_type: newTask.repeat_type,
            notes: newTask.notes,
          },
        ]);
        if (error) throw error;
      } catch (e) {
        setTasks(prev => prev.filter(task => task.id !== newTask.id));
        const message = e instanceof Error ? e.message : 'Task could not be saved to Supabase.';
        throw new Error(message);
      }
    }

    showToast('Task saved successfully.', 'success');
    soundService.playTap();
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updatedAt = new Date().toISOString();
    const original = tasks.find(task => task.id === id);
    const taskDate = updates.task_date || updates.date;
    const taskTime = updates.task_time || updates.time;
    const normalizedTime = taskTime ? normalizeTaskTime(taskTime) : undefined;
    if (updates.title !== undefined && !updates.title.trim()) {
      showToast('A task title is required.', 'error');
      return;
    }
    if (taskDate && !isValidTaskDate(taskDate)) {
      showToast('Choose a valid task date.', 'error');
      return;
    }
    if (normalizedTime && !/^\d{2}:\d{2}:\d{2}$/.test(normalizedTime)) {
      showToast('Enter a valid task time.', 'error');
      return;
    }

    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const normalized = { ...t, ...updates, updated_at: updatedAt };
        if (taskDate) {
          normalized.date = taskDate;
          normalized.task_date = taskDate;
        }
        if (normalizedTime) {
          normalized.time = normalizedTime.substring(0, 5);
          normalized.task_time = normalizedTime;
        }
        return normalized;
      })
    );

    const supabase = getSupabase();
    if (supabase && user && isSupabaseConfigured()) {
      try {
        const payload: Record<string, unknown> = { ...updates, updated_at: updatedAt };
        delete payload.date;
        delete payload.time;
        delete payload.reminder_type;
        if (taskDate) payload.task_date = taskDate;
        if (normalizedTime) payload.task_time = normalizedTime;
        if (updates.reminder_type) {
          const reminderMinutes: Record<string, number> = {
            none: 0, at_time: 0, '5_min': 5, '10_min': 10, '15_min': 15, '30_min': 30, '1_hour': 60, custom: 10,
          };
          payload.reminder_enabled = updates.reminder_type !== 'none';
          payload.reminder_minutes = reminderMinutes[updates.reminder_type];
        }
        const { error } = await supabase.from('tasks').update(payload).eq('id', id).eq('user_id', user.id);
        if (error) throw error;
      } catch (e) {
        if (original) setTasks(prev => prev.map(task => task.id === id ? original : task));
        const message = e instanceof Error ? e.message : 'Task update failed.';
        console.error('Supabase task update error:', message);
        showToast(`Task update failed: ${message}`, 'error');
      }
    }
  };

  const deleteTask = async (id: string) => {
    const supabase = getSupabase();
    if (supabase && user && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id);
        if (error) throw error;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Task deletion failed.';
        console.error('Supabase task delete error:', message);
        showToast(`Task deletion failed: ${message}`, 'error');
        return;
      }
    }
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Task deleted.', 'success');
  };

  const toggleTaskCompletion = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const willBeCompleted = !target.completed;
    if (willBeCompleted) {
      soundService.playTaskComplete();
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#1479F5', '#10B981', '#38BDF8', '#6366F1'],
      });
    } else {
      soundService.playTap();
    }

    await updateTask(id, { completed: willBeCompleted });
  };

  const reschedulePendingTasks = async (
    taskIds: string[], 
    type: '30_min' | '1_hour' | 'tomorrow' | 'custom', 
    customTime?: string
  ) => {
    const tomorrowStr = addDays(activeDate, 1);

    for (const id of taskIds) {
      if (type === 'tomorrow') {
        await updateTask(id, { task_date: tomorrowStr, date: tomorrowStr, task_time: '09:00:00', time: '09:00' });
      } else if (type === 'custom' && customTime) {
        await updateTask(id, { task_time: customTime, time: customTime.substring(0, 5) });
      } else {
        const task = tasks.find(t => t.id === id);
        const mins = type === '30_min' ? 30 : 60;
        if (task) {
          const date = task.task_date || task.date || activeDate;
          const time = normalizeTaskTime(task.task_time || task.time || '09:00');
          const [year, month, day] = date.split('-').map(Number);
          const [hours, minutes] = time.split(':').map(Number);
          const shifted = new Date(Date.UTC(year, month - 1, day, hours, minutes + mins));
          const shiftedDate = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
          const shiftedTime = `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
          await updateTask(id, { task_date: shiftedDate, date: shiftedDate, task_time: `${shiftedTime}:00`, time: shiftedTime });
        }
      }
    }

    showToast(`Rescheduled ${taskIds.length} task(s)!`, 'success');
  };

  // ============================================================================
  // Settings & Push Notifications
  // ============================================================================
  const updateSettings = async (updates: Partial<UserSettings>) => {
    const supabase = getSupabase();
    if (supabase && user && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('user_settings').upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        if (error) throw error;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Settings could not be saved.';
        console.error('Supabase settings update error:', message);
        showToast(`Settings could not be saved: ${message}`, 'error');
        return;
      }
    }
    setSettings(prev => ({ ...prev, ...updates }));
    if (updates.timezone) setActiveDate(getDateInTimeZone(updates.timezone));
    showToast('Settings saved.', 'success');
  };

  // Real push subscription flow
  const enablePushNotifications = async (): Promise<boolean> => {
    if (!user) {
      showToast('Please sign in first to enable push notifications', 'error');
      return false;
    }

    const result = await subscribeUserToPush(user.id);
    await refreshNotificationStatus();

    if (result.success) {
      setSettings(prev => ({ ...prev, notifications_enabled: true }));
      showToast(result.message, 'success');
      return true;
    } else {
      setPermissionStatus(getNotificationPermissionStatus());
      showToast(result.message, 'error');
      return false;
    }
  };

  // Real test push notification flow
  const sendTestPush = async () => {
    if (!user) {
      showToast('Please log in to test notifications', 'error');
      return;
    }

    showToast('Sending a test through the Supabase Push Edge Function…', 'info');

    const result = await sendPushViaEdgeFunction(user.id, {
      title: 'MyPlan 🔔',
      body: 'This is a delivery test from your MyPlan account.',
      notification_type: 'test',
      data: { type: 'test' },
    });

    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(`Push failed: ${result.message}`, 'error');
    }
  };

  // ============================================================================
  // Category Operations
  // ============================================================================
  const addCategory = async (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: 'cat-' + Date.now(),
      isDefault: false,
    };
    setCategories(prev => [...prev, newCat]);
    showToast('Category created', 'success');
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Category updated', 'info');
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast('Category removed', 'info');
  };

  // ============================================================================
  // Authentication Operations
  // ============================================================================
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured() && password) {
      const { user: authUser, error } = await supabaseSignIn(email, password);
      if (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
      }
      if (authUser) {
        const u: UserProfile = {
          id: authUser.id,
          email: authUser.email || email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0],
          phone: authUser.user_metadata?.phone || authUser.phone || '',
          avatar_url: authUser.user_metadata?.avatar_url || '',
        };
        setUser(u);
        localStorage.setItem('myplan_user_session_v2', JSON.stringify(u));
        await loadUserData(authUser.id);
        showToast(`Welcome back, ${u.name}!`, 'success');
        return { success: true };
      }
    }

    // Offline / Local Demo fallback
    const localUser: UserProfile = {
      id: 'usr-' + Math.random().toString(36).substring(2, 8),
      email,
      name: email.split('@')[0] || 'Prince',
      phone: '',
      avatar_url: '',
    };
    setUser(localUser);
    localStorage.setItem('myplan_user_session_v2', JSON.stringify(localUser));
    showToast(`Signed in as ${localUser.name}`, 'success');
    return { success: true };
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      const { user: authUser, error } = await supabaseSignUp(email, password, name);
      if (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
      }
      if (authUser) {
        const u: UserProfile = {
          id: authUser.id,
          email: authUser.email || email,
          name: name || 'Prince',
          phone: authUser.user_metadata?.phone || authUser.phone || '',
          avatar_url: authUser.user_metadata?.avatar_url || '',
        };
        setUser(u);
        localStorage.setItem('myplan_user_session_v2', JSON.stringify(u));
        await loadUserData(authUser.id);
        showToast(`Welcome to MyPlan, ${name}!`, 'success');
        return { success: true };
      }
    }

    // Local fallback
    const localUser: UserProfile = {
      id: 'usr-' + Math.random().toString(36).substring(2, 8),
      email,
      name: name || 'Prince',
      phone: '',
      avatar_url: '',
    };
    setUser(localUser);
    localStorage.setItem('myplan_user_session_v2', JSON.stringify(localUser));
    showToast(`Account created! Welcome, ${name}!`, 'success');
    return { success: true };
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      const { error } = await supabaseResetPassword(email);
      if (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
      }
    }
    showToast(`Password reset link sent to ${email}`, 'success');
    return { success: true };
  };

  const updateProfile = async (updates: { name?: string; phone?: string; avatar_url?: string }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user is signed in.' };
    const nextUser: UserProfile = { ...user, ...updates };

    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: nextUser.name,
          name: nextUser.name,
          phone: nextUser.phone || '',
          avatar_url: nextUser.avatar_url || '',
        },
      });
      if (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
      }
    }

    setUser(nextUser);
    localStorage.setItem('myplan_user_session_v2', JSON.stringify(nextUser));
    showToast('Profile updated successfully', 'success');
    return { success: true };
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user is signed in.' };
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showToast(error.message, 'error');
        return { success: false, error: error.message };
      }
    }
    showToast('Password changed successfully', 'success');
    return { success: true };
  };

  const logout = async () => {
    await supabaseSignOut();
    setUser(null);
    setTasks([]);
    localStorage.removeItem('myplan_user_session_v2');
    showToast('Signed out successfully', 'info');
  };

  // ============================================================================
  // Notification Triggers & Stats
  // ============================================================================
  const testMorningNotification = () => {
    const todayTasks = tasks.filter(t => (t.task_date || t.date) === activeDate);
    notificationService.triggerMorningSummary(user?.name || 'Prince', todayTasks);
  };

  const testNightNotification = () => {
    const todayTasks = tasks.filter(t => (t.task_date || t.date) === activeDate);
    notificationService.triggerNightReview(todayTasks);
  };

  const testTaskReminder = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    notificationService.triggerTaskReminder(task, 'starts in 10 minutes');
  };

  const getTodayStats = () => {
    const today = getDateInTimeZone(settings.timezone || 'Asia/Kolkata');
    const todayTasks = tasks.filter(t => (t.task_date || t.date) === today);
    const total = todayTasks.length;
    const completed = todayTasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percent };
  };

  const getWeeklyStats = () => {
    const today = getDateInTimeZone(settings.timezone || 'Asia/Kolkata');
    const todayDate = new Date(`${today}T12:00:00`);
    const daysSinceMonday = (todayDate.getDay() + 6) % 7;
    const weekStart = addDays(today, -daysSinceMonday);
    const weekTasks = tasks.filter(task => {
      const date = task.task_date || task.date || '';
      return date >= weekStart && date <= today;
    });
    const completedThisWeek = weekTasks.filter(task => task.completed).length;
    const total = weekTasks.length;
    const completionRate = total > 0 ? Math.round((completedThisWeek / total) * 100) : 0;

    const dayCounts = Array.from({ length: daysSinceMonday + 1 }, (_, index) => {
      const date = addDays(weekStart, index);
      const [year, month, day] = date.split('-').map(Number);
      const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' })
        .format(new Date(Date.UTC(year, month - 1, day)));
      return { day: weekday, count: weekTasks.filter(task => task.completed && (task.task_date || task.date) === date).length };
    });

    return { completedThisWeek, completionRate, dayCounts };
  };

  const dismissNotification = () => {
    setCurrentNotification(null);
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        categories,
        settings,
        user,
        activeScreen,
        activeDate,
        selectedTaskId,
        isSupabaseLive,
        isSyncing,
        currentNotification,
        toastMessage,
        permissionStatus,
        pushSubscriptionStatus,
        notificationStatusMessage,
        refreshNotificationStatus,

        setActiveScreen,
        setActiveDate,
        setSelectedTaskId,
        dismissNotification,
        showToast,

        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompletion,
        reschedulePendingTasks,

        addCategory,
        updateCategory,
        deleteCategory,

        updateSettings,
        enablePushNotifications,
        sendTestPush,

        login,
        signup,
        forgotPassword,
        updateProfile,
        changePassword,
        logout,

        testMorningNotification,
        testNightNotification,
        testTaskReminder,

        getTodayStats,
        getWeeklyStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
