/**
 * POST /api/presence/decay — Run auto-decay cron
 * Schedule: every 5 minutes
 * Auth: CRON_SECRET or INTERNAL_API_KEY.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PresenceEngine } from '@/core/social/presence_engine';
import { isInternalRequest } from '@/lib/auth/internal-request';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    if (!isInternalRequest(req.headers)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    const engine = new PresenceEngine(admin);
    const result = await engine.runAutoDecay();

    return NextResponse.json({
        ok: true,
        ...result,
        timestamp: new Date().toISOString(),
    });
}
