/**
 * POST /api/operator/daily-digest
 *
 * Daily digest cron job — nudges incomplete operators with nearby demand.
 * Schedule: 0 12 * * * (noon local)
 *
 * Auth: service key only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ProfileCompletionEngine } from '@/core/engagement/profile_completion_engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` &&
        authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    const engine = new ProfileCompletionEngine(admin);
    const result = await engine.runDailyDigest();

    return NextResponse.json({
        ok: true,
        ...result,
        timestamp: new Date().toISOString(),
    });
}
