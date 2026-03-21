/**
 * GET /api/payments/quickpay/history
 *
 * Returns the authenticated operator's QuickPay transaction history.
 *
 * Query params:
 *   ?limit=10           — max results (default: 10, max: 50)
 *   ?status=completed   — filter by status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
        const status = searchParams.get('status');

        let query = supabase
            .from('quickpay_transactions')
            .select('*')
            .eq('operator_id', user.id)
            .order('requested_at', { ascending: false })
            .limit(limit);

        if (status) {
            query = query.eq('status', status);
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error('[QuickPay History]', error);
            return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
        }

        // Compute summary stats
        const completed = (transactions || []).filter(t => t.status === 'completed');
        const totalPaidOut = completed.reduce((sum, t) => sum + (t.net_payout_cents || 0), 0);
        const totalFees = completed.reduce((sum, t) => sum + (t.fee_amount_cents || 0), 0);

        return NextResponse.json({
            status: 'ok',
            transactions: (transactions || []).map(t => ({
                id: t.id,
                booking_id: t.booking_id,
                gross_amount: t.gross_amount_cents / 100,
                fee_amount: t.fee_amount_cents / 100,
                net_payout: t.net_payout_cents / 100,
                fee_percentage: t.fee_percentage,
                currency: t.currency,
                status: t.status,
                payout_method: t.stripe_payout_id ? 'instant' : 'standard',
                requested_at: t.requested_at,
                completed_at: t.completed_at,
                risk_score: t.risk_score,
            })),
            summary: {
                total_quickpays: completed.length,
                total_paid_out: totalPaidOut / 100,
                total_fees_paid: totalFees / 100,
                average_fee_pct: completed.length > 0
                    ? completed.reduce((s, t) => s + (t.fee_percentage || 0), 0) / completed.length
                    : 0,
            },
        });
    } catch (error: any) {
        console.error('[QuickPay History] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
