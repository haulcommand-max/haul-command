import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('x-motive-signature') ?? ''

  const expected = createHmac('sha256', process.env.MOTIVE_WEBHOOK_SECRET!)
    .update(body).digest('hex')

  if (sig !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)
  const { event_type, data } = payload

  // Log raw event
  await supabase.from('motive_webhook_events').insert({
    event_type,
    payload,
    received_at: new Date().toISOString(),
  })

  switch (event_type) {
    case 'vehicle_location':
      await supabase.from('motive_locations').upsert({
        motive_vehicle_id: String(data.vehicle_id),
        lat: data.lat,
        lon: data.lon,
        speed: data.speed,
        bearing: data.bearing,
        recorded_at: data.located_at,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'motive_vehicle_id' })
      break

    case 'hos_event':
      await supabase.from('motive_hos_events').insert({
        motive_log_id: String(data.id),
        driver_id: String(data.driver_id),
        vehicle_id: String(data.vehicle_id),
        status: data.status,
        event_time: data.start_time,
        duration_ms: data.duration,
        created_at: new Date().toISOString(),
      })
      break

    case 'driver_updated':
      await supabase.from('motive_drivers').upsert({
        motive_driver_id: String(data.id),
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        status: data.status,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'motive_driver_id' })
      break

    case 'vehicle_updated':
      await supabase.from('motive_vehicles').upsert({
        motive_vehicle_id: String(data.id),
        number: data.number,
        vin: data.vin,
        status: data.status,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'motive_vehicle_id' })
      break
  }

  return NextResponse.json({ ok: true })
}
