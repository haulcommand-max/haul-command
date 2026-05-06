import { getMotiveClient } from './oauth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function syncDrivers(operatorId: string) {
  const client = await getMotiveClient(operatorId)
  const { data } = await client.get('/users', { params: { role: 'driver', per_page: 100 } })
  const drivers = data.users ?? []

  for (const d of drivers) {
    await supabase.from('motive_drivers').upsert({
      operator_id: operatorId,
      motive_driver_id: String(d.id),
      first_name: d.first_name,
      last_name: d.last_name,
      email: d.email,
      phone: d.phone,
      status: d.status,
      license_number: d.driver_license_number,
      synced_at: new Date().toISOString(),
    }, { onConflict: 'motive_driver_id' })
  }
  return drivers.length
}

export async function syncVehicles(operatorId: string) {
  const client = await getMotiveClient(operatorId)
  const { data } = await client.get('/vehicles', { params: { per_page: 100 } })
  const vehicles = data.vehicles ?? []

  for (const v of vehicles) {
    await supabase.from('motive_vehicles').upsert({
      operator_id: operatorId,
      motive_vehicle_id: String(v.id),
      number: v.number,
      make: v.make,
      model: v.model,
      year: v.year,
      vin: v.vin,
      license_plate: v.license_plate_number,
      status: v.status,
      synced_at: new Date().toISOString(),
    }, { onConflict: 'motive_vehicle_id' })
  }
  return vehicles.length
}

export async function syncHOSEvents(operatorId: string, since?: string) {
  const client = await getMotiveClient(operatorId)
  const params: any = { per_page: 200 }
  if (since) params.start_ms = new Date(since).getTime()

  const { data } = await client.get('/hos_logs', { params })
  const logs = data.hos_logs ?? []

  for (const log of logs) {
    await supabase.from('motive_hos_events').insert({
      operator_id: operatorId,
      motive_log_id: String(log.id),
      driver_id: String(log.driver?.id),
      vehicle_id: String(log.vehicle?.id),
      status: log.status,
      event_time: log.start_time,
      duration_ms: log.duration,
      location: log.location,
      created_at: new Date().toISOString(),
    }).onConflict('motive_log_id').ignore()
  }
  return logs.length
}

export async function syncLocations(operatorId: string) {
  const client = await getMotiveClient(operatorId)
  const { data } = await client.get('/vehicle_locations', { params: { per_page: 100 } })
  const locations = data.vehicle_locations ?? []

  for (const loc of locations) {
    await supabase.from('motive_locations').upsert({
      operator_id: operatorId,
      motive_vehicle_id: String(loc.vehicle?.id),
      lat: loc.lat,
      lon: loc.lon,
      speed: loc.speed,
      bearing: loc.bearing,
      recorded_at: loc.located_at,
      synced_at: new Date().toISOString(),
    }, { onConflict: 'motive_vehicle_id' })
  }
  return locations.length
}
