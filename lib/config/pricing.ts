// ══════════════════════════════════════════════════════════════
// lib/config/pricing.ts — Haul Command Pricing Config
// Single source of truth for all tiers and feature gates.
// US-first launch. Hybrid model: subscription + per-match fee.
// ══════════════════════════════════════════════════════════════

export const PRICING = {
    /** Match fee charged to broker on successful fill */
    MATCH_FEE_USD: 24,           // $19–$29 sweet spot
    MATCH_FEE_RANGE: { min: 19, max: 29 },

    /** Load boost cost (broker pays to surface load top-of-feed) */
    LOAD_BOOST_USD: 14,

    ESCORT: {
        FREE: {
            id: "free",
            label: "Free",
            price_monthly: 0,
            features: [
                "Basic directory presence",
                "Limited job alerts (3/day)",
                "Standard ranking",
                "View corridor heat",
            ],
            gates: {
                job_alerts_per_day: 3,
                priority_ranking: false,
                analytics: false,
                weather_overlay: false,
                equipment_filters: false,
                profile_boost: false,
                unlimited_corridor_saves: false,
            },
        },
        PRO: {
            id: "pro",
            label: "Pro",
            price_monthly: 49,
            badge_label: "PRO",
            features: [
                "Unlimited job alerts",
                "Priority ranking in directory",
                "Verified ring on profile",
                "Live analytics (earnings trend, response rate)",
                "Weather + wind overlay on map",
                "Equipment filter access",
                "Unlimited corridor saves",
                "Early access loads",
            ],
            gates: {
                job_alerts_per_day: Infinity,
                priority_ranking: true,
                analytics: true,
                weather_overlay: true,
                equipment_filters: true,
                profile_boost: true,
                unlimited_corridor_saves: true,
            },
        },
        ELITE: {
            id: "elite",
            label: "Elite",
            price_monthly: 79,
            badge_label: "ELITE",
            available: false, // launch after Pro has traction
            features: [
                "Everything in Pro",
                "Top-of-leaderboard priority pin",
                "Broker memory graph access",
                "Dedicated account manager",
                "Custom corridor analytics report",
            ],
            gates: {
                leaderboard_pin: true,
                broker_memory: true,
                account_manager: true,
            },
        },
    },

    BROKER: {
        FREE: {
            id: "broker_free",
            label: "Free",
            price_monthly: 0,
            features: [
                "Browse full directory",
                "Post unlimited loads",
                "Pay only per successful match",
            ],
        },
        SEAT: {
            id: "broker_seat",
            label: "Broker Seat",
            price_monthly: 149,
            features: [
                "10 load boost credits/month",
                "Smart Match access",
                "Days-to-Pay history visible to escorts",
                "Priority in Smart Match recommendations",
                "Sponsored directory slot (1/month)",
            ],
        },
    },

    SPONSORED_SLOT: {
        directory_featured_monthly: 199,
        leaderboard_pin_monthly: 99,
    },
} as const;

/** Feature gate check — returns true if the user's tier unlocks the feature */
export function hasFeature(
    tier: "free" | "pro" | "elite",
    feature: keyof typeof PRICING.ESCORT.PRO.gates
): boolean {
    if (tier === "elite") return true;
    if (tier === "pro") return PRICING.ESCORT.PRO.gates[feature] as boolean;
    return PRICING.ESCORT.FREE.gates[feature] as boolean;
}

/** Format a price for display */
export function formatPrice(usd: number): string {
    return usd === 0 ? "Free" : `$${usd}`;
}
