// lib/predictive/feature-engine.ts
//
// Haul Command — Predictive Liquidity Feature Engine
// Spec: Predictive Liquidity Engine v1.0.0 — Part B
//
// Daily job: pulls corridor snapshots, computes moving averages,
// deltas, warning rollups, VAPI rates, compliance risk.
// Writes to corridor_feature_store_daily (idempotent).

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface FeatureRow {
    corridor_id: string;
    snapshot_date: string;

    // Core
    cls: number;
    stage: string;
    match_rate: number;
    participation_rate: number;
    verified_supply_count: number;
    activated_supply_count: number;
    demand_accounts_count: number;
    demand_posts_count: number;
    repeat_poster_rate: number;
    verification_rate: number;
    median_time_to_match_minutes: number;

    // Deltas
    cls_delta_7d: number;
    match_rate_delta_7d: number;
    participation_delta_7d: number;
    demand_posts_delta_7d: number;
    supply_active_delta_7d: number;
    time_to_match_delta_7d: number;

    // Moving averages
    cls_ma_7d: number;
    cls_ma_14d: number;
    match_rate_ma_7d: number;
    participation_ma_7d: number;
    demand_posts_ma_7d: number;
    time_to_match_ma_7d: number;

    // Health
    phantom_supply_flag: boolean;
    backlog_flag: boolean;
    warning_count_7d: number;
    critical_count_7d: number;

    // VAPI
    vapi_connected_rate_7d: number;
    vapi_engaged_rate_7d: number;
    claim_start_rate_7d: number;
    verify_rate_7d: number;
    activation_rate_7d: number;

    // Compliance
    country_code: string;
    calling_risk_tier: string;
    quiet_hours_block_rate_7d: number;
    consent_block_rate_7d: number;
}

export interface DataQualityCheck {
    corridor_id: string;
    passed: boolean;
    history_days: number;
    issues: string[];
}

// ============================================================
// COMPUTE MOVING AVERAGE
// ============================================================

function computeMA(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
}

function computeDelta7d(current: number, sevenDaysAgo: number): number {
    return current - sevenDaysAgo;
}

// ============================================================
// DATA QUALITY GATES
// ============================================================

export function checkDataQuality(
    corridorId: string,
    historyDays: number,
    minHistoryDays: number = 21
): DataQualityCheck {
    const issues: string[] = [];

    if (historyDays < minHistoryDays) {
        issues.push(`History ${historyDays}d < minimum ${minHistoryDays}d`);
    }

    return {
        corridor_id: corridorId,
        passed: issues.length === 0,
        history_days: historyDays,
        issues,
    };
}

// ============================================================
// MAIN FEATURE REFRESH
// ============================================================

