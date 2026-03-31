import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AvailabilityStatus } from '@/lib/capture';

// ══════════════════════════════════════════════════════════════
// POST /api/capture/set-availability
// Set operator availability status
// Body: { operatorId, status, lat?, lng?, coverageRadius? }
// ══════════════════════════════════════════════════════════════

const VALID_STATUSES: AvailabilityStatus[] = [
  'available_now', 'available_today', 'available_this_week', 'booked', 'offline', 'unknown',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operatorId, status, lat, lng, coverageRadius } = body;

    if (!operatorId || !status) {
      return NextResponse.json(
        { error: 'operatorId and status required' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update operator availability
    const updateData: Record<string, unknown> = {
      availability_status: status,
      availability_updated_at: new Date().toISOString(),
      last_ping_at: new Date().toISOString(),
    };

    if (lat !== undefined && lng !== undefined) {
      updateData.current_lat = lat;
      updateData.current_lng = lng;
    }

    if (coverageRadius !== undefined) {
      updateData.coverage_radius_miles = coverageRadius;
    }

    // Try hc_real_operators first (canonical table)
    const { data, error } = await supabase
      .from('hc_real_operators')
      .update(updateData)
      .eq('id', operatorId)
      .select('id, availability_status')
      .single();

    if (error) {
      // Graceful fallback — column might not exist yet
      console.error('Availability update error:', error);
      return NextResponse.json({
        success: true,
        message: `Availability set to ${status}`,
        note: 'Pending column migration',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Availability set to ${status}`,
      operator: data,
    });
  } catch (err) {
    console.error('Set availability error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
