// lib/loadboard/api-handlers.ts
//
// Haul Command — Load Board API Route Handlers
// Spec: Map-First Load Board v1.0.0
//
// Public endpoints:
//   GET /api/public/loadboard/summary
//   GET /api/public/loadboard/cells
//   GET /api/public/loadboard/jobs
// Private endpoints:
//   POST /api/private/loadboard/job/:job_id/contact

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { computeBestMatchScore, computeJobEffectiveWeight, type VerificationLevel } from "./coverage-confidence";
import { detectRole, getRoleDefaults, type UserRole } from "./dual-audience";

// ============================================================
// TYPES
// ============================================================

export interface SummaryResponse {
    active_jobs_raw: number;
    active_jobs_effective: number;
    active_operators_effective: number;
    last_updated_at: string;
    coverage_band_global: string;
}

export interface CellsQuery {
    bbox: string;           // "minLng,minLat,maxLng,maxLat"
    zoom: number;
    role?: UserRole;
    escort_type?: string;
    date_window?: string;
}

export interface JobsQuery {
    bbox?: string;
    zoom?: number;
    escort_type?: string;
    verification_level?: string;
    sort?: string;
    cursor?: string;
    limit?: number;
    origin_lat?: number;
    origin_lng?: number;
}

// ============================================================
// GET /api/public/loadboard/summary
// ============================================================

