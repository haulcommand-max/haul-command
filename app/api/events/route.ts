export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            event_type, session_id, corridor_slug, port_slug,
            operator_id, properties, geo_region,
            corridor_liquidity_score, supply_pct, surface,
        } = body;

        if (!event_type || typeof event_type !== 'string') {
            return NextResponse.json({ error: 'event_type required' }, { status: 400 });
        }

        const supabase = createClient();
        const { error } = await supabase.from('hc_events').insert({
            event_type,
            session_id: session_id ?? null,
            corridor_slug: corridor_slug ?? null,
            port_slug: port_slug ?? null,
            operator_id: operator_id ?? null,
            properties: properties ?? {},
            geo_region: geo_region ?? null,
            corridor_liquidity_score: corridor_liquidity_score ?? null,
            supply_pct: supply_pct ?? null,
            surface: surface ?? null,
        });

        if (error) {
            console.error('[hc_events] insert error:', error.message);
            return NextResponse.json({ ok: false }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
