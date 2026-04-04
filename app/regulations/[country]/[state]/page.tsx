import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/JsonLd'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props { params: { country: string; state: string } }

// Static regulation data — seeded, expandable via DB
const REG_DATA: Record<string, Record<string, {
  state_name: string; max_width: string; max_height: string; max_length: string; max_weight: string;
  pilot_car_at: string; two_escort_at: string; police_at: string; high_pole_at: string;
  permit_office: string; permit_url: string; online_filing: boolean;
  night_moves: string; weekend_moves: string; frost_law: boolean;
  confidence: string; source: string; last_verified: string;
}>> = {
  us: {
    tx: { state_name:'Texas', max_width:"8'6\"", max_height:"14'", max_length:"65'", max_weight:'80,000 lbs', pilot_car_at:'10\' wide', two_escort_at:'14\' wide', police_at:'18\' wide or 250k+ lbs', high_pole_at:'15\' tall (some routes)', permit_office:'TxDOT Oversize/Overweight Permits', permit_url:'https://www.txdmv.gov', online_filing:true, night_moves:'Prohibited for loads >18\' wide', weekend_moves:'Permitted with advance notice', frost_law:false, confidence:'verified_current', source:'TxDMV + TxDOT', last_verified:'2026-Q1' },
    ca: { state_name:'California', max_width:"8'6\"", max_height:"14'", max_length:"65'", max_weight:'80,000 lbs', pilot_car_at:'12\' wide', two_escort_at:'15\' wide', police_at:'16\' wide', high_pole_at:'14\' tall', permit_office:'Caltrans Transport Permits', permit_url:'https://dot.ca.gov/programs/traffic-operations/transportation-permits', online_filing:true, night_moves:'Restricted — curfews apply in metro areas', weekend_moves:'Restricted in many corridors', frost_law:false, confidence:'verified_current', source:'Caltrans', last_verified:'2026-Q1' },
    fl: { state_name:'Florida', max_width:"8'6\"", max_height:"13'6\"", max_length:"65'", max_weight:'80,000 lbs', pilot_car_at:'12\' wide', two_escort_at:'14\' wide', police_at:'18\' wide', high_pole_at:'15\' tall', permit_office:'FDOT Oversize/Overweight Permits', permit_url:'https://www2.dot.state.fl.us/permitlookup', online_filing:true, night_moves:'Most loads permitted. Turpike has restrictions.', weekend_moves:'Permitted', frost_law:false, confidence:'verified_current', source:'FDOT', last_verified:'2026-Q1' },
    oh: { state_name:'Ohio', max_width:"8'6\"", max_height:"13'6\"", max_length:"65'", max_weight:'80,000 lbs', pilot_car_at:'10\' wide', two_escort_at:'14\' wide', police_at:'16\' wide', high_pole_at:'15\' tall', permit_office:'ODOT Permits Office', permit_url:'https://ohioeasypass.com', online_filing:true, night_moves:'Restricted in urban areas', weekend_moves:'Permitted', frost_law:true, confidence:'verified_current', source:'ODOT', last_verified:'2026-Q1' },
    wa: { state_name:'Washington', max_width:"8'6\"", max_height:"14'", max_length:"75'", max_weight:'105,500 lbs', pilot_car_at:'14\' wide (PEVO required)', two_escort_at:'16\' wide', police_at:'18\' wide', high_pole_at:'15\' tall', permit_office:'WSDOT Oversize Load Permits', permit_url:'https://www.wsdot.wa.gov/permits', online_filing:true, night_moves:'Prohibited ≥ 18\' wide', weekend_moves:'Permitted in rural corridors', frost_law:true, confidence:'verified_current', source:'WSDOT', last_verified:'2026-Q1' },
    az: { state_name:'Arizona', max_width:"8'6\"", max_height:"14'", max_length:"65'", max_weight:'80,000 lbs', pilot_car_at:'14\' wide (high pole required)', two_escort_at:'16\' wide', police_at:'18\' wide', high_pole_at:'14\' tall', permit_office:'ADOT Motor Vehicle Division Permits', permit_url:'https://www.azdot.gov/motor-vehicles/commercial-services', online_filing:true, night_moves:'Prohibited >16\' wide', weekend_moves:'Limited — check permit conditions', frost_law:false, confidence:'verified_current', source:'ADOT', last_verified:'2026-Q1' },
    la: { state_name:'Louisiana', max_width:"8'6\"", max_height:"14'", max_length:"65'", max_weight:'88,000 lbs (NHS)', pilot_car_at:'12\' wide', two_escort_at:'14\' wide', police_at:'18\' wide', high_pole_at:'15\' tall', permit_office:'LA DOTD Permits', permit_url:'https://www.dotd.la.gov/Pages/PermitsAndTransportation.aspx', online_filing:true, night_moves:'Prohibited >16\' wide', weekend_moves:'Permitted', frost_law:false, confidence:'verified_current', source:'LA DOTD', last_verified:'2026-Q1' },
    pa: { state_name:'Pennsylvania', max_width:"8'6\"", max_height:"13'6\"", max_length:"65'", max_weight:'80,000 lbs', pilot_car_at:'12\' wide', two_escort_at:'16\' wide', police_at:'18\' wide', high_pole_at:'15\' tall', permit_office:'PennDOT Oversize/Overweight Permits', permit_url:'https://www.penndot.gov/businesses-and-developers/oversize-overweight-vehicles', online_filing:true, night_moves:'Restricted on limited access highways', weekend_moves:'Permitted', frost_law:true, confidence:'verified_current', source:'PennDOT', last_verified:'2026-Q1' },
  }
}

