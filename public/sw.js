// ============================================================================
// MyPlan Service Worker — Real Web Push & Notification Click Navigation
// ============================================================================

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Real Web Push Event Handler
self.addEventListener('push', (event) => {
  const baseUrl = self.registration.scope;
  let data = {
    title: 'MyPlan 🔔',
    body: 'You have a new update.',
    icon: new URL('favicon.svg', baseUrl).href,
    badge: new URL('favicon.svg', baseUrl).href,
    data: { url: baseUrl, type: 'general' },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: new URL('favicon.svg', baseUrl).href,
        badge: new URL('favicon.svg', baseUrl).href,
        data: payload.data || { url: baseUrl, type: payload.type || 'general' },
        tag: payload.tag || payload.data?.deliveryKey || payload.type || 'myplan-notification',
      };
    } catch {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: data.data,
    tag: data.tag || 'myplan-push',
    vibrate: [120, 60, 120],
    renotify: true,
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Open' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Notification Click Handler — Focuses app or opens specific screen/task
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const baseUrl = self.registration.scope;
  let targetUrl = baseUrl;

  if (notifData.type === 'morning_summary') {
    targetUrl = `${baseUrl}?screen=home&action=morning_summary`;
  } else if (notifData.type === 'night_review') {
    targetUrl = `${baseUrl}?screen=night_review`;
  } else if (notifData.type === 'task_reminder' && notifData.taskId) {
    targetUrl = `${baseUrl}?screen=task_details&taskId=${encodeURIComponent(notifData.taskId)}`;
  } else if (notifData.url) {
    const candidate = new URL(notifData.url, baseUrl);
    const scope = new URL(baseUrl);
    if (candidate.origin === scope.origin && candidate.pathname.startsWith(scope.pathname)) {
      targetUrl = candidate.href;
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it and post a message
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: notifData,
          });
          return;
        }
      }
      // If no tab is open, open a new window with query params
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
