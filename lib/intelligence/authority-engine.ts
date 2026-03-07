// lib/intelligence/authority-engine.ts
//
// Haul Command — Authority Engine
// Generates weekly market pulse, response speed badges,
// scarcity alerts, and verified job ledger signals.
// Principle: opt_in_only_compliant_growth

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export interface MarketPulse {
    corridor_id?: string;
    region_code: string;
    pulse_week: string;
    active_escorts_count: number;
    new_escorts_count: number;
    avg_response_time_sec: number | null;
    loads_posted_count: number;
    loads_filled_count: number;
    fill_rate: number;
    avg_time_to_fill_hours: number | null;
    scarcity_score: number;
    price_trend: 'rising' | 'stable' | 'falling';
    corridor_heat: number;
    pulse_summary: string;
    key_insights: { insight: string; severity: string }[];
}

export interface ResponseBadge {
    user_id: string;
    badge_tier: 'none' | 'fast' | 'very_fast' | 'lightning';
    avg_response_sec: number;
    p50_response_sec: number;
    p90_response_sec: number;
    sample_size: number;
}

export interface ScarcityAlert {
    corridor_id?: string;
    region_code?: string;
    alert_type: 'low_supply' | 'surge_demand' | 'gap_detected';
    severity: 'low' | 'medium' | 'high' | 'critical';
    current_supply: number;
    current_demand: number;
    gap_score: number;
}

// ============================================================
// 1. WEEKLY MARKET PULSE GENERATOR
// ============================================================

function getMondayOfWeek(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
}

function determinePriceTrend(
    currentAvgRate: number | null,
    priorAvgRate: number | null
): 'rising' | 'stable' | 'falling' {
    if (!currentAvgRate || !priorAvgRate) return 'stable';
    const delta = (currentAvgRate - priorAvgRate) / priorAvgRate;
    if (delta > 0.05) return 'rising';
    if (delta < -0.05) return 'falling';
    return 'stable';
}

function generatePulseSummary(pulse: MarketPulse): string {
    const parts: string[] = [];

    // Supply summary
    if (pulse.active_escorts_count === 0) {
        parts.push(`${pulse.region_code} has zero active escorts — critical supply gap.`);
    } else {
        parts.push(`${pulse.region_code}: ${pulse.active_escorts_count} active escorts`);
        if (pulse.new_escorts_count > 0) {
            parts.push(`(+${pulse.new_escorts_count} new this week)`);
        }
    }

    // Demand summary
    if (pulse.loads_posted_count > 0) {
        parts.push(`${pulse.loads_posted_count} loads posted, ${pulse.loads_filled_count} filled (${(pulse.fill_rate * 100).toFixed(0)}% fill rate).`);
    } else {
        parts.push(`No loads posted this period.`);
    }

    // Scarcity
    if (pulse.scarcity_score > 0.70) {
        parts.push(`⚠️ High scarcity — operators needed.`);
    }

    // Price
    if (pulse.price_trend === 'rising') parts.push(`Rates trending up.`);
    else if (pulse.price_trend === 'falling') parts.push(`Rates softening.`);

    return parts.join(' ');
}

function generateKeyInsights(pulse: MarketPulse): { insight: string; severity: string }[] {
    const insights: { insight: string; severity: string }[] = [];

    if (pulse.scarcity_score > 0.80) {
        insights.push({ insight: 'Critical supply shortage — every new operator has immediate demand', severity: 'critical' });
    } else if (pulse.scarcity_score > 0.60) {
        insights.push({ insight: 'Supply tightening — good time for operators to enter this market', severity: 'high' });
    }

    if (pulse.fill_rate < 0.30 && pulse.loads_posted_count > 5) {
        insights.push({ insight: 'Low fill rate may indicate pricing or coverage issues', severity: 'medium' });
    }

    if (pulse.fill_rate > 0.85) {
        insights.push({ insight: 'Excellent fill rate — healthy marketplace dynamics', severity: 'low' });
    }

    if (pulse.new_escorts_count > 3) {
        insights.push({ insight: 'Strong new operator acquisition this week', severity: 'low' });
    }

    if (pulse.avg_response_time_sec && pulse.avg_response_time_sec > 3600) {
        insights.push({ insight: 'Slow average response time — may lose demand to competitors', severity: 'high' });
    }

    return insights;
}

