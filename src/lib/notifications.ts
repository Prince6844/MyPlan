import type { Task } from '../types';
import { soundService } from './sound';

export interface InAppNotification {
  id: string;
  type: 'morning' | 'night' | 'task_reminder' | 'system';
  title: string;
  body: string;
  tasks?: Task[];
  time?: string;
  actions?: { label: string; action: string; primary?: boolean }[];
  createdAt: number;
}

export class NotificationManager {
  private listeners: ((notification: InAppNotification) => void)[] = [];

  constructor() {
    this.checkPermissionStatus();
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  checkPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  onNotification(callback: (notification: InAppNotification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  dispatchNotification(item: Omit<InAppNotification, 'id' | 'createdAt'>) {
    const fullItem: InAppNotification = {
      ...item,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
    };

    // Play chime
    soundService.playNotification();

    // Trigger registered in-app listeners
    this.listeners.forEach(cb => cb(fullItem));

    // Also trigger native browser Notification if granted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        new Notification(item.title, {
          body: item.body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
        });
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }

    return fullItem;
  }

  // Trigger Morning Summary
  triggerMorningSummary(userName: string, todayTasks: Task[]) {
    if (todayTasks.length === 0) {
      return this.dispatchNotification({
        type: 'morning',
        title: `Good Morning, ${userName}! 👋`,
        body: 'You have no tasks planned for today. Enjoy your day or add new goals!',
        tasks: [],
      });
    }

    const taskLines = todayTasks
      .slice(0, 6)
      .map(t => `• ${t.time} — ${t.title}`)
      .join('\n');

    const extra = todayTasks.length > 6 ? `\n...and ${todayTasks.length - 6} more` : '';

    return this.dispatchNotification({
      type: 'morning',
      title: `Good Morning, ${userName}! 👋`,
      body: `Aaj ke ${todayTasks.length} tasks hain:\n${taskLines}${extra}`,
      tasks: todayTasks,
      actions: [
        { label: 'View Tasks', action: 'view_today', primary: true }
      ]
    });
  }

  // Trigger Night Review
  triggerNightReview(todayTasks: Task[]) {
    const pendingTasks = todayTasks.filter(t => !t.completed);

    if (pendingTasks.length === 0) {
      return this.dispatchNotification({
        type: 'night',
        title: 'Daily Review 🌙',
        body: "Great job! All today's tasks are completed. Sleep well!",
        tasks: [],
      });
    }

    const taskLines = pendingTasks.map(t => `• ${t.title}`).join('\n');

    return this.dispatchNotification({
      type: 'night',
      title: 'Daily Review 🌙',
      body: `You have ${pendingTasks.length} tasks pending today.\nDo you want to set a reminder?\n${taskLines}`,
      tasks: pendingTasks,
      actions: [
        { label: 'Set Reminder', action: 'open_night_review', primary: true },
        { label: 'Later', action: 'dismiss', primary: false }
      ]
    });
  }

  // Trigger individual task reminder
  triggerTaskReminder(task: Task, timingText: string = 'starts soon') {
    return this.dispatchNotification({
      type: 'task_reminder',
      title: `MyPlan 🔔`,
      body: `${task.title} (${task.time}) — ${timingText}`,
      tasks: [task],
      actions: [
        { label: 'Mark Done', action: 'mark_task_done_' + task.id, primary: true },
        { label: 'View', action: 'open_task_' + task.id, primary: false }
      ]
    });
  }
}

export const notificationService = new NotificationManager();
