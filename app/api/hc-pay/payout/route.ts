/**
 * POST /api/hc-pay/payout
 *
 * Request payout from HC Pay wallet to operator's bank via Stripe Connect.
 * QuickPay (instant): 2.5% fee | Standard (next-day): 0% fee.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getOrCreateWallet, writeLedgerEntry, recordRevenue } from '@/lib/hc-pay/ledger';
import { calcQuickPayFee } from '@/lib/hc-pay/fees';
import { stripe } from '@/lib/stripe/client';
import { resolvePayoutReadyConnectAccount } from '@/lib/stripe/connect-readiness';
import { EMAIL_CONFIRMATION_REQUIRED, isEmailConfirmed } from '@/lib/auth/confirmed-user';
import { getStripeCheckoutBlockReason } from '@/lib/launch/production-guards';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const blockReason = getStripeCheckoutBlockReason();
        if (blockReason) {
            return NextResponse.json(
                { error: 'HC Pay payouts are temporarily unavailable.', reason: blockReason },
                { status: 503 },
            );
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!isEmailConfirmed(user)) {
            return NextResponse.json(EMAIL_CONFIRMATION_REQUIRED, { status: 403 });
        }

        const { amountUsd, payoutType = 'standard' } = await req.json();
        const amount = Number(amountUsd);

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ error: 'amountUsd must be positive' }, { status: 400 });
        }
        if (!['quickpay', 'standard'].includes(payoutType)) {
            return NextResponse.json({ error: 'payoutType: quickpay or standard' }, { status: 400 });
        }

        const wallet = await getOrCreateWallet(user.id);

        if (wallet.is_frozen) {
            return NextResponse.json({ error: 'Wallet frozen. Contact support.' }, { status: 403 });
        }
        if (amount > parseFloat(wallet.balance_usd)) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }

        const { fee, net } = payoutType === 'quickpay'
            ? calcQuickPayFee(amount)
            : { fee: 0, net: amount };

        const admin = getSupabaseAdmin();
        const connectAccount = await resolvePayoutReadyConnectAccount(user.id);
        if (!connectAccount.ok) {
            return NextResponse.json(connectAccount, { status: connectAccount.status });
        }

        // Reserve payout before any external money movement.
        const { data: payout, error: payoutError } = await admin.from('hc_pay_payouts').insert({
            wallet_id: wallet.id,
            user_id: user.id,
            amount_usd: amount,
            payout_type: payoutType,
            fee_usd: fee,
            net_usd: net,
            status: 'pending_transfer',
            estimated_arrival: payoutType === 'quickpay'
                ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }).select('id, estimated_arrival').single();

        if (payoutError || !payout?.id) {
            console.error('[HC Pay Payout] Failed to reserve payout:', payoutError);
            return NextResponse.json({ error: 'Unable to reserve payout' }, { status: 500 });
        }

        // Debit the wallet via atomic ledger write before Stripe transfer.
        const entryId = await writeLedgerEntry({
            walletId: wallet.id,
            userId: user.id,
            entryType: payoutType === 'quickpay' ? 'quickpay_payout' : 'standard_payout',
            amountUsd: amount,
            direction: 'debit',
            feeUsd: fee,
            referenceType: 'payout',
            referenceId: payout.id,
            metadata: { payout_type: payoutType, net_usd: net },
        });

        let transfer;
        try {
            transfer = await stripe.transfers.create({
                amount: Math.round(net * 100),
                currency: 'usd',
                destination: connectAccount.accountId,
                metadata: {
                    user_id: user.id,
                    payout_type: payoutType,
                    type: 'hc_pay_payout',
                    wallet_id: wallet.id,
                    payout_id: payout.id,
                    connect_source: connectAccount.source,
                },
            });
        } catch (stripeError: unknown) {
            const stripeMessage = stripeError instanceof Error ? stripeError.message : 'Stripe transfer failed';
            console.error('[HC Pay Payout] Stripe transfer failed:', stripeError);
            await admin.from('hc_pay_payouts').update({
                status: 'failed',
                failure_reason: stripeMessage,
                updated_at: new Date().toISOString(),
            }).eq('id', payout.id);
            await writeLedgerEntry({
                walletId: wallet.id,
                userId: user.id,
                entryType: 'payout_reversal',
                amountUsd: amount,
                direction: 'credit',
                feeUsd: 0,
                referenceType: 'payout',
                referenceId: payout.id,
                note: 'Automatic reversal after Stripe transfer failure',
                metadata: { original_ledger_entry_id: entryId, payout_type: payoutType },
            });
            return NextResponse.json({ error: 'Payout transfer failed. Wallet debit was reversed.' }, { status: 500 });
        }

        await admin.from('hc_pay_payouts').update({
            stripe_transfer_id: transfer.id,
            status: 'processing',
            updated_at: new Date().toISOString(),
        }).eq('id', payout.id);

        // Record QuickPay fee as revenue
        if (fee > 0) {
            await recordRevenue({
                source: 'quickpay_fee',
                amountUsd: fee,
                ledgerEntryId: entryId,
                payerUserId: user.id,
                referenceType: 'payout',
                referenceId: payout.id,
            });
        }

        return NextResponse.json({
            payoutId: payout.id,
            amountUsd: amount,
            feeUsd: fee,
            netUsd: net,
            payoutType,
            estimatedArrival: payout.estimated_arrival,
            status: 'processing',
        });

    } catch (err: unknown) {
        console.error('[HC Pay Payout]', err);
        const message = err instanceof Error ? err.message : 'Internal error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
