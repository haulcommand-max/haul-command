/**
 * POST /api/escrow/release
 *
 * Triggered when operator marks job complete AND broker confirms.
 * Captures the held payment, transfers to operator via Stripe Connect,
 * keeps 5% platform fee. Records revenue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
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
        const { escrow_id } = body;

        if (!escrow_id) {
            return NextResponse.json({ error: 'escrow_id required' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();
        const stripe = getStripeClient();

        // Get the escrow record
        const { data: escrow, error: fetchErr } = await admin
            .from('escrow_holds')
            .select('*')
            .eq('id', escrow_id)
            .single();

        if (fetchErr || !escrow) {
            return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
        }

        if (escrow.status !== 'held') {
            return NextResponse.json({ error: `Cannot release escrow in status: ${escrow.status}` }, { status: 400 });
        }

        // Only broker or operator can release
        if (user.id !== escrow.broker_id && user.id !== escrow.operator_id) {
            return NextResponse.json({ error: 'Not authorized to release this escrow' }, { status: 403 });
        }

        // Capture the Payment Intent (moves from held to captured)
        const pi = await stripe.paymentIntents.capture(escrow.stripe_payment_intent_id);

        // Get operator's Stripe Connect account
        const { data: opProfile } = await admin
            .from('profiles')
            .select('stripe_connect_account_id')
            .eq('id', escrow.operator_id)
            .single();

        const platformFeeCents = Math.round(escrow.load_rate_usd * escrow.platform_fee_pct * 100);
        const operatorPayoutCents = Math.round(escrow.load_rate_usd * 100);

        // Transfer to operator (minus platform fee)
        if (opProfile?.stripe_connect_account_id) {
            await stripe.transfers.create({
                amount: operatorPayoutCents,
                currency: 'usd',
                destination: opProfile.stripe_connect_account_id,
                transfer_group: `escrow_${escrow.id}`,
                metadata: {
                    escrow_id: escrow.id,
                    load_id: escrow.load_id,
                },
            });
        }

        // Update escrow status
        await admin
            .from('escrow_holds')
            .update({
                status: 'released',
                released_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', escrow_id);

        // Record platform revenue
        await admin.from('hc_pay_revenue').insert({
            source: 'escrow_fee',
            amount_usd: escrow.load_rate_usd * escrow.platform_fee_pct,
            reference_id: escrow.id,
            metadata: {
                load_id: escrow.load_id,
                broker_id: escrow.broker_id,
                operator_id: escrow.operator_id,
                fee_pct: escrow.platform_fee_pct,
            },
        });

        return NextResponse.json({
            ok: true,
            escrow_id: escrow.id,
            status: 'released',
            operator_payout_usd: escrow.load_rate_usd,
            platform_fee_usd: escrow.load_rate_usd * escrow.platform_fee_pct,
            stripe_payment_intent_status: pi.status,
        });
    } catch (err: any) {
        console.error('[escrow/release] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
