/**
 * GET /api/public/rate-index
 *
 * Haul Command — Public Escort Rate Index API
 * Unauthenticated endpoint serving aggregated corridor rate data.
 *
 * Query params:
 *   ?country=US           — filter by country (default: all)
 *   ?corridor=TX→OK       — filter by specific corridor
 *   ?sort=rate|demand|name — sort order (default: demand)
 *   ?limit=50             — max results (default: 50, max: 200)
 *
 * Returns the public rate index data from rate_index_cache + fallback to
 * the global-rate-index.ts engine for countries without live data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { RateIndexEngine, COUNTRY_RATE_TABLE } from '@/lib/pricing/global-rate-index';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour at CDN level

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const country = searchParams.get('country')?.toUpperCase();
        const corridor = searchParams.get('corridor');
        const sort = searchParams.get('sort') || 'demand';
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

        const supabase = supabaseServer();

        // ── 1. Query live data from rate_index_cache ──
        let query = supabase
            .from('rate_index_cache')
            .select('*')
            .gt('sample_count', 0);

        if (country) query = query.eq('country_code', country);
        if (corridor) query = query.eq('corridor_key', corridor);

        // Sort
        switch (sort) {
            case 'rate':
                query = query.order('avg_rate_per_mile', { ascending: false, nullsFirst: false });
                break;
            case 'name':
                query = query.order('corridor_key', { ascending: true });
                break;
            case 'demand':
            default:
                query = query.order('observation_count_30d', { ascending: false });
                break;
        }

        query = query.limit(limit);

        const { data: liveCorridors, error } = await query;

        if (error) {
            console.error('[Rate Index API] Supabase error:', error);
        }

        // ── 2. Build response with live data ──
        const corridorRows = (liveCorridors || []).map((c: any) => ({
            corridor: c.corridor_key,
            origin: c.origin_admin_division,
            destination: c.destination_admin_division,
            country: c.country_code,
            currency: c.currency || 'USD',
            avg_rate_per_mile: c.avg_rate_per_mile,
            median_rate_per_mile: c.median_rate_per_mile,
            rate_range: {
                p10: c.p10_rate,
                p25: c.p25_rate,
                p75: c.p75_rate,
                p90: c.p90_rate,
            },
            by_service: {
                lead: c.avg_rate_lead,
                chase: c.avg_rate_chase,
                steer: c.avg_rate_steer,
                survey: c.avg_rate_survey,
            },
            trend: {
                direction: c.trend_direction,
                change_7d_pct: c.rate_change_7d_pct,
                change_30d_pct: c.rate_change_30d_pct,
            },
            demand: {
                band: c.demand_band,
                observations_7d: c.observation_count_7d,
                observations_30d: c.observation_count_30d,
            },
            sample_count: c.sample_count,
            last_updated: c.last_computed_at,
            // Detail fields are PRO-gated (not included in public response)
            detail_available: true,
        }));

        // ── 3. Fill with global baselines for countries with no live data ──
        const countriesWithData = new Set(corridorRows.map((r: any) => r.country));
        const globalBaselines: any[] = [];

        if (!country || !countriesWithData.has(country)) {
            const targetCountries = country ? [country] : Object.keys(COUNTRY_RATE_TABLE);

            for (const cc of targetCountries) {
                if (countriesWithData.has(cc)) continue;
                const rates = COUNTRY_RATE_TABLE[cc];
                if (!rates) continue;

                globalBaselines.push({
                    corridor: `${cc}:national`,
                    origin: cc,
                    destination: cc,
                    country: cc,
                    currency: rates.currency,
                    avg_rate_per_mile: rates.perMileRate,
                    median_rate_per_mile: rates.perMileRate,
                    rate_range: {
                        p10: Math.round(rates.perMileRate * 0.75 * 100) / 100,
                        p25: Math.round(rates.perMileRate * 0.88 * 100) / 100,
                        p75: Math.round(rates.perMileRate * 1.12 * 100) / 100,
                        p90: Math.round(rates.perMileRate * 1.30 * 100) / 100,
                    },
                    by_service: {
                        lead: Math.round(rates.perMileRate * 1.05 * 100) / 100,
                        chase: Math.round(rates.perMileRate * 0.95 * 100) / 100,
                        steer: Math.round(rates.perMileRate * 1.10 * 100) / 100,
                        survey: null,
                    },
                    trend: {
                        direction: RateIndexEngine.computeIndex(rates.baseDayRate, cc)?.trend || 'stable',
                        change_7d_pct: RateIndexEngine.computeIndex(rates.baseDayRate, cc)?.trendDelta7d || 0,
                        change_30d_pct: RateIndexEngine.computeIndex(rates.baseDayRate, cc)?.trendDelta30d || 0,
                    },
                    demand: { band: 'baseline', observations_7d: 0, observations_30d: 0 },
                    sample_count: 0,
                    last_updated: new Date().toISOString(),
                    detail_available: false,
                    is_baseline: true,
                    day_rate: { amount: rates.baseDayRate, currency: rates.currency },
                });
            }
        }

        const allCorridors = [...corridorRows, ...globalBaselines].slice(0, limit);

        return NextResponse.json({
            status: 'ok',
            total: allCorridors.length,
            live_corridors: corridorRows.length,
            baseline_countries: globalBaselines.length,
            last_refresh: new Date().toISOString(),
            corridors: allCorridors,
            _meta: {
                description: 'Haul Command Escort Rate Index — live corridor rate intelligence for oversize/heavy haul escort services.',
                free_fields: ['corridor', 'origin', 'destination', 'country', 'avg_rate_per_mile', 'trend.direction', 'demand.band'],
                pro_fields: ['rate_range', 'by_service', 'trend.change_7d_pct', 'trend.change_30d_pct'],
                docs: 'https://haulcommand.com/developer/rate-index',
            },
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
                'X-HC-Feature': 'escort-rate-index',
            },
        });
    } catch (error: any) {
        console.error('[Rate Index API] Error:', error);
        return NextResponse.json(
            { status: 'error', message: 'Failed to load rate index' },
            { status: 500 },
        );
    }
}
