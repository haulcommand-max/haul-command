// lib/strategy/city-corridor-priority.ts
//
// City Strike Map + Corridor Scoring Engine
// Spec: HCOS-CITY-STRIKE-MAP-01 + HCOS-CORRIDOR-STRIKE-SYSTEM-01
//
// Provides:
// - City priority scoring with tier ranking
// - Corridor scoring with freight density mapping
// - Operator density threshold monitoring
// - Liquidity status computation

// ============================================================
// TYPES
// ============================================================

export interface CityScore {
    city: string;
    country_iso2: string;
    state_admin1?: string;
    tier: 1 | 2 | 3;
    score: number;
    rationale: string;
    year1_install_target: number;
    liquidity_status: 'red' | 'yellow' | 'green' | 'blue';
}

export interface CorridorScore {
    name: string;
    route: string;
    country_iso2: string;
    tier: 1 | 2 | 3;
    score: number;
    year1_priority: 'extreme' | 'high' | 'medium' | 'monitor';
    connected_cities: string[];
    connected_ports: string[];
}

export interface LiquidityThresholds {
    operators_active_min: number;
    jobs_weekly_min: number;
    match_success_target: number;
    time_to_fill_hours: number;
}

export interface DensityStatus {
    city: string;
    operators_active: number;
    jobs_weekly: number;
    match_success_rate: number;
    liquidity_ratio: number;
    status: 'red' | 'yellow' | 'green' | 'blue';
    actions_recommended: string[];
}

// ============================================================
// CITY SCORING WEIGHTS
// ============================================================

const CITY_WEIGHTS = {
    freight_activity: 0.30,
    port_or_corridor_proximity: 0.20,
    heavy_industry_presence: 0.15,
    existing_operator_density: 0.15,
    digital_adoption: 0.10,
    competition_gap: 0.10,
} as const;

// ============================================================
// CORRIDOR SCORING WEIGHTS
// ============================================================

const CORRIDOR_WEIGHTS = {
    freight_volume_proxy: 0.35,
    port_connectivity: 0.20,
    heavy_industry_presence: 0.15,
    oversize_activity_likelihood: 0.15,
    digital_market_readiness: 0.10,
    competition_gap: 0.05,
} as const;

// ============================================================
// TIER 1 ANCHOR CITIES (pre-scored)
// ============================================================

const TIER_1_CITIES: CityScore[] = [
    // US
    { city: 'Houston, TX', country_iso2: 'US', state_admin1: 'TX', tier: 1, score: 96, rationale: 'energy + port + oversize corridor hub', year1_install_target: 65000, liquidity_status: 'red' },
    { city: 'Dallas–Fort Worth, TX', country_iso2: 'US', state_admin1: 'TX', tier: 1, score: 94, rationale: 'major freight crossroads', year1_install_target: 60000, liquidity_status: 'red' },
    { city: 'Los Angeles, CA', country_iso2: 'US', state_admin1: 'CA', tier: 1, score: 93, rationale: 'largest port complex in US', year1_install_target: 55000, liquidity_status: 'red' },
    { city: 'Atlanta, GA', country_iso2: 'US', state_admin1: 'GA', tier: 1, score: 91, rationale: 'southeast logistics nerve center', year1_install_target: 50000, liquidity_status: 'red' },
    { city: 'Chicago, IL', country_iso2: 'US', state_admin1: 'IL', tier: 1, score: 90, rationale: 'rail + trucking superhub', year1_install_target: 50000, liquidity_status: 'red' },
    { city: 'Phoenix, AZ', country_iso2: 'US', state_admin1: 'AZ', tier: 1, score: 88, rationale: 'southwest growth corridor', year1_install_target: 35000, liquidity_status: 'red' },
    { city: 'Jacksonville, FL', country_iso2: 'US', state_admin1: 'FL', tier: 1, score: 87, rationale: 'port + southeast freight gateway', year1_install_target: 30000, liquidity_status: 'red' },
    { city: 'Kansas City, MO', country_iso2: 'US', state_admin1: 'MO', tier: 1, score: 86, rationale: 'central US corridor leverage', year1_install_target: 25000, liquidity_status: 'red' },
    // Canada
    { city: 'Toronto, ON', country_iso2: 'CA', state_admin1: 'ON', tier: 1, score: 92, rationale: 'largest Canadian freight market', year1_install_target: 40000, liquidity_status: 'red' },
    { city: 'Calgary, AB', country_iso2: 'CA', state_admin1: 'AB', tier: 1, score: 88, rationale: 'energy + heavy haul activity', year1_install_target: 25000, liquidity_status: 'red' },
    { city: 'Vancouver, BC', country_iso2: 'CA', state_admin1: 'BC', tier: 1, score: 87, rationale: 'major Pacific port', year1_install_target: 25000, liquidity_status: 'red' },
    // International
    { city: 'Perth, AU', country_iso2: 'AU', state_admin1: 'WA', tier: 1, score: 90, rationale: 'mining + oversize demand', year1_install_target: 20000, liquidity_status: 'red' },
    { city: 'Sydney, AU', country_iso2: 'AU', state_admin1: 'NSW', tier: 1, score: 88, rationale: 'largest AU logistics market', year1_install_target: 20000, liquidity_status: 'red' },
    { city: 'London, UK', country_iso2: 'GB', state_admin1: 'ENG', tier: 1, score: 86, rationale: 'abnormal load ecosystem', year1_install_target: 18000, liquidity_status: 'red' },
    { city: 'Auckland, NZ', country_iso2: 'NZ', state_admin1: 'AUK', tier: 1, score: 84, rationale: 'NZ logistics concentration', year1_install_target: 12000, liquidity_status: 'red' },
];

