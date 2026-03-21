/**
 * GET  /api/escrow/status?escrow_id=xxx
 * GET  /api/escrow/status?load_id=xxx
 *
 * Returns escrow status for a given escrow or load.
 * Shows on load cards: "Funds Held", "Released", "Disputed"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Payment Pending', color: '#f59e0b', icon: '⏳' },
    held: { label: 'Funds Held in Escrow', color: '#3b82f6', icon: '🔒' },
    released: { label: 'Funds Released', color: '#22c55e', icon: '✅' },
    disputed: { label: 'Under Dispute', color: '#ef4444', icon: '⚠️' },
    refunded: { label: 'Refunded', color: '#6b7280', icon: '↩️' },
    expired: { label: 'Expired', color: '#6b7280', icon: '⏰' },
};

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sp = req.nextUrl.searchParams;
        const escrowId = sp.get('escrow_id');
        const loadId = sp.get('load_id');

        if (!escrowId && !loadId) {
            return NextResponse.json({ error: 'escrow_id or load_id required' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();
        let query = admin.from('escrow_holds').select('*');

        if (escrowId) {
            query = query.eq('id', escrowId);
        } else if (loadId) {
            query = query.eq('load_id', loadId);
        }

        const { data: escrows, error } = await query
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        const escrow = escrows?.[0];
        if (!escrow) {
            return NextResponse.json({ ok: true, escrow: null, message: 'No escrow found' });
        }

        // Verify the user is part of this escrow
        if (user.id !== escrow.broker_id && user.id !== escrow.operator_id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        const statusInfo = STATUS_LABELS[escrow.status] || STATUS_LABELS.pending;

        return NextResponse.json({
            ok: true,
            escrow: {
                id: escrow.id,
                load_id: escrow.load_id,
                status: escrow.status,
                status_label: statusInfo.label,
                status_color: statusInfo.color,
                status_icon: statusInfo.icon,
                load_rate_usd: escrow.load_rate_usd,
                platform_fee_usd: escrow.platform_fee_usd,
                total_charge_usd: escrow.total_charge_usd,
                broker_id: escrow.broker_id,
                operator_id: escrow.operator_id,
                created_at: escrow.created_at,
                held_at: escrow.held_at,
                released_at: escrow.released_at,
                disputed_at: escrow.disputed_at,
                dispute_reason: escrow.dispute_reason,
            },
        });
    } catch (err: any) {
        console.error('[escrow/status] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
