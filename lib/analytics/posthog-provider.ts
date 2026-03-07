// ═══════════════════════════════════════════════════════════════════════════════
// POSTHOG ANALYTICS PROVIDER — CLIENT-SIDE
// Free tier: 1M events/month, session replay, feature flags, A/B testing
//
// Initialized once at app root. All custom events route through
// the HaulCommandEvents pipeline for type-safety + enrichment.
// ═══════════════════════════════════════════════════════════════════════════════

import posthog from 'posthog-js';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

let _initialized = false;

export function initPostHog() {
    if (_initialized || typeof window === 'undefined' || !POSTHOG_KEY) return;

    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only',

        // Session recording (free tier: 5K sessions/month)
        enable_recording_console_log: false,
        disable_session_recording: false,

        // Performance
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,
        persistence: 'localStorage+cookie',

        // Privacy
        respect_dnt: true,
        opt_out_capturing_by_default: false,
        ip: true,           // PostHog anonymizes anyway
        sanitize_properties: null,

        // Tune for marketplace
        property_denylist: [
            '$current_url',  // We send cleaned versions
        ],

        loaded(ph) {
            // Auto-identify from Supabase session if available
            if (process.env.NODE_ENV === 'development') {
                ph.debug();
            }
        },
    });

    _initialized = true;
}

export function getPostHog() {
    return posthog;
}

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY
// ═══════════════════════════════════════════════════════════════════════════════

export function identifyUser(params: {
    userId: string;
    role: 'operator' | 'broker' | 'admin';
    countryCode: string;
    tier: 'free' | 'pro' | 'elite' | 'broker_free' | 'broker_seat';
    corridorId?: string;
    signupDate?: string;
}) {
    if (!_initialized) return;

    posthog.identify(params.userId, {
        role: params.role,
        country_code: params.countryCode,
        subscription_tier: params.tier,
        primary_corridor: params.corridorId,
        signup_date: params.signupDate,
    });

    // Group by country for country-level analytics
    posthog.group('country', params.countryCode, {
        country_code: params.countryCode,
    });
}

export function resetIdentity() {
    if (!_initialized) return;
    posthog.reset();
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════════════════════

export function isFeatureEnabled(flag: string): boolean {
    if (!_initialized) return false;
    return posthog.isFeatureEnabled(flag) ?? false;
}

export function getFeatureFlag(flag: string): string | boolean | undefined {
    if (!_initialized) return undefined;
    return posthog.getFeatureFlag(flag);
}