export async function generateWeeklyPulse(targetDate?: Date): Promise<{
    generated: number;
    regions: string[];
    duration_ms: number;
}> {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();
    const pulseWeek = getMondayOfWeek(targetDate || new Date());
    const priorWeek = getMondayOfWeek(new Date(new Date(pulseWeek).getTime() - 7 * 86400000));

    // Get all active regions from corridor_liquidity_snapshots
    const { data: snapshots } = await supabase
        .from('corridor_liquidity_snapshots')
        .select('corridor_id, origin_region, destination_region, active_supply, demand_posts, match_count, cls_score')
        .gte('snapshot_date', priorWeek)
        .order('snapshot_date', { ascending: false });

    // Aggregate by region
    const regionMap = new Map<string, {
        corridor_ids: Set<string>;
        supply: number[];
        demand: number[];
        matches: number[];
        cls_scores: number[];
    }>();

    for (const snap of snapshots || []) {
        const regions = [snap.origin_region, snap.destination_region].filter(Boolean);
        for (const region of regions) {
            if (!regionMap.has(region)) {
                regionMap.set(region, {
                    corridor_ids: new Set(),
                    supply: [],
                    demand: [],
                    matches: [],
                    cls_scores: [],
                });
            }
            const r = regionMap.get(region)!;
            if (snap.corridor_id) r.corridor_ids.add(snap.corridor_id);
            r.supply.push(snap.active_supply || 0);
            r.demand.push(snap.demand_posts || 0);
            r.matches.push(snap.match_count || 0);
            r.cls_scores.push(snap.cls_score || 0);
        }
    }

    // Get response time data
    const { data: responseData } = await supabase
        .from('quote_requests')
        .select('provider_user_id, response_time_seconds')
        .gte('created_at', priorWeek)
        .not('response_time_seconds', 'is', null);

    const avgResponseSec = responseData && responseData.length > 0
        ? responseData.reduce((s, r) => s + (r.response_time_seconds || 0), 0) / responseData.length
        : null;

    const generated: string[] = [];

    for (const [region, data] of regionMap) {
        const avgSupply = data.supply.length > 0
            ? data.supply.reduce((s, v) => s + v, 0) / data.supply.length
            : 0;
        const totalDemand = data.demand.reduce((s, v) => s + v, 0);
        const totalMatches = data.matches.reduce((s, v) => s + v, 0);
        const fillRate = totalDemand > 0 ? totalMatches / totalDemand : 0;

        // Scarcity score: higher when demand >> supply
        const scarcityScore = avgSupply > 0
            ? Math.min((totalDemand / (avgSupply * 7)) * 0.5, 1.0)
            : totalDemand > 0 ? 1.0 : 0.0;

        // Corridor heat: avg CLS
        const corridorHeat = data.cls_scores.length > 0
            ? data.cls_scores.reduce((s, v) => s + v, 0) / data.cls_scores.length / 100
            : 0;

        const pulse: MarketPulse = {
            region_code: region,
            pulse_week: pulseWeek,
            active_escorts_count: Math.round(avgSupply),
            new_escorts_count: 0,  // Would need profile creation dates to compute
            avg_response_time_sec: avgResponseSec ? Math.round(avgResponseSec) : null,
            loads_posted_count: totalDemand,
            loads_filled_count: totalMatches,
            fill_rate: Math.round(fillRate * 10000) / 10000,
            avg_time_to_fill_hours: null,  // Would need match timestamps
            scarcity_score: Math.round(scarcityScore * 10000) / 10000,
            price_trend: determinePriceTrend(null, null),  // Future: pull from rate data
            corridor_heat: Math.round(corridorHeat * 10000) / 10000,
            pulse_summary: '',
            key_insights: [],
        };

        pulse.pulse_summary = generatePulseSummary(pulse);
        pulse.key_insights = generateKeyInsights(pulse);

        // Upsert pulse
        await supabase
            .from('authority_market_pulses')
            .upsert({
                region_code: pulse.region_code,
                pulse_week: pulse.pulse_week,
                active_escorts_count: pulse.active_escorts_count,
                new_escorts_count: pulse.new_escorts_count,
                avg_response_time_sec: pulse.avg_response_time_sec,
                loads_posted_count: pulse.loads_posted_count,
                loads_filled_count: pulse.loads_filled_count,
                fill_rate: pulse.fill_rate,
                avg_time_to_fill_hours: pulse.avg_time_to_fill_hours,
                scarcity_score: pulse.scarcity_score,
                price_trend: pulse.price_trend,
                corridor_heat: pulse.corridor_heat,
                pulse_summary: pulse.pulse_summary,
                key_insights: pulse.key_insights,
                published: true,
            }, { onConflict: 'region_code,pulse_week' });

        generated.push(region);
    }

    return {
        generated: generated.length,
        regions: generated,
        duration_ms: Date.now() - startTime,
    };
}

