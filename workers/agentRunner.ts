import { supabaseAdmin } from "@/lib/supabase/admin";
import { extractReviewAttributes } from "./reviewAttributeWorker";
import { recalculateEntityScore } from "./scoreRecalcWorker";
import { detectQueryGaps } from "./gapDetectionWorker";
import { buildSurgePage } from "./surgePageBuilderWorker";

export async function processAgentQueue() {
    // 1. Fetch next queued job
    const { data: job, error } = await supabaseAdmin
        .from('hc_agent_jobs')
        .select('*')
        .eq('status', 'queued')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
        
    if (error || !job) {
        return { ok: true, message: "No jobs in queue." };
    }

    // 2. Lock the job
    const { error: lockError } = await supabaseAdmin
        .from('hc_agent_jobs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', job.id)
        .eq('status', 'queued'); // Optimistic lock

    if (lockError) {
        return { ok: false, message: "Could not lock job." };
    }

    try {
        console.log(`[AgentRunner] Executing: ${job.agent_name} -> ${job.job_type}`);
        
        let outputPayload: any = {};
        const input = job.input_payload_json || {};
        
        // 3. Delegate to real worker implementations
        switch (job.agent_name) {
            case "attribute_extractor_agent":
                outputPayload = await extractReviewAttributes({
                    review_id: job.target_id,
                    entity_id: input.entity_id,
                    review_text: input.review_text,
                });
                break;

            case "score_recalc_agent":
                outputPayload = await recalculateEntityScore(job.target_id);
                break;

            case "query_gap_agent":
                outputPayload = await detectQueryGaps({
                    intent_query_id: job.target_id,
                    query_text: input.query_text,
                    query_country_code: input.query_country_code,
                    query_region_code: input.query_region_code,
                });
                break;

            case "surge_page_builder_agent":
                outputPayload = await buildSurgePage({
                    surge_window_id: job.target_id,
                });
                break;

            case "claim_optimizer_agent":
                outputPayload = await runClaimOptimizerAgent(job);
                break;

            case "monetization_agent":
                outputPayload = await runMonetizationAgent(job);
                break;

            case "internal_link_agent":
                outputPayload = await runInternalLinkAgent(job);
                break;

            default:
                throw new Error(`Agent behavior not wired for: ${job.agent_name}`);
        }

        // 4. Mark Complete
        await supabaseAdmin
            .from('hc_agent_jobs')
            .update({ 
                status: 'succeeded', 
                completed_at: new Date().toISOString(),
                output_payload_json: outputPayload
            })
            .eq('id', job.id);

        return { ok: true, job_id: job.id, agent: job.agent_name, output: outputPayload };
            
    } catch (e: any) {
        // 5. Mark Failed
        await supabaseAdmin
            .from('hc_agent_jobs')
            .update({ 
                status: 'failed', 
                completed_at: new Date().toISOString(),
                error_text: e.message || "Unknown error"
            })
            .eq('id', job.id);

        return { ok: false, job_id: job.id, error: e.message };
    }
}

// Remaining stubs until dedicated worker files are built
async function runClaimOptimizerAgent(job: any) {
    return {
        missing_high_value_actions: ["upload_insurance", "declare_availability"],
        expected_score_gain: 15
    };
}

async function runMonetizationAgent(job: any) {
    return {
        eligible_products: ["premium_profile_completion", "twic_ready_boost"],
        reason: "Low AI readiness score with TWIC attribute present natively."
    };
}

async function runInternalLinkAgent(job: any) {
    return {
        slots_generated: 4,
        new_links_inserted: 2,
        orphan_risk: false
    };
}
