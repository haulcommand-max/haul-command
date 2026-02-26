import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const B2B_PERMIT_API_URL = Deno.env.get('PARTNER_PERMIT_API_URL') || 'https://api.wcspermits.com/v1/orders'
const B2B_PERMIT_API_KEY = Deno.env.get('PARTNER_PERMIT_API_KEY') || 'demo_key'
const HC_PROCESSING_FEE_USD = 45.00 // Our flat margin per multi-state order

serve(async (req) => {
    // 1. CORS & Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const authHeader = req.headers.get('Authorization')!;
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // 2. Parse request details
        const body = await req.json();
        const { load_id, target_states, dimensions, requested_start_date } = body;

        if (!load_id || !target_states || target_states.length === 0) {
            return new Response(JSON.stringify({ error: 'Missing load_id or target_states' }), { status: 400 });
        }

        // 3. Optional: Verify broker identity / permissions via DB
        // const { data: broker } = await supabase.from('profiles').select('account_type').eq('id', user.id).single();
        // if (broker.account_type !== 'broker') throw new Error("Only brokers can bulk-order permits");

        // 4. Construct B2B Partner API Payload
        const partnerPayload = {
            order_reference: `HC-${load_id}-${Date.now()}`,
            states: target_states,
            vehicle: {
                width_inches: dimensions.width_inches,
                height_inches: dimensions.height_inches,
                length_inches: dimensions.length_inches,
                weight_lbs: dimensions.weight_lbs,
                axle_count: dimensions.axle_count || 5
            },
            dates: {
                requested_start: requested_start_date
            },
            callback_webhook: `${supabaseUrl}/functions/v1/permit-webhook-listener`
        };

        // 5. Submit to Partner (Simulation if keys not set)
        console.log(`Submitting permit for Load ${load_id} across ${target_states.length} states to partner API.`);

        // let partnerResponse = await fetch(B2B_PERMIT_API_URL, {
        //     method: 'POST',
        //     headers: { 'Authorization': `Bearer ${B2B_PERMIT_API_KEY}`, 'Content-Type': 'application/json' },
        //     body: JSON.stringify(partnerPayload)
        // });
        // const partnerData = await partnerResponse.json();

        // Mock Response
        const partnerData = {
            agency_order_id: `WCS-${Math.floor(Math.random() * 1000000)}`,
            status: "processing",
            estimated_cost_usd: target_states.length * 75.00, // Base state cost
        }

        // 6. Record the transation in Supabase + Add our Margin
        const total_cost_to_broker = partnerData.estimated_cost_usd + HC_PROCESSING_FEE_USD;

        const { data: orderRecord, error: dbError } = await supabase.from('permit_orders').insert({
            broker_id: user.id,
            load_id: load_id,
            partner_order_id: partnerData.agency_order_id,
            states_requested: target_states,
            status: 'processing',
            base_cost_usd: partnerData.estimated_cost_usd,
            hc_margin_usd: HC_PROCESSING_FEE_USD,
            total_charged_usd: total_cost_to_broker
        }).select().single();

        if (dbError) {
            console.error("Failed to log permit order to DB:", dbError);
            // In a real system, we'd need to rollback/cancel the partner API order here
        }

        return new Response(JSON.stringify({
            success: true,
            order_id: orderRecord?.id,
            partner_ref: partnerData.agency_order_id,
            states: target_states,
            cost_breakdown: {
                agency_fees: partnerData.estimated_cost_usd,
                processing_fee: HC_PROCESSING_FEE_USD,
                total: total_cost_to_broker
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
