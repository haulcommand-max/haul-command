// ════════════════════════════════════════════════════════════════
// lib/monetization/sponsor-pricing.ts
// CANONICAL Sponsor Pricing Engine
//
// Architecture Decision (Opus, 2026-04-03):
//   Flat $299/mo across all territories is leaving money on the table.
//   Texas ($499) and Vermont ($149) do not have the same value proposition.
//
//   This engine defines the pricing model for ALL sponsor products:
//   - Territory (state-level)
//   - Territory (country-level)
//   - Corridor
//   - Port
//   - Platform-wide
//
// Strategy rationale:
//   1. ANCHOR HIGH on top-value territories (TX, CA, FL) — these sell themselves
//   2. FILL RATE on smaller states — low price → high occupancy → revenue floor
//   3. GLOBAL PPP via existing pricingMultiplier system
//   4. NEVER show "from $X" — show exact price per territory (transparency = trust)
//   5. Annual discount (15%) to lock in recurring revenue + reduce churn
//
// Usage:
//   import { getTerritoryPrice, getCorridorPrice, getPortPrice } from '@/lib/monetization/sponsor-pricing'
// ════════════════════════════════════════════════════════════════

// ── US State Market Tiers ─────────────────────────────────────
// Based on three signals:
//   1. Oversize/heavy-haul permit volume (FHWA + state DOT data proxies)
//   2. Number of published Haul Command pages in that state (content density)
//   3. Corridor intersection count (how many major routes cross the state)

export type USMarketTier = 'mega' | 'major' | 'mid' | 'growth' | 'emerging';

interface USMarketConfig {
    tier: USMarketTier;
    label: string;
    priceMonthly: number;           // USD
    priceAnnualMonthly: number;     // USD (per month, billed annually)
    rationale: string;
}

export const US_MARKET_TIERS: Record<USMarketTier, USMarketConfig> = {
    mega: {
        tier: 'mega',
        label: 'Mega Market',
        priceMonthly: 499,
        priceAnnualMonthly: 424,    // ~15% discount
        rationale: 'Top-3 heavy haul states by permit volume. Multiple major corridors. Port-adjacent.',
    },
    major: {
        tier: 'major',
        label: 'Major Market',
        priceMonthly: 399,
        priceAnnualMonthly: 339,
        rationale: 'Top-10 states by heavy haul volume with strong corridor coverage.',
    },
    mid: {
        tier: 'mid',
        label: 'Mid Market',
        priceMonthly: 299,
        priceAnnualMonthly: 254,
        rationale: 'Active heavy haul states with moderate corridor density.',
    },
    growth: {
        tier: 'growth',
        label: 'Growth Market',
        priceMonthly: 199,
        priceAnnualMonthly: 169,
        rationale: 'Emerging heavy haul activity. Excellent early-mover pricing — locks in lower rate.',
    },
    emerging: {
        tier: 'emerging',
        label: 'Emerging Market',
        priceMonthly: 149,
        priceAnnualMonthly: 127,
        rationale: 'Low current volume but growing. First-mover advantage: own the state before demand peaks.',
    },
};

// ── State → Tier Mapping ──────────────────────────────────────
// Methodology:
//   MEGA:     Top 3 states by annual oversize permits + multi-corridor + port
//   MAJOR:    Top 4-10 by permits + at least one major corridor
//   MID:      Top 11-25 by permits or strong corridor presence
//   GROWTH:   States 26-40 by permits, or states with emerging wind/solar/LNG projects
//   EMERGING: States 41-50, small states, or states with minimal heavy haul traffic