export async function refreshFeatureStore(snapshotDate: string): Promise<{
    corridors_processed: number;
    features_written: number;
    quality_failures: number;
    duration_ms: number;
}> {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();

    // ── Pull latest snapshots ──
    const { data: snapshots } = await supabase
        .from('corridor_liquidity_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false });

    // Group by corridor
    const corridorSnapshots = new Map<string, any[]>();
    for (const s of snapshots || []) {
        const existing = corridorSnapshots.get(s.corridor_id) || [];
        existing.push(s);
        corridorSnapshots.set(s.corridor_id, existing);
    }

    // ── Pull VAPI stats (7d) ──
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: vapiCalls } = await supabase
        .from('vapi_call_log')
        .select('country_code, connected, engaged, claim_started')
        .gte('created_at', sevenDaysAgo);

    const vapiByCountry = new Map<string, { total: number; connected: number; engaged: number; claimed: number }>();
    for (const c of vapiCalls || []) {
        const key = c.country_code || 'unknown';
        const existing = vapiByCountry.get(key) || { total: 0, connected: 0, engaged: 0, claimed: 0 };
        existing.total++;
        if (c.connected) existing.connected++;
        if (c.engaged) existing.engaged++;
        if (c.claim_started) existing.claimed++;
        vapiByCountry.set(key, existing);
    }

    // ── Pull warnings (7d) ──
    const { data: warnings } = await supabase
        .from('funnel_warnings')
        .select('corridor_id, severity')
        .gte('created_at', sevenDaysAgo);

    const warningsByCorr = new Map<string, { warnings: number; critical: number }>();
    for (const w of warnings || []) {
        const existing = warningsByCorr.get(w.corridor_id) || { warnings: 0, critical: 0 };
        existing.warnings++;
        if (w.severity === 'critical') existing.critical++;
        warningsByCorr.set(w.corridor_id, existing);
    }

    // ── Pull compliance rules ──
    const { data: callRules } = await supabase
        .from('country_call_rules')
        .select('country_code, risk_tier');

    const riskByCountry = new Map<string, string>();
    for (const r of callRules || []) {
        riskByCountry.set(r.country_code, r.risk_tier);
    }

    // ── Compute features per corridor ──
    let featuresWritten = 0;
    let qualityFailures = 0;

    for (const [corridorId, snaps] of corridorSnapshots) {
        // Sort by date descending
        snaps.sort((a: any, b: any) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime());

        const latest = snaps[0];
        if (!latest) continue;

        // Quality gate
        const quality = checkDataQuality(corridorId, snaps.length);
        if (!quality.passed) {
            qualityFailures++;
            // Still write, but mark low confidence
        }

        // Moving averages (7d, 14d)
        const last7 = snaps.slice(0, 7);
        const last14 = snaps.slice(0, 14);

        const clsMA7 = computeMA(last7.map((s: any) => s.cls || 0));
        const clsMA14 = computeMA(last14.map((s: any) => s.cls || 0));
        const matchRateMA7 = computeMA(last7.map((s: any) => s.match_rate || 0));
        const participationMA7 = computeMA(last7.map((s: any) => s.participation_pct || 0));
        const demandPostsMA7 = computeMA(last7.map((s: any) => s.demand_posts_count || 0));
        const ttmMA7 = computeMA(last7.map((s: any) => s.median_time_to_match_minutes || 0));

        // Deltas (vs 7 days ago)
        const sevenDayOld = snaps.length >= 7 ? snaps[6] : snaps[snaps.length - 1];
        const clsDelta7 = computeDelta7d(latest.cls || 0, sevenDayOld?.cls || 0);
        const matchDelta7 = computeDelta7d(latest.match_rate || 0, sevenDayOld?.match_rate || 0);
        const participationDelta7 = computeDelta7d(latest.participation_pct || 0, sevenDayOld?.participation_pct || 0);
        const demandPostsDelta7 = computeDelta7d(latest.demand_posts_count || 0, sevenDayOld?.demand_posts_count || 0);
        const supplyActiveDelta7 = computeDelta7d(latest.activated_supply_count || 0, sevenDayOld?.activated_supply_count || 0);
        const ttmDelta7 = computeDelta7d(latest.median_time_to_match_minutes || 0, sevenDayOld?.median_time_to_match_minutes || 0);

        // Health flags
        const phantomSupply = (latest.activated_supply_count || 0) > 0 &&
            (latest.match_rate || 0) < 20 && (latest.participation_pct || 0) < 15;
        const backlog = (latest.demand_posts_count || 0) > (latest.activated_supply_count || 0) * 2;

        // VAPI rates
        const countryCode = latest.country_code || 'US';
        const vapiStats = vapiByCountry.get(countryCode) || { total: 0, connected: 0, engaged: 0, claimed: 0 };
        const vapiTotal = Math.max(vapiStats.total, 1);

        // Warning rollups
        const warnStats = warningsByCorr.get(corridorId) || { warnings: 0, critical: 0 };

        // Write feature row
        const { error } = await supabase.from('corridor_feature_store_daily').upsert({
            corridor_id: corridorId,
            snapshot_date: snapshotDate,

            cls: latest.cls || 0,
            stage: latest.stage || 'seeding',
            match_rate: latest.match_rate || 0,
            participation_rate: latest.participation_pct || 0,
            verified_supply_count: latest.verified_supply_count || 0,
            activated_supply_count: latest.activated_supply_count || 0,
            demand_accounts_count: latest.demand_accounts_count || 0,
            demand_posts_count: latest.demand_posts_count || 0,
            repeat_poster_rate: latest.repeat_poster_rate || 0,
            verification_rate: latest.verification_rate || 0,
            median_time_to_match_minutes: latest.median_time_to_match_minutes || 0,

            cls_delta_7d: Math.round(clsDelta7 * 100) / 100,
            match_rate_delta_7d: Math.round(matchDelta7 * 100) / 100,
            participation_delta_7d: Math.round(participationDelta7 * 100) / 100,
            demand_posts_delta_7d: Math.round(demandPostsDelta7 * 100) / 100,
            supply_active_delta_7d: Math.round(supplyActiveDelta7 * 100) / 100,
            time_to_match_delta_7d: Math.round(ttmDelta7 * 100) / 100,

            cls_ma_7d: Math.round(clsMA7 * 100) / 100,
            cls_ma_14d: Math.round(clsMA14 * 100) / 100,
            match_rate_ma_7d: Math.round(matchRateMA7 * 100) / 100,
            participation_ma_7d: Math.round(participationMA7 * 100) / 100,
            demand_posts_ma_7d: Math.round(demandPostsMA7 * 100) / 100,
            time_to_match_ma_7d: Math.round(ttmMA7 * 100) / 100,

            phantom_supply_flag: phantomSupply,
            backlog_flag: backlog,
            warning_count_7d: warnStats.warnings,
            critical_count_7d: warnStats.critical,

            vapi_connected_rate_7d: Math.round((vapiStats.connected / vapiTotal) * 100 * 100) / 100,
            vapi_engaged_rate_7d: Math.round((vapiStats.engaged / vapiTotal) * 100 * 100) / 100,
            claim_start_rate_7d: Math.round((vapiStats.claimed / vapiTotal) * 100 * 100) / 100,
            verify_rate_7d: latest.verification_rate || 0,
            activation_rate_7d: latest.activation_rate || 0,

            country_code: countryCode,
            calling_risk_tier: riskByCountry.get(countryCode) || 'medium',
            quiet_hours_block_rate_7d: 0, // Would compute from execution logs
            consent_block_rate_7d: 0,
        }, { onConflict: 'corridor_id,snapshot_date' });

        if (!error) featuresWritten++;
    }

    return {
        corridors_processed: corridorSnapshots.size,
        features_written: featuresWritten,
        quality_failures: qualityFailures,
        duration_ms: Date.now() - startTime,
    };
}
