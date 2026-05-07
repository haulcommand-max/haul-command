'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LiveTrackingMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [deviceCount, setDeviceCount] = useState(0)

  useEffect(() => {
    let maplibre: any
    let map: any

    const init = async () => {
      maplibre = await import('maplibre-gl')
      await import('maplibre-gl/dist/maplibre-gl.css')

      map = new maplibre.Map({
        container: mapRef.current!,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [-95.7129, 37.0902],
        zoom: 4,
      })
      mapInstanceRef.current = map

      map.on('load', async () => {
        // Load initial positions
        const res = await fetch('/api/traccar/devices')
        const { devices } = await res.json()
        setDeviceCount(devices.length)

        for (const device of devices) {
          if (device.latest?.lat) addOrUpdateMarker(maplibre, map, device)
        }

        // Realtime subscription
        supabase
          .channel('escort_locations')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'escort_locations_current',
          }, (payload: any) => {
            const d = payload.new
            if (d?.lat && d?.lon) {
              addOrUpdateMarker(maplibre, map, {
                device_id: d.device_id,
                latest: { lat: d.lat, lon: d.lon, speed: d.speed },
              })
              setDeviceCount(prev => prev)
            }
          })
          .subscribe()
      })
    }

    function addOrUpdateMarker(ml: any, map: any, device: any) {
      const id = device.device_id ?? device.id
      const lat = device.latest?.lat ?? device.lat
      const lon = device.latest?.lon ?? device.lon

      if (!lat || !lon) return

      if (markersRef.current.has(id)) {
        markersRef.current.get(id).setLngLat([lon, lat])
      } else {
        const el = document.createElement('div')
        el.style.cssText = 'width:12px;height:12px;border-radius:50%;background:#F97316;border:2px solid white;box-shadow:0 0 6px rgba(249,115,22,0.8)'
        const marker = new ml.Marker({ element: el }).setLngLat([lon, lat]).addTo(map)
        markersRef.current.set(id, marker)
      }
    }

    init()
    return () => { map?.remove() }
  }, [])

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
        {deviceCount} device{deviceCount !== 1 ? 's' : ''} tracked
      </div>
    </div>
  )
}
