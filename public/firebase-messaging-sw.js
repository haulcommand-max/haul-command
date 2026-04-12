// =====================================================================
// Firebase Messaging Service Worker
// public/firebase-messaging-sw.js
//
// Handles background push notifications when the app is not in focus.
// This file MUST live at the root of /public/ for FCM to work.
// =====================================================================

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config (must match lib/firebase.ts)
// These are public keys — safe to expose in service worker
firebase.initializeApp({
  apiKey:            self.__FIREBASE_CONFIG__?.apiKey            || '',
  authDomain:        self.__FIREBASE_CONFIG__?.authDomain        || '',
  projectId:         self.__FIREBASE_CONFIG__?.projectId         || '',
  storageBucket:     self.__FIREBASE_CONFIG__?.storageBucket     || '',
  messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId || '',
  appId:             self.__FIREBASE_CONFIG__?.appId             || '',
});

const messaging = firebase.messaging();

// ─── Background Message Handler ──────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[HC SW] Background push received:', payload);

  const notificationTitle = payload.notification?.title || 'Haul Command';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icons/hc-icon-192.png',
    badge: '/icons/hc-badge-72.png',
    tag: payload.data?.tag || 'hc-notification',
    data: {
      url: payload.data?.click_action || payload.fcmOptions?.link || '/',
      ...payload.data,
    },
    actions: [],
    requireInteraction: payload.data?.priority === 'high',
    vibrate: [200, 100, 200],
  };

  // Add context-aware actions based on notification type
  const notifType = payload.data?.type || '';

  if (notifType === 'load_match' || notifType === 'dispatch_wave') {
    notificationOptions.actions = [
      { action: 'accept', title: '✅ Accept' },
      { action: 'view', title: '👀 View Details' },
    ];
    notificationOptions.requireInteraction = true;
  } else if (notifType === 'claim_nudge') {
    notificationOptions.actions = [
      { action: 'claim', title: '🏆 Claim Now' },
      { action: 'dismiss', title: 'Later' },
    ];
  } else if (notifType === 'availability_ping') {
    notificationOptions.actions = [
      { action: 'confirm', title: '✅ Still Available' },
      { action: 'unavailable', title: '❌ Not Available' },
    ];
    notificationOptions.requireInteraction = true;
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ─── Notification Click Handler ──────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  console.log('[HC SW] Notification click:', event.action, event.notification.data);

  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = data.url || '/';

  // Route based on action
  switch (event.action) {
    case 'accept':
      targetUrl = `/loads/${data.load_id || ''}?action=accept`;
      break;
    case 'claim':
      targetUrl = `/claim/${data.listing_id || ''}`;
      break;
    case 'confirm':
      // Ping availability API directly
      fetch('/api/availability/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: data.operator_id }),
      }).catch(() => {});
      targetUrl = '/dashboard';
      break;
    case 'unavailable':
      fetch('/api/availability/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: data.operator_id, available: false }),
      }).catch(() => {});
      return; // Don't open a window
    case 'view':
    default:
      // Use the default URL from data
      break;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(targetUrl);
    })
  );
});
