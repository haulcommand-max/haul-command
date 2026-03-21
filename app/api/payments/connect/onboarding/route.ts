/**
 * POST /api/payments/connect/onboarding
 *
 * Creates a Stripe Connect Express account for an operator
 * and returns the onboarding link.
 *
 * This is required before an operator can use QuickPay.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getStripeClient } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if they already have a Connect account
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_connect_account_id, display_name, email')
            .eq('id', user.id)
            .single();

        const stripe = getStripeClient();
        let connectAccountId = profile?.stripe_connect_account_id;

        // Create Connect Express account if none exists
        if (!connectAccountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                email: profile?.email || user.email,
                metadata: {
                    hc_user_id: user.id,
                    hc_display_name: profile?.display_name || '',
                },
                capabilities: {
                    transfers: { requested: true },
                },
                settings: {
                    payouts: {
                        schedule: { interval: 'manual' }, // We control payouts via QuickPay
                    },
                },
            });

            connectAccountId = account.id;

            // Save to profile
            await supabase
                .from('profiles')
                .update({ stripe_connect_account_id: connectAccountId })
                .eq('id', user.id);
        }

        // Create onboarding link
        const origin = request.headers.get('origin') || 'https://haulcommand.com';
        const accountLink = await stripe.accountLinks.create({
            account: connectAccountId,
            refresh_url: `${origin}/operator/connect-stripe?refresh=true`,
            return_url: `${origin}/operator/connect-stripe?success=true`,
            type: 'account_onboarding',
        });

        return NextResponse.json({
            status: 'ok',
            onboarding_url: accountLink.url,
            connect_account_id: connectAccountId,
        });

    } catch (error: any) {
        console.error('[Connect Onboarding] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create Connect account' },
            { status: 500 },
        );
    }
}
