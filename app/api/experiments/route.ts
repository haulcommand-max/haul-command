/**
 * GET /api/experiments/assignment?operatorId=...&experimentId=...
 * Returns the variant assignment + config for an operator.
 *
 * POST /api/experiments/track — Track experiment event
 * Body: { experiment_id, variant_id, operator_id, event_type, metadata? }
 *
 * POST /api/experiments/evaluate — Run daily evaluation (cron)
 * Auth: service key
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PresenceExperimentEngine, ExperimentId } from '@/core/social/presence_experiments';

export const dynamic = 'force-dynamic';

function getAdmin() {
    return getSupabaseAdmin();
}

export async function GET(req: NextRequest) {
    const operatorId = req.nextUrl.searchParams.get('operatorId');
    const experimentId = req.nextUrl.searchParams.get('experimentId') as ExperimentId;

    if (!operatorId || !experimentId) {
        return NextResponse.json({ error: 'operatorId and experimentId required' }, { status: 400 });
    }

    const engine = new PresenceExperimentEngine(getAdmin());
    const result = engine.getVariantConfig(operatorId, experimentId);

    return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { action } = body;

    if (action === 'track') {
        return NextResponse.json(
            {
                error: 'experiment_tracking_not_available',
                status: 'requires_authenticated_event_contract',
                message: 'Public experiment tracking is held until events are bound to an authenticated operator session.',
            },
            { status: 501 },
        );
    }

    if (action === 'evaluate') {
        const auth = req.headers.get('authorization');
        const allowedTokens = [process.env.CRON_SECRET, process.env.INTERNAL_API_KEY]
            .filter(Boolean)
            .map((token) => `Bearer ${token}`);

        if (!auth || !allowedTokens.includes(auth)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const engine = new PresenceExperimentEngine(getAdmin());
        const results = await engine.evaluateAll();
        return NextResponse.json({ ok: true, results, timestamp: new Date().toISOString() });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
