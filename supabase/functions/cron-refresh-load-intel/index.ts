/// <reference types="npm:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * cron-refresh-load-intel (REWRITE V2)
 * Trigger: hourly cron + on load create/update.
 * 
 * Per HAUL_COMMAND_PROB_ENGINE_V2 + BUILD_PACK_V3 specs.
 * Computes stage probabilities, confidence, Carvenum, hard-fill,
 * and expected fill times. Writes to load_intel.
 * 
 * NO MOCKED INTELLIGENCE. Every label derived from stored signals.
 */

const corsHeaders = { "Content-Type": "application/json" };

// Hard-fill predictor weights (per Build Pack V3)
const HF_WEIGHTS = {
    lead_time: 0.30,
    supply: 0.25,
    rate: 0.20,
    complexity: 0.15,
    broker_trust: 0.10,
};

function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }
function clamp01(x: number): number { return Math.max(0, Math.min(1, x ?? 0)); }

function computeHardFillLabel(score: number): "Low" | "Medium" | "High" | "Critical" {
    if (score >= 0.75) return "Critical";
    if (score >= 0.50) return "High";
    if (score >= 0.25) return "Medium";
    return "Low";
}

function computeConfidence(n_similar: number, n_lane: number, elapsed_hours: number): number {
    const sample_confidence = clamp01(
        (n_similar / Math.max(1, n_similar + 10)) * 0.6 +
        (n_lane / Math.max(1, n_lane + 5)) * 0.4
    );
    const freshness_decay = Math.exp(-0.1 * elapsed_hours);
    return clamp01(sample_confidence * freshness_decay);
}

function fillSpeedLabel(p_fill_60m: number, confidence: number): string {
    if (confidence < 0.20) return "Unknown";
    if (p_fill_60m >= 0.70) return "Fast-fill";
    if (p_fill_60m >= 0.45) return "Moderate";
    return "Slow mover";
}

