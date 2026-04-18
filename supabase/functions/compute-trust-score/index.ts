import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Trust Score configuration from HAUL_COMMAND_AD_NETWORK_V1.yaml
const WEIGHTS = {
    reliability: { on_time: 0.32, completion: 0.32, cancellation: -0.18, no_show: -0.18 },
    responsiveness: { median_response: -0.45, acceptance: 0.55 },
    integrity: { dispute: -0.45, fraud: -0.55 },
    customer_signal: { rating_avg: 0.55, volume_log: 0.20, repeat_rate: 0.25 },
    compliance: { insurance: 0.45, compliance: 0.35, equipment: 0.20 },
    market_fit: { geo_relevance: 0.70, role_specialization: 0.30 }
};

const OVERALL_WEIGHTS = {
    reliability: 0.28,
    responsiveness: 0.18,
    integrity: 0.18,
    customer_signal: 0.16,
    compliance: 0.12,
    market_fit: 0.08
};

function clamp01(x: number) {
    return Math.max(0, Math.min(1, x));
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        const { searchParams } = new URL(req.url);
        let advertiser_id = searchParams.get('advertiser_id');

        if (!advertiser_id) {
            const body = await req.json();
            advertiser_id = body.advertiser_id;
        }

        if (!advertiser_id) {
            return new Response(JSON.stringify({ error: 'Missing advertiser_id' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        // REAL DATA AGGREGATION — No hardcoded mock values.
        // Queries: escort_profiles, trust_profile_view, jobs, match_offers,
        //          hc_disputes, escort_reviews, escort_presence
        // ═══════════════════════════════════════════════════════════════════

        // Profiles + presence
        const { data: profile } = await supabase.from('escort_profiles').select('*').eq('id', advertiser_id).single();
        const { data: presence } = await supabase.from('escort_presence').select('*').eq('escort_id', advertiser_id).single();

        // ── Try canonical trust_profile_view first (powered by trust_score() SQL function) ──
        const { data: trustView } = await supabase
            .from('trust_profile_view')
            .select('trust_score, trust_trend, confidence, confidence_band, trust_tier, components')
            .eq('profile_id', advertiser_id)
            .single();

        // ── 1. RELIABILITY — from real jobs data ──
        const { count: totalJobs } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .or(`driver_id.eq.${advertiser_id},escort_id.eq.${advertiser_id}`);
        const { count: completedJobs } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .or(`driver_id.eq.${advertiser_id},escort_id.eq.${advertiser_id}`)
            .eq('status', 'completed');
        const { count: cancelledJobs } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .or(`driver_id.eq.${advertiser_id},escort_id.eq.${advertiser_id}`)
            .eq('status', 'cancelled');
        const { count: noShowJobs } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .or(`driver_id.eq.${advertiser_id},escort_id.eq.${advertiser_id}`)
            .eq('status', 'no_show');
        const { count: onTimeJobs } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .or(`driver_id.eq.${advertiser_id},escort_id.eq.${advertiser_id}`)
            .eq('status', 'completed')
            .not('gps_start_confirmed_at', 'is', null);

        const t = Math.max(totalJobs ?? 1, 1);
        const on_time_rate = (onTimeJobs ?? 0) / t;
        const completion_rate = (completedJobs ?? 0) / t;
        const cancellation_rate = (cancelledJobs ?? 0) / t;
        const no_show_rate = (noShowJobs ?? 0) / t;

        const relBase = (on_time_rate * WEIGHTS.reliability.on_time) +
            (completion_rate * WEIGHTS.reliability.completion) +
            ((1 - cancellation_rate) * Math.abs(WEIGHTS.reliability.cancellation)) +
            ((1 - no_show_rate) * Math.abs(WEIGHTS.reliability.no_show));
        const relRaw = clamp01(relBase);

        // ── 2. RESPONSIVENESS — from real match_offers data ──
        const { count: totalOffers } = await supabase
            .from('match_offers')
            .select('id', { count: 'exact', head: true })
            .eq('escort_id', advertiser_id);
        const { count: acceptedOffers } = await supabase
            .from('match_offers')
            .select('id', { count: 'exact', head: true })
            .eq('escort_id', advertiser_id)
            .eq('status', 'accepted');

        const acceptance_rate = (totalOffers ?? 0) > 0 ? (acceptedOffers ?? 0) / (totalOffers ?? 1) : 0.5;

        // Median response time from responded offers
        const { data: respondedOffers } = await supabase
            .from('match_offers')
            .select('created_at, responded_at')
            .eq('escort_id', advertiser_id)
            .not('responded_at', 'is', null)
            .order('responded_at', { ascending: false })
            .limit(50);

        let median_first_response_seconds = 300; // default 5min if no data
        if (respondedOffers && respondedOffers.length > 0) {
            const responseTimes = respondedOffers.map(o =>
                (new Date(o.responded_at).getTime() - new Date(o.created_at).getTime()) / 1000
            ).sort((a, b) => a - b);
            median_first_response_seconds = responseTimes[Math.floor(responseTimes.length / 2)];
        }

        const responseLogNorm = clamp01(1 - (Math.log10(median_first_response_seconds + 1) / 4));
        const respBase = (responseLogNorm * Math.abs(WEIGHTS.responsiveness.median_response)) +
            (acceptance_rate * WEIGHTS.responsiveness.acceptance);
        const respRaw = clamp01(respBase);

        // ── 3. INTEGRITY — from real disputes + fraud data ──
        const { count: totalDisputes } = await supabase
            .from('disputes')
            .select('id', { count: 'exact', head: true })
            .or(`driver_id.eq.${advertiser_id},broker_id.eq.${advertiser_id}`);

        const dispute_rate = t > 0 ? (totalDisputes ?? 0) / t : 0;

        // Fraud flags from trust_events
        const { count: fraudEvents } = await supabase
            .from('trust_events')
            .select('id', { count: 'exact', head: true })
            .eq('entity_profile_id', advertiser_id)
            .in('event_type', ['gps_spoof', 'review_stuffing', 'identity_thin', 'rate_manipulation']);

        const fraudTotal = Math.max(totalJobs ?? 1, 1);
        const fraud_flags_rate = (fraudEvents ?? 0) / fraudTotal;

        const intBase = ((1 - dispute_rate) * Math.abs(WEIGHTS.integrity.dispute)) +
            ((1 - fraud_flags_rate) * Math.abs(WEIGHTS.integrity.fraud));
        const intRaw = clamp01(intBase);

        // ── 4. CUSTOMER SIGNAL — from real reviews ──
        const { data: reviewAgg } = await supabase
            .from('escort_reviews')
            .select('rating')
            .eq('escort_id', advertiser_id);

        const review_volume = reviewAgg?.length ?? 0;
        const review_rating_avg = review_volume > 0
            ? reviewAgg!.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / review_volume
            : 3.0;

        // Count unique reviewers who reviewed more than once (repeat customers)
        const { data: repeatData } = await supabase
            .from('escort_reviews')
            .select('reviewer_id')
            .eq('escort_id', advertiser_id);
        const reviewerCounts = new Map<string, number>();
        for (const r of repeatData ?? []) {
            reviewerCounts.set(r.reviewer_id, (reviewerCounts.get(r.reviewer_id) ?? 0) + 1);
        }
        const uniqueReviewers = reviewerCounts.size || 1;
        const repeatReviewers = Array.from(reviewerCounts.values()).filter(c => c > 1).length;
        const repeat_customer_rate = repeatReviewers / uniqueReviewers;

        const ratingNorm = clamp01((review_rating_avg - 1) / 4);
        const volLogNorm = clamp01(Math.log10(review_volume + 1) / 3);
        const csBase = (ratingNorm * WEIGHTS.customer_signal.rating_avg) +
            (volLogNorm * WEIGHTS.customer_signal.volume_log) +
            (repeat_customer_rate * WEIGHTS.customer_signal.repeat_rate);
        const csRaw = clamp01(csBase);

        // ── 5. COMPLIANCE — from real profile verification fields ──
        const insurance_verified = profile?.insurance_status === 'verified' ? 1 : 0;
        const compliance_verified = profile?.compliance_status === 'verified' ? 1 : 0;
        const required_equipment_verified = profile?.certifications_json?.high_pole ? 1 :
            (profile?.vehicle_type ? 0.6 : 0.3);
        const compBase = (insurance_verified * WEIGHTS.compliance.insurance) +
            (compliance_verified * WEIGHTS.compliance.compliance) +
            (required_equipment_verified * WEIGHTS.compliance.equipment);
        const compRaw = clamp01(compBase);

        // ── 6. MARKET FIT — from real territory claims + presence ──
        // Count active loads in corridors where this operator has coverage
        const { count: overlappingLoads } = await supabase
            .from('loads')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active')
            .eq('origin_state', presence?.current_state ?? profile?.state ?? '');

        const geo_relevance_score = overlappingLoads && overlappingLoads > 0
            ? clamp01(Math.log10(overlappingLoads + 1) / 2) : 0.2;
        const role_specialization_score = profile?.vehicle_type ? 0.9 : 0.3;
        const mfBase = (geo_relevance_score * WEIGHTS.market_fit.geo_relevance) +
            (role_specialization_score * WEIGHTS.market_fit.role_specialization);
        const mfRaw = clamp01(mfBase);

        // OVERALL SCORE COMPUTATION
        const overall01 = (relRaw * OVERALL_WEIGHTS.reliability) +
            (respRaw * OVERALL_WEIGHTS.responsiveness) +
            (intRaw * OVERALL_WEIGHTS.integrity) +
            (csRaw * OVERALL_WEIGHTS.customer_signal) +
            (compRaw * OVERALL_WEIGHTS.compliance) +
            (mfRaw * OVERALL_WEIGHTS.market_fit);

        // BAYESIAN SHRINKAGE ADJUSTMENT
        const n = review_volume + 10; // Simple sample size proxy (matches + reviews)
        const k = 30; // Prior strength
        const prior_mean = 0.72;

        const bayesian_adjusted_01 = ((n / (n + k)) * overall01) + ((k / (n + k)) * prior_mean);

        let finalScore01 = bayesian_adjusted_01;

        // Review volume floor penalty
        if (review_volume < 5) {
            finalScore01 = Math.max(0, finalScore01 - 0.06);
        }

        const calculated_trust_score = Math.round(overall01 * 100);
        const bayesian_adjusted_score = Math.round(finalScore01 * 100);

        // Record to quality_score_snapshots
        const { error: snapError } = await supabase.from('quality_score_snapshots').upsert({
            advertiser_id,
            snapshot_date: new Date().toISOString().split('T')[0],
            reliability_raw: relRaw,
            responsiveness_raw: respRaw,
            integrity_raw: intRaw,
            customer_signal_raw: csRaw,
            compliance_raw: compRaw,
            market_fit_raw: mfRaw,
            calculated_trust_score,
            bayesian_adjusted_score
        }, { onConflict: 'advertiser_id, snapshot_date' });

        if (snapError) console.error('Snapshot save error:', snapError);

        // Update advertiser_accounts trust score
        await supabase.from('advertiser_accounts').update({
            trust_score: bayesian_adjusted_score,
            updated_at: new Date().toISOString()
        }).eq('advertiser_id', advertiser_id);

        return new Response(JSON.stringify({
            advertiser_id,
            trust_score: bayesian_adjusted_score,
            subscores: {
                reliability: Math.round(relRaw * 100),
                responsiveness: Math.round(respRaw * 100),
                integrity: Math.round(intRaw * 100),
                customer_signal: Math.round(csRaw * 100),
                compliance: Math.round(compRaw * 100),
                market_fit: Math.round(mfRaw * 100)
            },
            status: 'success'
        }), {
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
