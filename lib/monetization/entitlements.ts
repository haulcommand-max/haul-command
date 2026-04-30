import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';
import Stripe from 'stripe';

export type StripeEventContext = {
    id: string;
    type: string;
    payload: any;
    receivedAt: string;
};

// ============================================================================
// ENGINE 1 — BILLING & ENTITLEMENTS ENGINE
// ============================================================================
// Single canonical route for handling secure, idempotent money flows.
// Protects against double charges or dropped entitlements.

export class EntitlementEngine {
    private supabase = getSupabaseAdmin();


    // ── 1. Idempotent Ingestion ──────────────────────────────────────────────
    async lockAndProcessEvent(event: StripeEventContext, processor: () => Promise<void>) {
        // Idempotency check: Write to immutable webhook_inbox
        const { error, data: existingEvent } = await this.supabase
            .from('webhook_inbox')
            .upsert({
                provider: 'stripe',
                event_id: event.id,
                event_type: event.type,
                payload: event.payload,
                received_at: event.receivedAt,
                signature_verified: true,
            }, { onConflict: 'provider,event_id', ignoreDuplicates: false })
            .select('status, id').single();
            
        if (error || existingEvent?.status === 'processed') {
            return { handled: true, skipped: true, reason: 'idempotent_duplicate' };
        }

        const inboxId = existingEvent!.id;

        // Process actual rules
        try {
            await this.supabase.from('webhook_inbox').update({ status: 'processing' }).eq('id', inboxId);
            await processor();
            await this.supabase.from('webhook_inbox').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', inboxId);
            return { handled: true, skipped: false };
        } catch (err: any) {
            console.error(`[EntitlementEngine] FATAL EVENT FAILURE: ${event.id}`, err);
            await this.supabase.from('webhook_inbox').update({ 
                status: 'failed', 
                processing_error: err.message || 'Unknown processing error',
            }).eq('id', inboxId);
            throw err;
        }
    }

    // ── 2. Master Routing Dispatch ─────────────────────────────────────────
    async handleStripeWebhook(event: Stripe.Event) {
        return this.lockAndProcessEvent({ id: event.id, type: event.type, payload: event, receivedAt: new Date().toISOString() }, async () => {
            switch (event.type) {
                
                // Subscription Lifecycle
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                    await this.syncCanonicalSubscription(event.data.object as Stripe.Subscription);
                    break;
                case 'customer.subscription.deleted':
                    await this.revokeCanonicalSubscription(event.data.object as Stripe.Subscription);
                    break;

                // Checkout Completes (AdGrid, Data Purchases, Claims, Campaigns)
                case 'checkout.session.completed': {
                    const session = event.data.object as Stripe.Checkout.Session;
                    // Legacy type-keyed routes
                    if (session.metadata?.type === 'ad_boost') await this.activateAdGrid(session);
                    if (session.metadata?.type === 'adgrid_bid') await this.activateAdGridBid(session);
                    if (session.metadata?.type === 'report_card_unlock') await this.activateReportCardUnlock(session);
                    if (session.metadata?.type === 'broker_report_subscription') await this.activateBrokerReportSubscription(session);
                    if (session.metadata?.type === 'data_purchase') await this.activateDataProduct(session);
                    if (session.metadata?.type === 'tier2_claim') await this.activateProfileClaim(session);
                    // New creative factory campaigns (/api/ads/campaigns)
                    if (session.metadata?.campaign_id) await this.activateCampaign(session);
                    // New data buy route (/api/data/buy) without legacy type key
                    if (session.metadata?.product_id && !session.metadata?.type) await this.activateDataProduct(session);
                    // Subscription activation from /api/checkout/session and /api/subscriptions/checkout
                    if ((session.metadata?.product_key || session.metadata?.lookup_key) && session.mode === 'subscription') {
                        await this.activateSubscriptionByProductKey(session);
                    }
                    break;
                }

                // Load Board Escrow & Financing
                case 'payment_intent.succeeded':
                    await this.secureLoadEscrowHold(event.data.object as Stripe.PaymentIntent);
                    break;

                case 'invoice.payment_failed':
                    await this.handleFailedDunning(event.data.object as Stripe.Invoice);
                    break;
            }
        });
    }

