export type AuthProvider = "google" | "facebook" | "linkedin";

export type FeatureFlags = {
    auth: {
        google_enabled: boolean;
        facebook_enabled: boolean;
        linkedin_enabled: boolean;
    };
    dev: {
        auth_status_banner: boolean;
    };
};

function parseBool(v: string | undefined, fallback: boolean): boolean {
    if (v === undefined) return fallback;
    return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

/** Server-side canonical source of truth for feature flags. */
export function getFeatureFlagsServer(): FeatureFlags {
    return {
        auth: {
            google_enabled: parseBool(process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED, false),
            facebook_enabled: parseBool(process.env.NEXT_PUBLIC_AUTH_FACEBOOK_ENABLED, false),
            linkedin_enabled: parseBool(process.env.NEXT_PUBLIC_AUTH_LINKEDIN_ENABLED, false),
        },
        dev: {
            auth_status_banner: parseBool(
                process.env.NEXT_PUBLIC_DEV_AUTH_STATUS_BANNER,
                process.env.NODE_ENV !== "production"
            ),
        },
    };
}
