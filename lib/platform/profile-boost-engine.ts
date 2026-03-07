// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE BOOST & CLAIM ACCELERATOR — Carvana-Style Revenue From Attention
//
// Every unclaimed profile is a dormant revenue node. This engine:
//   1. Makes every profile claimable with progressive CTAs
//   2. Scores profile "boost potential" based on traffic + corridor heat
//   3. Creates tiered upgrade paths (Free → Verified → Premium → Bundle)
//   4. Dynamically adjusts boost pricing by country + demand
//   5. Generates "competitor claimed" pressure signals
//   6. Auto-sends claim invitations via email, SMS, VAPI voice
//   7. Powers the AdGrid with placement inventory from claimed profiles
//
// 1000X MULTIPLIER LOGIC:
//   2,500 US profiles × 52 countries × 3 place types avg = 390,000 entities
//   Each entity generates: profile page + city page + corridor page + port halo
//   = 1,560,000 indexable surfaces
//   Each surface has 3 ad slots = 4,680,000 monetizable impressions/month
//   Even at 0.1% claim rate = 390 paying businesses in month 1
//   At 1% = 3,900 paying businesses
//
// ═══════════════════════════════════════════════════════════════════════════════

import { COUNTRY_REGISTRY, getCountry, type Tier } from '../config/country-registry';
import { COUNTRY_RATE_TABLE } from '../pricing/global-rate-index';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type BoostTier = 'free' | 'verified' | 'premium' | 'featured' | 'dominant';

export interface ProfileBoostConfig {
    tier: BoostTier;
    name: string;
    monthlyPriceUsd: number;
    benefits: string[];
    visibilityMultiplier: number;   // 1× = baseline, 5× = top of results
    adSlotsUnlocked: number;
    badgeType: string;
    searchRankWeight: number;       // additive boost to search ranking
    corridorVisibility: boolean;
    portHaloVisibility: boolean;
    competitorInsights: boolean;
    leadCapture: boolean;
    callTracking: boolean;
    analyticsAccess: 'none' | 'basic' | 'advanced' | 'full';
}

export interface ClaimCTA {
    headline: string;
    subtext: string;
    ctaButtonText: string;
    urgencyText?: string;
    socialProofText?: string;
    competitorPressure?: string;
    estimatedValue?: string;
}

