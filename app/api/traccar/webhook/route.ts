import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const {
    deviceId, deviceName,
    lat, lon, speed, course, altitude, accuracy,
    timestamp, attributes,
  } = payload

  if (!deviceId || lat == null || lon == null) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const ts = timestamp ?? now

  // Look up device
  const { data: device } = await supabase
    .from('hc_gps_devices')
    .select('id, device_type, linked_escort_id')
    .eq('traccar_device_id', String(deviceId))
    .single()

  const writes = [
    supabase.from('hc_gps_signals').insert({
      traccar_device_id: String(deviceId),
      device_name: deviceName,
      lat, lon, speed, course, altitude, accuracy,
      attributes,
      recorded_at: ts,
      created_at: now,
    }),

    supabase.from('hc_gps_latest_position').upsert({
      traccar_device_id: String(deviceId),
      lat, lon, speed, course,
      recorded_at: ts,
      updated_at: now,
    }, { onConflict: 'traccar_device_id' }),

    supabase.from('escort_locations_current').upsert({
      device_id: String(deviceId),
      lat, lon, speed, heading: course,
      last_ping: ts,
      updated_at: now,
    }, { onConflict: 'device_id' }),

    supabase.from('gps_breadcrumbs').insert({
      traccar_device_id: String(deviceId),
      lat, lon, speed,
      recorded_at: ts,
    }),
  ]

  if (device?.linked_escort_id) {
    writes.push(
      supabase.from('hc_escort_location_pings').insert({
        escort_id: device.linked_escort_id,
        traccar_device_id: String(deviceId),
        lat, lon, speed,
        recorded_at: ts,
        created_at: now,
      })
    )
  }

  await Promise.allSettled(writes)

  return NextResponse.json({ ok: true })
}
