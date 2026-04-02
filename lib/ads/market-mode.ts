// lib/ads/market-mode.ts
// ══════════════════════════════════════════════════════════════
// MARKET MODE SYSTEM — 120-Country State Machine
//
// Every country has a mode that controls what surfaces, CTAs,
// and monetization paths are available.
//
// Modes:
//   live        — Full marketplace, all surfaces active, ads serving
//   seed        — Seeding content, limited surfaces, waitlist focus
//   dormant     — Searchable but minimal, capture interest only
//
// Transitions:
//   dormant → seed   : When operators >= 5 OR manual override
//   seed → live      : When CDS band >= "credible" OR manual override
//   live → seed      : Only on kill switch (compliance issue)
//
// Integration points:
//   - country-density-score.ts (CDS band drives auto-transitions)
//   - country-registry.ts (tier drives initial mode)
//   - country-gate.ts (features gated by mode)
//   - adgrid_pricing_matrix (ad serving gated by mode)
// ══════════════════════════════════════════════════════════════

import { COUNTRY_REGISTRY, lookupCountry, type CountryConfig } from '@/lib/config/country-registry';

// ── Types ───────────────────────────────────────────────────

export type MarketMode = 'live' | 'seed' | 'dormant';

export interface MarketModeConfig {
    mode: MarketMode;
    surfaces_active: string[];
    monetization_active: string[];
    cta_type: 'full_marketplace' | 'claim_waitlist' | 'notify_me';
    ad_serving: boolean;
    self_serve_checkout: boolean;
    sponsor_capture: boolean;
    no_dead_end_behavior: NoDeadEndBehavior;
}

export interface NoDeadEndBehavior {
    show_waitlist: boolean;
    show_notify_me: boolean;
    show_educational_content: boolean;
    show_global_feed: boolean;
    show_sponsor_interest_capture: boolean;
    redirect_to_nearest_live?: string;
}

// ── Mode Configurations ────────────────────────────────────

const LIVE_CONFIG: MarketModeConfig = {
    mode: 'live',
    surfaces_active: [
        'directory', 'load_board', 'leaderboard', 'map',
        'corridor_pages', 'city_pages', 'port_pages',
        'profile_pages', 'tools', 'gear', 'social_feed',
    ],
    monetization_active: [
        'ad_impressions', 'ad_clicks', 'sponsor_packages',
        'listing_boosts', 'profile_boosts', 'lead_fees',
        'subscriptions_escort', 'subscriptions_broker',
        'data_exports', 'api_access', 'premium_badges',
    ],
    cta_type: 'full_marketplace',
    ad_serving: true,
    self_serve_checkout: true,
    sponsor_capture: true,
    no_dead_end_behavior: {
        show_waitlist: false,
        show_notify_me: false,
        show_educational_content: false,
        show_global_feed: false,
        show_sponsor_interest_capture: false,
    },
};

const SEED_CONFIG: MarketModeConfig = {
    mode: 'seed',
    surfaces_active: [
        'directory', 'map', 'corridor_pages', 'city_pages',
        'profile_pages', 'tools',
    ],
    monetization_active: [
        'sponsor_packages', 'subscriptions_escort',
        'listing_boosts', 'premium_badges',
    ],
    cta_type: 'claim_waitlist',
    ad_serving: false,
    self_serve_checkout: false,
    sponsor_capture: true,
    no_dead_end_behavior: {
        show_waitlist: true,
        show_notify_me: true,
        show_educational_content: true,
        show_global_feed: true,
        show_sponsor_interest_capture: true,
    },
};

const DORMANT_CONFIG: MarketModeConfig = {
    mode: 'dormant',
    surfaces_active: ['directory', 'corridor_pages'],
    monetization_active: [],
    cta_type: 'notify_me',
    ad_serving: false,
    self_serve_checkout: false,
    sponsor_capture: true,
    no_dead_end_behavior: {
        show_waitlist: true,
        show_notify_me: true,
        show_educational_content: true,
        show_global_feed: true,
        show_sponsor_interest_capture: true,
        redirect_to_nearest_live: undefined, // Set dynamically
    },
};

// ── Default Market Modes by Tier ───────────────────────────

const TIER_DEFAULT_MODE: Record<string, MarketMode> = {
    gold: 'live',
    blue: 'seed',
    silver: 'dormant',
    slate: 'dormant',
    copper: 'dormant',
};

