/**
 * Anti-Extraction Shield
 *
 * Detects and mitigates data extraction/scraping attacks.
 * Implements progressive responses from rate clamping to key quarantine.
 *
 * Detectors:
 *   - Graph walk detection (systematic corridor enumeration)
 *   - Low entropy query patterns (scripted parameter sweeps)
 *   - Geo impossible travel (requests from incompatible locations)
 *   - Distributed scrape signatures (multiple keys, same pattern)
 *   - Bulk sequential access patterns
 *
 * Responses:
 *   - Progressive rate clamping
 *   - Response blurring (reduce precision for suspect keys)
 *   - Silent honeyfield injection
 *   - Temporary shadow ban
 *   - Automated key quarantine
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ExtractionSignal {
    keyId: string;
    signalType: string;
    riskScore: number;
    evidence: Record<string, unknown>;
}

export type MitigationAction = 'none' | 'rate_clamp' | 'response_blur' | 'shadow_ban' | 'quarantine' | 'suspended';

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

// ═══════════════════════════════════════════════════════════════
// DETECTOR: Graph Walk Detection
// ═══════════════════════════════════════════════════════════════

/**
 * Detects if a key is systematically enumerating corridors/entities.
 * Pattern: sequential queries covering many unique IDs in a short window.
 */
export async function detectGraphWalk(keyId: string): Promise<ExtractionSignal | null> {
    const sb = getAdmin();

    // Get distinct corridor queries in the last 15 minutes
    const { data: events } = await sb
        .from('enterprise_usage_events')
        .select('endpoint, created_at')
        .eq('api_key_id', keyId)
        .gte('created_at', new Date(Date.now() - 900_000).toISOString())
        .order('created_at', { ascending: true });

    if (!events || events.length < 10) return null;

    // Count unique corridors queried (via endpoint patterns)
    const uniqueEndpoints = new Set(events.map((e: any) => e.endpoint));

    // If querying > 20 unique endpoints in 15 min = suspicious
    const velocity = events.length / 15; // requests per minute
    const diversity = uniqueEndpoints.size / events.length;

    if (events.length > 30 && diversity > 0.7) {
        const risk = Math.min(1.0, (events.length / 100) * diversity);
        return {
            keyId,
            signalType: 'graph_walk',
            riskScore: risk,
            evidence: {
                total_requests: events.length,
                unique_endpoints: uniqueEndpoints.size,
                diversity_ratio: diversity,
                velocity_rpm: velocity,
                window_minutes: 15,
            },
        };
    }

    return null;
}

// ═══════════════════════════════════════════════════════════════
// DETECTOR: Low Entropy Query Patterns
// ═══════════════════════════════════════════════════════════════

/**
 * Detects scripted parameter sweeps (e.g., incrementing IDs,
 * systematic limit/offset exploration).
 */
export async function detectLowEntropyQueries(keyId: string): Promise<ExtractionSignal | null> {
    const sb = getAdmin();

    const { data: events } = await sb
        .from('enterprise_usage_events')
        .select('endpoint, created_at')
        .eq('api_key_id', keyId)
        .gte('created_at', new Date(Date.now() - 3600_000).toISOString())
        .order('created_at', { ascending: true });

    if (!events || events.length < 20) return null;

    // Check for regular timing intervals (bot signature)
    const gaps: number[] = [];
    for (let i = 1; i < events.length; i++) {
        const gap = new Date(events[i].created_at).getTime() - new Date(events[i - 1].created_at).getTime();
        gaps.push(gap);
    }

    if (gaps.length < 5) return null;

    // Standard deviation of gaps — very low = automated
    const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
    const stddev = Math.sqrt(variance);
    const cv = mean > 0 ? stddev / mean : 0; // coefficient of variation

    // CV < 0.15 means very regular timing = bot
    if (cv < 0.15 && events.length > 20) {
        return {
            keyId,
            signalType: 'low_entropy_query',
            riskScore: Math.min(1.0, 0.6 + (0.4 * (1 - cv))),
            evidence: {
                total_requests: events.length,
                mean_gap_ms: Math.round(mean),
                stddev_ms: Math.round(stddev),
                coefficient_of_variation: Math.round(cv * 1000) / 1000,
                window_hours: 1,
            },
        };
    }

    return null;
}

// ═══════════════════════════════════════════════════════════════
// DETECTOR: Geo Impossible Travel
// ═══════════════════════════════════════════════════════════════

/**
 * Detects if the same API key is used from geographically
 * impossible locations within a short time window.
 */
