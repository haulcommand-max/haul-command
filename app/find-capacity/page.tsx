import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { AdGridSlot } from '@/components/home/AdGridSlot'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Find Capacity — Available Pilot Cars & Escorts Now | Haul Command',
  description: 'Search available pilot car operators and escort vehicles in real time. Filter by location, service type, certification, and radius. Haul Command broker search.',
  alternates: { canonical: 'https://www.haulcommand.com/find-capacity' },
}

export const dynamic = 'force-dynamic'

const SERVICE_OPTIONS = [
  { value:'', label:'All Types' },
  { value:'pilot_car', label:'Pilot Car' },
  { value:'escort_vehicle', label:'Escort Vehicle' },
  { value:'high_pole', label:'High Pole' },
  { value:'steerman', label:'Steerman' },
  { value:'route_surveyor', label:'Route Surveyor' },
  { value:'heavy_towing', label:'Heavy Towing' },
]

const SERVICE_LABEL: Record<string,string> = {
  pilot_car:'Pilot Car', escort_vehicle:'Escort Vehicle', high_pole:'High Pole',
  steerman:'Steerman', route_surveyor:'Route Surveyor', heavy_towing:'Heavy Towing', air_cushion:'Air Cushion',
}

async function getAvailableOperators(serviceType?: string, state?: string, country?: string) {
  const supabase = createClient()
  let q = supabase
    .from('hc_available_now')
    .select(`
      id, service_type, current_city, current_state, country_code, max_radius_miles, notes, last_ping_at, available_until,
      operators!inner(id,hc_id,company_name,tier,confidence_score,is_claimed)
    `)
    .eq('is_active', true)
    .order('last_ping_at', { ascending: false })
    .limit(40)

  if (serviceType) q = q.eq('service_type', serviceType)
  if (state) q = q.eq('current_state', state.toUpperCase())
  if (country) q = q.eq('country_code', country.toUpperCase())

  const { data } = await q
  return data ?? []
}

function freshness(lastPing: string) {
  const mins = Math.floor((Date.now() - new Date(lastPing).getTime()) / 60000)
  if (mins < 10) return { label:'Just now', color:'#22c55e' }
  if (mins < 60) return { label:`${mins}m ago`, color:'#22c55e' }
  const hrs = Math.floor(mins/60)
  if (hrs < 6) return { label:`${hrs}h ago`, color:'#d4950e' }
  return { label:`${hrs}h ago`, color:'#566880' }
}

const schema = {
  '@context':'https://schema.org','@type':'WebPage',
  name:'Find Pilot Car & Escort Vehicle Capacity | Haul Command',
  description:'Real-time broker search for available pilot car operators and escort vehicles across 120 countries.',
  url:'https://www.haulcommand.com/find-capacity',
}

