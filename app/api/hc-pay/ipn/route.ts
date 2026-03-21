/**
 * POST /api/hc-pay/ipn
 *
 * NOWPayments IPN (Instant Payment Notification) webhook handler.
 * Called when crypto payment status changes.
 *
 * Two safety layers:
 *   1. HMAC-SHA512 signature verification (rejects unsigned)
 *   2. Idempotency check before crediting ledger (no double-credit)
 *
 * Only credits the operator wallet when status = 'finished'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { verifyIpnSignature } from '@/lib/hc-pay/nowpayments';
import { writeLedgerEntry, getOrCreateWallet, recordRevenue } from '@/lib/hc-pay/ledger';
import { trySendNotification } from '@/lib/notifications/fcm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const sig = req.headers.get('x-nowpayments-sig') ?? '';

    // ── Layer 1: Signature verification ──
    const valid = await verifyIpnSignature(rawBody, sig);
    if (!valid) {
        console.warn('[HC Pay IPN] Invalid signature — rejecting');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let ipn: any;
    try {
        ipn = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Look up our payment record
    const { data: payment } = await supabase
        .from('nowpayments_payments')
        .select('*')
        .eq('nowpayments_payment_id', String(ipn.payment_id))
        .single();

    if (!payment) {
        console.warn('[HC Pay IPN] Unknown payment_id:', ipn.payment_id);
        return NextResponse.json({ received: true, unknown: true });
    }

    // Update payment status + store raw IPN
    const updateFields: Record<string, any> = {
        status: ipn.payment_status,
        actually_paid: ipn.actually_paid ?? null,
        outcome_amount_usd: ipn.outcome_amount ?? null,
        ipn_verified: true,
        raw_ipn: ipn,
        updated_at: new Date().toISOString(),
    };

    if (ipn.payment_status === 'confirmed') {
        updateFields.confirmed_at = new Date().toISOString();
    }
    if (ipn.payment_status === 'finished') {
        updateFields.finished_at = new Date().toISOString();
    }

    await supabase
        .from('nowpayments_payments')
        .update(updateFields)
        .eq('nowpayments_payment_id', String(ipn.payment_id));

    // ── Only credit the ledger when fully finished ──
    if (ipn.payment_status !== 'finished') {
        return NextResponse.json({ received: true, status: ipn.payment_status });
    }

    // ── Layer 2: Idempotency check ──
    const { count } = await supabase
        .from('hc_pay_ledger')
        .select('id', { count: 'exact', head: true })
        .eq('nowpayments_payment_id', String(ipn.payment_id));

    if ((count ?? 0) > 0) {
        console.log('[HC Pay IPN] Idempotent skip:', ipn.payment_id);
        return NextResponse.json({ received: true, idempotent: true });
    }

    // ── Credit operator wallet ──
    const outcomeUsd = parseFloat(ipn.outcome_amount ?? payment.price_amount);
    const netToOperator = payment.net_to_operator_usd ?? (outcomeUsd - (payment.hc_pay_fee_usd ?? 0));
    const hcFee = payment.hc_pay_fee_usd ?? 0;

    if (payment.payee_user_id) {
        const wallet = await getOrCreateWallet(payment.payee_user_id);

        const entryId = await writeLedgerEntry({
            walletId: wallet.id,
            userId: payment.payee_user_id,
            entryType: 'payment_received',
            amountUsd: netToOperator,
            direction: 'credit',
            referenceType: payment.reference_type,
            referenceId: payment.reference_id,
            counterpartyUserId: payment.payer_user_id,
            feeUsd: hcFee,
            cryptoCoin: payment.pay_currency,
            cryptoNetwork: payment.pay_network,
            cryptoAmount: parseFloat(ipn.actually_paid ?? payment.pay_amount),
            cryptoRateUsd: outcomeUsd / parseFloat(ipn.actually_paid || '1'),
            nowpaymentsPaymentId: String(ipn.payment_id),
            metadata: { ipn_status: ipn.payment_status, outcome_usd: outcomeUsd },
        });

        // Record HC Pay revenue
        await recordRevenue({
            source: 'crypto_fee',
            amountUsd: hcFee,
            ledgerEntryId: entryId,
            payerUserId: payment.payer_user_id,
            referenceType: payment.reference_type,
            referenceId: payment.reference_id,
        });

        // FCM push to operator
        trySendNotification({
            userId: payment.payee_user_id,
            type: 'quickpay_deposit',
            title: `$${netToOperator.toFixed(2)} received via ${payment.pay_currency}`,
            body: `Payment credited to your HC Pay wallet. Tap to view balance.`,
            data: {
                type: 'payment_received',
                referenceType: payment.reference_type ?? '',
                referenceId: payment.reference_id ?? '',
                screen: '/wallet',
            },
        }).catch(() => {});

        console.log(
            `[HC Pay IPN] Credited $${netToOperator} to ${payment.payee_user_id} ` +
            `(${payment.pay_currency}, fee: $${hcFee})`
        );
    }

    return NextResponse.json({
        received: true,
        credited: netToOperator,
        fee: hcFee,
        paymentId: ipn.payment_id,
    });
}
