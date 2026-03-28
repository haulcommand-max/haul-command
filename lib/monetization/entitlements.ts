import { createClient } from '@supabase/supabase-js';
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
    private supabase;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }

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

                // Checkout Completes (AdGrid, Data Purchases, Claims)
                case 'checkout.session.completed':
                    const session = event.data.object as Stripe.Checkout.Session;
                    if (session.metadata?.type === 'ad_boost') await this.activateAdGrid(session);
                    if (session.metadata?.type === 'data_purchase') await this.activateDataProduct(session);
                    if (session.metadata?.type === 'tier2_claim') await this.activateProfileClaim(session);
                    break;

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

    // ── 5. Standard AdGrid Placement ───────────────────────────────────────────
    private async activateAdGrid(session: Stripe.Checkout.Session) {
        if (!session.metadata?.boost_id) throw new Error('Boost ID missing');
        await this.supabase.from('ad_boosts').update({ status: 'active', starts_at: new Date().toISOString() }).eq('id', session.metadata.boost_id);
    }

    // ── 6. Escrow Capture on Load Approval ─────────────────────────────────────
    private async secureLoadEscrowHold(pi: Stripe.PaymentIntent) {
        const loadId = pi.metadata?.job_id || pi.metadata?.load_id;
        if (!loadId) return;
        await this.supabase.from('payments').update({ status: 'preauthorized', stripe_payment_intent_id: pi.id }).eq('stripe_payment_intent_id', pi.id).or(`job_id.eq.${loadId}`);
    }

    private async activateProfileClaim(session: Stripe.Checkout.Session) {
         if (!session.metadata?.profile_id) return;
         await this.supabase.from('profiles').update({ is_claimed: true, claim_status: 'verified' }).eq('id', session.metadata.profile_id);
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
}
