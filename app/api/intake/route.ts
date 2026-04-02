import { NextResponse } from 'next/server';
import { routeIntakeEvent, routeBatchIntake, type IntakeChannel } from '@/lib/data/intake-router';

/**
 * HAUL COMMAND: UNIVERSAL INTAKE API (Money OS)
 * 
 * POST /api/intake — Accept inbound requests from any channel.
 * Records to intake_events table for downstream job composition.
 * 
 * Body: { channel, payload, sender_identity?, priority?, country_id?, corridor_id? }
 * Batch: { channel, events: [...] }
 */

const VALID_CHANNELS: IntakeChannel[] = [
  'web_form', 'email', 'api', 'edi', 'voice', 'chat', 'sms', 'marketplace', 'partner_referral'
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channel, payload, events, sender_identity, priority, country_id, corridor_id, metadata } = body;

    if (!channel || !VALID_CHANNELS.includes(channel)) {
      return NextResponse.json({
        error: `Invalid channel. Must be one of: ${VALID_CHANNELS.join(', ')}`,
      }, { status: 400 });
    }

    // Batch mode
    if (events && Array.isArray(events)) {
      const results = await routeBatchIntake(channel, events.map((e: any) => ({
        raw_payload: e.payload || e,
        sender_identity: e.sender_identity || sender_identity,
        priority: e.priority || priority || 'normal',
        country_id: e.country_id || country_id,
        corridor_id: e.corridor_id || corridor_id,
        metadata: e.metadata || metadata,
      })));

      return NextResponse.json({
        success: true,
        mode: 'batch',
        total: results.length,
        queued: results.filter(r => r.status === 'queued').length,
        failed: results.filter(r => r.status === 'failed').length,
        results,
      });
    }

    // Single mode
    if (!payload) {
      return NextResponse.json({ error: 'payload is required' }, { status: 400 });
    }

    const result = await routeIntakeEvent({
      channel,
      raw_payload: payload,
      sender_identity,
      priority: priority || 'normal',
      country_id,
      corridor_id,
      metadata,
    });

    return NextResponse.json({
      success: true,
      mode: 'single',
      ...result,
    });

  } catch (error: any) {
    console.error('[INTAKE_API_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
