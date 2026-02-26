"use server";

import { supabaseServer } from "@/lib/supabase/server";

export interface MarketPulse {
    escorts_online_now: number;
    escorts_available_now: number;
    open_loads_now: number;
    median_fill_time_min_7d: number | null;
    fill_rate_7d: number | null;
}

export async function fetchMarketPulse(): Promise<MarketPulse> {
    const supabase = supabaseServer();
    const { data, error } = await supabase
        .from("v_market_pulse")
        .select("*")
        .single();

    if (error || !data) {
        console.error("fetchMarketPulse error:", error);
        return {
            escorts_online_now: 0,
            escorts_available_now: 0,
            open_loads_now: 0,
            median_fill_time_min_7d: null,
            fill_rate_7d: null,
        };
    }

    return {
        escorts_online_now: Number(data.escorts_online_now ?? 0),
        escorts_available_now: Number(data.escorts_available_now ?? 0),
        open_loads_now: Number(data.open_loads_now ?? 0),
        median_fill_time_min_7d: data.median_fill_time_min_7d ? Number(data.median_fill_time_min_7d) : null,
        fill_rate_7d: data.fill_rate_7d ? Number(data.fill_rate_7d) : null,
    };
}

export interface LiquidityCorridorData {
    corridor: string;
    supply: number;
    demand: number;
}

export interface LiquidityTimeSeries {
    hour: string;
    escorts_online: number;
    loads_open: number;
}

export async function fetchLiquidityMetrics() {
    const supabase = supabaseServer();

    // Fetch corridor data from today's liquidity_metrics_daily
    const { data: corridorRaw } = await supabase
        .from("liquidity_metrics_daily")
        .select("*")
        .eq("snapshot_date", new Date().toISOString().split('T')[0])
        .neq("geo_key", "US")
        .order("loads_posted", { ascending: false })
        .limit(6);

    const corridors: LiquidityCorridorData[] = (corridorRaw ?? []).map((r: any) => ({
        corridor: r.geo_key.replace("US_", ""),
        supply: Number(r.escorts_online_avg),
        demand: Number(r.loads_posted),
    }));

    // Fetch last 7 days for time series (use daily snapshots)
    const { data: timeRaw } = await supabase
        .from("liquidity_metrics_daily")
        .select("*")
        .eq("geo_key", "US")
        .order("snapshot_date", { ascending: true })
        .limit(7);

    const timeSeries: LiquidityTimeSeries[] = (timeRaw ?? []).map((r: any) => ({
        hour: new Date(r.snapshot_date).toLocaleDateString("en-US", { weekday: "short" }),
        escorts_online: Number(r.escorts_online_avg),
        loads_open: Number(r.loads_posted),
    }));

    return { corridors, timeSeries };
}

export interface LeaderboardEntry {
    actor_id: string;
    display_name: string;
    country: string;
    region: string;
    score: number;
    jobs_completed: number;
    on_time_01: number;
    safety_01: number;
    professionalism_01: number;
    comms_01: number;
    period_id: string;
    entity_type: string;
    score_delta: number;
}

export async function fetchPublicLeaderboard(params: {
    period_id?: string;
    country?: string;
    limit?: number;
} = {}): Promise<LeaderboardEntry[]> {
    const supabase = supabaseServer();

    let query = supabase
        .from("public_leaderboards")
        .select("*")
        .order("score", { ascending: false })
        .limit(params.limit ?? 25);

    if (params.period_id) query = query.eq("period_id", params.period_id);
    if (params.country) query = query.eq("country", params.country);

    const { data, error } = await query;

    if (error) {
        console.error("fetchPublicLeaderboard error:", error);
        return [];
    }

    return (data ?? []).map((r: any) => ({
        actor_id: r.actor_id,
        display_name: r.display_name,
        country: r.country,
        region: r.region,
        score: Number(r.score),
        jobs_completed: r.jobs_completed,
        on_time_01: Number(r.on_time_01),
        safety_01: Number(r.safety_01),
        professionalism_01: Number(r.professionalism_01),
        comms_01: Number(r.comms_01),
        period_id: r.period_id,
        entity_type: r.entity_type,
        score_delta: Number(r.score_delta),
    }));
}

export async function fetchActiveEscorts() {
    const supabase = supabaseServer();
    const { data, error } = await supabase
        .from("v_active_escort_supply")
        .select("*")
        .limit(20);

    if (error) {
        console.error("fetchActiveEscorts error:", error);
        return [];
    }
    return data ?? [];
}
