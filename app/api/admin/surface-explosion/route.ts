/**
 * HAUL COMMAND — Surface Explosion Trigger
 * 
 * POST /api/admin/surface-explosion
 * Body: { tiers?: ["A","B","C","D"], concurrency?: 4, surface_types?: [...] }
 * 
 * Triggers the Overpass surface ingest across 57 countries.
 * Use tiers to control which countries to process.
 */
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const maxDuration = 300; // 5 min timeout for edge

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
    }

    // Call the orchestrator Edge Function
    const resp = await fetch(`${supabaseUrl}/functions/v1/overpass-surface-orchestrator`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
            tiers: body.tiers || ['A', 'B', 'C', 'D'],
            concurrency: body.concurrency || 4,
            surface_types: body.surface_types || null,
        }),
    });

    if (!resp.ok) {
        const text = await resp.text();
        return NextResponse.json({ error: 'Orchestrator failed', detail: text }, { status: 500 });
    }

    const result = await resp.json();
    return NextResponse.json(result);
}

export async function GET() {
    return NextResponse.json({
        endpoint: '/api/admin/surface-explosion',
        method: 'POST',
        description: 'Triggers Overpass surface ingest across 57 countries',
        body: {
            tiers: ['A', 'B', 'C', 'D'],
            concurrency: 4,
            surface_types: ['fuel_and_services', 'truck_parking', 'hotels_motels', 'ports_harbours', 'logistics_industrial', 'freight_terminals'],
        },
        note: 'Start with tiers=["D"] for a quick test, then ["A"] for high-volume countries',
    });
}
