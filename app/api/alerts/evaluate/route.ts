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
        // Validate service key auth (this is a server-to-server call)
        const authHeader = req.headers.get('authorization');
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceKey) {
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }

        // Accept either service-role bearer or internal API key
        const expectedKey = `Bearer ${serviceKey}`;
        if (authHeader !== expectedKey) {
            // Also check for internal API key
            const apiKey = req.headers.get('x-api-key');
            if (apiKey !== process.env.INTERNAL_API_KEY && authHeader !== expectedKey) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
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
        return NextResponse.json({ error: 'Alert evaluation failed', detail: String(err) }, { status: 500 });
    }
}
