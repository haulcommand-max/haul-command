import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/browser-grid/sessions — Create a browser session
// GET  /v1/browser-grid/sessions?session_id=uuid — Get session status
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const db = supabase();
        const body = await req.json();
        const { target_key, recipe_name, workflow_run_id, input } = body;

        if (!target_key) {
            return NextResponse.json({ error: 'target_key required' }, { status: 400 });
        }

        // Resolve target
        const { data: target, error: tErr } = await db
            .from('bg_targets')
            .select('id, is_enabled, health_status')
            .eq('target_key', target_key)
            .single();

        if (tErr || !target) {
            return NextResponse.json({ error: `Target '${target_key}' not found` }, { status: 404 });
        }

        if (!target.is_enabled) {
            return NextResponse.json({ error: `Target '${target_key}' is disabled` }, { status: 409 });
        }

        if (target.health_status === 'blocked') {
            return NextResponse.json(
                { error: `Target '${target_key}' is blocked`, health_status: target.health_status },
                { status: 503 },
            );
        }

        const { data: session, error } = await db
            .from('bg_sessions')
            .insert({
                target_id: target.id,
                workflow_run_id: workflow_run_id || null,
                recipe_name: recipe_name || null,
                status: 'queued',
            })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({
            session_id: session.id,
            status: 'queued',
        }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const sessionId = req.nextUrl.searchParams.get('session_id');
    if (!sessionId) {
        return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    try {
        const db = supabase();

        const { data: session, error } = await db
            .from('bg_sessions')
            .select(`
                id, status, recipe_name, fly_machine_id,
                actions_count, extractions_count, pages_visited, bytes_downloaded,
                started_at, completed_at, duration_ms,
                error_type, error_message, created_at,
                target_id
            `)
            .eq('id', sessionId)
            .single();

        if (error || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const { data: target } = await db
            .from('bg_targets')
            .select('target_key')
            .eq('id', session.target_id)
            .single();

        return NextResponse.json({
            session_id: session.id,
            target_key: target?.target_key || 'unknown',
            status: session.status,
            recipe_name: session.recipe_name,
            actions_count: session.actions_count,
            extractions_count: session.extractions_count,
            pages_visited: session.pages_visited,
            duration_ms: session.duration_ms,
            error_type: session.error_type,
            error_message: session.error_message,
            started_at: session.started_at,
            completed_at: session.completed_at,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
