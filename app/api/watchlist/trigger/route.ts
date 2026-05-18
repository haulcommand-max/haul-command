/**
 * POST /api/watchlist/trigger — Evaluate a watchlist trigger
 * Called internally when corridor spikes, loads posted, etc.
 * Auth: CRON_SECRET or INTERNAL_API_KEY.
 *
 * Body: { trigger_type, target_type, target_id, event_data }
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

    const { trigger_type, target_type, target_id, event_data } = await req.json();
    if (!trigger_type || !target_type || !target_id) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const engine = new WatchlistEngine(admin);
    const result = await engine.evaluateTrigger(
        trigger_type, target_type, target_id, event_data ?? {},
    );

    return NextResponse.json({ ok: true, ...result });
}
