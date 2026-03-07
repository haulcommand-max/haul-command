// ══════════════════════════════════════════════════════════════
// MONETIZATION CLOSURE ENGINE
// Spec: HC_DOMINATION_PATCH_V1 Phase 5
// Purpose: Every eyeball that hits Haul Command encounters
//          a revenue surface. Premium, ads, alerts, API.
// ══════════════════════════════════════════════════════════════

// ── Revenue Surfaces ──

export interface RevenueSurface {
    id: string;
    name: string;
    type: "subscription" | "transaction" | "lead_gen" | "advertising" | "api" | "data";
    targetAudience: "escort" | "broker" | "carrier" | "agency" | "enterprise";
    pricingModel: PricingModel;
    activationTrigger: string;
    conversionGoal: string;
    estimatedArpuMonthly: number; // USD
}

export interface PricingModel {
    type: "flat" | "tiered" | "usage" | "freemium" | "auction" | "cpm";
    basePrice?: number;
    currency: string;
    tiers?: PricingTier[];
}

export interface PricingTier {
    name: string;
    price: number;
    interval: "monthly" | "annually" | "per_use";
    features: string[];
    limits?: Record<string, number>;
}

// ── Premium Subscription Tiers ──

export const ESCORT_SUBSCRIPTION_TIERS: PricingTier[] = [
    {
        name: "Free",
        price: 0,
        interval: "monthly",
        features: [
            "Basic directory listing",
            "Standard profile",
            "1 operating region",
            "Community support",
        ],
        limits: { regions: 1, photos: 3, monthlyLeads: 5 },
    },
    {
        name: "Pro",
        price: 29,
        interval: "monthly",
        features: [
            "Verified badge",
            "Priority listing",
            "5 operating regions",
            "Lead alerts",
            "Analytics dashboard",
            "Equipment showcase",
            "Availability calendar",
            "Direct messaging",
        ],
        limits: { regions: 5, photos: 20, monthlyLeads: 50 },
    },
    {
        name: "Elite",
        price: 79,
        interval: "monthly",
        features: [
            "Verified + Certified badge",
            "Top listing placement",
            "Unlimited regions",
            "Priority lead matching",
            "Advanced analytics",
            "Route intelligence",
            "Competitor insights",
            "Dedicated support",
            "API access",
            "Custom branding",
        ],
        limits: { regions: -1, photos: -1, monthlyLeads: -1 },
    },
];

export const BROKER_SUBSCRIPTION_TIERS: PricingTier[] = [
    {
        name: "Free",
        price: 0,
        interval: "monthly",
        features: [
            "Directory search",
            "Basic coverage map",
            "3 searches per day",
        ],
        limits: { dailySearches: 3, savedRoutes: 1, coverageAlerts: 0 },
    },
    {
        name: "Business",
        price: 99,
        interval: "monthly",
        features: [
            "Unlimited searches",
            "Coverage confidence scores",
            "Corridor risk reports",
            "Coverage gap alerts",
            "Saved routes",
            "Bulk escort matching",
            "Priority support",
        ],
        limits: { dailySearches: -1, savedRoutes: 25, coverageAlerts: 10 },
    },
    {
        name: "Enterprise",
        price: 499,
        interval: "monthly",
        features: [
            "Everything in Business",
            "API access",
            "Custom risk dashboards",
            "White-label reports",
            "Dedicated account manager",
            "SLA guarantee",
            "Predictive demand overlay",
            "Carrier intelligence pages",
            "Real-time liquidity feed",
            "Multi-seat licensing",
        ],
        limits: { dailySearches: -1, savedRoutes: -1, coverageAlerts: -1 },
    },
];

// ── Revenue Surfaces Catalog ──

