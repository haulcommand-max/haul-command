// app/api/v1/admin/payouts/route.ts
// GET  — list payouts (filter by status, job, operator)
// POST — process a payout (admin marks payout_ready → initiated)
// ============================================================

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';

export const runtime = 'nodejs';

// GET /api/v1/admin/payouts?status=payout_ready&limit=50
export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const jobId = url.searchParams.get('job_id');
    const operatorId = url.searchParams.get('operator_id');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let query = supabase
        .from('job_payouts')
        .select('*, jobs!inner(status, broker_id, agreed_rate_total, currency)')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (jobId) query = query.eq('job_id', jobId);
    if (operatorId) query = query.eq('operator_id', operatorId);

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Summary stats
    const { data: stats } = await supabase
        .from('job_payouts')
        .select('status, amount_cents')
        .then(({ data }) => {
            const summary = {
                pending: 0,
                payout_ready: 0,
                initiated: 0,
                completed: 0,
                failed: 0,
                total_pending_cents: 0,
                total_completed_cents: 0,
            };
            for (const p of (data ?? []) as any[]) {
                summary[p.status as keyof typeof summary] = (summary[p.status as keyof typeof summary] as number || 0) + 1;
                if (p.status === 'payout_ready' || p.status === 'pending') {
                    summary.total_pending_cents += p.amount_cents;
                }
                if (p.status === 'completed') {
                    summary.total_completed_cents += p.amount_cents;
                }
            }
            return { data: summary };
        });

    return NextResponse.json({
        payouts: data,
        stats,
        pagination: { limit, offset, total: count },
    });
}

// POST /api/v1/admin/payouts — mark payout as initiated
export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();
    const body = await req.json();
    const { payout_id, action, notes } = body;

    if (!payout_id || !action) {
        return NextResponse.json({ error: 'payout_id and action required' }, { status: 400 });
    }

    if (action === 'initiate') {
        const { error } = await supabase
            .from('job_payouts')
            .update({
                status: 'initiated',
                metadata: { admin_notes: notes, initiated_at: new Date().toISOString() },
            })
            .eq('payout_id', payout_id)
            .eq('status', 'payout_ready');

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, payout_id, status: 'initiated' });
    }

    if (action === 'complete') {
        const { error } = await supabase
            .from('job_payouts')
            .update({
                status: 'completed',
                paid_at: new Date().toISOString(),
                metadata: { admin_notes: notes, completed_at: new Date().toISOString() },
            })
            .eq('payout_id', payout_id)
            .eq('status', 'initiated');

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, payout_id, status: 'completed' });
    }

    if (action === 'fail') {
        const { error } = await supabase
            .from('job_payouts')
            .update({
                status: 'failed',
                metadata: { admin_notes: notes, failed_at: new Date().toISOString(), reason: notes },
            })
            .eq('payout_id', payout_id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, payout_id, status: 'failed' });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
