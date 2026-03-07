// ══════════════════════════════════════════════════════════════
// CARRIER INTELLIGENCE SEO ENGINE
// Spec: HC-SEO-CARRIER-INTEL-01
// Purpose: Convert carrier footprints into escort traffic
//          Programmatic pages: /carrier/{slug}/{country_code}
// ══════════════════════════════════════════════════════════════

// ── Carrier Profile Data Model ──

export interface CarrierProfile {
    carrierId: string;
    legalName: string;
    dbaName?: string;
    /** MC number (US), USDOT, or local equivalent */
    mcOrEquivalent: string;
    countryCode: string;
    headquartersCity: string;
    headquartersRegion: string;
    operatingRegions: string[];
    equipmentTypes: EquipmentType[];
    freightTypes: FreightType[];
    intermodalFlag: boolean;
    portActivityFlag: boolean;
    heavyHaulProbabilityScore: number; // 0-100
    lastVerifiedAt: string; // ISO date
    slug: string;
}

export type EquipmentType =
    | "flatbed" | "step_deck" | "double_drop" | "lowboy"
    | "rgn" | "multi_axle" | "beam_trailer" | "modular"
    | "extendable" | "specialized" | "tank" | "container";

export type FreightType =
    | "oversize" | "overweight" | "super_load"
    | "intermodal" | "heavy_equipment" | "wind_energy"
    | "construction" | "oil_gas" | "mining"
    | "military" | "prefab" | "transformer"
    | "bridge_beam" | "modular_building";

// ── Carrier Intelligence Scoring ──

export interface CarrierIntelligenceMetrics {
    carrierId: string;
    escortCoverageScore: number;   // 0-100: escort density near carrier ops
    corridorRiskScore: number;     // 0-100: risk on their typical routes
    permitComplexityScore: number; // 0-100: how many permit jurisdictions
    brokerConfidenceScore: number; // 0-100: combined trust signal
    liquidityPressureScore: number; // 0-100: scarcity near their corridors
    demandHeatScore: number;       // 0-100: how "hot" is escort demand
    lastComputedAt: string;
}

// ── Escort Coverage Score Calculator ──

export interface CoverageScoreInputs {
    escortsWithin100km: number;
    escortsWithin250km: number;
    corridorDensity: number; // escorts per 100km of corridor
    recentJobCompletions: number; // last 90 days
}

export function computeEscortCoverageScore(inputs: CoverageScoreInputs): number {
    const localDensity = Math.min(inputs.escortsWithin100km / 10, 1) * 40;
    const corridorPresence = Math.min(inputs.corridorDensity / 5, 1) * 35;
    const reliability = Math.min(inputs.recentJobCompletions / 20, 1) * 25;
    return Math.round(localDensity + corridorPresence + reliability);
}

// ── Corridor Risk Score ──

export interface CorridorRiskInputs {
    permitComplexity: number; // 1-10
    escortScarcity: number;   // 1-10
    historicalDelays: number;  // avg hours delayed
    routeRestrictions: number; // count of restrictions
}

export function computeCorridorRiskScore(inputs: CorridorRiskInputs): number {
    const permit = (inputs.permitComplexity / 10) * 30;
    const scarcity = (inputs.escortScarcity / 10) * 30;
    const delays = Math.min(inputs.historicalDelays / 8, 1) * 25;
    const restrictions = Math.min(inputs.routeRestrictions / 10, 1) * 15;
    return Math.round(permit + scarcity + delays + restrictions);
}

export function interpretCorridorRisk(score: number): "smooth_corridor" | "manageable" | "elevated_delay_risk" {
    if (score >= 70) return "elevated_delay_risk";
    if (score >= 40) return "manageable";
    return "smooth_corridor";
}

// ── Broker Confidence Score ──

