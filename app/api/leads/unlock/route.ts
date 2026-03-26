export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let _stripe: Stripe | null = null;
function getStripe() {
    if (!_stripe && process.env.STRIPE_SECRET_KEY) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' as Stripe.LatestApiVersion });
    }
    return _stripe;
}


// Rate limit: 30 unlock attempts per minute per user
const ratelimit = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? new Ratelimit({
        redis: new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(30, '1 m'),
        prefix: 'ratelimit:lead-unlock',
    })
    : null;

/**
 * POST /api/leads/unlock
 * Broker pays to unlock operator contact information.
 * 
 * Body: { operatorId, buyerId, paymentMethod: 'credit' | 'stripe' }
 * 
 * - 'credit': deduct from buyer's lead credit balance
 * - 'stripe': create a Stripe payment intent for one-time lead fee
 */
export async function POST(req: NextRequest) {
    // Rate limit
    if (ratelimit) {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const { success } = await ratelimit.limit(ip);
        if (!success) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }
    }

    try {
        const { operatorId, buyerId, paymentMethod = 'stripe' } = await req.json();

        if (!operatorId || !buyerId) {
            return NextResponse.json({ error: 'operatorId and buyerId required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Check if already unlocked
        const { data: existing } = await supabase
            .from('lead_unlocks')
            .select('id')
            .eq('operator_id', operatorId)
            .eq('buyer_id', buyerId)
            .single();

        if (existing) {
            // Already unlocked — return contact info directly
            const { data: operator } = await supabase
                .from('operators')
                .select('id, company_name, phone, email, website')
                .eq('id', operatorId)
                .single();

            return NextResponse.json({ alreadyUnlocked: true, contact: operator });
        }

        // Lead pricing: $5 base, can be adjusted per category/territory
        const LEAD_FEE_CENTS = 500; // $5.00

        if (paymentMethod === 'credit') {
            // Deduct from credit balance
            const { data: balance } = await supabase
                .from('lead_credit_balances')
                .select('credits_remaining')
                .eq('user_id', buyerId)
                .single();

            if (!balance || balance.credits_remaining < 1) {
                return NextResponse.json({
                    error: 'Insufficient credits',
                    purchaseUrl: '/plans?upgrade=lead-credits',
                }, { status: 402 });
            }

            // Deduct credit
            await supabase
                .from('lead_credit_balances')
                .update({ credits_remaining: balance.credits_remaining - 1 })
                .eq('user_id', buyerId);

            // Record unlock
            await supabase.from('lead_unlocks').insert({
                operator_id: operatorId,
                buyer_id: buyerId,
                payment_method: 'credit',
                amount_cents: LEAD_FEE_CENTS,
                unlocked_at: new Date().toISOString(),
            });

            // Return contact info
            const { data: operator } = await supabase
                .from('operators')
                .select('id, company_name, phone, email, website')
                .eq('id', operatorId)
                .single();

            // PostHog event
            await trackEvent(buyerId, 'lead_unlocked', {
                operator_id: operatorId,
                method: 'credit',
                amount_cents: LEAD_FEE_CENTS,
            });

            return NextResponse.json({ unlocked: true, contact: operator });

        } else {
            // Create Stripe payment intent for one-time lead fee
            const stripeClient = getStripe();
            if (!stripeClient) {
                return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
            }

            const paymentIntent = await stripeClient.paymentIntents.create({
                amount: LEAD_FEE_CENTS,
                currency: 'usd',
                metadata: {
                    type: 'lead_unlock',
                    operator_id: operatorId,
                    buyer_id: buyerId,
                },
                description: `HAUL COMMAND — Contact unlock`,
            });

            return NextResponse.json({
                clientSecret: paymentIntent.client_secret,
                amount: LEAD_FEE_CENTS,
                currency: 'usd',
            });
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        console.error('[LEAD_UNLOCK] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function trackEvent(distinctId: string, event: string, properties: Record<string, unknown>) {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    try {
        await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'}/capture/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
                distinct_id: distinctId,
                event,
                properties,
            }),
        });
    } catch { /* analytics should never block money */ }
}
