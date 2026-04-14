// app/api/checkout/session/route.ts
// POST /api/checkout/session
//
// Universal Stripe Checkout Session creator.
// Handles: subscriptions (Pro/Elite/Enterprise), one-time boosts,
//          territory sponsorships, corridor sponsorships, data products.
//
// Maps product_key → Stripe price ID using .env.local price IDs.
// Stripe secret key is already in .env.local: STRIPE_SECRET_KEY=sk_test_...
// Run: npm install stripe  (if not already installed)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ─── Price catalog — maps product_key → Stripe Price ID ──
// All price IDs are confirmed from the live Stripe account in .env.local
const PRICE_MAP: Record<string, { priceId: string; mode: 'payment' | 'subscription'; label: string; amount?: number }> = {
    // Subscriptions
    'hc_basic_monthly':       { priceId: process.env.STRIPE_PRICE_HC_BASIC_MONTHLY    ?? '', mode: 'subscription', label: 'Haul Command Basic — $29/mo' },
    'hc_pro_monthly':         { priceId: process.env.STRIPE_PRICE_HC_PRO_MONTHLY      ?? '', mode: 'subscription', label: 'Haul Command Pro — $79/mo' },
    'hc_elite_monthly':       { priceId: process.env.STRIPE_PRICE_HC_ELITE_MONTHLY    ?? '', mode: 'subscription', label: 'Haul Command Elite — $199/mo' },
    'hc_basic_annual':        { priceId: process.env.STRIPE_PRICE_HC_BASIC_ANNUAL     ?? '', mode: 'subscription', label: 'Haul Command Basic — $278/yr' },
    'hc_pro_annual':          { priceId: process.env.STRIPE_PRICE_HC_PRO_ANNUAL       ?? '', mode: 'subscription', label: 'Haul Command Pro — $758/yr' },
    'hc_elite_annual':        { priceId: process.env.STRIPE_PRICE_HC_ELITE_ANNUAL     ?? '', mode: 'subscription', label: 'Haul Command Elite — $1908/yr' },
    'broker_seat_monthly':    { priceId: process.env.STRIPE_PRICE_BROKER_SEAT_MONTHLY ?? '', mode: 'subscription', label: 'Broker Seat — $149/mo' },
    'broker_seat_annual':     { priceId: process.env.STRIPE_PRICE_BROKER_SEAT_ANNUAL  ?? '', mode: 'subscription', label: 'Broker Seat — $1430/yr' },
    // One-time
    'load_boost':             { priceId: process.env.STRIPE_PRICE_LOAD_BOOST              ?? '', mode: 'payment', label: 'Load Boost — $14' },
    'directory_featured':     { priceId: process.env.STRIPE_PRICE_DIRECTORY_FEATURED      ?? '', mode: 'payment', label: 'Directory Featured — $99/mo' },
    'corridor_sponsor':       { priceId: process.env.STRIPE_PRICE_CORRIDOR_SPONSOR        ?? '', mode: 'payment', label: 'Corridor Sponsor — $199/mo' },
    'escort_dispatch':        { priceId: process.env.STRIPE_PRICE_ESCORT_DISPATCH         ?? '', mode: 'payment', label: 'Escort Dispatch — $150' },
    'permit_procurement':     { priceId: process.env.STRIPE_PRICE_PERMIT_PROCUREMENT      ?? '', mode: 'payment', label: 'Permit Procurement — $65' },
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            product_key,
            // Optional overrides for custom amounts (data products, territory)
            custom_amount_cents,
            custom_label,
            custom_mode = 'payment',
            // Routing
            success_path = '/dashboard?checkout=success',
            cancel_path = '/pricing?cancelled=1',
        } = body as {
            product_key?: string;
            custom_amount_cents?: number;
            custom_label?: string;
            custom_mode?: 'payment' | 'subscription';
            success_path?: string;
            cancel_path?: string;
        };

        const origin = req.headers.get('origin') ?? 'https://www.haulcommand.com';

        // Get user for pre-fill (optional)
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Resolve product
        const known = product_key ? PRICE_MAP[product_key] : null;
        const mode: 'payment' | 'subscription' = known?.mode ?? custom_mode;

        if (!known && !custom_amount_cents) {
            return NextResponse.json({
                error: 'product_key or custom_amount_cents required',
                available_keys: Object.keys(PRICE_MAP),
            }, { status: 400 });
        }

        // Fail-fast: known product exists but price ID not configured in env
        if (known && !known.priceId) {
            console.error(`[CHECKOUT_BLOCKED] Empty Stripe price ID for product_key="${product_key}". Configure STRIPE_PRICE_* in environment.`);
            return NextResponse.json(
                { error: `Checkout temporarily unavailable for ${known.label}. Payment configuration pending.` },
                { status: 503 }
            );
        }

        // Dynamic import — graceful if stripe not installed
        const StripeModule = await import('stripe').catch(() => null);
        if (!StripeModule || !process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({
                ok: false,
                stub: true,
                checkout_url: `${origin}${success_path}&stub=1`,
                install_hint: 'Run: npm install stripe',
                product_key,
            });
        }

        const stripe = new StripeModule.default(process.env.STRIPE_SECRET_KEY);

        // Build line items
        const lineItems = known?.priceId
            ? [{ price: known.priceId, quantity: 1 }]
            : [{
                price_data: {
                    currency: 'usd' as const,
                    product_data: { name: custom_label ?? 'Haul Command Product' },
                    unit_amount: custom_amount_cents!,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...(mode === 'subscription' ? { recurring: { interval: 'month' as const } } : {}),
                } as any,
                quantity: 1,
            }];

        const session = await stripe.checkout.sessions.create({
            mode,
            line_items: lineItems,
            customer_email: user?.email,
            client_reference_id: user?.id ?? `anon-${Date.now()}`,
            metadata: {
                product_key: product_key ?? 'custom',
                user_id: user?.id ?? '',
                platform: 'haul-command',
            },
            allow_promotion_codes: true,
            success_url: `${origin}${success_path}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}${cancel_path}`,
            ...(mode === 'subscription' ? {
                subscription_data: {
                    metadata: { user_id: user?.id ?? '', product_key: product_key ?? 'custom' },
                },
            } : {}),
        });

        return NextResponse.json({
            ok: true,
            checkout_url: session.url,
            session_id: session.id,
            mode,
            product_key,
            label: known?.label ?? custom_label,
        });

    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[/api/checkout/session]', msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// GET — return available product keys + pricing for front-end price page
export async function GET() {
    return NextResponse.json({
        products: Object.entries(PRICE_MAP).map(([key, val]) => ({
            key,
            label: val.label,
            mode: val.mode,
            has_price_id: val.priceId !== '',
        })),
        stripe_configured: Boolean(process.env.STRIPE_SECRET_KEY),
    });
}
