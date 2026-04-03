import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

// ══════════════════════════════════════════════════════════════
// /api/monetization/sponsor-checkout — STRIPE CHECKOUT SESSION
//
// Creates a Stripe Checkout session for sponsor territory/corridor/port
// purchases. All sponsor buys go monthly recurring (subscription).
//
// Input:  { zone, geo, priceMonthly, label, returnUrl }
// Output: { sessionUrl } — redirect to Stripe-hosted checkout
//
// On success: Stripe webhook → update sponsors table → email receipt
// ══════════════════════════════════════════════════════════════

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia',
});

const ALLOWED_ZONES = [
    'territory', 'corridor', 'port', 'country',
    'empty_market', 'regulation', 'tool', 'glossary', 'blog',
] as const;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { zone, geo, priceMonthly, label, returnUrl } = body as {
            zone: string;
            geo: string;
            priceMonthly: number;
            label: string;
            returnUrl?: string;
        };

        // ── Input validation ──
        if (!zone || !geo || !priceMonthly || !label) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (!ALLOWED_ZONES.includes(zone as any)) {
            return NextResponse.json({ error: 'Invalid sponsor zone' }, { status: 400 });
        }
        if (priceMonthly < 49 || priceMonthly > 2000) {
            return NextResponse.json({ error: 'Invalid price range' }, { status: 400 });
        }

        // ── Auth: get user_id if signed in (optional — sponsors can buy as guest) ──
        const supabase = createClient();
        let customerId: string | undefined;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                // Look up or create Stripe customer
                const existing = await stripe.customers.list({ email: user.email, limit: 1 });
                if (existing.data.length > 0) {
                    customerId = existing.data[0].id;
                } else {
                    const customer = await stripe.customers.create({
                        email: user.email,
                        metadata: { supabase_user_id: user.id },
                    });
                    customerId = customer.id;
                }
            }
        } catch {
            // Non-blocking — proceed without customer linkage
        }

        // ── Create Stripe Price (inline, one-off per session) ──
        // In production, create a Price catalog in Stripe and look up by lookup_key
        const price = await stripe.prices.create({
            currency: 'usd',
            unit_amount: Math.round(priceMonthly * 100),
            recurring: { interval: 'month' },
            product_data: {
                name: `Haul Command Sponsor: ${label}`,
                metadata: { zone, geo },
            },
        });

        // ── Create Checkout Session ──
        const origin = returnUrl
            ? new URL(returnUrl).origin
            : 'https://haulcommand.com';

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{ price: price.id, quantity: 1 }],
            ...(customerId ? { customer: customerId } : {}),
            success_url: `${origin}/advertise?checkout=success&zone=${zone}&geo=${encodeURIComponent(geo)}`,
            cancel_url: `${origin}/advertise?checkout=cancelled`,
            subscription_data: {
                metadata: {
                    sponsor_zone: zone,
                    sponsor_geo: geo,
                    sponsor_label: label,
                },
            },
            metadata: {
                sponsor_zone: zone,
                sponsor_geo: geo,
                sponsor_label: label,
            },
            allow_promotion_codes: true,
            billing_address_collection: 'auto',
        });

        return NextResponse.json({ sessionUrl: session.url });
    } catch (err: any) {
        console.error('[Sponsor Checkout] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
