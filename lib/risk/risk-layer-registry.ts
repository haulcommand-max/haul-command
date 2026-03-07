// ══════════════════════════════════════════════════════════════
// GLOBAL RISK LAYER REGISTRY
// Spec: HCOS-MAP-RISK-LAYERS-01
// Purpose: Define the catalog of 14 risk layers, their scoring
//          parameters, decay models, UI config, and per-country
//          multipliers across all 52 countries.
// Serves: web directory (read-only corridor pages) + mobile app
// ══════════════════════════════════════════════════════════════

export type RiskCategory = "hazard" | "constraint" | "security" | "weather" | "infrastructure" | "regulatory";
export type DecayModel = "linear" | "exponential" | "step";
export type SeverityScale = "0_100" | "0_5" | "0_10";
export type RiskDisplayMode = "tile" | "pin" | "segment_overlay" | "polygon";
export type SignalSource = "user_report" | "partner_feed" | "public_feed" | "internal_model";
export type SignalStatus = "pending" | "active" | "suppressed" | "expired";
export type RouteRiskGrade = "A" | "B" | "C" | "D" | "F";

// ── Core risk layer definition ──

export interface RiskLayerDef {
    layerId: string;
    name: string;
    category: RiskCategory;
    severityScale: SeverityScale;
    defaultWeight: number;
    decayModel: DecayModel;
    defaultTtlMinutes: number;
    confidenceSources: SignalSource[];
    thresholds: Record<string, number | string | boolean>;
    ui: {
        icon: string;
        displayModes: RiskDisplayMode[];
        legend: string[];
        actionable: string[];
    };
}

// ── The 14 global risk layers ──

