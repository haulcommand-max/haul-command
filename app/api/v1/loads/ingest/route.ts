import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /v1/loads/ingest — Ingest a load from any source
// GET  /v1/loads?load_id=uuid — Get load details
// ============================================================================

const supabase = () =>
    createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
    try {
        const db = supabase();
        const body = await req.json();
        const { source_name, raw_load } = body;

        if (!source_name || !raw_load) {
            return NextResponse.json(
                { error: 'source_name and raw_load required' },
                { status: 400 },
            );
        }

        // Dedup by source + external_id
        if (raw_load.external_id) {
            const { data: existing } = await db
                .from('hc_loads')
                .select('id')
                .eq('source_name', source_name)
                .eq('external_id', raw_load.external_id)
                .maybeSingle();

            if (existing) {
                // Create observation for this update
                await db.from('hc_load_observations').insert({
                    load_id: existing.id,
                    observation_type: 'repost',
                    observed_data: raw_load,
                    source: source_name,
                });

                return NextResponse.json({
                    load_id: existing.id,
                    status: 'deduplicated',
                });
            }
        }

        // Parse dimensions
        const dims = raw_load.dimensions || {};

        const { data, error } = await db
            .from('hc_loads')
            .insert({
                source_name,
                external_id: raw_load.external_id || null,
                source_url: raw_load.source_url || null,
                origin_text: raw_load.origin || null,
                origin_city: raw_load.origin_city || null,
                origin_region: raw_load.origin_region || null,
                origin_country: raw_load.origin_country || 'US',
                destination_text: raw_load.destination || null,
                destination_city: raw_load.destination_city || null,
                destination_region: raw_load.destination_region || null,
                destination_country: raw_load.destination_country || null,
                length_value: dims.length_ft || dims.length_m || null,
                width_value: dims.width_ft || dims.width_m || null,
                height_value: dims.height_ft || dims.height_m || null,
                weight_value: dims.weight_lbs || dims.weight_kg || null,
                length_unit: dims.length_m ? 'm' : 'ft',
                weight_unit: dims.weight_kg ? 'kg' : 'lbs',
                load_type: raw_load.load_type || null,
                commodity: raw_load.commodity || null,
                rate_amount: raw_load.rate || null,
                rate_type: raw_load.rate_type || 'flat',
                currency_code: raw_load.currency || 'USD',
                pickup_date: raw_load.pickup_date || null,
                delivery_date: raw_load.delivery_date || null,
                escort_count_required: raw_load.escorts_needed || null,
                permits_required: raw_load.permits || [],
                posted_at: raw_load.posted_at || new Date().toISOString(),
                parse_confidence: 0.5,
                raw_payload: raw_load,
                status: 'open',
            })
            .select('id')
            .single();

        if (error) throw error;

        // Publish ingestion event
        await db.from('hc_events').insert({
            event_type: 'load.ingested',
            event_source: source_name,
            entity_type: 'corridor',
            payload: { load_id: data.id, source: source_name },
        });

        return NextResponse.json({
            load_id: data.id,
            status: 'accepted',
        }, { status: 201 });
    } catch (err: any) {
        console.error('[v1/loads/ingest] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const loadId = req.nextUrl.searchParams.get('load_id');
    if (!loadId) {
        return NextResponse.json({ error: 'load_id required' }, { status: 400 });
    }

    try {
        const db = supabase();
        const { data, error } = await db
            .from('hc_loads')
            .select(`
                id, source_name, origin_text, origin_city, origin_region, origin_country,
                destination_text, destination_city, destination_region, destination_country,
                load_type, commodity, escort_count_required,
                rate_amount, rate_type, currency_code,
                status, urgency_score, matchability_score, quality_score,
                corridor_key, estimated_miles,
                pickup_date, delivery_date, posted_at, created_at
            `)
            .eq('id', loadId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Load not found' }, { status: 404 });
        }

        return NextResponse.json({
            load_id: data.id,
            ...data,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
