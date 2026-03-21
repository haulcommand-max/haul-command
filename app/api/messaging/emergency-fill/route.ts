/**
 * POST /api/messaging/emergency-fill
 * Broker pays $25 to blast all operators on a corridor.
 * Creates Stripe PI, triggers sendBulkNotification, marks load URGENT.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { trySendBulkNotification } from '@/lib/notifications/fcm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { load_id, corridor_slug } = body;
        if (!load_id || !corridor_slug) return NextResponse.json({ error: 'load_id and corridor_slug required' }, { status: 400 });

        const stripe = getStripeClient();
        const admin = getSupabaseAdmin();

        // Create $25 payment
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Emergency Fill Blast', description: `Urgent load blast on ${corridor_slug}` }, unit_amount: 2500 }, quantity: 1 }],
            metadata: { type: 'emergency_fill', load_id, corridor_slug, broker_id: user.id },
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/loads/${load_id}?emergency=sent`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/loads/${load_id}`,
        });

        // Record the blast
        await admin.from('emergency_fill_blasts').insert({ load_id, broker_id: user.id, corridor_slug, stripe_payment_intent_id: session.payment_intent as string || session.id, amount_usd: 25.00, status: 'pending' });

        return NextResponse.json({ ok: true, checkout_url: session.url, session_id: session.id, amount_usd: 25.00 });
    } catch (err: any) {
        console.error('[emergency-fill] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
