// lib/marketplace/ledger-reliability.ts
//
// Haul Command — Verified Job Ledger Reliability Engine
// Spec: Map-First Load Board v1.1.0 (Verified Job Ledger)
//
// Computes reliability scores from ledger evidence:
//   base: consensus (40%) + evidence quality (35%) + paid signal (25%)
//   minus: dispute penalty + cancellation penalty
//
// Feeds into: coverage_confidence.reliability_score, trust_score_v3

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type ConsensusLevel = 'none' | 'single_party' | 'two_party' | 'three_party';
export type EvidenceKind = 'ratecon' | 'messages' | 'call_logs' | 'gps' | 'photo' | 'pdf' | 'other';

export interface LedgerReliabilityInput {
    account_id: string;

    // Consensus data (from attestation_edges)
    total_verified_jobs: number;
    completed_jobs: number;
    cancelled_jobs: number;
    disputed_jobs: number;
    resolved_disputes: number;

    // Consensus levels
    three_party_consensus: number;
    two_party_consensus: number;
    single_party_consensus: number;

    // Paid attestations
    paid_attestations: number;

    // Evidence quality
    ratecon_present: number;
    messages_present: number;
    call_logs_present: number;
    gps_proof_present: number;
}

export interface LedgerReliabilityResult {
    account_id: string;
    reliability_score: number;          // 0-1
    reliability_grade: 'unknown' | 'ok' | 'good' | 'excellent';

    // Components
    consensus_score: number;
    evidence_quality_score: number;
    paid_signal: number;
    dispute_penalty: number;
    cancel_penalty: number;

    // Stats
    total_verified_jobs: number;
    completed_jobs: number;
}

// ============================================================
// EVIDENCE QUALITY WEIGHTS (from spec)
// ============================================================

const EVIDENCE_WEIGHTS = {
    ratecon: 0.35,
    messages: 0.25,
    call_logs: 0.20,
    gps: 0.20,
};

// ============================================================
// COMPUTE
// ============================================================

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

export function computeLedgerReliability(input: LedgerReliabilityInput): LedgerReliabilityResult {
    if (input.total_verified_jobs === 0) {
        return {
            account_id: input.account_id,
            reliability_score: 0,
            reliability_grade: 'unknown',
            consensus_score: 0,
            evidence_quality_score: 0,
            paid_signal: 0,
            dispute_penalty: 0,
            cancel_penalty: 0,
            total_verified_jobs: 0,
            completed_jobs: 0,
        };
    }

    const total = input.total_verified_jobs;

    // ── Consensus Score (0-1) ──
    // Weighted by consensus level
    const consensusScore = clamp(
        (input.three_party_consensus * 1.0 +
            input.two_party_consensus * 0.70 +
            input.single_party_consensus * 0.35) / total,
        0, 1
    );

    // ── Evidence Quality Score (0-1) ──
    // What fraction of completed jobs have each evidence type?
    const completed = Math.max(input.completed_jobs, 1);
    const evidenceQuality =
        (input.ratecon_present / completed) * EVIDENCE_WEIGHTS.ratecon +
        (input.messages_present / completed) * EVIDENCE_WEIGHTS.messages +
        (input.call_logs_present / completed) * EVIDENCE_WEIGHTS.call_logs +
        (input.gps_proof_present / completed) * EVIDENCE_WEIGHTS.gps;

    const evidenceQualityScore = clamp(evidenceQuality, 0, 1);

    // ── Paid Signal (0-1) ──
    const paidSignal = clamp(input.paid_attestations / completed, 0, 1);

    // ── Base Score ──
    const base = clamp(
        consensusScore * 0.40 +
        evidenceQualityScore * 0.35 +
        paidSignal * 0.25,
        0, 1
    );

    // ── Penalties ──
    const disputeRate = input.disputed_jobs / total;
    const cancelRate = input.cancelled_jobs / total;

    const disputePenalty = clamp(disputeRate * 0.6, 0, 0.4);
    const cancelPenalty = clamp(cancelRate * 0.4, 0, 0.3);

    // ── Final ──
    const reliabilityScore = clamp(base - disputePenalty - cancelPenalty, 0, 1);

    // ── Grade ──
    let grade: 'unknown' | 'ok' | 'good' | 'excellent' = 'unknown';
    if (reliabilityScore >= 0.80) grade = 'excellent';
    else if (reliabilityScore >= 0.55) grade = 'good';
    else if (reliabilityScore >= 0.30) grade = 'ok';

    return {
        account_id: input.account_id,
        reliability_score: Math.round(reliabilityScore * 1000) / 1000,
        reliability_grade: grade,
        consensus_score: Math.round(consensusScore * 1000) / 1000,
        evidence_quality_score: Math.round(evidenceQualityScore * 1000) / 1000,
        paid_signal: Math.round(paidSignal * 1000) / 1000,
        dispute_penalty: Math.round(disputePenalty * 1000) / 1000,
        cancel_penalty: Math.round(cancelPenalty * 1000) / 1000,
        total_verified_jobs: input.total_verified_jobs,
        completed_jobs: input.completed_jobs,
    };
}

