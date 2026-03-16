/**
 * POST /api/cron/urgency — Run urgency engine batch jobs
 * Handles: reactivation sequence, profile attention push, idle reactor
 * Schedule: every 6 hours
 * Auth: service key only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { UrgencyEngine } from '@/core/social/urgency_engine';
import { IdleOperatorReactor } from '@/core/social/idle_operator_reactor';
import { runReactivationWithIntelligence } from '@/lib/platform/reactivation-bridge';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` &&
        auth !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    // 1. Reactivation sequence (3d/7d/14d/30d win-back)
    //    Routed through NotificationIntelligence for smart throttling + fatigue detection
    const reactivation = await runReactivationWithIntelligence();

    const urgency = new UrgencyEngine(admin);

    // 2. Profile attention ("viewed X times today")
    const attention = await urgency.runProfileAttentionBatch();

    // 3. Idle operator reactor (48-96h wake-ups)
    const reactor = new IdleOperatorReactor(admin);
    const idle = await reactor.scan();

    return NextResponse.json({
        ok: true,
        reactivation,
        profile_attention: attention,
        idle_reactor: { scanned: idle.scanned, nudged: idle.nudged },
        timestamp: new Date().toISOString(),
    });
}