// ============================================================
// 2. RESPONSE SPEED BADGES
// ============================================================

const BADGE_THRESHOLDS = {
    lightning: { avg: 300, p50: 180, p90: 600, minSamples: 10 },     // < 5 min avg
    very_fast: { avg: 900, p50: 600, p90: 1800, minSamples: 7 },     // < 15 min avg
    fast: { avg: 1800, p50: 1200, p90: 3600, minSamples: 5 },        // < 30 min avg
};

function computePercentile(sorted: number[], percentile: number): number {
    const idx = Math.ceil(percentile / 100 * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}

export async function computeResponseBadges(): Promise<{
    updated: number;
    lightning: number;
    very_fast: number;
    fast: number;
    none: number;
    duration_ms: number;
}> {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();

    // Last 90 days of responses
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();

    const { data: quotes } = await supabase
        .from('quote_requests')
        .select('provider_user_id, response_time_seconds')
        .gte('created_at', cutoff)
        .not('response_time_seconds', 'is', null);

    // Group by provider
    const providerMap = new Map<string, number[]>();
    for (const q of quotes || []) {
        if (!providerMap.has(q.provider_user_id)) {
            providerMap.set(q.provider_user_id, []);
        }
        providerMap.get(q.provider_user_id)!.push(q.response_time_seconds);
    }

    const counts = { lightning: 0, very_fast: 0, fast: 0, none: 0 };

    for (const [userId, times] of providerMap) {
        const sorted = times.sort((a, b) => a - b);
        const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length;
        const p50 = computePercentile(sorted, 50);
        const p90 = computePercentile(sorted, 90);

        let tier: 'lightning' | 'very_fast' | 'fast' | 'none' = 'none';

        if (sorted.length >= BADGE_THRESHOLDS.lightning.minSamples &&
            avg <= BADGE_THRESHOLDS.lightning.avg) {
            tier = 'lightning';
        } else if (sorted.length >= BADGE_THRESHOLDS.very_fast.minSamples &&
            avg <= BADGE_THRESHOLDS.very_fast.avg) {
            tier = 'very_fast';
        } else if (sorted.length >= BADGE_THRESHOLDS.fast.minSamples &&
            avg <= BADGE_THRESHOLDS.fast.avg) {
            tier = 'fast';
        }

        counts[tier]++;

        await supabase
            .from('response_speed_badges')
            .upsert({
                user_id: userId,
                badge_tier: tier,
                avg_response_sec: Math.round(avg),
                p50_response_sec: p50,
                p90_response_sec: p90,
                sample_size: sorted.length,
                qualifying_period: '90d',
                computed_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
    }

    return {
        updated: providerMap.size,
        ...counts,
        duration_ms: Date.now() - startTime,
    };
}

// ============================================================
// 3. SCARCITY ALERT GENERATOR
// ============================================================

export async function detectScarcityAlerts(): Promise<{
    new_alerts: number;
    resolved: number;
    active_total: number;
    duration_ms: number;
}> {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();

    // Get recent corridor snapshots (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const { data: snapshots } = await supabase
        .from('corridor_liquidity_snapshots')
        .select('corridor_id, origin_region, active_supply, demand_posts, match_count, cls_score')
        .gte('snapshot_date', weekAgo)
        .order('snapshot_date', { ascending: false });

    // De-dupe to most recent per corridor
    const corridorLatest = new Map<string, any>();
    for (const snap of snapshots || []) {
        if (!corridorLatest.has(snap.corridor_id)) {
            corridorLatest.set(snap.corridor_id, snap);
        }
    }

    let newAlerts = 0;
    let resolved = 0;

    for (const [corridorId, snap] of corridorLatest) {
        const supply = snap.active_supply || 0;
        const demand = snap.demand_posts || 0;
        const gapScore = supply > 0 ? Math.min(demand / supply, 1.0) : demand > 0 ? 1.0 : 0;

        let alertType: ScarcityAlert['alert_type'] | null = null;
        let severity: ScarcityAlert['severity'] = 'low';

        // Low supply detection
        if (supply <= 1 && demand > 2) {
            alertType = 'low_supply';
            severity = supply === 0 ? 'critical' : 'high';
        }

        // Surge demand detection
        if (demand > 10 && supply < demand * 0.3) {
            alertType = 'surge_demand';
            severity = demand > 20 ? 'critical' : 'high';
        }

        // Gap detection (moderate imbalance)
        if (!alertType && gapScore > 0.60 && demand > 3) {
            alertType = 'gap_detected';
            severity = gapScore > 0.80 ? 'high' : 'medium';
        }

        if (alertType) {
            // Check if similar active alert already exists
            const { data: existing } = await supabase
                .from('scarcity_alerts')
                .select('id')
                .eq('corridor_id', corridorId)
                .eq('alert_type', alertType)
                .eq('active', true)
                .limit(1);

            if (!existing || existing.length === 0) {
                await supabase.from('scarcity_alerts').insert({
                    corridor_id: corridorId,
                    region_code: snap.origin_region,
                    alert_type: alertType,
                    severity,
                    current_supply: supply,
                    current_demand: demand,
                    gap_score: Math.round(gapScore * 10000) / 10000,
                    active: true,
                    notified: false,
                    notified_count: 0,
                });
                newAlerts++;
            }
        } else {
            // Resolve any active alerts for well-supplied corridors
            const { data: activeAlerts } = await supabase
                .from('scarcity_alerts')
                .select('id')
                .eq('corridor_id', corridorId)
                .eq('active', true);

            for (const alert of activeAlerts || []) {
                await supabase.from('scarcity_alerts').update({
                    active: false,
                    resolved_at: new Date().toISOString(),
                }).eq('id', alert.id);
                resolved++;
            }
        }
    }

    // Count total active
    const { count } = await supabase
        .from('scarcity_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('active', true);

    return {
        new_alerts: newAlerts,
        resolved,
        active_total: count || 0,
        duration_ms: Date.now() - startTime,
    };
}

// ============================================================
// 4. VERIFIED JOB LEDGER SIGNAL
// ============================================================

export async function recordVerifiedJobCompletion(
    operatorUserId: string,
    brokerUserId: string,
    corridorId: string,
    jobMetadata: {
        load_type?: string;
        value?: number;
        escort_count?: number;
        started_at: string;
        completed_at: string;
    }
): Promise<{ success: boolean }> {
    const supabase = getSupabaseAdmin();

    // Record reputation event for operator
    await supabase.from('reputation_events').insert({
        user_id: operatorUserId,
        event_type: 'sla_fast_response',
        delta: 5,
        metadata: {
            source: 'verified_job_ledger',
            corridor_id: corridorId,
            broker_id: brokerUserId,
            ...jobMetadata,
        },
    });

    // Update trust score
    const { data: profile } = await supabase
        .from('profiles')
        .select('trust_score')
        .eq('user_id', operatorUserId)
        .single();

    if (profile) {
        const newScore = Math.min((profile.trust_score || 0) + 5, 100);
        await supabase.from('profiles').update({
            trust_score: newScore,
        }).eq('user_id', operatorUserId);
    }

    // Record monetization event if applicable
    if (jobMetadata.value && jobMetadata.value > 0) {
        await supabase.from('monetization_events').insert({
            user_id: operatorUserId,
            event_type: 'job_completed',
            product_key: 'verified_job_ledger',
            phase: 1,
            amount_cents: 0,  // Platform fee tracked separately
            metadata: {
                corridor_id: corridorId,
                job_value: jobMetadata.value,
                load_type: jobMetadata.load_type,
            },
        });
    }

    return { success: true };
}

// ============================================================
// 5. ORCHESTRATOR (run all authority jobs)
// ============================================================

export async function runAuthorityEngineJobs(): Promise<{
    pulse: Awaited<ReturnType<typeof generateWeeklyPulse>>;
    badges: Awaited<ReturnType<typeof computeResponseBadges>>;
    scarcity: Awaited<ReturnType<typeof detectScarcityAlerts>>;
    total_duration_ms: number;
}> {
    const startTime = Date.now();

    const [pulse, badges, scarcity] = await Promise.all([
        generateWeeklyPulse(),
        computeResponseBadges(),
        detectScarcityAlerts(),
    ]);

    return {
        pulse,
        badges,
        scarcity,
        total_duration_ms: Date.now() - startTime,
    };
}