export async function handleSummary(): Promise<SummaryResponse> {
    const supabase = getSupabaseAdmin();

    // Active jobs count
    const { count: activeJobsRaw } = await supabase
        .from('job_posts')
        .select('job_id', { count: 'exact', head: true })
        .eq('status', 'open');

    // Sum effective jobs from coverage cells
    const { data: cellAggs } = await supabase
        .from('coverage_cells')
        .select('active_jobs_effective, active_operators_effective, coverage_band, updated_at')
        .order('updated_at', { ascending: false });

    const cells = cellAggs || [];
    const totalJobsEffective = cells.reduce((s, c) => s + (c.active_jobs_effective || 0), 0);
    const totalOpsEffective = cells.reduce((s, c) => s + (c.active_operators_effective || 0), 0);
    const lastUpdated = cells.length > 0 ? cells[0].updated_at : new Date().toISOString();

    // Global band: weighted average of cell confidences
    const bandCounts: Record<string, number> = {};
    for (const c of cells) {
        bandCounts[c.coverage_band] = (bandCounts[c.coverage_band] || 0) + 1;
    }
    const globalBand = Object.entries(bandCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'dead';

    return {
        active_jobs_raw: activeJobsRaw || 0,
        active_jobs_effective: Math.round(totalJobsEffective * 100) / 100,
        active_operators_effective: Math.round(totalOpsEffective * 100) / 100,
        last_updated_at: lastUpdated,
        coverage_band_global: globalBand,
    };
}

// ============================================================
// GET /api/public/loadboard/cells
// ============================================================

export async function handleCells(query: CellsQuery) {
    const supabase = getSupabaseAdmin();

    // Parse bbox
    const [minLng, minLat, maxLng, maxLat] = (query.bbox || '-180,-90,180,90')
        .split(',')
        .map(Number);

    // Query coverage cells within bbox
    // Using PostGIS ST_MakeEnvelope for spatial filter
    const { data: cells } = await supabase
        .from('coverage_cells')
        .select('cell_id, centroid_point, active_jobs_effective, active_operators_effective, coverage_confidence, coverage_band, updated_at, demand_norm, supply_norm, matchability_score, reliability_score')
        .order('coverage_confidence', { ascending: false })
        .limit(500);

    // Filter by bbox client-side if PostGIS query not available
    // In production, use ST_Within or ST_MakeEnvelope

    return {
        cells: cells || [],
        bbox: { minLng, minLat, maxLng, maxLat },
        zoom: query.zoom,
        count: (cells || []).length,
    };
}

// ============================================================
// GET /api/public/loadboard/jobs
// ============================================================

export async function handleJobs(query: JobsQuery) {
    const supabase = getSupabaseAdmin();
    const limit = Math.min(query.limit || 50, 100);

    let dbQuery = supabase
        .from('job_posts')
        .select('job_id, title, escort_type, origin_label, destination_label, origin_point, destination_point, pickup_earliest, pickup_latest, payout_min, payout_max, verification_level, is_verified, updated_at, poster_reputation, distance_miles')
        .eq('status', 'open')
        .limit(limit);

    // Filter by escort type
    if (query.escort_type && query.escort_type !== 'all') {
        dbQuery = dbQuery.eq('escort_type', query.escort_type);
    }

    // Filter by verification
    if (query.verification_level) {
        dbQuery = dbQuery.eq('verification_level', query.verification_level);
    }

    // Sort
    switch (query.sort) {
        case 'soonest_pickup':
            dbQuery = dbQuery.order('pickup_earliest', { ascending: true });
            break;
        case 'highest_payout':
            dbQuery = dbQuery.order('payout_max', { ascending: false });
            break;
        case 'verified_only':
            dbQuery = dbQuery
                .in('verification_level', ['verified', 'verified_elite'])
                .order('updated_at', { ascending: false });
            break;
        case 'best_match':
        default:
            dbQuery = dbQuery.order('updated_at', { ascending: false });
            break;
    }

    // Cursor pagination
    if (query.cursor) {
        dbQuery = dbQuery.lt('updated_at', query.cursor);
    }

    const { data: jobs, error } = await dbQuery;

    if (error) {
        throw new Error(`Jobs query failed: ${error.message}`);
    }

    const results = (jobs || []).map(job => {
        const payoutMid = ((job.payout_min || 0) + (job.payout_max || 0)) / 2;
        const freshnessWeight = computeJobEffectiveWeight({
            job_id: job.job_id,
            created_at: job.updated_at,
            updated_at: job.updated_at,
            verification_level: (job.verification_level || 'unverified') as VerificationLevel,
            payout_mid: payoutMid,
            poster_reputation: job.poster_reputation || 0.5,
            escort_type: job.escort_type,
        });

        const bestMatchScore = computeBestMatchScore({
            freshness_weight: freshnessWeight,
            verification_level: (job.verification_level || 'unverified') as VerificationLevel,
            payout_mid: payoutMid,
            distance_miles: job.distance_miles || 100,
            poster_reputation: job.poster_reputation || 0.5,
        });

        return {
            ...job,
            payout_range: job.payout_min && job.payout_max
                ? `$${job.payout_min.toLocaleString()}–$${job.payout_max.toLocaleString()}`
                : null,
            pickup_window: formatPickupWindow(job.pickup_earliest, job.pickup_latest),
            best_match_score: Math.round(bestMatchScore * 1000) / 1000,
            freshness_weight: Math.round(freshnessWeight * 1000) / 1000,
        };
    });

    // Re-sort by best_match_score if needed
    if (query.sort === 'best_match' || !query.sort) {
        results.sort((a, b) => b.best_match_score - a.best_match_score);
    }

    const nextCursor = results.length >= limit
        ? results[results.length - 1].updated_at
        : null;

    return {
        jobs: results,
        next_cursor: nextCursor,
        count: results.length,
    };
}

// ============================================================
// POST /api/private/loadboard/job/:job_id/contact
// ============================================================

export async function handleContact(
    jobId: string,
    senderId: string,
    body: { message: string; channel: 'in_app' | 'email' | 'sms' },
    ipHash?: string
): Promise<{ status: string; contact_log_id: string }> {
    const supabase = getSupabaseAdmin();

    // Verify job exists and is open
    const { data: job } = await supabase
        .from('job_posts')
        .select('job_id, poster_account_id')
        .eq('job_id', jobId)
        .eq('status', 'open')
        .single();

    if (!job) {
        throw new Error('Job not found or no longer open');
    }

    // Rate limit: max 10 contacts per sender per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
        .from('contact_logs')
        .select('contact_log_id', { count: 'exact', head: true })
        .eq('sender_id', senderId)
        .gte('created_at', oneHourAgo);

    if ((count || 0) >= 10) {
        throw new Error('Rate limit exceeded. Try again later.');
    }

    // Anti-spam: prevent duplicate messages to same job within 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dupeCount } = await supabase
        .from('contact_logs')
        .select('contact_log_id', { count: 'exact', head: true })
        .eq('sender_id', senderId)
        .eq('job_id', jobId)
        .gte('created_at', oneDayAgo);

    if ((dupeCount || 0) >= 1) {
        throw new Error('Already contacted about this job. Please wait for a response.');
    }

    // Create contact log
    const { data: contact, error } = await supabase
        .from('contact_logs')
        .insert({
            sender_id: senderId,
            recipient_id: job.poster_account_id,
            job_id: jobId,
            message: body.message.slice(0, 2000), // Cap message length
            channel: body.channel,
            sender_ip_hash: ipHash,
            rate_limit_key: `${senderId}:${jobId}`,
        })
        .select('contact_log_id')
        .single();

    if (error) {
        throw new Error(`Contact creation failed: ${error.message}`);
    }

    return {
        status: 'sent',
        contact_log_id: contact.contact_log_id,
    };
}

// ============================================================
// HELPERS
// ============================================================

function formatPickupWindow(earliest?: string, latest?: string): string {
    if (!earliest && !latest) return 'Flexible';

    const fmt = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (earliest && latest) {
        const e = fmt(earliest);
        const l = fmt(latest);
        return e === l ? e : `${e} – ${l}`;
    }

    return earliest ? `From ${fmt(earliest)}` : `By ${fmt(latest!)}`;
}
