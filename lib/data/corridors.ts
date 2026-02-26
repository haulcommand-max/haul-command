/**
 * lib/data/corridors.ts
 *
 * Static corridor intelligence data for HC programmatic SEO pages.
 * Used by /corridors/[corridor]/page.tsx as fallback when seo_pages table
 * doesn't have an entry yet.
 *
 * Each entry provides:
 *   - SEO metadata
 *   - State-by-state requirements along the route
 *   - Supply/demand intelligence from the Corridor Liquidity Engine
 *   - GitHub-evaluated geospatial tools notes (turf.js, H3, etc.)
 */

export interface StateRequirements {
    state: string;
    stateCode: string;
    escortsRequired: string;          // "1 Front + 1 Rear"
    widthTriggerFt: number;           // escort required above this width
    heightTriggerFt: number;
    nightMovement: "allowed" | "restricted" | "prohibited";
    policeTriggerWidthFt: number;     // police escort above this width
    permitNotes: string;
}

export interface CorridorData {
    slug: string;                     // matches /corridors/[corridor] param
    displayName: string;              // "I-10 Gulf Coast"
    h1: string;
    metaTitle: string;
    metaDescription: string;
    endpoints: string;                // "Los Angeles, CA → Jacksonville, FL"
    totalMiles: number;
    primaryStates: string[];          // state codes along route
    supplyPct: number;                // 0–100 (mirrors CorridorStrip data)
    demandScore: number;
    operatorCount: number;
    hot: boolean;
    stateRequirements: StateRequirements[];
    keyRegulations: string[];
    brokerIntelNote: string;          // supply pressure copy for brokers
    escortIntelNote: string;          // positioning copy for operators
}

// ── Full corridor dataset ─────────────────────────────────────────────────────

