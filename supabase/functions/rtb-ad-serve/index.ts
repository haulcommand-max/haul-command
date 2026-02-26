import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        const { slot_id, geo, intent_tier = 'tier_3' } = await req.json();

        if (!slot_id) {
            return new Response(JSON.stringify({ error: 'Missing slot_id' }), { status: 400, headers: corsHeaders });
        }

        // Fetch slot details
        const { data: slot } = await supabase.from('ad_slots').select('*').eq('slot_id', slot_id).single();
        if (!slot || !slot.is_active) {
            return new Response(JSON.stringify({ error: 'Invalid or inactive slot' }), { status: 400, headers: corsHeaders });
        }

        // Fetch eligible advertisers: Budget > 0, Trust >= 40
        const { data: eligible } = await supabase.from('advertiser_accounts')
            .select('advertiser_id, trust_score, advertiser_budgets(remaining_balance, daily_budget_limit)')
            .eq('account_status', 'active')
            .gte('trust_score', 40);

        if (!eligible || eligible.length === 0) {
            return new Response(JSON.stringify({ ad: null, reason: 'no_fill' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Filter those with budget
        const candidates = eligible.filter(a => a.advertiser_budgets && a.advertiser_budgets.remaining_balance > 0);

        if (candidates.length === 0) {
            return new Response(JSON.stringify({ ad: null, reason: 'budget_exhausted' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Evaluate predictions and expected value
        const intentWeights = { tier_1: 2.5, tier_2: 1.4, tier_3: 1.0 };
        const intent_weight = intentWeights[intent_tier as keyof typeof intentWeights] || 1.0;

        let bestAd = null;
        let highestEV = -1;
        let chargeParams = null;

        for (const candidate of candidates) {
            const trust = candidate.trust_score;
            let trust_mult = 1.0;
            if (trust >= 90) trust_mult = 1.18;
            else if (trust >= 75) trust_mult = 1.10;
            else if (trust >= 60) trust_mult = 1.00;
            else if (trust >= 40) trust_mult = 0.88;
            else trust_mult = 0.70;

            // Simple fairness multiplier simulation
            const fair_mult = 1.06; // Assume small operator boost

            // Base bid - in a real RTB this would come from a campaign config table
            const baseBid = Math.random() * 8 + 2;

            // Predict probabilities (mocked for this function structure)
            const pCTR = 0.05 + (Math.random() * 0.05);
            const pCVR = 0.10 + (Math.random() * 0.15);
            const pLQ = 0.90; // Lead quality

            const EV = baseBid * pCTR * pCVR * pLQ * intent_weight * trust_mult * fair_mult;

            if (EV > highestEV) {
                highestEV = EV;

                // Max intent tier ceil limits
                const ceilByTier = { tier_1: 40.0, tier_2: 22.0, tier_3: 12.0 };
                const ceiling = ceilByTier[intent_tier as keyof typeof ceilByTier] || 12.0;

                const charge = clamp(baseBid, slot.floor_price, ceiling);

                bestAd = {
                    advertiser_id: candidate.advertiser_id,
                    ev: EV
                };
                chargeParams = {
                    bid: baseBid,
                    charge: charge,
                    p_ctr: pCTR,
                    p_cvr: pCVR,
                    trust_multiplier: trust_mult,
                    fairness_multiplier: fair_mult
                };
            }
        }

        if (bestAd && chargeParams) {
            // Log Impression
            const reqId = crypto.randomUUID();
            await supabase.from('impression_log').insert({
                request_id: reqId,
                advertiser_id: bestAd.advertiser_id,
                slot_id: slot_id,
                bid_amount: chargeParams.bid,
                charge_amount: chargeParams.charge,
                p_ctr: chargeParams.p_ctr,
                p_cvr: chargeParams.p_cvr,
                trust_multiplier: chargeParams.trust_multiplier,
                fairness_multiplier: chargeParams.fairness_multiplier
            });

            // Debit budget using RPC or precise update
            // In a real scenario we'd use an atomic function
            const currBalance = candidates.find(c => c.advertiser_id === bestAd.advertiser_id)?.advertiser_budgets?.remaining_balance || 0;
            await supabase.from('advertiser_budgets').update({
                remaining_balance: currBalance - chargeParams.charge
            }).eq('advertiser_id', bestAd.advertiser_id);

            return new Response(JSON.stringify({
                ad: {
                    advertiser_id: bestAd.advertiser_id,
                    request_id: reqId,
                    charge: chargeParams.charge
                },
                status: 'success'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        return new Response(JSON.stringify({ ad: null, reason: 'no_auction_winner' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
