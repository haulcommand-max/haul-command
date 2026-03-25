import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// Claude Task CL-11: Regulatory Webhook Ingestion Engine
// Endpoint for receiving pushed regulatory updates from international DOTs and transport authorities

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== process.env.HC_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { country_code, jurisdiction, event_type, complexity_update, raw_payload } = payload;

    if (!country_code || !event_type) {
      return NextResponse.json({ error: 'Missing required regulatory payload fields' }, { status: 400 });
    }

    const sb = supabaseServer();

    // 1. Log the regulatory event
    const { error: logError } = await sb.from('regulatory_events').insert({
      country_code,
      jurisdiction,
      event_type,
      raw_payload,
      processed: false
    });

    if (logError) {
      console.error('Regulatory event log error:', logError);
      // Failsafe: Continue even if event logging fails to guarantee corridor updates
    }

    // 2. If complexity update is provided, adjust matching corridors
    if (complexity_update) {
      // Find all corridors touching this country/jurisdiction
      let query = sb.from('corridors').update({
        permit_complexity: complexity_update,
        updated_at: new Date().toISOString()
      });

      if (jurisdiction) {
        query = query.or(`origin_state.eq.${jurisdiction},destination_state.eq.${jurisdiction}`);
      } else {
        query = query.or(`origin_country.eq.${country_code},destination_country.eq.${country_code}`);
      }

      const { error: updateError } = await query;

      if (updateError) {
        console.error('Corridor complexity update error:', updateError);
        return NextResponse.json({ error: 'Failed to update corridor complexity matrices' }, { status: 500 });
      }
    }

    // 3. Mark the country launch status to reflect regulatory changes registered
    await sb
      .from('country_launch_status')
      .update({ regulatory_notes_done: true })
      .eq('country_code', country_code);

    return NextResponse.json({
      status: 'success',
      message: `Regulatory update [${event_type}] processed for ${country_code} ${jurisdiction || 'National'}`
    });

  } catch (error) {
    console.error('Regulatory webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
