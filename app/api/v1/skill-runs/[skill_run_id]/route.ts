import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /v1/skill-runs/{skill_run_id} — Get skill run status
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(
    _req: NextRequest,
    { params }: { params: { skill_run_id: string } },
) {
    try {
        const db = supabase();
        const { skill_run_id } = params;

        const { data: run, error } = await db
            .from('hc_skill_runs')
            .select(`
                id, status, input, output, model_used,
                tokens_in, tokens_out, cost_usd, duration_ms,
                error_message, retry_count, started_at, completed_at, created_at,
                skill_id
            `)
            .eq('id', skill_run_id)
            .single();

        if (error || !run) {
            return NextResponse.json({ error: 'Skill run not found' }, { status: 404 });
        }

        const { data: skill } = await db
            .from('hc_skills')
            .select('skill_key')
            .eq('id', run.skill_id)
            .single();

        return NextResponse.json({
            skill_run_id: run.id,
            skill_key: skill?.skill_key || 'unknown',
            status: run.status,
            output: run.output,
            model_used: run.model_used,
            cost_usd: run.cost_usd,
            duration_ms: run.duration_ms,
            error_message: run.error_message,
            retry_count: run.retry_count,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
