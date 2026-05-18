/**
 * POST /api/watchlist/digest — Run watchlist digest batch
 * Called by cron: daily at 07:15, weekly Monday 06:00
 * Auth: CRON_SECRET or INTERNAL_API_KEY.
 *
 * Body: { mode: "daily" | "weekly" }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { WatchlistEngine } from '@/core/social/watchlist_engine';
import { isInternalRequest } from '@/lib/auth/internal-request';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    if (!isInternalRequest(req.headers)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode } = await req.json();
    if (!mode || !['daily', 'weekly'].includes(mode)) {
        return NextResponse.json({ error: 'mode must be daily or weekly' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const engine = new WatchlistEngine(admin);
    const result = await engine.runDigestBatch(mode);

    return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() });
}