export const RISK_LAYER_CATALOG: RiskLayerDef[] = [
    {
        layerId: "low_bridge_clearance",
        name: "Low Bridge / Clearance Risk",
        category: "infrastructure",
        severityScale: "0_100",
        defaultWeight: 1.35,
        decayModel: "step",
        defaultTtlMinutes: 525600, // persistent
        confidenceSources: ["partner_feed", "public_feed", "internal_model", "user_report"],
        thresholds: { severe_if_vehicle_height_exceeds_m: 0.25, warn_if_vehicle_height_exceeds_m: 0.10 },
        ui: { icon: "alert-triangle", displayModes: ["tile", "pin", "segment_overlay"], legend: ["clear", "watch", "avoid"], actionable: ["reroute", "request_measurement", "submit_correction"] },
    },
    {
        layerId: "landslide_mudslide",
        name: "Landslide / Mudslide Risk",
        category: "hazard",
        severityScale: "0_100",
        defaultWeight: 1.15,
        decayModel: "exponential",
        defaultTtlMinutes: 10080, // 7d
        confidenceSources: ["public_feed", "internal_model", "user_report"],
        thresholds: { rainfall_trigger_mm_24h: 75, slope_trigger_deg: 20 },
        ui: { icon: "mountain", displayModes: ["tile", "pin"], legend: ["low", "medium", "high"], actionable: ["reroute", "delay_departure"] },
    },
    {
        layerId: "flood_flash_flood",
        name: "Flood / Flash Flood Risk",
        category: "weather",
        severityScale: "0_100",
        defaultWeight: 1.10,
        decayModel: "exponential",
        defaultTtlMinutes: 4320, // 3d
        confidenceSources: ["public_feed", "internal_model", "user_report"],
        thresholds: { rainfall_trigger_mm_24h: 60, river_level_trigger: "country_calibrated" },
        ui: { icon: "droplet", displayModes: ["tile", "pin", "segment_overlay"], legend: ["low", "medium", "high"], actionable: ["reroute", "avoid_low_water_crossings"] },
    },
    {
        layerId: "extreme_wind",
        name: "Extreme Wind Risk",
        category: "weather",
        severityScale: "0_100",
        defaultWeight: 0.95,
        decayModel: "linear",
        defaultTtlMinutes: 720, // 12h
        confidenceSources: ["public_feed", "internal_model", "user_report"],
        thresholds: { gust_warn_kph: 55, gust_severe_kph: 80 },
        ui: { icon: "wind", displayModes: ["tile"], legend: ["ok", "caution", "no_go"], actionable: ["reduce_speed", "delay_departure"] },
    },
    {
        layerId: "extreme_heat",
        name: "Extreme Heat / Pavement Stress",
        category: "weather",
        severityScale: "0_100",
        defaultWeight: 0.80,
        decayModel: "linear",
        defaultTtlMinutes: 1440, // 24h
        confidenceSources: ["public_feed", "internal_model"],
        thresholds: { heat_index_warn_c: 40, heat_index_severe_c: 47 },
        ui: { icon: "thermometer", displayModes: ["tile"], legend: ["ok", "caution", "high_risk"], actionable: ["time_shift_night", "tire_checklist"] },
    },
    {
        layerId: "wildfire_smoke",
        name: "Wildfire / Smoke / Closure",
        category: "hazard",
        severityScale: "0_100",
        defaultWeight: 1.05,
        decayModel: "exponential",
        defaultTtlMinutes: 2880, // 2d
        confidenceSources: ["public_feed", "internal_model"],
        thresholds: { visibility_warn_km: 2, closure_if_visibility_km: 0.5 },
        ui: { icon: "flame", displayModes: ["tile", "segment_overlay"], legend: ["low", "medium", "high"], actionable: ["reroute", "mask_advisory"] },
    },
    {
        layerId: "winter_ice_snow",
        name: "Winter Ice / Snow / Road Closure",
        category: "weather",
        severityScale: "0_100",
        defaultWeight: 1.00,
        decayModel: "linear",
        defaultTtlMinutes: 1440,
        confidenceSources: ["public_feed", "internal_model", "user_report"],
        thresholds: { ice_warn: true, snow_depth_warn_cm: 10 },
        ui: { icon: "snowflake", displayModes: ["tile", "segment_overlay"], legend: ["ok", "caution", "closure_likely"], actionable: ["chains_required", "delay_departure"] },
    },
    {
        layerId: "seasonal_weight_restrictions",
        name: "Seasonal Weight Restrictions (Thaw / Heat)",
        category: "regulatory",
        severityScale: "0_100",
        defaultWeight: 1.20,
        decayModel: "step",
        defaultTtlMinutes: 525600,
        confidenceSources: ["partner_feed", "public_feed", "internal_model"],
        thresholds: { active_window: "country_calendars" },
        ui: { icon: "scale", displayModes: ["segment_overlay"], legend: ["inactive", "active"], actionable: ["permit_required", "reroute"] },
    },
    {
        layerId: "road_quality_pothole",
        name: "Road Quality / Pothole / Surface Degradation",
        category: "infrastructure",
        severityScale: "0_100",
        defaultWeight: 0.70,
        decayModel: "exponential",
        defaultTtlMinutes: 20160, // 14d
        confidenceSources: ["user_report", "internal_model"],
        thresholds: { severe_if_reports_per_km: 3 },
        ui: { icon: "construction", displayModes: ["tile"], legend: ["good", "mixed", "rough"], actionable: ["speed_advisory"] },
    },
    {
        layerId: "security_cargo_theft",
        name: "Security / Cargo Theft Corridor Risk",
        category: "security",
        severityScale: "0_100",
        defaultWeight: 1.10,
        decayModel: "step",
        defaultTtlMinutes: 10080,
        confidenceSources: ["partner_feed", "internal_model", "user_report"],
        thresholds: { high_risk_if_score: 70 },
        ui: { icon: "shield", displayModes: ["tile", "pin"], legend: ["low", "medium", "high"], actionable: ["avoid_stops", "secure_parking_only"] },
    },
    {
        layerId: "escort_rule_variability",
        name: "Escort Rule Variability / Enforcement Volatility",
        category: "regulatory",
        severityScale: "0_100",
        defaultWeight: 1.25,
        decayModel: "step",
        defaultTtlMinutes: 43200, // 30d
        confidenceSources: ["partner_feed", "internal_model"],
        thresholds: { volatility_warn: 60 },
        ui: { icon: "clipboard-check", displayModes: ["tile"], legend: ["stable", "mixed", "volatile"], actionable: ["check_rules", "use_local_partner"] },
    },
    {
        layerId: "urban_restriction_zones",
        name: "Urban Restriction Zones (Low Emission / Time Windows / Size)",
        category: "constraint",
        severityScale: "0_100",
        defaultWeight: 1.05,
        decayModel: "step",
        defaultTtlMinutes: 525600,
        confidenceSources: ["public_feed", "partner_feed", "internal_model"],
        thresholds: { permit_required: true },
        ui: { icon: "map-pin", displayModes: ["polygon", "segment_overlay"], legend: ["allowed", "restricted", "forbidden"], actionable: ["request_permit", "time_shift"] },
    },
    {
        layerId: "movable_bridge_timing",
        name: "Movable Bridge Timing / Delays",
        category: "constraint",
        severityScale: "0_100",
        defaultWeight: 0.85,
        decayModel: "linear",
        defaultTtlMinutes: 360, // 6h
        confidenceSources: ["partner_feed", "user_report", "internal_model"],
        thresholds: { delay_warn_minutes: 20 },
        ui: { icon: "clock", displayModes: ["pin", "segment_overlay"], legend: ["ok", "delay_likely", "avoid"], actionable: ["reroute", "schedule_window"] },
    },
    {
        layerId: "sandstorm_visibility",
        name: "Sandstorm / Low Visibility",
        category: "weather",
        severityScale: "0_100",
        defaultWeight: 0.95,
        decayModel: "linear",
        defaultTtlMinutes: 360,
        confidenceSources: ["public_feed", "internal_model"],
        thresholds: { visibility_warn_km: 2, visibility_severe_km: 0.5 },
        ui: { icon: "eye-off", displayModes: ["tile"], legend: ["ok", "caution", "no_go"], actionable: ["delay_departure"] },
    },
];

