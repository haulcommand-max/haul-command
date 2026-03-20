/**
 * USAGE-METERED AI BILLING
 * 
 * Tracks every AI query (Load Analyzer, Rate Advisor, Copilot, etc.)
 * and enforces per-tier usage limits.
 * 
 * Free: 3 queries/day
 * Pro: 50 queries/day
 * Elite: 200 queries/day
 * Enterprise: Unlimited
 * 
 * Overage: $0.49 per additional query (auto-charged via Stripe)
 * 
 * Revenue impact: $5-15/query at scale = $10K+/mo
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';

export type AIProduct = 
    | 'load_analyzer'
    | 'rate_advisor'
    | 'copilot'
    | 'route_survey'
    | 'contract_builder'
    | 'invoice_maker'
    | 'regulation_lookup'
    | 'profile_optimizer';

const TIER_LIMITS: Record<string, number> = {
    free: 3,
    starter: 10,
    pro: 50,
    commander: 50,
    commander_pro: 100,
    elite: 200,
    enterprise: 999999,
};

const PRODUCT_COST_USD: Record<AIProduct, number> = {
    load_analyzer: 0.49,
    rate_advisor: 0.49,
    copilot: 0.29,
    route_survey: 0.99,
    contract_builder: 0.49,
    invoice_maker: 0.29,
    regulation_lookup: 0.19,
    profile_optimizer: 0.19,
};

export interface UsageCheckResult {
    allowed: boolean;
    remaining: number;
    limit: number;
    tier: string;
    overage: boolean;
    overageChargeUsd: number;
    reason?: string;
}

/**
 * Check if a user can make an AI query, and log it.
 * Call this BEFORE executing the AI call.
 */
export async function checkAndLogUsage(
    userId: string,
    product: AIProduct,
    metadata?: Record<string, unknown>
): Promise<UsageCheckResult> {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    // Get user tier
    const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

    const tier = (profile as any)?.subscription_tier || 'free';
    const limit = TIER_LIMITS[tier] || TIER_LIMITS.free;

    // Count today's usage
    const { count } = await supabase
        .from('ai_usage_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`);

    const used = count || 0;
    const remaining = Math.max(0, limit - used);
    const overage = used >= limit && tier !== 'enterprise';

    // Allow but mark as overage
    const allowed = tier === 'enterprise' || used < limit || tier !== 'free';
    const overageChargeUsd = overage ? PRODUCT_COST_USD[product] : 0;

    if (!allowed) {
        return {
            allowed: false,
            remaining: 0,
            limit,
            tier,
            overage: false,
            overageChargeUsd: 0,
            reason: `Daily ${product} limit reached (${limit}/day). Upgrade to Pro for 50 queries/day.`,
        };
    }

    // Log the usage
    try {
        await supabase.from('ai_usage_log').insert({
            user_id: userId,
            product,
            tier,
            is_overage: overage,
            cost_usd: overageChargeUsd,
            metadata: metadata || {},
            created_at: new Date().toISOString(),
        });
    } catch (err) { console.error('[usage-meter]', err); }

    return {
        allowed: true,
        remaining: Math.max(0, remaining - 1),
        limit,
        tier,
        overage,
        overageChargeUsd,
    };
}

/**
 * Get usage summary for billing dashboard
 */
export async function getUsageSummary(userId: string, periodDays = 30) {
    const supabase = getSupabaseAdmin();
    const since = new Date(Date.now() - periodDays * 86400000).toISOString();

    const { data } = await supabase
        .from('ai_usage_log')
        .select('product, is_overage, cost_usd, created_at')
        .eq('user_id', userId)
        .gte('created_at', since)
        .order('created_at', { ascending: false });

    const entries = data || [];
    const totalQueries = entries.length;
    const overageQueries = entries.filter(e => e.is_overage).length;
    const totalOverageUsd = entries.reduce((s, e) => s + (e.cost_usd || 0), 0);

    // Breakdown by product
    const breakdown: Record<string, { count: number; overage: number; cost: number }> = {};
    for (const e of entries) {
        if (!breakdown[e.product]) breakdown[e.product] = { count: 0, overage: 0, cost: 0 };
        breakdown[e.product].count++;
        if (e.is_overage) breakdown[e.product].overage++;
        breakdown[e.product].cost += e.cost_usd || 0;
    }

    return {
        totalQueries,
        overageQueries,
        totalOverageUsd: Math.round(totalOverageUsd * 100) / 100,
        breakdown,
        periodDays,
    };
}