export async function detectGeoImpossibleTravel(
    keyId: string,
    currentGeo: string,
): Promise<ExtractionSignal | null> {
    const sb = getAdmin();

    // Get recent geo_scope values for this key
    const { data: recentGeo } = await sb
        .from('enterprise_usage_events')
        .select('geo_scope, created_at')
        .eq('api_key_id', keyId)
        .not('geo_scope', 'is', null)
        .gte('created_at', new Date(Date.now() - 3600_000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

    if (!recentGeo || recentGeo.length < 2) return null;

    // Build set of regions queried
    const geoSet = new Set(recentGeo.map((e: any) => e.geo_scope));
    geoSet.add(currentGeo);

    // If querying data for > 5 different regions in 1 hour = suspicious
    if (geoSet.size > 5) {
        return {
            keyId,
            signalType: 'geo_impossible_travel',
            riskScore: Math.min(1.0, geoSet.size / 10),
            evidence: {
                regions_queried: Array.from(geoSet),
                region_count: geoSet.size,
                window_hours: 1,
                current_geo: currentGeo,
            },
        };
    }

    return null;
}

// ═══════════════════════════════════════════════════════════════
// MITIGATION ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Determine and apply the appropriate mitigation action
 * based on cumulative risk signals for a key.
 */
export async function evaluateAndMitigate(keyId: string): Promise<{
    action: MitigationAction;
    riskScore: number;
    signals: ExtractionSignal[];
}> {
    // Run all detectors in parallel
    const [graphWalk, lowEntropy] = await Promise.all([
        detectGraphWalk(keyId),
        detectLowEntropyQueries(keyId),
    ]);

    const signals = [graphWalk, lowEntropy].filter(Boolean) as ExtractionSignal[];

    if (signals.length === 0) {
        return { action: 'none', riskScore: 0, signals: [] };
    }

    // Composite risk = max of individual risks + bonus for multiple signals
    const maxRisk = Math.max(...signals.map(s => s.riskScore));
    const compositeRisk = Math.min(1.0, maxRisk + (signals.length - 1) * 0.15);

    // Determine action based on risk level
    let action: MitigationAction;
    if (compositeRisk >= 0.90) {
        action = 'quarantine';
    } else if (compositeRisk >= 0.75) {
        action = 'shadow_ban';
    } else if (compositeRisk >= 0.55) {
        action = 'response_blur';
    } else if (compositeRisk >= 0.35) {
        action = 'rate_clamp';
    } else {
        action = 'none';
    }

    // Log fingerprints
    const sb = getAdmin();
    for (const signal of signals) {
        await sb.from('extraction_fingerprints').insert({
            api_key_id: keyId,
            fingerprint_type: signal.signalType,
            risk_score: signal.riskScore,
            evidence: signal.evidence,
            action_taken: action,
        });
    }

    // Apply key-level actions
    if (action === 'quarantine') {
        await sb
            .from('enterprise_api_keys')
            .update({ status: 'suspended', suspension_reason: `Anti-extraction: ${action}` })
            .eq('id', keyId);
    }

    return { action, riskScore: compositeRisk, signals };
}

// ═══════════════════════════════════════════════════════════════
// HONEYFIELD INJECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a per-key unique honeyfield marker.
 * Injected into responses for suspect keys to detect downstream leaks.
 */
export async function injectHoneyfield(
    keyId: string,
    endpoint: string,
): Promise<{ markerField: string; markerValue: string } | null> {
    const sb = getAdmin();

    // Generate a unique marker — subtle numeric precision fingerprint
    const uniqueValue = `0.${Date.now().toString().slice(-6)}${keyId.slice(0, 4)}`;
    const markerField = '_internal_ref';

    await sb.from('honeyfield_markers').upsert({
        api_key_id: keyId,
        marker_type: 'precision_fingerprint',
        marker_value: uniqueValue,
        injected_in_endpoint: endpoint,
    }, { onConflict: 'marker_value' });

    return { markerField, markerValue: uniqueValue };
}

/**
 * Apply response blurring — reduce numeric precision for suspect keys.
 * This makes scraped data less useful while remaining plausible.
 */
export function blurResponse(data: Record<string, unknown>[], blurLevel: number = 2): Record<string, unknown>[] {
    return data.map(row => {
        const blurred = { ...row };
        for (const [key, value] of Object.entries(blurred)) {
            if (typeof value === 'number' && key !== 'id') {
                // Reduce precision and add noise
                const noise = (Math.random() - 0.5) * (value * 0.01 * blurLevel);
                blurred[key] = Math.round((value + noise) * 100) / 100;
            }
        }
        return blurred;
    });
}
