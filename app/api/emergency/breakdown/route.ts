import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Emergency replacement dispatch API
// Track 4: When operator reports breakdown, find nearest replacement
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { job_id, breakdown_lat, breakdown_lng, miles_completed, miles_remaining, original_rate } = body;
    if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 });

    const premiumRate = (original_rate || 380) * 1.25; // 125% premium
    const partialPayment = ((miles_completed || 0) / ((miles_completed || 0) + (miles_remaining || 1))) * (original_rate || 380);

    // Create emergency replacement record
    const { data: replacement, error } = await supabase.from('emergency_replacements').insert({
      original_job_id: job_id,
      breakdown_operator_id: user.id,
      breakdown_lat: breakdown_lat || null,
      breakdown_lng: breakdown_lng || null,
      miles_completed: miles_completed || 0,
      miles_remaining: miles_remaining || 0,
      original_rate: original_rate || 380,
      premium_rate: premiumRate,
      partial_payment: partialPayment,
      status: 'searching',
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Query available operators near breakdown location
    // In production, this would use PostGIS for geospatial queries
    // For now, query all available operators and the FCM push layer handles targeting
    const today = new Date().toISOString().split('T')[0];
    const { data: availableOps } = await supabase
      .from('operator_availability')
      .select('operator_id')
      .eq('available_date', today)
      .eq('status', 'available')
      .limit(5);

    const notifiedIds = (availableOps || []).map(o => o.operator_id);

    // Update replacement with notified operators
    await supabase.from('emergency_replacements')
      .update({ notified_operators: notifiedIds, status: 'notified' })
      .eq('id', replacement.id);

    // Fire FCM push notifications to available operators
    if (notifiedIds.length > 0) {
      try {
        const { data: tokens } = await supabase
          .from('push_tokens')
          .select('token')
          .in('user_id', notifiedIds);

        if (tokens && tokens.length > 0) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/fcm/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tokens: tokens.map(t => t.token),
              title: '🚨 URGENT — Breakdown Replacement Needed',
              body: `Emergency escort replacement on active corridor. $${premiumRate.toFixed(0)}/day premium rate. ${miles_remaining || '?'} miles remaining.`,
              data: { type: 'emergency_replacement', replacement_id: replacement.id, job_id },
            }),
          }).then(()=>{});
        }
      } catch { /* FCM failure is non-fatal */ }
    }

    return NextResponse.json({
      replacement_id: replacement.id,
      premium_rate: premiumRate,
      partial_payment: partialPayment,
      operators_notified: notifiedIds.length,
      status: 'notified',
    });
  } catch {
    return NextResponse.json({ error: 'Emergency dispatch failed' }, { status: 500 });
  }
}
