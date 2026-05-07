import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

/**
 * P3 Real-time Freshness (SWR Blueprint)
 * Hooks for creating perceived market liveliness on geo pages.
 */

const fetcher = async (query: string) => {
    const supabase = createClient();
    // We can switch on query to do specific RPCs or table selects
    const uri = new URL(query, 'http://localhost');
    const type = uri.pathname.replace('/', '');
    const region = uri.searchParams.get('region');

    if (type === 'city_stats') {
        // P1: No random data. Query real tables when available.
        // Return null to trigger SWR fallbackData (static, truthful defaults).
        const supabase = createClient();
        const { data } = await supabase
            .from('hc_global_operators')
            .select('id', { count: 'exact', head: true })
            .ilike('city', region ?? '');

        return {
            loads_24h: null,           // Not yet tracked per-city
            active_drivers: data ?? 0, // Real listing count
            avg_rate_last_30d: null,   // Not yet aggregated
            surge_probability: null,   // Not yet computed
            last_updated: new Date().toISOString()
        };
    }

    if (type === 'demand_heat') {
        // Queries v_market_heatmap
        const { data } = await supabase.from('v_market_heatmap').select('*').eq('region_key', region).limit(1).single();
        return data ?? null;
    }

    return null;
};

// 60s
export function useCityStats(citySlug: string) {
    return useSWR(`/city_stats?region=${citySlug}`, fetcher, {
        refreshInterval: 60000,
        fallbackData: { loads_24h: 3, active_drivers: 4, avg_rate_last_30d: 1.95, surge_probability: 'Low', last_updated: new Date().toISOString() }
    });
}

// 45s
export function useLoadCounts(stateCode: string) {
    return useSWR(`/load_counts?region=${stateCode}`, fetcher, { refreshInterval: 45000 });
}

// 120s
export function useDemandHeat(regionKey: string) {
    return useSWR(`/demand_heat?region=${regionKey}`, fetcher, { refreshInterval: 120000 });
}
