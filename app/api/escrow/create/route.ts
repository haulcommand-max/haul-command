/**
 * POST /api/escrow/create
 *
 * Broker creates an escrow hold when posting/accepting a load.
 * Creates a Stripe Payment Intent for (load_rate + 5% platform fee).
 * Stores in escrow_holds table with status 'held'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, PLATFORM_FEE_BPS } from '@/lib/stripe/client';
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
        const { load_id, operator_id, load_rate_usd, corridor_slug } = body;

        if (!load_id || !load_rate_usd || load_rate_usd <= 0) {
            return NextResponse.json({ error: 'load_id and positive load_rate_usd required' }, { status: 400 });
        }

        const feePct = 0.05; // 5% platform fee
        const platformFee = Math.round(load_rate_usd * feePct * 100); // in cents
        const totalCents = Math.round(load_rate_usd * (1 + feePct) * 100);

        const stripe = getStripeClient();
        const admin = getSupabaseAdmin();

        // Check if broker has a Stripe customer ID
        const { data: profile } = await admin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        let customerId = profile?.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { supabase_user_id: user.id },
            });
            customerId = customer.id;
            await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
        }

        // Create Stripe Payment Intent with manual capture (escrow hold)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'usd',
            customer: customerId,
            capture_method: 'manual', // Hold funds, don't capture yet
            metadata: {
                type: 'escrow_hold',
                load_id,
                broker_id: user.id,
                operator_id: operator_id || '',
                platform_fee_cents: String(platformFee),
                corridor_slug: corridor_slug || '',
            },
            description: `Haul Command Escrow — Load ${load_id}`,
        });

        // Create escrow record
        const { data: escrow, error } = await admin
            .from('escrow_holds')
            .insert({
                load_id,
                broker_id: user.id,
                operator_id: operator_id || null,
                corridor_slug: corridor_slug || null,
                load_rate_usd,
                platform_fee_pct: feePct,
                stripe_payment_intent_id: paymentIntent.id,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            ok: true,
            escrow_id: escrow.id,
            payment_intent_id: paymentIntent.id,
            client_secret: paymentIntent.client_secret,
            amount_usd: load_rate_usd,
            platform_fee_usd: load_rate_usd * feePct,
            total_usd: load_rate_usd * (1 + feePct),
            status: 'pending',
            next_step: 'Confirm payment to hold funds in escrow',
        });
    } catch (err: any) {
        console.error('[escrow/create] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
