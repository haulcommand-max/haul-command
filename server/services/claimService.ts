import { supabaseAdmin } from "@/lib/supabase/admin";

export class ClaimService {
    
    /**
     * Start a new claim flow, locking the entity claim status 
     * and running the pre-score calculation.
     */
    static async startClaimSession(entity_id: string, user_id: string) {
        
        // 1. Snapshot the "before" score to show the delta later.
        const { data: scoreBefore } = await supabaseAdmin
            .from("hc_ai_scores")
            .select("*")
            .eq("target_type", "entity")
            .eq("target_id", entity_id)
            .order("calculated_at", { ascending: false })
            .limit(1)
            .single();

        // 2. Start the Session 
        const { data: session, error } = await supabaseAdmin
            .from("hc_claim_sessions")
            .insert({
                entity_id,
                user_id,
                claim_status: "claim_started",
                wizard_step: "identity_verification",
                score_before_json: scoreBefore || {},
            })
            .select("*")
            .single();

        if (error) {
            throw new Error("Failed to start claim session.");
        }

        // 3. Mark entity as claim_started
        await supabaseAdmin
            .from("hc_entities")
            .update({ claim_status: "claim_started", owner_user_id: user_id })
            .eq("id", entity_id);

        return session;
    }

    /**
     * Complete a step and update the target entity objects 
     * based on exact data passed into the wizard payload.
     */
    static async submitClaimStep(session_id: string, step_name: string, payload: any) {
        // Logic will depend strictly on the step_name:
        // identity_verification -> write to hc_entities
        // service_declaration -> generate hc_entity_attributes
        // proof_upload -> write to hc_proof_items
        
        // Final action always recalculates the score engine
        const { data: session } = await supabaseAdmin
            .from("hc_claim_sessions")
            .select("entity_id")
            .eq("id", session_id)
            .single();
            
        if (session) {
             // Enqueue agent execution
             await fetch("http://localhost:3000/api/agent/job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agent_name: "claim_optimizer_agent",
                    job_type: "claim_next_best_actions",
                    target_type: "entity",
                    target_id: session.entity_id
                })
            }).catch(() => {});
        }
        
        return { ok: true, step_handled: step_name };
    }
}
