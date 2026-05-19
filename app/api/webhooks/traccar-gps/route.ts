import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isInternalRequest } from '@/lib/auth/internal-request';

// POST /api/webhooks/traccar-gps
// Traccar sends position updates to this endpoint
// Configure in Traccar: Settings → Server → Web Hooks URL
// Format: application/json

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const isWebhook = Boolean(
      process.env.TRACCAR_WEBHOOK_SECRET && authHeader === `Bearer ${process.env.TRACCAR_WEBHOOK_SECRET}`
    );
    if (!isWebhook && !isInternalRequest(req.headers)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Traccar position webhook format
    const { position, device } = body;
    
    if (!position || !device) {
      return NextResponse.json({ error: 'Missing position or device' }, { status: 400 });
    }

    const { latitude, longitude, speed, course, address, attributes, deviceTime } = position;
    const { id: device_id, name: device_name, uniqueId: device_unique_id } = device;

    // Write to hc_gps_signals
    const { error: signalError } = await supabase.from('hc_gps_signals').insert({
      device_id: String(device_id),
      device_name,
      device_unique_id,
      lat: latitude,
      lng: longitude,
      speed_knots: speed ?? 0,
      heading: course ?? 0,
      address: address ?? null,
      attributes: attributes ?? {},
      recorded_at: deviceTime ?? new Date().toISOString(),
    });

    if (signalError) {
      console.error('[traccar-gps] Insert error:', signalError.message);
      return NextResponse.json({ error: 'GPS signal write failed' }, { status: 500 });
    }

    // Also update escort_locations_current (live operator position)
    if (device_unique_id) {
      await supabase.from('escort_locations_current').upsert({
        device_uid: device_unique_id,
        device_name,
        lat: latitude,
        lng: longitude,
        speed_knots: speed ?? 0,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'device_uid' });
    }

    return NextResponse.json({ ok: true, device: device_unique_id });
  } catch (err) {
    console.error('[traccar-gps] Error:', err);
    return NextResponse.json({ error: 'GPS webhook failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'traccar-gps-bridge' });
}