export const REVENUE_SURFACES: RevenueSurface[] = [
    {
        id: "escort_pro",
        name: "Escort Pro Subscription",
        type: "subscription",
        targetAudience: "escort",
        pricingModel: { type: "tiered", currency: "USD", tiers: ESCORT_SUBSCRIPTION_TIERS },
        activationTrigger: "Profile claim → 3rd lead received",
        conversionGoal: "Free → Pro upgrade",
        estimatedArpuMonthly: 29,
    },
    {
        id: "escort_elite",
        name: "Escort Elite Subscription",
        type: "subscription",
        targetAudience: "escort",
        pricingModel: { type: "tiered", currency: "USD", tiers: ESCORT_SUBSCRIPTION_TIERS },
        activationTrigger: "Pro user hitting lead limit",
        conversionGoal: "Pro → Elite upgrade",
        estimatedArpuMonthly: 79,
    },
    {
        id: "broker_business",
        name: "Broker Business Plan",
        type: "subscription",
        targetAudience: "broker",
        pricingModel: { type: "tiered", currency: "USD", tiers: BROKER_SUBSCRIPTION_TIERS },
        activationTrigger: "3rd search → paywall",
        conversionGoal: "Free → Business upgrade",
        estimatedArpuMonthly: 99,
    },
    {
        id: "broker_enterprise",
        name: "Broker Enterprise Plan",
        type: "subscription",
        targetAudience: "enterprise",
        pricingModel: { type: "tiered", currency: "USD", tiers: BROKER_SUBSCRIPTION_TIERS },
        activationTrigger: "Multi-corridor usage detected",
        conversionGoal: "Business → Enterprise upgrade",
        estimatedArpuMonthly: 499,
    },
    {
        id: "lead_generation",
        name: "Escort Lead Generation",
        type: "lead_gen",
        targetAudience: "escort",
        pricingModel: { type: "usage", basePrice: 5, currency: "USD" },
        activationTrigger: "Broker requests escort",
        conversionGoal: "Lead delivered → escort accepts",
        estimatedArpuMonthly: 50,
    },
    {
        id: "premium_placement",
        name: "Premium Directory Placement",
        type: "advertising",
        targetAudience: "escort",
        pricingModel: { type: "auction", currency: "USD" },
        activationTrigger: "Competitive geo zone",
        conversionGoal: "Bid → top placement → lead",
        estimatedArpuMonthly: 45,
    },
    {
        id: "corridor_sponsorship",
        name: "Corridor Sponsorship",
        type: "advertising",
        targetAudience: "escort",
        pricingModel: { type: "flat", basePrice: 199, currency: "USD" },
        activationTrigger: "High-traffic corridor page",
        conversionGoal: "Sponsor badge on corridor page",
        estimatedArpuMonthly: 199,
    },
    {
        id: "coverage_api",
        name: "Coverage Intelligence API",
        type: "api",
        targetAudience: "enterprise",
        pricingModel: { type: "usage", basePrice: 0.05, currency: "USD" },
        activationTrigger: "Enterprise onboarding",
        conversionGoal: "API integration → recurring usage",
        estimatedArpuMonthly: 1500,
    },
    {
        id: "data_exports",
        name: "Market Intelligence Data",
        type: "data",
        targetAudience: "agency",
        pricingModel: { type: "flat", basePrice: 299, currency: "USD" },
        activationTrigger: "Research request",
        conversionGoal: "Data purchase",
        estimatedArpuMonthly: 299,
    },
    {
        id: "coverage_alerts",
        name: "Coverage Gap Alerts",
        type: "subscription",
        targetAudience: "broker",
        pricingModel: { type: "flat", basePrice: 19, currency: "USD" },
        activationTrigger: "Route with low coverage score",
        conversionGoal: "Alert signup → retained subscriber",
        estimatedArpuMonthly: 19,
    },
];

// ── Revenue Projection ──

export interface RevenueProjection {
    surface: string;
    monthlyUsers: number;
    conversionRate: number;
    arpu: number;
    monthlyRevenue: number;
}

export function projectRevenue(
    surfaceId: string,
    monthlyVisitors: number,
    conversionRate: number
): RevenueProjection {
    const surface = REVENUE_SURFACES.find(s => s.id === surfaceId);
    if (!surface) return { surface: surfaceId, monthlyUsers: 0, conversionRate: 0, arpu: 0, monthlyRevenue: 0 };

    const convertedUsers = Math.round(monthlyVisitors * conversionRate);
    return {
        surface: surface.name,
        monthlyUsers: convertedUsers,
        conversionRate,
        arpu: surface.estimatedArpuMonthly,
        monthlyRevenue: convertedUsers * surface.estimatedArpuMonthly,
    };
}

// ── Smart Paywall Logic ──

export interface PaywallDecision {
    show: boolean;
    reason: string;
    suggestedTier: string;
    urgencyLevel: "soft" | "medium" | "hard";
}

export function evaluatePaywall(
    userType: "escort" | "broker" | "carrier",
    currentTier: "free" | "pro" | "business" | "elite" | "enterprise",
    usage: { searches: number; leads: number; routes: number; daysActive: number }
): PaywallDecision {
    // Free escort hitting lead limit
    if (userType === "escort" && currentTier === "free" && usage.leads >= 5) {
        return { show: true, reason: "lead_limit_reached", suggestedTier: "Pro", urgencyLevel: "medium" };
    }

    // Free broker hitting search limit
    if (userType === "broker" && currentTier === "free" && usage.searches >= 3) {
        return { show: true, reason: "search_limit_reached", suggestedTier: "Business", urgencyLevel: "hard" };
    }

    // Pro escort with high volume
    if (userType === "escort" && currentTier === "pro" && usage.leads >= 40) {
        return { show: true, reason: "approaching_lead_cap", suggestedTier: "Elite", urgencyLevel: "soft" };
    }

    // Active user not yet converted after 7 days
    if (currentTier === "free" && usage.daysActive >= 7 && (usage.searches > 10 || usage.leads > 2)) {
        return { show: true, reason: "engaged_free_user", suggestedTier: userType === "broker" ? "Business" : "Pro", urgencyLevel: "soft" };
    }

    return { show: false, reason: "no_paywall", suggestedTier: "", urgencyLevel: "soft" };
}
