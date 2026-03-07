// lib/subscriptions/pricing-config.ts
//
// Haul Command — Global Subscription Pricing Configuration
// Single source of truth for directory + mobile subscription tiers.
// PPP-adjusted, cost-floor protected, App Store compliant.

// ============================================================
// TYPES
// ============================================================

export type PricingTier = 'free' | 'pro' | 'elite' | 'enterprise';
export type Platform = 'directory' | 'mobile';
export type PPPTier = 'tier_a' | 'tier_b' | 'tier_c' | 'tier_d';

export interface PricePlan {
    tier: PricingTier;
    platform: Platform;
    name: string;
    tagline: string;
    base_price_usd: number;
    stripe_price_lookup_key: string; // Stripe lookup key for price resolution
    features: string[];
    limits: Record<string, number | string>;
    target_margin: number;
    highlight?: boolean; // "Most Popular" badge
}

export interface PPPMultiplier {
    tier: PPPTier;
    multiplier: number;
    countries: string[];
}

// ============================================================
// PPP TIERS (Purchasing Power Parity)
// ============================================================

export const PPP_TIERS: PPPMultiplier[] = [
    {
        tier: 'tier_a',
        multiplier: 1.00,
        countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NL', 'SE', 'NO', 'DK', 'CH', 'AT', 'FI', 'BE', 'IE', 'NZ', 'SG', 'JP', 'KR', 'AE', 'QA', 'KW'],
    },
    {
        tier: 'tier_b',
        multiplier: 0.82,
        countries: ['ES', 'IT', 'FR', 'PT', 'CZ', 'EE', 'SI', 'HR', 'SA', 'BH', 'OM', 'MY', 'CL', 'UY', 'PA', 'CR'],
    },
    {
        tier: 'tier_c',
        multiplier: 0.58,
        countries: ['PL', 'HU', 'SK', 'LT', 'LV', 'GR', 'TR', 'MX', 'BR', 'RO', 'BG'],
    },
    {
        tier: 'tier_d',
        multiplier: 0.42,
        countries: ['CO', 'PE', 'AR', 'ZA'],
    },
];

// ============================================================
// COST FLOOR
// ============================================================

const COST_FLOOR = {
    infra_per_user_monthly: 0.80,
    support_per_user_monthly: 0.40,
    fraud_reserve_percent: 0.02,
    payment_processing_percent: 0.029,
    app_store_fee_percent: 0.15, // Small business program rate
};

export function computeBreakEvenPrice(countryMultiplier: number = 1.0): number {
    const trueCost = (COST_FLOOR.infra_per_user_monthly + COST_FLOOR.support_per_user_monthly) * countryMultiplier;
    const loaded = trueCost * (1 + COST_FLOOR.fraud_reserve_percent);
    return loaded / (1 - COST_FLOOR.payment_processing_percent - COST_FLOOR.app_store_fee_percent);
}

// ============================================================
// DIRECTORY PRICING TIERS
// ============================================================

export const DIRECTORY_PLANS: PricePlan[] = [
    {
        tier: 'free',
        platform: 'directory',
        name: 'Starter Listing',
        tagline: 'Get discovered by brokers and carriers',
        base_price_usd: 0,
        stripe_price_lookup_key: 'directory_free',
        features: [
            'Basic business profile',
            'Appear in directory search',
            'Claim your listing',
            'Collect reviews',
            'Trust score tracking',
        ],
        limits: {
            monthly_leads: 5,
            photo_slots: 3,
            analytics: 'none',
        },
        target_margin: 0,
    },
    {
        tier: 'pro',
        platform: 'directory',
        name: 'Verified Pro',
        tagline: 'Stand out and win more loads',
        base_price_usd: 29,
        stripe_price_lookup_key: 'directory_pro_monthly',
        features: [
            'Boosted search ranking',
            'Verified Pro trust badge',
            'Unlimited photo gallery',
            'Response time tracking',
            'Basic analytics dashboard',
            'Priority review placement',
            'Lead notification alerts',
        ],
        limits: {
            monthly_leads: 'unlimited',
            photo_slots: 25,
            analytics: 'basic',
        },
        target_margin: 0.82,
        highlight: true,
    },
    {
        tier: 'elite',
        platform: 'directory',
        name: 'Corridor Elite',
        tagline: 'Dominate your corridors',
        base_price_usd: 79,
        stripe_price_lookup_key: 'directory_elite_monthly',
        features: [
            'Everything in Verified Pro',
            'Top-of-corridor priority placement',
            'Leaderboard visibility boost',
            'Advanced analytics + competitor insights',
            'Dispute protection priority',
            'AI-enhanced profile optimization',
            'Corridor demand alerts',
            'Dedicated support queue',
        ],
        limits: {
            monthly_leads: 'unlimited',
            photo_slots: 50,
            analytics: 'advanced',
        },
        target_margin: 0.85,
    },
    {
        tier: 'enterprise',
        platform: 'directory',
        name: 'Fleet / Enterprise',
        tagline: 'Multi-vehicle operations and API access',
        base_price_usd: 999,
        stripe_price_lookup_key: 'directory_enterprise_monthly',
        features: [
            'Everything in Corridor Elite',
            'Multi-vehicle fleet management',
            'API access',
            'Custom branding',
            'Dedicated account manager',
            'White-label options',
            'Bulk operator management',
            'SLA guarantees',
        ],
        limits: {
            monthly_leads: 'unlimited',
            photo_slots: 'unlimited',
            analytics: 'enterprise',
        },
        target_margin: 0.88,
    },
];