    // ── 3. Canonical Subscription Activation ────────────────────────────────
    private async syncCanonicalSubscription(sub: Stripe.Subscription) {
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        // Fetch User Identity via Customer
        const { data: profile } = await this.supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single();
        if (!profile) throw new Error(`Dangling Stripe Customer: ${customerId} has no mapped Haul Command Auth Profile.`);

        const priceKey = sub.items.data[0]?.price?.lookup_key || sub.items.data[0]?.price?.id || 'standard';

        // 1. Write to canonical user_subscriptions
        await this.supabase.from('user_subscriptions').upsert({
            user_id: profile.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            price_key: priceKey,
            plan_id: priceKey,
            status: sub.status,
            current_period_start: new Date(((sub as any).current_period_start ?? 0) * 1000).toISOString(),
            current_period_end: new Date(((sub as any).current_period_end ?? 0) * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            latest_invoice_id: typeof sub.latest_invoice === 'string' ? sub.latest_invoice : (sub.latest_invoice as any)?.id
        }, { onConflict: 'user_id' });

        // 2. Derive to Profiles Cache (ReadOnly / Display Mode)
        await this.supabase.from('profiles').update({
            subscription_tier: priceKey, 
            subscription_status: sub.status
        }).eq('id', profile.id);
    }

    private async revokeCanonicalSubscription(sub: Stripe.Subscription) {
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const { data: profile } = await this.supabase.from('profiles').select('id').eq('stripe_customer_id', customerId).single();
        if (!profile) return;

        await this.supabase.from('user_subscriptions').update({ status: 'canceled', cancel_at_period_end: false }).eq('stripe_subscription_id', sub.id);
        await this.supabase.from('profiles').update({ subscription_tier: 'free', subscription_status: 'canceled' }).eq('id', profile.id);
    }

    // ── 4. Data Product Fulfillment (Massive Edge Value) ───────────────────────
    private async activateDataProduct(session: Stripe.Checkout.Session) {
        if (!session.metadata?.product_id || !session.metadata?.user_id) throw new Error('Missing Enterprise Data Product keys in Session.');

        // 1. Locate pending data purchase
        const { data: purchase, error } = await this.supabase.from('data_purchases').select('*')
            .eq('user_id', session.metadata.user_id)
            .eq('product_id', session.metadata.product_id)
            .eq('status', 'pending')
            .maybeSingle();

        if (error || !purchase) throw new Error(`[Stripe Sync] Abandoned Data Sync: No pending matching purchase found for ${session.metadata.product_id}.`);

        // 2. Fulfill actual data asset (Generate Secure Signed Download Link)
        // e.g. CSVs generated inside private /data-assets bucket. Expiration: 7 Days.
        const objectPath = `enterprise/${purchase.country_code}/${purchase.product_id}_matrix.csv`;
        const { data: downloadAsset } = await this.supabase.storage.from('data-assets').createSignedUrl(objectPath, 60 * 60 * 24 * 7);

        // 3. Mark Active & Inject Fulfillment URI
        await this.supabase.from('data_purchases').update({
            status: 'active',
            stripe_session_id: session.id,
            expires_at: new Date(Date.now() + (1000 * 60 * 60 * 24 * 30)).toISOString(), // 30 day enterprise access
            metadata: { 
                fulfillment_url: downloadAsset?.signedUrl || 'GENERATING', 
                storage_path: objectPath 
            }
        }).eq('id', purchase.id);
    }

    // ── 5. Ad Campaign Activation (from /api/ads/campaigns creative factory) ──
    private async activateCampaign(session: Stripe.Checkout.Session) {
        const campaignId = session.metadata?.campaign_id;
        if (!campaignId) return;

        await this.supabase.from('ad_campaigns').update({
            status: 'active',
            payment_confirmed_at: new Date().toISOString(),
            stripe_session_id: session.id,
        }).eq('id', campaignId);

        await this.recordMoneyEvent({
            event_type: 'ad_campaign_activated',
            amount_cents: session.amount_total ?? 0,
            entity_type: 'ad_campaign',
            entity_id: campaignId,
            market: session.metadata?.geo_key || session.metadata?.country_code || 'global',
            metadata: { stripe_session_id: session.id, campaign_id: campaignId },
        });

        // Swarm attribution
        ;(async () => { try { await this.supabase.from('swarm_activity_log').insert({
            agent_name: 'adgrid_creative_agent',
            trigger_reason: 'campaign_payment_confirmed',
            action_taken: `Campaign ${campaignId} activated after Stripe payment`,
            surfaces_touched: ['ad_campaigns'],
            revenue_impact: (session.amount_total ?? 0) / 100,
            status: 'completed',
        }); } catch {} })();
    }

    // ── 6. Subscription Activation by product_key / lookup_key ────────────────
    private async activateSubscriptionByProductKey(session: Stripe.Checkout.Session) {
        const userId = session.metadata?.user_id;
        const productKey = session.metadata?.product_key || session.metadata?.lookup_key;
        if (!userId || !productKey) return;

        // Map product_key → tier name. Public naming is handled in pricing config / UI;
        // entitlement values stay stable for code and RLS policies.
        const TIER_MAP: Record<string, string> = {
            'hc_basic_monthly': 'basic',  'hc_basic_annual': 'basic',
            'hc_pro_monthly': 'pro',      'hc_pro_annual': 'pro',
            'hc_elite_monthly': 'elite',  'hc_elite_annual': 'elite',
            'broker_seat_monthly': 'broker', 'broker_seat_annual': 'broker',
            'directory_pro_monthly': 'pro',
            'directory_elite_monthly': 'elite',
            'directory_enterprise_monthly': 'enterprise',
            'mobile_basic_monthly': 'pro',
            'mobile_pro_monthly': 'elite',
            'mobile_elite_monthly': 'enterprise',
        };
        const tier = TIER_MAP[productKey] ?? 'pro';

        await this.supabase.from('profiles').update({
            subscription_tier: tier,
            subscription_status: 'active',
        }).eq('id', userId);

        await this.supabase.from('user_subscriptions').upsert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : undefined,
            plan_id: productKey,
            price_key: productKey,
            status: 'active',
            current_period_start: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        await this.recordMoneyEvent({
            event_type: 'subscription_activated',
            amount_cents: session.amount_total ?? 0,
            entity_type: 'user',
            entity_id: userId,
            market: session.metadata?.country_code || 'global',
            metadata: { stripe_session_id: session.id, product_key: productKey, tier },
        });
    }

    // ── 7. Standard AdGrid Placement ───────────────────────────────────────────

    private async activateAdGrid(session: Stripe.Checkout.Session) {
        if (!session.metadata?.boost_id) throw new Error('Boost ID missing');
        await this.supabase.from('ad_boosts').update({ status: 'active', starts_at: new Date().toISOString() }).eq('id', session.metadata.boost_id);
        await this.recordMoneyEvent({
            event_type: 'adgrid_boost_activated',
            amount_cents: session.amount_total ?? 0,
            entity_type: 'ad_boost',
            entity_id: session.metadata.boost_id,
            market: session.metadata?.geo_key || session.metadata?.country_code || 'global',
            metadata: { stripe_session_id: session.id },
        });
    }

    // ── 8. AdGrid Bid Activation ──────────────────────────────────────────────
    // Closes the self-serve bid checkout gap from /api/adgrid/bid.
    private async activateAdGridBid(session: Stripe.Checkout.Session) {
        const bidId = session.metadata?.bid_id;
        if (!bidId) throw new Error('AdGrid bid_id missing from checkout session.');

        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
        const bidAmount = Number(session.metadata?.bid_amount || 0);
        const geoKey = session.metadata?.geo_key || 'unknown';
        const slotId = session.metadata?.slot_id || 'unknown';
        const bidType = session.metadata?.bid_type || 'auction';

        // If this is a guaranteed lock, retire existing active bidders in the same slot.
        if (bidType === 'guaranteed_lock') {
            await this.supabase
                .from('adgrid_bids')
                .update({ status: 'superseded', superseded_at: new Date().toISOString(), superseded_by_bid_id: bidId })
                .eq('geo_key', geoKey)
                .eq('slot_id', slotId)
                .eq('status', 'active')
                .neq('id', bidId);
        }

        const updatePayload: Record<string, any> = {
            status: 'active',
            activated_at: new Date().toISOString(),
            stripe_session_id: session.id,
            stripe_subscription_id: subscriptionId,
            amount_paid_cents: session.amount_total ?? Math.round(bidAmount * 100),
        };

        const { error: richErr } = await this.supabase
            .from('adgrid_bids')
            .update(updatePayload)
            .eq('id', bidId);

        // Older DBs may not have the rich columns yet. Do the minimum activation instead of losing money.
        if (richErr?.message?.includes('column')) {
            const { error: fallbackErr } = await this.supabase
                .from('adgrid_bids')
                .update({ status: 'active' })
                .eq('id', bidId);
            if (fallbackErr) throw fallbackErr;
        } else if (richErr) {
            throw richErr;
        }

        await this.recordMoneyEvent({
            event_type: 'adgrid_bid_activated',
            amount_cents: session.amount_total ?? Math.round(bidAmount * 100),
            entity_type: 'adgrid_bid',
            entity_id: bidId,
            market: geoKey,
            metadata: { stripe_session_id: session.id, slot_id: slotId, bid_type: bidType, subscription_id: subscriptionId },
        });

        await this.logOsEvent('adgrid.bid_activated', bidId, 'adgrid_bid', {
            geo_key: geoKey,
            slot_id: slotId,
            bid_type: bidType,
            amount_cents: session.amount_total ?? Math.round(bidAmount * 100),
        });
    }

    private async activateReportCardUnlock(session: Stripe.Checkout.Session) {
        const userId = session.metadata?.user_id;
        const operatorId = session.metadata?.operator_id;
        if (!userId || !operatorId) return;

        await this.supabase.from('report_card_unlocks').upsert({
            user_id: userId,
            operator_id: operatorId,
            stripe_session_id: session.id,
            status: 'active',
            unlocked_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        }, { onConflict: 'user_id,operator_id' }).then(() => {});

        await this.recordMoneyEvent({
            event_type: 'report_card_unlock',
            amount_cents: session.amount_total ?? 0,
            entity_type: 'operator_report_card',
            entity_id: operatorId,
            market: session.metadata?.country_code || 'global',
            metadata: { user_id: userId, stripe_session_id: session.id },
        });
    }

    private async activateBrokerReportSubscription(session: Stripe.Checkout.Session) {
        const userId = session.metadata?.user_id;
        if (!userId) return;
        await this.supabase.from('profiles').update({
            subscription_tier: 'broker',
            subscription_status: 'active',
        }).eq('id', userId);

        await this.supabase.from('user_subscriptions').upsert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : undefined,
            plan_id: 'broker_report_subscription',
            price_key: 'broker_report_subscription',
            status: 'active',
            current_period_start: new Date().toISOString(),
        }, { onConflict: 'user_id' });