export const CORRIDOR_DATA: Record<string, CorridorData> = {

    "i-10": {
        slug: "i-10",
        displayName: "I-10 Gulf Coast",
        h1: "I-10 Heavy Haul Escort Guide — Los Angeles to Jacksonville",
        metaTitle: "I-10 Oversize Load Escort Requirements & Pilot Car Costs",
        metaDescription: "Full escort and permit requirements for oversize loads along I-10 from California to Florida. State-by-state police escort triggers, width limits, and pilot car costs.",
        endpoints: "Los Angeles, CA → Jacksonville, FL",
        totalMiles: 2460,
        primaryStates: ["CA", "AZ", "NM", "TX", "LA", "MS", "AL", "FL"],
        supplyPct: 28,
        demandScore: 91,
        operatorCount: 47,
        hot: true,
        brokerIntelNote: "One of the most under-supplied corridors in the US. Escort booking windows have shortened to under 2 hours for hot jobs. Post early or pay premium.",
        escortIntelNote: "I-10 is the #1 shortage corridor on the platform. Operators based within 100mi of Houston or Baton Rouge have the highest booking rates.",
        keyRegulations: [
            "TX requires 2 escorts for widths ≥14ft; state police for widths ≥18ft",
            "LA nighttime movement prohibited for loads wider than 14ft",
            "AZ pilot car requirements trigger at 14ft wide or 14.5ft tall",
            "FL requires pre-authorized permits via DOT ePermit portal",
        ],
        stateRequirements: [
            { state: "California", stateCode: "CA", escortsRequired: "1 Front", widthTriggerFt: 14, heightTriggerFt: 14, nightMovement: "restricted", policeTriggerWidthFt: 20, permitNotes: "Route survey required for loads >16ft wide." },
            { state: "Arizona", stateCode: "AZ", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 14.5, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "Permits issued via ADOT online portal. 24-48hr processing." },
            { state: "New Mexico", stateCode: "NM", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 14.5, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "Annual permits available for repeat routes." },
            { state: "Texas", stateCode: "TX", escortsRequired: "2 (Front + Rear)", widthTriggerFt: 14, heightTriggerFt: 14, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "TxDOT ePermit required. Superload permits require route survey + structural analysis." },
            { state: "Louisiana", stateCode: "LA", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "prohibited", policeTriggerWidthFt: 16, permitNotes: "No night movement for loads >14ft wide. DOTD permit portal required." },
            { state: "Mississippi", stateCode: "MS", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "Weekend movement restrictions apply on major bridges." },
            { state: "Alabama", stateCode: "AL", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "ALDOT online permit system. Bank holiday blackouts apply." },
            { state: "Florida", stateCode: "FL", escortsRequired: "2 (Front + Rear)", widthTriggerFt: 14, heightTriggerFt: 14.5, nightMovement: "restricted", policeTriggerWidthFt: 16, permitNotes: "FDOT ePPermit. Rush hour movement restricted in Miami-Dade and Broward." },
        ],
    },

    "i-35": {
        slug: "i-35",
        displayName: "I-35 Central Spine",
        h1: "I-35 Heavy Haul Escort Guide — Laredo to Duluth",
        metaTitle: "I-35 Oversize Load Escort Requirements — Texas to Minnesota",
        metaDescription: "Complete escort and permit guide for I-35 from Laredo TX to Duluth MN. Police escort triggers, pilot car requirements, and permitting by state.",
        endpoints: "Laredo, TX → Duluth, MN",
        totalMiles: 1568,
        primaryStates: ["TX", "OK", "KS", "MO", "IA", "MN"],
        supplyPct: 31,
        demandScore: 88,
        operatorCount: 52,
        hot: true,
        brokerIntelNote: "High energy/wind energy cargo corridor. Oklahoma and Kansas legs see most shortages on large turbine blade moves. Book escorts 48hr+ in advance for oversized loads.",
        escortIntelNote: "Wind energy moves make this one of the most consistent income corridors. Operators based in OK City, Wichita, or Kansas City have best fill rates.",
        keyRegulations: [
            "TX–OK corridor sees heavy wind energy cargo — turbine blades often require specialized route surveys",
            "KS allows travel on state highways with annual permits for routine moves",
            "MN requires MNDOT permit with 5-day processing for loads >16ft wide",
            "OK restricts movement on turnpikes during state fair (Sept) and major event periods",
        ],
        stateRequirements: [
            { state: "Texas", stateCode: "TX", escortsRequired: "2 (Front + Rear)", widthTriggerFt: 14, heightTriggerFt: 14, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "TxDOT ePermit. Wind blade moves require special routing analysis." },
            { state: "Oklahoma", stateCode: "OK", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "ODOT permit. Turnpike-specific rules apply." },
            { state: "Kansas", stateCode: "KS", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "allowed", policeTriggerWidthFt: 18, permitNotes: "Annual permits available. Night movement allowed in rural areas." },
            { state: "Missouri", stateCode: "MO", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "MoDOT online portal. Kansas City metro has additional restrictions." },
            { state: "Iowa", stateCode: "IA", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "Iowa DOT permit. Spring load restrictions April–May." },
            { state: "Minnesota", stateCode: "MN", escortsRequired: "2 (Front + Rear)", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 16, permitNotes: "MNDOT 5-day processing for wide loads. Twin Cities metro restricted." },
        ],
    },

    "i-75": {
        slug: "i-75",
        displayName: "I-75 Southeast",
        h1: "I-75 Heavy Haul Escort Guide — Miami to Sault Ste. Marie",
        metaTitle: "I-75 Oversize Load Escort Requirements — Florida to Michigan",
        metaDescription: "State-by-state escort and permit requirements for I-75 from Florida through Georgia, Tennessee, Kentucky, Ohio, and Michigan to the Canadian border.",
        endpoints: "Sault Ste. Marie, MI → Miami, FL",
        totalMiles: 1786,
        primaryStates: ["FL", "GA", "TN", "KY", "OH", "MI"],
        supplyPct: 42,
        demandScore: 84,
        operatorCount: 63,
        hot: true,
        brokerIntelNote: "Manufacturing corridor — automotive parts, industrial equipment. Georgia–Tennessee section is busiest. Demand spikes in Q1/Q3 with plant restart cycles.",
        escortIntelNote: "Strong year-round demand. Atlanta metro and Knoxville are high-activity hubs. Michigan industrial moves are premium-rate.",
        keyRegulations: [
            "GA requires pre-move notification for loads >16ft wide on interstate",
            "TN has strict weight restrictions on interstates during spring thaw (Feb–Mar)",
            "OH requires state police for loads >18ft wide",
            "MI annual permit program available for repeat industrial shippers",
        ],
        stateRequirements: [
            { state: "Florida", stateCode: "FL", escortsRequired: "2 (Front + Rear)", widthTriggerFt: 14, heightTriggerFt: 14.5, nightMovement: "restricted", policeTriggerWidthFt: 16, permitNotes: "FDOT ePPermit. Rush hour restrictions in Tampa and Miami." },
            { state: "Georgia", stateCode: "GA", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "GDOT ePPermitting. 16ft+ loads require pre-move route notification." },
            { state: "Tennessee", stateCode: "TN", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "TDOT permit. Spring weight restrictions Feb–Mar statewide." },
            { state: "Kentucky", stateCode: "KY", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "KY TC permit portal. Annual permits available." },
            { state: "Ohio", stateCode: "OH", escortsRequired: "2 (Front + Rear)", widthTriggerFt: 14, heightTriggerFt: 14, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "ODOT permit. State police required for loads >18ft wide." },
            { state: "Michigan", stateCode: "MI", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "MDOT online permit. Annual superload permits for industrial shippers." },
        ],
    },

    "i-20": {
        slug: "i-20",
        displayName: "I-20 Deep South",
        h1: "I-20 Heavy Haul Escort Guide — West Texas to South Carolina",
        metaTitle: "I-20 Oversize Load Escort Requirements — TX to SC",
        metaDescription: "Escort requirements, permit rules, and pilot car costs for I-20 from Pecos TX through Louisiana, Mississippi, Alabama, and Georgia to the Carolina coast.",
        endpoints: "Pecos, TX → Florence, SC",
        totalMiles: 1534,
        primaryStates: ["TX", "LA", "MS", "AL", "GA", "SC"],
        supplyPct: 38,
        demandScore: 79,
        operatorCount: 44,
        hot: true,
        brokerIntelNote: "Petrochemical and port feeder corridor. Louisiana–Mississippi junction is a frequent bottleneck. Savannah port traffic has increased 35% in 2025.",
        escortIntelNote: "Augusta and Atlanta are strong home bases for this corridor. Port of Savannah deliveries provide consistent premium-rate work.",
        keyRegulations: [
            "LA special permit required for loads >15ft tall or >14ft wide",
            "MS bridge weight restrictions apply on the Pearl River crossings",
            "GA daytime-only movement in Atlanta metro core for loads >16ft wide",
            "SC Port of Charleston has specific routing requirements for port deliveries",
        ],
        stateRequirements: [
            { state: "Texas", stateCode: "TX", escortsRequired: "2 (Front + Rear)", widthTriggerFt: 14, heightTriggerFt: 14, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "TxDOT ePermit." },
            { state: "Louisiana", stateCode: "LA", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "prohibited", policeTriggerWidthFt: 16, permitNotes: "No night movement for loads >14ft wide." },
            { state: "Mississippi", stateCode: "MS", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "Bridge weight restrictions on Pearl River crossings." },
            { state: "Alabama", stateCode: "AL", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "ALDOT online permit. Holiday blackouts apply." },
            { state: "Georgia", stateCode: "GA", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "Atlanta metro daytime-only for loads >16ft wide." },
            { state: "South Carolina", stateCode: "SC", escortsRequired: "1 Front + 1 Rear", widthTriggerFt: 14, heightTriggerFt: 15, nightMovement: "restricted", policeTriggerWidthFt: 18, permitNotes: "Port of Charleston has specific routing requirements." },
        ],
    },
};