// ============================================================
// MOBILE APP PRICING TIERS (App Store Compliant)
// ============================================================

export const MOBILE_PLANS: PricePlan[] = [
    {
        tier: 'free',
        platform: 'mobile',
        name: 'Mobile Free',
        tagline: 'Essential tools on the go',
        base_price_usd: 0,
        stripe_price_lookup_key: 'mobile_free',
        features: [
            'View directory listings',
            'Basic map access',
            'Profile management',
            'Push notification alerts (limited)',
        ],
        limits: {
            daily_searches: 10,
            contacts_per_month: 3,
            map_layers: 'basic',
        },
        target_margin: 0,
    },
    {
        tier: 'pro',
        platform: 'mobile',
        name: 'Mobile Basic',
        tagline: 'Never miss a load',
        base_price_usd: 4.99,
        stripe_price_lookup_key: 'mobile_basic_monthly',
        features: [
            'Unlimited job alerts',
            'Basic map access',
            'Contact brokers directly',
            'Profile boost (mobile)',
            'Push notifications',
        ],
        limits: {
            daily_searches: 'unlimited',
            contacts_per_month: 25,
            map_layers: 'basic',
        },
        target_margin: 0.75,
    },
    {
        tier: 'elite',
        platform: 'mobile',
        name: 'Mobile Pro',
        tagline: 'Smart matching and route intelligence',
        base_price_usd: 24.99,
        stripe_price_lookup_key: 'mobile_pro_monthly',
        features: [
            'Everything in Mobile Basic',
            'Full live job feed',
            'Smart match priority ranking',
            'Route intelligence (basic)',
            'Corridor activity alerts',
            'Enhanced profile visibility',
            'Crowd signal reporting',
        ],
        limits: {
            daily_searches: 'unlimited',
            contacts_per_month: 'unlimited',
            map_layers: 'route_intel',
        },
        target_margin: 0.82,
        highlight: true,
    },
    {
        tier: 'enterprise',
        platform: 'mobile',
        name: 'Mobile Elite',
        tagline: 'Full corridor intelligence and AI dispatch',
        base_price_usd: 59.99,
        stripe_price_lookup_key: 'mobile_elite_monthly',
        features: [
            'Everything in Mobile Pro',
            'Real-time corridor intelligence',
            'Demand heatmaps',
            'Priority dispatch signals',
            'AI assistant features',
            'Advanced Waze-style alerts',
            'Earnings forecasting',
            'Leaderboard fast-track',
        ],
        limits: {
            daily_searches: 'unlimited',
            contacts_per_month: 'unlimited',
            map_layers: 'full_intelligence',
        },
        target_margin: 0.85,
    },
];

// ============================================================
// HELPERS
// ============================================================

export function getPPPMultiplier(countryCode: string): number {
    for (const tier of PPP_TIERS) {
        if (tier.countries.includes(countryCode)) return tier.multiplier;
    }
    return 0.58; // Default to tier_c for unknown countries
}

export function getLocalizedPrice(basePriceUsd: number, countryCode: string): number {
    const multiplier = getPPPMultiplier(countryCode);
    const adjusted = basePriceUsd * multiplier;

    // Cost floor enforcement
    if (basePriceUsd > 0) {
        const floor = computeBreakEvenPrice(multiplier);
        if (adjusted < floor) return Math.ceil(floor * 100) / 100;
    }

    // Psychological rounding
    if (adjusted <= 0) return 0;
    if (adjusted < 10) return Math.round(adjusted * 100) / 100; // Keep cents for low prices
    return Math.round(adjusted) - 0.01; // e.g., $23.99
}

export function getAllPlans(): PricePlan[] {
    return [...DIRECTORY_PLANS, ...MOBILE_PLANS];
}

export function getPlanByLookupKey(key: string): PricePlan | undefined {
    return getAllPlans().find(p => p.stripe_price_lookup_key === key);
}

export function getDirectoryPlans(): PricePlan[] {
    return DIRECTORY_PLANS;
}

export function getMobilePlans(): PricePlan[] {
    return MOBILE_PLANS;
}
