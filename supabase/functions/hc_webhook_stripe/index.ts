import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

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
        const body = await req.json();

        // ==========================================
        // ACTION: Create Checkout Session
        // Called from sponsor/checkout page
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
        // ACTION: Stripe Webhook Event
        // Called by Stripe webhook delivery
        // ==========================================
        if (body.type === 'checkout.session.completed') {
            const session = body.data?.object;
            const orderId = session?.metadata?.order_id;
            const productKey = session?.metadata?.product_key;
            const geoKey = session?.metadata?.geo_key;

            if (orderId) {
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
