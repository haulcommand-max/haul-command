/**
 * POST /api/payments/quickpay
 *
 * Haul Command — QuickPay Instant Payout API
 *
 * Processes a QuickPay request:
 * 1. Validates the operator is authenticated and has a Stripe Connect account
 * 2. Runs risk assessment on the broker
 * 3. Creates a Stripe Transfer to the operator's Connect account
 * 4. Initiates an instant payout (if available) or standard payout
 * 5. Logs everything to quickpay_transactions
 *
 * Request body:
 *   {
 *     booking_id: string,
 *     broker_id: string,
 *     gross_amount_cents: number,
 *     currency?: string
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';
import { resolvePayoutReadyConnectAccount } from '@/lib/stripe/connect-readiness';
import { EMAIL_CONFIRMATION_REQUIRED, isEmailConfirmed } from '@/lib/auth/confirmed-user';
import { getStripeCheckoutBlockReason } from '@/lib/launch/production-guards';

const QUICKPAY_FEE_PERCENTAGE = 2.50;
const MAX_QUICKPAY_CENTS = 1_000_000; // $10,000 cap

export async function POST(request: NextRequest) {
    try {
        const blockReason = getStripeCheckoutBlockReason();
        if (blockReason) {
            return NextResponse.json(
                { error: 'QuickPay is temporarily unavailable.', reason: blockReason },
                { status: 503 },
            );
        }

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!isEmailConfirmed(user)) {
            return NextResponse.json(EMAIL_CONFIRMATION_REQUIRED, { status: 403 });
        }

        const body = await request.json();
        const {
            booking_id,
            broker_id,
            gross_amount_cents,
            currency = 'usd',
        } = body;

        // ── Validation ──
        if (!booking_id || !broker_id || !gross_amount_cents) {
            return NextResponse.json(
                { error: 'Missing required fields: booking_id, broker_id, gross_amount_cents' },
                { status: 400 },
            );
        }

        if (gross_amount_cents > MAX_QUICKPAY_CENTS) {
            return NextResponse.json(
                { error: `QuickPay maximum is $${MAX_QUICKPAY_CENTS / 100}. Contact support for larger amounts.` },
                { status: 400 },
            );
        }

        if (gross_amount_cents < 500) {
            return NextResponse.json(
                { error: 'Minimum QuickPay amount is $5.00' },
                { status: 400 },
            );
        }

        // ── 1. Get operator's Stripe Connect account ──
        const connectAccount = await resolvePayoutReadyConnectAccount(user.id);

        if (!connectAccount.ok) {
            return NextResponse.json(
                {
                    error: connectAccount.error,
                    action: connectAccount.action,
                    redirect: connectAccount.redirect,
                    requirements_due: connectAccount.requirementsDue ?? [],
                },
                { status: connectAccount.status },
            );
        }

        // ── 2. Risk assessment ──
        const { data: riskData, error: riskError } = await supabase.rpc('assess_quickpay_risk', {
            p_broker_id: broker_id,
            p_amount_cents: gross_amount_cents,
        });

        if (riskError) {
            console.error('[QuickPay] Risk assessment failed:', riskError);
            return NextResponse.json(
                { error: 'Risk assessment failed. Try again later.' },
                { status: 500 },
            );
        }

        if (!riskData?.approved) {
            // Log the declined request
            await supabase.from('quickpay_transactions').insert({
                operator_id: user.id,
                broker_id,
                booking_id,
                gross_amount_cents,
                fee_amount_cents: 0,
                net_payout_cents: 0,
                fee_percentage: QUICKPAY_FEE_PERCENTAGE,
                currency,
                status: 'risk_review',
                risk_score: riskData?.risk_score || 0,
                risk_flags: riskData?.risk_flags || [],
                broker_payment_history_ok: false,
                broker_dispute_count: riskData?.dispute_count || 0,
                stripe_connect_account: connectAccount.accountId,
            });

            return NextResponse.json(
                {
                    error: 'QuickPay not available for this broker at this time.',
                    reason: 'risk_review',
                    risk_score: riskData?.risk_score,
                    flags: riskData?.risk_flags,
                },
                { status: 403 },
            );
        }

        // ── 3. Calculate fees ──
        const feeCents = Math.round(gross_amount_cents * (QUICKPAY_FEE_PERCENTAGE / 100));
        const netPayoutCents = gross_amount_cents - feeCents;

        // ── 4. Reserve a durable QuickPay row before external money movement ──
        const { data: pendingTxn, error: pendingTxnError } = await supabase.from('quickpay_transactions').insert({
            operator_id: user.id,
            broker_id,
            booking_id,
            gross_amount_cents,
            fee_amount_cents: feeCents,
            net_payout_cents: netPayoutCents,
            fee_percentage: QUICKPAY_FEE_PERCENTAGE,
            currency,
            stripe_connect_account: connectAccount.accountId,
            status: 'pending_transfer',
            risk_score: riskData?.risk_score || 0,
            risk_flags: riskData?.risk_flags || [],
            broker_payment_history_ok: true,
            broker_dispute_count: riskData?.dispute_count || 0,
            approved_at: new Date().toISOString(),
        }).select('id').single();

        if (pendingTxnError || !pendingTxn?.id) {
            console.error('[QuickPay] Transaction reservation failed:', pendingTxnError);
            return NextResponse.json(
                { error: 'QuickPay already exists or could not be reserved for this booking.' },
                { status: pendingTxnError?.code === '23505' ? 409 : 500 },
            );
        }

        // ── 5. Create Stripe Transfer to operator's Connect account ──
        const stripe = getStripeClient();
        let transfer;

        try {
            transfer = await stripe.transfers.create({
                amount: netPayoutCents,
                currency,
                destination: connectAccount.accountId,
                description: `QuickPay: Booking ${booking_id}`,
                metadata: {
                    booking_id,
                    broker_id,
                    operator_id: user.id,
                    quickpay_transaction_id: pendingTxn.id,
                    fee_cents: feeCents.toString(),
                    gross_cents: gross_amount_cents.toString(),
                    type: 'quickpay',
                    connect_source: connectAccount.source,
                },
            });
        } catch (stripeError: unknown) {
            const stripeMessage = stripeError instanceof Error ? stripeError.message : 'Stripe transfer failed';
            console.error('[QuickPay] Stripe transfer failed:', stripeError);

            await supabase.from('quickpay_transactions').update({
                status: 'failed',
                failure_reason: stripeMessage,
                updated_at: new Date().toISOString(),
                failed_at: new Date().toISOString(),
            }).eq('id', pendingTxn.id);

            return NextResponse.json(
                { error: 'Payment transfer failed. Please try again or contact support.' },
                { status: 500 },
            );
        }

        // ── 6. Attempt instant payout (if the Connect account supports it) ──
        let payout = null;
        try {
            payout = await stripe.payouts.create(
                {
                    amount: netPayoutCents,
                    currency,
                    method: 'instant',
                    description: `QuickPay instant payout: ${booking_id}`,
                },
                { stripeAccount: connectAccount.accountId },
            );
        } catch {
            // Instant payout not available — will use standard (1-2 business days)
            // This is fine — the transfer is already done
            console.log('[QuickPay] Instant payout not available, using standard payout schedule');
        }

        // ── 7. Finalize transaction record ──
        const { data: txn, error: txnError } = await supabase.from('quickpay_transactions').update({
            stripe_transfer_id: transfer.id,
            stripe_payout_id: payout?.id || null,
            status: payout ? 'completed' : 'transferring',
            transferred_at: new Date().toISOString(),
            completed_at: payout ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        }).eq('id', pendingTxn.id).select().single();

        if (txnError) {
            console.error('[QuickPay] Transaction log failed:', txnError);
        }

        return NextResponse.json({
            status: 'success',
            transaction_id: txn?.id,
            gross_amount: gross_amount_cents / 100,
            fee_amount: feeCents / 100,
            fee_percentage: QUICKPAY_FEE_PERCENTAGE,
            net_payout: netPayoutCents / 100,
            currency,
            payout_method: payout ? 'instant' : 'standard',
            payout_eta: payout ? 'minutes' : '1-2 business days',
            stripe_transfer_id: transfer.id,
            stripe_payout_id: payout?.id || null,
        });

    } catch (error: unknown) {
        console.error('[QuickPay] Unhandled error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
