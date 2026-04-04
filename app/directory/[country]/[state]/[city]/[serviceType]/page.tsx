import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { AdGridSlot } from '@/components/home/AdGridSlot'
import Link from 'next/link'

interface Props { params: { country: string; state: string; city: string; serviceType: string } }

const SERVICE_LABELS: Record<string,{singular:string;plural:string}> = {
  'pilot-car':     { singular: 'Pilot Car Operator',            plural: 'Pilot Car Operators' },
  'escort-vehicle':{ singular: 'Escort Vehicle Operator',       plural: 'Escort Vehicle Operators' },
  'high-pole':     { singular: 'High Pole Operator',            plural: 'High Pole Operators' },
  'steerman':      { singular: 'Steerman',                      plural: 'Steermen' },
  'route-survey':  { singular: 'Route Surveyor',                plural: 'Route Surveyors' },
  'freight-broker':{ singular: 'Heavy Haul Freight Broker',     plural: 'Heavy Haul Freight Brokers' },
  'heavy-towing':  { singular: 'Heavy Towing Operator',         plural: 'Heavy Towing Operators' },
}

function toTitle(s: string) { return s.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ') }

async function getData(country: string, state: string, serviceType: string) {
  const supabase = createClient()
  const stateCode = state.toUpperCase().slice(0,2)
  const [{ data: operators }, { count }] = await Promise.all([
    supabase.from('operators').select('id,hc_id,company_name,state,country_code,tier,rank_score,confidence_score,is_claimed,created_at').eq('country_code', country.toUpperCase()).eq('state', stateCode).order('rank_score',{ascending:false}).limit(12),
    supabase.from('operators').select('*',{count:'exact',head:true}).eq('country_code',country.toUpperCase()).eq('state',stateCode),
  ])
  return { operators: operators??[], count: count??0 }
}

const NEARBY: Record<string,Array<{name:string;slug:string}>> = {
  fl:[{name:'Jacksonville',slug:'jacksonville'},{name:'Tampa',slug:'tampa'},{name:'Miami',slug:'miami'},{name:'Orlando',slug:'orlando'},{name:'Pensacola',slug:'pensacola'},{name:'Gainesville',slug:'gainesville'}],
  tx:[{name:'Houston',slug:'houston'},{name:'Dallas',slug:'dallas'},{name:'San Antonio',slug:'san-antonio'},{name:'Austin',slug:'austin'},{name:'Fort Worth',slug:'fort-worth'},{name:'El Paso',slug:'el-paso'}],
  ca:[{name:'Los Angeles',slug:'los-angeles'},{name:'Sacramento',slug:'sacramento'},{name:'Fresno',slug:'fresno'},{name:'San Diego',slug:'san-diego'},{name:'Bakersfield',slug:'bakersfield'}],
  oh:[{name:'Columbus',slug:'columbus'},{name:'Cleveland',slug:'cleveland'},{name:'Cincinnati',slug:'cincinnati'},{name:'Dayton',slug:'dayton'},{name:'Toledo',slug:'toledo'}],
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = SERVICE_LABELS[params.serviceType] ?? { singular: toTitle(params.serviceType), plural: toTitle(params.serviceType)+'s' }
  const city = toTitle(params.city); const state = toTitle(params.state)
  return {
    title: `${s.plural} in ${city}, ${state} — Find Local Escorts | Haul Command`,
    description: `Find verified ${s.plural.toLowerCase()} near ${city}, ${state}. Search ${s.singular.toLowerCase()} near me on Haul Command — the global heavy haul directory.`,
    alternates: { canonical: `https://www.haulcommand.com/directory/${params.country}/${params.state}/${params.city}/${params.serviceType}` },
  }
}

export default async function CityServicePage({ params }: Props) {
  const { country, state, city, serviceType } = params
  const s = SERVICE_LABELS[serviceType] ?? { singular: toTitle(serviceType), plural: toTitle(serviceType)+'s' }
  const cityFull = toTitle(city); const stateFull = toTitle(state)
  const { operators, count } = await getData(country, state, serviceType)
  const nearby = (NEARBY[state.toLowerCase()]??[]).filter(c=>c.slug!==city.toLowerCase()).slice(0,6)

  const schemas = [
    { '@context':'https://schema.org','@type':'ItemList', name:`${s.plural} in ${cityFull}, ${stateFull}`, numberOfItems:count,
      itemListElement: operators.slice(0,5).map((op,i)=>({ '@type':'ListItem', position:i+1, name:op.company_name, url:`https://www.haulcommand.com/directory/${country}/${op.hc_id?.toLowerCase().replace(/[^a-z0-9-]/g,'-')}` })) },
    { '@context':'https://schema.org','@type':'FAQPage', mainEntity:[
      { '@type':'Question', name:`Where can I find a ${s.singular.toLowerCase()} near ${cityFull}?`, acceptedAnswer:{"@type":'Answer',text:`Haul Command lists ${count>0?count:'multiple'} verified ${s.plural.toLowerCase()} serving ${cityFull} and the ${stateFull} area.`} },
      { '@type':'Question', name:`How much does a ${s.singular.toLowerCase()} cost in ${cityFull}?`, acceptedAnswer:{"@type":'Answer',text:`${s.singular} rates in ${stateFull} typically range $1.75–$3.50/mile. Use our free Rate Estimator for current market rates.`} },
    ]},
  ]

  return (
    <>
      {schemas.map((s,i)=><JsonLd key={i} data={s}/>)}
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
        <nav className="px-4 lg:px-10 py-2.5 border-b border-[#131c28]">
          <div className="max-w-5xl mx-auto text-xs text-[#566880] flex flex-wrap gap-1.5">
            {[['Home','/'],['Directory','/directory'],[country.toUpperCase(),`/directory/${country}`],[stateFull,`/directory/${country}/${state}`],[cityFull,`/directory/${country}/${state}/${city}`]].map(([label,href])=>(
              <><Link key={href} href={href} className="hover:text-[#d4950e]">{label}</Link><span>›</span></>
            ))}
            <span className="text-[#8a9ab0]">{s.plural}</span>
          </div>
        </nav>
        <div className="px-4 lg:px-10 py-8 max-w-5xl mx-auto">
          {/* HERO */}
          <div className="mb-8">
            <p className="text-[11px] tracking-[0.15em] text-[#d4950e] font-semibold mb-3">{count>0?`${count} OPERATORS IN ${stateFull.toUpperCase()}`:'HEAVY HAUL DIRECTORY'}</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold tracking-tight text-[#f0f2f5] mb-4">{s.plural} in {cityFull}, {stateFull}</h1>
            <p className="text-sm text-[#8a9ab0] max-w-2xl mb-4">
              Find verified {s.plural.toLowerCase()} near {cityFull}, {stateFull}. {count>0?`${count} certified ${s.plural.toLowerCase()} indexed`:'Escort professionals'} serving the {cityFull} area.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-1.5 rounded-lg">{count} Operators in {stateFull}</span>
              <span className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#22c55e] px-3 py-1.5 rounded-lg">● Real-Time Availability</span>
            </div>
          </div>
          <div className="mb-6"><AdGridSlot zone="city_page_top" /></div>
          {/* OPERATORS */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#f0f2f5]">{s.plural} Near {cityFull}</h2>
              <Link href={`/directory/${country}/${state}`} className="text-xs text-[#d4950e]">All {stateFull} operators →</Link>
            </div>
            {operators.length > 0 ? (
              <div className="flex flex-col gap-3">
                {operators.map(op=>(
                  <Link key={op.id} href={`/directory/${country}/${op.hc_id?.toLowerCase().replace(/[^a-z0-9-]/g,'-')}`}
                    className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 flex items-center gap-4 hover:border-[#d4950e] transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-[#141e28] flex items-center justify-center text-xs font-bold text-[#8ab0d0]">{(op.company_name??'O').split(' ').map((w:string)=>w[0]).join('').slice(0,2)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#d0dce8] group-hover:text-[#f0f2f5] truncate">{op.company_name}</p>
                      <p className="text-[10px] text-[#3a5068] font-mono">{op.hc_id} · {[op.state, op.country_code].filter(Boolean).join(', ')}</p>
                    </div>
                    {op.tier==='elite'&&<span className="text-[9px] text-[#d4950e] bg-[#2a1f08] px-1.5 py-0.5 rounded">ELITE</span>}
                    {op.is_claimed&&<span className="text-[9px] text-[#22c55e] bg-[#0d2000] px-1.5 py-0.5 rounded">CLAIMED</span>}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-8 text-center">
                <p className="text-sm text-[#566880] mb-4">No operators indexed yet for {cityFull}.</p>
                <Link href={`/directory/${country}/${state}`} className="text-sm text-[#d4950e] border border-[#d4950e40] px-4 py-2 rounded-lg hover:bg-[#2a1f08]">Browse All {stateFull} Operators →</Link>
              </div>
            )}
          </div>
          {/* FAQ */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <h2 className="text-base font-bold text-[#f0f2f5] mb-5">{s.singular} Near Me — {cityFull}</h2>
            <div className="space-y-3">
              {[
                { q:`Where can I find a ${s.singular.toLowerCase()} near ${cityFull}?`, a:`Haul Command lists verified ${s.plural.toLowerCase()} serving ${cityFull} and ${stateFull}. Browse profiles and contact operators directly.` },
                { q:`How much does a ${s.singular.toLowerCase()} cost near ${cityFull}?`, a:`Rates in ${stateFull} typically range $1.75–$3.50/mile. Get an exact quote using our free Rate Estimator.` },
                { q:`Do I need a ${s.singular.toLowerCase()} in ${stateFull}?`, a:`${stateFull} requires escort vehicles for loads exceeding certain dimensions. Use our Escort Rule Finder for exact thresholds.` },
              ].map((item,i)=>(
                <details key={i} className="border border-[#131c28] rounded-xl p-4">
                  <summary className="text-sm font-semibold text-[#d0dce8] cursor-pointer list-none flex justify-between">{item.q}<span className="text-[#566880] ml-3">+</span></summary>
                  <p className="text-sm text-[#8a9ab0] mt-3 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
          {/* NEARBY CITIES */}
          {nearby.length>0&&(
            <div>
              <h2 className="text-base font-bold text-[#f0f2f5] mb-4">Nearby Cities — {stateFull} {s.plural}</h2>
              <div className="flex flex-wrap gap-2">
                {nearby.map(c=>(
                  <Link key={c.slug} href={`/directory/${country}/${state}/${c.slug}/${serviceType}`} className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-1.5 rounded-lg hover:border-[#d4950e] hover:text-[#d4950e]">{c.name}</Link>
                ))}
                <Link href={`/directory/${country}/${state}`} className="text-xs border border-dashed border-[#1e3048] text-[#566880] px-3 py-1.5 rounded-lg hover:border-[#d4950e]">All {stateFull} cities →</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