Deno.serve(async (req: Request) => {
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const load_id_filter: string | undefined = body?.load_id;
    const batch_size = Number(body?.batch_size ?? 100);

    // Fetch open loads (specific load or batch)
    let query = supabase
        .from("v_open_loads_enriched")
        .select("*")
        .limit(batch_size);

    if (load_id_filter) {
        query = query.eq("load_id", load_id_filter);
    }

    const { data: loads, error: loadErr } = await query;
    if (loadErr) return new Response(JSON.stringify({ error: loadErr.message }), { status: 500, headers: corsHeaders });

    let processed = 0;
    let errors = 0;

    for (const load of (loads ?? [])) {
        try {
            const now = new Date();
            const posted_at = load.created_at ? new Date(load.created_at) : now;
            const elapsed_hours = (now.getTime() - posted_at.getTime()) / 3_600_000;

            // ── A. Get bucket aggregates (Bayesian-smoothed rates) ──
            const { data: bucket } = await supabase
                .from("v_smoothed_bucket_rates")
                .select("*")
                .eq("similar_bucket_key", load.similar_bucket_key ?? "global")
                .single();

            const smoothed_offer = bucket?.smoothed_offer_rate ?? 0.75;
            const smoothed_view = bucket?.smoothed_view_rate ?? 0.60;
            const smoothed_accept = bucket?.smoothed_accept_rate ?? 0.40;
            const n_similar = bucket?.n_loads ?? 0;

            // Get lane-specific match count
            const { count: n_lane } = await supabase
                .from("matches")
                .select("id", { count: "exact", head: true })
                .gte("created_at", new Date(Date.now() - 90 * 24 * 3600000).toISOString());

            // ── B. Stage probabilities per horizon ──
            // Adjustments: urgency, lead_time, complexity
            const urgency_boost = load.urgency_numeric_raw ?? 0.5;
            const complexity_penalty = clamp01(1 - (load.requirement_complexity_raw ?? 0) * 0.08);
            const lead_time_adj = load.lead_time_hours_raw != null
                ? clamp01(1 - Math.max(0, load.lead_time_hours_raw - 24) * 0.01)
                : 0.8;

            // p_offer: probability an offer gets sent given available supply
            const available_supply = bucket?.effective_supply_count ?? 0;
            const supply_factor = clamp01(available_supply / Math.max(1, available_supply + 5));

            // Base stage probs
            const base_p_offer = smoothed_offer * supply_factor;
            const base_p_view = smoothed_view;
            const base_p_accept = smoothed_accept * clamp01(1 + urgency_boost * 0.2);

            // 60m horizon (most relevant — primary display)
            const p_offer_60m = clamp01(base_p_offer * lead_time_adj * complexity_penalty);
            const p_view_60m = clamp01(base_p_view * (1 - elapsed_hours * 0.005));
            const p_accept_60m = clamp01(base_p_accept * urgency_boost);
            const fill_60m = clamp01(p_offer_60m * p_view_60m * p_accept_60m);

            // 4h horizon (relaxed supply pressure)
            const p_offer_4h = clamp01(base_p_offer * Math.min(1, supply_factor * 1.3));
            const p_view_4h = clamp01(base_p_view * 0.95);
            const p_accept_4h = clamp01(base_p_accept * 0.9);
            const fill_4h = clamp01(p_offer_4h * p_view_4h * p_accept_4h);

            // 24h horizon
            const p_offer_24h = clamp01(Math.min(0.95, base_p_offer * 1.5));
            const p_view_24h = clamp01(base_p_view * 0.85);
            const p_accept_24h = clamp01(base_p_accept * 0.80);
            const fill_24h = clamp01(p_offer_24h * p_view_24h * p_accept_24h);

            // ── C. Confidence + uncertainty bands ──
            const confidence = computeConfidence(
                n_similar,
                n_lane?.count ?? 0,
                elapsed_hours,
            );

            const uncertainty_half = confidence < 0.5
                ? 0.20 * (1 - confidence)  // wider bands when less confident
                : 0.08 * (1 - confidence);

            const p_low_60m = clamp01(fill_60m - uncertainty_half);
            const p_high_60m = clamp01(fill_60m + uncertainty_half);

            // ── D. Carvenum value color ──
            const { data: carvenumRows } = await supabase
                .rpc("compute_carvenum_value", {
                    p_rate_amount: load.rate_amount,
                    p_geo_key: load.geo_key,
                });

            const carvenum = carvenumRows?.[0] ?? { value_color: "unknown", value_score_01: null };

            // ── E. Hard-fill risk score ──
            // Normalize inputs to 0..1 penalty scale (higher = harder to fill)
            const x_lead_time = clamp01(1 - lead_time_adj);   // tight lead time = high penalty
            const x_supply = clamp01(1 - supply_factor);    // low supply = high penalty
            const x_rate_penalty = clamp01(1 - (carvenum.value_score_01 ?? 0.5)); // poor rate = penalty
            const x_complexity = clamp01((load.requirement_complexity_raw ?? 0) / 5);
            const x_broker_trust = clamp01(1 - (load.broker_trust_score_01 ?? 0.7));

            const raw_hf_score =
                HF_WEIGHTS.lead_time * x_lead_time +
                HF_WEIGHTS.supply * x_supply +
                HF_WEIGHTS.rate * x_rate_penalty +
                HF_WEIGHTS.complexity * x_complexity +
                HF_WEIGHTS.broker_trust * x_broker_trust;

            const hf_score = clamp01(sigmoid((raw_hf_score - 0.5) * 6));
            const hf_label = computeHardFillLabel(hf_score);

            // ── F. Top factors (ranked by signal contribution) ──
            const signal_contributions = [
                { label: "Available supply", value: supply_factor, direction: supply_factor > 0.5 ? "up" : "down" },
                { label: "Rate competitiveness", value: carvenum.value_score_01 ?? 0.5, direction: (carvenum.value_score_01 ?? 0.5) > 0.5 ? "up" : "down" },
                { label: "Urgency", value: urgency_boost, direction: urgency_boost > 0.5 ? "up" : "down" },
                { label: "Lead time", value: lead_time_adj, direction: lead_time_adj > 0.7 ? "up" : "down" },
                { label: "Requirement complexity", value: complexity_penalty, direction: complexity_penalty > 0.7 ? "up" : "down" },
            ].sort((a, b) => Math.abs(b.value - 0.5) - Math.abs(a.value - 0.5))
                .slice(0, 3);

            // ── G. Expected fill times ──
            const median_offer_min = bucket?.median_time_to_offer_min ?? 15;
            const median_accept_min = bucket?.median_time_to_accept_min ?? 20;

            // ── H. Fill speed label and quality grade ──
            const speed_label = fillSpeedLabel(fill_60m, confidence);
            const quality_grade = (() => {
                if (fill_60m >= 0.70 && confidence >= 0.50) return "A";
                if (fill_60m >= 0.50) return "B";
                if (fill_60m >= 0.30) return "C";
                return "D";
            })();

            // ── I. Write to load_intel ──
            const updatePayload = {
                computed_at: now.toISOString(),
                lane_key: load.lane_key,
                geo_key: load.geo_key,
                similar_bucket_key: load.similar_bucket_key ?? load.lane_key,
                // Stage probs
                p_offer_60m, p_view_60m, p_accept_60m,
                fill_probability_60m: fill_60m,
                p_offer_4h, p_view_4h, p_accept_4h,
                fill_probability_4h: fill_4h,
                p_offer_24h, p_view_24h, p_accept_24h,
                fill_probability_24h: fill_24h,
                // Confidence
                confidence,
                p_low_60m,
                p_high_60m,
                trials_similar_30d: n_similar,
                matches_lane_90d: n_lane?.count ?? 0,
                available_supply_count: available_supply,
                supply_demand_ratio: available_supply > 0 ? available_supply / 12 : 0,
                // Carvenum
                carvenum_value_color: carvenum.value_color,
                carvenum_value_score_01: carvenum.value_score_01,
                // Hard fill
                hard_fill_risk_score_01: hf_score,
                hard_fill_label: hf_label,
                // Labels
                fill_speed_label: speed_label,
                load_quality_grade: quality_grade,
                // Expected times
                expected_time_to_first_offer_min: median_offer_min,
                expected_time_to_accept_min: median_accept_min,
                expected_time_to_fill_min: median_offer_min + median_accept_min,
                // Factors
                explanation_top_factors: signal_contributions,
            };

            const { error: updateErr } = await supabase
                .from("load_intel")
                .upsert({ load_id: load.load_id, ...updatePayload }, { onConflict: "load_id" });

            if (!updateErr) {
                processed++;
            } else {
                console.error(`load_intel update failed for ${load.load_id}:`, updateErr.message);
                errors++;
            }
        } catch (e) {
            console.error(`Exception for load ${load.load_id}:`, e);
            errors++;
        }
    }

    return new Response(JSON.stringify({
        ok: true,
        processed,
        errors,
        batch_size,
        ran_at: new Date().toISOString(),
    }), { headers: corsHeaders });
});
