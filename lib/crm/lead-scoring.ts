// lib/crm/lead-scoring.ts
//
// Lead Scoring Engine for Haul Command CRM
// Computes prospect scores based on industry weight, urgency signals,
// load size indicators, repeat volume, and payment behavior.

export interface LeadScoreInput {
    industry_segment?: string;
    urgency_keywords?: string[];
    avg_load_dimensions?: { length?: number; width?: number; height?: number; weight_tons?: number };
    estimated_monthly_bookings?: number;
    payment_history?: "excellent" | "good" | "fair" | "unknown";
    has_logistics_team?: boolean;
    international_operations?: boolean;
    energy_sector?: boolean;
}

export interface LeadScoreOutput {
    total_score: number;
    breakdown: {
        industry_weight: number;
        urgency_signals: number;
        load_size_indicator: number;
        repeat_volume: number;
        payment_behavior: number;
    };
    priority_tier: "S" | "A" | "B" | "C";
    recommended_action: string;
}

// ============================================================
// INDUSTRY WEIGHTS (0-100)
// ============================================================

const INDUSTRY_WEIGHTS: Record<string, number> = {
    // Tier 1 Elite
    wind_turbine_blade_transport: 95,
    wind_farm_epc_contractors: 95,
    power_transformer_transport: 93,
    substation_equipment_movers: 93,
    nuclear_plant_component_movers: 92,
    project_logistics_firms: 92,
    heavy_freight_forwarders: 92,
    breakbulk_specialists: 92,
    superload_carriers: 90,
    heavy_haul_trucking_companies: 90,
    project_cargo_carriers: 90,
    steel_mill_equipment_movers: 88,
    mining_equipment_transport: 88,
    refinery_equipment_movers: 88,

    // Tier 2
    oilfield_service_companies: 85,
    pipeline_contractors: 85,
    crane_rental_companies: 85,
    bridge_beam_transport: 80,
    precast_concrete_companies: 80,

    // Tier 3
    mobile_home_transport: 72,
    combine_harvester_transport: 60,

    // Tier 4
    yacht_transport_companies: 75,
    aircraft_fuselage_transport: 90,
    rocket_component_movers: 95,

    // Default
    DEFAULT: 50,
};

// ============================================================
// URGENCY KEYWORDS
// ============================================================

const URGENCY_KEYWORDS = new Set([
    "expedited", "time-critical", "shutdown", "outage",
    "emergency", "emergency_move", "weather_window", "deadline",
    "rush", "urgent", "asap", "critical_path", "hot_shot",
]);

// ============================================================
// COMPUTE LEAD SCORE
// ============================================================

export function computeLeadScore(input: LeadScoreInput): LeadScoreOutput {
    // 1) Industry Weight (30%)
    const rawIndustry = INDUSTRY_WEIGHTS[input.industry_segment ?? ""] ?? INDUSTRY_WEIGHTS.DEFAULT;
    const industryScore = rawIndustry;

    // 2) Urgency Signals (25%)
    let urgencyScore = 30; // base
    if (input.urgency_keywords) {
        const matchCount = input.urgency_keywords.filter((k) =>
            URGENCY_KEYWORDS.has(k.toLowerCase().replace(/\s+/g, "_"))
        ).length;
        urgencyScore = Math.min(100, 30 + matchCount * 25);
    }

    // 3) Load Size Indicator (20%)
    let loadSizeScore = 40; // base
    if (input.avg_load_dimensions) {
        const d = input.avg_load_dimensions;
        if ((d.weight_tons ?? 0) > 100) loadSizeScore = 100;
        else if ((d.weight_tons ?? 0) > 50) loadSizeScore = 85;
        else if ((d.length ?? 0) > 30) loadSizeScore = 80;
        else if ((d.width ?? 0) > 4) loadSizeScore = 75;
        else if ((d.height ?? 0) > 5) loadSizeScore = 70;
    }

    // 4) Repeat Volume (15%)
    let repeatScore = 30; // base
    const monthly = input.estimated_monthly_bookings ?? 0;
    if (monthly >= 20) repeatScore = 100;
    else if (monthly >= 10) repeatScore = 85;
    else if (monthly >= 5) repeatScore = 70;
    else if (monthly >= 2) repeatScore = 55;
    else if (monthly >= 1) repeatScore = 40;

    // 5) Payment Behavior (10%)
    let paymentScore = 50; // base
    if (input.payment_history === "excellent") paymentScore = 100;
    else if (input.payment_history === "good") paymentScore = 80;
    else if (input.payment_history === "fair") paymentScore = 50;
    else {
        // Unknown but infer from signals
        if (input.has_logistics_team) paymentScore += 15;
        if (input.energy_sector) paymentScore += 15;
        if (input.international_operations) paymentScore += 10;
        paymentScore = Math.min(100, paymentScore);
    }

    // Weighted total
    const totalScore = Math.round(
        industryScore * 0.30 +
        urgencyScore * 0.25 +
        loadSizeScore * 0.20 +
        repeatScore * 0.15 +
        paymentScore * 0.10
    );

    // Priority tier
    let priorityTier: "S" | "A" | "B" | "C";
    if (totalScore >= 80) priorityTier = "S";
    else if (totalScore >= 65) priorityTier = "A";
    else if (totalScore >= 45) priorityTier = "B";
    else priorityTier = "C";

    // Recommended action
    let action: string;
    if (priorityTier === "S") action = "Immediate outreach — schedule demo within 48h";
    else if (priorityTier === "A") action = "Priority contact — send personalized intro this week";
    else if (priorityTier === "B") action = "Nurture sequence — add to email drip";
    else action = "Low priority — monitor for upgrade signals";

    return {
        total_score: totalScore,
        breakdown: {
            industry_weight: industryScore,
            urgency_signals: urgencyScore,
            load_size_indicator: loadSizeScore,
            repeat_volume: repeatScore,
            payment_behavior: paymentScore,
        },
        priority_tier: priorityTier,
        recommended_action: action,
    };
}

// ============================================================
// BATCH SCORING
// ============================================================

export function batchScoreProspects(
    prospects: Array<{ id: string; industry_segment?: string;[key: string]: any }>
): Array<{ id: string; score: LeadScoreOutput }> {
    return prospects.map((p) => ({
        id: p.id,
        score: computeLeadScore({
            industry_segment: p.industry_segment,
            energy_sector: ["energy_power", "oil_gas"].includes(p.category ?? ""),
            international_operations: !["US"].includes(p.country_code ?? "US"),
        }),
    }));
}
