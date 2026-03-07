/**
 * ═══════════════════════════════════════════════════════════════
 * RADAR DATA ACCESS LAYER
 * Fetches live data from hc_rm_radar_geo, hc_csn_signals, etc.
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from "@/lib/supabase/client";

// ── Types ──

export interface RadarCountryRow {
    country_code: string;
    country_name: string;
    tier: string;
    launch_wave: number | null;
    is_active_market: boolean;
    surface_count: number;
    entity_count: number;
    operator_count: number;
    load_count_24h: number;
    demand_level: string;
    supply_level: string;
    liquidity_score: number;
    radar_updated_at: string | null;
}

export interface RadarUsStateRow {
    region_code: string;
    state_abbr: string;
    operator_count: number;
    load_count_24h: number;
    demand_level: string;
    supply_level: string;
    liquidity_score: number;
    radar_updated_at: string | null;
}

export interface RadarSignalRow {
    signal_id: string;
    signal_type: string;
    description: string | null;
    latitude: number;
    longitude: number;
    country_code: string;
    confidence: string;
    created_at: string;
    expires_at: string;
    upvotes: number;
    downvotes: number;
}

export interface RadarStats {
    total_countries: number;
    active_markets: number;
    total_surfaces: number;
    total_entities: number;
    total_operators: number;
    active_signals: number;
    last_updated: string | null;
}

// ── Client-side cache (60s TTL) ──

const cache: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 60_000; // 60 seconds

function getCached<T>(key: string): T | null {
    const entry = cache[key];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
    return null;
}

function setCache(key: string, data: unknown) {
    cache[key] = { data, ts: Date.now() };
}

// ── Fetch functions ──

export async function fetchRadarCountries(): Promise<{
    rows: RadarCountryRow[];
    lastUpdatedAt: string | null;
    error: string | null;
}> {
    const cached = getCached<RadarCountryRow[]>("radar_countries");
    if (cached) {
        const lastUpdated = cached.reduce(
            (max, r) =>
                r.radar_updated_at && r.radar_updated_at > (max || "")
                    ? r.radar_updated_at
                    : max,
            null as string | null
        );
        return { rows: cached, lastUpdatedAt: lastUpdated, error: null };
    }

    try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("rpc_radar_country_summary");
        if (error) throw error;
        const rows = (data ?? []) as RadarCountryRow[];
        setCache("radar_countries", rows);
        const lastUpdated = rows.reduce(
            (max, r) =>
                r.radar_updated_at && r.radar_updated_at > (max || "")
                    ? r.radar_updated_at
                    : max,
            null as string | null
        );
        return { rows, lastUpdatedAt: lastUpdated, error: null };
    } catch (e: unknown) {
        console.error("[Radar] fetchRadarCountries error:", e);
        return {
            rows: [],
            lastUpdatedAt: null,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

export async function fetchRadarUsStates(): Promise<{
    rows: RadarUsStateRow[];
    error: string | null;
}> {
    const cached = getCached<RadarUsStateRow[]>("radar_us_states");
    if (cached) return { rows: cached, error: null };

    try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("rpc_radar_us_states");
        if (error) throw error;
        const rows = (data ?? []) as RadarUsStateRow[];
        setCache("radar_us_states", rows);
        return { rows, error: null };
    } catch (e: unknown) {
        console.error("[Radar] fetchRadarUsStates error:", e);
        return {
            rows: [],
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

export async function fetchRadarSignals(
    limit = 5
): Promise<{ rows: RadarSignalRow[]; error: string | null }> {
    const cached = getCached<RadarSignalRow[]>("radar_signals");
    if (cached) return { rows: cached, error: null };

    try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("rpc_radar_live_signals", {
            p_limit: limit,
        });
        if (error) throw error;
        const rows = (data ?? []) as RadarSignalRow[];
        setCache("radar_signals", rows);
        return { rows, error: null };
    } catch (e: unknown) {
        console.error("[Radar] fetchRadarSignals error:", e);
        return { rows: [], error: null }; // graceful — empty state, not crash
    }
}

export async function fetchRadarStats(): Promise<{
    stats: RadarStats | null;
    error: string | null;
}> {
    const cached = getCached<RadarStats>("radar_stats");
    if (cached) return { stats: cached, error: null };

    try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("rpc_radar_stats");
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        if (!row) return { stats: null, error: "No stats returned" };
        setCache("radar_stats", row);
        return { stats: row as RadarStats, error: null };
    } catch (e: unknown) {
        console.error("[Radar] fetchRadarStats error:", e);
        return {
            stats: null,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

// ── Signal type display mapping ──

export const SIGNAL_TYPE_DISPLAY: Record<
    string,
    { label: string; color: string; icon: string }
> = {
    low_bridge: {
        label: "Low Bridge Clearance",
        color: "#f87171",
        icon: "⚠️",
    },
    construction: { label: "Construction Zone", color: "#eab308", icon: "🚧" },
    police_checkpoint: {
        label: "Police Checkpoint",
        color: "#3b82f6",
        icon: "🚔",
    },
    high_wind: { label: "High Wind Advisory", color: "#f97316", icon: "💨" },
    lane_closure: { label: "Lane Closure", color: "#eab308", icon: "🚫" },
    corridor_clear: { label: "Corridor Clear", color: "#22c55e", icon: "✅" },
    permit_checkpoint: {
        label: "Permit Checkpoint",
        color: "#8b5cf6",
        icon: "📋",
    },
    tight_turn: { label: "Tight Turn", color: "#f87171", icon: "↩️" },
    weight_restriction: {
        label: "Weight Restriction",
        color: "#ef4444",
        icon: "⚖️",
    },
    road_damage: { label: "Road Damage", color: "#ef4444", icon: "🕳️" },
    flooding: { label: "Flooding", color: "#3b82f6", icon: "🌊" },
    escort_active: {
        label: "Escort Active",
        color: "#22c55e",
        icon: "🚗",
    },
    staging_area_full: {
        label: "Staging Area Full",
        color: "#eab308",
        icon: "🅿️",
    },
    port_congestion: {
        label: "Port Congestion",
        color: "#f97316",
        icon: "🚢",
    },
    ice_conditions: { label: "Ice Conditions", color: "#60a5fa", icon: "❄️" },
    detour_required: {
        label: "Detour Required",
        color: "#f87171",
        icon: "🔄",
    },
};