export interface BoostOffer {
    placeId: string;
    countryCode: string;
    currentTier: BoostTier;
    availableTiers: ProfileBoostConfig[];
    estimatedMonthlyViews: number;
    estimatedMonthlyLeads: number;
    corridorHeat: number;               // 0-1
    competitorsInArea: number;
    competitorsVerified: number;
    claimCTA: ClaimCTA;
    localPricing: {
        currency: string;
        tiers: { tier: BoostTier; priceLocal: number; priceUsd: number }[];
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOST TIER DEFINITIONS — The monetization ladder
// ═══════════════════════════════════════════════════════════════════════════════

export const BOOST_TIERS: ProfileBoostConfig[] = [
    {
        tier: 'free',
        name: 'Free Listing',
        monthlyPriceUsd: 0,
        benefits: [
            'Basic profile visible in directory',
            'Appear in city search results',
            'Receive reviews from drivers',
        ],
        visibilityMultiplier: 1.0,
        adSlotsUnlocked: 0,
        badgeType: 'none',
        searchRankWeight: 0,
        corridorVisibility: false,
        portHaloVisibility: false,
        competitorInsights: false,
        leadCapture: false,
        callTracking: false,
        analyticsAccess: 'none',
    },
    {
        tier: 'verified',
        name: 'Verified Business',
        monthlyPriceUsd: 19,
        benefits: [
            '✅ Verified badge on profile',
            '📈 2× visibility in search results',
            '📧 Lead capture form on profile',
            '📊 Basic view analytics',
            '🗂️ Edit hours, photos, services',
        ],
        visibilityMultiplier: 2.0,
        adSlotsUnlocked: 0,
        badgeType: 'verified',
        searchRankWeight: 15,
        corridorVisibility: false,
        portHaloVisibility: false,
        competitorInsights: false,
        leadCapture: true,
        callTracking: false,
        analyticsAccess: 'basic',
    },
    {
        tier: 'premium',
        name: 'Premium Placement',
        monthlyPriceUsd: 49,
        benefits: [
            '⭐ Everything in Verified',
            '🔝 Top of city & region results',
            '🛣️ Featured on corridor pages',
            '📞 Call tracking with analytics',
            '📊 Advanced traffic analytics',
            '🏷️ Premium badge',
        ],
        visibilityMultiplier: 4.0,
        adSlotsUnlocked: 1,
        badgeType: 'premium',
        searchRankWeight: 35,
        corridorVisibility: true,
        portHaloVisibility: false,
        competitorInsights: false,
        leadCapture: true,
        callTracking: true,
        analyticsAccess: 'advanced',
    },
    {
        tier: 'featured',
        name: 'Featured Business',
        monthlyPriceUsd: 99,
        benefits: [
            '🏆 Everything in Premium',
            '🚢 Featured on port halo pages',
            '🔍 Competitor insights dashboard',
            '📱 Priority in mobile app results',
            '🎯 3 AdGrid campaign slots',
            '🥇 Featured badge with spotlight',
        ],
        visibilityMultiplier: 6.0,
        adSlotsUnlocked: 3,
        badgeType: 'featured',
        searchRankWeight: 55,
        corridorVisibility: true,
        portHaloVisibility: true,
        competitorInsights: true,
        leadCapture: true,
        callTracking: true,
        analyticsAccess: 'full',
    },
    {
        tier: 'dominant',
        name: 'Market Dominator',
        monthlyPriceUsd: 199,
        benefits: [
            '👑 Everything in Featured',
            '🏅 Exclusive city/corridor sponsorship',
            '📣 Category-level ad placement',
            '🎯 Unlimited AdGrid campaigns',
            '📈 Full competitor + market intelligence',
            '🤖 AI-powered lead scoring',
            '📞 Dedicated account manager',
        ],
        visibilityMultiplier: 10.0,
        adSlotsUnlocked: 10,
        badgeType: 'dominant',
        searchRankWeight: 80,
        corridorVisibility: true,
        portHaloVisibility: true,
        competitorInsights: true,
        leadCapture: true,
        callTracking: true,
        analyticsAccess: 'full',
    },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRY-AWARE PRICING — Affordability-adjusted boost pricing
// ═══════════════════════════════════════════════════════════════════════════════

const BOOST_PRICING_MULTIPLIERS: Record<string, number> = {
    // Gold
    US: 1.00, CA: 0.95, AU: 1.00, GB: 1.05, NZ: 0.90, ZA: 0.35,
    DE: 0.95, NL: 0.95, AE: 1.20, BR: 0.30,
    // Blue
    IE: 0.90, SE: 0.95, NO: 1.00, DK: 0.95, FI: 0.90, BE: 0.90,
    AT: 0.90, CH: 1.15, ES: 0.70, FR: 0.90, IT: 0.75, PT: 0.60,
    SA: 0.85, QA: 0.95, MX: 0.30,
    // Silver
    PL: 0.40, CZ: 0.45, SK: 0.40, HU: 0.35, SI: 0.50, EE: 0.45,
    LV: 0.40, LT: 0.40, HR: 0.40, RO: 0.35, BG: 0.30, GR: 0.50,
    TR: 0.25, KW: 0.85, OM: 0.70, BH: 0.75, SG: 0.90, MY: 0.35,
    JP: 0.90, KR: 0.75, CL: 0.35, AR: 0.20, CO: 0.20, PE: 0.20,
    // Slate
    UY: 0.30, PA: 0.40, CR: 0.35,
};

export function getBoostPricing(countryCode: string): {
    currency: string;
    tiers: { tier: BoostTier; name: string; priceLocal: number; priceUsd: number }[];
} {
    const mult = BOOST_PRICING_MULTIPLIERS[countryCode] ?? 0.50;
    const rateData = COUNTRY_RATE_TABLE[countryCode];
    const currency = rateData?.currency || 'USD';
    const fxRate = rateData ? rateData.baseDayRate / rateData.baseDayRateUsd : 1;

    return {
        currency,
        tiers: BOOST_TIERS.filter(t => t.monthlyPriceUsd > 0).map(t => {
            const adjustedUsd = Math.round(t.monthlyPriceUsd * mult);
            const localPrice = Math.round(adjustedUsd * fxRate);
            return {
                tier: t.tier,
                name: t.name,
                priceLocal: localPrice > 0 ? localPrice : adjustedUsd,
                priceUsd: adjustedUsd,
            };
        }),
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLAIM CTA GENERATOR — Psychologically tuned per context
// ═══════════════════════════════════════════════════════════════════════════════

export function generateClaimCTA(params: {
    placeName: string;
    placeType: string;
    countryCode: string;
    city?: string;
    monthlyViews: number;
    competitorsInArea: number;
    competitorsVerified: number;
    corridorHeat: number;
}): ClaimCTA {
    const country = getCountry(params.countryCode);
    const pricing = getBoostPricing(params.countryCode);
    const verifiedPrice = pricing.tiers.find(t => t.tier === 'verified');

    // Dynamic urgency based on competition
    const urgency = params.competitorsVerified > 0
        ? `${params.competitorsVerified} competitors in ${params.city || 'your area'} are already verified`
        : params.corridorHeat > 0.6
            ? `High demand corridor — drivers are searching now`
            : undefined;

    // Social proof
    const socialProof = params.monthlyViews > 100
        ? `${params.monthlyViews.toLocaleString()} drivers viewed businesses like yours this month`
        : params.monthlyViews > 20
            ? `Dozens of drivers search for ${params.placeType.replace(/_/g, ' ')}s in ${params.city || 'your area'} every week`
            : undefined;

    // Competitor pressure
    const competitorPressure = params.competitorsVerified > 0
        ? `${params.competitorsVerified} of ${params.competitorsInArea} ${params.placeType.replace(/_/g, ' ')}s near you already claimed and upgraded their listing`
        : params.competitorsInArea > 5
            ? `${params.competitorsInArea} ${params.placeType.replace(/_/g, ' ')}s compete for attention in ${params.city || 'your area'} — stand out with a verified badge`
            : undefined;

    // Value estimate
    const monthlyLeadValue = params.monthlyViews * 0.03; // 3% conversion to inquiry
    const estimatedValue = monthlyLeadValue > 1
        ? `~${Math.round(monthlyLeadValue)} potential customer inquiries/month from your Haul Command listing`
        : undefined;

    return {
        headline: `Is this your business?`,
        subtext: `Claim ${params.placeName} to update your hours, respond to reviews, and appear higher in search results.`,
        ctaButtonText: `Claim This Listing — Free`,
        urgencyText: urgency,
        socialProofText: socialProof,
        competitorPressure: competitorPressure,
        estimatedValue: estimatedValue,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOST OFFER BUILDER — Full upgrade pitch for a specific place
// ═══════════════════════════════════════════════════════════════════════════════

export function buildBoostOffer(params: {
    placeId: string;
    placeName: string;
    placeType: string;
    countryCode: string;
    city?: string;
    currentTier: BoostTier;
    monthlyViews: number;
    competitorsInArea: number;
    competitorsVerified: number;
    corridorHeat: number;
}): BoostOffer {
    const pricing = getBoostPricing(params.countryCode);
    const cta = generateClaimCTA(params);

    const currentTierIdx = BOOST_TIERS.findIndex(t => t.tier === params.currentTier);
    const availableTiers = BOOST_TIERS.filter((_, i) => i > currentTierIdx);

    return {
        placeId: params.placeId,
        countryCode: params.countryCode,
        currentTier: params.currentTier,
        availableTiers,
        estimatedMonthlyViews: params.monthlyViews,
        estimatedMonthlyLeads: Math.round(params.monthlyViews * 0.03),
        corridorHeat: params.corridorHeat,
        competitorsInArea: params.competitorsInArea,
        competitorsVerified: params.competitorsVerified,
        claimCTA: cta,
        localPricing: pricing,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEO SURFACE EXPLOSION — 1000X Multiplier from Profiles
//
// Each place generates multiple indexable pages:
//   1. /places/{type}/{slug}                    — Profile page
//   2. /{country}/places/{type}/{region}/{city}  — City aggregation
//   3. /{country}/corridor/{corridor}/places     — Corridor services
//   4. /{country}/port/{port}/nearby-services    — Port halo
//   5. /{country}/{region}/places                — Region aggregation
//   6. /{country}/places/{type}                  — National category
//
// With 150K places × 6 page types = 900,000 indexable URLs
// Add service variants (pilot-car, escort, route-survey) = 2.7M URLs
// Add hreflang variants = 5M+ crawlable surfaces
//
// ═══════════════════════════════════════════════════════════════════════════════

export interface SEOPageManifest {
    countryCode: string;
    pages: SEOPageEntry[];
    totalPages: number;
    estimatedIndexablePages: number;
}

export interface SEOPageEntry {
    url: string;
    pageType: 'profile' | 'city_aggregation' | 'region_aggregation' | 'national_category'
    | 'corridor_services' | 'port_halo' | 'service_variant';
    priority: number;       // 0.0-1.0 sitemap priority
    changeFreq: string;     // daily, weekly, monthly
    entityCount: number;    // how many entities on this page
    lastModified?: string;
}

export function generateSEOManifest(params: {
    countryCode: string;
    places: { placeType: string; slug: string; city?: string; region?: string }[];
    corridors: string[];
    ports: string[];
}): SEOPageManifest {
    const pages: SEOPageEntry[] = [];
    const cc = params.countryCode.toLowerCase();

    // Unique cities and regions
    const cities = new Set<string>();
    const regions = new Set<string>();
    const placeTypes = new Set<string>();

    for (const p of params.places) {
        if (p.city) cities.add(p.city.toLowerCase().replace(/\s+/g, '-'));
        if (p.region) regions.add(p.region.toLowerCase().replace(/\s+/g, '-'));
        placeTypes.add(p.placeType);

        // 1. Profile page
        pages.push({
            url: `/${cc}/places/${p.placeType}/${p.slug}`,
            pageType: 'profile',
            priority: 0.6,
            changeFreq: 'weekly',
            entityCount: 1,
        });
    }

    // 2. City aggregation pages (per type)
    for (const city of cities) {
        for (const type of placeTypes) {
            const matching = params.places.filter(p =>
                p.city?.toLowerCase().replace(/\s+/g, '-') === city && p.placeType === type,
            ).length;
            if (matching > 0) {
                pages.push({
                    url: `/${cc}/places/${type}/${city}`,
                    pageType: 'city_aggregation',
                    priority: 0.8,
                    changeFreq: 'daily',
                    entityCount: matching,
                });
            }
        }

        // City-level "all places" page
        pages.push({
            url: `/${cc}/places/all/${city}`,
            pageType: 'city_aggregation',
            priority: 0.7,
            changeFreq: 'daily',
            entityCount: params.places.filter(p =>
                p.city?.toLowerCase().replace(/\s+/g, '-') === city,
            ).length,
        });
    }

    // 3. Region aggregation
    for (const region of regions) {
        pages.push({
            url: `/${cc}/places/region/${region}`,
            pageType: 'region_aggregation',
            priority: 0.7,
            changeFreq: 'weekly',
            entityCount: params.places.filter(p =>
                p.region?.toLowerCase().replace(/\s+/g, '-') === region,
            ).length,
        });
    }

    // 4. National category pages
    for (const type of placeTypes) {
        pages.push({
            url: `/${cc}/places/${type}`,
            pageType: 'national_category',
            priority: 0.9,
            changeFreq: 'daily',
            entityCount: params.places.filter(p => p.placeType === type).length,
        });
    }

    // 5. Corridor service pages
    for (const corridor of params.corridors) {
        pages.push({
            url: `/${cc}/corridor/${corridor}/services`,
            pageType: 'corridor_services',
            priority: 0.8,
            changeFreq: 'weekly',
            entityCount: Math.ceil(params.places.length * 0.1), // ~10% overlap
        });
    }

    // 6. Port halo pages
    for (const port of params.ports) {
        pages.push({
            url: `/${cc}/port/${port}/nearby-services`,
            pageType: 'port_halo',
            priority: 0.9,
            changeFreq: 'daily',
            entityCount: Math.ceil(params.places.length * 0.05), // ~5% near ports
        });
    }

    return {
        countryCode: params.countryCode,
        pages,
        totalPages: pages.length,
        estimatedIndexablePages: pages.filter(p => p.entityCount > 0).length,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL 1000× SURFACE CALCULATOR — Show the CEO the math
// ═══════════════════════════════════════════════════════════════════════════════

export function calculate1000XSurface(): {
    totalPlaceTarget: number;
    totalSEOPages: number;
    totalMonetizableSlots: number;
    totalClaimableEntities: number;
    revenueProjection: {
        conservative: { claimRate: number; payingBusinesses: number; mrr: number; arr: number };
        moderate: { claimRate: number; payingBusinesses: number; mrr: number; arr: number };
        aggressive: { claimRate: number; payingBusinesses: number; mrr: number; arr: number };
    };
    byTier: {
        tier: string;
        countries: number;
        places: number;
        seoPages: number;
        adSlots: number;
    }[];
    compoundingEffects: string[];
} {
    const TIER_PLACES: Record<Tier, number> = {
        gold: 5000, blue: 2000, silver: 1000, slate: 200,
    };
    const TIER_CORRIDORS: Record<Tier, number> = {
        gold: 25, blue: 10, silver: 5, slate: 2,
    };
    const TIER_PORTS: Record<Tier, number> = {
        gold: 15, blue: 8, silver: 4, slate: 2,
    };
    const SEO_PAGES_PER_PLACE = 8; // avg pages generated per place
    const AD_SLOTS_PER_PAGE = 3;
    const AVG_BOOST_MRR_USD = 45; // avg revenue per paying business

    let totalPlaces = 0;
    let totalSEOPages = 0;
    let totalAdSlots = 0;

    const byTier: {
        tier: string; countries: number; places: number; seoPages: number; adSlots: number;
    }[] = [];

    for (const tier of ['gold', 'blue', 'silver', 'slate'] as Tier[]) {
        const countries = COUNTRY_REGISTRY.filter(c => c.tier === tier).length;
        const places = countries * TIER_PLACES[tier];
        const corridorPages = countries * TIER_CORRIDORS[tier];
        const portPages = countries * TIER_PORTS[tier];
        const seoPages = (places * SEO_PAGES_PER_PLACE) + corridorPages + portPages;
        const adSlots = seoPages * AD_SLOTS_PER_PAGE;

        totalPlaces += places;
        totalSEOPages += seoPages;
        totalAdSlots += adSlots;

        byTier.push({ tier, countries, places, seoPages, adSlots });
    }

    return {
        totalPlaceTarget: totalPlaces,
        totalSEOPages,
        totalMonetizableSlots: totalAdSlots,
        totalClaimableEntities: totalPlaces,
        revenueProjection: {
            conservative: {
                claimRate: 0.005,
                payingBusinesses: Math.round(totalPlaces * 0.005),
                mrr: Math.round(totalPlaces * 0.005 * AVG_BOOST_MRR_USD),
                arr: Math.round(totalPlaces * 0.005 * AVG_BOOST_MRR_USD * 12),
            },
            moderate: {
                claimRate: 0.02,
                payingBusinesses: Math.round(totalPlaces * 0.02),
                mrr: Math.round(totalPlaces * 0.02 * AVG_BOOST_MRR_USD),
                arr: Math.round(totalPlaces * 0.02 * AVG_BOOST_MRR_USD * 12),
            },
            aggressive: {
                claimRate: 0.05,
                payingBusinesses: Math.round(totalPlaces * 0.05),
                mrr: Math.round(totalPlaces * 0.05 * AVG_BOOST_MRR_USD),
                arr: Math.round(totalPlaces * 0.05 * AVG_BOOST_MRR_USD * 12),
            },
        },
        byTier,
        compoundingEffects: [
            'Each claimed profile adds 5-10 unique content signals (hours, photos, responses) → better SEO',
            'Each review adds fresh content → Google freshness signals → higher rankings',
            'Each corridor page cross-links 20+ places → PageRank flows to all',
            'Port halo pages capture highest-intent commercial queries → premium ad inventory',
            'YouTube corridor videos embed on 50+ pages each → dwell time + multimedia authority',
            'AI snippet blocks on every page → LLM citation → referral traffic loop',
            'VAPI voice outbound to unclaimed places → 15-25% claim rate → auto-monetization',
            'App store presence in 52 countries → deep links to profile pages → more traffic → more claims',
            'Huawei AppGallery in MY/SG captures Android users Google Play misses',
            'Samsung Galaxy Store free listing → incremental Android reach in 52 markets',
        ],
    };
}
