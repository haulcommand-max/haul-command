import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createCryptoPayment, checkCryptoLegality } from '@/lib/crypto/nowpayments';
import { EMAIL_CONFIRMATION_REQUIRED, isEmailConfirmed } from '@/lib/auth/confirmed-user';
import { getCryptoCheckoutBlockReason } from '@/lib/launch/production-guards';

async function getSupabaseUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll() { /* read-only in route handlers */ },
            },
        },
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

function cleanText(value: unknown, fallback = '') {
    if (typeof value !== 'string' && typeof value !== 'number') return fallback;
    const clean = String(value).replace(/[^\w .:/?#=&-]/g, '').trim();
    return clean ? clean.slice(0, 220) : fallback;
}

/**
 * POST /api/crypto/checkout
 * Create a crypto payment via NOWPayments
 * 
 * Body: { amount, currency, pay_currency, order_id, description, country_code }
 */
export async function POST(req: NextRequest) {
    try {
        const blockReason = getCryptoCheckoutBlockReason();
        if (blockReason) {
            return NextResponse.json(
                { error: 'Crypto checkout is temporarily unavailable.', reason: blockReason },
                { status: 503 },
            );
        }

        const user = await getSupabaseUser();
        if (!user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        if (!isEmailConfirmed(user)) {
            return NextResponse.json(EMAIL_CONFIRMATION_REQUIRED, { status: 403 });
        }

        const body = await req.json();
        const { amount, currency, pay_currency, order_id, description, country_code } = body;
        const priceAmount = Number(amount);
        const orderId = cleanText(order_id);
        const priceCurrency = cleanText(currency || 'usd', 'usd').toLowerCase();
        const payCurrency = cleanText(pay_currency).toLowerCase();
        const countryCode = cleanText(country_code).toUpperCase();
        const orderDescription = cleanText(description, `Haul Command Payment ${orderId}`);

        if (!Number.isFinite(priceAmount) || priceAmount <= 0 || !orderId) {
            return NextResponse.json({ error: 'amount and order_id are required' }, { status: 400 });
        }

        // Check legality for the country
        if (countryCode) {
            const legality = await checkCryptoLegality(countryCode);
            if (!legality.allowed) {
                return NextResponse.json({
                    error: 'Crypto payments not available in this country',
                    reason: legality.reason
                }, { status: 403 });
            }

            // If restricted and stablecoin-only, force USDT
            if (legality.restricted && legality.stablecoin_only && payCurrency && !['usdt', 'usdc'].includes(payCurrency)) {
                return NextResponse.json({
                    error: 'Only stablecoin payments (USDT/USDC) allowed in this country',
                    allowed_currencies: ['usdt', 'usdc']
                }, { status: 400 });
            }
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com';

        const payment = await createCryptoPayment({
            price_amount: priceAmount,
            price_currency: priceCurrency,
            pay_currency: payCurrency || undefined,
            order_id: orderId,
            order_description: orderDescription,
            ipn_callback_url: `${appUrl}/api/crypto/ipn`,
        });

        const { error: paymentRecordError } = await getSupabaseAdmin()
            .from('hc_crypto_payment')
            .upsert({
                nowpayments_id: Number(payment.payment_id),
                payment_status: payment.payment_status,
                pay_address: payment.pay_address,
                pay_currency: payment.pay_currency || payCurrency || 'crypto',
                pay_amount: payment.pay_amount ?? null,
                actually_paid: 0,
                price_amount: payment.price_amount ?? priceAmount,
                price_currency: payment.price_currency || priceCurrency,
                purchase_id: payment.purchase_id || '',
                order_id: orderId,
                order_description: orderDescription,
                entity_id: user.id,
                booking_id: orderId,
                ipn_verified: false,
                platform_fee_pct: 2.5,
                platform_fee_amount: priceAmount * 0.025,
                payment_rail: 'nowpayments',
            }, {
                onConflict: 'nowpayments_id',
            });

        if (paymentRecordError) {
            console.error('[Crypto Checkout] Failed to record pending crypto payment:', paymentRecordError.message);
            return NextResponse.json({ error: 'Unable to record crypto payment' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            payment,
            legality: countryCode ? await checkCryptoLegality(countryCode) : null
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
