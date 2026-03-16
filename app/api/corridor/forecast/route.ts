/**
 * GET /api/corridor/forecast?corridor=FL-I75
 * Returns 72-hour forecast for a corridor.
 *
 * POST /api/corridor/forecast — Batch recompute all Florida forecasts
 * Auth: service key. Schedule: every 60 min.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { FloridaLocalAmplifier, FLORIDA_RECTANGLE } from '@/core/social/florida_local_amplifier';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const corridorKey = req.nextUrl.searchParams.get('corridor');
    if (!corridorKey) {
        return NextResponse.json({ error: 'corridor param required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const amp = new FloridaLocalAmplifier(admin);
    const forecast = await amp.generate72hForecast(corridorKey);

    return NextResponse.json(forecast);
}

export async function POST(req: NextRequest) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` &&
        auth !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    const amp = new FloridaLocalAmplifier(admin);
    const forecasts = [];

    for (const c of FLORIDA_RECTANGLE.priority_corridors) {
        const forecast = await amp.generate72hForecast(c.key);

        // Cache to DB
        await admin.from('corridor_forecasts').upsert({
            corridor_key: c.key,
            corridor_name: c.name,
            prediction: forecast.prediction,
            confidence: forecast.confidence,
            predicted_loads: forecast.predicted_loads,
            predicted_shortage: forecast.predicted_shortage,
            reasoning: forecast.reasoning,
            copy: forecast.copy,
            forecast_window: '72h',
            computed_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 4 * 3600000).toISOString(),
        }, { onConflict: 'corridor_key' });

        forecasts.push(forecast);
    }

    return NextResponse.json({
        ok: true,
        corridors_forecast: forecasts.length,
        forecasts,
        timestamp: new Date().toISOString(),
    });
}
