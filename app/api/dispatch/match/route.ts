// ══════════════════════════════════════════════════════════════
// API: /api/dispatch/match — Find available operators for a job
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import {
  matchDispatchForJob,
  fetchDispatchStats,
} from '@/lib/engines/dispatch-matching';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      country_code,
      role_key,
      origin_lat,
      origin_lng,
      is_urgent = false,
      is_night_move = false,
      is_cross_border = false,
      max_results = 20,
    } = body;

    if (!country_code || !role_key) {
      return NextResponse.json(
        { error: 'Missing required: country_code, role_key' },
        { status: 400 }
      );
    }

    const supply = await matchDispatchForJob({
      country_code,
      role_key,
      origin_lat: origin_lat ?? 0,
      origin_lng: origin_lng ?? 0,
      is_urgent,
      is_night_move,
      is_cross_border,
      max_results,
    });

    return NextResponse.json({
      matches: supply,
      count: supply.length,
      filters: { country_code, role_key, is_urgent, is_night_move, is_cross_border },
    });
  } catch (e: any) {
    console.error('[api/dispatch/match] Error:', e.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country_code = searchParams.get('country') || undefined;

    const stats = await fetchDispatchStats(country_code);

    return NextResponse.json(stats);
  } catch (e: any) {
    console.error('[api/dispatch/match] Error:', e.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
