/**
 * HAUL COMMAND - Global Stats (Single Source of Truth)
 *
 * Every UI section that shows country counts, operator counts,
 * or platform-wide numbers should consume this server helper.
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
    totalSupportLocations: number;
    avgRatePerDay: number;
    statsUpdatedAt: string | null;
}

// Safe fallback when DB is unavailable.
// -1 is a sentinel meaning data is unavailable, not genuinely zero.
const FALLBACK: GlobalStats = {
    totalCountries: 2,
    liveCountries: 2,
    coveredCountries: 2,
    nextCountries: 0,
    plannedCountries: 0,
    futureCountries: 0,
    totalOperators: -1,
    totalCorridors: -1,
    totalSupportLocations: -1,
    avgRatePerDay: 380,
    statsUpdatedAt: null,
};

/**
 * Server-side: fetch real stats from Supabase.
 */
export async function getGlobalStats(): Promise<GlobalStats> {
    try {
        const sb = supabaseServer();

        const { data: countryRows, error: cErr } = await sb
            .from('global_countries')
            .select('status');

        if (cErr || !countryRows) return FALLBACK;

        const totalCountries = countryRows.length;
        const liveCountries = countryRows.filter(r => r.status === 'live' || r.status === 'active').length;
        const nextCountries = countryRows.filter(r => r.status === 'next').length;
        const plannedCountries = countryRows.filter(r => r.status === 'planned').length;
        const futureCountries = countryRows.filter(r => r.status === 'future').length;

        let opCount: number | null = 0;
        try {
            const { count: c1 } = await sb
                .from('v_directory_publishable')
                .select('contact_id', { count: 'exact', head: true })
                .or('entity_family.eq.operator,role_primary.in.(pilot_car,escort,pilot_car_operator,escort_operator)');
            if ((c1 ?? 0) > 0) {
                opCount = c1;
            } else {
                const { count: c2 } = await sb
                    .from('provider_directory')
                    .select('id', { count: 'exact', head: true });
                if ((c2 ?? 0) > 0) {
                    opCount = c2;
                } else {
                    const { count: c3 } = await sb
                        .from('hc_identities')
                        .select('id', { count: 'exact', head: true });
                    if ((c3 ?? 0) > 0) {
                        opCount = c3;
                    } else {
                        const { count: c4 } = await sb
                            .from('profiles')
                            .select('id', { count: 'exact', head: true });
                        opCount = c4 ?? 0;
                    }
                }
            }
        } catch { opCount = 0; }

        let corrCount = 0;
        try {
            const corrResult = await sb
                .from('corridors')
                .select('id', { count: 'exact', head: true });
            corrCount = corrResult.count ?? 0;
            if (corrCount === 0) {
                const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                const { data: corridorRows } = await sb
                    .from('hc_loads')
                    .select('corridor_slug')
                    .gte('created_at', since)
                    .not('corridor_slug', 'is', null);
                if (corridorRows) {
                    corrCount = new Set(corridorRows.map((r: any) => r.corridor_slug)).size;
                }
                if (corrCount === 0) {
                    const { count: signalCount } = await sb
                        .from('corridor_demand_signals')
                        .select('id', { count: 'exact', head: true });
                    corrCount = signalCount ?? 0;
                }
                if (corrCount === 0) {
                    const { count: stressCount } = await sb
                        .from('corridor_stress_scores')
                        .select('corridor_slug', { count: 'exact', head: true });
                    corrCount = stressCount ?? 0;
                }
            }
        } catch { /* table may not exist */ }

        let coveredCountries = liveCountries;
        try {
            const { data: coveredRows } = await sb
                .from('v_directory_publishable')
                .select('country_code')
                .not('country_code', 'is', null);
            if (coveredRows) {
                const uniqueCodes = new Set(coveredRows.map(r => r.country_code));
                coveredCountries = Math.max(coveredCountries, uniqueCodes.size);
            }
        } catch { /* view may not exist */ }

        let supportLocationCount = 0;
        try {
            const { count: geocodedTotal } = await sb
                .from('v_directory_publishable')
                .select('contact_id', { count: 'exact', head: true })
                .not('lat', 'is', null)
                .not('lon', 'is', null);
            const { count: geocodedOperators } = await sb
                .from('v_directory_publishable')
                .select('contact_id', { count: 'exact', head: true })
                .not('lat', 'is', null)
                .not('lon', 'is', null)
                .or('entity_family.eq.operator,role_primary.in.(pilot_car,escort,pilot_car_operator,escort_operator)');
            supportLocationCount = Math.max(0, (geocodedTotal ?? 0) - (geocodedOperators ?? 0));
        } catch { /* view may not exist */ }

        let statsUpdatedAt: string | null = null;
        try {
            const { data: latestRows } = await sb
                .from('v_directory_publishable')
                .select('updated_at')
                .not('updated_at', 'is', null)
                .order('updated_at', { ascending: false })
                .limit(1);
            statsUpdatedAt = latestRows?.[0]?.updated_at ?? null;
        } catch { /* view may not exist */ }

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
            totalCorridors: corrCount,
            totalSupportLocations: supportLocationCount,
            avgRatePerDay,
            statsUpdatedAt,
        };
    } catch {
        return FALLBACK;
    }
}
