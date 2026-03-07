/**
 * Enterprise Usage Metering Engine
 *
 * Handles fine-grained usage event logging, quota enforcement,
 * anomaly detection, and honeytoken injection.
 *
 * This module extends the auth-middleware's logResponseMetrics
 * with full Tier 2 capabilities.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import type { EnterpriseContext } from './auth-middleware';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const ENDPOINT_FAMILIES: Record<string, string> = {
    '/api/enterprise/corridors/liquidity': 'corridor_intelligence',
    '/api/enterprise/corridors/scarcity': 'corridor_intelligence',
    '/api/enterprise/fill/probability': 'predictive_analytics',
    '/api/enterprise/rates/benchmark': 'pricing_intelligence',
    '/api/enterprise/brokers/risk': 'risk_intelligence',
    '/api/heatmap/tiles': 'geospatial_intelligence',
};

const COMPUTE_COST_MULTIPLIERS: Record<string, number> = {
    corridor_intelligence: 1.0,
    predictive_analytics: 2.5,
    pricing_intelligence: 1.5,
    risk_intelligence: 2.0,
    geospatial_intelligence: 1.2,
};

const ANOMALY_THRESHOLDS = {
    hourly_spike_multiplier: 5,        // 5× normal hourly rate
    sequential_scan_entropy: 0.3,      // Low entropy = sequential crawling
    geo_expansion_new_regions: 5,      // 5+ new regions in a single day
    burst_window_seconds: 10,          // Burst detection window
    burst_max_requests: 20,            // Max requests per burst window
};

// ═══════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

// ═══════════════════════════════════════════════════════════════
// CORE METERING: Record a usage event
// ═══════════════════════════════════════════════════════════════

export interface UsageEvent {
    endpoint: string;
    method: string;
    rowsReturned: number;
    responseTimeMs: number;
    statusCode: number;
    geoScope?: string;
    confidenceBand?: string;
}

/**
 * Records a fine-grained usage event and runs quota + anomaly checks.
 * Call this AFTER every enterprise API response.
 */
export async function recordUsageEvent(
    ctx: EnterpriseContext,
    event: UsageEvent,
): Promise<{ quotaWarning?: string; blocked?: boolean }> {
    const supabase = getAdminClient();

    const family = ENDPOINT_FAMILIES[event.endpoint] ?? 'unknown';
    const computeUnits = (event.rowsReturned || 1) * (COMPUTE_COST_MULTIPLIERS[family] ?? 1.0);

    // 1. Insert usage event
    await supabase.from('enterprise_usage_events').insert({
        org_id: ctx.orgId ?? null,
        customer_id: ctx.customerId,
        api_key_id: ctx.apiKeyId,
        endpoint: event.endpoint,
        endpoint_family: family,
        method: event.method,
        rows_returned: event.rowsReturned,
        compute_cost_units: computeUnits,
        geo_scope: event.geoScope ?? null,
        confidence_band: event.confidenceBand ?? null,
        response_time_ms: event.responseTimeMs,
        status_code: event.statusCode,
    });

    // 2. Check quota
    const quotaResult = await checkQuota(ctx);

    // 3. Run lightweight anomaly detection (non-blocking)
    detectAnomalies(ctx, event).catch(() => null);

    return quotaResult;
}

// ═══════════════════════════════════════════════════════════════
// QUOTA ENFORCEMENT
// ═══════════════════════════════════════════════════════════════

interface QuotaCheckResult {
    quotaWarning?: string;
    blocked?: boolean;
}

async function checkQuota(ctx: EnterpriseContext): Promise<QuotaCheckResult> {
    const supabase = getAdminClient();

    const { data: quota } = await supabase.rpc('check_enterprise_quota', {
        p_customer_id: ctx.customerId,
    });

    if (!quota) return {};

    const q = quota as { status: string; pct: number; remaining: number; quota: number };

    if (q.status === 'exceeded') {
        return {
            quotaWarning: `Monthly quota exceeded (${q.pct}% used). Overage billing applies.`,
            blocked: false, // We allow overage, just bill for it
        };
    }

    if (q.status === 'critical') {
        return {
            quotaWarning: `Approaching quota limit: ${q.pct}% used, ${q.remaining} rows remaining.`,
        };
    }

    if (q.status === 'warning') {
        return {
            quotaWarning: `Usage at ${q.pct}%. Consider upgrading your plan.`,
        };
    }

    return {};
}

/**
 * Hard quota gate — call BEFORE processing a request if strict enforcement is needed.
 * Returns true if the customer should be blocked.
 */
export async function isQuotaExceeded(customerId: string): Promise<{
    exceeded: boolean;
    status: string;
    pct: number;
}> {
    const supabase = getAdminClient();

    const { data: quota } = await supabase.rpc('check_enterprise_quota', {
        p_customer_id: customerId,
    });

    if (!quota) return { exceeded: false, status: 'unknown', pct: 0 };

    const q = quota as { status: string; pct: number };

    // Only hard-block if plan doesn't support overage
    // (For now, all plans allow overage with billing)
    return {
        exceeded: q.status === 'exceeded' && q.pct > 150, // Hard block at 150%
        status: q.status,
        pct: q.pct,
    };
}

// ═══════════════════════════════════════════════════════════════
// ANOMALY DETECTION (lightweight, async)
// ═══════════════════════════════════════════════════════════════