// ============================================================
// TIER 2 EXPANSION CITIES
// ============================================================

const TIER_2_CITIES: CityScore[] = [
    { city: 'San Antonio, TX', country_iso2: 'US', tier: 2, score: 79, rationale: 'I-35/I-10 intersection', year1_install_target: 15000, liquidity_status: 'red' },
    { city: 'Savannah, GA', country_iso2: 'US', tier: 2, score: 78, rationale: 'major port growth', year1_install_target: 12000, liquidity_status: 'red' },
    { city: 'Miami, FL', country_iso2: 'US', tier: 2, score: 77, rationale: 'LATAM cargo gateway', year1_install_target: 12000, liquidity_status: 'red' },
    { city: 'Tampa, FL', country_iso2: 'US', tier: 2, score: 76, rationale: 'I-4/I-75 junction', year1_install_target: 10000, liquidity_status: 'red' },
    { city: 'Indianapolis, IN', country_iso2: 'US', tier: 2, score: 75, rationale: 'crossroads of America', year1_install_target: 10000, liquidity_status: 'red' },
    { city: 'Columbus, OH', country_iso2: 'US', tier: 2, score: 74, rationale: 'midwest manufacturing', year1_install_target: 8000, liquidity_status: 'red' },
    { city: 'Salt Lake City, UT', country_iso2: 'US', tier: 2, score: 73, rationale: 'western corridor hub', year1_install_target: 8000, liquidity_status: 'red' },
    { city: 'Reno, NV', country_iso2: 'US', tier: 2, score: 72, rationale: 'I-80 + distribution growth', year1_install_target: 6000, liquidity_status: 'red' },
    { city: 'Memphis, TN', country_iso2: 'US', tier: 2, score: 72, rationale: 'freight logistics capital', year1_install_target: 8000, liquidity_status: 'red' },
    { city: 'Birmingham, AL', country_iso2: 'US', tier: 2, score: 70, rationale: 'southeast industrial', year1_install_target: 6000, liquidity_status: 'red' },
    { city: 'Edmonton, AB', country_iso2: 'CA', tier: 2, score: 76, rationale: 'energy + heavy industry', year1_install_target: 8000, liquidity_status: 'red' },
    { city: 'Winnipeg, MB', country_iso2: 'CA', tier: 2, score: 71, rationale: 'central Canada gateway', year1_install_target: 5000, liquidity_status: 'red' },
    { city: 'Montreal, QC', country_iso2: 'CA', tier: 2, score: 74, rationale: 'eastern corridor anchor', year1_install_target: 8000, liquidity_status: 'red' },
    { city: 'Melbourne, AU', country_iso2: 'AU', tier: 2, score: 75, rationale: 'second largest AU market', year1_install_target: 8000, liquidity_status: 'red' },
    { city: 'Brisbane, AU', country_iso2: 'AU', tier: 2, score: 73, rationale: 'QLD mining logistics', year1_install_target: 6000, liquidity_status: 'red' },
    { city: 'Rotterdam, NL', country_iso2: 'NL', tier: 2, score: 78, rationale: "Europe's largest port", year1_install_target: 6000, liquidity_status: 'red' },
    { city: 'Dubai, UAE', country_iso2: 'AE', tier: 2, score: 77, rationale: 'project cargo hub', year1_install_target: 8000, liquidity_status: 'red' },
    { city: 'Johannesburg, ZA', country_iso2: 'ZA', tier: 2, score: 76, rationale: 'SA industrial center', year1_install_target: 8000, liquidity_status: 'red' },
    { city: 'São Paulo, BR', country_iso2: 'BR', tier: 2, score: 75, rationale: 'largest LATAM logistics hub', year1_install_target: 10000, liquidity_status: 'red' },
];

