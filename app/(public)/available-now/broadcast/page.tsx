'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const SERVICE_TYPES = [
  { value:'pilot_car',         label:'Pilot Car' },
  { value:'escort_vehicle',    label:'Escort Vehicle' },
  { value:'high_pole',         label:'High Pole Operator' },
  { value:'steerman',          label:'Steerman / Rear Steer' },
  { value:'route_surveyor',    label:'Route Surveyor' },
  { value:'heavy_towing',      label:'Heavy Towing' },
  { value:'air_cushion',       label:'Air Cushion' },
]

export default function BroadcastForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    service_type: 'pilot_car',
    current_city: '', current_state: '', country_code: 'US',
    available_from: '', available_until: '',
    max_radius_miles: 150,
    notes: '',
  })

  function set(field: string, val: string | number) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.current_city || !form.current_state) { setError('City and state are required.'); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('You must be signed in to broadcast availability.'); setLoading(false); return }

      // Map form fields to real hc_available_now column names
      const vehicleTypeMap: Record<string, string> = {
        pilot_car: 'pilot_car',
        escort_vehicle: 'escort_vehicle',
        high_pole: 'high_pole',
        steerman: 'steerman',
        route_surveyor: 'route_surveyor',
        heavy_towing: 'heavy_towing',
        air_cushion: 'other',
      }

      const { error: err } = await supabase.from('hc_available_now').upsert({
        user_id: user.id,
        vehicle_type: vehicleTypeMap[form.service_type] ?? 'pilot_car',
        service_type: form.service_type,
        city: form.current_city.trim(),
        current_city: form.current_city.trim(),
        region_code: form.current_state.trim().toUpperCase(),
        current_state: form.current_state.trim().toUpperCase(),
        country_code: form.country_code,
        max_radius_miles: form.max_radius_miles,
        available_since: form.available_from || new Date().toISOString(),
        available_until: form.available_until || null,
        notes: form.notes.trim() || null,
        is_active: true,
        last_ping_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      if (err) throw err
      setSuccess(true)
      setTimeout(() => router.push('/available-now'), 1800)
    } catch (err: any) {
      setError(err.message ?? 'Failed to broadcast. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen bg-[#07090d] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-[#22c55e] mb-2">You&apos;re Live!</h2>
        <p className="text-sm text-[#8a9ab0]">Your availability is now broadcasting to brokers in real time. Redirecting to the live feed&hellip;</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
      <div className="px-4 lg:px-10 py-10 max-w-2xl mx-auto">
        <p className="text-[11px] tracking-[0.2em] text-[#22c55e] font-semibold mb-3">BROADCAST AVAILABILITY</p>
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#f0f2f5] mb-2">Go Live — Brokers Are Watching</h1>
        <p className="text-sm text-[#8a9ab0] mb-8">Broadcast your current location and availability. You appear on the live operator map instantly.</p>

        <form onSubmit={submit} className="flex flex-col gap-5">
          {/* SERVICE TYPE */}
          <div>
            <label className="block text-xs text-[#566880] mb-1.5 font-semibold tracking-wider">SERVICE TYPE</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_TYPES.map(s=>(
                <button key={s.value} type="button" onClick={()=>set('service_type',s.value)}
                  className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                    form.service_type===s.value
                      ? 'border-[#22c55e] bg-[#0d2000] text-[#22c55e] font-semibold'
                      : 'border-[#1e3048] bg-[#0f1a24] text-[#8a9ab0] hover:border-[#22c55e40]'
                  }`}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* LOCATION */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#566880] mb-1.5 font-semibold tracking-wider">CURRENT CITY</label>
              <input type="text" placeholder="e.g. Houston" value={form.current_city} onChange={e=>set('current_city',e.target.value)}
                className="w-full bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#22c55e] focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs text-[#566880] mb-1.5 font-semibold tracking-wider">STATE / PROVINCE</label>
              <input type="text" placeholder="e.g. TX" maxLength={4} value={form.current_state} onChange={e=>set('current_state',e.target.value)}
                className="w-full bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#22c55e] focus:outline-none"/>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#566880] mb-1.5 font-semibold tracking-wider">COUNTRY</label>
            <select value={form.country_code} onChange={e=>set('country_code',e.target.value)}
              className="w-full bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] focus:border-[#22c55e] focus:outline-none">
              {['US','CA','AU','GB','NZ','ZA','DE','NL','AE','BR','MX','IN'].map(cc=><option key={cc} value={cc}>{cc}</option>)}
            </select>
          </div>

          {/* AVAILABILITY WINDOW */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#566880] mb-1.5 font-semibold tracking-wider">AVAILABLE FROM</label>
              <input type="datetime-local" value={form.available_from} onChange={e=>set('available_from',e.target.value)}
                className="w-full bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] focus:border-[#22c55e] focus:outline-none"/>
            </div>
            <div>
              <label className="block text-xs text-[#566880] mb-1.5 font-semibold tracking-wider">AVAILABLE UNTIL</label>
              <input type="datetime-local" value={form.available_until} onChange={e=>set('available_until',e.target.value)}
                className="w-full bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] focus:border-[#22c55e] focus:outline-none"/>
            </div>
          </div>

          {/* RADIUS */}
          <div>
            <label className="block text-xs text-[#566880] mb-1.5 font-semibold tracking-wider">MAX TRAVEL RADIUS: <span className="text-[#d4950e]">{form.max_radius_miles} mi</span></label>
            <input type="range" min={25} max={500} step={25} value={form.max_radius_miles} onChange={e=>set('max_radius_miles',Number(e.target.value))}
              className="w-full accent-[#22c55e]"/>
            <div className="flex justify-between text-[10px] text-[#3a5068] mt-1"><span>25 mi</span><span>500 mi</span></div>
          </div>

          {/* NOTES */}
          <div>
            <label className="block text-xs text-[#566880] mb-1.5 font-semibold tracking-wider">ADDITIONAL NOTES (OPTIONAL)</label>
            <textarea placeholder="e.g. Available for wide loads only. Have high pole. Licensed for AZ." value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3}
              className="w-full bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#22c55e] focus:outline-none resize-none"/>
          </div>

          {error&&<p className="text-xs text-red-400 bg-red-900/20 border border-red-900/30 rounded-xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={loading}
            className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 text-white font-bold py-4 rounded-xl text-sm transition-colors">
            {loading ? 'Broadcasting…' : '● Go Live Now — Broadcast Availability'}
          </button>

          <p className="text-[10px] text-[#3a5068] text-center">Your listing appears in the live feed and is visible to brokers searching for capacity in your area. You can remove it anytime.</p>
        </form>
      </div>
    </div>
  )
}
