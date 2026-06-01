/**
 * POST /api/hc-pay/checkout
 *
 * Single entry point for HC Pay payment intent creation. Payment rails stay
 * fail-closed until production guards, server-owned identities, and trusted
 * reference routing are satisfied.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createPayment } from '@/lib/hc-pay/nowpayments';
import { calcCryptoFees, calcCardFees, getFeeSchedule } from '@/lib/hc-pay/fees';
import { getCoinBySymbol, COIN_CONFIGS } from '@/lib/hc-pay/coins';
import { EMAIL_CONFIRMATION_REQUIRED, isEmailConfirmed } from '@/lib/auth/confirmed-user';
import {
    getCryptoCheckoutBlockReason,
    getStripeCheckoutBlockReason,
    isLocalUrl,
    isProductionRuntime,
} from '@/lib/launch/production-guards';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

const PAYEE_REQUIRED_REFERENCES = new Set(['hold_request', 'dispatch', 'load_payment']);

function resolveAppUrl(): string {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (configured && !(isProductionRuntime() && isLocalUrl(configured))) {
        return configured.replace(/\/+$/, '');
    }

    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) {
        return `https://${vercelUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
    }

    return 'https://www.haulcommand.com';
}

function coercePositiveAmount(value: unknown): number | null {
    const amount = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function normalizeReferenceId(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!isEmailConfirmed(user)) {
            return NextResponse.json(EMAIL_CONFIRMATION_REQUIRED, { status: 403 });
        }

        const body = await req.json();
        const amount = coercePositiveAmount(body.amountUsd);
        const paymentMethod = body.paymentMethod;
        const coinSymbol = typeof body.coinSymbol === 'string' ? body.coinSymbol : null;
        const referenceType = typeof body.referenceType === 'string' ? body.referenceType : null;
        const referenceId = normalizeReferenceId(body.referenceId);
        const successUrl = typeof body.successUrl === 'string' ? body.successUrl : undefined;
        const cancelUrl = typeof body.cancelUrl === 'string' ? body.cancelUrl : undefined;

        if (!amount) {
            return NextResponse.json({ error: 'amountUsd must be positive' }, { status: 400 });
        }

        if (!paymentMethod || !['crypto', 'card'].includes(paymentMethod)) {
            return NextResponse.json({ error: 'paymentMethod must be crypto or card' }, { status: 400 });
        }

        if (!referenceType || !referenceId) {
            return NextResponse.json({ error: 'referenceType and referenceId required' }, { status: 400 });
        }

        if (body.payeeUserId) {
            return NextResponse.json(
                { error: 'payeeUserId must be resolved server-side from the reference record, not supplied by the client.' },
                { status: 400 },
            );
        }

        if (PAYEE_REQUIRED_REFERENCES.has(referenceType)) {
            return NextResponse.json(
                { error: 'This HC Pay reference type requires server-side payee resolution before checkout.' },
                { status: 409 },
            );
        }

        if (paymentMethod === 'crypto') {
            const blockReason = getCryptoCheckoutBlockReason();
            if (blockReason) {
                return NextResponse.json(
                    { error: 'Crypto checkout is temporarily unavailable.', reason: blockReason },
                    { status: 503 },
                );
            }

            if (!coinSymbol) {
                return NextResponse.json({ error: 'coinSymbol required for crypto' }, { status: 400 });
            }

            const coinConfig = getCoinBySymbol(coinSymbol);
            if (!coinConfig) {
                return NextResponse.json(
                    { error: `Unknown coin: ${coinSymbol}. Available: ${COIN_CONFIGS.map((c) => c.symbol).join(', ')}` },
                    { status: 400 },
                );
            }

            const fees = calcCryptoFees(amount);
            const appUrl = resolveAppUrl();
            const admin = getSupabaseAdmin();
            const reservationId = randomUUID();
            const pendingPaymentId = `pending:${reservationId}`;

            const { data: reservation, error: reservationError } = await admin.from('nowpayments_payments').insert({
                nowpayments_payment_id: pendingPaymentId,
                payer_user_id: user.id,
                payee_user_id: null,
                reference_type: referenceType,
                reference_id: referenceId,
                pay_currency: coinSymbol,
                pay_network: coinConfig.network,
                pay_amount: null,
                price_amount: amount,
                hc_pay_fee_usd: fees.hcPayFeeUsd,
                nowpayments_fee_usd: fees.railCostUsd,
                net_to_operator_usd: fees.netToOperatorUsd,
                status: 'waiting',
            }).select('id').single();

            if (reservationError || !reservation?.id) {
                console.error('[HC Pay Checkout] Failed to reserve NOWPayments payment:', reservationError);
                return NextResponse.json({ error: 'Unable to reserve crypto checkout.' }, { status: 500 });
            }

            const payment = await createPayment({
                priceAmountUsd: amount,
                payCurrency: coinConfig.nowpaymentsCode,
                orderId: reservation.id,
                orderDescription: `HC Pay - ${referenceType.replace(/_/g, ' ')} #${referenceId.slice(0, 8)}`,
                ipnCallbackUrl: `${appUrl}/api/hc-pay/ipn`,
                successUrl: successUrl || `${appUrl}/wallet?status=success`,
                cancelUrl: cancelUrl || `${appUrl}/wallet?status=cancelled`,
            });

            const { error: updateError } = await admin.from('nowpayments_payments').update({
                nowpayments_payment_id: payment.payment_id,
                pay_amount: payment.pay_amount,
                pay_address: payment.pay_address,
                payment_url: payment.invoice_url ?? null,
                status: 'waiting',
                expiration_estimate_date: payment.expiration_estimate_date,
                updated_at: new Date().toISOString(),
            }).eq('id', reservation.id);

            if (updateError) {
                console.error('[HC Pay Checkout] Failed to attach NOWPayments payment:', updateError);
                return NextResponse.json({ error: 'Payment created but could not be recorded.' }, { status: 500 });
            }

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

        const blockReason = getStripeCheckoutBlockReason();
        if (blockReason) {
            return NextResponse.json(
                { error: 'Card checkout is temporarily unavailable.', reason: blockReason },
                { status: 503 },
            );
        }

        const fees = calcCardFees(amount);
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
    } catch (err: unknown) {
        console.error('[HC Pay Checkout]', err);
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