export function computeBrokerConfidenceScore(
    escortCoverage: number,
    onTimeHistory: number, // percentage 0-100
    corridorRisk: number,
    marketLiquidity: number // 0-100
): number {
    const coverage = escortCoverage * 0.35;
    const onTime = onTimeHistory * 0.25;
    const riskInverse = (100 - corridorRisk) * 0.25;
    const liquidity = marketLiquidity * 0.15;
    return Math.round(coverage + onTime + riskInverse + liquidity);
}

// ── Page Generation Templates ──

export interface CarrierPageMeta {
    url: string;
    title: string;
    metaDescription: string;
    h1: string;
    schemaTypes: string[];
    internalLinks: string[];
}

export function generateCarrierPageMeta(
    carrier: CarrierProfile,
    countryName: string
): CarrierPageMeta {
    return {
        url: `/carrier/${carrier.slug}/${carrier.countryCode.toLowerCase()}`,
        title: `${carrier.dbaName || carrier.legalName} Escort Coverage & Corridor Risk — ${countryName} | Haul Command`,
        metaDescription: `Analyze escort availability, corridor risk, and coverage confidence for ${carrier.dbaName || carrier.legalName} in ${countryName}. Reduce oversize load risk before dispatch.`,
        h1: `${carrier.dbaName || carrier.legalName} — Escort Coverage Intelligence`,
        schemaTypes: ["Organization", "Service", "FAQPage", "BreadcrumbList"],
        internalLinks: [
            `/escorts/near/${carrier.headquartersCity.toLowerCase().replace(/\s+/g, "-")}`,
            `/corridors/${carrier.countryCode.toLowerCase()}`,
            `/permits/${carrier.countryCode.toLowerCase()}`,
            `/brokers/tools`,
            `/map/liquidity`,
        ],
    };
}

export function generateCityVariantMeta(
    carrier: CarrierProfile,
    city: string,
    countryCode: string
): CarrierPageMeta {
    const citySlug = city.toLowerCase().replace(/\s+/g, "-");
    return {
        url: `/carrier/${carrier.slug}/${citySlug}-${countryCode.toLowerCase()}`,
        title: `${carrier.dbaName || carrier.legalName} in ${city} — Escort Availability | Haul Command`,
        metaDescription: `Find escort vehicles near ${carrier.dbaName || carrier.legalName} operations in ${city}. Real-time coverage data and corridor risk analysis.`,
        h1: `${carrier.dbaName || carrier.legalName} — ${city} Escort Coverage`,
        schemaTypes: ["Organization", "Service", "BreadcrumbList"],
        internalLinks: [
            `/escorts/near/${citySlug}`,
            `/corridors/${citySlug}`,
            `/directory/${citySlug}`,
        ],
    };
}

// ── Carrier Discovery Sources (per country) ──

export interface CarrierDiscoverySource {
    countryCode: string;
    sourceName: string;
    sourceType: "public_registry" | "transport_authority" | "port_list" | "rail_list" | "user_submission" | "partner_import";
    url?: string;
    dataQuality: "high" | "medium" | "low";
    estimatedCarriers: number;
}

