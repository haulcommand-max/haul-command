/**
 * POST /api/escrow/dispute
 *
 * OPUS-02 Guardrail: Dispute Auto-Resolution Dependency Chain.
 * Either party can open a dispute on a held escrow.
 * Freezes funds (status -> DISPUTED), creates hc_disputes record,
 * and pushes notifications to both parties.
 *
 * Schema verified against types/supabase.ts:
 *   hc_disputes: { id, booking_id, payment_id, opened_by, reason, status, resolution, evidence }
 *   hc_escrow:   { id, booking_id, stripe_payment_intent_id, amount_cents, status, ... }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendNativePush } from '@/lib/push-send';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
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

        // Get the escrow record from canonical hc_escrow table
        const { data: escrow, error: fetchErr } = await admin
            .from('hc_escrow')
            .select('id, booking_id, stripe_payment_intent_id, status, broker_stripe_account')
            .eq('id', escrow_id)
            .single();

        if (fetchErr || !escrow) {
            return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
        }

        // OPUS-02 Precondition: Only held/funds_secured escrows can be disputed
        const holdStatuses = ['held', 'funds_secured'];
        if (!holdStatuses.includes(escrow.status ?? '')) {
            return NextResponse.json({
                error: `Cannot dispute escrow in status: ${escrow.status}. Must be in held or funds_secured state.`
            }, { status: 400 });
        }

        // Resolve broker from the canonical load (hc_loads table)
        const { data: load } = await admin
            .from('hc_loads')
            .select('broker_id')
            .eq('id', escrow.booking_id)
            .maybeSingle();

        const brokerId = load?.broker_id;
        const disputerRole = user.id === brokerId ? 'broker' : 'operator';

        // Freeze funds: status -> DISPUTED
        const { error: updateErr } = await admin
            .from('hc_escrow')
            .update({
                status: 'DISPUTED',
                updated_at: new Date().toISOString(),
            })
            .eq('id', escrow_id);

        if (updateErr) throw updateErr;

        // Create hc_escrow_disputes record (new canonical UUID-safe table)
        const deadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
        const { data: dispute } = await admin
            .from('hc_escrow_disputes')
            .insert({
                escrow_id: escrow_id,
                load_id: escrow.booking_id,
                opened_by: user.id,
                reason,
                status: 'OPEN',
                deadline_at: deadline,
                evidence_payload: {
                    filer_role: disputerRole,
                    stripe_payment_intent_id: escrow.stripe_payment_intent_id,
                    opened_at: new Date().toISOString(),
                },
            })
            .select('id')
            .single();

        // Notify filer
        await sendNativePush(user.id, {
            title: 'Dispute Filed',
            body: 'Your dispute is under review. Evidence collection window: 72 hours.',
            url: `/escrow/${escrow_id}/dispute`,
            priority: 'high',
            meta: { escrow_id: String(escrow_id), dispute_id: String(dispute?.id ?? '') },
        });

        // Notify counterparty (broker) if different from filer
        if (brokerId && brokerId !== user.id) {
            await sendNativePush(brokerId, {
                title: 'Dispute Opened on Your Job',
                body: 'The other party has filed a dispute. Funds are frozen. Please contact support.',
                url: `/escrow/${escrow_id}/dispute`,
                priority: 'urgent',
                meta: { escrow_id: String(escrow_id), dispute_id: String(dispute?.id ?? '') },
            });
        }

        return NextResponse.json({
            ok: true,
            escrow_id,
            dispute_id: dispute?.id,
            status: 'DISPUTED',
            filer_role: disputerRole,
            message: 'Funds are frozen. Our team will review within 24 hours. Evidence window: 72 hours.',
        });
    } catch (err: any) {
        console.error('[escrow/dispute] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
