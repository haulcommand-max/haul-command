import { NextResponse } from 'next/server';
import { OS_EVENTS } from '@/lib/os-events';
import { EscrowGuardrails } from '@/lib/escrow/engine';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Fallback if not using GlobalEventBus directly
const getAdminDb = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

export async function POST(req: Request) {
    try {
        const payload = await req.text();
        const signature = req.headers.get('stripe-signature');
        
        if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
            console.error('[Stripe Webhook] Missing signature or secret');
            return NextResponse.json({ error: 'System Unconfigured' }, { status: 400 });
        }

        const stripe = getStripe();
        let event;
        
        try {
            event = stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err: any) {
            console.error('[Stripe Webhook] Verification failed:', err.message);
            return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
        }

        const db = getAdminDb();

        switch (event.type) {
            case 'payment_intent.amount_capturable_updated':
                // OPUS-02: Pre-auth succeeded. Load goes live.
                const piCapturable = event.data.object as any;
                const isAlreadyFunded = await EscrowGuardrails.checkIdempotency(piCapturable.id, 'FUNDED');
                
                if (!isAlreadyFunded) {
                    await db.from('hc_escrows')
                        .update({ status: 'FUNDED' })
                        .eq('gateway_reference_id', piCapturable.id);
                        
                    if (piCapturable.metadata?.job_id) {
                        await db.from('jobs')
                            .update({ status: 'OPEN' })
                            .eq('id', piCapturable.metadata.job_id);
                        console.log(`[Escrow] Pre-auth cleared for Job ${piCapturable.metadata.job_id}. Gone LIVE.`);
                    }
                }
                break;

            case 'payment_intent.payment_failed':
                // OPUS-02: Hard stop. Load NEVER goes live.
                const piFailed = event.data.object as any;
                const isAlreadyFailed = await EscrowGuardrails.checkIdempotency(piFailed.id, 'FAILED');
                
                if (!isAlreadyFailed) {
                    await db.from('hc_escrows')
                        .update({ status: 'FAILED' })
                        .eq('gateway_reference_id', piFailed.id);
                    console.log(`[Escrow] Pre-auth FAILED for PaymentIntent ${piFailed.id}. Load remains DRAFT.`);
                }
                break;

            case 'transfer.failed':
                // OPUS-02: Payout Failure Push Path
                const transferFailed = event.data.object as any;
                const failureReason = transferFailed.failure_code || 'Unknown transfer failure';
                await EscrowGuardrails.handleTransferFailure(transferFailed.id, failureReason);
                break;

            case 'transfer.created':
                const transfer = event.data.object as any;
                await db.from('hc_payouts')
                    .update({ status: 'COMPLETED' })
                    .eq('gateway_reference_id', transfer.id);
                console.log(`[Payout] Transfer completed for ${transfer.id}.`);
                break;

            default:
                // Unhandled event type
                break;
        }
        
        return NextResponse.json({ received: true });
    } catch (e: any) {
        console.error('[Stripe Webhook] Uncaught Error:', e);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
