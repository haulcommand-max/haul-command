/**
 * PushRouter — Unified push notification system
 * 
 * Routes between WebPush (VAPID) and FCM (Capacitor native).
 * Single API surface for the entire app.
 */

export type PushProvider = 'webpush' | 'fcm';

export interface PushCapability {
    available: boolean;
    platform: PushProvider;
    permissionGranted: boolean;
}

/**
 * Detect which push provider this device supports
 */
export function getPushCapability(): PushCapability {
    if (typeof window === 'undefined') {
        return { available: false, platform: 'webpush', permissionGranted: false };
    }

    // Capacitor native (iOS/Android)
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
    if (isCapacitor) {
        return {
            available: true,
            platform: 'fcm',
            permissionGranted: false, // will be resolved during registration
        };
    }

    // Web Push (service worker + PushManager)
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        return {
            available: true,
            platform: 'webpush',
            permissionGranted: Notification.permission === 'granted',
        };
    }

    return { available: false, platform: 'webpush', permissionGranted: false };
}

/**
 * Register push for current user — routes to correct provider automatically
 */
export async function registerPush(userId: string): Promise<{ success: boolean; provider: PushProvider; error?: string }> {
    const cap = getPushCapability();
    if (!cap.available) {
        return { success: false, provider: cap.platform, error: 'Push not available on this device' };
    }

    if (cap.platform === 'fcm') {
        return registerFCM(userId);
    }
    return registerWebPush(userId);
}

// ── FCM (Capacitor) ──────────────────────────────────────────
async function registerFCM(userId: string): Promise<{ success: boolean; provider: PushProvider; error?: string }> {
    try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') {
            return { success: false, provider: 'fcm', error: 'Permission denied' };
        }

        await PushNotifications.register();

        return new Promise((resolve) => {
            PushNotifications.addListener('registration', async ({ value: token }) => {
                const platform = (window as any).Capacitor.getPlatform?.() === 'ios' ? 'ios' : 'android';
                await upsertEndpoint(userId, {
                    provider_type: 'fcm',
                    fcm_token: token,
                    device_meta: { platform, registered_at: new Date().toISOString() },
                });
                resolve({ success: true, provider: 'fcm' });
            });

            PushNotifications.addListener('registrationError', (err) => {
                resolve({ success: false, provider: 'fcm', error: err.error });
            });
        });
    } catch (err: any) {
        return { success: false, provider: 'fcm', error: err.message };
    }
}

// ── WebPush (VAPID) ──────────────────────────────────────────
async function registerWebPush(userId: string): Promise<{ success: boolean; provider: PushProvider; error?: string }> {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { success: false, provider: 'webpush', error: 'Permission denied' };
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
            return { success: false, provider: 'webpush', error: 'VAPID key not configured' };
        }

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
        });

        const subJson = sub.toJSON();
        await upsertEndpoint(userId, {
            provider_type: 'webpush',
            endpoint: subJson.endpoint || '',
            p256dh: subJson.keys?.p256dh || '',
            auth: subJson.keys?.auth || '',
            device_meta: { userAgent: navigator.userAgent, registered_at: new Date().toISOString() },
        });

        return { success: true, provider: 'webpush' };
    } catch (err: any) {
        return { success: false, provider: 'webpush', error: err.message };
    }
}

// ── Database ─────────────────────────────────────────────────
async function upsertEndpoint(userId: string, data: {
    provider_type: PushProvider;
    endpoint?: string;
    p256dh?: string;
    auth?: string;
    fcm_token?: string;
    device_meta?: Record<string, any>;
}) {
    const res = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...data }),
    });
    if (!res.ok) {
        console.error('[push] Failed to register endpoint:', await res.text());
    }
}

// ── Utility ──────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    return Uint8Array.from({ length: raw.length }, (_, i) => raw.charCodeAt(i));
}