// ── Lookup helpers ──

const _byId = new Map(RISK_LAYER_CATALOG.map(l => [l.layerId, l]));
export function getRiskLayer(id: string): RiskLayerDef | undefined { return _byId.get(id); }
export function getLayersByCategory(cat: RiskCategory): RiskLayerDef[] {
    return RISK_LAYER_CATALOG.filter(l => l.category === cat);
}

// ── UI grouping for map layers panel ──

export const RISK_LAYER_GROUPS = [
    { name: "Must-See", layerIds: ["low_bridge_clearance", "urban_restriction_zones", "seasonal_weight_restrictions", "winter_ice_snow", "flood_flash_flood"] },
    { name: "Weather", layerIds: ["extreme_wind", "extreme_heat", "wildfire_smoke", "sandstorm_visibility"] },
    { name: "Terrain", layerIds: ["landslide_mudslide"] },
    { name: "Security", layerIds: ["security_cargo_theft"] },
    { name: "Infrastructure", layerIds: ["road_quality_pothole", "movable_bridge_timing"] },
    { name: "Rules", layerIds: ["escort_rule_variability"] },
];

export const DEFAULT_ENABLED_GROUPS = {
    operator: ["Must-See", "Weather", "Terrain", "Security"],
    broker: ["Must-See", "Rules", "Security"],
    dispatcher: ["Must-See", "Weather", "Security"],
    compliance_admin: ["Must-See", "Rules"],
};

// ══════════════════════════════════════════════════════════════
// COUNTRY RISK MULTIPLIERS — All 52 countries
// These tune risk layer weights per geography
// ══════════════════════════════════════════════════════════════

