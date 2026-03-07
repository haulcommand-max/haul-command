"use client";
import useSWR from "swr";

interface MarketPulseData {
    escorts_online: number;
    available_now: number;
    open_loads: number;
    median_fill_time_minutes: number;
    updated_at: string;
    ok: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * useMarketPulse — Client-side hook for live market KPIs.
 *
 * Reads from /api/public/kpis (which queries v_market_pulse).
 * Refreshes every 10s with 3s dedup. Returns null while loading.
 * NEVER falls back to random/fabricated data.
 */
export function useMarketPulse() {
    const { data, error, isLoading } = useSWR<MarketPulseData>(
        "/api/public/kpis",
        fetcher,
        {
            refreshInterval: 10_000,
            dedupingInterval: 3_000,
        }
    );

    return {
        pulse: data?.ok ? data : null,
        error,
        isLoading,
        updatedAt: data?.updated_at ?? null,
    };
}
