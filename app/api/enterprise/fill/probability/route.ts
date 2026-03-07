export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { enterpriseGate, logResponseMetrics } from '@/lib/enterprise/auth-middleware';

/**
 * POST /api/enterprise/fill/probability
 * Fill probability estimator API
 *
 * Auth: Enterprise API key required (X-API-Key header)
 * Product: operations_optimizer (pro_intelligence tier+)
 */
export async function POST(req: NextRequest) {
    const startMs = Date.now();

    // ── Auth + Entitlement Gate ────────────────────────────────
    const gate = await enterpriseGate(req, 'operations_optimizer');
    if (gate.error) return gate.error;
    const ctx = gate.context!;

    try {
        const body = await req.json();
        const { corridor_id, escorts_required, urgency_level, time_to_start_hours, miles } = body;

        if (!corridor_id) return NextResponse.json({ error: 'corridor_id required' }, { status: 400 });

        const supabase = createClient();
        const { data, error } = await supabase.rpc('predict_fill_probability', {
            p_corridor_id: corridor_id,
            p_escorts_required: escorts_required || 1,
            p_urgency_level: urgency_level || 0,
            p_time_to_start_hours: time_to_start_hours || 48,
            p_miles: miles || 100,
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        await logResponseMetrics(ctx, 1, Date.now() - startMs);

        return NextResponse.json({
            ...data,
            meta: { tier: ctx.tier, product: 'operations_optimizer' },
        });
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
