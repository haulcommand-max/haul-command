/* eslint-disable no-undef */
/**
 * Firebase Messaging Service Worker — Haul Command
 *
 * Handles background push notifications when the app is not in the foreground.
 * Must live at /public root so it's served at / by Next.js.
 *
 * NOTE: Service workers can't access process.env.
 * These public config values are NOT secrets — Firebase security is enforced
 * by Firestore rules and App Check, not by hiding these values.
 * Replace the placeholder values below with your actual Firebase config.
 */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'YOUR_FIREBASE_API_KEY',                   // Replace with NEXT_PUBLIC_FIREBASE_API_KEY
    authDomain: 'YOUR_PROJECT.firebaseapp.com',         // Replace with NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    projectId: 'YOUR_PROJECT_ID',                       // Replace with NEXT_PUBLIC_FIREBASE_PROJECT_ID
    messagingSenderId: 'YOUR_SENDER_ID',                // Replace with NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    appId: 'YOUR_APP_ID',                               // Replace with NEXT_PUBLIC_FIREBASE_APP_ID
});

var messaging = firebase.messaging();

// Handle background messages (app not in foreground)
messaging.onBackgroundMessage(function(payload) {
    var notification = payload.notification || {};
    var data = payload.data || {};

    var title = notification.title || 'Haul Command';
    var body = notification.body || '';

    self.registration.showNotification(title, {
        body: body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: data.type || 'hc-notification',
        renotify: true,
        data: data,
        actions: data.screen
            ? [{ action: 'open', title: 'View' }]
            : [],
    });
});

// Handle notification click — open the app to the right screen
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    var screen = event.notification.data && event.notification.data.screen ? event.notification.data.screen : '/';
    var targetUrl = self.location.origin + screen;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
                    client.focus();
                    if ('navigate' in client) client.navigate(targetUrl);
                    return;
                }
            }
            return clients.openWindow(targetUrl);
        })
    );
});
