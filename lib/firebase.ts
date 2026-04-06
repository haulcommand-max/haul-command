/**
 * Firebase — Haul Command
 *
 * Re-exports from canonical Firebase modules.
 * Firebase is required infrastructure (push notifications, analytics, remote config).
 *
 * For admin SDK (server-side): import from '@/lib/firebase/admin'
 * For client SDK (browser):    import from '@/lib/firebase/client'
 * For push notifications:      import from '@/lib/notifications/push-service'
 */

export { getMessaging, requestFcmToken, registerForPushNotifications, onMessageListener, trackEvent } from './firebase/client';
export { getAdminMessaging, getFirebaseAdmin } from './firebase/admin';
