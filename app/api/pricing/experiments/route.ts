import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EXPERIMENT_GUARDRAILS } from '@/lib/pricing/revenue-intel';

/**
 * GET  /api/pricing/experiments — list experiments (filterable by country, status)
 * POST /api/pricing/experiments — create a new experiment
 */

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const country = url.searchParams.get('country');
    const status = url.searchParams.get('status');

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    let query = supabase
        .from('pricing_experiments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (country) query = query.eq('country_code', country.toUpperCase());
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Summary
    const summary: Record<string, number> = {};
    for (const exp of data || []) {
        summary[exp.status] = (summary[exp.status] || 0) + 1;
    }

    return NextResponse.json({
        total: data?.length || 0,
        status_summary: summary,
        experiments: data || [],
        guardrails: EXPERIMENT_GUARDRAILS,
    });
}

export async function POST(req: NextRequest) {
    const secret = req.headers.get('x-cron-secret');
    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
        name,
        experiment_type,
        country_code,
        control_config,
        variant_config,
        traffic_split,
        floor_price_usd,
    } = body;

    if (!name || !experiment_type || !country_code) {
        return NextResponse.json({ error: 'name, experiment_type, and country_code required' }, { status: 400 });
    }

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data, error } = await supabase
        .from('pricing_experiments')
        .insert({
            name,
            experiment_type,
            country_code: country_code.toUpperCase(),
            control_config: control_config || {},
            variant_config: variant_config || {},
            traffic_split: traffic_split || [50, 50],
            floor_price_usd: floor_price_usd || null,
            liquidity_gate: true,
            status: 'draft',
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        status: 'created',
        experiment: data,
        guardrails: EXPERIMENT_GUARDRAILS,
    });
}