export const CARRIER_DISCOVERY_SOURCES: CarrierDiscoverySource[] = [
    // TIER A
    { countryCode: "US", sourceName: "FMCSA SAFER System", sourceType: "public_registry", url: "https://safer.fmcsa.dot.gov", dataQuality: "high", estimatedCarriers: 50000 },
    { countryCode: "US", sourceName: "FMCSA Census Data", sourceType: "transport_authority", url: "https://ai.fmcsa.dot.gov", dataQuality: "high", estimatedCarriers: 50000 },
    { countryCode: "CA", sourceName: "CVOR (Ontario)", sourceType: "public_registry", dataQuality: "medium", estimatedCarriers: 8000 },
    { countryCode: "CA", sourceName: "NSC Carrier Profiles", sourceType: "transport_authority", dataQuality: "medium", estimatedCarriers: 12000 },
    { countryCode: "AU", sourceName: "NHVR Operator Register", sourceType: "public_registry", url: "https://www.nhvr.gov.au", dataQuality: "high", estimatedCarriers: 6000 },
    { countryCode: "GB", sourceName: "DVSA Operator Portal", sourceType: "public_registry", dataQuality: "high", estimatedCarriers: 4000 },
    { countryCode: "GB", sourceName: "ESDAL (Abnormal Loads)", sourceType: "transport_authority", dataQuality: "high", estimatedCarriers: 2000 },
    { countryCode: "NZ", sourceName: "NZTA Carrier Register", sourceType: "public_registry", dataQuality: "medium", estimatedCarriers: 1500 },
    { countryCode: "ZA", sourceName: "RTMC Operator Database", sourceType: "transport_authority", dataQuality: "medium", estimatedCarriers: 3000 },
    { countryCode: "DE", sourceName: "BASt Schwertransport Portal", sourceType: "public_registry", dataQuality: "high", estimatedCarriers: 5000 },
    { countryCode: "DE", sourceName: "VDMA Heavy Transport List", sourceType: "partner_import", dataQuality: "medium", estimatedCarriers: 2000 },
    { countryCode: "NL", sourceName: "RDW Kentekenregister", sourceType: "public_registry", dataQuality: "high", estimatedCarriers: 2000 },
    { countryCode: "AE", sourceName: "RTA Licensed Carriers", sourceType: "transport_authority", dataQuality: "medium", estimatedCarriers: 1500 },
    { countryCode: "BR", sourceName: "ANTT RNTRC Register", sourceType: "public_registry", url: "https://www.antt.gov.br", dataQuality: "high", estimatedCarriers: 15000 },

    // TIER B (key sources)
    { countryCode: "FR", sourceName: "DREAL Transport Register", sourceType: "public_registry", dataQuality: "medium", estimatedCarriers: 4000 },
    { countryCode: "ES", sourceName: "DGT Registro de Transportistas", sourceType: "public_registry", dataQuality: "medium", estimatedCarriers: 3500 },
    { countryCode: "IT", sourceName: "Albo Autotrasportatori", sourceType: "public_registry", dataQuality: "medium", estimatedCarriers: 5000 },
    { countryCode: "SE", sourceName: "Transportstyrelsen Register", sourceType: "public_registry", dataQuality: "high", estimatedCarriers: 1500 },
    { countryCode: "NO", sourceName: "Statens vegvesen Register", sourceType: "public_registry", dataQuality: "high", estimatedCarriers: 1000 },
    { countryCode: "MX", sourceName: "SCT Autotransporte Federal", sourceType: "public_registry", dataQuality: "medium", estimatedCarriers: 8000 },
    { countryCode: "SA", sourceName: "Transport General Authority", sourceType: "transport_authority", dataQuality: "low", estimatedCarriers: 2000 },

    // TIER C (select)
    { countryCode: "PL", sourceName: "GITD Carrier Register", sourceType: "public_registry", dataQuality: "medium", estimatedCarriers: 4000 },
    { countryCode: "TR", sourceName: "UND Transport Register", sourceType: "transport_authority", dataQuality: "medium", estimatedCarriers: 5000 },
    { countryCode: "JP", sourceName: "MLIT Transport Register", sourceType: "public_registry", dataQuality: "high", estimatedCarriers: 3000 },
    { countryCode: "KR", sourceName: "MOLIT Carrier Database", sourceType: "transport_authority", dataQuality: "medium", estimatedCarriers: 2000 },

    // Intermodal/Port lists (global)
    { countryCode: "US", sourceName: "IANA Intermodal Directory", sourceType: "rail_list", dataQuality: "high", estimatedCarriers: 5000 },
    { countryCode: "US", sourceName: "Class I Railroad Dray Lists", sourceType: "rail_list", dataQuality: "medium", estimatedCarriers: 3000 },
];

// ── Build Rules Per Tier ──

