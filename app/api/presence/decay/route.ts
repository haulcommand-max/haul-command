/**
 * POST /api/presence/decay — Run auto-decay cron
 * Schedule: every 5 minutes
 * Auth: service key only
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PresenceEngine } from '@/core/social/presence_engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` &&
        auth !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const engine = new PresenceEngine(admin);
    const result = await engine.runAutoDecay();

    return NextResponse.json({
        ok: true,
        ...result,
        timestamp: new Date().toISOString(),
    });
}
