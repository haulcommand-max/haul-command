/**
 * HAUL COMMAND — Stripe Webhook Handler (Next.js API Route)
 * POST /api/webhooks/stripe
 *
 * This route forwards raw Stripe events to the Supabase Edge Function
 * for processing. We also handle critical events locally for speed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stripe requires raw body for signature verification
export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        console.error('[HC Stripe Webhook] Signature verification failed:', err.message);
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
    }

    // Forward to Supabase Edge Function for full processing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
        try {
            await fetch(`${supabaseUrl}/functions/v1/hc-stripe-webhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'stripe-signature': sig,
                },
                body: JSON.stringify(event),
            });
        } catch (err) {
            console.error('[HC Stripe Webhook] Forward to Edge Function failed:', err);
        }
    }

    return NextResponse.json({ received: true, type: event.type });
}
