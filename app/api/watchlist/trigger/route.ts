/**
 * POST /api/watchlist/trigger — Evaluate a watchlist trigger
 * Called internally when corridor spikes, loads posted, etc.
 * Auth: service key only.
 *
 * Body: { trigger_type, target_type, target_id, event_data }
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
