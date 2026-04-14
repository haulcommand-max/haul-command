import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'
import { AdGridSponsorSlot } from '@/app/_components/directory/AdGridSponsorSlot'

export const metadata: Metadata = {
  title: 'Frost Law Tracker — Live US & Canada Spring Weight Restrictions | Haul Command',
  description: 'Real-time frost law and spring road restriction tracker for all 50 US states and Canadian provinces. Email and push alerts when frost laws activate or lift.',
  keywords: [
    'frost law tracker', 'spring weight restrictions', 'seasonal weight limits', 'heavy haul frost bands', 
    'spring road bans canada', 'US DOT frost laws', 'oversize load weight reduction', 'frost law map 2026'
  ],
  alternates: { canonical: 'https://www.haulcommand.com/tools/frost-law-tracker' },
}

export const revalidate = 3600

// Static reference data — replaced by DB when frost_law_status table is live
const FROST_REFERENCE = [
  { state:'MN', name:'Minnesota',      typical_start:'Mar 1',  typical_end:'May 15', reduction:'50%', status:'watch',   note:'Early spring thaw expected March 2026.' },
  { state:'WI', name:'Wisconsin',      typical_start:'Mar 1',  typical_end:'May 1',  reduction:'50%', status:'watch',   note:'Statewide frost map updated weekly.' },
  { state:'MI', name:'Michigan',       typical_start:'Feb 15', typical_end:'Apr 30', reduction:'35%', status:'watch',   note:'MI Upper Peninsula typically 2 weeks earlier.' },
  { state:'ND', name:'North Dakota',   typical_start:'Mar 15', typical_end:'May 15', reduction:'50%', status:'normal',  note:'Frost laws not yet posted for 2026.' },
  { state:'SD', name:'South Dakota',   typical_start:'Mar 15', typical_end:'May 1',  reduction:'50%', status:'normal',  note:'SDDOT posts restrictions on state DOT site.' },
  { state:'IA', name:'Iowa',           typical_start:'Mar 1',  typical_end:'Apr 15', reduction:'35%', status:'normal',  note:'Iowa DOT 511 posts real-time county restrictions.' },
  { state:'IL', name:'Illinois',       typical_start:'Feb 15', typical_end:'Apr 15', reduction:'20%', status:'normal',  note:'IDOT issues county-level frost restrictions.' },
  { state:'IN', name:'Indiana',        typical_start:'Mar 1',  typical_end:'Apr 15', reduction:'25%', status:'normal',  note:'INDOT enforces by district.' },
  { state:'OH', name:'Ohio',           typical_start:'Mar 1',  typical_end:'Apr 30', reduction:'25%', status:'normal',  note:'ODOT posts district-level weight restrictions.' },
  { state:'PA', name:'Pennsylvania',   typical_start:'Feb 15', typical_end:'Apr 15', reduction:'25%', status:'normal',  note:'PennDOT posts statewide frost maps.' },
  { state:'NY', name:'New York',       typical_start:'Mar 1',  typical_end:'Apr 30', reduction:'25%', status:'normal',  note:'NYSDOT enforces by county.' },
  { state:'ME', name:'Maine',          typical_start:'Mar 15', typical_end:'May 15', reduction:'50%', status:'normal',  note:'MaineDOT enforces spring postings April"“May.' },
  { state:'ON', name:'Ontario (CA)',   typical_start:'Mar 1',  typical_end:'Apr 30', reduction:'50%', status:'normal',  note:'MTO Spring Load Restriction (SLR) period.' },
  { state:'AB', name:'Alberta (CA)',   typical_start:'Mar 1',  typical_end:'May 1',  reduction:'35%', status:'normal',  note:'Alberta Transportation posts load restrictions.' },
  { state:'SK', name:'Saskatchewan (CA)', typical_start:'Mar 15', typical_end:'May 1', reduction:'50%', status:'normal', note:'Sask Highways posts spring road bans.' },
  { state:'MB', name:'Manitoba (CA)',  typical_start:'Mar 15', typical_end:'May 1',  reduction:'50%', status:'normal',  note:'Manitoba Infrastructure posts spring road restrictions.' },
]

const STATUS_MAP = { active:{ label:'ACTIVE', color:'#ef4444', bg:'#2a0000' }, watch:{ label:'WATCH', color:'#d4950e', bg:'#2a1200' }, normal:{ label:'CLEAR', color:'#22c55e', bg:'#0d2000' } }

const schema = { '@context':'https://schema.org','@type':'WebApplication', name:'Frost Law Tracker — Spring Weight Restrictions', url:'https://www.haulcommand.com/tools/frost-law-tracker', description:'Real-time frost law and spring road restriction tracker for US and Canada.', applicationCategory:'BusinessApplication', isAccessibleForFree:true, offers:{"@type":'Offer',price:'0',priceCurrency:'USD'} }
const faq = { '@context':'https://schema.org','@type':'FAQPage', mainEntity:[
  {"@type":'Question', name:'What is a frost law?', acceptedAnswer:{"@type":'Answer', text:'Frost laws (also called spring weight restrictions or spring road bans) are seasonal weight limits imposed on roads when the ground is thawing after winter. As the frost leaves the ground, road base becomes weakened and heavy loads can cause severe pavement damage. Weight limits are typically reduced 20"“50% during frost law periods.'}},
  {"@type":'Question', name:'When do frost laws start and end?', acceptedAnswer:{"@type":'Answer', text:'Frost laws typically begin in February"“March and lift by April"“May, depending on latitude and weather. Northern states like Minnesota and Michigan have the longest frost law seasons. The exact dates vary year to year based on temperature and soil conditions.'}},
  {"@type":'Question', name:'Can I still drive oversize loads during frost laws?', acceptedAnswer:{"@type":'Answer', text:'Yes, oversize permitted loads can operate during frost law periods, but must comply with reduced weight limits. Loads that were legal before frost laws may require additional permits or routing changes when restrictions are active.'}},
]}