type CountryMultipliers = Partial<Record<string, number>>;

export const COUNTRY_RISK_MULTIPLIERS: Record<string, CountryMultipliers> = {
    // ── Tier A Gold ──
    US: { wildfire_smoke: 1.20, flood_flash_flood: 1.15, urban_restriction_zones: 1.10 },
    CA: { winter_ice_snow: 1.35, seasonal_weight_restrictions: 1.25 },
    AU: { extreme_heat: 1.30, flood_flash_flood: 1.10 },
    GB: { low_bridge_clearance: 1.35, urban_restriction_zones: 1.20 },
    NZ: { landslide_mudslide: 1.35, flood_flash_flood: 1.15 },
    ZA: { security_cargo_theft: 1.35, road_quality_pothole: 1.15 },
    DE: { seasonal_weight_restrictions: 1.10, urban_restriction_zones: 1.15 },
    NL: { low_bridge_clearance: 1.25, movable_bridge_timing: 1.25 },
    AE: { extreme_heat: 1.40, sandstorm_visibility: 1.35 },
    BR: { security_cargo_theft: 1.30, flood_flash_flood: 1.20, road_quality_pothole: 1.15 },

    // ── Tier B Blue ──
    IE: { extreme_wind: 1.20 },
    SE: { winter_ice_snow: 1.35, seasonal_weight_restrictions: 1.15 },
    NO: { winter_ice_snow: 1.40, extreme_wind: 1.15 },
    DK: { extreme_wind: 1.15 },
    FI: { winter_ice_snow: 1.35 },
    BE: { urban_restriction_zones: 1.10 },
    AT: { low_bridge_clearance: 1.10, landslide_mudslide: 1.10 },
    CH: { low_bridge_clearance: 1.10, landslide_mudslide: 1.10 },
    ES: { wildfire_smoke: 1.15, extreme_heat: 1.10 },
    FR: { urban_restriction_zones: 1.15 },
    IT: { landslide_mudslide: 1.20, urban_restriction_zones: 1.15 },
    PT: { wildfire_smoke: 1.10, extreme_heat: 1.10 },
    SA: { extreme_heat: 1.45, sandstorm_visibility: 1.25 },
    QA: { extreme_heat: 1.45, sandstorm_visibility: 1.20 },
    MX: { security_cargo_theft: 1.35, flood_flash_flood: 1.10 },

    // ── Tier C Silver ──
    PL: { winter_ice_snow: 1.10, escort_rule_variability: 1.10 },
    CZ: { winter_ice_snow: 1.05 },
    SK: { winter_ice_snow: 1.05 },
    HU: { escort_rule_variability: 1.10 },
    SI: { landslide_mudslide: 1.10 },
    EE: { winter_ice_snow: 1.20 },
    LV: { winter_ice_snow: 1.20 },
    LT: { winter_ice_snow: 1.20 },
    HR: { landslide_mudslide: 1.15, extreme_wind: 1.10 },
    RO: { winter_ice_snow: 1.10, road_quality_pothole: 1.10 },
    BG: { winter_ice_snow: 1.05 },
    GR: { wildfire_smoke: 1.15, extreme_heat: 1.10 },
    TR: { landslide_mudslide: 1.15, flood_flash_flood: 1.10 },
    KW: { extreme_heat: 1.45, sandstorm_visibility: 1.25 },
    OM: { extreme_heat: 1.35, flood_flash_flood: 1.10 },
    BH: { extreme_heat: 1.35 },
    SG: { urban_restriction_zones: 1.25, escort_rule_variability: 1.15 },
    MY: { flood_flash_flood: 1.25, landslide_mudslide: 1.20 },
    JP: { landslide_mudslide: 1.20, flood_flash_flood: 1.20, low_bridge_clearance: 1.10 },
    KR: { urban_restriction_zones: 1.20 },
    CL: { extreme_wind: 1.15, landslide_mudslide: 1.10 },
    AR: { extreme_wind: 1.25 },
    CO: { landslide_mudslide: 1.30, security_cargo_theft: 1.15 },
    PE: { landslide_mudslide: 1.35 },

    // ── Tier D Slate ──
    UY: { flood_flash_flood: 1.05 },
    PA: { flood_flash_flood: 1.20 },
    CR: { flood_flash_flood: 1.25, landslide_mudslide: 1.25 },
};

