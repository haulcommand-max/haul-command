import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/workflows/{workflow_key}/run — Trigger a workflow
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(
    req: NextRequest,
    { params }: { params: { workflow_key: string } },
) {
    try {
        const { workflow_key } = params;
        const body = await req.json();
        const { trigger_event_id, context } = body;

        const db = supabase();

        // Resolve workflow
        const { data: workflow, error: wfErr } = await db
            .from('hc_workflows')
            .select('id, is_enabled, max_concurrency')
            .eq('workflow_key', workflow_key)
            .single();

        if (wfErr || !workflow) {
            return NextResponse.json(
                { error: `Workflow '${workflow_key}' not found` },
                { status: 404 },
            );
        }

        if (!workflow.is_enabled) {
            return NextResponse.json(
                { error: `Workflow '${workflow_key}' is disabled` },
                { status: 409 },
            );
        }

        // Concurrency check
        const { count } = await db
            .from('hc_workflow_runs')
            .select('id', { count: 'exact', head: true })
            .eq('workflow_id', workflow.id)
            .in('status', ['queued', 'running']);

        if ((count ?? 0) >= workflow.max_concurrency) {
            return NextResponse.json(
                { error: 'Max concurrency reached', max: workflow.max_concurrency, current: count },
                { status: 429 },
            );
        }

        // Create run
        const { data: run, error: runErr } = await db
            .from('hc_workflow_runs')
            .insert({
                workflow_id: workflow.id,
                trigger_event_id: trigger_event_id || null,
                status: 'queued',
                context: context || {},
            })
            .select('id')
            .single();

        if (runErr) throw runErr;

        return NextResponse.json({
            workflow_run_id: run.id,
            status: 'queued',
        });
    } catch (err: any) {
        console.error('[v1/workflows/run] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