export const US_STATE_MARKET_TIER: Record<string, USMarketTier> = {
    // ── MEGA ($499/mo) ──
    TX: 'mega',   // #1 oversize permits, I-35/I-10/I-45, Texas Triangle, 4 major ports
    CA: 'mega',   // #2 oversize permits, Long Beach/Oakland, massive infrastructure
    FL: 'mega',   // #3 permits, Jacksonville/Tampa/Miami ports, wind energy push

    // ── MAJOR ($399/mo) ──
    OK: 'major',  // I-35/I-40 intersection, wind energy capital, oil-field hauls
    OH: 'major',  // Manufacturing heartland, I-70/I-71/I-90, Great Lakes
    PA: 'major',  // Northeast anchor, I-76/I-80/I-95, major infrastructure projects
    IL: 'major',  // Chicago logistics hub, I-55/I-57/I-80
    GA: 'major',  // Port of Savannah (#4 US), I-75/I-85
    LA: 'major',  // Port of New Orleans, LNG export, petrochemical corridor
    IN: 'major',  // Indianapolis crossroads, I-65/I-69/I-70

    // ── MID ($299/mo) ──
    NC: 'mid',    // Growing wind energy, I-40/I-85
    WA: 'mid',    // Ports of Seattle/Tacoma, eastern WA wind
    NY: 'mid',    // Port of NY/NJ, massive construction projects
    NJ: 'mid',    // Port of NY/NJ (shared), turnpike corridor
    MI: 'mid',    // Auto industry, Great Lakes ports
    MN: 'mid',    // Wind energy, I-35 northern terminus
    WI: 'mid',    // I-94 corridor, dairy belt infrastructure
    MO: 'mid',    // I-70 crossroads, Kansas City logistics
    VA: 'mid',    // Port of Virginia, I-81 corridor
    TN: 'mid',    // Nashville/Memphis crossroads, I-40/I-65
    SC: 'mid',    // Port of Charleston, BMW/Volvo plants
    CO: 'mid',    // I-25/I-70, Denver hub, wind + solar
    AZ: 'mid',    // I-10/I-17, solar energy projects
    AL: 'mid',    // Port of Mobile, I-65
    KS: 'mid',    // Wind energy capacity, I-70/I-35 crossover

    // ── GROWTH ($199/mo) ──
    KY: 'growth', // I-65/I-64, UPS WorldPort
    MS: 'growth', // Gulf coast, I-20/I-55
    AR: 'growth', // I-40/I-30 crossroads
    IA: 'growth', // Wind energy top 5 US, I-80/I-35
    NE: 'growth', // I-80 corridor, wind energy
    ND: 'growth', // Oil (Bakken), wind energy boom
    SD: 'growth', // Wind energy, I-90
    NM: 'growth', // I-40/I-25, oil + solar
    OR: 'growth', // Port of Portland, I-5/I-84
    UT: 'growth', // I-15/I-80, mining + solar
    NV: 'growth', // I-80, Reno logistics boom, solar
    WV: 'growth', // Natural gas, I-64/I-77
    MT: 'growth', // Wind energy, I-90/I-15
    ID: 'growth', // I-84, growing logistics
    WY: 'growth', // Wind energy, I-80/I-25

    // ── EMERGING ($149/mo) ──
    ME: 'emerging',  // I-95 terminus, wind energy starting
    NH: 'emerging',  // Small state, I-93
    VT: 'emerging',  // Minimal heavy haul
    MA: 'emerging',  // Port of Boston, but small territory
    CT: 'emerging',  // I-95 corridor pass-through
    RI: 'emerging',  // Smallest state
    DE: 'emerging',  // I-95 pass-through, Port of Wilmington
    MD: 'emerging',  // Port of Baltimore (growing after Key Bridge rebuild)
    DC: 'emerging',  // Not a state but we may sell metro
    HI: 'emerging',  // Island — limited heavy haul market
    AK: 'emerging',  // Remote, seasonal, but resource extraction
};

// ── Global Country Sponsor Pricing ────────────────────────────
// Uses the existing tier system from lib/config/country-registry.ts
// pricingMultiplier: gold=1.0, blue=0.85, silver=0.65, slate=0.55

export type GlobalMarketTier = 'gold' | 'blue' | 'silver' | 'slate';

interface GlobalCountryPricing {
    tier: GlobalMarketTier;
    baseMonthly: number;         // USD
    maxSlots: number;
}

// Base price for gold tier countries, then multiplied by pricingMultiplier
const COUNTRY_BASE_MONTHLY = 399;

