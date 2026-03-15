'use client';
// lib/push/firebase-push.ts — CONSOLIDATED Client Push Registration
//
// Merged from:
//   - lib/push/firebase-push.ts (FCM web push, own Firebase init — redundant)
//   - lib/push/registerPush.ts (Capacitor native + web push, own Supabase init)
//
// Now uses the canonical Firebase app from lib/firebase.ts
// and the canonical Supabase client from lib/supabase/client.ts
//
// Supports: Capacitor native (iOS/Android) → FCM web → VAPID web push

import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// ── Main Registration ──

/**
 * Register for push notifications.
 * Handles Capacitor native, FCM web, and VAPID web push.
 * Call after user authenticates.
 */
export async function registerForPush(profileId?: string): Promise<string | null> {
    try {
        // 1. Capacitor native (iOS/Android)
        if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
            return await registerCapacitorPush(profileId);
        }

        // 2. Web: FCM via Firebase SDK
        if (typeof window === 'undefined') return null;
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return null;

        // Use canonical Firebase app from lib/firebase.ts
        const { app } = await import('@/lib/firebase');
        const { getMessaging, getToken } = await import('firebase/messaging');
        const msg = getMessaging(app);
        const token = await getToken(msg, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        if (!token) return null;

        // Persist token
        const userId = profileId || (await supabase.auth.getSession()).data?.session?.user?.id;
        if (userId) {
            await upsertToken(userId, token, 'web');
        }

        return token;
    } catch (err) {
        console.error('[push] registerForPush error:', err);
        return null;
    }
}

/** Listen for foreground FCM messages */
export function onForegroundMessage(cb: (p: { title: string; body: string; type: string }) => void) {
    if (typeof window === 'undefined') return;
    import('@/lib/firebase').then(({ app }) => {
        import('firebase/messaging').then(({ getMessaging, onMessage }) => {
            onMessage(getMessaging(app), (p) =>
                cb({
                    title: p.notification?.title || '',
                    body: p.notification?.body || '',
                    type: (p.data?.type as string) || 'system',
                })
            );
        });
    });
}

// ── Capacitor Native Push ──

async function registerCapacitorPush(profileId?: string): Promise<string | null> {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
        console.warn('[push] Capacitor permission denied');
        return null;
    }

    await PushNotifications.register();

    return new Promise((resolve) => {
        PushNotifications.addListener('registration', async ({ value: token }) => {
            const platform = (window as any).Capacitor.getPlatform?.() === 'ios' ? 'ios' : 'android';
            const userId = profileId || (await supabase.auth.getSession()).data?.session?.user?.id;
            if (userId) await upsertToken(userId, token, platform);
            resolve(token);
        });

        PushNotifications.addListener('registrationError', (err) => {
            console.error('[push] Capacitor registration error:', err);
            resolve(null);
        });
    });
}

// ── Token Persistence ──

async function upsertToken(profileId: string, token: string, platform: string): Promise<void> {
    const { error } = await supabase.from('push_tokens').upsert(
        {
            profile_id: profileId,
            token,
            platform_new: platform,
            last_seen_at: new Date().toISOString(),
            enabled: true,
        },
        { onConflict: 'profile_id,device_id' }
    );
    if (error) console.error('[push] upsert error:', error.message);
    else console.log(`[push] Token registered (${platform})`);
}

// ── Utilities ──

export const isPushSupported = () =>
    typeof window !== 'undefined' && 'Notification' in window;

export const isQuietHours = () => {
    const h = new Date().getHours();
    return h >= 22 || h < 7;
};