// ============================================================
// AGGREGATE PER CELL (for coverage confidence integration)
// ============================================================

export async function aggregateLedgerReliabilityForCell(cellId: string): Promise<number> {
    const supabase = getSupabaseAdmin();

    // Get operators in this cell via their home geohash
    // For now, return a placeholder — the actual implementation
    // would join operator_profiles → verified_jobs → attestation_edges
    const { data: snapshots } = await supabase
        .from('trust_score_snapshots')
        .select('ledger_reliability')
        .order('computed_at', { ascending: false })
        .limit(50);

    if (!snapshots || snapshots.length === 0) return 0;

    const avg = snapshots.reduce((s, r) => s + (r.ledger_reliability || 0), 0) / snapshots.length;
    return Math.round(avg * 1000) / 1000;
}

// ============================================================
// AGGREGATE PER ACTOR (for trust score integration)
// ============================================================

export async function computeActorLedgerReliability(accountId: string): Promise<LedgerReliabilityResult> {
    const supabase = getSupabaseAdmin();

    // Count verified jobs for this actor
    const { data: operatorJobs } = await supabase
        .from('verified_jobs')
        .select('verified_job_id, status')
        .eq('operator_id', accountId);

    const { data: posterJobs } = await supabase
        .from('verified_jobs')
        .select('verified_job_id, status')
        .eq('poster_account_id', accountId);

    const allJobs = [...(operatorJobs || []), ...(posterJobs || [])];
    const jobIds = allJobs.map(j => j.verified_job_id);

    if (jobIds.length === 0) {
        return computeLedgerReliability({
            account_id: accountId,
            total_verified_jobs: 0,
            completed_jobs: 0,
            cancelled_jobs: 0,
            disputed_jobs: 0,
            resolved_disputes: 0,
            three_party_consensus: 0,
            two_party_consensus: 0,
            single_party_consensus: 0,
            paid_attestations: 0,
            ratecon_present: 0,
            messages_present: 0,
            call_logs_present: 0,
            gps_proof_present: 0,
        });
    }

    // Count by status
    const completed = allJobs.filter(j => j.status === 'completed').length;
    const cancelled = allJobs.filter(j => j.status === 'cancelled').length;
    const disputed = allJobs.filter(j => j.status === 'disputed').length;

    // Get attestation edges
    const { data: edges } = await supabase
        .from('attestation_edges')
        .select('consensus_level')
        .in('verified_job_id', jobIds);

    const consensusCounts = { three_party: 0, two_party: 0, single_party: 0 };
    for (const e of edges || []) {
        if (e.consensus_level === 'three_party') consensusCounts.three_party++;
        else if (e.consensus_level === 'two_party') consensusCounts.two_party++;
        else if (e.consensus_level === 'single_party') consensusCounts.single_party++;
    }

    // Get paid attestations
    const { count: paidCount } = await supabase
        .from('verified_job_events')
        .select('ledger_event_id', { count: 'exact', head: true })
        .in('verified_job_id', jobIds)
        .eq('event_type', 'attest_paid');

    // Get evidence counts
    const { data: evidenceData } = await supabase
        .from('verified_job_events')
        .select('evidence_pack_id')
        .in('verified_job_id', jobIds)
        .eq('event_type', 'evidence_added')
        .not('evidence_pack_id', 'is', null);

    const evidenceIds = (evidenceData || []).map(e => e.evidence_pack_id).filter(Boolean);

    let ratecons = 0, messages = 0, callLogs = 0, gps = 0;
    if (evidenceIds.length > 0) {
        const { data: packs } = await supabase
            .from('evidence_packs')
            .select('kind')
            .in('evidence_pack_id', evidenceIds);

        for (const p of packs || []) {
            if (p.kind === 'ratecon') ratecons++;
            else if (p.kind === 'messages') messages++;
            else if (p.kind === 'call_logs') callLogs++;
            else if (p.kind === 'gps') gps++;
        }
    }

    return computeLedgerReliability({
        account_id: accountId,
        total_verified_jobs: allJobs.length,
        completed_jobs: completed,
        cancelled_jobs: cancelled,
        disputed_jobs: disputed,
        resolved_disputes: 0, // Would query resolved events
        three_party_consensus: consensusCounts.three_party,
        two_party_consensus: consensusCounts.two_party,
        single_party_consensus: consensusCounts.single_party,
        paid_attestations: paidCount || 0,
        ratecon_present: ratecons,
        messages_present: messages,
        call_logs_present: callLogs,
        gps_proof_present: gps,
    });
}
