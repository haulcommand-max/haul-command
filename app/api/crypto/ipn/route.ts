import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyIPNSignature } from '@/lib/crypto/nowpayments';

const supabaseAdmin = getSupabaseAdmin();

function isConfirmedPaymentStatus(status: unknown) {
    return status === 'confirmed' || status === 'finished';
}

function cleanIdentifier(value: unknown) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const clean = String(value).replace(/[^\w:-]/g, '').slice(0, 160);
    return clean || null;
}

function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mergeCryptoPaymentMetadata(existing: unknown, payment: {
    payment_id: unknown;
    pay_currency: unknown;
    actually_paid: unknown;
    payment_status: unknown;
}) {
    const existingRecord =
        existing && typeof existing === 'object' && !Array.isArray(existing)
            ? existing as Record<string, unknown>
            : {};

    return {
        ...existingRecord,
        crypto_payment_id: payment.payment_id,
        crypto_payment_status: payment.payment_status,
        crypto_pay_currency: payment.pay_currency,
        crypto_actually_paid: payment.actually_paid ?? 0,
        crypto_confirmed_at: new Date().toISOString(),
    };
}

/**
 * POST /api/crypto/ipn
 * Handle NOWPayments IPN (Instant Payment Notification) webhook
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-nowpayments-sig') || '';

        // Verify signature. Unsigned crypto payment callbacks must fail closed.
        if (!signature || !verifyIPNSignature(body, signature)) {
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
            return NextResponse.json({ error: 'IPN record failed' }, { status: 500 });
        }

        // If payment is confirmed, update the booking/order
        if (isConfirmedPaymentStatus(payment_status)) {
            const paymentIntentKey = cleanIdentifier(order_id);
            if (paymentIntentKey) {
                let paymentIntent =
                    (await supabaseAdmin
                        .from('hc_payment_intents')
                        .select('id, metadata')
                        .eq('booking_id', paymentIntentKey)
                        .maybeSingle()).data;

                if (!paymentIntent && isUuid(paymentIntentKey)) {
                    paymentIntent =
                        (await supabaseAdmin
                            .from('hc_payment_intents')
                            .select('id, metadata')
                            .eq('id', paymentIntentKey)
                            .maybeSingle()).data;
                }

                if (paymentIntent?.id) {
                    const { error: paymentIntentError } = await supabaseAdmin
                        .from('hc_payment_intents')
                        .update({
                            status: 'succeeded',
                            updated_at: new Date().toISOString(),
                            metadata: mergeCryptoPaymentMetadata(paymentIntent.metadata, {
                                payment_id,
                                pay_currency,
                                actually_paid,
                                payment_status,
                            }),
                        })
                        .eq('id', paymentIntent.id);

                    if (paymentIntentError) {
                        console.error('[IPN] hc_payment_intents update failed:', paymentIntentError.message);
                    }
                } else {
                    console.warn('[IPN] No hc_payment_intents row found for order_id:', paymentIntentKey);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[IPN] Error:', error);
        return NextResponse.json({ error: 'IPN processing failed' }, { status: 500 });
    }
}
