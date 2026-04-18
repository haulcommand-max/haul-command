"use client";

import { useEffect, useCallback, useState, useRef } from "react";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Push Registration Hook
// Per Master Prompt §29: Push notifications are a primary
// engagement weapon. This hook handles FCM token acquisition
// and storage via the device_tokens API.
//
// Responsibilities:
//   1. Request notification permission
//   2. Get FCM token from Firebase Messaging
//   3. POST token to /api/push/register to store in hc_device_tokens
//   4. Refresh token on change
//   5. Unregister token on logout
//
// Firebase = Push delivery ONLY (per role-lock.ts)
// Supabase = All data storage
// ══════════════════════════════════════════════════════════════

interface PushRegistrationState {
  status: "idle" | "requesting" | "granted" | "denied" | "unavailable" | "error";
  token: string | null;
  error: string | null;
}

interface UsePushRegistrationOptions {
  /** User ID from Supabase Auth — required for token association */
  userId?: string | null;
  /** User's role key for role-targeted push */
  roleKey?: string;
  /** Country code for geo-targeted push */
  countryCode?: string;
  /** Auto-request permission on mount (default: false — user must trigger) */
  autoRequest?: boolean;
  /** VAPID public key for web push */
  vapidKey?: string;
}

const DEFAULT_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

export function usePushRegistration({
  userId,
  roleKey,
  countryCode,
  autoRequest = false,
  vapidKey = DEFAULT_VAPID_KEY,
}: UsePushRegistrationOptions = {}) {
  const [state, setState] = useState<PushRegistrationState>({
    status: "idle",
    token: null,
    error: null,
  });

  const tokenRef = useRef<string | null>(null);

  // ── Check if push is available ──
  const isAvailable = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

  // ── Request permission + get token ──
  const requestPermission = useCallback(async () => {
    if (!isAvailable) {
      setState({ status: "unavailable", token: null, error: "Push not supported" });
      return;
    }

    if (!userId) {
      // Can't register a token without a user — wait for auth
      return;
    }

    setState((prev) => ({ ...prev, status: "requesting" }));

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setState({ status: "denied", token: null, error: null });
        return;
      }

      // Dynamic import to avoid SSR issues with firebase
      const { initializeApp, getApps } = await import("firebase/app");
      const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

      // Initialize Firebase client (if not already)
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      // Register service worker explicitly
      const sw = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: sw,
      });

      if (!token) {
        setState({ status: "error", token: null, error: "Failed to get FCM token" });
        return;
      }

      tokenRef.current = token;

      // Store token in Supabase via API
      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          platform: detectPlatform(),
          role_key: roleKey,
          country_code: countryCode,
        }),
      });

      setState({ status: "granted", token, error: null });

      // Listen for token refresh
      onMessage(messaging, (payload) => {
        console.log("[HC Push] Foreground message:", payload);
        // Foreground notifications can be handled by the app UI
        // (e.g., toast notification, in-app notification center)
      });
    } catch (err: any) {
      console.error("[HC Push] Registration failed:", err);
      setState({ status: "error", token: null, error: err.message });
    }
  }, [isAvailable, userId, roleKey, countryCode, vapidKey]);

  // ── Unregister token (on logout) ──
  const unregisterToken = useCallback(async () => {
    if (!tokenRef.current) return;

    try {
      await fetch("/api/push/register", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRef.current }),
      });
      tokenRef.current = null;
      setState({ status: "idle", token: null, error: null });
    } catch {
      // Best-effort unregistration
    }
  }, []);

  // ── Auto-request if enabled ──
  useEffect(() => {
    if (autoRequest && userId && state.status === "idle") {
      requestPermission();
    }
  }, [autoRequest, userId, state.status, requestPermission]);

  return {
    ...state,
    isAvailable,
    isGranted: state.status === "granted",
    isDenied: state.status === "denied",
    requestPermission,
    unregisterToken,
  };
}

// ── Platform detection ──
function detectPlatform(): "web" | "ios" | "android" {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "web";
}
