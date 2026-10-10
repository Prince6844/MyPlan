import { getSupabase } from './supabase';
import type { NotificationPermissionState, PushSubscriptionState } from '../types';

export const DEFAULT_VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BKftqAQCkGtveJJA8-xzMWDp0O4uXPUduaH9zbVeZcspyQiEm84gAt-mZ7IuZyXG_7i0TA3uSaps-vROxP8S8mU';

const basePath = () => new URL(import.meta.env.BASE_URL, window.location.origin).pathname;

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9_-]+$/.test(normalized)) {
    throw new Error('The VAPID public key must be base64url encoded without whitespace.');
  }
  const padding = '='.repeat((4 - normalized.length % 4) % 4);
  const raw = window.atob((normalized + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(raw, character => character.charCodeAt(0));
  if (bytes.length !== 65 || bytes[0] !== 4) {
    throw new Error('The VAPID public key is invalid: expected a 65-byte uncompressed P-256 key.');
  }
  return bytes;
}

const hasNotificationSupport = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

export function getNotificationPermissionStatus(): NotificationPermissionState {
  if (!hasNotificationSupport()) return 'Notifications unsupported';
  if (!window.isSecureContext) return 'Notifications require a secure connection';
  if (Notification.permission === 'granted') return 'Notifications enabled';
  if (Notification.permission === 'denied') return 'Notifications blocked';
  return 'Notifications not enabled';
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    throw new Error('This browser does not support service workers.');
  }
  if (!window.isSecureContext) {
    throw new Error('Notifications require HTTPS. Open MyPlan using its https:// GitHub Pages address.');
  }

  const expectedScope = new URL(basePath(), window.location.origin).href;
  const workerUrl = new URL('sw.js', expectedScope).href;
  let registration: ServiceWorkerRegistration;
  try {
    registration = await navigator.serviceWorker.register(workerUrl, { scope: expectedScope });
    if (!registration.active) {
      await new Promise<void>((resolve, reject) => {
        const worker = registration.installing || registration.waiting;
        if (!worker) {
          reject(new Error('The MyPlan service worker did not activate.'));
          return;
        }
        let timeout: number;
        const handleStateChange = () => {
          if (worker.state === 'activated') {
            window.clearTimeout(timeout);
            worker.removeEventListener('statechange', handleStateChange);
            resolve();
          } else if (worker.state === 'redundant') {
            window.clearTimeout(timeout);
            worker.removeEventListener('statechange', handleStateChange);
            reject(new Error('The MyPlan service worker became redundant before activation.'));
          }
        };
        timeout = window.setTimeout(() => {
          worker.removeEventListener('statechange', handleStateChange);
          reject(new Error('Timed out waiting for the MyPlan service worker to activate.'));
        }, 10_000);
        worker.addEventListener('statechange', handleStateChange);
        handleStateChange();
      });
    }
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Service worker registration failed for ${workerUrl} (scope ${expectedScope}): ${detail}`);
  }

  if (registration.scope !== expectedScope) {
    throw new Error(`Service worker scope mismatch: expected ${expectedScope}, got ${registration.scope}.`);
  }
  return registration;
}

export async function getPushSubscriptionState(userId: string | null): Promise<PushSubscriptionState> {
  if (!hasNotificationSupport()) return 'unsupported';
  if (!userId) return 'needs_sign_in';

  const supabase = getSupabase();
  if (!supabase) return 'needs_sign_in';
  try {
    const [registration, { data: { user }, error: authError }] = await Promise.all([
      navigator.serviceWorker.getRegistration(new URL(basePath(), window.location.origin).href),
      supabase.auth.getUser(),
    ]);
    if (authError || user?.id !== userId) return 'needs_sign_in';
    if (!registration) return 'not_subscribed';
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return 'not_subscribed';
    const expectedKey = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
    const currentKey = subscription.options.applicationServerKey;
    const currentBytes = currentKey ? new Uint8Array(currentKey) : null;
    if (!currentKey || currentKey.byteLength !== expectedKey.byteLength ||
        !currentBytes || !expectedKey.every((byte, index) => byte === currentBytes[index])) {
      return 'not_subscribed';
    }
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('endpoint', subscription.endpoint)
      .maybeSingle();
    if (error) {
      console.error('Could not check saved push subscription:', error.message);
      return 'error';
    }
    if (!data) return 'not_subscribed';
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('notifications_enabled')
      .eq('user_id', userId)
      .maybeSingle();
    if (settingsError) {
      console.error('Could not check notification settings:', settingsError.message);
      return 'error';
    }
    return settings?.notifications_enabled ? 'subscribed' : 'not_subscribed';
  } catch (error: unknown) {
    console.error('Could not inspect push subscription:', error);
    return 'error';
  }
}

const encodeBase64Url = (bytes: ArrayBuffer): string => {
  const view = new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

function notificationErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  const detail = error instanceof Error ? error.message : String(error);
  if (name === 'NotAllowedError' || name === 'AbortError' || /registration failed.*permission denied/i.test(detail)) {
    if (Notification.permission === 'denied') {
      return 'Notifications are blocked for this site. In Chrome, select the lock/tune icon beside the address, open Site settings, set Notifications to Allow, then reload MyPlan. Do not keep pressing Enable while permission is blocked.';
    }
    return `The browser refused push subscription (${name || 'permission error'}). Confirm this is the HTTPS MyPlan site, allow notifications for prince6844.github.io in browser site settings, and try again in a regular browser window (Chrome does not support Push API in Incognito). ${detail}`;
  }
  if (name === 'InvalidStateError') {
    return `The existing browser subscription is incompatible with this VAPID key. Reload the page and retry; if it persists, clear the MyPlan site notification permission/subscription and subscribe again. ${detail}`;
  }
  return detail;
}

export async function subscribeUserToPush(userId: string): Promise<{ success: boolean; message: string }> {
  const permissionStatus = getNotificationPermissionStatus();
  if (permissionStatus === 'Notifications unsupported') {
    return { success: false, message: 'This browser does not support the Notifications, Push, and Service Worker APIs needed by MyPlan.' };
  }
  if (permissionStatus === 'Notifications require a secure connection') {
    return { success: false, message: 'Notifications require HTTPS. Open https://prince6844.github.io/MyPlan/.' };
  }
  if (Notification.permission === 'denied') {
    return {
      success: false,
      message: 'Notifications are blocked for this site. In Chrome, select the site controls icon beside the address, open Site settings, set Notifications to Allow, then reload MyPlan. The app will not request permission again until you enable it in browser settings.',
    };
  }

  let applicationServerKey: Uint8Array;
  try {
    applicationServerKey = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Push notifications are not configured correctly: ${message}` };
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch (error: unknown) {
      return { success: false, message: `Could not request browser permission: ${notificationErrorMessage(error)}` };
    }
    if (permission !== 'granted') {
      return {
        success: false,
        message: permission === 'denied'
          ? 'Notifications were blocked. In Chrome, select the site controls icon beside the address, open Site settings, set Notifications to Allow, then reload MyPlan.'
          : 'Notification permission was dismissed. Select Enable Notifications when you are ready to allow it.',
      };
    }
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Supabase is not configured. Connect your Supabase project and sign in before enabling push notifications.' };
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return { success: false, message: 'Your Supabase sign-in is missing or expired. Sign in again before enabling push notifications.' };
    }

    const registration = await registerServiceWorker();
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const currentKey = subscription.options.applicationServerKey;
      const currentKeyBytes = currentKey ? new Uint8Array(currentKey) : null;
      const keyMatches = currentKey && currentKey.byteLength === applicationServerKey.byteLength &&
        currentKeyBytes && applicationServerKey.every((byte, index) => byte === currentKeyBytes[index]);
      if (!keyMatches) {
        const unsubscribed = await subscription.unsubscribe();
        if (!unsubscribed) throw new Error('Could not remove the existing subscription after the VAPID public key changed.');
        subscription = null;
      }
    }

    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.slice().buffer,
        });
      } catch (error: unknown) {
        throw new Error(notificationErrorMessage(error));
      }
    }

    const rawP256dh = subscription.getKey('p256dh');
    const rawAuth = subscription.getKey('auth');
    if (!rawP256dh || !rawAuth) {
      throw new Error('The browser subscription did not include its required encryption keys.');
    }

    const { error: saveError } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: encodeBase64Url(rawP256dh),
      auth: encodeBase64Url(rawAuth),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,endpoint' });
    if (saveError) {
      throw new Error(`The browser subscribed, but Supabase did not save it: ${saveError.message}`);
    }

    const { error: settingsError } = await supabase.from('user_settings').upsert({
      user_id: user.id,
      notifications_enabled: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (settingsError) {
      throw new Error(`The subscription was saved, but Supabase could not enable notifications: ${settingsError.message}`);
    }
    return { success: true, message: 'Push subscription saved to your signed-in Supabase account.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Push subscription setup failed:', error);
    return { success: false, message: `Push subscription failed: ${message}` };
  }
}

export async function sendPushViaEdgeFunction(
  userId: string,
  payload: {
    title: string;
    body: string;
    notification_type: 'morning_summary' | 'night_review' | 'task_reminder' | 'test';
    data?: Record<string, unknown>;
  },
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'Supabase client is not configured.' };

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || user?.id !== userId) {
      return { success: false, message: 'Your Supabase sign-in is missing or expired. Sign in again and retry.' };
    }
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title: payload.title,
        body: payload.body,
        notification_type: payload.notification_type,
        data: payload.data || {},
      },
    });
    if (error) return { success: false, message: `Push Edge Function failed: ${error.message}` };
    if (data?.success !== true || typeof data?.delivered !== 'number' || data.delivered < 1) {
      return { success: false, message: data?.message || 'The server did not confirm acceptance by a push provider.' };
    }
    return { success: true, message: data.message || `Push accepted by ${data.delivered} provider endpoint(s).` };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Push test failed: ${message}` };
  }
}
