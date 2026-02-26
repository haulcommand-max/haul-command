import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeFriction, bootstrapAllCountries } from '@/lib/intel/friction';
import { getObservationSummary } from '@/lib/intel/capture';
import { evaluateGate, scrubResponse } from '@/lib/quality/gating';

/**
 * GET /api/intel/friction
 *
 * Permit friction heatmap data.
 * Params: ?country=US&band=high&limit=20&bootstrap=true
 *
 * EVERY response includes: score, band, confidence, basis, observations_count, sources_used
 * Gated by publish level — thin markets get band-only, not exact numbers.
 */

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const country = url.searchParams.get('country');
    const band = url.searchParams.get('band');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const bootstrap = url.searchParams.get('bootstrap') === 'true';

    // Bootstrap mode: return all country priors without DB
    if (bootstrap) {
        const all = bootstrapAllCountries();
        const sorted = Object.entries(all)
            .sort(([, a], [, b]) => b.frictionScore - a.frictionScore)
            .map(([code, result]) => {
                const gate = evaluateGate({
                    countryCode: code,
                    feature: 'permit_friction_heatmap',
                    confidence: result.confidence,
                    observationsCount: 0,
                });

                return scrubResponse({
                    country_code: code,
                    score: result.frictionScore,
                    band: result.frictionBand,
                    confidence: result.confidence,
                    basis: 'priors' as const,
                    observations_count: 0,
                    sources_used: ['country_prior'],
                    color: result.color,
                    components: result.components,
                }, gate);
            });

        return NextResponse.json({
            mode: 'bootstrap',
            total: sorted.length,
            countries: sorted,
            generated_at: new Date().toISOString(),
        });
    }

    // DB mode: fetch stored friction scores + observation context
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    let query = supabase
        .from('permit_friction_scores')
        .select('*')
        .order('friction_score', { ascending: false })
        .limit(limit);

    if (country) query = query.eq('country_code', country.toUpperCase());
    if (band) query = query.eq('friction_band', band);

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get observation context
    const countryCode = country?.toUpperCase() || 'US';
    const obs = await getObservationSummary(countryCode);

    // Evaluate gate
    const gate = evaluateGate({
        countryCode,
        feature: 'permit_friction_heatmap',
        confidence: obs.frictionObservations30d > 0 ? 0.5 : 0.3,
        observationsCount: obs.frictionObservations30d,
        sourcesUsed: buildSourcesList(obs),
    });

    // If no stored data, fall back to computed priors
    if (!data?.length) {
        const computed = computeFriction({ countryCode });
        const priorGate = evaluateGate({
            countryCode,
            feature: 'permit_friction_heatmap',
            confidence: computed.confidence,
            observationsCount: 0,
        });

        const result = scrubResponse({
            country_code: countryCode,
            corridor_slug: null,
            region_code: null,
            score: computed.frictionScore,
            band: computed.frictionBand,
            confidence: computed.confidence,
            basis: obs.frictionBasis,
            observations_count: obs.frictionObservations30d,
            sources_used: computed.priorSource ? [computed.priorSource] : ['country_prior'],
            color: computed.color,
            components: computed.components,
        }, priorGate);

        return NextResponse.json({
            mode: 'computed_fallback',
            total: 1,
            publish_level: priorGate.publishLevel,
            corridors: [result],
            note: obs.frictionObservations30d === 0
                ? 'Estimate (low confidence) — improves as reports + fills accumulate'
                : `Based on ${obs.frictionObservations30d} observations (30d)`,
            generated_at: new Date().toISOString(),
        });
    }

    // Enrich stored data with basis labels + gating
    const enriched = data.map((row) =>
        scrubResponse({
            ...row,
            basis: obs.frictionBasis,
            observations_count: obs.frictionObservations30d,
            sources_used: buildSourcesList(obs),
        }, gate),
    );

    // Band distribution
    const bands: Record<string, number> = {};
    for (const row of data) {
        bands[row.friction_band] = (bands[row.friction_band] || 0) + 1;
    }

    return NextResponse.json({
        mode: 'stored',
        total: enriched.length,
        publish_level: gate.publishLevel,
        basis: obs.frictionBasis,
        observations_count: obs.frictionObservations30d,
        band_distribution: bands,
        corridors: enriched,
        _truth: {
            basis: gate.basis,
            publishLevel: gate.publishLevel,
            uiBanner: gate.uiBanner,
            marketOverride: gate.marketOverride,
        },
        generated_at: new Date().toISOString(),
    });
}

function buildSourcesList(obs: { behavioralEvents30d: number; crowdReports30d: number; frictionObservations30d: number }) {
    const sources: string[] = ['country_prior'];
    if (obs.behavioralEvents30d > 0) sources.push('behavioral_exhaust');
    if (obs.crowdReports30d > 0) sources.push('crowdsourced');
    if (obs.frictionObservations30d > 0) sources.push('friction_observations');
    return sources;
}
