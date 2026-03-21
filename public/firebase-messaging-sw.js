/**
 * Firebase Cloud Messaging Service Worker — HAUL COMMAND
 * 
 * This service worker handles background push notifications from Firebase.
 * It intercepts FCM messages when the app is not in the foreground and
 * displays native browser notifications.
 * 
 * Required: VAPID key must be set as NEXT_PUBLIC_FIREBASE_VAPID_KEY
 */

// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: 'AIzaSyDjNvxkYHDkLVB8DH-YuvXPxOJwUnO-FUs',
  authDomain: 'haul-command.firebaseapp.com',
  projectId: 'haul-command',
  storageBucket: 'haul-command.firebasestorage.app',
  messagingSenderId: '744285439498',
  appId: '1:744285439498:web:hc_push_web_app',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Haul Command';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: payload.data?.tag || 'hc-notification',
    data: {
      url: payload.data?.url || payload.fcmOptions?.link || '/',
      ...payload.data,
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [200, 100, 200],
    requireInteraction: payload.data?.priority === 'high',
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If we already have a window open, focus it
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((subscription) => {
        // Post to your server to update the subscription
        return fetch('/api/push/resubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        });
      })
  );
});
