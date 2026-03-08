/**
 * HAUL COMMAND — Stripe Webhook Handler (Next.js API Route)
 * POST /api/webhooks/stripe
 *
 * Processes critical Stripe events locally for speed:
 * - checkout.session.completed → create subscription state + grant credits
 * - customer.subscription.updated → sync status changes
 * - customer.subscription.deleted → mark canceled
 * - invoice.payment_succeeded → renew credits
 * - invoice.payment_failed → flag past_due
 * 
 * Also forwards to Supabase Edge Function for extended processing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Plan → monthly lead credits mapping
const PLAN_CREDITS: Record<string, number> = {
    'free': 0,
    'starter': 10,
    'commander': 50,
    'commander_pro': 150,
    'elite': 500,
    'broker_team': 100,
    'broker_enterprise': 500,
};

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[HC Stripe Webhook] Signature verification failed:', message);
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
    }

    const supabase = getSupabase();

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as unknown as Record<string, unknown>;
                const userId = (session.metadata as Record<string, string>)?.user_id;
                const planTier = (session.metadata as Record<string, string>)?.tier || 'starter';
                const stripeCustomerId = session.customer as string;
                const stripeSubscriptionId = session.subscription as string;

                if (userId) {
                    // Upsert subscription state
                    await supabase.from('subscription_states').upsert({
                        user_id: userId,
                        stripe_customer_id: stripeCustomerId,
                        stripe_subscription_id: stripeSubscriptionId,
                        plan_id: planTier,
                        plan_name: planTier.charAt(0).toUpperCase() + planTier.slice(1).replace(/_/g, ' '),
                        status: 'active',
                        monthly_lead_credits: PLAN_CREDITS[planTier] || 0,
                        current_period_start: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });

                    // Grant initial lead credits
                    const credits = PLAN_CREDITS[planTier] || 0;
                    if (credits > 0) {
                        await supabase.from('lead_credit_balances').upsert({
                            user_id: userId,
                            credits_remaining: credits,
                            credits_purchased_total: credits,
                            last_purchase_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        }, { onConflict: 'user_id' });
                    }

                    console.log(`[HC Stripe] Subscription activated: ${userId} → ${planTier} (${credits} credits)`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object as unknown as Record<string, unknown>;
                const metadata = sub.metadata as Record<string, string> | undefined;
                const userId = metadata?.user_id;

                if (userId) {
                    await supabase.from('subscription_states').update({
                        status: sub.status as string,
                        cancel_at_period_end: sub.cancel_at_period_end as boolean,
                        current_period_start: sub.current_period_start
                            ? new Date((sub.current_period_start as number) * 1000).toISOString()
                            : undefined,
                        current_period_end: sub.current_period_end
                            ? new Date((sub.current_period_end as number) * 1000).toISOString()
                            : undefined,
                        updated_at: new Date().toISOString(),
                    }).eq('user_id', userId);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as unknown as Record<string, unknown>;
                const metadata = sub.metadata as Record<string, string> | undefined;
                const userId = metadata?.user_id;

                if (userId) {
                    await supabase.from('subscription_states').update({
                        status: 'canceled',
                        plan_id: 'free',
                        monthly_lead_credits: 0,
                        updated_at: new Date().toISOString(),
                    }).eq('user_id', userId);

                    console.log(`[HC Stripe] Subscription canceled: ${userId}`);
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as unknown as Record<string, unknown>;
                const subId = invoice.subscription as string;

                // Renew monthly credits
                if (subId) {
                    const { data: subState } = await supabase
                        .from('subscription_states')
                        .select('user_id, plan_id, monthly_lead_credits')
                        .eq('stripe_subscription_id', subId)
                        .single();

                    if (subState && subState.monthly_lead_credits > 0) {
                        // Add credits (don't replace — accumulated unused credits are kept)
                        const { data: balance } = await supabase
                            .from('lead_credit_balances')
                            .select('credits_remaining')
                            .eq('user_id', subState.user_id)
                            .single();

                        const currentCredits = balance?.credits_remaining || 0;
                        await supabase.from('lead_credit_balances').upsert({
                            user_id: subState.user_id,
                            credits_remaining: currentCredits + subState.monthly_lead_credits,
                            updated_at: new Date().toISOString(),
                        }, { onConflict: 'user_id' });
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as unknown as Record<string, unknown>;
                const subId = invoice.subscription as string;

                if (subId) {
                    await supabase.from('subscription_states').update({
                        status: 'past_due',
                        updated_at: new Date().toISOString(),
                    }).eq('stripe_subscription_id', subId);
                }
                break;
            }
        }
    } catch (processErr) {
        console.error('[HC Stripe Webhook] Processing error:', processErr);
        // Don't return error — Stripe will retry
    }

    // Also forward to Supabase Edge Function for extended processing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
        try {
            await fetch(`${supabaseUrl}/functions/v1/hc-stripe-webhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'stripe-signature': sig,
                },
                body: JSON.stringify(event),
            });
        } catch (err) {
            console.error('[HC Stripe Webhook] Forward to Edge Function failed:', err);
        }
    }

    // PostHog event tracking
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        const metadata = (event.data?.object as unknown as Record<string, unknown>)?.metadata as Record<string, string> | undefined;
        const userId = metadata?.user_id;
        if (userId) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'}/capture/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
                        distinct_id: userId,
                        event: `stripe_${event.type.replace(/\./g, '_')}`,
                        properties: { event_type: event.type },
                    }),
                });
            } catch { /* non-blocking */ }
        }
    }

    return NextResponse.json({ received: true, type: event.type });
}

