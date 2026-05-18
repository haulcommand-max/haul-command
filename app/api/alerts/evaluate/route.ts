/**
 * POST /api/alerts/evaluate
 * Evaluates and dispatches smart alerts when a load is created.
 *
 * Called from the load creation flow or as a webhook from Supabase insert trigger.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { SmartAlertsEngine } from '@/core/intelligence/smart_alerts_engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const apiKey = req.headers.get('x-api-key');
        const allowedBearerTokens = [process.env.CRON_SECRET, process.env.INTERNAL_API_KEY]
            .filter(Boolean)
            .map((token) => `Bearer ${token}`);
        const apiKeyAllowed = Boolean(process.env.INTERNAL_API_KEY && apiKey === process.env.INTERNAL_API_KEY);

        if ((!authHeader || !allowedBearerTokens.includes(authHeader)) && !apiKeyAllowed) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { load_id, broker_id, origin_state, dest_state, origin_lat, origin_lng, load_type, rate_per_mile, urgency } = body;

        if (!load_id || !broker_id) {
            return NextResponse.json({ error: 'load_id and broker_id required' }, { status: 400 });
        }

        const engine = new SmartAlertsEngine(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const alerts = await engine.evaluateLoadCreated({
            load_id,
            broker_id,
            origin_state: origin_state ?? '',
            dest_state: dest_state ?? '',
            origin_lat: origin_lat ?? null,
            origin_lng: origin_lng ?? null,
            load_type: load_type ?? '',
            rate_per_mile: rate_per_mile ?? null,
            urgency: urgency ?? 'standard',
        });

        return NextResponse.json({
            ok: true,
            alerts_dispatched: alerts.length,
            alert_types: alerts.map(a => a.type),
        });
    } catch (err) {
        console.error('[Smart Alerts] Evaluate error:', err);
        return NextResponse.json({ error: 'Alert evaluation failed' }, { status: 500 });
    }
}
