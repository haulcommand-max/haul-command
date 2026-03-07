/**
 * Niche Enrichment Pipeline Orchestrator
 * 
 * End-to-end pipeline:
 *   1. Query OSM (Overpass) for niche entities near corridor waypoints
 *   2. Score all candidates through OERS
 *   3. If OSM yields < threshold, fallback to Google Places (cost-controlled)
 *   4. Cross-source match candidates found in both OSM + Google
 *   5. Run competitor density model
 *   6. Batch deduplicate
 *   7. Output scored, filtered, deduplicated entities → Supabase
 * 
 * Doctrine:
 *   - osm_first_google_fallback
 *   - upgrade_only_never_downgrade
 *   - suppress_generic_poi_noise
 */

import {
    computeOERS,
    scoreBatch,
    computeCompetitorDensity,
    nameSimilarity,
    POST_FILTER,
    type CandidatePOI,
    type CorridorRef,
    type BatchOERSResult,
    type CompetitorDensityResult,
    type OERSResult,
} from './oers';

import { queryOSMForNiche, corridorPointToBBox } from './osm-client';
import { searchGooglePlacesNiche, getGooglePlacesSpendReport, checkEnrichmentCache } from './google-places-client';
import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const MIN_OSM_RESULTS_BEFORE_GOOGLE_FALLBACK = 3;
const CROSS_SOURCE_MATCH_RADIUS_M = 150;
const CORRIDOR_SEARCH_RADIUS_KM = 25;

// ═══════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════

export interface EnrichmentPipelineInput {
    corridorSlug: string;
    waypoints: Array<{ lat: number; lon: number; name?: string }>;
    corridorTrafficScore: number;    // 0-100
    metroAreaKm2: number;
    countryCode: string;
    dryRun?: boolean;               // if true, don't write to DB
}

export interface EnrichmentPipelineResult {
    corridorSlug: string;
    countryCode: string;
    osmCandidates: number;
    googleCandidates: number;
    crossSourceMatches: number;
    oersBatch: BatchOERSResult;
    competitorDensity: CompetitorDensityResult;
    googleSpendReport: ReturnType<typeof getGooglePlacesSpendReport>;
    savedToDb: number;
    errors: string[];
}

