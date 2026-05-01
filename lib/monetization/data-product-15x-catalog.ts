// lib/monetization/data-product-15x-catalog.ts
// ══════════════════════════════════════════════════════════════
// HAUL COMMAND 15X DATA PRODUCT CATALOG
//
// This file is the strategic product layer that turns Haul Command's
// public + platform + partner + derived intelligence into a self-serve
// data business. It is intentionally industry-specific: ports,
// corridors, borders, escorts, permits, staging yards, infrastructure,
// brokers, carriers, and 120-country market differences.
//
// Guardrail: sell aggregate, redacted, confidence-scored intelligence.
// Do not expose private personal data as a bulk export.
// ══════════════════════════════════════════════════════════════

export type MarketMaturity = 'live' | 'building' | 'sparse' | 'request_only' | 'blocked';
export type SourceClass = 'platform' | 'public' | 'partner' | 'manual_verified' | 'derived' | 'mixed';
export type PrivacyClass = 'aggregate_safe' | 'redacted' | 'gated_sensitive' | 'enterprise_review_required' | 'blocked';
export type BuyerRole =
  | 'broker'
  | 'carrier'
  | 'pilot_car_operator'
  | 'permit_service'
  | 'port_operator'
  | 'wind_energy'
  | 'construction'
  | 'mining'
  | 'insurance'
  | 'government'
  | 'infrastructure_owner'
  | 'sponsor'
  | 'developer';

export interface DataProduct15X {
  id: string;
  name: string;
  buyer_roles: BuyerRole[];
  base_price_usd: number;
  max_price_usd: number;
  purchase_model: 'one_time' | 'monthly' | 'metered' | 'enterprise';
  country_scope: 'ALL_120' | string[];
  geo_granularity: Array<'country' | 'state' | 'province' | 'city' | 'county' | 'corridor' | 'port' | 'border_crossing' | 'industrial_zone' | 'h3_cell'>;
  source_class: SourceClass;
  privacy_class: PrivacyClass;
  maturity_default: MarketMaturity;
  refresh_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'on_request';
  preview_fields: string[];
  paid_fields: string[];
  why_it_sells: string;
  cultural_localization_notes: string;
}

