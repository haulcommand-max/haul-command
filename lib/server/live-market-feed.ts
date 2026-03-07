/**
 * HAUL COMMAND — Live Market Feed
 * 
 * Server-side functions that power the Market Pulse ticker,
 * corridor demand signals, and state activity overlays.
 * 
 * Data source: hc_broker_loads + hc_broker_entities (REAL load board data)
 * Updated: every 60s via ISR
 */

import "server-only";
import { supabaseServer } from '@/lib/supabase/server';

// ── Types ──────────────────────────────────────────────

export interface MarketFeedItem {
    id: string;
    broker_name: string;
    origin: string;
    destination: string;
    distance_miles: number | null;
    tag: string | null;
    rate_hint: string | null;
    quick_pay: boolean;
    risk_flags: string[];
    freshness: 'today' | 'yesterday' | 'older';
}

export interface CorridorDemandSignal {
    origin_state: string;
    dest_state: string;
    load_count_72h: number;
    unique_brokers: number;
    position_types: string[];
    demand_level: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface StateLoadActivity {
    state: string;
    total_loads_72h: number;
    total_brokers: number;
}

export interface LiveMarketPulse {
    open_loads_24h: number;
    loads_72h: number;
    active_brokers_72h: number;
    critical_risk_signals: number;
    active_corridors_72h: number;
    total_broker_entities: number;
    total_broker_loads: number;
}

// ── Fetchers ──────────────────────────────────────────

/**
 * Live market pulse — powered by real broker loads
 */
export async function getLiveMarketPulse(): Promise<LiveMarketPulse> {
    try {
        const sb = supabaseServer();
        const { data, error } = await sb
            .from('v_market_pulse_live')
            .select('*')
            .single();

        if (error || !data) {
            console.error('getLiveMarketPulse error:', error);
            return {
                open_loads_24h: 0,
                loads_72h: 0,
                active_brokers_72h: 0,
                critical_risk_signals: 0,
                active_corridors_72h: 0,
                total_broker_entities: 0,
                total_broker_loads: 0,
            };
        }

        return {
            open_loads_24h: Number(data.open_loads_24h ?? 0),
            loads_72h: Number(data.loads_72h ?? 0),
            active_brokers_72h: Number(data.active_brokers_72h ?? 0),
            critical_risk_signals: Number(data.critical_risk_signals ?? 0),
            active_corridors_72h: Number(data.active_corridors_72h ?? 0),
            total_broker_entities: Number(data.total_broker_entities ?? 0),
            total_broker_loads: Number(data.total_broker_loads ?? 0),
        };
    } catch {
        return {
            open_loads_24h: 0, loads_72h: 0, active_brokers_72h: 0,
            critical_risk_signals: 0, active_corridors_72h: 0,
            total_broker_entities: 0, total_broker_loads: 0,
        };
    }
}

/**
 * Recent load feed — for the Market Pulse scrolling ticker
 * Returns the 20 most recent loads with broker names and risk flags
 */
export async function getLiveMarketFeed(limit = 20): Promise<MarketFeedItem[]> {
    try {
        const sb = supabaseServer();
        const { data, error } = await sb
            .from('v_live_market_feed')
            .select('*')
            .limit(limit);

        if (error || !data) {
            console.error('getLiveMarketFeed error:', error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            broker_name: d.broker_name || 'Unknown',
            origin: d.origin || '',
            destination: d.destination || '',
            distance_miles: d.distance_miles ? Number(d.distance_miles) : null,
            tag: d.tag || null,
            rate_hint: d.rate_hint || null,
            quick_pay: Boolean(d.quick_pay),
            risk_flags: d.risk_flags || [],
            freshness: d.freshness || 'older',
        }));
    } catch {
        return [];
    }
}

/**
 * Corridor demand signals — which state-to-state corridors are hot
 */
export async function getCorridorDemandSignals(): Promise<CorridorDemandSignal[]> {
    try {
        const sb = supabaseServer();
        const { data, error } = await sb
            .from('v_corridor_demand_signals')
            .select('*')
            .limit(20);

        if (error || !data) return [];

        return data.map((d: any) => ({
            origin_state: d.origin_state,
            dest_state: d.dest_state,
            load_count_72h: Number(d.load_count_72h),
            unique_brokers: Number(d.unique_brokers),
            position_types: d.position_types || [],
            demand_level: d.demand_level || 'LOW',
        }));
    } catch {
        return [];
    }
}

/**
 * State load activity — for wiring into radar state dots
 */
export async function getStateLoadActivity(): Promise<StateLoadActivity[]> {
    try {
        const sb = supabaseServer();
        const { data, error } = await sb
            .from('v_state_load_activity')
            .select('*');

        if (error || !data) return [];

        return data.map((d: any) => ({
            state: d.state,
            total_loads_72h: Number(d.total_loads_72h),
            total_brokers: Number(d.total_brokers),
        }));
    } catch {
        return [];
    }
}