// ── Country-Specific Overrides ─────────────────────────────
// Some blue/silver countries may already be promoted

const COUNTRY_MODE_OVERRIDES: Record<string, MarketMode> = {
    // Blue-tier countries seeding by default (tier→seed already covers them,
    // but explicit overrides keep intent clear and survive tier refactors)
    IE: 'seed',
    SE: 'seed',
    NO: 'seed',
    SA: 'seed',
    MX: 'seed',
    IN: 'seed', // Blue tier
    ID: 'seed', // Blue tier
    TH: 'seed', // Blue tier
    // Silver-tier countries promoted to seed (special conditions)
    PL: 'seed', // EU logistics hub
    TR: 'seed', // Major market
    SG: 'seed', // English-dominant, easy entry
};

// ── Public API ─────────────────────────────────────────────

export function getMarketMode(countryCode: string): MarketMode {
    // Check override first
    if (COUNTRY_MODE_OVERRIDES[countryCode]) {
        return COUNTRY_MODE_OVERRIDES[countryCode];
    }

    // Derive from tier
    const country = lookupCountry(countryCode);
    if (!country) return 'dormant';
    return TIER_DEFAULT_MODE[country.tier] || 'dormant';
}

export function getMarketModeConfig(countryCode: string): MarketModeConfig {
    const mode = getMarketMode(countryCode);
    switch (mode) {
        case 'live': return { ...LIVE_CONFIG };
        case 'seed': return { ...SEED_CONFIG };
        case 'dormant': return { ...DORMANT_CONFIG };
    }
}

export function isSurfaceActive(countryCode: string, surface: string): boolean {
    const config = getMarketModeConfig(countryCode);
    return config.surfaces_active.includes(surface);
}

export function isMonetizationActive(countryCode: string, monetizationType: string): boolean {
    const config = getMarketModeConfig(countryCode);
    return config.monetization_active.includes(monetizationType);
}

export function shouldShowWaitlist(countryCode: string): boolean {
    const config = getMarketModeConfig(countryCode);
    return config.no_dead_end_behavior.show_waitlist;
}

export function shouldShowNotifyMe(countryCode: string): boolean {
    const config = getMarketModeConfig(countryCode);
    return config.no_dead_end_behavior.show_notify_me;
}

export function canServeAds(countryCode: string): boolean {
    const config = getMarketModeConfig(countryCode);
    return config.ad_serving;
}

export function canSelfServeCheckout(countryCode: string): boolean {
    const config = getMarketModeConfig(countryCode);
    return config.self_serve_checkout;
}

// ── All Countries with Modes ───────────────────────────────

export function getAllCountryModes(): Array<{ code: string; name: string; tier: string; mode: MarketMode }> {
    return COUNTRY_REGISTRY.map(c => ({
        code: c.code,
        name: c.name,
        tier: c.tier,
        mode: getMarketMode(c.code),
    }));
}

// ── Mode Transition Logic ──────────────────────────────────

export interface ModeTransitionCheck {
    current_mode: MarketMode;
    recommended_mode: MarketMode;
    should_transition: boolean;
    reason: string;
    blockers: string[];
}

export function checkModeTransition(
    countryCode: string,
    operatorCount: number,
    cdsBand: string,
    hasCompliance: boolean = true,
): ModeTransitionCheck {
    const currentMode = getMarketMode(countryCode);

    // dormant → seed
    if (currentMode === 'dormant' && operatorCount >= 5) {
        return {
            current_mode: 'dormant',
            recommended_mode: 'seed',
            should_transition: true,
            reason: `${operatorCount} operators registered (minimum: 5)`,
            blockers: [],
        };
    }

    // seed → live
    if (currentMode === 'seed' && (cdsBand === 'credible' || cdsBand === 'dominant')) {
        const blockers: string[] = [];
        if (!hasCompliance) blockers.push('compliance_not_verified');
        if (operatorCount < 15) blockers.push(`operators_too_low (${operatorCount}/15)`);

        return {
            current_mode: 'seed',
            recommended_mode: blockers.length === 0 ? 'live' : 'seed',
            should_transition: blockers.length === 0,
            reason: `CDS band is "${cdsBand}"`,
            blockers,
        };
    }

    return {
        current_mode: currentMode,
        recommended_mode: currentMode,
        should_transition: false,
        reason: 'No transition conditions met',
        blockers: [],
    };
}
