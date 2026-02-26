"use client";

/**
 * usePushRegistration — FCM Token Registration Hook
 *
 * Firebase best practice:
 *   1. Request permissions on first launch
 *   2. Retrieve FCM token immediately and store with timestamp
 *   3. Listen for onTokenRefresh and update server on change
 *   4. Disable token on logout
 *
 * This hook is safe to call in a top-level layout component.
 * It is a no-op in web browsers without Capacitor — silently skips.
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Device ID — stable per install (falls back to random UUID stored in localStorage)
function getDeviceId(): string {
    const key = "__hc_device_id__";
    let id = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (!id) {
        id = crypto.randomUUID();
        if (typeof window !== "undefined") localStorage.setItem(key, id);
    }
    return id;
}

async function registerToken(token: string, platform: string, userId: string) {
    const supabase = createClient();
    const deviceId = getDeviceId();

    // Upsert: update fcm_token + timestamp on reinstall / token refresh
    await supabase.from("push_tokens").upsert(
        {
            profile_id: userId,
            device_id: deviceId,
            platform_new: platform,
            token: token,
            token_updated_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            enabled: true,
        },
        { onConflict: "profile_id,device_id" }
    );
}

async function disableTokens(userId: string) {
    const supabase = createClient();
    const deviceId = getDeviceId();
    await supabase
        .from("push_tokens")
        .update({ enabled: false })
        .eq("profile_id", userId)
        .eq("device_id", deviceId);
}

export function usePushRegistration() {
    useEffect(() => {
        // Only runs inside Capacitor native shell
        async function init() {
            try {
                // Dynamic import keeps bundle clean for web users
                const [{ PushNotifications }, { Capacitor }] = await Promise.all([
                    import("@capacitor/push-notifications"),
                    import("@capacitor/core"),
                ]);

                if (!Capacitor.isNativePlatform()) return; // web — skip

                const platform = Capacitor.getPlatform(); // "ios" | "android"

                // Get authenticated user
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Request permission
                const { receive } = await PushNotifications.requestPermissions();
                if (receive !== "granted") return;

                // Register with FCM/APNs
                await PushNotifications.register();

                // Handle initial token (fires immediately after register())
                PushNotifications.addListener("registration", ({ value: token }) => {
                    registerToken(token, platform, user.id);
                });

                // Handle token refresh (reinstall, clear data, etc.)
                PushNotifications.addListener("registrationError", (err) => {
                    console.warn("[Push] Registration error:", err.error);
                });

                // Handle foreground notifications
                PushNotifications.addListener("pushNotificationReceived", (notification) => {
                    console.log("[Push] Foreground notification:", notification.title);
                    // Optionally show in-app toast here
                });

                // Handle notification tap → navigate to deep link
                PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
                    const data = action.notification.data;
                    if (data?.url && typeof window !== "undefined") {
                        window.location.href = data.url;
                    }
                });

            } catch {
                // Capacitor not installed (web-only builds) — safe to ignore
            }
        }

        init();
    }, []);
}

// Export disable helper for logout flows
export { disableTokens };
