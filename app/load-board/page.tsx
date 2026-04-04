import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Heavy Haul Load Board — Post Loads, Find Capacity | Haul Command',
  description: 'Post oversize loads and find pilot car operators, escort vehicles, and heavy haul capacity in real time. The heavy haul load board for brokers and carriers across 120 countries.',
  alternates: { canonical: 'https://www.haulcommand.com/load-board' },
}

export const dynamic = 'force-dynamic'

const SERVICE_LABEL: Record<string,string> = {
  pilot_car:'Pilot Car', escort_vehicle:'Escort Vehicle', high_pole:'High Pole',
  steerman:'Steerman', route_surveyor:'Route Surveyor', heavy_towing:'Heavy Towing',
  air_cushion:'Air Cushion', other:'Other',
}

const STATUS_STYLE: Record<string,{color:string;label:string}> = {
  pending:  { color:'#d4950e', label:'OPEN' },
  viewed:   { color:'#3b82f6', label:'VIEWED' },
  quoted:   { color:'#8b5cf6', label:'QUOTED' },
  accepted: { color:'#22c55e', label:'FILLED' },
  expired:  { color:'#3a5068', label:'EXPIRED' },
}

function timeAgo(ts: string) {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins/60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs/24)}d ago`
}

async function getOpenLoads() {
  const supabase = createClient()
  const { data } = await supabase
    .from('hc_route_requests')
    .select('id,service_type,pickup_location,delivery_location,pickup_date,width_ft,height_ft,weight_lbs,status,created_at,notes')
    .in('status', ['pending','viewed','quoted'])
    .order('created_at', { ascending:false })
    .limit(50)
  return data ?? []
}

const schema = {
  '@context':'https://schema.org','@type':'WebPage',
  name:'Heavy Haul Load Board — Post Loads, Find Capacity | Haul Command',
  description:'Two-sided heavy haul load board. Post oversize loads or browse open capacity requests from brokers and shippers across 120 countries.',
  url:'https://www.haulcommand.com/load-board',
}

export default async function LoadBoardPage() {
  const loads = await getOpenLoads()

  return (
    <>
      <JsonLd data={schema}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">

        {/* HERO */}
        <div className="border-b border-[#131c28] bg-gradient-to-r from-[#0a1929] to-[#07090d]">
          <div className="px-4 lg:px-10 py-10 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
              <div>
                <p className="text-[11px] tracking-[0.2em] text-[#3b82f6] font-semibold mb-2">HAUL COMMAND · LIVE LOAD BOARD</p>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-[#f0f2f5] mb-2">Heavy Haul Load Board</h1>
                <p className="text-sm text-[#8a9ab0]">
                  {loads.length > 0 ? <><span className="text-[#3b82f6] font-bold">{loads.length}</span> open loads posted · </> : null}
                  Real-time requests from brokers and shippers. Operators: claim a load and go live.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href="/load-board/post" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                  + Post a Load
                </Link>
                <Link href="/available-now/broadcast" className="border border-[#1e3048] text-[#8a9ab0] hover:border-[#22c55e] hover:text-[#22c55e] px-5 py-2.5 rounded-xl text-sm transition-colors">
                  ● Broadcast Availability
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-10 py-8 max-w-5xl mx-auto">

          {/* FILTERS ROW */}
          <div className="flex flex-wrap gap-3 mb-6">
            {['All Types','Pilot Car','Escort Vehicle','High Pole','Steerman','Route Surveyor'].map((label,i)=>(
              <button key={label} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                i===0?'border-[#3b82f6] text-[#3b82f6] bg-[#0a1929]':'border-[#1e3048] text-[#566880] hover:border-[#3b82f6]'
              }`}>{label}</button>
            ))}
          </div>

          {/* LOAD CARDS */}
          {loads.length > 0 ? (
            <div className="flex flex-col gap-3">
              {loads.map((load: any) => {
                const st = STATUS_STYLE[load.status] ?? STATUS_STYLE.pending
                return (
                  <div key={load.id} className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-5 hover:border-[#3b82f640] transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{color:'#3b82f6',background:'#0a1929'}}>
                            {SERVICE_LABEL[load.service_type] ?? load.service_type}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{color:st.color,background:`${st.color}15`}}>
                            {st.label}
                          </span>
                          <span className="text-[10px] text-[#566880]">{timeAgo(load.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#d0dce8] mb-1">
                          <span>{load.pickup_location}</span>
                          <span className="text-[#566880]">→</span>
                          <span>{load.delivery_location}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-[10px] text-[#566880]">
                          {load.pickup_date && <span>📅 {new Date(load.pickup_date).toLocaleDateString()}</span>}
                          {load.width_ft    && <span>🗒️ {load.width_ft}&apos; wide</span>}
                          {load.height_ft   && <span>↕️ {load.height_ft}&apos; tall</span>}
                          {load.weight_lbs  && <span>⚖️ {load.weight_lbs.toLocaleString()} lbs</span>}
                        </div>
                        {load.notes && <p className="text-xs text-[#8a9ab0] mt-2 border-t border-[#131c28] pt-2">{load.notes}</p>}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Link href={`/request?loadId=${load.id}&service=${load.service_type}`}
                          className="text-xs bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                          Respond →
                        </Link>
                        <Link href={`/jobs/${load.id}`}
                          className="text-xs border border-[#1e3048] text-[#566880] hover:border-[#3b82f6] px-4 py-2 rounded-lg transition-colors text-center">
                          Details
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-12 text-center">
              <p className="text-3xl mb-4">📦</p>
              <p className="text-sm font-semibold text-[#d0dce8] mb-2">No open loads right now</p>
              <p className="text-xs text-[#566880] mb-6 max-w-md mx-auto">Be the first to post. Operators are watching the board and broadcasting their availability in real time.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/load-board/post" className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-5 py-2.5 rounded-xl text-sm">Post a Load</Link>
                <Link href="/find-capacity" className="border border-[#1e3048] text-[#8a9ab0] hover:border-[#3b82f6] px-5 py-2.5 rounded-xl text-sm">Find Capacity Directly</Link>
              </div>
            </div>
          )}

          {/* BOTTOM CTA STRIP */}
          <div className="mt-10 border-t border-[#131c28] pt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title:'Post a Load', desc:'Brokers and shippers: post your oversize move and operators respond directly.', href:'/load-board/post', cta:'Post Load →', color:'#3b82f6' },
              { title:'Broadcast Availability', desc:'Operators: go live so brokers can find you in real time.', href:'/available-now/broadcast', cta:'Go Live →', color:'#22c55e' },
              { title:'Find Capacity Now', desc:'Search active operators by location, service type, and radius.', href:'/find-capacity', cta:'Search →', color:'#d4950e' },
            ].map(c=>(
              <div key={c.title} className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-5">
                <p className="text-sm font-bold text-[#d0dce8] mb-1">{c.title}</p>
                <p className="text-[11px] text-[#566880] mb-4 leading-relaxed">{c.desc}</p>
                <Link href={c.href} className="text-xs font-bold" style={{color:c.color}}>{c.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