export const GLOBAL_SPONSOR_PRICING: Record<GlobalMarketTier, GlobalCountryPricing> = {
    gold:   { tier: 'gold',   baseMonthly: 399,  maxSlots: 2 },    // US, CA, AU, GB, NZ, ZA, DE, NL, AE, BR
    blue:   { tier: 'blue',   baseMonthly: 339,  maxSlots: 2 },    // IE, SE, NO, ... (0.85×)
    silver: { tier: 'silver', baseMonthly: 259,  maxSlots: 1 },    // PL, CZ, TR, JP, ... (0.65×)
    slate:  { tier: 'slate',  baseMonthly: 219,  maxSlots: 1 },    // UY, PA, CR (0.55×)
};

// ── Corridor Pricing ──────────────────────────────────────────
export type CorridorTier = 'flagship' | 'primary' | 'secondary';

interface CorridorPricing {
    tier: CorridorTier;
    priceMonthly: number;
    priceAnnualMonthly: number;
}

export const CORRIDOR_TIERS: Record<CorridorTier, CorridorPricing> = {
    flagship:  { tier: 'flagship',  priceMonthly: 349,  priceAnnualMonthly: 297 },   // Texas Triangle, I-35+I-10
    primary:   { tier: 'primary',   priceMonthly: 249,  priceAnnualMonthly: 212 },   // I-40, I-80, I-95
    secondary: { tier: 'secondary', priceMonthly: 179,  priceAnnualMonthly: 152 },   // All others
};

export const CORRIDOR_TIER_MAP: Record<string, CorridorTier> = {
    'texas-triangle': 'flagship',
    'i-35':           'flagship',
    'i-10':           'flagship',
    'i-95':           'primary',
    'i-80':           'primary',
    'i-40':           'primary',
    'i-70':           'primary',
    'i-90':           'secondary',
    'i-75':           'secondary',
    'i-65':           'secondary',
    'i-20':           'secondary',
    'i-15':           'secondary',
    'i-25':           'secondary',
};

// ── Port Pricing ──────────────────────────────────────────────
export type PortTier = 'tier1' | 'tier2' | 'tier3';

interface PortPricing {
    tier: PortTier;
    priceMonthly: number;
    priceAnnualMonthly: number;
    maxSlots: number;
}

export const PORT_TIERS: Record<PortTier, PortPricing> = {
    tier1: { tier: 'tier1', priceMonthly: 599, priceAnnualMonthly: 509, maxSlots: 2 },  // Long Beach, Houston
    tier2: { tier: 'tier2', priceMonthly: 449, priceAnnualMonthly: 382, maxSlots: 2 },  // NY/NJ, Savannah
    tier3: { tier: 'tier3', priceMonthly: 299, priceAnnualMonthly: 254, maxSlots: 3 },  // All others
};

export const PORT_TIER_MAP: Record<string, PortTier> = {
    'port-of-long-beach':  'tier1',
    'port-of-houston':     'tier1',
    'port-of-new-york':    'tier2',
    'port-of-savannah':    'tier2',
    'port-of-seattle':     'tier2',
    'port-of-virginia':    'tier2',
    'port-of-charleston':  'tier3',
    'port-of-mobile':      'tier3',
    'port-of-portland':    'tier3',
    'port-of-oakland':     'tier2',
};

// ════════════════════════════════════════════════════════════════
// PUBLIC API — What the rest of the app imports
// ════════════════════════════════════════════════════════════════

/** Get territory price for a US state */
export function getTerritoryPrice(stateCode: string): {
    tier: USMarketTier;
    config: USMarketConfig;
    priceMonthly: number;
    priceAnnualMonthly: number;
    priceMonthlyCents: number;
    priceAnnualMonthlyCents: number;
    savingsPercent: number;
} {
    const tier = US_STATE_MARKET_TIER[stateCode.toUpperCase()] ?? 'emerging';
    const config = US_MARKET_TIERS[tier];
    return {
        tier,
        config,
        priceMonthly: config.priceMonthly,
        priceAnnualMonthly: config.priceAnnualMonthly,
        priceMonthlyCents: config.priceMonthly * 100,
        priceAnnualMonthlyCents: config.priceAnnualMonthly * 100,
        savingsPercent: Math.round((1 - config.priceAnnualMonthly / config.priceMonthly) * 100),
    };
}

