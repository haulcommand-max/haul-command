import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/events — Publish domain event
// GET  /v1/events?event_id=uuid — Get event status
// ============================================================================

const supabase = () =>
    createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            event_type, event_source, entity_type, entity_id,
            actor_type, actor_id, country_code, region_code,
            market_id, payload, idempotency_key,
        } = body;

        if (!event_type) {
            return NextResponse.json(
                { error: 'event_type is required' },
                { status: 400 },
            );
        }

        const db = supabase();

        // Idempotency check
        if (idempotency_key) {
            const { data: existing } = await db
                .from('hc_events')
                .select('id, status')
                .eq('idempotency_key', idempotency_key)
                .single();

            if (existing) {
                return NextResponse.json({
                    event_id: existing.id,
                    status: existing.status,
                    deduplicated: true,
                });
            }
        }

        const { data, error } = await db
            .from('hc_events')
            .insert({
                event_type,
                event_source: event_source || 'api',
                entity_type: entity_type || null,
                entity_id: entity_id || null,
                actor_type: actor_type || 'system',
                actor_id: actor_id || null,
                country_code: country_code || null,
                region_code: region_code || null,
                market_id: market_id || null,
                payload: payload || {},
                idempotency_key: idempotency_key || null,
                status: 'queued',
            })
            .select('id')
            .single();

        if (error) throw error;

        return NextResponse.json({
            event_id: data.id,
            status: 'queued',
            accepted_at: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error('[v1/events] POST error:', err);
        return NextResponse.json(
            { error: err.message || 'Internal error' },
            { status: 500 },
        );
    }
}

export async function GET(req: NextRequest) {
    const eventId = req.nextUrl.searchParams.get('event_id');

    if (!eventId) {
        return NextResponse.json(
            { error: 'event_id query parameter required' },
            { status: 400 },
        );
    }

    try {
        const db = supabase();
        const { data, error } = await db
            .from('hc_events')
            .select('id, event_type, status, processed_at, error_message, created_at')
            .eq('id', eventId)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            event_id: data.id,
            event_type: data.event_type,
            status: data.status,
            processed_at: data.processed_at,
            error_message: data.error_message,
            created_at: data.created_at,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message },
            { status: 500 },
        );
    }
}
