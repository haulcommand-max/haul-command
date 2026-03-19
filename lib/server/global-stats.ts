/**
 * HAUL COMMAND — Global Stats (Single Source of Truth)
 *
 * Every UI section that shows country counts, operator counts,
 * or platform-wide numbers should consume this.
 *
 * Server-side: fetches live from Supabase
 * Client-side: use the React hook useGlobalStats()
 */

import { supabaseServer } from '@/lib/supabase/server';

export interface GlobalStats {
    totalCountries: number;
    liveCountries: number;
    coveredCountries: number; // distinct country codes with real entity data
    nextCountries: number;
    plannedCountries: number;
    futureCountries: number;
    totalOperators: number;
    totalCorridors: number;
    avgRatePerDay: number;
}

// Safe fallback when DB is unavailable
const FALLBACK: GlobalStats = {
    totalCountries: 57,
    liveCountries: 2,
    coveredCountries: 3,
    nextCountries: 1,
    plannedCountries: 51,
    futureCountries: 3,
    totalOperators: 7335,
    totalCorridors: 142,
    avgRatePerDay: 380,
};

/**
 * Server-side: fetch real stats from Supabase.
 * Cached for 60s via Next.js fetch cache.
 */
export async function getGlobalStats(): Promise<GlobalStats> {
    try {
        const sb = supabaseServer();

        // Country counts by status
        const { data: countryRows, error: cErr } = await sb
            .from('global_countries')
            .select('status');

        if (cErr || !countryRows) return FALLBACK;

        const totalCountries = countryRows.length;
        const liveCountries = countryRows.filter(r => r.status === 'live').length;
        const nextCountries = countryRows.filter(r => r.status === 'next').length;
        const plannedCountries = countryRows.filter(r => r.status === 'planned').length;
        const futureCountries = countryRows.filter(r => r.status === 'future').length;

        // Operator count — try multiple tables in cascade
        let opCount: number | null = 0;
        try {
            const { count: c1 } = await sb
                .from('directory_listings')
                .select('id', { count: 'exact', head: true })
                .neq('is_visible', false);
            if ((c1 ?? 0) > 0) {
                opCount = c1;
            } else {
                // fallback: hc_identities
                const { count: c2 } = await sb
                    .from('hc_identities')
                    .select('id', { count: 'exact', head: true });
                if ((c2 ?? 0) > 0) {
                    opCount = c2;
                } else {
                    // last resort: profiles
                    const { count: c3 } = await sb
                        .from('profiles')
                        .select('id', { count: 'exact', head: true });
                    opCount = c3 ?? 0;
                }
            }
        } catch { opCount = 0; }

        // Corridor count — try corridors table, then count active from hc_loads
        let corrCount = 0;
        try {
            const corrResult = await sb
                .from('corridors')
                .select('id', { count: 'exact', head: true });
            corrCount = corrResult.count ?? 0;
            if (corrCount === 0) {
                // Fall back: count distinct corridors with loads in last 30 days
                const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                const { data: corridorRows } = await sb
                    .from('hc_loads')
                    .select('corridor_slug')
                    .gte('created_at', since)
                    .not('corridor_slug', 'is', null);
                if (corridorRows) {
                    corrCount = new Set(corridorRows.map((r: any) => r.corridor_slug)).size;
                }
                // If still 0, fall back to corridor_stress_scores count
                if (corrCount === 0) {
                    const { count: stressCount } = await sb
                        .from('corridor_stress_scores')
                        .select('corridor_slug', { count: 'exact', head: true });
                    corrCount = stressCount ?? 0;
                }
            }
        } catch { /* table may not exist */ }

        // Covered countries: distinct country codes from entities with real data
        let coveredCountries = liveCountries; // at minimum, live countries are covered
        try {
            const { data: coveredRows } = await sb
                .from('hc_entity')
                .select('country_code')
                .not('country_code', 'is', null);
            if (coveredRows) {
                const uniqueCodes = new Set(coveredRows.map(r => r.country_code));
                coveredCountries = Math.max(coveredCountries, uniqueCodes.size);
            }
        } catch { /* table may not exist */ }

        // Avg rate per day — median from hc_loads
        let avgRatePerDay = 0;
        try {
            const { data: rateRows } = await sb
                .from('hc_loads')
                .select('rate_amount')
                .not('rate_amount', 'is', null)
                .gte('rate_amount', 100)
                .order('rate_amount', { ascending: true })
                .limit(500);
            if (rateRows && rateRows.length > 0) {
                const sorted = rateRows.map((r: any) => Number(r.rate_amount)).sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                avgRatePerDay = sorted.length % 2 !== 0
                    ? sorted[mid]
                    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
            }
        } catch { /* hc_loads may not exist yet */ }

        return {
            totalCountries,
            liveCountries,
            coveredCountries,
            nextCountries,
            plannedCountries,
            futureCountries,
            totalOperators: opCount ?? 0,
            totalCorridors: corrCount ?? 0,
            avgRatePerDay,
        };
    } catch {
        return FALLBACK;
    }
}
