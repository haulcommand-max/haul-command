/**
 * DATA INTELLIGENCE API — /api/intelligence
 * 
 * Monetizable API endpoint: $49-499/mo per enterprise key
 * Exposes corridor intelligence, supply pressure, operator density
 * and compliance data that no one else has.
 * 
 * Tiers:
 *   - explore: rate range + corridor status (free, 10 req/day)
 *   - pro: full breakdown (Pro subscribers, 100 req/day)  
 *   - enterprise: bulk + historical + webhooks ($499/mo, 10K req/day)
 * 
 * Auth: API key via x-hc-api-key header or ?key= query param
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const TIER_LIMITS: Record<string, number> = {
    explore: 10,
    pro: 100,
    enterprise: 10000,
};

interface IntelligenceQuery {
    type: 'corridor' | 'country' | 'supply' | 'compliance' | 'operator_density';
    corridor?: string;
    country_code?: string;
    state?: string;
}

export async function GET(req: NextRequest) {
    const apiKey = req.headers.get('x-hc-api-key') || req.nextUrl.searchParams.get('key');
    const queryType = req.nextUrl.searchParams.get('type') || 'corridor';
    const corridor = req.nextUrl.searchParams.get('corridor');
    const countryCode = req.nextUrl.searchParams.get('country');
    const state = req.nextUrl.searchParams.get('state');

    const supabase = getSupabaseAdmin();

    // Authenticate API key
    let tier = 'explore';
    let userId: string | null = null;

    if (apiKey) {
        const { data: keyData } = await supabase
            .from('api_keys')
            .select('user_id, tier, is_active, daily_requests, last_request_date')
            .eq('key_hash', hashKey(apiKey))
            .single();

        if (keyData?.is_active) {
            tier = keyData.tier || 'pro';
            userId = keyData.user_id;

            // Rate limiting
            const today = new Date().toISOString().split('T')[0];
            const dailyReqs = keyData.last_request_date === today ? (keyData.daily_requests || 0) : 0;

            if (dailyReqs >= (TIER_LIMITS[tier] || 10)) {
                return NextResponse.json({
                    error: 'Rate limit exceeded',
                    limit: TIER_LIMITS[tier],
                    tier,
                    upgrade_url: 'https://haulcommand.com/pricing?plan=enterprise',
                }, { status: 429 });
            }

            // Increment counter
            await supabase.from('api_keys').update({
                daily_requests: dailyReqs + 1,
                last_request_date: today,
            }).eq('key_hash', hashKey(apiKey));
        }
    }

    // Log usage for billing (non-blocking)
    try {
        await supabase.from('api_usage_log').insert({
            user_id: userId,
            endpoint: '/api/intelligence',
            query_type: queryType,
            query_params: { corridor, country: countryCode, state },
            tier,
            timestamp: new Date().toISOString(),
        });
    } catch { /* non-blocking */ }

    try {
        switch (queryType) {
            case 'corridor': {
                const query = supabase.from('hc_rm_radar_geo')
                    .select('country_code, country_name, tier, operator_count, load_count_24h, demand_level, supply_level, liquidity_score');

                if (countryCode) query.eq('country_code', countryCode.toUpperCase());

                const { data, error } = await query.order('liquidity_score', { ascending: false }).limit(50);
                if (error) throw error;

                return NextResponse.json({
                    type: 'corridor_intelligence',
                    count: data?.length || 0,
                    data: data?.map(d => ({
                        country: d.country_code,
                        name: d.country_name,
                        tier: d.tier,
                        operators: d.operator_count,
                        loads_24h: d.load_count_24h,
                        demand: d.demand_level,
                        supply: d.supply_level,
                        liquidity_score: d.liquidity_score,
                        // Pro+ only fields
                        ...(tier !== 'explore' ? {} : { _upgrade: 'Upgrade to Pro for detailed analytics' }),
                    })),
                    meta: { tier, cached: false, timestamp: new Date().toISOString() },
                });
            }

            case 'supply': {
                if (tier === 'explore') {
                    return NextResponse.json({
                        type: 'supply_pressure',
                        _upgrade: 'Supply pressure data requires Pro or Enterprise tier',
                        upgrade_url: 'https://haulcommand.com/pricing',
                    }, { status: 403 });
                }

                const { data, error } = await supabase.from('supply_move_recommendations')
                    .select('corridor, label, pressure_bucket, priority_score, supply_count, available_count')
                    .order('priority_score', { ascending: false })
                    .limit(20);

                if (error) throw error;

                return NextResponse.json({
                    type: 'supply_pressure',
                    count: data?.length || 0,
                    data,
                    meta: { tier, timestamp: new Date().toISOString() },
                });
            }

            case 'compliance': {
                if (tier !== 'enterprise') {
                    return NextResponse.json({
                        type: 'compliance',
                        _upgrade: 'Compliance data requires Enterprise tier ($499/mo)',
                        upgrade_url: 'https://haulcommand.com/pricing?plan=enterprise',
                    }, { status: 403 });
                }

                const query = supabase.from('state_regulations')
                    .select('state_code, state_name, regulatory_category, regulation_summary, source_url');

                if (state) query.eq('state_code', state.toUpperCase());
                if (countryCode) query.eq('country_code', countryCode.toUpperCase());

                const { data, error } = await query.limit(100);
                if (error) throw error;

                return NextResponse.json({
                    type: 'compliance_regulations',
                    count: data?.length || 0,
                    data,
                    meta: { tier, timestamp: new Date().toISOString() },
                });
            }

            case 'operator_density': {
                const { data, error } = await supabase.from('hc_rm_radar_geo')
                    .select('country_code, country_name, operator_count, surface_count')
                    .order('operator_count', { ascending: false })
                    .limit(57);

                if (error) throw error;

                return NextResponse.json({
                    type: 'operator_density',
                    total_operators: data?.reduce((s, d) => s + (d.operator_count || 0), 0) || 0,
                    total_surfaces: data?.reduce((s, d) => s + (d.surface_count || 0), 0) || 0,
                    countries: data?.length || 0,
                    data: tier === 'explore' 
                        ? data?.map(d => ({ country: d.country_code, operators: d.operator_count }))
                        : data,
                    meta: { tier, timestamp: new Date().toISOString() },
                });
            }

            default:
                return NextResponse.json({
                    error: 'Invalid type. Use: corridor, supply, compliance, operator_density',
                    docs: 'https://haulcommand.com/api/docs',
                }, { status: 400 });
        }
    } catch (err: any) {
        console.error('[Intelligence API]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

function hashKey(key: string): string {
    // Simple hash for API key lookup — use crypto.subtle in production
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(key).digest('hex');
}
