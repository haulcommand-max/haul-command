export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function admin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

/**
 * GET /api/enterprise/plans — Public plan matrix
 *
 * Returns available enterprise data plans with features, limits, and pricing hooks.
 * No authentication required — powers the pricing page and developer docs.
 */
export async function GET() {
    const svc = admin();

    const { data: plans, error } = await svc
        .from('enterprise_plan_matrix')
        .select(`
            plan_slug, display_name, tier, rpm_limit, monthly_rows,
            max_keys, support_level, overage_unit_price_cents,
            overage_unit_rows, features, regional_multiplier_enabled
        `)
        .eq('active', true)
        .order('rpm_limit', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (plans ?? []).map((p: any) => ({
        slug: p.plan_slug,
        name: p.display_name,
        tier: p.tier,
        limits: {
            requests_per_minute: p.rpm_limit,
            monthly_rows: p.monthly_rows === -1 ? 'unlimited' : p.monthly_rows,
            max_api_keys: p.max_keys,
        },
        support: p.support_level,
        overage: {
            unit_price_cents: p.overage_unit_price_cents,
            per_rows: p.overage_unit_rows,
        },
        features: p.features ?? {},
        regional_pricing: p.regional_multiplier_enabled,
    }));

    return NextResponse.json({
        plans: formatted,
        count: formatted.length,
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
    });
}
