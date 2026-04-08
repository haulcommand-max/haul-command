"use client";

import { useEffect } from "react";
import { useDeepLinkHandler } from "@/lib/mobile/deeplinkHandler";

/**
 * Client component mounted in root layout.
 * Initializes native-only features:
 *   - Deep links (cold start + warm start)
 *   - Push notification registration + token capture
 *   - Status bar + splash screen
 *   - Android back button
 *   - Auth session bridging for WebView
 * No-ops silently on web.
 */
export function NativeBootstrap() {
    // Deep link handler — cold start + warm start
    useDeepLinkHandler();

    // Push notifications: request permission, capture token, send to Supabase
    useEffect(() => {
        let cleanups: (() => void)[] = [];

        async function initPush() {
            try {
                const { Capacitor } = await import("@capacitor/core");
                if (!Capacitor.isNativePlatform()) return;

                const { PushNotifications } = await import("@capacitor/push-notifications");
                const { Device } = await import("@capacitor/device");

                // Check / request permission
                let permStatus = await PushNotifications.checkPermissions();
                if (permStatus.receive === "prompt") {
                    permStatus = await PushNotifications.requestPermissions();
                }
                if (permStatus.receive !== "granted") {
                    console.log("[NativeBootstrap] Push permission not granted");
                    return;
                }

                // Register with FCM
                await PushNotifications.register();

                // Capture FCM token and send to Supabase
                const tokenListener = await PushNotifications.addListener(
                    "registration",
                    async (token) => {
                        console.log("[NativeBootstrap] FCM token:", token.value?.substring(0, 20) + "...");

                        try {
                            const deviceInfo = await Device.getInfo();
                            const { App } = await import("@capacitor/app");
                            const appInfo = await App.getInfo();
                            const { supabaseBrowser } = await import("@/lib/supabase/browser");
                            const supabase = supabaseBrowser();

                            // Get current user (may be null for anonymous)
                            const { data: { user } } = await supabase.auth.getUser();

                            // Register token via RPC
                            await supabase.rpc("hc_device_token_register", {
                                p_token: token.value,
                                p_platform: Capacitor.getPlatform(), // 'android' | 'ios'
                                p_user_id: user?.id || null,
                                p_app_version: appInfo.version || null,
                                p_device_model: deviceInfo.model || null,
                                p_os_version: deviceInfo.osVersion || null,
                                p_locale: navigator.language || null,
                            });

                            console.log("[NativeBootstrap] Token registered in Supabase");
                        } catch (err) {
                            console.error("[NativeBootstrap] Token registration failed:", err);
                        }
                    }
                );
                cleanups.push(() => tokenListener.remove());

                // Handle registration errors
                const errorListener = await PushNotifications.addListener(
                    "registrationError",
                    (error) => {
                        console.error("[NativeBootstrap] Push registration error:", error);
                    }
                );
                cleanups.push(() => errorListener.remove());

                // When a push notification is tapped, route to the URL in the payload
                const actionListener = await PushNotifications.addListener(
                    "pushNotificationActionPerformed",
                    (notification) => {
                        const url =
                            notification.notification?.data?.url ||
                            notification.notification?.data?.deepLink;
                        if (url) {
                            window.location.href = url;
                        }
                    }
                );
                cleanups.push(() => actionListener.remove());

                // Foreground notification received — show as in-app banner
                const foregroundListener = await PushNotifications.addListener(
                    "pushNotificationReceived",
                    (notification) => {
                        console.log("[NativeBootstrap] Push received in foreground:", notification.title);
                        const banner = document.createElement("div");
                        banner.className = "fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-[#0c141d] border border-blue-500/40 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 text-white font-sans max-w-[90vw] sm:max-w-md w-full transition-all duration-300 transform translate-y-0 opacity-100";
                        banner.innerHTML = `
                           <div class="h-10 w-10 shrink-0 bg-blue-500/15 rounded-full flex items-center justify-center border border-blue-500/30 text-blue-400">
                               <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                           </div>
                           <div class="flex-1 min-w-0">
                               <div class="text-[13px] font-bold text-white uppercase tracking-wider mb-0.5 line-clamp-1">${notification.title || "Dispatch Alert"}</div>
                               <div class="text-xs font-medium text-blue-200/70 leading-tight line-clamp-2">${notification.body || "You have a new update. Tap to review."}</div>
                           </div>
                        `;

                        // Add tap-to-view logic
                        banner.onclick = () => {
                           const url = notification.data?.url || notification.data?.deepLink;
                           if (url) window.location.href = url;
                           banner.remove();
                        };

                        document.body.appendChild(banner);
                        setTimeout(() => {
                           banner.style.opacity = "0";
                           banner.style.transform = "translate(-50%, -10px)";
                           setTimeout(() => banner.remove(), 300);
                        }, 6000);
                    }
                );
                cleanups.push(() => foregroundListener.remove());

            } catch {
                // Not in Capacitor or plugin not installed — skip silently
            }
        }

        initPush();
        return () => cleanups.forEach(fn => fn());
    }, []);

    // Native platform setup: splash, status bar, back button, auth bridging
    useEffect(() => {
        let cleanups: (() => void)[] = [];

        async function initNative() {
            try {
                const { Capacitor } = await import("@capacitor/core");
                if (!Capacitor.isNativePlatform()) return;

                const { App } = await import("@capacitor/app");

                // Hide splash screen once app is ready
                try {
                    const splashMod = await import("@capacitor/splash-screen");
                    await splashMod.SplashScreen.hide();
                } catch {
                    // SplashScreen plugin not installed — skip
                }

                // Configure status bar
                try {
                    const statusMod = await import("@capacitor/status-bar");
                    await statusMod.StatusBar.setStyle({ style: statusMod.Style.Dark });
                    await statusMod.StatusBar.setBackgroundColor({ color: "#030712" });
                } catch {
                    // StatusBar plugin not installed — skip
                }

                // Handle Android back button
                const backListener = await App.addListener("backButton", ({ canGoBack }) => {
                    if (canGoBack) {
                        window.history.back();
                    } else {
                        App.exitApp();
                    }
                });
                cleanups.push(() => backListener.remove());

                // ─── Auth session bridging ───
                // When auth state changes in the WebView, update the push token association
                try {
                    const { supabaseBrowser } = await import("@/lib/supabase/browser");
                    const supabase = supabaseBrowser();

                    const { data: { subscription } } = supabase.auth.onAuthStateChange(
                        async (event, session) => {
                            if (event === "SIGNED_IN" && session?.user) {
                                // Re-register token with user_id now that we know who they are
                                try {
                                    const { PushNotifications } = await import("@capacitor/push-notifications");
                                    // Re-trigger registration to get current token
                                    await PushNotifications.register();
                                } catch {
                                    // Push not available
                                }
                            }

                            if (event === "SIGNED_OUT") {
                                // Disable push token on logout
                                // Token will be re-enabled on next sign-in
                                console.log("[NativeBootstrap] User signed out, token will be re-associated on next login");
                            }
                        }
                    );
                    cleanups.push(() => subscription.unsubscribe());
                } catch {
                    // Auth setup failed — non-critical
                }

            } catch {
                // Not in Capacitor — skip silently
            }
        }

        initNative();
        return () => cleanups.forEach(fn => fn());
    }, []);

    return null;
}
