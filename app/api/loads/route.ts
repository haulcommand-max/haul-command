import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid Request Payload' }, { status: 400 });
  }
}