async function detectAnomalies(
    ctx: EnterpriseContext,
    event: UsageEvent,
): Promise<void> {
    const supabase = getAdminClient();

    // Burst detection: check recent request count in short window
    const { count: recentCount } = await supabase
        .from('enterprise_usage_events')
        .select('id', { count: 'exact', head: true })
        .eq('api_key_id', ctx.apiKeyId)
        .gte('created_at', new Date(Date.now() - ANOMALY_THRESHOLDS.burst_window_seconds * 1000).toISOString());

    if ((recentCount ?? 0) > ANOMALY_THRESHOLDS.burst_max_requests) {
        await logAnomaly(supabase, ctx, 'burst_detection', 'warning', {
            requests_in_window: recentCount,
            window_seconds: ANOMALY_THRESHOLDS.burst_window_seconds,
            threshold: ANOMALY_THRESHOLDS.burst_max_requests,
            endpoint: event.endpoint,
        });
    }

    // Abnormal hourly spike: compare to 7-day average
    const { count: hourCount } = await supabase
        .from('enterprise_usage_events')
        .select('id', { count: 'exact', head: true })
        .eq('api_key_id', ctx.apiKeyId)
        .gte('created_at', new Date(Date.now() - 3600_000).toISOString());

    if ((hourCount ?? 0) > 100) {
        // Only check spike if there's meaningful volume
        const { data: avgData } = await supabase
            .from('enterprise_usage_rollups')
            .select('total_requests')
            .eq('customer_id', ctx.customerId)
            .gte('rollup_date', new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10))
            .limit(7);

        const avg7d = avgData?.length
            ? avgData.reduce((s, r) => s + ((r as any).total_requests ?? 0), 0) / avgData.length / 24
            : 0;

        if (avg7d > 0 && (hourCount ?? 0) > avg7d * ANOMALY_THRESHOLDS.hourly_spike_multiplier) {
            await logAnomaly(supabase, ctx, 'abnormal_hourly_spike', 'warning', {
                current_hour: hourCount,
                avg_hourly_7d: Math.round(avg7d),
                multiplier: Math.round((hourCount ?? 0) / avg7d),
            });
        }
    }
}

async function logAnomaly(
    supabase: ReturnType<typeof getAdminClient>,
    ctx: EnterpriseContext,
    type: string,
    severity: string,
    details: Record<string, unknown>,
): Promise<void> {
    await supabase.from('enterprise_anomaly_log').insert({
        api_key_id: ctx.apiKeyId,
        customer_id: ctx.customerId,
        anomaly_type: type,
        severity,
        details,
    });

    // Auto-suspend on critical anomalies
    if (severity === 'auto_suspend') {
        await supabase
            .from('enterprise_api_keys')
            .update({
                status: 'suspended',
                suspension_reason: `Auto-suspended: ${type}`,
                suspended_at: new Date().toISOString(),
            })
            .eq('id', ctx.apiKeyId);
    }
}

// ═══════════════════════════════════════════════════════════════
// HONEYTOKEN INJECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generates a unique honeytoken value that can be embedded in API responses.
 * If this value appears on the public internet, we know the API key leaked data.
 */
export async function generateHoneytoken(
    ctx: EnterpriseContext,
    tokenType: string = 'corridor_id',
): Promise<string> {
    const supabase = getAdminClient();

    // Generate a plausible-looking but unique token
    const token = `hctk_${crypto.randomBytes(8).toString('hex')}`;

    await supabase.from('enterprise_honeytokens').insert({
        api_key_id: ctx.apiKeyId,
        customer_id: ctx.customerId,
        token_value: token,
        token_type: tokenType,
    });

    return token;
}

/**
 * Injects honeytoken rows into a data response.
 * ~1 in every 200 responses gets a honeytoken row mixed in.
 */
export async function maybeInjectHoneytoken(
    ctx: EnterpriseContext,
    data: Record<string, unknown>[],
    idField: string = 'corridor_id',
): Promise<Record<string, unknown>[]> {
    // Only inject 0.5% of the time
    if (Math.random() > 0.005) return data;

    const token = await generateHoneytoken(ctx, idField);

    // Create a plausible-looking fake row
    const fakeRow: Record<string, unknown> = {};
    if (data.length > 0) {
        const template = data[0];
        for (const [key, val] of Object.entries(template)) {
            if (key === idField) {
                fakeRow[key] = token;
            } else if (typeof val === 'number') {
                fakeRow[key] = Math.round(val * (0.8 + Math.random() * 0.4));
            } else if (typeof val === 'string') {
                fakeRow[key] = val;
            } else {
                fakeRow[key] = val;
            }
        }
    }

    // Insert at a random position
    const pos = Math.floor(Math.random() * (data.length + 1));
    const result = [...data];
    result.splice(pos, 0, fakeRow);
    return result;
}

// ═══════════════════════════════════════════════════════════════
// USAGE DASHBOARD DATA
// ═══════════════════════════════════════════════════════════════

/**
 * Returns usage data for a customer's dashboard.
 */
export async function getUsageDashboard(customerId: string): Promise<{
    quota: unknown;
    daily: unknown[];
    keys: unknown[];
    anomalies: unknown[];
}> {
    const supabase = getAdminClient();

    const [quotaRes, dailyRes, keysRes, anomalyRes] = await Promise.all([
        supabase.rpc('check_enterprise_quota', { p_customer_id: customerId }),
        supabase
            .from('enterprise_usage_rollups')
            .select('*')
            .eq('customer_id', customerId)
            .gte('rollup_date', new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10))
            .order('rollup_date', { ascending: true }),
        supabase
            .from('enterprise_api_keys')
            .select('id, api_key_prefix, key_label, tier, status, last_used_at, request_count_total')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false }),
        supabase
            .from('enterprise_anomaly_log')
            .select('*')
            .eq('customer_id', customerId)
            .eq('resolved', false)
            .order('created_at', { ascending: false })
            .limit(20),
    ]);

    return {
        quota: quotaRes.data ?? null,
        daily: dailyRes.data ?? [],
        keys: keysRes.data ?? [],
        anomalies: anomalyRes.data ?? [],
    };
}
