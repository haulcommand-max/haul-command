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
// IMPORTANT: Do NOT inflate these numbers.
// Showing fake stats ("1.5M operators") destroys trust with industry professionals.
// Let the UI handle zero-state gracefully instead.
const FALLBACK: GlobalStats = {
    totalCountries: 2,
    liveCountries: 2,
    coveredCountries: 2,
    nextCountries: 0,
    plannedCountries: 0,
    futureCountries: 0,
    totalOperators: 0,
    totalCorridors: 0,
    avgRatePerDay: 0,
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
        const liveCountries = countryRows.filter(r => r.status === 'active' || r.status === 'live').length;
        const nextCountries = countryRows.filter(r => r.status === 'next' || r.status === 'silver').length;
        const plannedCountries = countryRows.filter(r => r.status === 'planned' || r.status === 'bronze').length;
        const futureCountries = countryRows.filter(r => r.status === 'future').length;

        // Operator count — canonical source: hc_global_operators (7,700+ verified records)
        let opCount: number | null = 0;
        try {
            const { count: c1 } = await sb
                .from('hc_global_operators')
                .select('id', { count: 'exact', head: true });
            if ((c1 ?? 0) > 0) {
                opCount = c1;
            } else {
                // fallback: hc_identities
                const { count: c2 } = await sb
                    .from('hc_identities')
                    .select('id', { count: 'exact', head: true });
                opCount = (c2 ?? 0) > 0 ? c2 : 0;
            }
        } catch { opCount = 0; }

        // Corridor count — canonical source: hc_corridors
        let corrCount = 0;
        try {
            const { count: c1 } = await sb
                .from('hc_corridors')
                .select('id', { count: 'exact', head: true });
            corrCount = c1 ?? 0;
            if (corrCount === 0) {
                const { count: c2 } = await sb
                    .from('corridor_stress_scores')
                    .select('corridor_slug', { count: 'exact', head: true });
                corrCount = c2 ?? 0;
            }
        } catch { /* table may not exist */ }

        // Covered countries: distinct country codes from hc_global_operators
        let coveredCountries = liveCountries;
        try {
            const { data: coveredRows } = await sb
                .from('hc_global_operators')
                .select('country_code')
                .not('country_code', 'is', null);
            if (coveredRows) {
                const uniqueCodes = new Set(coveredRows.map((r: any) => r.country_code));
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

        // Use FALLBACK as floor — if DB tables are empty (not an error, just no data),
        // show realistic market numbers rather than zeros in the hero KPIs.
        // Return real data — zeros are honest; fake numbers are not.
        return {
            totalCountries,
            liveCountries,
            coveredCountries,
            nextCountries,
            plannedCountries,
            futureCountries,
            totalOperators: opCount ?? 0,
            totalCorridors: corrCount,
            avgRatePerDay: avgRatePerDay,
        };
    } catch {
        return FALLBACK;
    }
}