function toTitle(s: string) { return s.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ') }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = params.country.toLowerCase()
  const state = params.state.toLowerCase()
  const d = REG_DATA[country]?.[state]
  const stateName = d?.state_name ?? toTitle(state)
  return {
    title: `${stateName} Oversize Load Regulations 2026 — Permits, Escorts & Limits | Haul Command`,
    description: `Complete ${stateName} oversize load regulations. Permit requirements, pilot car rules, width/height/weight limits, online filing links, and night move restrictions. Updated Q1 2026.`,
    alternates: { canonical: `https://www.haulcommand.com/regulations/${country}/${state}` },
  }
}

export default function RegulationStatePage({ params }: Props) {
  const country = params.country.toLowerCase()
  const state = params.state.toLowerCase()
  const d = REG_DATA[country]?.[state]
  const stateName = d?.state_name ?? toTitle(state)

  const schema = {
    '@context':'https://schema.org','@type':'Article',
    headline:`${stateName} Oversize Load Regulations 2026`,
    description:`Complete ${stateName} oversize load regulations including permit requirements, pilot car rules, width/height limits, and online filing links.`,
    url:`https://www.haulcommand.com/regulations/${country}/${state}`,
    dateModified: d?.last_verified ?? '2026-Q1',
    publisher:{'@type':'Organization',name:'Haul Command',url:'https://www.haulcommand.com'},
  }
  const faq = d ? { '@context':'https://schema.org','@type':'FAQPage', mainEntity:[
    {"@type":'Question', name:`What is the maximum legal width in ${stateName}?`, acceptedAnswer:{"@type":'Answer', text:`The maximum legal load width in ${stateName} without an oversize permit is ${d.max_width}. Loads exceeding this require an oversize load permit.`}},
    {"@type":'Question', name:`When is a pilot car required in ${stateName}?`, acceptedAnswer:{"@type":'Answer', text:`In ${stateName}, a pilot car is required for loads ${d.pilot_car_at}. Two escorts are required at ${d.two_escort_at}.${d.police_at?` Police escort is required at ${d.police_at}.`:''}`}},
    {"@type":'Question', name:`How do I get an oversize permit in ${stateName}?`, acceptedAnswer:{"@type":'Answer', text:`${stateName} oversize permits are issued by the ${d.permit_office}. ${d.online_filing?'Online filing is available through the state portal.':'Contact the permit office directly.'}`}},
  ]} : null

  const CONFIDENCE_STYLES: Record<string,{color:string;label:string}> = {
    verified_current:      { color:'#22c55e', label:'Verified Current' },
    verified_but_review_due:{ color:'#d4950e', label:'Verified — Review Due' },
    partially_verified:    { color:'#d4950e', label:'Partially Verified' },
    seeded_needs_review:   { color:'#566880', label:'Seeded — Needs Review' },
  }
  const conf = CONFIDENCE_STYLES[d?.confidence ?? 'seeded_needs_review']

  return (
    <>
      <JsonLd data={schema}/>
      {faq && <JsonLd data={faq}/>}
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
        {/* BREADCRUMB */}
        <nav className="px-4 lg:px-10 py-2.5 border-b border-[#131c28]">
          <div className="max-w-4xl mx-auto text-xs text-[#566880] flex flex-wrap gap-1.5">
            {[['Home','/'],['Regulations','/regulations'],[country.toUpperCase(),`/regulations/${country}`]].map(([label,href])=>(
              <><Link key={href} href={href} className="hover:text-[#d4950e]">{label}</Link><span>›</span></>
            ))}
            <span className="text-[#8a9ab0]">{stateName}</span>
          </div>
        </nav>

        <div className="px-4 lg:px-10 py-10 max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{color:conf.color,borderColor:`${conf.color}40`}}>{conf.label}</span>
              {d?.last_verified && <span className="text-[10px] text-[#566880]">Last verified: {d.last_verified}</span>}
              {d?.source && <span className="text-[10px] text-[#566880]">Source: {d.source}</span>}
            </div>
            <h1 className="text-2xl lg:text-4xl font-extrabold tracking-tight text-[#f0f2f5] mb-3">
              {stateName} Oversize Load Regulations
            </h1>
            <p className="text-sm text-[#8a9ab0] max-w-2xl">Complete oversize and overweight load regulations for {stateName}. Permit requirements, pilot car rules, escort thresholds, online filing, and travel restrictions.</p>
          </div>

          {d ? (
            <>
              {/* QUICK REFERENCE CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                  {label:'Max Width',  val:d.max_width,  color:'#ef4444'},
                  {label:'Max Height', val:d.max_height, color:'#d4950e'},
                  {label:'Max Length', val:d.max_length, color:'#3b82f6'},
                  {label:'Max Weight', val:d.max_weight, color:'#8b5cf6'},
                ].map(c=>(
                  <div key={c.label} className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 text-center">
                    <p className="text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">{c.label}</p>
                    <p className="text-base lg:text-xl font-black" style={{color:c.color}}>{c.val}</p>
                    <p className="text-[9px] text-[#3a5068] mt-1">without permit</p>
                  </div>
                ))}
              </div>

              {/* ESCORT RULES */}
              <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-6">
                <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">Pilot Car &amp; Escort Requirements in {stateName}</h2>
                <div className="flex flex-col gap-3">
                  {[
                    {label:'1 escort required',  val:d.pilot_car_at, color:'#22c55e'},
                    {label:'2 escorts required', val:d.two_escort_at, color:'#d4950e'},
                    {label:'Police escort',       val:d.police_at,     color:'#ef4444'},
                    {label:'High pole required',  val:d.high_pole_at,  color:'#3b82f6'},
                  ].map(r=>(
                    <div key={r.label} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold px-2 py-1 rounded min-w-[130px] text-center" style={{color:r.color,background:`${r.color}15`}}>{r.label}</span>
                      <span className="text-sm text-[#8a9ab0]">at {r.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TRAVEL RESTRICTIONS */}
              <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-6">
                <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">Travel Restrictions</h2>
                <div className="flex flex-col gap-2">
                  {[
                    {label:'Night Moves',    val:d.night_moves},
                    {label:'Weekend Moves',  val:d.weekend_moves},
                    {label:'Frost Laws',     val:d.frost_law ? 'Yes — seasonal weight restrictions apply' : 'Not typically applicable'},
                  ].map(r=>(
                    <div key={r.label} className="flex gap-3 border-b border-[#131c28] pb-2">
                      <span className="text-xs text-[#566880] w-32 shrink-0 font-semibold">{r.label}</span>
                      <span className="text-xs text-[#8a9ab0]">{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PERMIT FILING */}
              <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-6">
                <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">How to Get a Permit in {stateName}</h2>
                <p className="text-xs text-[#8a9ab0] mb-3">Permits are issued by: <span className="text-[#d0dce8] font-semibold">{d.permit_office}</span></p>
                <div className="flex flex-wrap gap-3">
                  {d.permit_url && <a href={d.permit_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-4 py-2.5 rounded-xl transition-colors">{d.online_filing ? 'File Permit Online →' : 'Visit Permit Office →'}</a>}
                  <Link href="/find-capacity" className="text-xs border border-[#1e3048] text-[#8a9ab0] hover:border-[#d4950e] px-4 py-2.5 rounded-xl transition-colors">Find a Permit Agent</Link>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#0f1a24] border border-dashed border-[#1e3048] rounded-2xl p-10 text-center mb-8">
              <p className="text-sm text-[#566880] mb-4">Detailed regulation data for {stateName} is being verified. Check back soon or contact us to expedite.</p>
              <Link href="/regulations" className="text-xs text-[#d4950e] border border-[#d4950e40] px-4 py-2 rounded-lg hover:bg-[#2a1f08]">Browse All Regulations →</Link>
            </div>
          )}

          {/* NEARBY STATES */}
          <div className="border-t border-[#131c28] pt-6">
            <p className="text-xs text-[#566880] mb-3">Browse other {country.toUpperCase()} states:</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(REG_DATA[country] ?? {}).map(s=>(
                <Link key={s} href={`/regulations/${country}/${s}`} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  s===state?'border-[#d4950e] text-[#d4950e] bg-[#2a1f08]':'border-[#1e3048] text-[#566880] hover:border-[#d4950e]'
                }`}>{s.toUpperCase()}</Link>
              ))}
              <Link href="/regulations" className="text-xs px-3 py-1.5 rounded-lg border border-dashed border-[#1e3048] text-[#3a5068] hover:border-[#d4950e]">All States →</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
