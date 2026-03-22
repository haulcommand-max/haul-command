/**
 * POST /api/operator/breadcrumbs
 *
 * Bulk upload GPS breadcrumbs recorded while device was offline.
 * Part of the offline-first architecture.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

interface Breadcrumb {
  operator_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  source?: string;
  recorded_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const breadcrumbs: Breadcrumb[] = body.breadcrumbs;

    if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
      return NextResponse.json({ error: 'No breadcrumbs provided' }, { status: 400 });
    }

    // Limit batch size to 1000
    const batch = breadcrumbs.slice(0, 1000).map((b) => ({
      operator_id: b.operator_id,
      lat: b.lat,
      lng: b.lng,
      accuracy: b.accuracy ?? null,
      heading: b.heading ?? null,
      speed: b.speed ?? null,
      source: b.source ?? 'phone',
      recorded_at: b.recorded_at,
      uploaded_at: new Date().toISOString(),
    }));

    const sb = supabaseServer();
    const { error } = await sb.from('gps_breadcrumbs').insert(batch);

    if (error) {
      console.error('[Breadcrumbs Upload] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ received: batch.length, truncated: breadcrumbs.length > 1000 });
  } catch (err) {
    console.error('[Breadcrumbs Upload] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
