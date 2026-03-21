/**
 * POST /api/sms/purchase
 *
 * SMS credit packages via Stripe Checkout.
 * Starter: 50 credits / $4.99
 * Pro: 200 credits / $14.99
 * Unlimited: 1000 credits / $49.99
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

const SMS_PACKAGES = {
    starter: { credits: 50, price_usd: 4.99, name: 'SMS Starter — 50 Credits' },
    pro: { credits: 200, price_usd: 14.99, name: 'SMS Pro — 200 Credits' },
    unlimited: { credits: 1000, price_usd: 49.99, name: 'SMS Unlimited — 1,000 Credits' },
} as const;

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { package_id } = body;

        const pkg = SMS_PACKAGES[package_id as keyof typeof SMS_PACKAGES];
        if (!pkg) {
            return NextResponse.json({
                error: 'Invalid package. Choose: starter, pro, unlimited',
                packages: Object.entries(SMS_PACKAGES).map(([id, p]) => ({
                    id, credits: p.credits, price_usd: p.price_usd,
                })),
            }, { status: 400 });
        }

        const stripe = getStripeClient();
        const priceCents = Math.round(pkg.price_usd * 100);

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: pkg.name,
                        description: `${pkg.credits} SMS credits for Haul Command messaging`,
                    },
                    unit_amount: priceCents,
                },
                quantity: 1,
            }],
            metadata: {
                type: 'sms_credits',
                user_id: user.id,
                package_id,
                credits: String(pkg.credits),
            },
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings?sms=purchased&credits=${pkg.credits}`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings?sms=cancelled`,
        });

        return NextResponse.json({
            ok: true,
            checkout_url: session.url,
            session_id: session.id,
            package: pkg,
        });
    } catch (err: any) {
        console.error('[sms/purchase] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}

// GET — return available packages and user's current balance
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { createClient: createAdmin } = await import('@supabase/supabase-js');
        const admin = createAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        const { data: credits } = await admin
            .from('sms_credits')
            .select('credits_remaining, credits_used')
            .eq('user_id', user.id)
            .maybeSingle();

        return NextResponse.json({
            ok: true,
            balance: {
                credits_remaining: credits?.credits_remaining || 0,
                credits_used: credits?.credits_used || 0,
            },
            packages: Object.entries(SMS_PACKAGES).map(([id, p]) => ({
                id,
                credits: p.credits,
                price_usd: p.price_usd,
                cost_per_sms: `$${(p.price_usd / p.credits).toFixed(4)}`,
            })),
        });
    } catch (err: any) {
        console.error('[sms/purchase GET] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
