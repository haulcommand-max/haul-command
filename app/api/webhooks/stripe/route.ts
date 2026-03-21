/**
 * ═══════════════════════════════════════════════════════════════
 * HAUL COMMAND — UNIFIED STRIPE WEBHOOK HANDLER
 * POST /api/webhooks/stripe
 * 
 * MERGED FROM 5 REDUNDANT HANDLERS:
 *  1. /api/webhooks/stripe          — subscription + credits (PRIMARY)
 *  2. /api/stripe/webhook           — billing_customers + entitlements + booking payment
 *  3. /api/subscriptions/webhook    — profiles subscription_tier sync
 *  4. /api/sponsorships/webhook     — port + corridor + adgrid sponsorships
 *  5. /api/enterprise/billing/stripe/webhook — enterprise event logging + dedup
 * 
 * Now ONE handler processes ALL Stripe events:
 *  - checkout.session.completed
 *  - customer.subscription.created/updated/deleted
 *  - invoice.payment_succeeded/failed
 *  - payment_intent.succeeded/failed/canceled
 *  - transfer.created/paid
 * 
 * Point your Stripe webhook endpoint to: /api/webhooks/stripe
 * Delete the other 4 routes after verifying.
 * ═══════════════════════════════════════════════════════════════
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/client';
import { trySendNotification } from '@/lib/notifications/fcm';
import { quickpayDepositTemplate } from '@/lib/notifications/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Plan → credit mapping ──
const PLAN_CREDITS: Record<string, number> = {
    free: 0, starter: 10, commander: 50,
    commander_pro: 150, elite: 500,
    broker_team: 100, broker_enterprise: 500,
    basic: 5, pro: 50, enterprise: 1000,
};

// ── Tier detection (from price ID or metadata) ──
function tierFromMetadataOrPrice(metadata?: Record<string, string> | null, priceId?: string | null): string {
    if (metadata?.tier) return metadata.tier;
    if (!priceId) return 'free';
    if (process.env.STRIPE_PRICE_ELITE && priceId === process.env.STRIPE_PRICE_ELITE) return 'elite';
    if (process.env.STRIPE_PRICE_PRO && priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
    if (process.env.STRIPE_PRICE_BASIC && priceId === process.env.STRIPE_PRICE_BASIC) return 'basic';
    if (priceId.includes('elite')) return 'elite';
    if (priceId.includes('pro')) return 'pro';
    if (priceId.includes('commander')) return 'commander';
    return 'basic';
}

function entitlementsFromTier(tier: string) {
    switch (tier) {
        case 'elite': case 'enterprise':
            return { tier, gps_ping_interval_seconds: 15, priority_dispatch: true, proximity_boost: true };
        case 'pro': case 'commander': case 'commander_pro':
            return { tier, gps_ping_interval_seconds: 30, priority_dispatch: false, proximity_boost: true };
        case 'basic': case 'starter':
            return { tier, gps_ping_interval_seconds: 60, priority_dispatch: false, proximity_boost: false };
        default:
            return { tier: 'free', gps_ping_interval_seconds: 90, priority_dispatch: false, proximity_boost: false };
    }
}

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event: any;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[HC Stripe] Signature verification failed:', message);
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // ── ENTERPRISE DEDUP: Log every event (prevents double-processing) ──
    const { error: dedupErr } = await supabase.from('stripe_webhook_events').insert({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event,
        processing_status: 'pending',
    });
    if (dedupErr && dedupErr.code === '23505') {
        // Duplicate event — already processed
        return NextResponse.json({ received: true, deduped: true });
    }

    try {
        switch (event.type) {
            // ═══════════════════════════════════════════════════════
            // CHECKOUT COMPLETED
            // Handles: subscriptions, sponsorships, adgrid bids
            // ═══════════════════════════════════════════════════════
            case 'checkout.session.completed': {
                const session = event.data.object as any;
                const meta = session.metadata || {};
                const userId = meta.user_id;
                const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
                const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

                // ── A) Regular subscription activation ──
                if (userId && session.mode === 'subscription') {
                    const planTier = meta.tier || tierFromMetadataOrPrice(meta);

                    // Update profiles (from subscriptions webhook)
                    await supabase.from('profiles').update({
                        subscription_tier: planTier,
                        subscription_platform: meta.platform || 'stripe',
                        subscription_status: 'active',
                        stripe_subscription_id: stripeSubscriptionId,
                        stripe_customer_id: stripeCustomerId,
                        subscription_country: meta.country_code,
                        updated_at: new Date().toISOString(),
                    }).eq('id', userId);

                    // Upsert subscription_states (from webhooks/stripe)
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

                    // Upsert billing_customers (from stripe/webhook)
                    await supabase.from('billing_customers').upsert({
                        user_id: userId,
                        stripe_customer_id: stripeCustomerId,
                        updated_at: new Date().toISOString(),
                    });

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

                    // Upsert billing_subscriptions + operator_entitlements
                    if (stripeSubscriptionId) {
                        try {
                            const sub: any = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
                                expand: ['items.data.price.product'],
                            });
                            const price = sub.items?.data?.[0]?.price;
                            const priceId = price?.id ?? null;
                            const productId = typeof price?.product === 'string' ? price.product : price?.product?.id ?? null;
                            const resolvedTier = tierFromMetadataOrPrice(meta, priceId);

                            await supabase.from('billing_subscriptions').upsert({
                                user_id: userId,
                                stripe_subscription_id: sub.id,
                                status: sub.status,
                                price_id: priceId,
                                product_id: productId,
                                current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
                                current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                                cancel_at_period_end: sub.cancel_at_period_end,
                                metadata: sub.metadata ?? {},
                                updated_at: new Date().toISOString(),
                            }, { onConflict: 'stripe_subscription_id' });

                            await supabase.from('operator_entitlements').upsert({
                                user_id: userId,
                                ...entitlementsFromTier(resolvedTier),
                                updated_at: new Date().toISOString(),
                                source: 'stripe',
                                raw: { stripe_subscription_id: sub.id, status: sub.status, price_id: priceId },
                            });
                        } catch { /* Subscription retrieval failed — non-blocking */ }
                    }

                    console.log(`[HC Stripe] Subscription activated: ${userId} → ${planTier}`);
                }

                // ── B) Port sponsorship activation ──
                if (meta.type === 'port_sponsorship' && meta.sponsorship_id) {
                    await supabase.from('port_sponsorships').update({
                        status: 'active',
                        stripe_subscription_id: stripeSubscriptionId,
                        starts_at: new Date().toISOString(),
                        notes: 'Payment confirmed via Stripe',
                    }).eq('id', meta.sponsorship_id);

                    if (meta.tier === 'domination') {
                        await supabase.from('port_sponsorships')
                            .update({ status: 'expired', notes: 'Outbid' })
                            .eq('port_id', meta.port_id)
                            .eq('tier', 'domination')
                            .eq('status', 'active')
                            .neq('id', meta.sponsorship_id);
                    }
                    console.log(`[HC Stripe] Port sponsorship ${meta.sponsorship_id} activated`);
                }

                // ── C) Corridor sponsorship activation ──
                if (meta.type === 'corridor_sponsorship' && meta.sponsorship_id) {
                    await supabase.from('corridor_featured_sponsorships').update({
                        status: 'active',
                        stripe_subscription_id: stripeSubscriptionId,
                        starts_at: new Date().toISOString(),
                        notes: `Payment confirmed — $${meta.bid_amount}/mo`,
                    }).eq('id', meta.sponsorship_id);

                    await supabase.from('corridor_featured_sponsorships')
                        .update({ status: 'expired', notes: 'Outbid' })
                        .eq('corridor_slug', meta.corridor_slug)
                        .eq('tier', 'corridor_takeover')
                        .eq('status', 'active')
                        .neq('id', meta.sponsorship_id);

                    console.log(`[HC Stripe] Corridor sponsorship ${meta.sponsorship_id} activated`);
                }

                // ── D) AdGrid bid activation ──
                if (meta.type === 'adgrid_bid' && meta.bid_id) {
                    await supabase.from('adgrid_bids').update({
                        status: 'active',
                        stripe_subscription_id: stripeSubscriptionId,
                        activated_at: new Date().toISOString(),
                    }).eq('id', meta.bid_id);

                    await supabase.from('adgrid_bids')
                        .update({ status: 'outbid' })
                        .eq('geo_key', meta.geo_key)
                        .eq('slot_id', meta.slot_id)
                        .eq('status', 'active')
                        .neq('id', meta.bid_id);

                    console.log(`[HC Stripe] AdGrid bid ${meta.bid_id} activated`);
                }

                break;
            }

            // ═══════════════════════════════════════════════════════
            // SUBSCRIPTION LIFECYCLE
            // ═══════════════════════════════════════════════════════
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const sub = event.data.object as any;
                const userId = sub.metadata?.user_id;
                const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

                // Try to find userId from metadata or billing_customers
                let resolvedUserId = userId;
                if (!resolvedUserId && customerId) {
                    const { data: bc } = await supabase
                        .from('billing_customers')
                        .select('user_id')
                        .eq('stripe_customer_id', customerId)
                        .maybeSingle();
                    resolvedUserId = bc?.user_id;
                }

                if (resolvedUserId) {
                    const price = sub.items?.data?.[0]?.price;
                    const priceId = price?.id ?? null;
                    const tier = sub.status === 'active' || sub.status === 'trialing'
                        ? tierFromMetadataOrPrice(sub.metadata, priceId)
                        : 'free';

                    // Update profiles
                    await supabase.from('profiles').update({
                        subscription_tier: tier,
                        subscription_status: sub.status,
                        updated_at: new Date().toISOString(),
                    }).eq('id', resolvedUserId);

                    // Update subscription_states
                    await supabase.from('subscription_states').update({
                        status: sub.status,
                        cancel_at_period_end: sub.cancel_at_period_end,
                        current_period_start: sub.current_period_start
                            ? new Date(sub.current_period_start * 1000).toISOString() : undefined,
                        current_period_end: sub.current_period_end
                            ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
                        updated_at: new Date().toISOString(),
                    }).eq('user_id', resolvedUserId);

                    // Update billing_subscriptions + entitlements
                    const productId = typeof price?.product === 'string' ? price.product : price?.product?.id ?? null;
                    await supabase.from('billing_subscriptions').upsert({
                        user_id: resolvedUserId,
                        stripe_subscription_id: sub.id,
                        status: sub.status,
                        price_id: priceId,
                        product_id: productId,
                        current_period_start: sub.current_period_start
                            ? new Date(sub.current_period_start * 1000).toISOString() : null,
                        current_period_end: sub.current_period_end
                            ? new Date(sub.current_period_end * 1000).toISOString() : null,
                        cancel_at_period_end: sub.cancel_at_period_end,
                        metadata: sub.metadata ?? {},
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'stripe_subscription_id' });

                    await supabase.from('operator_entitlements').upsert({
                        user_id: resolvedUserId,
                        ...entitlementsFromTier(tier),
                        updated_at: new Date().toISOString(),
                        source: 'stripe',
                        raw: { stripe_subscription_id: sub.id, status: sub.status, price_id: priceId },
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as any;
                const userId = sub.metadata?.user_id;
                const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
                const subId = sub.id;

                let resolvedUserId = userId;
                if (!resolvedUserId && customerId) {
                    const { data: bc } = await supabase
                        .from('billing_customers')
                        .select('user_id')
                        .eq('stripe_customer_id', customerId)
                        .maybeSingle();
                    resolvedUserId = bc?.user_id;
                }

                if (resolvedUserId) {
                    await supabase.from('profiles').update({
                        subscription_tier: 'free',
                        subscription_status: 'canceled',
                        stripe_subscription_id: null,
                        updated_at: new Date().toISOString(),
                    }).eq('id', resolvedUserId);

                    await supabase.from('subscription_states').update({
                        status: 'canceled',
                        plan_id: 'free',
                        monthly_lead_credits: 0,
                        updated_at: new Date().toISOString(),
                    }).eq('user_id', resolvedUserId);

                    await supabase.from('operator_entitlements').upsert({
                        user_id: resolvedUserId,
                        ...entitlementsFromTier('free'),
                        updated_at: new Date().toISOString(),
                        source: 'stripe',
                    });
                }

                // Expire all sponsorships tied to this subscription
                await supabase.from('port_sponsorships')
                    .update({ status: 'expired', notes: 'Subscription cancelled' })
                    .eq('stripe_subscription_id', subId).eq('status', 'active');

                await supabase.from('corridor_featured_sponsorships')
                    .update({ status: 'expired', notes: 'Subscription cancelled' })
                    .eq('stripe_subscription_id', subId).eq('status', 'active');

                await supabase.from('adgrid_bids')
                    .update({ status: 'expired' })
                    .eq('stripe_subscription_id', subId).eq('status', 'active');

                console.log(`[HC Stripe] Subscription canceled: ${resolvedUserId || customerId}`);
                break;
            }

            // ═══════════════════════════════════════════════════════
            // INVOICE EVENTS
            // ═══════════════════════════════════════════════════════
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any;
                const subId = invoice.subscription;

                if (subId) {
                    const { data: subState } = await supabase
                        .from('subscription_states')
                        .select('user_id, plan_id, monthly_lead_credits')
                        .eq('stripe_subscription_id', subId)
                        .single();

                    if (subState && subState.monthly_lead_credits > 0) {
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
                const invoice = event.data.object as any;
                const subId = invoice.subscription;
                const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

                if (subId) {
                    await supabase.from('subscription_states').update({
                        status: 'past_due',
                        updated_at: new Date().toISOString(),
                    }).eq('stripe_subscription_id', subId);
                }

                if (customerId) {
                    await supabase.from('profiles').update({
                        subscription_status: 'past_due',
                        updated_at: new Date().toISOString(),
                    }).eq('stripe_customer_id', customerId);
                }
                break;
            }

            // ═══════════════════════════════════════════════════════
            // PAYMENT INTENT EVENTS (Booking payments)
            // ═══════════════════════════════════════════════════════
            case 'payment_intent.succeeded': {
                const pi = event.data.object as any;
                const jobId = pi.metadata?.job_id;
                if (!jobId || pi.metadata?.source !== 'haul_command_booking') break;

                await supabase.from('jobs').update({
                    payment_status: 'captured',
                    stripe_charge_id: typeof pi.latest_charge === 'string' ? pi.latest_charge : null,
                }).eq('job_id', jobId);

                try {
                    await supabase.rpc('append_job_audit', {
                        p_job_id: jobId,
                        p_action: 'payment_captured',
                        p_actor: 'stripe_webhook',
                        p_details: { payment_intent_id: pi.id, amount: pi.amount, currency: pi.currency },
                    });
                } catch { /* RPC may not exist */ }

                console.log(`[HC Stripe] Booking payment captured: job=${jobId}`);
                break;
            }

            case 'payment_intent.payment_failed': {
                const pi = event.data.object as any;
                const jobId = pi.metadata?.job_id;
                if (jobId && pi.metadata?.source === 'haul_command_booking') {
                    await supabase.from('jobs').update({ payment_status: 'failed' }).eq('job_id', jobId);
                }
                break;
            }

            case 'payment_intent.canceled': {
                const pi = event.data.object as any;
                const jobId = pi.metadata?.job_id;
                if (jobId && pi.metadata?.source === 'haul_command_booking') {
                    await supabase.from('jobs').update({ payment_status: 'cancelled' }).eq('job_id', jobId);
                }
                break;
            }

            // ═══════════════════════════════════════════════════════
            // TRANSFER EVENTS (Operator payouts)
            // ═══════════════════════════════════════════════════════
            default: {
                const eventType = event.type as string;
                if (eventType === 'transfer.created') {
                    const transfer = event.data.object as any;
                    if (transfer.metadata?.job_id) {
                        await supabase.from('job_payouts').update({
                            stripe_transfer_id: transfer.id,
                            status: 'initiated',
                        }).eq('job_id', transfer.metadata.job_id)
                          .eq('operator_id', transfer.metadata?.operator_id);
                    }
                } else if (eventType === 'transfer.paid') {
                    const transfer = event.data.object as any;
                    if (transfer.metadata?.job_id) {
                        await supabase.from('job_payouts').update({
                            status: 'completed',
                            paid_at: new Date().toISOString(),
                        }).eq('stripe_transfer_id', transfer.id);

                        await supabase.from('jobs').update({
                            payout_status: 'completed',
                        }).eq('job_id', transfer.metadata.job_id);
                    }

                    // QuickPay FCM notification — operator receives deposit confirmation
                    if (transfer.metadata?.type === 'quickpay' && transfer.metadata?.operator_id) {
                        const netAmountUsd = (transfer.amount || 0) / 100;
                        const template = quickpayDepositTemplate({
                            amountUsd: netAmountUsd,
                            jobReference: transfer.metadata?.booking_id || transfer.metadata?.job_id || 'N/A',
                            transactionId: transfer.id,
                        });
                        trySendNotification({ userId: transfer.metadata.operator_id, ...template }).catch(() => {});

                        // Mark QuickPay transaction as completed
                        await supabase.from('quickpay_transactions').update({
                            status: 'completed',
                            completed_at: new Date().toISOString(),
                        }).eq('stripe_transfer_id', transfer.id);
                    }
                }
                break;
            }
        }

        // Mark event as processed
        await supabase.from('stripe_webhook_events').update({
            processing_status: 'processed',
            processed_at: new Date().toISOString(),
        }).eq('stripe_event_id', event.id);

    } catch (processErr: any) {
        console.error('[HC Stripe] Processing error:', processErr);

        await supabase.from('stripe_webhook_events').update({
            processing_status: 'failed',
            error_message: processErr?.message || String(processErr),
        }).eq('stripe_event_id', event.id);
    }

    // Forward to Supabase Edge Function (non-blocking)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
        fetch(`${supabaseUrl}/functions/v1/hc-stripe-webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'stripe-signature': sig },
            body: JSON.stringify(event),
        }).catch(() => {});
    }

    // PostHog event tracking (non-blocking)
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        const metadata = event.data?.object?.metadata;
        const userId = metadata?.user_id;
        if (userId) {
            fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'}/capture/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
                    distinct_id: userId,
                    event: `stripe_${event.type.replace(/\./g, '_')}`,
                    properties: { event_type: event.type },
                }),
            }).catch(() => {});
        }
    }

    return NextResponse.json({ received: true, type: event.type });
}