export interface TierBuildRule {
    tier: "A" | "B" | "C" | "D";
    carriersPerCountryTarget: number;
    cityVariants: number;
    corridorVariants: number;
    priority: string;
}

export const TIER_BUILD_RULES: TierBuildRule[] = [
    { tier: "A", carriersPerCountryTarget: 2000, cityVariants: 50, corridorVariants: 100, priority: "immediate_full_build" },
    { tier: "B", carriersPerCountryTarget: 1000, cityVariants: 30, corridorVariants: 60, priority: "phased_build_wave_2" },
    { tier: "C", carriersPerCountryTarget: 400, cityVariants: 15, corridorVariants: 30, priority: "programmatic_scale" },
    { tier: "D", carriersPerCountryTarget: 150, cityVariants: 10, corridorVariants: 15, priority: "opportunistic_seed" },
];

// ── Intermodal Hub Intelligence ──
// From the Blue Collar Connections listing: intermodal hubs = escort demand gravity

export interface IntermodalHub {
    name: string;
    city: string;
    countryCode: string;
    type: "rail_yard" | "port" | "distribution_center" | "intermodal_terminal" | "energy_hub";
    escortDemandLevel: "critical" | "high" | "medium" | "low";
    typicalLoadTypes: FreightType[];
    nearestEscortGap: boolean; // true = fewer than 5 escorts within 100km
}

