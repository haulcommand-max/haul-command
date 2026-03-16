import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyIPNSignature } from '@/lib/crypto/nowpayments';

const supabaseAdmin = getSupabaseAdmin();

/**
 * POST /api/crypto/ipn
 * Handle NOWPayments IPN (Instant Payment Notification) webhook
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-nowpayments-sig') || '';

        // Verify signature
        if (signature && !verifyIPNSignature(body, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(body);
        const {
            payment_id,
            payment_status,
            pay_address,
            pay_currency,
            pay_amount,
            actually_paid,
            price_amount,
            price_currency,
            outcome_amount,
            outcome_currency,
            purchase_id,
            order_id,
            order_description,
        } = payload;

        // Upsert crypto payment record
        const { error } = await supabaseAdmin
            .from('hc_crypto_payment')
            .upsert({
                nowpayments_id: payment_id,
                payment_status,
                pay_address,
                pay_currency,
                pay_amount,
                actually_paid: actually_paid || 0,
                price_amount,
                price_currency,
                outcome_amount: outcome_amount || 0,
                outcome_currency: outcome_currency || price_currency,
                purchase_id: String(purchase_id || ''),
                order_id: order_id || '',
                order_description: order_description || '',
                ipn_received_at: new Date().toISOString(),
                ipn_verified: !!signature,
                platform_fee_pct: 2.5,
                platform_fee_amount: (price_amount || 0) * 0.025,
                payment_rail: 'nowpayments',
            }, {
                onConflict: 'nowpayments_id',
            });

        if (error) {
            console.error('[IPN] Supabase error:', error);
        }

        // If payment is confirmed, update the booking/order
        if (payment_status === 'confirmed' || payment_status === 'finished') {
            // Update the corresponding hc_payment_intents or direct booking
            if (order_id) {
                await supabaseAdmin
                    .from('hc_payment_intents')
                    .update({
                        status: 'succeeded',
                        paid_at: new Date().toISOString(),
                        metadata: { crypto_payment_id: payment_id, pay_currency, actually_paid }
                    })
                    .eq('id', order_id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[IPN] Error:', error);
        return NextResponse.json({ error: 'IPN processing failed' }, { status: 500 });
    }
}
