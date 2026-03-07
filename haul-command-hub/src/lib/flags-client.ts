"use client";
import type { FeatureFlags } from "./flags";

/** Client helper: merge server flags with optional overrides (dev/testing only). */
export function mergeFlags(
    base: FeatureFlags,
    overrides?: Partial<FeatureFlags>
): FeatureFlags {
    if (!overrides) return base;
    return {
        auth: {
            google_enabled: overrides.auth?.google_enabled ?? base.auth.google_enabled,
            facebook_enabled: overrides.auth?.facebook_enabled ?? base.auth.facebook_enabled,
            linkedin_enabled: overrides.auth?.linkedin_enabled ?? base.auth.linkedin_enabled,
        },
        dev: {
            auth_status_banner: overrides.dev?.auth_status_banner ?? base.dev.auth_status_banner,
        },
    };
}
