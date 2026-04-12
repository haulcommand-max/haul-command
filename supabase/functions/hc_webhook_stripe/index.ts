import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// ── Stripe HMAC Signature Verification (v1 scheme) ─────────────────────────
// Stripe signs webhooks using HMAC-SHA256 with the webhook secret.
// The signed payload format is: `{timestamp}.{rawBody}`
// The signature header format is: `t={timestamp},v1={signature}`
async function verifyStripeSignature(
    rawBody: string,
    signatureHeader: string,
    secret: string,
    toleranceSeconds = 300,
): Promise<boolean> {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const sigPart = parts.find((p) => p.startsWith('v1='));

    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.split('=')[1];
    const receivedSig = sigPart.split('=')[1];

    // Reject if timestamp is too old (replay protection)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > toleranceSeconds) {
        console.error('[Stripe Webhook] Timestamp outside tolerance window');
        return false;
    }

    // Compute expected signature: HMAC-SHA256(secret, "{timestamp}.{rawBody}")
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    const signedPayload = `${timestamp}.${rawBody}`;
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expectedSig = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    // Timing-safe comparison
    if (expectedSig.length !== receivedSig.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expectedSig.length; i++) {
        mismatch |= expectedSig.charCodeAt(i) ^ receivedSig.charCodeAt(i);
    }
    return mismatch === 0;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Read the raw body ONCE — needed for both JSON parsing and signature verification
        const rawBody = await req.text();
        const signatureHeader = req.headers.get('stripe-signature');
        const body = JSON.parse(rawBody);

        // ==========================================
        // ACTION: Create Checkout Session
        // Called from sponsor/checkout page (internal, no Stripe signature)
        // ==========================================
        if (body.action === 'create_checkout') {
            if (!stripeSecretKey) {
                // Demo mode: no Stripe key configured, return null checkout URL
                console.warn('[Stripe] No STRIPE_SECRET_KEY configured. Demo mode — skipping Stripe.');
                return new Response(JSON.stringify({ checkout_url: null, demo_mode: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }

            const { order_id, product_key, amount, currency, geo_key } = body;

            // Create Stripe checkout session
            const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${stripeSecretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'mode': 'payment',
                    'payment_method_types[0]': 'card',
                    'line_items[0][price_data][currency]': currency.toLowerCase(),
                    'line_items[0][price_data][product_data][name]': `${product_key} — ${geo_key}`,
                    'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
                    'line_items[0][quantity]': '1',
                    'success_url': `${supabaseUrl.replace('.supabase.co', '')}/sponsor/success?order_id=${order_id}`,
                    'cancel_url': `${supabaseUrl.replace('.supabase.co', '')}/sponsor/checkout`,
                    'metadata[order_id]': order_id,
                    'metadata[product_key]': product_key,
                    'metadata[geo_key]': geo_key,
                }),
            });

            const session = await stripeRes.json();

            // Update order with session ID
            await supabase
                .from('sponsorship_orders')
                .update({ stripe_checkout_session_id: session.id })
                .eq('id', order_id);

            return new Response(JSON.stringify({ checkout_url: session.url }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // ==========================================
        // STRIPE WEBHOOK EVENTS
        // Called by Stripe webhook delivery — MUST validate signature
        // ==========================================
        if (body.type && body.type.startsWith('checkout.')) {
            // ── SIGNATURE VERIFICATION (mandatory for webhook events) ──
            if (!signatureHeader || !stripeWebhookSecret) {
                console.error('[Stripe Webhook] Missing signature header or webhook secret');
                return new Response(JSON.stringify({ error: 'Missing signature' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401,
                });
            }

            const isValid = await verifyStripeSignature(rawBody, signatureHeader, stripeWebhookSecret);
            if (!isValid) {
                console.error('[Stripe Webhook] INVALID SIGNATURE — request rejected');
                return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401,
                });
            }

            console.log('[Stripe Webhook] Signature verified ✓');

            // ── Process checkout.session.completed ──
            if (body.type === 'checkout.session.completed') {
                const session = body.data?.object;
                const orderId = session?.metadata?.order_id;
                const productKey = session?.metadata?.product_key;
                const geoKey = session?.metadata?.geo_key;

                if (orderId) {
                    // Mark order as paid (idempotent — only update if not already paid)
                    const { data: order } = await supabase
                        .from('sponsorship_orders')
                        .select('status')
                        .eq('id', orderId)
                        .single();

                    if (order?.status === 'paid') {
                        console.log(`[Stripe Webhook] Order ${orderId} already processed — skipping (idempotent).`);
                        return new Response(JSON.stringify({ received: true, skipped: true }), {
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                            status: 200,
                        });
                    }

                    // Mark order as paid
                    await supabase
                        .from('sponsorship_orders')
                        .update({
                            status: 'paid',
                            stripe_payment_intent_id: session.payment_intent,
                        })
                        .eq('id', orderId);

                    // Get product for duration
                    const { data: product } = await supabase
                        .from('sponsorship_products')
                        .select('duration_days')
                        .eq('product_key', productKey)
                        .single();

                    const durationDays = product?.duration_days || 30;

                    // Create featured placement
                    await supabase
                        .from('featured_placements')
                        .insert({
                            profile_id: session.client_reference_id || null,
                            geo_key: geoKey,
                            placement_type: productKey,
                            starts_at: new Date().toISOString(),
                            ends_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
                        });

                    // Log monetization event
                    await supabase
                        .from('monetization_events')
                        .insert({
                            event_type: 'sponsorship_purchase',
                            amount: session.amount_total ? session.amount_total / 100 : 0,
                            currency: session.currency || 'usd',
                            metadata: { order_id: orderId, product_key: productKey, geo_key: geoKey },
                        });

                    console.log(`[Stripe Webhook] Order ${orderId} paid. Featured placement created for ${geoKey}.`);
                }

                return new Response(JSON.stringify({ received: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                });
            }

            // Acknowledge other checkout events we don't handle yet
            return new Response(JSON.stringify({ received: true, unhandled_type: body.type }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        if (body.type && (body.type.startsWith('payment_intent.') || body.type.startsWith('payout.'))) {
            // ── SIGNATURE VERIFICATION ──
            if (!signatureHeader || !stripeWebhookSecret) {
                return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 401 });
            }
            const isValid = await verifyStripeSignature(rawBody, signatureHeader, stripeWebhookSecret);
            if (!isValid) return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });

            // ── PAYMENT INTENT EVENTS ──
            // OPUS-02 S1-02/S1-03: Pre-auth clearance — idempotent DRAFT → OPEN transition
            if (body.type === 'payment_intent.amount_capturable_updated') {
                const intent = body.data?.object;
                const jobId = intent?.metadata?.job_id;

                if (jobId) {
                    // S1-03: Idempotency check via preauth_status
                    const { data: existingJob } = await supabase
                        .from('hc_jobs')
                        .select('preauth_status')
                        .eq('id', jobId)
                        .single();

                    if (existingJob?.preauth_status === 'authorized') {
                        console.log(`[Stripe Webhook] Job ${jobId} pre-auth already processed — idempotent skip.`);
                    } else {
                        await supabase.from('hc_jobs')
                            .update({ preauth_status: 'authorized', status: 'OPEN' })
                            .eq('id', jobId);
                        await supabase.from('hc_escrows')
                            .update({ status: 'FUNDED' })
                            .eq('job_id', jobId)
                            .eq('status', 'PENDING_FUNDS');
                        await supabase.from('event_log').insert({
                            actor_role: 'system',
                            event_type: 'payment.preauth_cleared',
                            entity_type: 'hc_jobs',
                            entity_id: jobId,
                            payload: { payment_intent_id: intent.id, amount: intent.amount },
                        });
                        console.log(`[Stripe Webhook] Job ${jobId} OPEN — pre-auth cleared.`);
                    }
                }
            } else if (body.type === 'payment_intent.succeeded') {
                const intent = body.data?.object;
                const jobId = intent?.metadata?.job_id;
                
                if (jobId) {
                    await supabase.from('hc_jobs').update({ preauth_status: 'captured' }).eq('id', jobId);
                    await supabase.from('event_log').insert({
                        actor_profile_id: null,
                        actor_role: 'system',
                        event_type: 'payment.captured_webhook',
                        entity_type: 'hc_jobs',
                        entity_id: jobId,
                        payload: { payment_intent_id: intent.id, amount_received: intent.amount_received },
                    });
                }
            } else if (body.type === 'payment_intent.payment_failed') {
                const intent = body.data?.object;
                const jobId = intent?.metadata?.job_id;
                const brokerId = intent?.metadata?.broker_user_id;
                
                if (jobId) {
                    await supabase.from('hc_jobs').update({ preauth_status: 'failed' }).eq('id', jobId);
                    if (brokerId) {
                        await supabase.from('trust_events').insert({
                            entity_profile_id: brokerId,
                            event_type: 'preauth_failed',
                            payload: { job_id: jobId, error: intent.last_payment_error?.message },
                        });
                    }
                }
            }


            // ── PAYOUT EVENTS ──
            let payoutFailedUserId: string | null = null;

            if (body.type === 'payout.failed' || body.type === 'payout.canceled') {
                const payout = body.data?.object;
                const accountId = payout?.destination;
                
                // Lookup user by stripe_account_id
                const { data: profile } = await supabase
                    .from('operator_profiles')
                    .select('user_id')
                    .eq('stripe_account_id', accountId)
                    .single();
                    
                if (profile?.user_id) {
                    payoutFailedUserId = profile.user_id;

                    // Trust negative signal
                    await supabase.from('trust_events').insert({
                        entity_profile_id: profile.user_id,
                        event_type: 'payout_failed',
                        payload: { payout_id: payout.id, amount: payout.amount, error: payout.failure_reason },
                    });
                    
                    // Queue push notification (FCM worker will dequeue)
                    await supabase.from('hc_notifications').insert({
                        user_id: profile.user_id,
                        title: '⚠️ Payout Failed',
                        body: 'Your recent payout failed. Please update your bank details to resume transfers.',
                        data_json: {
                            type: 'payout_failed',
                            deep_link: 'haulcommand://dashboard/wallet/settings',
                            retry_url: '/dashboard/wallet/settings',
                        },
                        channel: 'push',
                        status: 'queued',
                    });
                }
            }

            // Return payout_failed_user_id so Next.js proxy can flush FCM immediately
            return new Response(JSON.stringify({ received: true, payout_failed_user_id: payoutFailedUserId }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        return new Response(JSON.stringify({ error: 'Unknown action or event type' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });

    } catch (error) {
        console.error('[Stripe Webhook] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
