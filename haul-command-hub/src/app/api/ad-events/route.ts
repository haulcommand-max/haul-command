import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * POST /api/ad-events
 * 
 * Track ad impressions and clicks.
 * Body: { creativeId, slotFamily, pageType, pagePath, eventType, countrySlug?, 
 *         corridorSlug?, serviceSlug?, marketMaturity?, urgencyState?, sessionId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      creativeId, slotFamily, pageType, pagePath, eventType,
      countrySlug, corridorSlug, serviceSlug, marketMaturity, urgencyState, sessionId,
    } = body;

    if (!slotFamily || !pageType || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['impression', 'click', 'rotation', 'dismiss'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const sb = supabaseServer();

    // Log the event
    await sb.from('hc_ad_impressions').insert({
      creative_id: creativeId ?? null,
      slot_family: slotFamily,
      page_type: pageType,
      page_path: pagePath ?? null,
      country_slug: countrySlug ?? null,
      corridor_slug: corridorSlug ?? null,
      service_slug: serviceSlug ?? null,
      market_maturity: marketMaturity ?? null,
      urgency_state: urgencyState ?? null,
      event_type: eventType,
      session_id: sessionId ?? null,
    });

    // Update creative stats on click
    if (eventType === 'click' && creativeId) {
      try {
        await sb.rpc('hc_increment_clicks', { p_creative_id: creativeId });
      } catch {
        // RPC may not exist yet — ignore
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