// ── GitHub Tool Recommendations (from multiplier YAML evaluation) ─────────────

/**
 * Evaluated open-source tools for Haul Command's geospatial and marketplace needs.
 * All MIT or Apache 2.0 licensed — safe for commercial use.
 */
export const GITHUB_TOOLS = [
    {
        name: "Turf.js",
        repo: "https://github.com/Turfjs/turf",
        stars: "9.3k",
        license: "MIT",
        use: "Geospatial analysis — route buffer zones, corridor intersection detection, escort density calculations",
        integrationNotes: "Drop-in for client/server. Use turf.buffer() for corridor pressure zones, turf.distance() for escort density radius filtering.",
        priority: "HIGH — use for escort supply radar clustering and corridor overlap detection",
    },
    {
        name: "H3-js (Uber H3)",
        repo: "https://github.com/uber/h3-js",
        stars: "3.2k",
        license: "Apache 2.0",
        use: "Hexagonal geospatial indexing — group escorts and loads by geographic cell for efficient supply/demand heat mapping",
        integrationNotes: "Use resolution 7 (avg 5.16km²) for corridor density. Integrates with Supabase PostGIS for server-side indexing.",
        priority: "HIGH — replaces hand-rolled geohash logic in geo_supply_pressure",
    },
    {
        name: "react-map-gl",
        repo: "https://github.com/visgl/react-map-gl",
        stars: "7.8k",
        license: "MIT",
        use: "Mapbox GL React wrapper — use for Phase 2 when adding Mapbox as secondary tile provider",
        integrationNotes: "Already supports deck.gl overlays — pairs with HC overlay config in lib/maps/hc-overlays.ts.",
        priority: "MEDIUM — Phase 2 when moving to Mapbox for tile rendering",
    },
    {
        name: "Leaflet.js",
        repo: "https://github.com/Leaflet/Leaflet",
        stars: "41k",
        license: "BSD 2-Clause",
        use: "Lightweight map for mobile operator dispatch companion where full HERE/Mapbox isn't needed",
        integrationNotes: "Use with OSM tiles for zero-cost mobile tracking UI (Capacitor wrapper).",
        priority: "MEDIUM — Capacitor mobile dispatch companion",
    },
    {
        name: "auction.js patterns (custom)",
        repo: "https://github.com/topics/auction-algorithm",
        license: "varies",
        use: "Reference implementations for second-price auction algorithm (for AdGrid corridor sponsorship)",
        integrationNotes: "Build in-house using Supabase RPC + pg function for sealed-bid second-price auction. Reference open implementations for algo only.",
        priority: "LOW — Phase 5 when corridor sponsorships go live",
    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCorridorData(slug: string): CorridorData | null {
    return CORRIDOR_DATA[slug] ?? null;
}

export function getAllCorridorSlugs(): string[] {
    return Object.keys(CORRIDOR_DATA);
}

/** Compute estimated escort cost from miles and service tier */
export function estimateEscortCost(miles: number, escortCount: number, tier: "standard" | "priority" | "premium" = "standard"): { low: number; high: number } {
    const basePerMile = tier === "premium" ? 3.80 : tier === "priority" ? 3.20 : 2.60;
    const perEscort = miles * basePerMile;
    const base = perEscort * escortCount;
    return {
        low: Math.round(base * 0.90),
        high: Math.round(base * 1.20),
    };
}
