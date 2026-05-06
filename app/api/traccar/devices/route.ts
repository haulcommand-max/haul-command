import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('hc_gps_devices')
    .select(`
      *,
      latest:hc_gps_latest_position(lat, lon, speed, recorded_at)
    `)
    .order('created_at', { ascending: false })

  return NextResponse.json({ devices: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { traccar_device_id, device_name, device_type, linked_escort_id } = await req.json()

  const { data, error } = await supabase.from('hc_gps_devices').insert({
    traccar_device_id,
    device_name,
    device_type: device_type ?? 'escort',
    linked_escort_id,
    created_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('hc_traccar_bridge').insert({
    traccar_device_id,
    device_name,
    registered_at: new Date().toISOString(),
  })

  return NextResponse.json({ device: data })
}