// ── Waze-style addon config per country (mobile app features) ──

export interface WazeAddon {
    reportButtonPack?: string[];
    features?: Record<string, boolean>;
}

export const COUNTRY_WAZE_ADDONS: Record<string, WazeAddon> = {
    US: { reportButtonPack: ["hurricane", "wildfire", "low_bridge", "accident", "closure"], features: { state_rule_switcher: true } },
    CA: { reportButtonPack: ["ice", "whiteout", "moose", "closure"], features: { thaw_restriction_calendar: true } },
    AU: { reportButtonPack: ["flooded_road", "road_train", "fuel_gap", "heat"], features: { remote_survival_score: true } },
    GB: { reportButtonPack: ["low_bridge", "tight_turn", "restriction_zone"], features: { clean_zone_alerts: true } },
    NZ: { reportButtonPack: ["landslide", "slip", "pass_closed"], features: { seismic_disruption_alerts: true } },
    ZA: { reportButtonPack: ["security_risk", "pothole_cluster", "wildlife"], features: { safe_parking_only: true } },
    DE: { reportButtonPack: ["truck_ban", "construction", "env_zone"], features: { truck_ban_calendar: true, environmental_zone_alerts: true } },
    NL: { reportButtonPack: ["movable_bridge", "canal", "height_limit"], features: { movable_bridge_windows: true, canal_crossing_density: true } },
    AE: { reportButtonPack: ["sandstorm", "heat", "construction"], features: { sandstorm_index: true, heat_shift_scheduler: true } },
    BR: { reportButtonPack: ["security", "flood", "pothole"], features: { security_heatmap: true, flood_alerts: true } },
    IE: { reportButtonPack: ["wind", "flooding", "narrow_road"] },
    SE: { reportButtonPack: ["ice", "moose", "closure"] },
    NO: { reportButtonPack: ["ice", "avalanche", "pass_closed"], features: { mountain_pass_status: true } },
    DK: { reportButtonPack: ["wind", "bridge_warning"], features: { bridge_wind_alerts: true } },
    FI: { reportButtonPack: ["ice", "moose", "reindeer"], features: { wildlife_heatmap: true } },
    BE: { reportButtonPack: ["restriction_zone", "construction"] },
    AT: { reportButtonPack: ["alpine_pass", "construction", "landslide"], features: { alpine_pass_planner: true } },
    CH: { reportButtonPack: ["alpine_pass", "construction", "tunnel"], features: { alpine_pass_planner: true } },
    ES: { reportButtonPack: ["wildfire", "heat", "construction"], features: { wildfire_layer: true } },
    FR: { reportButtonPack: ["restriction_zone", "construction", "wind"], features: { clean_zone_alerts: true } },
    IT: { reportButtonPack: ["landslide", "tight_turn", "restriction_zone"], features: { tight_turn_warning: true } },
    PT: { reportButtonPack: ["wildfire", "heat", "construction"], features: { fire_risk_index: true } },
    SA: { reportButtonPack: ["heat", "sandstorm", "police_escort"], features: { heat_shift_scheduler: true } },
    QA: { reportButtonPack: ["heat", "sandstorm"], features: { sandstorm_index: true } },
    MX: { reportButtonPack: ["security", "flood", "construction"], features: { security_heatmap: true } },
    PL: { reportButtonPack: ["ice", "construction", "enforcement"], features: { enforcement_volatility_index: true } },
    CZ: { reportButtonPack: ["ice", "bridge", "construction"], features: { bridge_confidence_score: true } },
    SK: { reportButtonPack: ["ice", "mountain_grade"], features: { mountain_grade_alerts: true } },
    HU: { reportButtonPack: ["enforcement", "construction"], features: { document_readiness_checker: true } },
    SI: { reportButtonPack: ["landslide", "pass"], features: { pass_status: true } },
    EE: { reportButtonPack: ["ice", "wildlife"], features: { ice_index: true } },
    LV: { reportButtonPack: ["ice", "wildlife"], features: { ice_index: true } },
    LT: { reportButtonPack: ["ice", "wildlife"], features: { ice_index: true } },
    HR: { reportButtonPack: ["wind", "landslide", "construction"], features: { coastal_wind_alerts: true } },
    RO: { reportButtonPack: ["ice", "pothole", "construction"], features: { road_quality_score: true } },
    BG: { reportButtonPack: ["ice", "bridge", "construction"], features: { bridge_confidence_score: true } },
    GR: { reportButtonPack: ["wildfire", "heat", "construction"], features: { fire_risk_index: true } },
    TR: { reportButtonPack: ["earthquake", "landslide", "strait"], features: { seismic_disruption_alerts: true, strait_crossing_planner: true } },
    KW: { reportButtonPack: ["heat", "sandstorm"], features: { sandstorm_index: true } },
    OM: { reportButtonPack: ["heat", "wadi_flood"], features: { wadi_flood_alerts: true } },
    BH: { reportButtonPack: ["heat"], features: { heat_shift_scheduler: true } },
    SG: { reportButtonPack: ["restriction_zone", "time_window"], features: { time_window_enforcement: true } },
    MY: { reportButtonPack: ["flood", "landslide", "monsoon"], features: { monsoon_mode: true } },
    JP: { reportButtonPack: ["earthquake", "typhoon", "clearance"], features: { typhoon_tracker: true, seismic_disruption_alerts: true, micro_clearance_routing: true } },
    KR: { reportButtonPack: ["restriction_zone", "mountain_grade"], features: { mountain_grade_alerts: true } },
    CL: { reportButtonPack: ["wind", "earthquake", "andes_pass"], features: { andes_pass_warnings: true, seismic_disruption_alerts: true } },
    AR: { reportButtonPack: ["wind", "fuel_gap"], features: { wind_severity_index: true } },
    CO: { reportButtonPack: ["landslide", "security", "mountain"], features: { mountain_corridor_alerts: true } },
    PE: { reportButtonPack: ["landslide", "altitude"], features: { altitude_stress_index: true } },
    UY: { reportButtonPack: ["flood"], features: { flood_layer: true } },
    PA: { reportButtonPack: ["flood", "canal"], features: { canal_corridor_planner: true } },
    CR: { reportButtonPack: ["flood", "landslide", "rainfall"], features: { rainfall_intensity_feed: true } },
};

// ── TTL overrides by country ──

export const TTL_OVERRIDES: Record<string, Partial<Record<string, number>>> = {
    JP: { sandstorm_visibility: 360, flood_flash_flood: 1440 },
    AU: { flood_flash_flood: 2880 },
    GB: { winter_ice_snow: 720 },
};

// ── Route risk grade thresholds ──

export const ROUTE_RISK_GRADES: { grade: RouteRiskGrade; maxScore: number }[] = [
    { grade: "A", maxScore: 15 },
    { grade: "B", maxScore: 30 },
    { grade: "C", maxScore: 50 },
    { grade: "D", maxScore: 70 },
    { grade: "F", maxScore: 100 },
];

export function getRouteRiskGrade(score: number): RouteRiskGrade {
    for (const { grade, maxScore } of ROUTE_RISK_GRADES) {
        if (score <= maxScore) return grade;
    }
    return "F";
}
