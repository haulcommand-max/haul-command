import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /v1/workflow-runs/{workflow_run_id} — Get workflow run status + steps
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(
    _req: NextRequest,
    { params }: { params: { workflow_run_id: string } },
) {
    try {
        const db = supabase();
        const { workflow_run_id } = params;

        // Fetch run with workflow key
        const { data: run, error } = await db
            .from('hc_workflow_runs')
            .select(`
                id,
                status,
                current_step,
                context,
                error_message,
                started_at,
                completed_at,
                created_at,
                workflow_id
            `)
            .eq('id', workflow_run_id)
            .single();

        if (error || !run) {
            return NextResponse.json(
                { error: 'Workflow run not found' },
                { status: 404 },
            );
        }

        // Get workflow key
        const { data: workflow } = await db
            .from('hc_workflows')
            .select('workflow_key')
            .eq('id', run.workflow_id)
            .single();

        // Get skill runs for this workflow run
        const { data: skillRuns } = await db
            .from('hc_skill_runs')
            .select(`
                id,
                status,
                model_used,
                tokens_in,
                tokens_out,
                cost_usd,
                duration_ms,
                error_message,
                started_at,
                completed_at,
                skill_id
            `)
            .eq('workflow_run_id', workflow_run_id)
            .order('created_at', { ascending: true });

        // Get step info for each skill run
        const steps = [];
        if (skillRuns) {
            for (const sr of skillRuns) {
                const { data: skill } = await db
                    .from('hc_skills')
                    .select('skill_key')
                    .eq('id', sr.skill_id)
                    .single();

                steps.push({
                    skill_key: skill?.skill_key || 'unknown',
                    status: sr.status,
                    duration_ms: sr.duration_ms,
                    model_used: sr.model_used,
                    error_message: sr.error_message,
                });
            }
        }

        return NextResponse.json({
            workflow_run_id: run.id,
            workflow_key: workflow?.workflow_key || 'unknown',
            status: run.status,
            current_step: run.current_step,
            steps,
            error_message: run.error_message,
            started_at: run.started_at,
            completed_at: run.completed_at,
            created_at: run.created_at,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
