import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const operator_id = req.nextUrl.searchParams.get('operator_id')
  if (!operator_id) return NextResponse.json({ error: 'operator_id required' }, { status: 400 })

  const { data: conn } = await supabase
    .from('motive_connections')
    .select('status, connected_at, expires_at')
    .eq('operator_id', operator_id)
    .single()

  if (!conn || conn.status !== 'active') return NextResponse.json({ connected: false })

  const [{ count: driverCount }, { count: vehicleCount }] = await Promise.all([
    supabase.from('motive_drivers').select('*', { count: 'exact', head: true }).eq('operator_id', operator_id),
    supabase.from('motive_vehicles').select('*', { count: 'exact', head: true }).eq('operator_id', operator_id),
  ])

  const { data: lastSync } = await supabase
    .from('motive_drivers')
    .select('synced_at')
    .eq('operator_id', operator_id)
    .order('synced_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({
    connected: true,
    driver_count: driverCount ?? 0,
    vehicle_count: vehicleCount ?? 0,
    last_sync: lastSync?.synced_at ?? null,
    connected_at: conn.connected_at,
  })
}
