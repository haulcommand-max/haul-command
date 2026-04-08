import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { processAgentQueue } from "@/workers/agentRunner";

export async function POST(request: NextRequest) {
    try {
        // Parse incoming job request
        const body = await request.json();
        
        // Ensure required fields
        if (!body.agent_name || !body.job_type || !body.target_type || !body.target_id) {
            return NextResponse.json({ 
                error: "Missing required agent job fields (agent_name, job_type, target_type, target_id)" 
            }, { status: 400 });
        }

        // Insert explicitly into queue layer
        const { data: job, error } = await supabaseAdmin
            .from('hc_agent_jobs')
            .insert({
                agent_name: body.agent_name,
                job_type: body.job_type,
                target_type: body.target_type,
                target_id: body.target_id,
                input_payload_json: body.input_payload_json || {},
                status: 'queued',
                priority: body.priority || 100
            })
            .select('*')
            .single();

        if (error) {
            console.error("Queue insert error:", error);
            return NextResponse.json({ error: "Failed to queue agent job." }, { status: 500 });
        }

        // Immediately trigger the worker to pull the next item if we aren't using a continuous daemon.
        // In a true environment Temporal or a background daemon worker would pole, but for NextJS serverless we can just invoke it here.
        
        // Do not await processAgentQueue here if we want immediate return. 
        // We let it run in the background. In Vercel environments, we'd use waitUntil.
        processAgentQueue().catch(console.error);

        return NextResponse.json({ 
            ok: true, 
            message: "Agent job queued successfully.",
            job_id: job.id
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Invalid payload." }, { status: 400 });
    }
}