export const KEY_INTERMODAL_HUBS: IntermodalHub[] = [
    // US Major
    { name: "Denver Intermodal Express Terminal", city: "Denver", countryCode: "US", type: "intermodal_terminal", escortDemandLevel: "high", typicalLoadTypes: ["oversize", "intermodal", "heavy_equipment"], nearestEscortGap: false },
    { name: "BNSF Logistics Park Kansas City", city: "Kansas City", countryCode: "US", type: "rail_yard", escortDemandLevel: "critical", typicalLoadTypes: ["oversize", "intermodal", "wind_energy"], nearestEscortGap: true },
    { name: "Port of Houston", city: "Houston", countryCode: "US", type: "port", escortDemandLevel: "critical", typicalLoadTypes: ["oversize", "overweight", "oil_gas", "heavy_equipment"], nearestEscortGap: false },
    { name: "Port of Long Beach", city: "Long Beach", countryCode: "US", type: "port", escortDemandLevel: "critical", typicalLoadTypes: ["oversize", "overweight", "heavy_equipment", "construction"], nearestEscortGap: false },
    { name: "Midland-Odessa Energy Corridor", city: "Midland", countryCode: "US", type: "energy_hub", escortDemandLevel: "critical", typicalLoadTypes: ["oil_gas", "oversize", "heavy_equipment", "super_load"], nearestEscortGap: true },
    { name: "Port of Savannah", city: "Savannah", countryCode: "US", type: "port", escortDemandLevel: "high", typicalLoadTypes: ["oversize", "intermodal", "construction"], nearestEscortGap: true },
    { name: "UP Global III Intermodal", city: "Joliet", countryCode: "US", type: "rail_yard", escortDemandLevel: "high", typicalLoadTypes: ["intermodal", "oversize"], nearestEscortGap: false },
    { name: "Permian Basin Corridor", city: "Pecos", countryCode: "US", type: "energy_hub", escortDemandLevel: "high", typicalLoadTypes: ["oil_gas", "oversize", "super_load"], nearestEscortGap: true },

    // Canada
    { name: "Port of Vancouver", city: "Vancouver", countryCode: "CA", type: "port", escortDemandLevel: "critical", typicalLoadTypes: ["oversize", "heavy_equipment", "intermodal"], nearestEscortGap: false },
    { name: "Calgary Oil Sands Corridor", city: "Calgary", countryCode: "CA", type: "energy_hub", escortDemandLevel: "critical", typicalLoadTypes: ["oil_gas", "super_load", "heavy_equipment", "modular_building"], nearestEscortGap: true },
    { name: "Fort McMurray Energy Hub", city: "Fort McMurray", countryCode: "CA", type: "energy_hub", escortDemandLevel: "critical", typicalLoadTypes: ["oil_gas", "super_load", "modular_building"], nearestEscortGap: true },

    // Australia
    { name: "Port Hedland Iron Ore Terminal", city: "Port Hedland", countryCode: "AU", type: "port", escortDemandLevel: "critical", typicalLoadTypes: ["mining", "super_load", "heavy_equipment"], nearestEscortGap: true },
    { name: "Port of Melbourne", city: "Melbourne", countryCode: "AU", type: "port", escortDemandLevel: "high", typicalLoadTypes: ["oversize", "intermodal", "construction"], nearestEscortGap: false },
    { name: "Pilbara Mining Corridor", city: "Karratha", countryCode: "AU", type: "energy_hub", escortDemandLevel: "critical", typicalLoadTypes: ["mining", "super_load", "heavy_equipment"], nearestEscortGap: true },

    // UK
    { name: "Port of Felixstowe", city: "Felixstowe", countryCode: "GB", type: "port", escortDemandLevel: "high", typicalLoadTypes: ["oversize", "intermodal"], nearestEscortGap: false },
    { name: "Port of Immingham", city: "Immingham", countryCode: "GB", type: "port", escortDemandLevel: "high", typicalLoadTypes: ["oversize", "wind_energy", "transformer"], nearestEscortGap: true },

    // Germany
    { name: "Port of Hamburg", city: "Hamburg", countryCode: "DE", type: "port", escortDemandLevel: "critical", typicalLoadTypes: ["oversize", "wind_energy", "transformer", "heavy_equipment"], nearestEscortGap: false },
    { name: "Duisburg Inland Port", city: "Duisburg", countryCode: "DE", type: "port", escortDemandLevel: "high", typicalLoadTypes: ["oversize", "heavy_equipment", "construction"], nearestEscortGap: false },

    // Netherlands
    { name: "Port of Rotterdam", city: "Rotterdam", countryCode: "NL", type: "port", escortDemandLevel: "critical", typicalLoadTypes: ["oversize", "overweight", "heavy_equipment", "wind_energy"], nearestEscortGap: false },

    // UAE
    { name: "Jebel Ali Free Zone", city: "Dubai", countryCode: "AE", type: "port", escortDemandLevel: "critical", typicalLoadTypes: ["oversize", "heavy_equipment", "construction"], nearestEscortGap: true },

    // Brazil
    { name: "Port of Santos", city: "Santos", countryCode: "BR", type: "port", escortDemandLevel: "critical", typicalLoadTypes: ["oversize", "heavy_equipment", "mining"], nearestEscortGap: true },

    // Saudi Arabia
    { name: "NEOM Construction Corridor", city: "NEOM", countryCode: "SA", type: "distribution_center", escortDemandLevel: "critical", typicalLoadTypes: ["construction", "super_load", "heavy_equipment", "modular_building"], nearestEscortGap: true },
    { name: "Jubail Industrial City", city: "Jubail", countryCode: "SA", type: "energy_hub", escortDemandLevel: "high", typicalLoadTypes: ["oil_gas", "heavy_equipment", "oversize"], nearestEscortGap: true },

    // Mexico
    { name: "Port of Manzanillo", city: "Manzanillo", countryCode: "MX", type: "port", escortDemandLevel: "high", typicalLoadTypes: ["oversize", "intermodal", "heavy_equipment"], nearestEscortGap: true },
    { name: "Nuevo Laredo Border Crossing", city: "Nuevo Laredo", countryCode: "MX", type: "distribution_center", escortDemandLevel: "high", typicalLoadTypes: ["oversize", "intermodal"], nearestEscortGap: true },
];

// ── CTA Configuration ──

