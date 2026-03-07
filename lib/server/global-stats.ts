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
}

// Safe fallback when DB is unavailable
const FALLBACK: GlobalStats = {
    totalCountries: 57,
    liveCountries: 2,
    coveredCountries: 3,
    nextCountries: 1,
    plannedCountries: 51,
    futureCountries: 3,
    totalOperators: 0,
    totalCorridors: 0,
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

        // Operator count (best-effort)
        const { count: opCount } = await sb
            .from('operators')
            .select('id', { count: 'exact', head: true });

        // Corridor count (best-effort)
        let corrCount = 0;
        try {
            const corrResult = await sb
                .from('corridors')
                .select('id', { count: 'exact', head: true });
            corrCount = corrResult.count ?? 0;
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

        return {
            totalCountries,
            liveCountries,
            coveredCountries,
            nextCountries,
            plannedCountries,
            futureCountries,
            totalOperators: opCount ?? 0,
            totalCorridors: corrCount ?? 0,
        };
    } catch {
        return FALLBACK;
    }
}