export async function runEnrichmentPipeline(
    input: EnrichmentPipelineInput,
): Promise<EnrichmentPipelineResult> {
    const errors: string[] = [];

    const corridorRefs: CorridorRef[] = input.waypoints.map((wp, i) => ({
        slug: `${input.corridorSlug}_wp${i}`,
        lat: wp.lat,
        lon: wp.lon,
        radiusKm: CORRIDOR_SEARCH_RADIUS_KM,
    }));

    // ── Step 1: Query OSM ─────────────────────────────────────
    let osmCandidates: CandidatePOI[] = [];
    for (const wp of input.waypoints) {
        try {
            const bbox = corridorPointToBBox(wp.lat, wp.lon, CORRIDOR_SEARCH_RADIUS_KM);
            const results = await queryOSMForNiche(bbox);
            osmCandidates.push(...results.map(r => ({
                ...r,
                countryCode: input.countryCode,
            })));
        } catch (err: any) {
            errors.push(`OSM query failed for waypoint ${wp.name || `${wp.lat},${wp.lon}`}: ${err.message}`);
        }
    }

    // ── Step 2: Google Places fallback (if OSM insufficient) ──
    let googleCandidates: CandidatePOI[] = [];
    if (osmCandidates.length < MIN_OSM_RESULTS_BEFORE_GOOGLE_FALLBACK * input.waypoints.length) {
        for (const wp of input.waypoints) {
            try {
                // Check cache first
                const cached = await checkEnrichmentCache(wp.lat, wp.lon, CORRIDOR_SEARCH_RADIUS_KM);
                if (cached) {
                    googleCandidates.push(...cached);
                    continue;
                }

                const results = await searchGooglePlacesNiche({
                    lat: wp.lat,
                    lon: wp.lon,
                    radiusM: CORRIDOR_SEARCH_RADIUS_KM * 1000,
                    maxQueriesPerCity: 6,
                });
                googleCandidates.push(...results.map(r => ({
                    ...r,
                    countryCode: input.countryCode,
                })));
            } catch (err: any) {
                errors.push(`Google Places failed for waypoint ${wp.name || `${wp.lat},${wp.lon}`}: ${err.message}`);
            }
        }
    }

    // ── Step 3: Cross-source matching ─────────────────────────
    let crossSourceMatches = 0;
    const allCandidates = [...osmCandidates];

    for (const gp of googleCandidates) {
        const matchedOsm = osmCandidates.find(osm => {
            const distM = haversineKm(gp.lat, gp.lon, osm.lat, osm.lon) * 1000;
            return distM <= CROSS_SOURCE_MATCH_RADIUS_M &&
                nameSimilarity(gp.name, osm.name) >= POST_FILTER.nameSimilarityThreshold;
        });

        if (matchedOsm) {
            // Mark the OSM version as cross-source confirmed
            matchedOsm.crossSourceConfirmed = true;
            crossSourceMatches++;

            // Merge in any missing data from Google
            if (!matchedOsm.phone && gp.phone) matchedOsm.phone = gp.phone;
            if (!matchedOsm.website && gp.website) matchedOsm.website = gp.website;
            if (!matchedOsm.address && gp.address) matchedOsm.address = gp.address;
        } else {
            // New Google-only candidate
            allCandidates.push(gp);
        }
    }

    // ── Step 4: OERS batch scoring ────────────────────────────
    const oersBatch = scoreBatch(allCandidates, corridorRefs);

    // ── Step 5: Competitor density model ──────────────────────
    const escortCount = oersBatch.included.filter(p =>
        p.oers.matchedTier === 'tier1_direct_escort' || p.oers.matchedTier === 'tier2_heavy_haul_core'
    ).length;

    const heavyHaulCount = oersBatch.included.filter(p =>
        p.oers.matchedTier === 'tier2_heavy_haul_core' || p.oers.matchedTier === 'tier3_supporting_logistics'
    ).length;

    const competitorDensity = computeCompetitorDensity(
        escortCount,
        heavyHaulCount,
        input.metroAreaKm2,
        input.corridorTrafficScore,
    );

    // ── Step 6: Persist to Supabase ──────────────────────────
    let savedToDb = 0;
    if (!input.dryRun) {
        try {
            savedToDb = await persistEnrichedEntities(
                oersBatch.included,
                input.corridorSlug,
                input.countryCode,
                competitorDensity,
            );
        } catch (err: any) {
            errors.push(`DB persistence failed: ${err.message}`);
        }
    }

    return {
        corridorSlug: input.corridorSlug,
        countryCode: input.countryCode,
        osmCandidates: osmCandidates.length,
        googleCandidates: googleCandidates.length,
        crossSourceMatches,
        oersBatch,
        competitorDensity,
        googleSpendReport: getGooglePlacesSpendReport(),
        savedToDb,
        errors,
    };
}

// ═══════════════════════════════════════════════════════════════
// DB PERSISTENCE
// ═══════════════════════════════════════════════════════════════

async function persistEnrichedEntities(
    entities: Array<CandidatePOI & { oers: OERSResult }>,
    corridorSlug: string,
    countryCode: string,
    density: CompetitorDensityResult,
): Promise<number> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let saved = 0;

    // Batch upsert into enrichment_results
    const records = entities.map(e => ({
        source_id: e.id,
        source: e.source,
        name: e.name,
        lat: e.lat,
        lon: e.lon,
        country_code: countryCode,
        corridor_slug: corridorSlug,
        city: e.city,
        region: e.region,
        phone: e.phone,
        website: e.website,
        address: e.address,
        oers_score: e.oers.score,
        oers_verdict: e.oers.verdict,
        matched_tier: e.oers.matchedTier,
        matched_keywords: e.oers.matchedKeywords,
        semantic_hit: e.oers.semanticHit,
        cross_source_confirmed: e.crossSourceConfirmed || false,
        categories: e.categories || [],
        escort_density_score: density.escortDensityScore,
        opportunity_index: density.opportunityIndex,
    }));

    // Insert in chunks of 50
    for (let i = 0; i < records.length; i += 50) {
        const chunk = records.slice(i, i + 50);
        const { error } = await supabase
            .from('enrichment_results')
            .upsert(chunk, { onConflict: 'source_id' });

        if (error) {
            console.error('Enrichment upsert error:', error);
        } else {
            saved += chunk.length;
        }
    }

    return saved;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
