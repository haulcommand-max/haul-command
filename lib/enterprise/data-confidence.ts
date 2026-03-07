/**
 * Data Confidence Engine
 *
 * Computes and attaches confidence metadata to every enterprise API response.
 * Enterprise buyers need machine-readable trust signals for automation decisions.
 *
 * Confidence = f(source_quality, freshness, geo_density, cross_signal, source_count)
 */

import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ConfidenceMetadata {
    confidence_score: number;
    confidence_band: 'verified' | 'high' | 'medium' | 'low';
    data_freshness_seconds: number;
    source_blend_vector: Record<string, number>;
    geo_precision_level: string;
    last_verified_at: string | null;
}

export interface ConfidenceInput {
    entityType: string;
    entityId: string;
    sourceQuality?: number;     // 0-1: quality of the data source
    secondsSinceUpdate?: number;
    geoDensity?: number;        // 0-1: data density for this geo
    crossSignal?: number;       // 0-1: agreement across sources
    sourceCount?: number;
    sourceBlend?: Record<string, number>;
    geoPrecision?: string;
    lastVerifiedAt?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE BANDS
// ═══════════════════════════════════════════════════════════════

function scoreToBand(score: number): ConfidenceMetadata['confidence_band'] {
    if (score >= 0.90) return 'verified';
    if (score >= 0.75) return 'high';
    if (score >= 0.55) return 'medium';
    return 'low';
}

// ═══════════════════════════════════════════════════════════════
// CORE SCORING (mirrors SQL function for application-layer use)
// ═══════════════════════════════════════════════════════════════

/**
 * Compute confidence score locally (no DB call).
 * Use this for inline confidence enrichment of API responses.
 */
export function computeConfidence(input: ConfidenceInput): ConfidenceMetadata {
    const sq = input.sourceQuality ?? 0.5;
    const seconds = input.secondsSinceUpdate ?? 3600;
    const gd = input.geoDensity ?? 0.5;
    const cs = input.crossSignal ?? 0.5;
    const sc = input.sourceCount ?? 1;

    // Exponential decay with 24h half-life
    const freshnessWeight = Math.max(0.1, Math.exp(-0.693 * seconds / 86400));

    // Weighted composite
    const score = Math.min(1.0,
        0.30 * sq +
        0.25 * freshnessWeight +
        0.20 * gd +
        0.15 * cs +
        0.10 * Math.min(1.0, sc / 5)
    );

    return {
        confidence_score: Math.round(score * 10000) / 10000,
        confidence_band: scoreToBand(score),
        data_freshness_seconds: seconds,
        source_blend_vector: input.sourceBlend ?? { primary: 1.0 },
        geo_precision_level: input.geoPrecision ?? 'corridor',
        last_verified_at: input.lastVerifiedAt ?? null,
    };
}

// ═══════════════════════════════════════════════════════════════
// BATCH ENRICHMENT: Add confidence to API response rows
// ═══════════════════════════════════════════════════════════════

/**
 * Enriches an array of API response rows with confidence metadata.
 * Looks up cached confidence snapshots from DB, falls back to computation.
 */
export async function enrichWithConfidence(
    rows: Record<string, unknown>[],
    entityType: string,
    idField: string = 'corridor_id',
    opts?: {
        defaultSourceQuality?: number;
        defaultGeoDensity?: number;
    },
): Promise<(Record<string, unknown> & { _confidence: ConfidenceMetadata })[]> {
    if (rows.length === 0) return [];

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Batch-fetch cached confidence snapshots
    const entityIds = rows.map(r => String(r[idField] ?? '')).filter(Boolean);
    const { data: cached } = await supabase
        .from('data_confidence_snapshots')
        .select('entity_id, confidence_score, confidence_band, freshness_seconds, source_blend, geo_precision, cross_signal_agreement, last_verified_at, computed_at')
        .eq('entity_type', entityType)
        .in('entity_id', entityIds);

    const cacheMap = new Map(
        (cached ?? []).map((c: any) => [c.entity_id, c])
    );

    return rows.map(row => {
        const eid = String(row[idField] ?? '');
        const snapshot = cacheMap.get(eid);

        let confidence: ConfidenceMetadata;

        if (snapshot) {
            // Use cached snapshot
            const age = snapshot.computed_at
                ? Math.floor((Date.now() - new Date(snapshot.computed_at).getTime()) / 1000)
                : 3600;

            confidence = {
                confidence_score: snapshot.confidence_score,
                confidence_band: snapshot.confidence_band,
                data_freshness_seconds: snapshot.freshness_seconds + age,
                source_blend_vector: snapshot.source_blend ?? { primary: 1.0 },
                geo_precision_level: snapshot.geo_precision ?? 'corridor',
                last_verified_at: snapshot.last_verified_at,
            };
        } else {
            // Compute on the fly
            const updatedAt = row['updated_at'] ?? row['created_at'];
            const secondsSince = updatedAt
                ? Math.floor((Date.now() - new Date(String(updatedAt)).getTime()) / 1000)
                : 86400;

            confidence = computeConfidence({
                entityType,
                entityId: eid,
                sourceQuality: opts?.defaultSourceQuality ?? 0.5,
                secondsSinceUpdate: secondsSince,
                geoDensity: opts?.defaultGeoDensity ?? 0.3,
                crossSignal: 0.4,
                sourceCount: 1,
            });
        }

        return { ...row, _confidence: confidence };
    });
}

// ═══════════════════════════════════════════════════════════════
// GEO CREDIBILITY GATING
// ═══════════════════════════════════════════════════════════════

/**
 * Filters and annotates rows based on geo credibility scores.
 * Tier D regions are suppressed; Tier C regions get warning flags.
 */
export async function filterByGeoCredibility(
    rows: Record<string, unknown>[],
    regionField: string = 'corridor_id',
    extractRegion: (id: string) => string = defaultRegionExtractor,
): Promise<{
    data: Record<string, unknown>[];
    suppressed: number;
    warnings: string[];
}> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Get all geo credibility scores
    const { data: geoScores } = await supabase
        .from('geo_credibility_scores')
        .select('region_code, readiness_band, suppress_in_api, composite_score');

