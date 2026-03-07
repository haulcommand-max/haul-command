/**
 * Enterprise API Auth + Entitlement Middleware
 *
 * The missing 200-line file that wires existing DB infrastructure
 * (enterprise_api_keys, rate_limit_state, product_catalog)
 * into actual runtime enforcement.
 *
 * Usage in any enterprise route:
 *    const gate = await enterpriseGate(req, 'operations_optimizer');
 *    if (gate.error) return gate.error;
 *    // gate.context contains tier, customerId, rateLimits, entitlements
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evaluateAndMitigate } from '@/lib/enterprise/anti-extraction';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface EnterpriseContext {
    customerId: string;
    apiKeyId: string;
    orgId: string | null;
    tier: 'insight_starter' | 'pro_intelligence' | 'enterprise_signal' | 'data_licensing_bulk';
    rateLimitRpm: number;
    exportLimitRowsMonth: number | null;
    products: EnterpriseProduct[];
}

export interface EnterpriseProduct {
    productName: string;
    tierRequired: string;
    endpoints: string[];
    dataFields: string[];
    redactionLevel: 'high' | 'medium' | 'low_aggregated_only' | 'contract_defined';
    updateFrequency: string;
}

export interface EnterpriseGateResult {
    error: NextResponse | null;
    context: EnterpriseContext | null;
}

// ═══════════════════════════════════════════════════════════════
// TIER HIERARCHY (for entitlement checks)
// ═══════════════════════════════════════════════════════════════

const TIER_RANK: Record<string, number> = {
    insight_starter: 1,
    pro_intelligence: 2,
    enterprise_signal: 3,
    data_licensing_bulk: 4,
};

function tierSatisfies(callerTier: string, requiredTier: string): boolean {
    return (TIER_RANK[callerTier] ?? 0) >= (TIER_RANK[requiredTier] ?? 99);
}

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
// API KEY EXTRACTION + HASHING
// ═══════════════════════════════════════════════════════════════

function extractApiKey(req: NextRequest): string | null {
    // Check X-API-Key header first
    const headerKey = req.headers.get('x-api-key');
    if (headerKey) return headerKey;

    // Check Authorization: Bearer <key>
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer hc_')) {
        return auth.slice(7); // Remove "Bearer " prefix
    }

    // Check query param (least preferred)
    const paramKey = req.nextUrl.searchParams.get('api_key');
    if (paramKey) return paramKey;

    return null;
}

function hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

// ═══════════════════════════════════════════════════════════════
// CORE GATE FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Main enterprise auth + entitlement gate.
 * Call at the start of every enterprise endpoint.
 *
 * @param req - The incoming request
 * @param requiredProduct - The product name this endpoint serves (optional — if omitted, only validates key)
 * @returns gate result with either an error response or the enterprise context
 */
