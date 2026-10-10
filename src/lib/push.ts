// ============================================================================
// Web Push Subscription & Service Worker Manager
// ============================================================================

import { getSupabase } from './supabase';
import type { NotificationPermissionState } from '../types';

// Default VAPID Public Key generated for this project (P-256)
// Can be overridden by VITE_VAPID_PUBLIC_KEY in .env
export const DEFAULT_VAPID_PUBLIC_KEY = 
  import.meta.env.VITE_VAPID_PUBLIC_KEY || 
  'BKftqAQCkGtveJJA8-xzMWDp0O4uXPUduaH9zbVeZcspyQiEm84gAt-mZ7IuZyXG_7i0TA3uSaps-vROxP8S8mU';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Register Service Worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported in this browser.');
    return null;
  }

  try {
    const baseUrl = import.meta.env.BASE_URL;
    const registration = await navigator.serviceWorker.register(`${baseUrl}sw.js`, {
      scope: baseUrl,
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

// Get current permission status formatted for Settings UI
export function getNotificationPermissionStatus(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'Notifications not enabled';
  }

  if (Notification.permission === 'granted') {
    return 'Notifications enabled';
  } else if (Notification.permission === 'denied') {
    return 'Notifications blocked';
  } else {
    return 'Notifications not enabled';
  }
}

// Request permission and create PushSubscription
export async function subscribeUserToPush(userId: string): Promise<{ success: boolean; message: string; subscription?: PushSubscription }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      success: false,
      message: 'Push notifications are not supported on this browser/device.',
    };
  }

  try {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'Sign in to a configured Supabase project before enabling push notifications.' };
    }

    // 1. Explicit permission request
    const permission = await Notification.requestPermission();
    if (permission === 'denied') {
      return {
        success: false,
        message: 'Notification permission was blocked. Please enable it in browser settings.',
      };
    }

    if (permission !== 'granted') {
      return {
        success: false,
        message: 'Notification permission was dismissed.',
      };
    }

    // 2. Ensure Service Worker is registered and active
    const registration = await registerServiceWorker();
    if (!registration) {
      return {
        success: false,
        message: 'Could not register service worker.',
      };
    }

    // 3. Subscribe with VAPID Public Key
    const applicationServerKey = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
    
    // Check if subscription already exists on device
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });
    }

    // Extract keys
    const rawP256dh = subscription.getKey('p256dh');
    const rawAuth = subscription.getKey('auth');

    if (!rawP256dh || !rawAuth) {
      return {
        success: false,
        message: 'Failed to retrieve cryptographic keys from push subscription.',
      };
    }

    const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawP256dh))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawAuth))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 4. Save to Supabase push_subscriptions table
    const { error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      );

    if (subscriptionError) {
      console.error('Could not save push subscription to Supabase:', subscriptionError.message);
      return { success: false, message: `Could not save this device subscription: ${subscriptionError.message}` };
    }

    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, notifications_enabled: true }, { onConflict: 'user_id' });
    if (settingsError) {
      console.error('Could not update notification settings:', settingsError.message);
      return { success: false, message: `Subscription saved, but notification settings could not be enabled: ${settingsError.message}` };
    }

    return {
      success: true,
      message: 'This device is subscribed for push notifications.',
      subscription,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error during push subscription:', err);
    return {
      success: false,
      message: `Push subscription failed: ${errorMsg}`,
    };
  }
}

// Trigger real Web Push notification via Supabase Edge Function
export async function sendPushViaEdgeFunction(
  userId: string,
  payload: {
    title: string;
    body: string;
    notification_type: 'morning_summary' | 'night_review' | 'task_reminder' | 'test';
    data?: Record<string, unknown>;
  }
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase client not initialized' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title: payload.title,
        body: payload.body,
        notification_type: payload.notification_type,
        data: payload.data || {},
      },
    });

    if (error) return { success: false, message: error.message };
    if (data?.success !== true || typeof data?.delivered !== 'number' || data.delivered < 1) {
      return { success: false, message: data?.message || 'The server did not confirm delivery to any device.' };
    }
    return { success: true, message: data.message || `Push accepted for ${data.delivered} device(s).` };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: errorMsg };
  }
}
