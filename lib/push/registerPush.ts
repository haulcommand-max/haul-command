// Push token registration — supports Capacitor native apps + web FCM fallback
// Usage: import { registerPush } from '@/lib/push/registerPush'
// Call after user authenticates

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function registerPush(profileId: string): Promise<void> {
    try {
        // Check for Capacitor PushNotifications (native iOS/Android)
        if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
            const { PushNotifications } = await import("@capacitor/push-notifications");

            const permResult = await PushNotifications.requestPermissions();
            if (permResult.receive !== "granted") {
                console.warn("[push] Permission denied");
                return;
            }

            await PushNotifications.register();

            PushNotifications.addListener("registration", async ({ value: token }) => {
                const platform = (window as any).Capacitor.getPlatform?.() === "ios" ? "ios" : "android";
                await upsertToken(profileId, token, platform);
            });

            PushNotifications.addListener("registrationError", (err) => {
                console.error("[push] Registration error:", err);
            });

            return;
        }

        // Web: service worker + VAPID (requires NEXT_PUBLIC_FCM_VAPID_KEY)
        if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;

            const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
            if (!vapidKey) {
                console.warn("[push] NEXT_PUBLIC_FCM_VAPID_KEY not set — skipping web push");
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
            });

            // Encode the subscription object as token string
            await upsertToken(profileId, JSON.stringify(sub.toJSON()), "web");
        }
    } catch (err) {
        console.error("[push] registerPush error:", err);
    }
}

async function upsertToken(profileId: string, token: string, platform: string): Promise<void> {
    const { error } = await supabase.from("push_tokens").upsert(
        { profile_id: profileId, token, platform, last_seen_at: new Date().toISOString() },
        { onConflict: "profile_id,platform" }
    );
    if (error) console.error("[push] upsert error:", error.message);
    else console.log(`[push] Token registered (${platform})`);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    return Uint8Array.from({ length: raw.length }, (_, i) => raw.charCodeAt(i));
}
