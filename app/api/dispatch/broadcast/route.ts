import { NextResponse } from 'next/server';
import { sendRoutedNotification } from '@/lib/notifications/channelRouter';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findDispatchCandidates } from '@/lib/data/dispatch-matcher';
import { routeIntakeEvent } from '@/lib/data/intake-router';

/**
 * HAUL COMMAND: PUSH-FIRST DISPATCH BROADCAST SYSTEM (Money OS Edition)
 * 
 * Wired to:
 * - dispatch_supply / v_dispatch_ready_supply_internal (supply matching)
 * - intake_events (intake tracking)
 * - hc_notification_events (notification logging)
 * 
 * Flow: Broker submits load → intake event recorded → dispatch candidates
 * queried from Money OS view → push notifications sent → logged.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      brokerId, loadId, countryCode, roleKey,
      radiusMiles, originLat, originLng,
      urgentOnly, nightMove, crossBorder 
    } = body;

    if (!countryCode) {
      return NextResponse.json({ error: 'countryCode is required' }, { status: 400 });
    }

    // 1. Record the dispatch request as an intake event
    let intakeEventId: string | null = null;
    try {
      const intake = await routeIntakeEvent({
        channel: 'api',
        raw_payload: body,
        sender_entity_id: brokerId,
        priority: urgentOnly ? 'critical' : 'normal',
        metadata: { type: 'dispatch_broadcast', load_id: loadId },
      });
      intakeEventId = intake.intake_event_id;
    } catch (e) {
      console.warn('[dispatch/broadcast] Intake logging failed, continuing:', e);
    }

    // 2. Find dispatch candidates from Money OS supply view
    const candidates = await findDispatchCandidates({
      country_code: countryCode,
      role_key: roleKey || 'pilot_car_operator',
      urgent_only: urgentOnly,
      night_move: nightMove,
      cross_border: crossBorder,
      origin_lat: originLat,
      origin_lng: originLng,
      radius_miles: radiusMiles || 200,
      limit: 50,
    });

    if (candidates.length === 0) {
      return NextResponse.json({ 
        error: 'No reachable operators inside geofence.',
        country: countryCode,
        role: roleKey,
      }, { status: 404 });
    }

    // 3. Build notification payloads
    const broadcastEventName = 'emergency-load-dispatch';
    
    // 4. Log dispatch events to notification matrix
    const eventLogs = candidates.map(op => ({
      event_name: broadcastEventName,
      recipient_id: op.entity_id,
      idempotency_key: `${loadId}_${op.entity_id}_${Date.now()}`,
      status: 'pushed',
      payload: JSON.stringify({ 
        load_id: loadId,
        country: countryCode,
        role: op.role_key,
        trust_score: op.trust_score_snapshot,
        distance: op.distance_miles,
      }),
    }));

    try {
      await supabaseAdmin.from('hc_notification_events').insert(eventLogs);
      
      // Send priority push/sms through Smart Channel Router
      await Promise.all(candidates.map(op => 
        sendRoutedNotification(op.entity_id, {
          type: 'dispatch_urgent',
          urgency: urgentOnly ? 'critical' : 'high',
          title: `🚨 Load Available: ${countryCode}`,
          body: `New load matching your profile in ${countryCode}. Distance: ${op.distance_miles.toFixed(1)}mi`,
          url: `/jobs/${loadId}`
        }).catch(err => {
          console.warn('[dispatch/broadcast] sendRoutedNotification error for', op.entity_id, err);
        })
      ));
    } catch (e) {
      console.warn('[dispatch/broadcast] Notification logging failed:', e);
    }

    return NextResponse.json({
      success: true,
      operatorsNotified: candidates.length,
      primaryMethod: 'MONEY_OS_DISPATCH',
      intake_event_id: intakeEventId,
      candidates: candidates.map(c => ({
        entity_id: c.entity_id,
        display_name: c.display_name,
        role: c.local_title,
        trust_score: c.trust_score_snapshot,
        distance_miles: c.distance_miles,
        accepts_urgent: c.accepts_urgent,
      })),
      message: `Dispatched to ${candidates.length} operators in ${countryCode} via Money OS supply matching.`,
    });

  } catch (error: any) {
    console.error('[DISPATCH_BROADCAST_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
