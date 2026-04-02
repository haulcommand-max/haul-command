import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runMatchPipeline, type LoadRequest } from '@/lib/marketplace/match-engine';

/**
 * ════════════════════════════════════════════════════════════════
 * STANDARD CRUD API: /api/loads
 * ════════════════════════════════════════════════════════════════
 * Baseline Next.js route for interacting with the `loads` marketplace.
 * Read (GET) and Create (POST) endpoints for freight brokers.
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(req.url);

    // Standard pagination and generic filters
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const status = searchParams.get('status');
    const origin = searchParams.get('origin_state');
    const destination = searchParams.get('dest_state');

    const startRange = (page - 1) * limit;
    const endRange = startRange + limit - 1;

    let query = supabase
      .from('loads')
      .select('*, broker:broker_profiles(*)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (origin) query = query.eq('origin_state', origin.toUpperCase());
    if (destination) query = query.eq('destination_state', destination.toUpperCase());

    query = query.order('created_at', { ascending: false }).range(startRange, endRange);

    const { data: loads, error, count } = await query;

    if (error) {
      console.error("Loads API GET Error:", error);
      return NextResponse.json({ error: 'Failed to fetch loads' }, { status: 500 });
    }

    return NextResponse.json({
      data: loads,
      meta: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    
    // Auth Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: Broker login required' }, { status: 401 });
    }

    const payload = await req.json();

    // Validate generic payload
    if (!payload.broker_id || !payload.origin_city || !payload.destination_city) {
      return NextResponse.json({ error: 'Missing required freight parameters' }, { status: 400 });
    }

    // Insert payload
    const { data, error } = await supabase
      .from('loads')
      .insert([{
        broker_id: payload.broker_id,
        origin_city: payload.origin_city,
        origin_state: payload.origin_state,
        destination_city: payload.destination_city,
        destination_state: payload.destination_state,
        equipment_type: payload.equipment_type || [],
        commodity: payload.commodity || 'General Freight',
        dimensions: payload.dimensions || '',
        weight: payload.weight || '',
        posted_rate: payload.posted_rate || 0,
        status: 'OPEN',
        pick_up_date: payload.pick_up_date || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error("Loads API POST Error:", error);
      return NextResponse.json({ error: 'Failed to post load' }, { status: 500 });
    }

    // FIRE AUTONOMOUS MATCH ENGINE IN THE BACKGROUND
    // Transform the newly created load row into the required execution shape
    try {
      const matchPayload: LoadRequest = {
          request_id: data.id,
          country_code: 'US', // Fallback to US if expanding generic load schema
          admin1_code: data.origin_state || null,
          origin_lat: payload.origin_lat || 0, // Should be geocoded by UI or background worker if missing
          origin_lon: payload.origin_lon || 0,
          destination_lat: payload.destination_lat || 0,
          destination_lon: payload.destination_lon || 0,
          pickup_time_window: {
              start: new Date(payload.pick_up_date || Date.now()).toISOString(),
              end: new Date((payload.pick_up_date ? new Date(payload.pick_up_date).getTime() : Date.now()) + 86400000).toISOString()
          },
          load_type_tags: payload.equipment_type || [],
          required_escort_count: payload.escorts_needed || 1,
          special_requirements: [],
          broker_id: data.broker_id,
          cross_border_flag: false
      };

      runMatchPipeline(matchPayload).catch((e) => {
        console.error('[MatchEngine] Background pipeline failed to run:', e);
      });
    } catch (e: any) {
      // Non-blocking catch for match engine trigger parsing
      console.warn('[MatchEngine] Failed to trigger Match Pipeline payload construct:', e);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid Request Payload' }, { status: 400 });
  }
}
