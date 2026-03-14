// app/api/v1/admin/jobs/route.ts
// GET — list jobs with payment/payout status for admin ops dashboard
// ============================================================

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const paymentStatus = url.searchParams.get('payment_status');
    const payoutStatus = url.searchParams.get('payout_status');
    const brokerId = url.searchParams.get('broker_id');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (paymentStatus) query = query.eq('payment_status', paymentStatus);
    if (payoutStatus) query = query.eq('payout_status', payoutStatus);
    if (brokerId) query = query.eq('broker_id', brokerId);

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate stats
    const { data: allJobs } = await supabase
        .from('jobs')
        .select('status, payment_status, payout_status, agreed_rate_total, platform_fee_cents');

    const stats = {
        total: allJobs?.length || 0,
        by_status: {} as Record<string, number>,
        by_payment: {} as Record<string, number>,
        by_payout: {} as Record<string, number>,
        total_revenue_cents: 0,
        total_platform_fees_cents: 0,
    };

    for (const j of (allJobs ?? []) as any[]) {
        stats.by_status[j.status] = (stats.by_status[j.status] || 0) + 1;
        stats.by_payment[j.payment_status] = (stats.by_payment[j.payment_status] || 0) + 1;
        stats.by_payout[j.payout_status] = (stats.by_payout[j.payout_status] || 0) + 1;
        if (j.payment_status === 'captured') {
            stats.total_revenue_cents += (j.agreed_rate_total || 0) * 100;
            stats.total_platform_fees_cents += j.platform_fee_cents || 0;
        }
    }

    return NextResponse.json({
        jobs: data,
        stats,
        pagination: { limit, offset, total: count },
    });
}
