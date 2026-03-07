"use client";

/**
 * Firebase Analytics event tracking for Haul Command.
 * 
 * Tracks key user actions across the platform:
 * - Profile/directory views
 * - Search and route queries  
 * - Lead generation events
 * - AdGrid impressions/clicks
 * - Monetization events
 * - Claim funnel events
 * 
 * Safe to call on both web and Capacitor — silently no-ops if Firebase isn't loaded.
 */

// ─── Event Names ───
export const HC_EVENTS = {
    // Discovery
    VIEW_OPERATOR_PROFILE: "view_operator_profile",
    VIEW_CORRIDOR: "view_corridor",
    VIEW_SURFACE: "view_surface",
    VIEW_COUNTRY_HUB: "view_country_hub",
    SEARCH_ROUTE: "search_route",
    SEARCH_DIRECTORY: "search_directory",

    // Lead Generation
    LEAD_SUBMIT: "lead_submit",
    CALL_CLICK: "call_click",
    EMAIL_CLICK: "email_click",
    QUOTE_REQUEST: "quote_request",

    // Claim Funnel
    CLAIM_PROFILE: "claim_profile",
    CLAIM_START: "claim_start",
    CLAIM_VERIFIED: "claim_verified",

    // AdGrid
    ADGRID_IMPRESSION: "adgrid_impression",
    ADGRID_CLICK: "adgrid_click",
    ADGRID_PURCHASE: "adgrid_purchase",

    // Monetization
    CHECKOUT_START: "checkout_start",
    SUBSCRIPTION_PURCHASE: "subscription_purchase",
    PAYMENT_COMPLETE: "payment_complete",

    // Engagement
    AVAILABILITY_TOGGLE: "availability_toggle",
    LOAD_POST: "load_post",
    LOAD_ACCEPT: "load_accept",
    REVIEW_SUBMIT: "review_submit",

    // Mobile-specific
    PUSH_PERMISSION_GRANTED: "push_permission_granted",
    PUSH_PERMISSION_DENIED: "push_permission_denied",
    DEEP_LINK_OPENED: "deep_link_opened",
    APP_FOREGROUND: "app_foreground",
} as const;

type EventName = (typeof HC_EVENTS)[keyof typeof HC_EVENTS];
type EventParams = Record<string, string | number | boolean>;

// Lazy-load Firebase Analytics (only when first event is tracked)
let analyticsInstance: any = null;
let analyticsPromise: Promise<any> | null = null;

async function getAnalytics() {
    if (analyticsInstance) return analyticsInstance;
    if (analyticsPromise) return analyticsPromise;

    analyticsPromise = (async () => {
        try {
            if (typeof window === "undefined") return null;

            const { getApps, initializeApp } = await import("firebase/app");
            const { getAnalytics, isSupported } = await import("firebase/analytics");

            const supported = await isSupported();
            if (!supported) return null;

            // Initialize Firebase if not already done
            const apps = getApps();
            const app = apps.length > 0
                ? apps[0]
                : initializeApp({
                    // These come from google-services.json / Firebase Console
                    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
                });

            analyticsInstance = getAnalytics(app);
            return analyticsInstance;
        } catch (err) {
            console.warn("[hc-analytics] Firebase Analytics not available:", err);
            return null;
        }
    })();

    return analyticsPromise;
}

/**
 * Track a Haul Command event.
 * Safe to call anywhere — silently no-ops if Firebase isn't available.
 * 
 * @example
 * trackEvent(HC_EVENTS.VIEW_OPERATOR_PROFILE, { operator_id: "abc", country: "US" });
 * trackEvent(HC_EVENTS.ADGRID_CLICK, { surface_id: "xyz", position: 1 });
 */
export async function trackEvent(eventName: EventName, params?: EventParams) {
    try {
        const analytics = await getAnalytics();
        if (!analytics) return;

        const { logEvent } = await import("firebase/analytics");
        logEvent(analytics, eventName, {
            ...params,
            timestamp: Date.now(),
            platform: typeof window !== "undefined" && "Capacitor" in window ? "native" : "web",
        });
    } catch {
        // Silent fail — analytics should never break the app
    }
}

/**
 * Set a user property for segmentation.
 * 
 * @example
 * setUserProperty("user_type", "broker");
 * setUserProperty("country", "US");
 * setUserProperty("subscription_tier", "pro");
 */
export async function setUserProperty(name: string, value: string) {
    try {
        const analytics = await getAnalytics();
        if (!analytics) return;

        const { setUserProperties } = await import("firebase/analytics");
        setUserProperties(analytics, { [name]: value });
    } catch {
        // Silent fail
    }
}

/**
 * Set the user ID for cross-device tracking.
 * 
 * @example
 * setAnalyticsUserId(supabaseUser.id);
 */
export async function setAnalyticsUserId(userId: string) {
    try {
        const analytics = await getAnalytics();
        if (!analytics) return;

        const { setUserId } = await import("firebase/analytics");
        setUserId(analytics, userId);
    } catch {
        // Silent fail
    }
}
