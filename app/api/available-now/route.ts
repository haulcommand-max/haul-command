import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/available-now
 * Returns operators/pilots currently broadcasting availability.
 * Powers: /available-now feed, homepage live strip, find-capacity map layer.
 *
 * Query params:
 *   country     - ISO2 filter (default: US)
 *   region      - state/province code filter
 *   lat, lng    - optional geo center for proximity sort (decimal degrees)
 *   radius_km   - proximity radius (default 250)
 *   limit       - max results (default 20, max 50)
 *   service     - service type filter (pilot_car, height_pole, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const country   = searchParams.get('country')   ?? 'US'
    const region    = searchParams.get('region')     ?? null
    const lat       = parseFloat(searchParams.get('lat')  ?? '0') || null
    const lng       = parseFloat(searchParams.get('lng')  ?? '0') || null
    const radiusKm  = parseInt(searchParams.get('radius_km') ?? '250') || 250
    const limit     = Math.min(parseInt(searchParams.get('limit') ?? '20') || 20, 50)
    const service   = searchParams.get('service')    ?? null

    const supabase = createClient()

    // ── Primary source: hc_available_now (live broadcasts) ──────────────
    let q = supabase
      .from('hc_available_now')
      .select(`
        id,
        operator_id,
        operator_name,
        service_types,
        country_code,
        region_code,
        city,
        lat,
        lng,
        broadcast_message,
        rate_per_hour,
        available_from,
        available_until,
        is_active,
        updated_at
      `)
      .eq('is_active', true)
      .eq('country_code', country)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (region) q = q.eq('region_code', region)
    if (service) q = q.contains('service_types', [service])

    const { data: broadcasts, error } = await q

    if (error) {
      console.error('[available-now] query error:', error.message)
      // Degrade gracefully — return empty rather than 500
      return NextResponse.json({ operators: [], total: 0, source: 'error_fallback' })
    }

    // Filter expired broadcasts client-side (available_until in past)
    const now = new Date()
    const active = (broadcasts ?? []).filter(b => {
      if (!b.available_until) return true
      return new Date(b.available_until) > now
    })

    // Proximity sort if lat/lng provided
    let sorted = active
    if (lat && lng) {
      sorted = active
        .filter(b => b.lat && b.lng)
        .map(b => {
          const dLat = (b.lat - lat) * Math.PI / 180
          const dLng = (b.lng - lng) * Math.PI / 180
          const a = Math.sin(dLat/2)**2 +
            Math.cos(lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180) *
            Math.sin(dLng/2)**2
          const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          return { ...b, distKm }
        })
        .filter(b => b.distKm <= radiusKm)
        .sort((a, b) => a.distKm - b.distKm)
        .concat(active.filter(b => !b.lat || !b.lng).map(b => ({ ...b, distKm: 0 })))
    }

    return NextResponse.json({
      operators: sorted,
      total: sorted.length,
      country,
      region: region ?? null,
      source: 'hc_available_now',
      as_of: new Date().toISOString(),
    }, {
      headers: {
        // 30-second CDN cache, stale-while-revalidate 60s
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      }
    })
  } catch (err: any) {
    console.error('[available-now] unhandled error:', err)
    return NextResponse.json(
      { operators: [], total: 0, error: err.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/available-now
 * Operator sets themselves as available now (broadcast).
 * Body: { service_types, city, region_code, lat?, lng?, rate_per_hour?, broadcast_message?, available_until? }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const {
      service_types,
      operator_name,
      city,
      region_code,
      country_code = 'US',
      lat,
      lng,
      rate_per_hour,
      broadcast_message,
      available_until,
    } = body

    if (!service_types?.length) {
      return NextResponse.json({ error: 'service_types required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('hc_available_now')
      .upsert({
        operator_id: user.id,
        operator_name: operator_name ?? user.email?.split('@')[0] ?? 'Operator',
        service_types,
        country_code,
        region_code,
        city,
        lat,
        lng,
        rate_per_hour,
        broadcast_message,
        available_until: available_until ?? null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'operator_id' })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, id: data?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/available-now
 * Operator clears their broadcast (goes offline).
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await supabase
      .from('hc_available_now')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('operator_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
