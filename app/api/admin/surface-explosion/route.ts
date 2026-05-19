/**
 * HAUL COMMAND — Surface Explosion Trigger
 * 
 * POST /api/admin/surface-explosion
 * Body: { tiers?: ["A","B","C","D"], concurrency?: 4, surface_types?: [...] }
 * 
 * Triggers the Overpass surface ingest across 120 countries.
 * Use tiers to control which countries to process.
 */
import { NextResponse } from 'next/server';
import { isInternalRequest } from '@/lib/auth/internal-request';

export const maxDuration = 300; // 5 min timeout for edge

export async function POST(req: Request) {
    const adminSecret = req.headers.get('x-admin-secret');
    const isAdmin = Boolean(process.env.HC_ADMIN_SECRET && adminSecret === process.env.HC_ADMIN_SECRET);
    if (!isAdmin && !isInternalRequest(req.headers)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        console.error('[surface-explosion] orchestrator failed:', text);
        return NextResponse.json({ error: 'Orchestrator failed' }, { status: 500 });
    }

    const result = await resp.json();
    return NextResponse.json(result);
}

export async function GET(req: Request) {
    const adminSecret = req.headers.get('x-admin-secret');
    const isAdmin = Boolean(process.env.HC_ADMIN_SECRET && adminSecret === process.env.HC_ADMIN_SECRET);
    if (!isAdmin && !isInternalRequest(req.headers)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
        endpoint: '/api/admin/surface-explosion',
        method: 'POST',
        description: 'Triggers Overpass surface ingest across 120 countries',
        body: {
            tiers: ['A', 'B', 'C', 'D'],
            concurrency: 4,
            surface_types: ['fuel_and_services', 'truck_parking', 'hotels_motels', 'ports_harbours', 'logistics_industrial', 'freight_terminals'],
        },
        note: 'Start with tiers=["D"] for a quick test, then ["A"] for high-volume countries',
    });
}
