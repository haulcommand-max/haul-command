/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging Service Worker
 * Required for push notifications to work in the browser.
 * Must live at /public/firebase-messaging-sw.js
 */

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.__FIREBASE_API_KEY || '',
  projectId: self.__FIREBASE_PROJECT_ID || 'haul-command',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.__FIREBASE_APP_ID || '',
});

const messaging = firebase.messaging();

// Handle background messages (when the app is not in focus)
messaging.onBackgroundMessage(function (payload) {
  const title = payload.notification?.title || 'Haul Command';
  const body = payload.notification?.body || 'You have a new notification';
  const icon = '/icon-192x192.png';

  const options = {
    body: body,
    icon: icon,
    badge: '/icon-72x72.png',
    tag: payload.data?.tag || 'hc-notification',
    data: {
      url: payload.data?.url || '/',
      ...payload.data,
    },
    actions: payload.data?.action_url ? [
      { action: 'open', title: 'View' },
    ] : [],
  };

  self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
