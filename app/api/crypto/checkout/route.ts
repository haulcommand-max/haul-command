import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createCryptoPayment, checkCryptoLegality } from '@/lib/crypto/nowpayments';

/**
 * POST /api/crypto/checkout
 * Create a crypto payment via NOWPayments
 * 
 * Body: { amount, currency, pay_currency, order_id, description, country_code }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { amount, currency, pay_currency, order_id, description, country_code } = body;

        if (!amount || !order_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check legality for the country
        if (country_code) {
            const legality = await checkCryptoLegality(country_code);
            if (!legality.allowed) {
                return NextResponse.json({
                    error: 'Crypto payments not available in this country',
                    reason: legality.reason
                }, { status: 403 });
            }

            // If restricted and stablecoin-only, force USDT
            if (legality.restricted && legality.stablecoin_only && pay_currency && !['usdt', 'usdc'].includes(pay_currency.toLowerCase())) {
                return NextResponse.json({
                    error: 'Only stablecoin payments (USDT/USDC) allowed in this country',
                    allowed_currencies: ['usdt', 'usdc']
                }, { status: 400 });
            }
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com';

        const payment = await createCryptoPayment({
            price_amount: amount,
            price_currency: currency || 'usd',
            pay_currency: pay_currency || undefined,
            order_id,
            order_description: description || `Haul Command Payment ${order_id}`,
            ipn_callback_url: `${appUrl}/api/crypto/ipn`,
        });

        return NextResponse.json({
            success: true,
            payment,
            legality: country_code ? await checkCryptoLegality(country_code) : null
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