        await this.recordMoneyEvent({
            event_type: 'broker_report_subscription_activated',
            amount_cents: session.amount_total ?? 0,
            entity_type: 'user',
            entity_id: userId,
            market: session.metadata?.country_code || 'global',
            metadata: { stripe_session_id: session.id },
        });
    }

    // ── 9. Escrow Capture on Load Approval ─────────────────────────────────────
    private async secureLoadEscrowHold(pi: Stripe.PaymentIntent) {
        const loadId = pi.metadata?.job_id || pi.metadata?.load_id;
        if (!loadId) return;
        await this.supabase.from('payments').update({ status: 'preauthorized', stripe_payment_intent_id: pi.id }).eq('stripe_payment_intent_id', pi.id).or(`job_id.eq.${loadId}`);
    }

    private async activateProfileClaim(session: Stripe.Checkout.Session) {
         if (!session.metadata?.profile_id) return;
         await this.supabase.from('profiles').update({ is_claimed: true, claim_status: 'verified' }).eq('id', session.metadata.profile_id);
         await this.recordMoneyEvent({
             event_type: 'profile_claim_activated',
             amount_cents: session.amount_total ?? 0,
             entity_type: 'profile',
             entity_id: session.metadata.profile_id,
             market: session.metadata?.country_code || 'global',
             metadata: { stripe_session_id: session.id },
         });
    }
    
    private async handleFailedDunning(invoice: Stripe.Invoice) {
         // Auto-suspend AdGrids and Grace-period subscriptions
         if (!invoice.customer) return;
         const cid = typeof invoice.customer === 'string'? invoice.customer : invoice.customer.id;
         // Alert user natively and revoke
         const { data: user } = await this.supabase.from('user_subscriptions').select('user_id').eq('stripe_customer_id', cid).single();
         if (user) {
             await this.supabase.from('user_subscriptions').update({ status: 'past_due' }).eq('user_id', user.user_id);
             await this.supabase.from('profiles').update({ subscription_status: 'past_due' }).eq('id', user.user_id);
         }
    }

    private async recordMoneyEvent(params: {
        event_type: string;
        amount_cents: number;
        entity_type?: string;
        entity_id?: string;
        market?: string;
        metadata?: Record<string, unknown>;
    }) {
        await this.supabase.from('hc_command_money_events').insert({
            event_type: params.event_type,
            amount_cents: params.amount_cents,
            currency: 'USD',
            entity_type: params.entity_type ?? null,
            entity_id: params.entity_id ?? null,
            market: params.market ?? null,
            metadata: params.metadata ?? {},
        }).then(() => {});
    }

    private async logOsEvent(eventType: string, entityId: string, entityType: string, payload: Record<string, unknown>) {
        await this.supabase.from('os_event_log').insert({
            event_type: eventType,
            entity_id: entityId,
            entity_type: entityType,
            payload,
        }).then(() => {});
    }
}
