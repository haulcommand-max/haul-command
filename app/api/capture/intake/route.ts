// ══════════════════════════════════════════════════════════════
// API: /api/capture/intake — Record capture events to intake_events
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { recordCaptureIntakeEvent } from '@/lib/capture/intake-events';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      event_type,
      offer_type,
      page_path,
      page_type,
      visitor_role,
      identity_rung,
      entity_id,
      metadata,
    } = body;

    // Validate required fields
    if (!event_type || !offer_type || !page_path) {
      return NextResponse.json(
        { error: 'Missing required fields: event_type, offer_type, page_path' },
        { status: 400 }
      );
    }

    // Validate event_type
    const validEvents = ['offer_shown', 'offer_clicked', 'offer_dismissed', 'form_submitted'];
    if (!validEvents.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEvents.join(', ')}` },
        { status: 400 }
      );
    }

    const eventId = await recordCaptureIntakeEvent({
      event_type,
      offer_type,
      page_path,
      page_type,
      visitor_role,
      identity_rung,
      entity_id,
      metadata,
    });

    if (!eventId) {
      return NextResponse.json(
        { error: 'Failed to record intake event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: eventId, status: 'recorded' });
  } catch (e: any) {
    console.error('[api/capture/intake] Error:', e.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
