/**
 * Motive Webhook Receiver
 *
 * POST /api/webhooks/motive
 *
 * Receives real-time events from Motive (vehicle locations, safety events,
 * fuel purchases, HOS violations, dispatch changes) and routes them to
 * the appropriate Supabase tables.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import {
  verifyMotiveWebhookSignature,
  parseMotiveWebhookPayload,
  isRelevantMotiveEvent,
  categorizeMotiveEvent,
} from '@/lib/motive/webhooks';

/**
 * GET /api/webhooks/motive — health check for Motive Developer Portal verification
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'haul-command-motive-webhook',
    timestamp: new Date().toISOString(),
    events: [
      'vehicle_location_updated',
      'hos_violation',
      'dispatch_status_changed',
      'driver_performance_event',
      'fuel_purchase_created',
      'inspection_report_submitted',
      'fault_code_detected',
      'geofence_entry',
      'geofence_exit',
    ],
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-motive-signature') || request.headers.get('x-keeptruckin-signature');

  // 1. Verify signature
  const isValid = await verifyMotiveWebhookSignature(rawBody, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parse payload
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = parseMotiveWebhookPayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
  }

  // 3. Check relevance
  if (!isRelevantMotiveEvent(payload.type)) {
    // Acknowledge but don't process irrelevant events
    return NextResponse.json({ status: 'ignored', type: payload.type });
  }

  const category = categorizeMotiveEvent(payload.type);
  const sb = supabaseServer();

  // 4. Log the event
  const { data: eventRecord } = await sb.from('motive_webhook_events').insert({
    event_type: payload.type,
    motive_company_id: String(payload.company_id),
    object_type: payload.object_type,
    object_id: String(payload.object_id),
    payload: payload.data,
    category,
  }).select('id').single();

  const eventId = eventRecord?.id;

  // 5. Process by category
  try {
    switch (category) {
      case 'position':
        await handlePositionEvent(payload, sb);
        break;
      case 'safety':
        await handleSafetyEvent(payload, sb);
        break;
      case 'compliance':
        await handleComplianceEvent(payload, sb);
        break;
      case 'fuel':
        await handleFuelEvent(payload, sb);
        break;
      case 'dispatch':
        // Future: handle dispatch status changes
        break;
    }

    // Mark as processed
    if (eventId) {
      await sb.from('motive_webhook_events').update({
        processed: true,
        processed_at: new Date().toISOString(),
      }).eq('id', eventId);
    }

    return NextResponse.json({ status: 'processed', type: payload.type, category });
  } catch (err) {
    console.error('[Motive Webhook] Processing failed:', err);

    // Mark as failed with error message
    if (eventId) {
      await sb.from('motive_webhook_events').update({
        processed: false,
        error_message: err instanceof Error ? err.message : 'Processing failed',
      }).eq('id', eventId);
    }

    // Still return 200 so Motive doesn't retry endlessly
    return NextResponse.json({ status: 'error', type: payload.type, message: 'Processing failed' });
  }
}

// ═══════════════════════════════════════════════════════════════
// Event Handlers
// ═══════════════════════════════════════════════════════════════

type SupabaseClient = ReturnType<typeof supabaseServer>;

interface MotiveWebhookData {
  company_id: number;
  data: Record<string, unknown>;
}

async function handlePositionEvent(payload: MotiveWebhookData, sb: SupabaseClient) {
  const data = payload.data;

  // Extract location data from the event
  const lat = Number(data.lat || data.latitude);
  const lng = Number(data.lon || data.lng || data.longitude);
  if (!lat || !lng) return;

  // Find the HC provider by Motive company ID
  const { data: provider } = await sb
    .from('providers')
    .select('id')
    .eq('motive_company_id', String(payload.company_id))
    .single();

  await sb.from('motive_vehicle_positions').insert({
    motive_vehicle_id: String(data.vehicle_id || data.id || ''),
    provider_id: provider?.id || null,
    lat,
    lng,
    heading: data.bearing != null ? Number(data.bearing) : null,
    speed_mph: data.speed != null ? Number(data.speed) : null,
    driver_name: data.driver_name ? String(data.driver_name) : null,
    vehicle_number: data.vehicle_number ? String(data.vehicle_number) : null,
    recorded_at: data.located_at ? String(data.located_at) : new Date().toISOString(),
  });

  // Update provider's last known location
  if (provider?.id) {
    await sb.from('providers').update({
      motive_last_location: { lat, lng, heading: data.bearing, updated_at: new Date().toISOString() },
      motive_last_synced_at: new Date().toISOString(),
    }).eq('id', provider.id);
  }
}

async function handleSafetyEvent(payload: MotiveWebhookData, sb: SupabaseClient) {
  const data = payload.data;

  // Log safety events as they come in — these feed the leaderboard
  const { data: provider } = await sb
    .from('providers')
    .select('id')
    .eq('motive_company_id', String(payload.company_id))
    .single();

  if (!provider) return;

  // For performance events (harsh braking, speeding, etc.), we log them
  // The cron job aggregates them into safety scores periodically
  console.log(`[Motive Webhook] Safety event for provider ${provider.id}: ${data.type || 'unknown'}`);
}

async function handleComplianceEvent(payload: MotiveWebhookData, sb: SupabaseClient) {
  const data = payload.data;

  // HOS violations — flag the operator
  const { data: provider } = await sb
    .from('providers')
    .select('id')
    .eq('motive_company_id', String(payload.company_id))
    .single();

  if (!provider) return;

  console.log(`[Motive Webhook] HOS violation for provider ${provider.id}: ${data.violation_type || 'unknown'}`);
}

async function handleFuelEvent(payload: MotiveWebhookData, sb: SupabaseClient) {
  const data = payload.data;

  // Extract fuel purchase data for rate intelligence
  const pricePerGallon = data.price_per_gallon ? Number(data.price_per_gallon) : null;
  const jurisdiction = data.state || data.jurisdiction;
  if (!jurisdiction) return;

  await sb.from('motive_fuel_observations').insert({
    jurisdiction_code: String(jurisdiction).toUpperCase(),
    fuel_type: data.fuel_type ? String(data.fuel_type) : 'diesel',
    price_per_gallon: pricePerGallon,
    total_cost: data.cost ? Number(data.cost) : null,
    gallons: data.gallons ? Number(data.gallons) : null,
    vendor_name: data.vendor_name ? String(data.vendor_name) : null,
    vehicle_id: data.vehicle_id ? String(data.vehicle_id) : null,
    observed_at: data.purchased_at ? String(data.purchased_at) : new Date().toISOString(),
  });
}
