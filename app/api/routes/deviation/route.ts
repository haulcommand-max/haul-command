/**
 * POST /api/routes/deviation — Report route deviation
 * Called automatically when operator is 200m+ off permit route.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { load_id, operator_id, deviation_lat, deviation_lng, distance_from_route_m } = body;

    if (!load_id || !operator_id || !deviation_lat || !deviation_lng) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();
    const severity = distance_from_route_m > 1000 ? 'critical'
      : distance_from_route_m > 500 ? 'warning' : 'info';

    // Create deviation record
    const { data: deviation, error } = await supabase
      .from('route_deviations')
      .insert({
        load_id,
        operator_id,
        deviation_lat,
        deviation_lng,
        distance_from_route_m: Math.round(distance_from_route_m),
        severity,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to record deviation', detail: error.message }, { status: 500 });
    }

    // Update convoy position to flag off-route
    await supabase
      .from('convoy_positions')
      .update({ on_permit_route: false })
      .eq('load_id', load_id)
      .eq('operator_id', operator_id);

    // Get operator and load info for alert messages
    const [{ data: operator }, { data: load }] = await Promise.all([
      supabase.from('profiles').select('display_name, full_name').eq('id', operator_id).single(),
      supabase.from('hc_loads').select('title, broker_id').eq('id', load_id).single(),
    ]);

    const operatorName = operator?.display_name ?? operator?.full_name ?? 'Operator';
    const loadTitle = load?.title ?? 'Load';

    // Send FCM push to broker (via push notification API)
    if (load?.broker_id) {
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com'}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: load.broker_id,
          title: '⚠️ ROUTE DEVIATION',
          body: `${operatorName} has deviated ${Math.round(distance_from_route_m)}m from permitted route on "${loadTitle}". ${severity === 'critical' ? 'IMMEDIATE ATTENTION REQUIRED.' : ''}`,
          data: { type: 'route_deviation', load_id, deviation_id: deviation.id },
        }),
      }).then(()=>{});
    }

    // Send push to the operator themselves
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haulcommand.com'}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: operator_id,
        title: '🚨 OFF PERMITTED ROUTE',
        body: `You have left your permitted route by ${Math.round(distance_from_route_m)}m. Return to route immediately to avoid permit violations.`,
        data: { type: 'route_deviation', load_id, deviation_id: deviation.id },
      }),
    }).then(()=>{});

    return NextResponse.json({
      deviation,
      alert_sent: true,
      severity,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Deviation report failed', detail: String(err) }, { status: 500 });
  }
}