export default async function FindCapacityPage({
  searchParams
}: {
  searchParams: { service?: string; state?: string; country?: string }
}) {
  const { service = '', state = '', country = 'US' } = searchParams
  const operators = await getAvailableOperators(service||undefined, state||undefined, country||undefined)

  return (
    <>
      <JsonLd data={schema}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">

        {/* HERO */}
        <div className="border-b border-[#131c28] bg-gradient-to-r from-[#0a1929] to-[#07090d]">
          <div className="px-4 lg:px-10 py-10 max-w-5xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#3b82f6] font-semibold mb-3">BROKER SEARCH · REAL-TIME CAPACITY</p>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#f0f2f5] mb-3">Find Available Capacity Now</h1>
            <p className="text-sm text-[#8a9ab0] mb-6">{operators.length > 0 ? `${operators.length} operators broadcasting availability` : 'Search active operators by location and service type.'} Updated in real time.</p>

            {/* FILTERS */}
            <form method="GET" className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-[10px] text-[#566880] mb-1 font-semibold tracking-wider">SERVICE TYPE</label>
                <select name="service" defaultValue={service}
                  className="bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-2.5 text-sm text-[#f0f2f5] focus:border-[#3b82f6] focus:outline-none">
                  {SERVICE_OPTIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#566880] mb-1 font-semibold tracking-wider">STATE / PROVINCE</label>
                <input name="state" defaultValue={state} placeholder="e.g. TX" maxLength={4}
                  className="bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-2.5 text-sm text-[#f0f2f5] focus:border-[#3b82f6] focus:outline-none w-28 placeholder-[#3a5068]"/>
              </div>
              <div>
                <label className="block text-[10px] text-[#566880] mb-1 font-semibold tracking-wider">COUNTRY</label>
                <select name="country" defaultValue={country}
                  className="bg-[#0f1a24] border border-[#1e3048] rounded-xl px-4 py-2.5 text-sm text-[#f0f2f5] focus:border-[#3b82f6] focus:outline-none">
                  {['US','CA','AU','GB','NZ','ZA','DE','NL','AE','BR'].map(cc=><option key={cc} value={cc}>{cc}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                Search
              </button>
              {(service||state)&&<Link href="/find-capacity" className="text-xs text-[#566880] py-2.5 hover:text-[#f0f2f5]">Clear</Link>}
            </form>
          </div>
        </div>

        <div className="px-4 lg:px-10 py-8 max-w-5xl mx-auto">
          <AdGridSlot zone="find_capacity_top" />

          {/* RESULTS */}
          {operators.length > 0 ? (
            <div className="flex flex-col gap-3 mt-6">
              {operators.map((op: any) => {
                const f = freshness(op.last_ping_at)
                const profile = op.operators
                return (
                  <div key={op.id} className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#141e28] flex items-center justify-center text-xs font-bold text-[#8ab0d0] shrink-0">
                        {(profile?.company_name??'O').split(' ').map((w:string)=>w[0]).join('').slice(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#d0dce8]">{profile?.company_name ?? 'Operator'}</p>
                          {profile?.is_claimed&&<span className="text-[9px] text-[#22c55e] bg-[#0d2000] px-1.5 py-0.5 rounded">VERIFIED</span>}
                          {profile?.tier==='elite'&&<span className="text-[9px] text-[#d4950e] bg-[#2a1f08] px-1.5 py-0.5 rounded">ELITE</span>}
                        </div>
                        <p className="text-[10px] text-[#566880] font-mono mt-0.5">
                          {SERVICE_LABEL[op.service_type]??op.service_type} · {op.current_city}, {op.current_state} {op.country_code} · Up to {op.max_radius_miles}mi
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[10px] font-semibold" style={{color:f.color}}>● {f.label}</span>
                        {op.available_until&&<span className="text-[9px] text-[#566880]">Until {new Date(op.available_until).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>}
                      </div>
                    </div>

                    {op.notes&&<p className="text-xs text-[#8a9ab0] border-t border-[#131c28] pt-3 leading-relaxed">{op.notes}</p>}

                    <div className="flex gap-2 pt-1">
                      {profile?.hc_id && (
                        <Link href={`/directory/us/${profile.hc_id.toLowerCase().replace(/[^a-z0-9-]/g,'-')}`}
                          className="flex-1 text-center text-xs border border-[#1e3048] text-[#8a9ab0] hover:border-[#3b82f6] hover:text-[#3b82f6] py-2 rounded-lg transition-colors">
                          View Profile
                        </Link>
                      )}
                      <Link href={`/request?operator=${profile?.hc_id??op.id}&service=${op.service_type}&state=${op.current_state}`}
                        className="flex-1 text-center text-xs bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-2 rounded-lg transition-colors">
                        Request Now →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-10 bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-10 text-center">
              <p className="text-3xl mb-4">📹</p>
              <p className="text-sm font-semibold text-[#d0dce8] mb-2">No operators broadcasting right now in {state.toUpperCase()||country}</p>
              <p className="text-xs text-[#566880] mb-6 max-w-md mx-auto">Availability changes in real time. Try a different state or service type, or post your load to the board and operators will respond.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/load-board/post" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-5 py-2.5 rounded-xl text-sm">Post Load to Board</Link>
                <Link href="/directory" className="border border-[#1e3048] text-[#8a9ab0] hover:border-[#3b82f6] px-5 py-2.5 rounded-xl text-sm">Browse Directory</Link>
              </div>
            </div>
          )}

          {/* BOTTOM TOOLS */}
          <div className="mt-10 border-t border-[#131c28] pt-8 flex flex-wrap gap-4">
            <Link href="/load-board" className="text-xs text-[#566880] hover:text-[#3b82f6]">Load Board →</Link>
            <Link href="/tools/instant-quote" className="text-xs text-[#566880] hover:text-[#3b82f6]">Get Instant Quote →</Link>
            <Link href="/directory" className="text-xs text-[#566880] hover:text-[#3b82f6]">Full Directory →</Link>
            <Link href="/available-now" className="text-xs text-[#566880] hover:text-[#3b82f6]">Live Operator Feed →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
