/**
 * GET /api/presence?operatorId=...  — Get presence display
 * POST /api/presence — Set status (one-tap)
 * Body: { status, corridor_scope?, available_soon_window?, custom_eta? }
 *
 * POST /api/presence/decay — Run auto-decay (cron: every 5 min)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { PresenceEngine } from '@/core/social/presence_engine';

export const dynamic = 'force-dynamic';

function getAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

export async function GET(req: NextRequest) {
    const operatorId = req.nextUrl.searchParams.get('operatorId');
    if (!operatorId) {
        return NextResponse.json({ error: 'operatorId required' }, { status: 400 });
    }

    const viewer = req.nextUrl.searchParams.get('viewer') === 'operator' ? 'operator' : 'broker';
    const engine = new PresenceEngine(getAdmin());
    const display = await engine.getDisplay(operatorId, viewer);

    return NextResponse.json(display);
}

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { status, corridor_scope, available_soon_window, custom_eta } = body;

    if (!status || !['available_now', 'available_soon', 'on_job', 'offline'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const engine = new PresenceEngine(getAdmin());
    const state = await engine.setStatus(user.id, status, {
        corridorScope: corridor_scope,
        availableSoonWindow: available_soon_window,
        customEta: custom_eta,
        sourceSignal: 'operator_toggle',
    });

    return NextResponse.json(state);
}