    const geoMap = new Map(
        (geoScores ?? []).map((g: any) => [g.region_code, g])
    );

    const warnings: string[] = [];
    let suppressed = 0;

    const filtered = rows.filter(row => {
        const rid = String(row[regionField] ?? '');
        const region = extractRegion(rid);
        const geo = geoMap.get(region);

        if (geo?.suppress_in_api) {
            suppressed++;
            return false;
        }

        if (geo?.readiness_band === 'tier_c') {
            warnings.push(`Region ${region}: experimental data coverage (tier_c)`);
            // Add warning annotation to the row
            (row as any)._geo_warning = `Experimental coverage: confidence may be limited for ${region}`;
        }

        return true;
    });

    return { data: filtered, suppressed, warnings };
}

function defaultRegionExtractor(corridorId: string): string {
    // Extract state/region from corridor ID like "US-TX-I10-W" → "US-TX"
    const parts = corridorId.split('-');
    return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : corridorId;
}

// ═══════════════════════════════════════════════════════════════
// SLA MONITORING HELPERS
// ═══════════════════════════════════════════════════════════════

/** Track latency for SLA computation */
const latencyBuffer: Map<string, number[]> = new Map();

export function recordLatency(endpointFamily: string, latencyMs: number): void {
    const key = endpointFamily;
    if (!latencyBuffer.has(key)) latencyBuffer.set(key, []);
    latencyBuffer.get(key)!.push(latencyMs);
}

/**
 * Flush latency buffer to SLA windows.
 * Call this every 5 minutes from a cron or edge function.
 */
export async function flushSlaWindows(): Promise<number> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const now = new Date();
    // Round down to nearest 5-minute window
    const windowStart = new Date(Math.floor(now.getTime() / 300000) * 300000);

    let flushed = 0;

    for (const [family, latencies] of latencyBuffer.entries()) {
        if (latencies.length === 0) continue;

        const sorted = [...latencies].sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
        const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
        const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;
        const errors = latencies.filter(l => l < 0).length; // negative = error marker

        await supabase.rpc('record_sla_window', {
            p_endpoint_family: family,
            p_window_start: windowStart.toISOString(),
            p_request_count: latencies.length,
            p_error_count: errors,
            p_p50_ms: Math.round(p50),
            p_p95_ms: Math.round(p95),
            p_p99_ms: Math.round(p99),
        });

        flushed++;
    }

    latencyBuffer.clear();
    return flushed;
}
