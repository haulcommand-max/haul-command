import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// ══════════════════════════════════════════════════════════════
// STRIPE ESCROW WEBHOOK — SIGNATURE-VERIFIED
//
// Handles:
//   payment_intent.succeeded → Mark escrow as funds_secured
//   charge.refunded → Mark escrow as refunded
//
// Security:
//   1. Signature verification via constructEvent()
//   2. Validates payment intent exists in DB before updating
//   3. Returns 400 on any verification failure
// ══════════════════════════════════════════════════════════════

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover' as any,
});

const webhookSecret = process.env.STRIPE_ESCROW_WEBHOOK_SECRET
    || process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const sig = req.headers.get('stripe-signature');
    const payload = await req.text();

    // ── 1. Require signature header ──
    if (!sig) {
        console.error('[Escrow Webhook] Missing stripe-signature header');
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        );
    }

    // ── 2. Verify signature cryptographically ──
    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err: any) {
        console.error('[Escrow Webhook] Signature verification FAILED:', err.message);
        return NextResponse.json(
            { error: 'Invalid signature', detail: err.message },
            { status: 400 }
        );
    }

    // ── 3. Idempotency check — reject already-processed events ──
    const supabase = createClient();
    const { data: existing } = await supabase
        .from('webhook_inbox')
        .select('id, status')
        .eq('provider', 'stripe_escrow')
        .eq('event_id', event.id)
        .maybeSingle();

    if (existing?.status === 'processed') {
        console.log(`[Escrow Webhook] Skipped duplicate event: ${event.id}`);
        return NextResponse.json({ received: true, skipped: true });
    }

    // Record event in webhook inbox
    await supabase.from('webhook_inbox').upsert(
        {
            provider: 'stripe_escrow',
            event_id: event.id,
            event_type: event.type,
            payload: event,
            received_at: new Date().toISOString(),
            signature_verified: true,
            status: 'processing',
        },
        { onConflict: 'provider,event_id' }
    );

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;

                // Validate the payment intent ID exists in our ledger
                const { data: ledgerEntry, error: lookupErr } = await supabase
                    .from('hc_escrow')
                    .select('id, status, booking_id')
                    .eq('stripe_payment_intent_id', paymentIntent.id)
                    .maybeSingle();

                if (lookupErr || !ledgerEntry) {
                    console.error(`[Escrow Webhook] Unknown payment intent: ${paymentIntent.id}`);
                    break; // Don't update — this PI doesn't belong to us
                }

                // Prevent re-processing already-secured escrows
                if (ledgerEntry.status === 'funds_secured') {
                    console.log(`[Escrow Webhook] Escrow already secured for PI: ${paymentIntent.id}`);
                    break;
                }

                // Mark escrow as secured
                const { error: escrowErr } = await supabase
                    .from('hc_escrow')
                    .update({
                        status: 'funds_secured',
                        held_at: new Date().toISOString(),
                    })
                    .eq('stripe_payment_intent_id', paymentIntent.id);

                if (escrowErr) throw escrowErr;

                // Shift load status to OPEN (Guardrail 4: Load Goes Live)
                if (ledgerEntry.booking_id) {
                    await supabase
                        .from('hc_loads')
                        .update({ load_status: 'open' })
                        .eq('id', ledgerEntry.booking_id);
                }

                console.log(`[Escrow Webhook] Secured escrow for PI: ${paymentIntent.id}`);
                break;
            }

            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge;
                const refundPI = typeof charge.payment_intent === 'string'
                    ? charge.payment_intent
                    : (charge.payment_intent as any)?.id;

                if (!refundPI) {
                    console.error('[Escrow Webhook] Refund event missing payment_intent');
                    break;
                }

                // Validate the PI exists before updating
                const { data: refundLedger } = await supabase
                    .from('hc_escrow')
                    .select('id')
                    .eq('stripe_payment_intent_id', refundPI)
                    .maybeSingle();

                if (!refundLedger) {
                    console.error(`[Escrow Webhook] Unknown refund PI: ${refundPI}`);
                    break;
                }

                await supabase
                    .from('hc_escrow')
                    .update({ status: 'refunded_network_recovery' })
                    .eq('stripe_payment_intent_id', refundPI);

                console.log(`[Escrow Webhook] Processed refund for PI: ${refundPI}`);
                break;
            }

            default:
                console.log(`[Escrow Webhook] Unhandled event type: ${event.type}`);
        }

        // Mark event as processed
        await supabase
            .from('webhook_inbox')
            .update({ status: 'processed', processed_at: new Date().toISOString() })
            .eq('provider', 'stripe_escrow')
            .eq('event_id', event.id);

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error(`[Escrow Webhook] Processing error for event ${event.id}:`, err.message);

        // Mark event as failed for retry/investigation
        await supabase
            .from('webhook_inbox')
            .update({ status: 'failed', processing_error: err.message })
            .eq('provider', 'stripe_escrow')
            .eq('event_id', event.id);

        return NextResponse.json(
            { error: `Webhook processing error: ${err.message}` },
            { status: 500 }
        );
    }
}
