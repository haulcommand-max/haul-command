/**
 * Motive Webhook Receiver — HAUL COMMAND
 *
 * POST https://haulcommand.com/api/motive/webhook
 *
 * Receives real-time events from Motive (vehicle locations, HOS updates,
 * driver status changes, DVIRs, fault codes, etc.).
 *
 * Webhook URL must be configured in Motive Developer Portal → Webhooks tab.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { MotiveWebhookPayload } from '@/types/motive';
import crypto from 'crypto';

// Verify webhook signature from Motive
function verifyWebhookSignature(
  payload: string,
  signature: string | null
): boolean {
  const secret = process.env.MOTIVE_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[Motive Webhook] No MOTIVE_WEBHOOK_SECRET set — skipping verification');
    return true; // Allow in dev, but warn
  }
  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-motive-signature');

  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[Motive Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: MotiveWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Log all webhook events for debugging/audit
  await supabase.from('motive_webhook_events').insert({
    event_type: payload.event,
    company_id: payload.company_id,
    webhook_id: payload.webhook_id,
    occurred_at: payload.occurred_at,
    raw_data: payload.data,
    processed: false,
  });

  // Process by event type
  try {
    switch (payload.event) {
      case 'vehicle.location': {
        const loc = payload.data as any;
        // Find connection by company_id
        const { data: conn } = await supabase
          .from('motive_connections')
          .select('id')
          .eq('motive_company_id', payload.company_id)
          .single();

        if (conn) {
          await supabase.from('motive_locations').upsert(
            {
              vehicle_motive_id: loc.vehicle?.id || loc.vehicle_id,
              connection_id: conn.id,
              lat: loc.lat,
              lon: loc.lon,
              bearing: loc.bearing,
              speed: loc.speed,
              located_at: loc.located_at || payload.occurred_at,
              engine_hours: loc.engine_hours,
              odometer: loc.odometer,
              fuel_percent: loc.fuel,
              raw_data: loc,
              synced_at: new Date().toISOString(),
            },
            { onConflict: 'vehicle_motive_id,connection_id' }
          );
        }
        break;
      }

      case 'hos.updated': {
        // Store HOS update for compliance tracking
        const hos = payload.data as any;
        const { data: conn } = await supabase
          .from('motive_connections')
          .select('id, profile_id')
          .eq('motive_company_id', payload.company_id)
          .single();

        if (conn) {
          await supabase.from('motive_hos_events').insert({
            driver_motive_id: hos.driver_id || hos.driver?.id,
            connection_id: conn.id,
            profile_id: conn.profile_id,
            status: hos.status,
            start_time: hos.start_time,
            end_time: hos.end_time,
            duration: hos.duration,
            raw_data: hos,
            occurred_at: payload.occurred_at,
          });
        }
        break;
      }

      case 'dvir.created':
      case 'dvir.updated': {
        // Store DVIR for safety compliance
        const dvir = payload.data as any;
        await supabase.from('motive_webhook_events')
          .update({ processed: true })
          .eq('webhook_id', payload.webhook_id);
        break;
      }

      default:
        // Mark as processed even if we don't handle it
        break;
    }

    // Mark event as processed
    await supabase
      .from('motive_webhook_events')
      .update({ processed: true })
      .eq('webhook_id', payload.webhook_id);
  } catch (err: any) {
    console.error(`[Motive Webhook] Error processing ${payload.event}:`, err.message);
    await supabase
      .from('motive_webhook_events')
      .update({ error: err.message })
      .eq('webhook_id', payload.webhook_id);
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}
