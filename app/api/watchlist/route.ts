/**
 * GET /api/watchlist — Get user's watches
 * POST /api/watchlist — Add a watch
 * DELETE /api/watchlist — Remove a watch
 * PATCH /api/watchlist — Update digest mode
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { WatchlistEngine } from '@/core/social/watchlist_engine';

export const dynamic = 'force-dynamic';

async function getUser(req: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

function getAdmin() {
    return getSupabaseAdmin();
}

export async function GET(req: NextRequest) {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const engine = new WatchlistEngine(getAdmin());
    const watches = await engine.getUserWatches(user.id);
    return NextResponse.json({ watches });
}

export async function POST(req: NextRequest) {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { watch_type, target_id, target_label, digest_mode, metadata } = body;

    if (!watch_type || !target_id) {
        return NextResponse.json({ error: 'watch_type and target_id required' }, { status: 400 });
    }

    const engine = new WatchlistEngine(getAdmin());
    const result = await engine.addWatch(
        user.id, watch_type, target_id, target_label ?? target_id,
        digest_mode ?? 'daily', metadata ?? {},
    );

    if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ watch: result.watch });
}

export async function DELETE(req: NextRequest) {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { watch_id } = await req.json();
    if (!watch_id) return NextResponse.json({ error: 'watch_id required' }, { status: 400 });

    const engine = new WatchlistEngine(getAdmin());
    const ok = await engine.removeWatch(user.id, watch_id);
    return NextResponse.json({ ok });
}

export async function PATCH(req: NextRequest) {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { watch_id, digest_mode } = await req.json();
    if (!watch_id || !digest_mode) {
        return NextResponse.json({ error: 'watch_id and digest_mode required' }, { status: 400 });
    }

    const engine = new WatchlistEngine(getAdmin());
    const ok = await engine.updateDigestMode(user.id, watch_id, digest_mode);
    return NextResponse.json({ ok });
}
