export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { trackServer } from '@/lib/telemetry';

/**
 * POST /api/users/[id]/block — Block a user
 * DELETE /api/users/[id]/block — Unblock a user
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: blocked_user_id } = await params;

    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (blocked_user_id === user.id) {
        return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = body.reason ?? 'user_reported';

    const { error } = await supabase.from('escort_blocklists').insert({
        blocker_user_id: user.id,
        blocked_user_id,
        reason,
    });

    if (error && error.code !== '23505') { // ignore duplicate
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flag in abuse system (best-effort, non-blocking)
    void supabase.from('abuse_flags').insert({
        profile_id: user.id,
        entity_type: 'user',
        entity_id: blocked_user_id,
        flag_type: 'user_block',
        severity: 2,
        notes: `Blocked by ${user.id}. Reason: ${reason}`,
    });

    await trackServer('api_call', {
        user_id: user.id,
        entity_type: 'user',
        entity_id: blocked_user_id,
        route: `/api/users/${blocked_user_id}/block`,
        status_code: 200,
        metadata: { action: 'block', reason }
    });

    return NextResponse.json({ ok: true, blocked: blocked_user_id });
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: blocked_user_id } = await params;

    const supabase = createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await supabase.from('escort_blocklists')
        .delete()
        .eq('blocker_user_id', user.id)
        .eq('blocked_user_id', blocked_user_id);

    return NextResponse.json({ ok: true, unblocked: blocked_user_id });
}