export interface SmartCTA {
    audience: "broker" | "escort" | "carrier" | "unknown";
    primaryCta: { text: string; action: string };
    secondaryCta: { text: string; action: string };
    tertiaryCta?: { text: string; action: string };
}

export function getSmartCTA(audience: SmartCTA["audience"]): SmartCTA {
    switch (audience) {
        case "broker":
            return {
                audience,
                primaryCta: { text: "Check Escort Availability", action: "broker_coverage_check" },
                secondaryCta: { text: "Get Coverage Alerts", action: "coverage_alert_signup" },
                tertiaryCta: { text: "View Risk Dashboard", action: "show_risk_dashboard" },
            };
        case "escort":
            return {
                audience,
                primaryCta: { text: "Claim Your Escort Profile", action: "escort_claim_flow" },
                secondaryCta: { text: "Set Coverage Zone", action: "set_coverage_zone" },
                tertiaryCta: { text: "Find Loads Near You", action: "escort_load_board" },
            };
        case "carrier":
            return {
                audience,
                primaryCta: { text: "View Coverage Report", action: "show_coverage_report" },
                secondaryCta: { text: "Find Escorts for Your Route", action: "route_escort_search" },
                tertiaryCta: { text: "Get Permit Intelligence", action: "permit_guide" },
            };
        default:
            return {
                audience: "unknown",
                primaryCta: { text: "Find Escort Vehicles", action: "directory_search" },
                secondaryCta: { text: "List Your Service", action: "escort_claim_flow" },
            };
    }
}

// ── Anti-Gaming Safeguards ──

export interface FraudSignal {
    type: "density_spike" | "fake_location" | "coordinated_reviews" | "coverage_manipulation";
    severity: "low" | "medium" | "high" | "critical";
    confidence: number; // 0-1
    details: string;
}

export function detectFraudSignals(
    escortDensityChange: number, // % change in 24h
    reviewVelocity: number, // reviews per hour
    geoClusterSize: number, // escorts within 1km
    coverageScoreChange: number // absolute change in 24h
): FraudSignal[] {
    const signals: FraudSignal[] = [];

    if (escortDensityChange > 200) {
        signals.push({
            type: "density_spike",
            severity: escortDensityChange > 500 ? "critical" : "high",
            confidence: Math.min(escortDensityChange / 1000, 0.95),
            details: `Escort density spiked ${escortDensityChange}% in 24h`,
        });
    }

    if (reviewVelocity > 5) {
        signals.push({
            type: "coordinated_reviews",
            severity: reviewVelocity > 20 ? "critical" : "high",
            confidence: Math.min(reviewVelocity / 30, 0.95),
            details: `${reviewVelocity} reviews/hour detected (normal: <1/hour)`,
        });
    }

    if (geoClusterSize > 10) {
        signals.push({
            type: "fake_location",
            severity: geoClusterSize > 25 ? "critical" : "medium",
            confidence: Math.min(geoClusterSize / 50, 0.9),
            details: `${geoClusterSize} escorts clustered within 1km`,
        });
    }

    if (coverageScoreChange > 30) {
        signals.push({
            type: "coverage_manipulation",
            severity: coverageScoreChange > 50 ? "critical" : "high",
            confidence: Math.min(coverageScoreChange / 80, 0.9),
            details: `Coverage score jumped ${coverageScoreChange} points in 24h`,
        });
    }

    return signals;
}

// ── Observability ──

export interface CarrierIntelObservability {
    dashboards: string[];
    alerts: Record<string, boolean>;
}

export const OBSERVABILITY_CONFIG: CarrierIntelObservability = {
    dashboards: [
        "carrier_pages_indexed",
        "coverage_gap_clicks",
        "broker_conversion_rate",
        "escort_claim_velocity",
        "corridor_heat_accuracy",
    ],
    alerts: {
        low_index_rate: true,
        traffic_drop: true,
        scoring_anomalies: true,
        country_underperformance: true,
    },
};
