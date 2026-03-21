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

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { amountUsd, payoutType = 'standard' } = await req.json();

        if (!amountUsd || amountUsd <= 0) {
            return NextResponse.json({ error: 'amountUsd must be positive' }, { status: 400 });
        }
        if (!['quickpay', 'standard'].includes(payoutType)) {
            return NextResponse.json({ error: 'payoutType: quickpay or standard' }, { status: 400 });
        }

        const wallet = await getOrCreateWallet(user.id);

        if (wallet.is_frozen) {
            return NextResponse.json({ error: 'Wallet frozen. Contact support.' }, { status: 403 });
        }
        if (amountUsd > parseFloat(wallet.balance_usd)) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }

        const { fee, net } = payoutType === 'quickpay'
            ? calcQuickPayFee(amountUsd)
            : { fee: 0, net: amountUsd };

        // Get operator's Stripe Connect account
        const admin = getSupabaseAdmin();
        const { data: profile } = await admin
            .from('profiles')
            .select('stripe_connect_account_id')
            .eq('id', user.id)
            .single();

        if (!profile?.stripe_connect_account_id) {
            return NextResponse.json({
                error: 'No payout account. Complete Stripe onboarding at /api/payments/connect/onboarding first.',
            }, { status: 400 });
        }

        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
            amount: Math.round(net * 100),
            currency: 'usd',
            destination: profile.stripe_connect_account_id,
            metadata: {
                user_id: user.id,
                payout_type: payoutType,
                type: 'hc_pay_payout',
                wallet_id: wallet.id,
            },
        });

        // Record payout
        const { data: payout } = await admin.from('hc_pay_payouts').insert({
            wallet_id: wallet.id,
            user_id: user.id,
            amount_usd: amountUsd,
            payout_type: payoutType,
            fee_usd: fee,
            net_usd: net,
            stripe_transfer_id: transfer.id,
            status: 'processing',
            estimated_arrival: payoutType === 'quickpay'
                ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }).select('id, estimated_arrival').single();

        // Debit the wallet via atomic ledger write
        const entryId = await writeLedgerEntry({
            walletId: wallet.id,
            userId: user.id,
            entryType: payoutType === 'quickpay' ? 'quickpay_payout' : 'standard_payout',
            amountUsd,
            direction: 'debit',
            feeUsd: fee,
            referenceType: 'payout',
            referenceId: payout?.id ?? transfer.id,
            stripePaymentIntentId: transfer.id,
            metadata: { payout_type: payoutType, net_usd: net },
        });

        // Record QuickPay fee as revenue
        if (fee > 0) {
            await recordRevenue({
                source: 'quickpay_fee',
                amountUsd: fee,
                ledgerEntryId: entryId,
                payerUserId: user.id,
                referenceType: 'payout',
                referenceId: payout?.id,
            });
        }

        return NextResponse.json({
            payoutId: payout?.id,
            amountUsd,
            feeUsd: fee,
            netUsd: net,
            payoutType,
            estimatedArrival: payout?.estimated_arrival,
            status: 'processing',
        });

    } catch (err: any) {
        console.error('[HC Pay Payout]', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