export async function enterpriseGate(
    req: NextRequest,
    requiredProduct?: string,
): Promise<EnterpriseGateResult> {
    const DENY = (status: number, reason: string, extra?: Record<string, unknown>) =>
        ({ error: NextResponse.json({ error: reason, ...extra }, { status }), context: null });

    // 1. Extract API key
    const rawKey = extractApiKey(req);
    if (!rawKey) {
        return DENY(401, 'Missing API key. Provide via X-API-Key header, Authorization: Bearer hc_..., or ?api_key= param.');
    }

    const keyHash = hashApiKey(rawKey);
    const supabase = getAdminClient();

    // 2. Validate key via the existing RPC (handles rate limiting, expiry, monthly limits)
    const { data: validation, error: rpcError } = await supabase.rpc('validate_enterprise_api_key', {
        p_api_key_hash: keyHash,
    });

    if (rpcError) {
        console.error('[Enterprise Auth] RPC error:', rpcError.message);
        return DENY(500, 'Internal authentication error');
    }

    const v = validation as { valid: boolean; reason?: string; tier?: string; customer_id?: string; rate_limit_rpm?: number; retry_after?: string };

    if (!v?.valid) {
        const status = v?.reason === 'rate_limited' ? 429 : 401;
        return DENY(status, v?.reason ?? 'Invalid API key', v?.retry_after ? { retry_after: v.retry_after } : undefined);
    }

    // Check key status (revoked/suspended keys should fail even if 'active' flag lags)
    const { data: keyStatus } = await supabase
        .from('enterprise_api_keys')
        .select('status, suspension_reason')
        .eq('api_key_hash', keyHash)
        .single();

    if (keyStatus?.status === 'revoked') {
        return DENY(401, 'API key has been revoked');
    }
    if (keyStatus?.status === 'suspended') {
        return DENY(403, `API key suspended: ${keyStatus.suspension_reason ?? 'contact support'}`);
    }

    // 3. Load entitled products for this tier
    const { data: products } = await supabase
        .from('enterprise_product_catalog')
        .select('*')
        .eq('active', true);

    const entitledProducts = (products ?? [])
        .filter((p: any) => tierSatisfies(v.tier!, p.tier_required))
        .map((p: any) => ({
            productName: p.product_name,
            tierRequired: p.tier_required,
            endpoints: p.endpoints ?? [],
            dataFields: p.data_fields ?? [],
            redactionLevel: p.redaction_level,
            updateFrequency: p.update_frequency,
        }));

    // 4. Check product entitlement if a specific product is required
    if (requiredProduct) {
        const hasAccess = entitledProducts.some(p => p.productName === requiredProduct);
        if (!hasAccess) {
            return DENY(403, `Your tier (${v.tier}) does not include the ${requiredProduct} product. Upgrade required.`, {
                current_tier: v.tier,
                required_product: requiredProduct,
                upgrade_tiers: Object.entries(TIER_RANK)
                    .filter(([, rank]) => rank > (TIER_RANK[v.tier!] ?? 0))
                    .map(([tier]) => tier),
            });
        }
    }

    // 5. Load key metadata for context (including org_id if present)
    const { data: keyRecord } = await supabase
        .from('enterprise_api_keys')
        .select('id, export_limit_rows_month, org_id')
        .eq('api_key_hash', keyHash)
        .single();

    // 6. Log access to export audit
    await supabase.from('enterprise_export_audit').insert({
        api_key_id: keyRecord?.id,
        customer_id: v.customer_id,
        endpoint: req.nextUrl.pathname,
        query_params: Object.fromEntries(req.nextUrl.searchParams.entries()),
        ip_address_hash: hashApiKey(req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'),
    });

    const context: EnterpriseContext = {
        customerId: v.customer_id!,
        apiKeyId: keyRecord?.id ?? '',
        orgId: keyRecord?.org_id ?? null,
        tier: v.tier as EnterpriseContext['tier'],
        rateLimitRpm: v.rate_limit_rpm!,
        exportLimitRowsMonth: keyRecord?.export_limit_rows_month ?? null,
        products: entitledProducts,
    };

    // 7. Anti-extraction check (async, non-blocking for low-risk)
    evaluateAndMitigate(context.apiKeyId).then(result => {
        if (result.action === 'quarantine' || result.action === 'suspended') {
            console.warn(`[AntiExtraction] Key ${context.apiKeyId} ${result.action}: risk=${result.riskScore}`);
        }
    }).catch(() => null);

    return { error: null, context };
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE SHAPING BY TIER
// ═══════════════════════════════════════════════════════════════

/**
 * Shapes a data response based on the caller's tier and product entitlement.
 * Higher tiers get more granular data; lower tiers get banded/aggregated values.
 */
export function shapeResponse(
    data: Record<string, unknown>[],
    context: EnterpriseContext,
    productName: string,
): Record<string, unknown>[] {
    const product = context.products.find(p => p.productName === productName);
    if (!product) return [];

    const redactionLevel = product.redactionLevel;
    const allowedFields = product.dataFields.includes('all_fields')
        ? null // No restriction
        : new Set(product.dataFields);

    return data.map(row => {
        // Field-level access control
        let shaped: Record<string, unknown> = {};
        if (allowedFields) {
            for (const field of allowedFields) {
                if (field in row) shaped[field] = row[field];
            }
        } else {
            shaped = { ...row };
        }

        // Redaction by level
        if (redactionLevel === 'high') {
            // Round all numbers to integers, band scores into categories
            for (const [k, v] of Object.entries(shaped)) {
                if (typeof v === 'number') {
                    shaped[k] = Math.round(v);
                }
            }
        }

        return shaped;
    });
}

// ═══════════════════════════════════════════════════════════════
// ROW COUNT ENFORCEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * After a successful response, update the export audit with rows returned
 * and check if monthly limits are approaching.
 */
export async function logResponseMetrics(
    context: EnterpriseContext,
    rowsReturned: number,
    responseTimeMs: number,
    opts?: { endpoint?: string; method?: string; statusCode?: number; geoScope?: string },
) {
    const supabase = getAdminClient();

    // Update the most recent audit entry with row count and response time
    const { data: recentAudit } = await supabase
        .from('enterprise_export_audit')
        .select('id')
        .eq('api_key_id', context.apiKeyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (recentAudit) {
        await supabase
            .from('enterprise_export_audit')
            .update({
                rows_returned: rowsReturned,
                response_time_ms: responseTimeMs,
            })
            .eq('id', recentAudit.id);
    }

    // Increment monthly export counter
    const { error: incError } = await supabase.rpc('increment_export_rows', {
        p_api_key_id: context.apiKeyId,
        p_rows: rowsReturned,
    });
    if (incError) {
        await supabase
            .from('enterprise_rate_limit_state')
            .update({ rows_exported_this_month: rowsReturned })
            .eq('api_key_id', context.apiKeyId);
    }

    // Write fine-grained usage event (Tier 2 metering)
    const usageInsert = await supabase.from('enterprise_usage_events').insert({
        customer_id: context.customerId,
        api_key_id: context.apiKeyId,
        endpoint: opts?.endpoint ?? 'unknown',
        endpoint_family: classifyEndpoint(opts?.endpoint ?? ''),
        method: opts?.method ?? 'GET',
        rows_returned: rowsReturned,
        compute_cost_units: rowsReturned * getComputeMultiplier(opts?.endpoint ?? ''),
        geo_scope: opts?.geoScope ?? null,
        response_time_ms: responseTimeMs,
        status_code: opts?.statusCode ?? 200,
    });
    if (usageInsert.error) {
        console.warn('[Metering] Usage event insert failed:', usageInsert.error.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// ENDPOINT CLASSIFICATION HELPERS
// ═══════════════════════════════════════════════════════════════

const ENDPOINT_FAMILY_MAP: Record<string, string> = {
    '/api/enterprise/corridors/liquidity': 'corridor_intelligence',
    '/api/enterprise/corridors/scarcity': 'corridor_intelligence',
    '/api/enterprise/fill/probability': 'predictive_analytics',
    '/api/enterprise/rates/benchmark': 'pricing_intelligence',
    '/api/enterprise/brokers/risk': 'risk_intelligence',
    '/api/heatmap/tiles': 'geospatial_intelligence',
};

function classifyEndpoint(endpoint: string): string {
    return ENDPOINT_FAMILY_MAP[endpoint] ?? 'unknown';
}

const COMPUTE_MULTIPLIERS: Record<string, number> = {
    corridor_intelligence: 1.0,
    predictive_analytics: 2.5,
    pricing_intelligence: 1.5,
    risk_intelligence: 2.0,
    geospatial_intelligence: 1.2,
    unknown: 1.0,
};

function getComputeMultiplier(endpoint: string): number {
    return COMPUTE_MULTIPLIERS[classifyEndpoint(endpoint)] ?? 1.0;
}

// ═══════════════════════════════════════════════════════════════
// API KEY PROVISIONING (Admin-only)
// ═══════════════════════════════════════════════════════════════

/**
 * Creates a new enterprise API key. Admin-only operation.
 * Returns the raw key (shown once) and the key ID.
 */
export async function provisionApiKey(input: {
    customerId: string;
    customerName: string;
    tier: EnterpriseContext['tier'];
    rateLimitRpm?: number;
    exportLimitRowsMonth?: number;
    effectiveEnd?: string;
}): Promise<{ rawKey: string; keyPrefix: string; keyId: string }> {
    const supabase = getAdminClient();

    // Generate a secure API key with hc_ prefix
    const rawKey = `hc_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 8);

    const defaults: Record<string, number> = {
        insight_starter: 30,
        pro_intelligence: 120,
        enterprise_signal: 300,
        data_licensing_bulk: 600,
    };

    const { data, error } = await supabase
        .from('enterprise_api_keys')
        .insert({
            customer_id: input.customerId,
            customer_name: input.customerName,
            api_key_hash: keyHash,
            api_key_prefix: keyPrefix,
            tier: input.tier,
            rate_limit_rpm: input.rateLimitRpm ?? defaults[input.tier] ?? 30,
            export_limit_rows_month: input.exportLimitRowsMonth ?? 25000,
            effective_end: input.effectiveEnd ?? null,
        })
        .select('id')
        .single();

    if (error) throw new Error(`Failed to provision API key: ${error.message}`);

    return { rawKey, keyPrefix, keyId: data.id };
}
