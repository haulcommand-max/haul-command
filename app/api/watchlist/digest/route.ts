/**
 * POST /api/watchlist/digest — Run watchlist digest batch
 * Called by cron: daily at 07:15, weekly Monday 06:00
 * Auth: service key only.
 *
 * Body: { mode: "daily" | "weekly" }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { WatchlistEngine } from '@/core/social/watchlist_engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` &&
        auth !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
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