// ============================================================
// TIER 1 CORRIDORS
// ============================================================

const TIER_1_CORRIDORS: CorridorScore[] = [
    { name: 'I-10 Gulf Corridor', route: 'Los Angeles → Phoenix → San Antonio → Houston → Jacksonville', country_iso2: 'US', tier: 1, score: 97, year1_priority: 'extreme', connected_cities: ['Los Angeles, CA', 'Phoenix, AZ', 'San Antonio, TX', 'Houston, TX', 'Jacksonville, FL'], connected_ports: ['Port of Los Angeles', 'Port of Houston', 'JAXPORT'] },
    { name: 'Texas Triangle Heavy Haul Loop', route: 'Dallas–Fort Worth ↔ Houston ↔ San Antonio', country_iso2: 'US', tier: 1, score: 96, year1_priority: 'extreme', connected_cities: ['Dallas–Fort Worth, TX', 'Houston, TX', 'San Antonio, TX'], connected_ports: ['Port of Houston'] },
    { name: 'I-35 NAFTA Spine', route: 'Laredo → San Antonio → Dallas → Oklahoma City → Kansas City', country_iso2: 'US', tier: 1, score: 94, year1_priority: 'extreme', connected_cities: ['San Antonio, TX', 'Dallas–Fort Worth, TX', 'Kansas City, MO'], connected_ports: [] },
    { name: 'I-75 Southeast Manufacturing', route: 'Detroit → Cincinnati → Atlanta → Florida', country_iso2: 'US', tier: 1, score: 92, year1_priority: 'high', connected_cities: ['Atlanta, GA', 'Jacksonville, FL', 'Tampa, FL'], connected_ports: ['JAXPORT', 'Port Tampa Bay'] },
    { name: 'I-80 Transcontinental Freightway', route: 'Oakland → Reno → Salt Lake City → Omaha → Chicago', country_iso2: 'US', tier: 1, score: 91, year1_priority: 'high', connected_cities: ['Chicago, IL', 'Salt Lake City, UT', 'Reno, NV'], connected_ports: ['Port of Oakland'] },
    { name: 'Highway 401 Super Corridor', route: 'Windsor → Toronto → Montreal', country_iso2: 'CA', tier: 1, score: 93, year1_priority: 'extreme', connected_cities: ['Toronto, ON', 'Montreal, QC'], connected_ports: ['Port of Montreal'] },
    { name: 'Alberta Energy Corridor', route: 'Edmonton ↔ Calgary', country_iso2: 'CA', tier: 1, score: 89, year1_priority: 'high', connected_cities: ['Calgary, AB', 'Edmonton, AB'], connected_ports: [] },
    { name: 'Perth Mining Logistics Belt', route: 'Perth → Pilbara region', country_iso2: 'AU', tier: 1, score: 90, year1_priority: 'high', connected_cities: ['Perth, AU'], connected_ports: ['Port Hedland', 'Dampier'] },
    { name: 'UK Midlands Abnormal Load Corridor', route: 'Birmingham → Manchester → Leeds', country_iso2: 'GB', tier: 1, score: 88, year1_priority: 'high', connected_cities: ['London, UK'], connected_ports: ['Port of Liverpool', 'Port of Hull'] },
    { name: 'Gauteng Industrial Spine', route: 'Johannesburg ↔ Pretoria', country_iso2: 'ZA', tier: 1, score: 86, year1_priority: 'high', connected_cities: ['Johannesburg, ZA'], connected_ports: ['Port of Durban'] },
    { name: 'UAE Project Cargo Corridor', route: 'Dubai ↔ Abu Dhabi', country_iso2: 'AE', tier: 1, score: 85, year1_priority: 'medium', connected_cities: ['Dubai, UAE'], connected_ports: ['Jebel Ali', 'Khalifa Port'] },
];

