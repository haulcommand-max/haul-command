"use client";

/**
 * Firebase Remote Config for Haul Command.
 * 
 * Controls app behavior without publishing updates:
 * - Feature flags (country rollout, beta features)
 * - AdGrid pricing (floor prices, density)
 * - Paywall config (free trial days, pricing tiers)
 * - Corridor-specific settings
 * 
 * Falls back to defaults if Firebase is unavailable.
 */

// ─── Default Values ───
// These are used when Remote Config can't be fetched (offline, first launch, etc.)
export const HC_REMOTE_DEFAULTS = {
    // Feature flags
    feature_adgrid_enabled: true,
    feature_claim_enabled: true,
    feature_escrow_enabled: false,
    feature_ai_match_enabled: false,
    feature_voice_dispatch_enabled: false,
    paywall_enabled: false,

    // AdGrid
    adgrid_density: 3, // ads per page
    adgrid_auction_floor_usd: 5.00,
    adgrid_refresh_seconds: 300,

    // Monetization
    free_trial_days: 14,
    pro_monthly_usd: 29.99,
    pro_annual_usd: 249.99,

    // Pricing engine
    corridor_floor_price_usd: 8.00,
    surge_multiplier_cap: 2.5,

    // Country rollout (comma-separated country codes)
    rollout_countries: "US,CA,AU,GB,NZ",

    // Maintenance mode
    maintenance_mode: false,
    maintenance_message: "HAUL COMMAND is undergoing scheduled maintenance. We'll be back shortly.",
} as const;

type ConfigKey = keyof typeof HC_REMOTE_DEFAULTS;
type ConfigValue = string | number | boolean;

let configInstance: any = null;
let configPromise: Promise<any> | null = null;
let isActivated = false;

async function getRemoteConfig() {
    if (configInstance && isActivated) return configInstance;
    if (configPromise) return configPromise;

    configPromise = (async () => {
        try {
            if (typeof window === "undefined") return null;

            const { getApps, initializeApp } = await import("firebase/app");
            const { getRemoteConfig, fetchAndActivate } = await import("firebase/remote-config");

            const apps = getApps();
            if (apps.length === 0) {
                initializeApp({
                    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                });
            }

            const rc = getRemoteConfig();
            rc.defaultConfig = HC_REMOTE_DEFAULTS as Record<string, string | number | boolean>;

            // Fetch interval: 1 hour in prod, 10 seconds in dev
            rc.settings.minimumFetchIntervalMillis =
                process.env.NODE_ENV === "development" ? 10_000 : 3_600_000;

            await fetchAndActivate(rc);
            configInstance = rc;
            isActivated = true;

            console.log("[hc-remote-config] Config fetched and activated");
            return rc;
        } catch (err) {
            console.warn("[hc-remote-config] Using defaults:", err);
            return null;
        }
    })();

    return configPromise;
}

/**
 * Get a string config value.
 * 
 * @example
 * const countries = await getConfigString("rollout_countries"); // "US,CA,AU,GB,NZ"
 */
export async function getConfigString(key: ConfigKey): Promise<string> {
    try {
        const rc = await getRemoteConfig();
        if (!rc) return String(HC_REMOTE_DEFAULTS[key]);

        const { getString } = await import("firebase/remote-config");
        return getString(rc, key);
    } catch {
        return String(HC_REMOTE_DEFAULTS[key]);
    }
}

/**
 * Get a numeric config value.
 * 
 * @example
 * const floor = await getConfigNumber("adgrid_auction_floor_usd"); // 5.00
 */
export async function getConfigNumber(key: ConfigKey): Promise<number> {
    try {
        const rc = await getRemoteConfig();
        if (!rc) return Number(HC_REMOTE_DEFAULTS[key]);

        const { getNumber } = await import("firebase/remote-config");
        return getNumber(rc, key);
    } catch {
        return Number(HC_REMOTE_DEFAULTS[key]);
    }
}

/**
 * Get a boolean config value (feature flag).
 * 
 * @example
 * const enabled = await getConfigBool("feature_adgrid_enabled"); // true
 * const maintenance = await getConfigBool("maintenance_mode"); // false
 */
export async function getConfigBool(key: ConfigKey): Promise<boolean> {
    try {
        const rc = await getRemoteConfig();
        if (!rc) return Boolean(HC_REMOTE_DEFAULTS[key]);

        const { getBoolean } = await import("firebase/remote-config");
        return getBoolean(rc, key);
    } catch {
        return Boolean(HC_REMOTE_DEFAULTS[key]);
    }
}
