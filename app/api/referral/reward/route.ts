/**
 * POST /api/referral/reward
 *
 * Called by Stripe webhook or admin when a referred operator upgrades to paid.
 * Qualifies the reward and applies $25 credit to referrer's subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { referred_user_id } = body;

        // Accept from webhook or internal call (verify CRON_SECRET for security)
        const secret = req.headers.get('x-ops-secret') || req.nextUrl.searchParams.get('secret');
        if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!referred_user_id) {
            return NextResponse.json({ error: 'referred_user_id required' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();

        // Find pending reward for this referred user
        const { data: reward, error: fetchErr } = await admin
            .from('referral_rewards')
            .select('*, referral_codes(operator_id)')
            .eq('referred_id', referred_user_id)
            .eq('status', 'pending')
            .single();

        if (fetchErr || !reward) {
            return NextResponse.json({ ok: true, message: 'No pending reward found for this user.' });
        }

        const stripe = getStripeClient();

        // Get referrer's Stripe customer ID
        const { data: referrerProfile } = await admin
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', reward.referrer_id)
            .single();

        let creditId = null;

        if (referrerProfile?.stripe_customer_id) {
            // Apply $25 credit to referrer's account via Stripe customer balance
            const balanceTransaction = await stripe.customers.createBalanceTransaction(
                referrerProfile.stripe_customer_id,
                {
                    amount: -2500, // negative = credit (in cents)
                    currency: 'usd',
                    description: `Referral reward — new operator signed up via your link`,
                    metadata: {
                        type: 'referral_reward',
                        reward_id: reward.id,
                        referred_id: referred_user_id,
                    },
                }
            );
            creditId = balanceTransaction.id;
        }

        // Update reward status
        await admin
            .from('referral_rewards')
            .update({
                status: 'paid',
                paid_at: new Date().toISOString(),
                stripe_credit_id: creditId,
            })
            .eq('id', reward.id);

        // Record as platform expense in revenue table (negative)
        await admin.from('hc_pay_revenue').insert({
            source: 'referral_reward',
            amount_usd: -25.00,
            reference_id: reward.id,
            metadata: {
                referrer_id: reward.referrer_id,
                referred_id: referred_user_id,
                stripe_credit_id: creditId,
            },
        });

        return NextResponse.json({
            ok: true,
            reward_id: reward.id,
            status: 'paid',
            credit_amount_usd: 25.00,
            stripe_credit_id: creditId,
            referrer_id: reward.referrer_id,
        });
    } catch (err: any) {
        console.error('[referral/reward] Error:', err);
        return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
    }
}