/** Get territory price for a country */
export function getCountryTerritoryPrice(countryCode: string, countryTier: GlobalMarketTier = 'slate'): {
    tier: GlobalMarketTier;
    priceMonthly: number;
    priceMonthlyCents: number;
    maxSlots: number;
} {
    const pricing = GLOBAL_SPONSOR_PRICING[countryTier];
    return {
        tier: countryTier,
        priceMonthly: pricing.baseMonthly,
        priceMonthlyCents: pricing.baseMonthly * 100,
        maxSlots: pricing.maxSlots,
    };
}

/** Get price for a corridor sponsorship */
export function getCorridorPrice(corridorSlug: string): {
    tier: CorridorTier;
    priceMonthly: number;
    priceAnnualMonthly: number;
    priceMonthlyCents: number;
} {
    const tier = CORRIDOR_TIER_MAP[corridorSlug] ?? 'secondary';
    const config = CORRIDOR_TIERS[tier];
    return {
        tier,
        priceMonthly: config.priceMonthly,
        priceAnnualMonthly: config.priceAnnualMonthly,
        priceMonthlyCents: config.priceMonthly * 100,
    };
}

/** Get price for a port sponsorship */
export function getPortPrice(portSlug: string): {
    tier: PortTier;
    priceMonthly: number;
    priceAnnualMonthly: number;
    priceMonthlyCents: number;
    maxSlots: number;
} {
    const tier = PORT_TIER_MAP[portSlug] ?? 'tier3';
    const config = PORT_TIERS[tier];
    return {
        tier,
        priceMonthly: config.priceMonthly,
        priceAnnualMonthly: config.priceAnnualMonthly,
        priceMonthlyCents: config.priceMonthly * 100,
        maxSlots: config.maxSlots,
    };
}

// ── Revenue projection (for internal use by report cards) ─────
export function projectAnnualTerritoryRevenue(params: {
    occupancyRate: number;          // 0-1 (e.g. 0.40 = 40% of territories sold)
    statesTierDistribution?: Record<USMarketTier, number>;
}): { monthly: number; annual: number; territories: number } {
    const dist = params.statesTierDistribution ?? {
        mega: 3,     // TX, CA, FL
        major: 7,    // OK, OH, PA, IL, GA, LA, IN
        mid: 15,     // NC, WA, NY, NJ, MI, MN, WI, MO, VA, TN, SC, CO, AZ, AL, KS
        growth: 15,  // KY, MS, AR, IA, NE, ND, SD, NM, OR, UT, NV, WV, MT, ID, WY
        emerging: 10,// ME, NH, VT, MA, CT, RI, DE, MD, HI, AK
    };

    let totalMonthly = 0;
    let totalTerritories = 0;

    for (const [tier, count] of Object.entries(dist) as [USMarketTier, number][]) {
        const occupied = Math.round(count * params.occupancyRate);
        totalMonthly += occupied * US_MARKET_TIERS[tier].priceMonthly;
        totalTerritories += occupied;
    }

    return {
        monthly: totalMonthly,
        annual: totalMonthly * 12,
        territories: totalTerritories,
    };
}

// ── Price display helper ──────────────────────────────────────
export function formatSponsorPrice(cents: number): string {
    return `$${Math.round(cents / 100)}`;
}

export function getTierBadgeColor(tier: USMarketTier | CorridorTier | PortTier | GlobalMarketTier): string {
    const colors: Record<string, string> = {
        mega: 'text-amber-400',
        major: 'text-blue-400',
        mid: 'text-gray-300',
        growth: 'text-green-400',
        emerging: 'text-gray-500',
        flagship: 'text-amber-400',
        primary: 'text-blue-400',
        secondary: 'text-gray-300',
        tier1: 'text-amber-400',
        tier2: 'text-blue-400',
        tier3: 'text-gray-300',
        gold: 'text-amber-400',
        blue: 'text-blue-400',
        silver: 'text-gray-400',
        slate: 'text-gray-500',
    };
    return colors[tier] ?? 'text-gray-400';
}
