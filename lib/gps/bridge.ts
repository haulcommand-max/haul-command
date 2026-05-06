import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getLatestPositions() {
  const { data } = await supabase
    .from('escort_locations_current')
    .select('*')
    .order('updated_at', { ascending: false })
  return data ?? []
}

export async function getDeviceBreadcrumbs(deviceId: string, hours = 6) {
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString()
  const { data } = await supabase
    .from('gps_breadcrumbs')
    .select('lat, lon, speed, recorded_at')
    .eq('traccar_device_id', deviceId)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true })
  return data ?? []
}

export async function getBridgeHealth() {
  const { data } = await supabase
    .from('hc_v_traccar_bridge_health')
    .select('*')
    .single()
  return data
}

export async function getStaleDevices() {
  const { data } = await supabase
    .from('hc_v_traccar_stale_devices')
    .select('*')
  return data ?? []
}
