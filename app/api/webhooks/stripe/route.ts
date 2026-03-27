import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { EntitlementEngine } from '@/lib/monetization/entitlements';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' as any });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const sig = req.headers.get('stripe-signature')!;
        
        if (!sig) {
             return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
        }

        let event: Stripe.Event;

        try {
             // 1. Signature Verification
             event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        } catch (err: any) {
             console.error('Stripe webhook sig verification failed:', err.message);
             return NextResponse.json({ error: 'Invalid signature', message: err.message }, { status: 400 });
        }

        // 2. Feed into Idempotent Event Log & Canonical Logic
        const engine = new EntitlementEngine();
        const resolution = await engine.handleStripeWebhook(event);

        if (resolution.skipped && resolution.reason === 'idempotent_duplicate') {
             console.log(`[Stripe Webhook] Skipped duplicate event: ${event.id}`);
        }

        return NextResponse.json({ received: true, ...resolution });

    } catch (error: any) {
        console.error('Stripe webhook fatal processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
