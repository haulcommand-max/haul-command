import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/skills/{skill_key}/run — Execute a skill
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(
    req: NextRequest,
    { params }: { params: { skill_key: string } },
) {
    try {
        const db = supabase();
        const { skill_key } = params;
        const body = await req.json();
        const { workflow_run_id, input } = body;

        // Resolve skill
        const { data: skill, error: skErr } = await db
            .from('hc_skills')
            .select('id, is_enabled, timeout_seconds')
            .eq('skill_key', skill_key)
            .single();

        if (skErr || !skill) {
            return NextResponse.json(
                { error: `Skill '${skill_key}' not found` },
                { status: 404 },
            );
        }

        if (!skill.is_enabled) {
            return NextResponse.json(
                { error: `Skill '${skill_key}' is disabled` },
                { status: 409 },
            );
        }

        // Create skill run
        const { data: run, error: runErr } = await db
            .from('hc_skill_runs')
            .insert({
                skill_id: skill.id,
                workflow_run_id: workflow_run_id || null,
                status: 'queued',
                input: input || {},
            })
            .select('id')
            .single();

        if (runErr) throw runErr;

        return NextResponse.json({
            skill_run_id: run.id,
            status: 'queued',
        });
    } catch (err: any) {
        console.error('[v1/skills/run] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
