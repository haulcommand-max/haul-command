import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/route-request
 *
 * Accepts a free-text route query, resolves it to an hc_corridor if possible,
 * records demand signals, and logs the route request for market intelligence.
 *
 * Body: { originText, destinationText, notes?, requesterRole? }
 * Returns: { status, message, corridorSlug?, corridorName? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      originText = '',
      destinationText = '',
      notes = '',
      requesterRole = 'broker',
    } = body as {
      originText: string;
      destinationText: string;
      notes?: string;
      requesterRole?: string;
    };

    if (!originText.trim() || !destinationText.trim()) {
      return NextResponse.json({ status: 'error', message: 'Origin and destination are required.' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Build a normalized fingerprint for deduplication
    const fingerprint = [
      originText.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      destinationText.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    ].join('__');

    // 2. Try to match an existing hc_corridor via name search
    const searchQuery = `${originText} ${destinationText}`;
    let matchedCorridorId: string | null = null;
    let matchedCorridorSlug: string | null = null;
    let matchedCorridorName: string | null = null;

    const { data: exactMatch } = await supabase
      .from('hc_corridor_public_v1')
      .select('id, slug, name')
      .or(
        `name.ilike.%${originText}%,slug.ilike.%${originText.toLowerCase().replace(/\s+/g, '-')}%`
      )
      .order('corridor_score', { ascending: false })
      .limit(1)
      .single();

    if (exactMatch) {
      matchedCorridorId = exactMatch.id;
      matchedCorridorSlug = exactMatch.slug;
      matchedCorridorName = exactMatch.name;
    }

    // 3. Log the route request
    await supabase.from('hc_route_requests').insert({
      origin_text: originText,
      destination_text: destinationText,
      country_code: 'US',
      requested_service_type: notes || null,
      urgency_level: 'normal',
      requester_role: requesterRole,
      normalized_route_fingerprint: fingerprint,
      converted_to_corridor_id: matchedCorridorId,
    });

    // 4. If matched, record a demand signal
    if (matchedCorridorId) {
      await supabase.from('hc_corridor_demand_signals').insert({
        corridor_id: matchedCorridorId,
        signal_type: 'broker_request',
        signal_count: 1,
        window_days: 30,
        country_code: 'US',
      });

      return NextResponse.json({
        status: 'ok',
        message: `Route matched to ${matchedCorridorName}. Viewing corridor intelligence now.`,
        corridorSlug: matchedCorridorSlug,
        corridorName: matchedCorridorName,
      });
    }

    // 5. No match — still logged for future corridor creation
    return NextResponse.json({
      status: 'no_match',
      message: `Route logged. No existing corridor found for ${originText} → ${destinationText}. Our team will review.`,
    });

  } catch (err) {
    console.error('[route-request API]', err);
    return NextResponse.json({ status: 'error', message: 'Internal server error.' }, { status: 500 });
  }
}
