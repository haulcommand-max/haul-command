import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

/**
 * Haul Command — Activity Event Generator Cron
 * 
 * Runs every 15 minutes to ensure the activity ticker always has fresh events.
 * Generates events from real platform activity (claims, tool usage, load posts).
 * Falls back to synthetic but truthful events when real activity is low.
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sb = supabaseServer();

    // Count recent events (last hour)
    const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count: recentCount } = await sb
      .from('activity_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo)
      .eq('visibility', 'public');

    // If we have 3+ events in the last hour, ticker is healthy — skip
    if ((recentCount ?? 0) >= 3) {
      return NextResponse.json({ status: 'healthy', recentEvents: recentCount });
    }

    // Generate fresh activity from real data sources
    const events: Array<{
      event_type: string;
      payload: Record<string, string>;
      geo_country: string;
      geo_state: string;
      visibility: string;
    }> = [];

    // Check for recent claims
    const { data: recentClaims } = await sb
      .from('listing_claims')
      .select('id, claim_status, claimed_at')
      .eq('claim_status', 'verified')
      .gte('claimed_at', new Date(Date.now() - 86400_000).toISOString())
      .order('claimed_at', { ascending: false })
      .limit(3);

    if (recentClaims && recentClaims.length > 0) {
      events.push({
        event_type: 'claim',
        payload: {
          summary: `${recentClaims.length} operator${recentClaims.length > 1 ? 's' : ''} claimed today`,
          description: 'New verified operators joining the platform',
        },
        geo_country: 'US',
        geo_state: 'TX',
        visibility: 'public',
      });
    }

    // Count real operators from directory_listings (the canonical operator store)
    // hc_places = physical locations only (ports, hotels, truck stops)
    // directory_listings = operators + service providers (correct source)
    const { count: totalListings } = await sb
      .from('hc_global_operators')
      .select('id', { count: 'exact', head: true })
      .in('entity_type', ['operator', 'pilot_car_operator', 'pilot_driver',
                          'freight_broker', 'flagger', 'permit_service',
                          'heavy_towing', 'mobile_mechanic']);

    if (totalListings && totalListings > 0) {
      events.push({
        event_type: 'rate_update',
        payload: {
          summary: `${totalListings.toLocaleString()} operators now listed globally`,
          description: 'Directory growing across all markets',
        },
        geo_country: 'US',
        geo_state: 'TX',
        visibility: 'public',
      });
    }

    // Insert any generated events
    if (events.length > 0) {
      await sb.from('activity_events').insert(events);
    }

    // Cleanup: remove events older than 7 days to keep table lean
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
    await sb
      .from('activity_events')
      .delete()
      .lt('created_at', sevenDaysAgo);

    return NextResponse.json({ 
      status: 'refreshed', 
      eventsGenerated: events.length,
      recentCount: recentCount ?? 0,
    });
  } catch (err) {
    console.error('Activity cron error:', err);
    return NextResponse.json({ error: 'Activity cron failed' }, { status: 500 });
  }
}
