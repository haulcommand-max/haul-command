/**
 * FLORIDA RECTANGLE HYPER-LOCAL AMPLIFIER — Social Gravity v2.1
 *
 * Makes the Florida market feel alive before it actually is.
 * Concentrates engagement mechanics within the Florida Rectangle:
 *   Cross City → Gainesville → Ocala → Lake City → Jacksonville → Tampa
 *
 * Modules:
 *   1. Local liquidity amplifier (density perception)
 *   2. Florida corridor heat engine (I-75, US-19, I-10, port routes, mobile home routes)
 *   3. Nearby competition panel (local social pressure)
 *   4. Micro-pocket scarcity (county-level shortage signals)
 *   5. Florida-specific profile boosts
 *   6. 72-hour corridor forecast (predictive, not reactive)
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ── Florida Geography ────────────────────────────────────────────────────────

export const FLORIDA_RECTANGLE = {
    base_city: 'Cross City',
    state: 'FL',
    expansion_nodes: [
        { city: 'Cross City', lat: 29.6346, lon: -83.1252, priority: 1 },
        { city: 'Gainesville', lat: 29.6516, lon: -82.3248, priority: 2 },
        { city: 'Ocala', lat: 29.1872, lon: -82.1401, priority: 2 },
        { city: 'Lake City', lat: 30.1898, lon: -82.6393, priority: 3 },
        { city: 'Jacksonville', lat: 30.3322, lon: -81.6557, priority: 3 },
        { city: 'Tampa', lat: 27.9506, lon: -82.4572, priority: 4 },
    ],
    priority_corridors: [
        { key: 'FL-I75', name: 'I-75 Florida', type: 'interstate' },
        { key: 'FL-US19', name: 'US-19 Corridor', type: 'state' },
        { key: 'FL-I10', name: 'I-10 East-West', type: 'interstate' },
        { key: 'FL-PORT', name: 'Port to Inland Routes', type: 'port' },
        { key: 'FL-MH', name: 'Mobile Home Routes', type: 'mobile_home' },
    ],
};

// ── Types ────────────────────────────────────────────────────────────────────

export type DensityLevel = 'cold' | 'low_density' | 'warming' | 'active' | 'hot';

export interface LocalLiquiditySnapshot {
    region: string;
    density_level: DensityLevel;
    operators_available_now: number;
    loads_last_24h: number;
    loads_last_72h: number;
    unique_brokers_active: number;
    repeat_bookings_7d: number;
    copy: string;          // psychological copy for UI
    demand_meter: number;  // 0-100 for progress bar
}

export interface CorridorHeat {
    corridor_key: string;
    corridor_name: string;
    heat_score: number;       // 0-100
    loads_24h: number;
    unique_brokers: number;
    operator_shortage_index: number;  // > 1 = shortage
    booking_velocity: number;
    is_surge: boolean;
    forecast_72h: 'rising' | 'steady' | 'cooling';
}

export interface MicroPocketScarcity {
    county: string;
    state: string;
    operators_available: number;
    nearest_operator_miles: number;
    demand_signals: number;
    scarcity_copy: string;   // "only 2 operators near Cross City"
}

export interface NearbyCompetition {
    operator_id: string;
    radius_miles: number;
    operators_online_now: number;
    operators_booked_24h: number;
    rising_competitors: number;
    new_entries_7d: number;
    your_rank_local: number;
    copy: string;
}

export interface CorridorForecast72h {
    corridor_key: string;
    corridor_name: string;
    prediction: 'heating' | 'steady' | 'cooling';
    confidence: number;        // 0-1
    predicted_loads: number;
    predicted_shortage: boolean;
    reasoning: string[];
    copy: string;              // "corridor likely heating tomorrow"
}

// ── Copy constants ───────────────────────────────────────────────────────────

const DENSITY_COPY: Record<DensityLevel, string> = {
    cold: 'building coverage in this area',
    low_density: 'early activity in your area',
    warming: 'activity building in your area',
    active: 'strong movement in this corridor',
    hot: 'high demand zone — operators getting booked',
};

// ── Engine ────────────────────────────────────────────────────────────────────

export class FloridaLocalAmplifier {
    constructor(private db: SupabaseClient) { }

    // ── 1. LOCAL LIQUIDITY SNAPSHOT ───────────────────────────────────────

    async getLocalLiquidity(
        state: string = 'FL',
    ): Promise<LocalLiquiditySnapshot> {
        const now = new Date();
        const day = new Date(now.getTime() - 86400000).toISOString();
        const threeDays = new Date(now.getTime() - 3 * 86400000).toISOString();
        const week = new Date(now.getTime() - 7 * 86400000).toISOString();

        // Available operators now
        const { count: availableNow } = await this.db
            .from('operators')
            .select('id', { count: 'exact', head: true })
            .eq('home_base_state', state)
            .eq('availability_status', 'available');

        // Loads
        const { count: loads24h } = await this.db
            .from('loads')
            .select('id', { count: 'exact', head: true })
            .eq('state', state)
            .gte('created_at', day);

        const { count: loads72h } = await this.db
            .from('loads')
            .select('id', { count: 'exact', head: true })
            .eq('state', state)
            .gte('created_at', threeDays);

        // Unique brokers
        const { data: brokerData } = await this.db
            .from('loads')
            .select('broker_id')
            .eq('state', state)
            .gte('created_at', day);
        const uniqueBrokers = new Set((brokerData ?? []).map((l: any) => l.broker_id)).size;

        // Repeat bookings
        const { count: repeatBookings } = await this.db
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', week);

        const ops = availableNow ?? 0;
        const l24 = loads24h ?? 0;

        // Density level
        let density: DensityLevel = 'cold';
        if (ops >= 41) density = 'hot';
        else if (ops >= 16) density = 'active';
        else if (ops >= 6) density = 'warming';
        else if (ops >= 1) density = 'low_density';

        // Demand meter (0-100)
        const demandMeter = Math.min(100, Math.round(
            (l24 / Math.max(1, ops)) * 30 + uniqueBrokers * 5 + (ops >= 6 ? 20 : 0),
        ));

        return {
            region: state,
            density_level: density,
            operators_available_now: ops,
            loads_last_24h: l24,
            loads_last_72h: loads72h ?? 0,
            unique_brokers_active: uniqueBrokers,
            repeat_bookings_7d: repeatBookings ?? 0,
            copy: DENSITY_COPY[density],
            demand_meter: demandMeter,
        };
    }

    // ── 2. CORRIDOR HEAT + 72H FORECAST ───────────────────────────────────

    async getCorridorHeat(corridorKey: string): Promise<CorridorHeat | null> {
        const { data } = await this.db
            .from('corridor_demand_signals')
            .select('*')
            .eq('corridor_key', corridorKey)
            .single();

        if (!data) return null;

        const loads24h = data.loads_posted_24h ?? 0;
        const uniqueBrokers = data.unique_brokers_24h ?? 0;
        const activeOps = data.active_operators_24h ?? 1;
        const shortageIndex = loads24h > 0 ? loads24h / Math.max(1, activeOps) : 0;
        const bookingVelocity = data.booking_velocity ?? 0;

        // Heat formula from spec
        const heat = Math.min(100, Math.round(
            (loads24h * 0.40) +
            (uniqueBrokers * 0.20 * 5) +
            (shortageIndex * 0.25 * 20) +
            (bookingVelocity * 0.15 * 10),
        ));

        const isSurge = (data.demand_velocity ?? 0) > 1.4;

        // Simple forecast based on day-of-week pattern + recent velocity
        const forecast = await this.forecast72h(corridorKey, data);

        return {
            corridor_key: corridorKey,
            corridor_name: data.corridor_name ?? corridorKey,
            heat_score: heat,
            loads_24h: loads24h,
            unique_brokers: uniqueBrokers,
            operator_shortage_index: shortageIndex,
            booking_velocity: bookingVelocity,
            is_surge: isSurge,
            forecast_72h: forecast,
        };
    }

    async getFloridaCorridorHeatAll(): Promise<CorridorHeat[]> {
        const results: CorridorHeat[] = [];
        for (const c of FLORIDA_RECTANGLE.priority_corridors) {
            const heat = await this.getCorridorHeat(c.key);
            if (heat) results.push(heat);
        }
        return results.sort((a, b) => b.heat_score - a.heat_score);
    }

    // ── 3. 72-HOUR CORRIDOR FORECAST ──────────────────────────────────────

    async generate72hForecast(corridorKey: string): Promise<CorridorForecast72h> {
        const { data: signals } = await this.db
            .from('corridor_demand_signals')
            .select('*')
            .eq('corridor_key', corridorKey)
            .single();

        const velocity = signals?.demand_velocity ?? 1.0;
        const dayOfWeek = new Date().getDay();

        // Day-of-week weights: Mon-Thu busier than Fri-Sun for oversized
        const dowWeight: Record<number, number> = {
            0: 0.7, 1: 1.1, 2: 1.15, 3: 1.2, 4: 1.1, 5: 0.85, 6: 0.6,
        };
        const currentDow = dowWeight[dayOfWeek] ?? 1.0;
        const nextDow = dowWeight[(dayOfWeek + 1) % 7] ?? 1.0;

        // Mobile home corridor seasonal boost (FL specific)
        const month = new Date().getMonth();
        const isMobileHomeSeason = (month >= 9 || month <= 3); // Oct-Mar
        const seasonalMultiplier = corridorKey === 'FL-MH' && isMobileHomeSeason ? 1.25 : 1.0;

        // Composite prediction
        const predictedVelocity = velocity * (nextDow / currentDow) * seasonalMultiplier;

        let prediction: CorridorForecast72h['prediction'] = 'steady';
        if (predictedVelocity > 1.3) prediction = 'heating';
        else if (predictedVelocity < 0.7) prediction = 'cooling';

        const confidence = Math.min(0.85, 0.5 + (signals?.loads_posted_7d ?? 0) * 0.01);

        const predictedLoads = Math.round(
            (signals?.avg_loads_per_day_7d ?? 3) * predictedVelocity * 3, // 3 days
        );

        const predictedShortage = predictedVelocity > 1.3 &&
            (signals?.active_operators_24h ?? 5) < predictedLoads * 0.8;

        const reasoning: string[] = [];
        if (nextDow > currentDow) reasoning.push('tomorrow is historically busier');
        if (isMobileHomeSeason && corridorKey === 'FL-MH') reasoning.push('mobile home season active');
        if (velocity > 1.2) reasoning.push('current demand trending up');
        if (predictedShortage) reasoning.push('operator shortage predicted');

        const copy = prediction === 'heating'
            ? `corridor likely heating ${reasoning.includes('tomorrow is historically busier') ? 'tomorrow' : 'soon'}`
            : prediction === 'cooling'
                ? 'demand expected to ease'
                : 'corridor holding steady';

        return {
            corridor_key: corridorKey,
            corridor_name: signals?.corridor_name ?? corridorKey,
            prediction,
            confidence,
            predicted_loads: predictedLoads,
            predicted_shortage: predictedShortage,
            reasoning,
            copy,
        };
    }

    // ── 4. MICRO-POCKET SCARCITY ──────────────────────────────────────────

    async getMicroPocketScarcity(state: string = 'FL'): Promise<MicroPocketScarcity[]> {
        // Get county-level operator counts
        const { data: counties } = await this.db
            .from('county_territories')
            .select('county_name, state_code, total_slots, claimed_slots')
            .eq('state_code', state)
            .order('claimed_slots', { ascending: true })
            .limit(20);

        if (!counties) return [];

        return counties.map((c: any) => {
            const available = c.claimed_slots ?? 0;
            let scarcityCopy = '';

            if (available === 0) {
                scarcityCopy = `no operators covering ${c.county_name} county`;
            } else if (available <= 2) {
                scarcityCopy = `only ${available} operator${available > 1 ? 's' : ''} near ${c.county_name}`;
            } else if (available <= 5) {
                scarcityCopy = `coverage thin around ${c.county_name}`;
            } else {
                scarcityCopy = `${available} operators in ${c.county_name}`;
            }

            return {
                county: c.county_name,
                state: c.state_code,
                operators_available: available,
                nearest_operator_miles: 0,  // would need geocoding
                demand_signals: 0,
                scarcity_copy: scarcityCopy,
            };
        });
    }

    // ── 5. NEARBY COMPETITION ─────────────────────────────────────────────

    async getNearbyCompetition(
        operatorId: string,
        state: string = 'FL',
    ): Promise<NearbyCompetition> {
        // Operators online in same state
        const { count: onlineNow } = await this.db
            .from('operators')
            .select('id', { count: 'exact', head: true })
            .eq('home_base_state', state)
            .eq('availability_status', 'available')
            .neq('id', operatorId);

        // Operators booked in last 24h
        const dayAgo = new Date(Date.now() - 86400000).toISOString();
        const { count: booked24h } = await this.db
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', dayAgo);

        // New operators in last 7 days
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { count: newEntries } = await this.db
            .from('operators')
            .select('id', { count: 'exact', head: true })
            .eq('home_base_state', state)
            .gte('created_at', weekAgo);

        // This operator's local rank
        const { data: momentum } = await this.db
            .from('operator_momentum')
            .select('total_score')
            .eq('user_id', operatorId)
            .single();

        const { count: higherRanked } = await this.db
            .from('operator_momentum')
            .select('user_id', { count: 'exact', head: true })
            .gt('total_score', momentum?.total_score ?? 0);

        const rank = (higherRanked ?? 0) + 1;
        const online = onlineNow ?? 0;

        return {
            operator_id: operatorId,
            radius_miles: 75,  // rural default
            operators_online_now: online,
            operators_booked_24h: booked24h ?? 0,
            rising_competitors: Math.max(0, (newEntries ?? 0) - 1),
            new_entries_7d: newEntries ?? 0,
            your_rank_local: rank,
            copy: online > 10
                ? `${online} operators online near you — stay active to keep your rank`
                : online > 3
                    ? `${online} operators online nearby`
                    : 'low competition right now — great time to be available',
        };
    }

    // ── 6. FLORIDA PROFILE BOOSTS ─────────────────────────────────────────

    computeFloridaBoostMultiplier(operator: {
        certifications?: string[];
        vehicle_type?: string;
        availability_status?: string;
        median_response_minutes?: number;
    }): { multiplier: number; boosters: string[] } {
        let multiplier = 1.0;
        const boosters: string[] = [];

        // Florida certifications
        const certs = operator.certifications ?? [];
        if (certs.some(c => c.toLowerCase().includes('florida'))) {
            multiplier += 0.08;
            boosters.push('florida_certifications_present');
        }

        // Mobile home experience
        if (certs.some(c => c.toLowerCase().includes('mobile home'))) {
            multiplier += 0.07;
            boosters.push('mobile_home_experience');
        }

        // TWIC card
        if (certs.some(c => c.toLowerCase().includes('twic'))) {
            multiplier += 0.05;
            boosters.push('twic_status');
        }

        // Weekend availability
        if (operator.availability_status === 'available') {
            const day = new Date().getDay();
            if (day === 0 || day === 6) {
                multiplier += 0.06;
                boosters.push('weekend_availability');
            }
        }

        // Rapid response
        if ((operator.median_response_minutes ?? 60) < 15) {
            multiplier += 0.09;
            boosters.push('rapid_response_history');
        }

        // Cap at 1.35
        multiplier = Math.min(1.35, multiplier);

        return { multiplier, boosters };
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    private async forecast72h(
        corridorKey: string,
        signals: any,
    ): Promise<'rising' | 'steady' | 'cooling'> {
        const velocity = signals?.demand_velocity ?? 1.0;
        if (velocity > 1.3) return 'rising';
        if (velocity < 0.7) return 'cooling';
        return 'steady';
    }
}