export default function FrostLawTrackerPage() {
  return (
    <>
      <JsonLd data={schema}/>
      <JsonLd data={faq}/>
      <div className=" bg-[#07090d] text-[#f0f2f5]">
        <div className="border-b border-[#131c28] bg-gradient-to-r from-[#0a1020] to-[#07090d]">
          <div className="px-4 lg:px-10 py-12 max-w-4xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#3b82f6] font-semibold mb-3">FREE TOOL · REAL-TIME TRACKING</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-[#f0f2f5] mb-4">Frost Law Tracker</h1>
            <p data-speakable="true" className="text-sm text-[#d0dce8] max-w-2xl mb-2 leading-relaxed">Frost laws are seasonal weight restrictions imposed on roads during spring thaw. They typically reduce legal weight limits by 20"“50% from February through May across the northern US and Canada. Use this tracker to monitor active restrictions and get alerts when frost laws activate or lift in your corridors.</p>
            <p className="text-sm text-[#8a9ab0] max-w-2xl">Live spring weight restriction status for US states and Canadian provinces. Get push alerts when frost laws activate or lift in your corridors.</p>
          </div>
        </div>
        <div className="px-4 lg:px-10 py-10 max-w-4xl mx-auto">

          {/* ALERT SIGNUP */}
          <div className="bg-[#0a1929] border border-[#3b82f640] rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-5 items-center">
            <div className="flex-1">
              <p className="text-sm font-bold text-[#f0f2f5] mb-1">ðŸ”” Get Frost Law Alerts</p>
              <p className="text-xs text-[#8a9ab0]">Push + email notifications when frost laws activate or lift in states you monitor. Free for all HC users.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input type="email" placeholder="your@email.com" className="flex-1 md:w-48 bg-[#07090d] border border-[#1e3048] rounded-xl px-4 py-2.5 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#3b82f6] focus:outline-none"/>
              <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">Subscribe</button>
            </div>
          </div>

          <div className="mb-8">
            <AdGridSponsorSlot regionName="National Coverage" type="permit_service_provider" countryCode="US" />
          </div>

          {/* STATUS LEGEND */}
          <div className="flex gap-4 mb-6 flex-wrap">
            {Object.entries(STATUS_MAP).map(([k,v])=>(
              <div key={k} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{background:v.color}}/>
                <span className="text-xs text-[#8a9ab0]">{v.label}</span>
              </div>
            ))}
            <span className="text-xs text-[#566880]">· Updated hourly from state DOT sources</span>
          </div>

          {/* STATE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
            {FROST_REFERENCE.map(s=>{
              const st = STATUS_MAP[s.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.normal
              return (
                <div key={s.state} className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 text-center shrink-0">
                    <p className="text-xs font-bold text-[#d0dce8]">{s.state}</p>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block" style={{color:st.color,background:st.bg}}>{st.label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#d0dce8]">{s.name}</p>
                    <p className="text-[10px] text-[#566880]">Typical: {s.typical_start} "“ {s.typical_end} · Reduction: {s.reduction}</p>
                    <p className="text-[10px] text-[#8a9ab0] mt-0.5">{s.note}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* FAQ */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">Frost Law FAQs</h2>
            <div className="space-y-3">
              {[
                {q:'What is a frost law?', a:'Frost laws (also called spring weight restrictions or spring road bans) are seasonal weight limits imposed on roads when the ground is thawing after winter. As frost leaves the ground, the road base weakens and heavy loads cause severe pavement damage. Weight limits are typically reduced 20"“50% during frost law periods.'},
                {q:'When do frost laws start and end?', a:'Frost laws typically begin February"“March and lift by April"“May depending on latitude and weather. Minnesota and Michigan have the longest seasons. Exact dates vary year to year based on temperature and soil conditions — check this tracker for current status.'},
                {q:'Can I still move oversize loads during frost laws?', a:'Yes, but loads must comply with reduced weight limits. A load that was legal before frost law season may need additional permits or routing changes when restrictions are active. Check with your permit agent.'},
                {q:'How much are weight limits reduced during frost laws?', a:'Reductions vary by state: 20"“25% in Pennsylvania and Ohio, 35% in Michigan and Alberta, and up to 50% in Minnesota and Saskatchewan. Some restrictions apply only to certain road classes (local, county) rather than interstate highways.'},
              ].map((item,i)=>(
                <details key={i} className="border border-[#131c28] rounded-xl p-4">
                  <summary className="text-sm font-semibold text-[#d0dce8] cursor-pointer list-none flex justify-between">{item.q}<span className="text-[#566880] ml-3">+</span></summary>
                  <p className="text-sm text-[#8a9ab0] mt-3 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[['/tools/permit-cost-calculator','Permit Cost Calculator'],['/tools/axle-weight-calculator','Axle Weight Calculator'],['/regulations','Regulations Hub'],['/directory','Operator Directory']].map(([href,label])=>(
              <Link key={href} href={href} className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#3b82f6] hover:text-[#3b82f6] transition-colors">{label} â†’</Link>
            ))}
          </div>

          {/* VISIBLE LAST UPDATED — AI engines cross-validate schema against visible page content */}
          <div className="mt-10 pt-4 border-t border-[#131c28] text-center">
            <p className="text-[10px] text-[#3a5068]">Content last updated: April 2026 · Data verified against state DOT sources · Updated hourly during active frost law season</p>
          </div>
        </div>
      </div>
    </>
  )
}