export const HC_15X_DATA_PRODUCTS: DataProduct15X[] = [
  {
    id: 'broker-demand-heatmap',
    name: 'Broker Demand Heatmap',
    buyer_roles: ['broker', 'carrier', 'sponsor'],
    base_price_usd: 199,
    max_price_usd: 2500,
    purchase_model: 'monthly',
    country_scope: 'ALL_120',
    geo_granularity: ['country', 'state', 'province', 'city', 'corridor', 'port', 'border_crossing', 'industrial_zone', 'h3_cell'],
    source_class: 'mixed',
    privacy_class: 'aggregate_safe',
    maturity_default: 'building',
    refresh_frequency: 'daily',
    preview_fields: ['market', 'demand_direction', 'visible_corridor_count', 'confidence_band'],
    paid_fields: ['demand_score', 'load_post_velocity', 'broker_activity_density', 'port_pressure_score', 'seasonality_flags', 'religious_holiday_disruption_flags', 'scarcity_premium_estimate'],
    why_it_sells: 'Brokers pay because it shows where heavy haul demand is heating up before capacity gets expensive.',
    cultural_localization_notes: 'Country overlays must account for local work weeks, holidays, port customs behavior, religious shutdown windows, and local escort terminology.',
  },
  {
    id: 'corridor-liquidity-index',
    name: 'Corridor Liquidity Index',
    buyer_roles: ['broker', 'carrier', 'insurance', 'government'],
    base_price_usd: 79,
    max_price_usd: 999,
    purchase_model: 'monthly',
    country_scope: 'ALL_120',
    geo_granularity: ['corridor', 'border_crossing', 'port', 'industrial_zone'],
    source_class: 'derived',
    privacy_class: 'aggregate_safe',
    maturity_default: 'building',
    refresh_frequency: 'daily',
    preview_fields: ['corridor_name', 'liquidity_band', 'freshness', 'confidence_band'],
    paid_fields: ['liquidity_score', 'fill_probability', 'operator_density', 'average_response_time', 'rate_pressure', 'delay_risk_score', 'permit_complexity_score'],
    why_it_sells: 'This becomes the DAT-style signal for oversize/heavy-haul corridors: where capacity exists, where it is short, and where prices should rise.',
    cultural_localization_notes: 'Use country-specific route naming, units, permit regimes, weekend rules, port calendars, and language variants.',
  },
  {
    id: 'operator-scarcity-map',
    name: 'Operator Scarcity Map',
    buyer_roles: ['broker', 'carrier', 'permit_service', 'wind_energy', 'construction', 'mining'],
    base_price_usd: 59,
    max_price_usd: 1500,
    purchase_model: 'monthly',
    country_scope: 'ALL_120',
    geo_granularity: ['country', 'state', 'province', 'city', 'county', 'corridor', 'h3_cell'],
    source_class: 'mixed',
    privacy_class: 'redacted',
    maturity_default: 'building',
    refresh_frequency: 'weekly',
    preview_fields: ['market', 'scarcity_band', 'visible_operator_count', 'confidence_band'],
    paid_fields: ['scarcity_score', 'claimed_operator_count', 'verified_operator_count', 'equipment_coverage', 'certification_coverage', 'high_pole_availability', 'night_move_availability'],
    why_it_sells: 'People pay to know where pilot car capacity is thin before they quote or accept specialized freight.',
    cultural_localization_notes: 'Terminology must adapt: pilot car, escort vehicle, abnormal load escort, traffic management, steersman, banksman, route surveyor, and country-specific equivalents.',
  },
  {
    id: 'port-heavy-haul-pressure-index',
    name: 'Port Heavy-Haul Pressure Index',
    buyer_roles: ['broker', 'carrier', 'port_operator', 'wind_energy', 'construction', 'government', 'sponsor'],
    base_price_usd: 149,
    max_price_usd: 5000,
    purchase_model: 'monthly',
    country_scope: 'ALL_120',
    geo_granularity: ['port', 'city', 'corridor', 'industrial_zone', 'h3_cell'],
    source_class: 'mixed',
    privacy_class: 'aggregate_safe',
    maturity_default: 'request_only',
    refresh_frequency: 'weekly',
    preview_fields: ['port_name', 'country', 'pressure_band', 'confidence_band'],
    paid_fields: ['oversize_outbound_pressure', 'escort_shortage_near_port', 'staging_yard_density', 'nearby_truck_stop_fit', 'permit_route_complexity', 'industrial_project_signals'],
    why_it_sells: 'Ports create huge oversized movement spikes. A port-specific index lets brokers, carriers, and sponsors buy market visibility around industrial freight flows.',
    cultural_localization_notes: 'Must account for port working hours, customs delays, port religious closures, union/strike risk, local permit offices, and common local load types.',
  },
  {
    id: 'cross-border-escort-readiness-pack',
    name: 'Cross-Border Escort Readiness Pack',
    buyer_roles: ['broker', 'carrier', 'permit_service', 'government'],
    base_price_usd: 99,
    max_price_usd: 2500,
    purchase_model: 'one_time',
    country_scope: 'ALL_120',
    geo_granularity: ['country', 'border_crossing', 'corridor'],
    source_class: 'public',
    privacy_class: 'aggregate_safe',
    maturity_default: 'building',
    refresh_frequency: 'monthly',
    preview_fields: ['origin_country', 'destination_country', 'readiness_band'],
    paid_fields: ['escort_rule_summary', 'permit_authorities', 'documentation_checklist', 'holiday_restrictions', 'border_delay_risk', 'language_notes', 'local_partner_gap_score'],
    why_it_sells: 'Cross-border heavy haul is confusing. A clean readiness pack saves brokers and carriers hours and reduces quote mistakes.',
    cultural_localization_notes: 'Local language, official ministry naming, measurement units, workweek, holidays, and religious/customs calendars must be baked in.',
  },
  {
    id: 'infrastructure-staging-yard-map',
    name: 'Infrastructure, Staging Yard & Escort Meetup Map',
    buyer_roles: ['broker', 'carrier', 'pilot_car_operator', 'infrastructure_owner', 'sponsor'],
    base_price_usd: 49,
    max_price_usd: 1999,
    purchase_model: 'monthly',
    country_scope: 'ALL_120',
    geo_granularity: ['city', 'county', 'corridor', 'port', 'industrial_zone', 'h3_cell'],
    source_class: 'mixed',
    privacy_class: 'redacted',
    maturity_default: 'building',
    refresh_frequency: 'weekly',
    preview_fields: ['market', 'site_count', 'coverage_band'],
    paid_fields: ['oversize_friendly_parking', 'staging_yards', 'escort_meetup_zones', 'truck_stops', 'repair_install_locations', 'security_level', 'after_hours_fit'],
    why_it_sells: 'This turns Haul Command into the infrastructure map for oversized freight, not just a directory.',
    cultural_localization_notes: 'Different countries have different overnight parking norms, safety expectations, fuel networks, legal stopping rules, and facility naming conventions.',
  },
  {
    id: 'permit-escort-requirement-dataset',
    name: 'Permit & Escort Requirement Dataset',
    buyer_roles: ['broker', 'carrier', 'permit_service', 'government', 'developer'],
    base_price_usd: 49,
    max_price_usd: 5000,
    purchase_model: 'monthly',
    country_scope: 'ALL_120',
    geo_granularity: ['country', 'state', 'province', 'corridor'],
    source_class: 'public',
    privacy_class: 'aggregate_safe',
    maturity_default: 'building',
    refresh_frequency: 'monthly',
    preview_fields: ['jurisdiction', 'coverage_band', 'last_reviewed_at'],
    paid_fields: ['dimension_triggers', 'weight_triggers', 'escort_counts', 'route_survey_triggers', 'night_weekend_rules', 'holiday_rules', 'authority_links', 'confidence_metadata'],
    why_it_sells: 'This is the rules dataset everyone needs before pricing or moving loads.',
    cultural_localization_notes: 'Regulations must be localized by official source language, local legal terminology, metric/imperial units, and religious/national holiday movement restrictions.',
  },
  {
    id: 'market-entry-war-room-pack',
    name: 'Market Entry War Room Pack',
    buyer_roles: ['broker', 'carrier', 'sponsor', 'wind_energy', 'construction', 'mining'],
    base_price_usd: 299,
    max_price_usd: 10000,
    purchase_model: 'enterprise',
    country_scope: 'ALL_120',
    geo_granularity: ['country', 'state', 'province', 'city', 'corridor', 'port', 'industrial_zone'],
    source_class: 'mixed',
    privacy_class: 'enterprise_review_required',
    maturity_default: 'request_only',
    refresh_frequency: 'on_request',
    preview_fields: ['market', 'opportunity_band', 'known_constraints'],
    paid_fields: ['top_corridors', 'capacity_gaps', 'competitor_density', 'permit_complexity', 'port_pressure', 'infrastructure_gaps', 'partner_targets', 'launch_sequence'],
    why_it_sells: 'This is the expensive product: a broker/carrier entering a new country, state, port, or industrial corridor can buy a fast market map instead of guessing.',
    cultural_localization_notes: 'Must localize by culture, language, business trust norms, public holidays, religion, port behavior, and local heavy-haul ecosystem structure.',
  },
];

export function get15XProduct(productId: string) {
  return HC_15X_DATA_PRODUCTS.find(product => product.id === productId);
}

export function get15XProductsForRole(role: BuyerRole) {
  return HC_15X_DATA_PRODUCTS.filter(product => product.buyer_roles.includes(role));
}

export function get15XProductsForGeoKind(kind: DataProduct15X['geo_granularity'][number]) {
  return HC_15X_DATA_PRODUCTS.filter(product => product.geo_granularity.includes(kind));
}

export const COUNTRY_LOCALIZATION_DIMENSIONS = [
  'official_language',
  'secondary_languages',
  'local_heavy_haul_terms',
  'measurement_system',
  'currency',
  'work_week',
  'weekend_restrictions',
  'religious_holidays',
  'national_holidays',
  'port_operating_norms',
  'border_crossing_norms',
  'permit_authority_structure',
  'escort_certification_model',
  'common_industrial_load_types',
  'local_trust_signals',
] as const;
