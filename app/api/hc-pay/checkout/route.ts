/**
 * POST /api/hc-pay/checkout
 *
 * Single entry point for all HC Pay payments — crypto or card.
 * Crypto → NOWPayments (1.5% fee, 0.5% rail cost, 1.0% spread)
 * Card   → existing Stripe flow (3.4% fee, 2.9% rail cost)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createPayment } from '@/lib/hc-pay/nowpayments';
import { calcCryptoFees, calcCardFees, getFeeSchedule } from '@/lib/hc-pay/fees';
import { getCoinBySymbol, COIN_CONFIGS } from '@/lib/hc-pay/coins';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const {
            amountUsd,
            paymentMethod,    // 'crypto' | 'card'
            coinSymbol,       // required if crypto: 'BTC', 'ADA', 'USDT', 'USDC', etc.
            referenceType,    // 'hold_request' | 'dispatch' | 'subscription' | 'load_payment'
            referenceId,
            payeeUserId,      // operator receiving the payment
            successUrl,
            cancelUrl,
        } = body;

        if (!amountUsd || amountUsd <= 0) {
            return NextResponse.json({ error: 'amountUsd must be positive' }, { status: 400 });
        }

        if (!paymentMethod || !['crypto', 'card'].includes(paymentMethod)) {
            return NextResponse.json({ error: 'paymentMethod must be crypto or card' }, { status: 400 });
        }

        if (!referenceType || !referenceId) {
            return NextResponse.json({ error: 'referenceType and referenceId required' }, { status: 400 });
        }

        // ── Crypto Payment ──
        if (paymentMethod === 'crypto') {
            if (!coinSymbol) {
                return NextResponse.json({ error: 'coinSymbol required for crypto' }, { status: 400 });
            }

            const coinConfig = getCoinBySymbol(coinSymbol);
            if (!coinConfig) {
                return NextResponse.json(
                    { error: `Unknown coin: ${coinSymbol}. Available: ${COIN_CONFIGS.map(c => c.symbol).join(', ')}` },
                    { status: 400 },
                );
            }

            const fees = calcCryptoFees(amountUsd);
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'https://haulcommand.com';

            // Create the NOWPayments payment
            const payment = await createPayment({
                priceAmountUsd: amountUsd,
                payCurrency: coinConfig.nowpaymentsCode,
                orderId: `${referenceType}:${referenceId}:${user.id}`,
                orderDescription: `HC Pay — ${referenceType.replace(/_/g, ' ')} #${referenceId.slice(0, 8)}`,
                ipnCallbackUrl: `${appUrl}/api/hc-pay/ipn`,
                successUrl: successUrl || `${appUrl}/wallet?status=success`,
                cancelUrl: cancelUrl || `${appUrl}/wallet?status=cancelled`,
            });

            // Record in nowpayments_payments table
            const admin = getSupabaseAdmin();
            await admin.from('nowpayments_payments').insert({
                nowpayments_payment_id: payment.payment_id,
                payer_user_id: user.id,
                payee_user_id: payeeUserId ?? null,
                reference_type: referenceType,
                reference_id: referenceId,
                pay_currency: coinSymbol,
                pay_network: coinConfig.network,
                pay_amount: payment.pay_amount,
                price_amount: amountUsd,
                hc_pay_fee_usd: fees.hcPayFeeUsd,
                nowpayments_fee_usd: fees.railCostUsd,
                net_to_operator_usd: fees.netToOperatorUsd,
                pay_address: payment.pay_address,
                status: 'waiting',
                expiration_estimate_date: payment.expiration_estimate_date,
            });

            return NextResponse.json({
                status: 'waiting',
                paymentId: payment.payment_id,
                payAddress: payment.pay_address,
                payAmount: payment.pay_amount,
                payCurrency: coinSymbol,
                payNetwork: coinConfig.networkLabel,
                networkFee: `~$${coinConfig.avgFeeUsd}`,
                confirmTime: `~${coinConfig.avgConfirmSeconds}s`,
                expiresAt: payment.expiration_estimate_date,
                fees: {
                    gross: fees.grossUsd,
                    fee: fees.hcPayFeeUsd,
                    feePercent: fees.feePercentage,
                    net: fees.netToOperatorUsd,
                },
            });
        }

        // ── Card Payment ──
        if (paymentMethod === 'card') {
            const fees = calcCardFees(amountUsd);

            // Card payments use existing Stripe checkout flow.
            // HC Pay records the ledger entry when payment_intent.succeeded fires.
            // Return fee info for the UI to show before redirecting to Stripe.
            return NextResponse.json({
                status: 'redirect_to_stripe',
                message: 'Use existing Stripe checkout. Ledger entry occurs on webhook.',
                fees: {
                    gross: fees.grossUsd,
                    fee: fees.hcPayFeeUsd,
                    feePercent: fees.feePercentage,
                    net: fees.netToOperatorUsd,
                },
                feeSchedule: getFeeSchedule(),
            });
        }

        return NextResponse.json({ error: 'Invalid paymentMethod' }, { status: 400 });

    } catch (err: any) {
        console.error('[HC Pay Checkout]', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
