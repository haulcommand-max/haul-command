/**
 * POST /api/routes/intel/report — Crowdsource checkpoint/clearance intelligence
 * Operators submit intel from the road. 3+ verifications = Confirmed badge.
 * Each submission earns 5 trust score points.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { haversineDistance } from '@/lib/routes/geo-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operator_id, lat, lng, country_code, checkpoint_type, name, description, severity, clearance_m, obstacle_type, load_id } = body;

    if (!operator_id || lat == null || lng == null) {
      return NextResponse.json({ error: 'operator_id, lat, lng required' }, { status: 400 });
    }

    const supabase = createClient();

    // Determine if this is a clearance report or checkpoint report
    if (clearance_m != null) {
      // Clearance intel — check if similar point exists within 50m
      const { data: existing } = await supabase
        .from('clearance_points')
        .select('id, lat, lng, verified_by_count')
        .gte('lat', lat - 0.0005)
        .lte('lat', lat + 0.0005)
        .gte('lng', lng - 0.0005)
        .lte('lng', lng + 0.0005)
        .limit(10);

      const nearMatch = (existing ?? []).find(e =>
        haversineDistance(lat, lng, e.lat, e.lng) < 50
      );

      if (nearMatch) {
        // Update existing — increment verification
        await supabase
          .from('clearance_points')
          .update({
            clearance_actual_m: clearance_m,
            clearance_source: 'crowdsourced',
            verified_by_count: nearMatch.verified_by_count + 1,
            last_verified_at: new Date().toISOString(),
            notes: description ?? null,
          })
          .eq('id', nearMatch.id);

        // Award trust points
        await awardTrustPoints(supabase, operator_id, 5);

        return NextResponse.json({
          action: 'verified',
          point_id: nearMatch.id,
          verified_count: nearMatch.verified_by_count + 1,
          confirmed: nearMatch.verified_by_count + 1 >= 3,
          trust_points_awarded: 5,
        });
      } else {
        // Create new clearance point
        const { data: newPoint } = await supabase
          .from('clearance_points')
          .insert({
            lat,
            lng,
            country_code: country_code ?? 'US',
            clearance_actual_m: clearance_m,
            clearance_source: 'crowdsourced',
            obstacle_type: obstacle_type ?? 'bridge',
            road_name: name ?? null,
            verified_by_count: 1,
            last_verified_at: new Date().toISOString(),
            notes: description ?? null,
          })
          .select('id')
          .single();

        await awardTrustPoints(supabase, operator_id, 5);

        return NextResponse.json({
          action: 'created',
          point_id: newPoint?.id,
          verified_count: 1,
          confirmed: false,
          trust_points_awarded: 5,
        });
      }
    } else {
      // Checkpoint intel — check for existing checkpoint nearby
      const { data: existing } = await supabase
        .from('route_checkpoints')
        .select('id, lat, lng, verified_count')
        .gte('lat', lat - 0.001)
        .lte('lat', lat + 0.001)
        .gte('lng', lng - 0.001)
        .lte('lng', lng + 0.001)
        .eq('checkpoint_type', checkpoint_type ?? 'weigh_station')
        .limit(5);

      const nearMatch = (existing ?? []).find(e =>
        haversineDistance(lat, lng, e.lat, e.lng) < 200
      );

      if (nearMatch) {
        await supabase
          .from('route_checkpoints')
          .update({
            verified_count: nearMatch.verified_count + 1,
            last_reported_at: new Date().toISOString(),
            description: description ? `${description}` : undefined,
          })
          .eq('id', nearMatch.id);

        await awardTrustPoints(supabase, operator_id, 5);

        return NextResponse.json({
          action: 'verified',
          checkpoint_id: nearMatch.id,
          verified_count: nearMatch.verified_count + 1,
          confirmed: nearMatch.verified_count + 1 >= 3,
          trust_points_awarded: 5,
        });
      } else {
        const { data: newCheckpoint } = await supabase
          .from('route_checkpoints')
          .insert({
            lat,
            lng,
            country_code: country_code ?? 'US',
            checkpoint_type: checkpoint_type ?? 'weigh_station',
            name: name ?? null,
            description: description ?? null,
            severity: severity ?? 'info',
            reported_by: operator_id,
            verified_count: 1,
          })
          .select('id')
          .single();

        await awardTrustPoints(supabase, operator_id, 5);

        return NextResponse.json({
          action: 'created',
          checkpoint_id: newCheckpoint?.id,
          verified_count: 1,
          confirmed: false,
          trust_points_awarded: 5,
        });
      }
    }
  } catch (err) {
    return NextResponse.json({ error: 'Intel report failed', detail: String(err) }, { status: 500 });
  }
}

/** Award trust score points to an operator */
async function awardTrustPoints(supabase: any, operatorId: string, points: number) {
  try {
    // Increment trust score
    const { data: profile } = await supabase
      .from('profiles')
      .select('trust_score')
      .eq('id', operatorId)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ trust_score: (profile.trust_score ?? 0) + points })
        .eq('id', operatorId);
    }
  } catch { /* non-critical */ }
}

/**
 * POST /api/routes/intel/submit — Post-job intel submission (3-question prompt)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { load_id, operator_id, clearance_concerns, strict_checkpoints, checkpoint_lat, checkpoint_lng, timing_issues } = body;

    if (!operator_id) {
      return NextResponse.json({ error: 'operator_id required' }, { status: 400 });
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('route_intel_submissions')
      .insert({
        load_id: load_id ?? null,
        operator_id,
        clearance_concerns: clearance_concerns ?? null,
        strict_checkpoints: strict_checkpoints ?? false,
        checkpoint_lat: checkpoint_lat ?? null,
        checkpoint_lng: checkpoint_lng ?? null,
        timing_issues: timing_issues ?? null,
        trust_points_awarded: 5,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award trust points
    await awardTrustPoints(supabase, operator_id, 5);

    return NextResponse.json({
      submission: data,
      trust_points_awarded: 5,
      message: 'Thank you for your intel. This helps every operator on this corridor.',
    });
  } catch (err) {
    return NextResponse.json({ error: 'Submission failed', detail: String(err) }, { status: 500 });
  }
}
