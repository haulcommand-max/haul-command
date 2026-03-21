/**
 * POST /api/escrow/dispute
 *
 * Either party can open a dispute. Freezes funds. Creates dispute record.
 * Admin reviews at /admin/trust.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { escrow_id, reason } = body;

        if (!escrow_id || !reason) {
            return NextResponse.json({ error: 'escrow_id and reason required' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();

        // Get the escrow record
        const { data: escrow, error: fetchErr } = await admin
            .from('escrow_holds')
            .select('*')
            .eq('id', escrow_id)
            .single();

        if (fetchErr || !escrow) {
            return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
        }

        // Only held escrows can be disputed
        if (escrow.status !== 'held') {
            return NextResponse.json({ error: `Cannot dispute escrow in status: ${escrow.status}` }, { status: 400 });
        }

        // Only broker or operator can dispute
        if (user.id !== escrow.broker_id && user.id !== escrow.operator_id) {
            return NextResponse.json({ error: 'Not authorized to dispute this escrow' }, { status: 403 });
        }

        // Freeze funds (update status to disputed)
        const { error: updateErr } = await admin
            .from('escrow_holds')
            .update({
                status: 'disputed',
                disputed_at: new Date().toISOString(),
                dispute_reason: reason,
                updated_at: new Date().toISOString(),
            })
            .eq('id', escrow_id);

        if (updateErr) throw updateErr;

        // Create a moderation record for admin review
        await admin.from('system_errors').insert({
            route: '/api/escrow/dispute',
            message: `Escrow dispute: ${reason}`,
            count: 1,
            metadata: {
                escrow_id,
                load_id: escrow.load_id,
                disputer_id: user.id,
                broker_id: escrow.broker_id,
                operator_id: escrow.operator_id,
                amount_usd: escrow.load_rate_usd,
            },
        }).then(() => {/* fire-and-forget */}).catch(() => {/* silent */});

        return NextResponse.json({
            ok: true,
            escrow_id: escrow.id,
            status: 'disputed',
            reason,
            message: 'Funds are frozen. Our team will review within 24 hours.',
            dispute_opened_by: user.id === escrow.broker_id ? 'broker' : 'operator',
        });
    } catch (err: any) {
        console.error('[escrow/dispute] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