// ============================================================
// LIQUIDITY THRESHOLDS
// ============================================================

const LIQUIDITY_THRESHOLDS: Record<1 | 2 | 3, LiquidityThresholds> = {
    1: { operators_active_min: 60, jobs_weekly_min: 40, match_success_target: 0.50, time_to_fill_hours: 18 },
    2: { operators_active_min: 35, jobs_weekly_min: 20, match_success_target: 0.40, time_to_fill_hours: 24 },
    3: { operators_active_min: 15, jobs_weekly_min: 8, match_success_target: 0.30, time_to_fill_hours: 36 },
};

// ============================================================
// PUBLIC API
// ============================================================

export function getAllCities(): CityScore[] {
    return [...TIER_1_CITIES, ...TIER_2_CITIES];
}

export function getTier1Cities(): CityScore[] {
    return TIER_1_CITIES;
}

export function getTier1Corridors(): CorridorScore[] {
    return TIER_1_CORRIDORS;
}

export function getCitiesByCountry(countryIso2: string): CityScore[] {
    return getAllCities().filter(c => c.country_iso2 === countryIso2);
}

export function getCorridorsByCountry(countryIso2: string): CorridorScore[] {
    return TIER_1_CORRIDORS.filter(c => c.country_iso2 === countryIso2);
}

export function getLiquidityThresholds(tier: 1 | 2 | 3): LiquidityThresholds {
    return LIQUIDITY_THRESHOLDS[tier];
}

/**
 * Compute density status for a city based on live metrics.
 */
export function computeDensityStatus(
    city: string,
    tier: 1 | 2 | 3,
    metrics: { operators_active: number; jobs_weekly: number; match_success_rate: number }
): DensityStatus {
    const thresholds = LIQUIDITY_THRESHOLDS[tier];
    const liquidityRatio = metrics.jobs_weekly > 0
        ? metrics.operators_active / metrics.jobs_weekly
        : metrics.operators_active > 0 ? 999 : 0;

    const actions: string[] = [];
    let status: DensityStatus['status'] = 'red';

    // Determine status
    if (
        metrics.operators_active >= thresholds.operators_active_min * 2 &&
        metrics.jobs_weekly >= thresholds.jobs_weekly_min * 2 &&
        metrics.match_success_rate >= thresholds.match_success_target * 1.2
    ) {
        status = 'blue'; // dominant
    } else if (
        metrics.operators_active >= thresholds.operators_active_min &&
        metrics.jobs_weekly >= thresholds.jobs_weekly_min &&
        metrics.match_success_rate >= thresholds.match_success_target
    ) {
        status = 'green'; // healthy
    } else if (
        metrics.operators_active >= thresholds.operators_active_min * 0.5 ||
        metrics.jobs_weekly >= thresholds.jobs_weekly_min * 0.5
    ) {
        status = 'yellow'; // emerging
    }

    // Recommend actions
    if (liquidityRatio < 1.0) {
        actions.push('increase operator acquisition incentives');
        actions.push('slow job poster acquisition');
    } else if (liquidityRatio > 5.0) {
        actions.push('increase job poster acquisition');
        actions.push('boost demand marketing');
    }

    if (metrics.operators_active < thresholds.operators_active_min) {
        actions.push('prioritize operator outreach');
    }
    if (metrics.match_success_rate < thresholds.match_success_target) {
        actions.push('improve matching algorithm or expand coverage');
    }

    if (status === 'red') {
        actions.push('increase referral rewards');
        actions.push('throttle paid growth until liquidity achieved');
    }

    return {
        city,
        operators_active: metrics.operators_active,
        jobs_weekly: metrics.jobs_weekly,
        match_success_rate: metrics.match_success_rate,
        liquidity_ratio: Math.round(liquidityRatio * 100) / 100,
        status,
        actions_recommended: actions,
    };
}

/**
 * Get the 90-day operator acquisition targets for a city.
 */
export function get90DayTarget(city: string): { phase1_contacted: number; phase1_verified: number; phase2_additional: number; phase3_active_goal: number } | null {
    const c = TIER_1_CITIES.find(t => t.city === city);
    if (!c) return null;

    // Scale targets by install target
    const scale = c.year1_install_target / 65000; // relative to Houston baseline
    return {
        phase1_contacted: Math.round(300 * scale),
        phase1_verified: Math.round(60 * scale),
        phase2_additional: Math.round(40 * scale),
        phase3_active_goal: Math.round(100 * scale),
    };
}
