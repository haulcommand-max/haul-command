import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Is My Load Oversize? Load Dimension & Weight Checker | <a href="/glossary/haul-command" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Haul Command</a>',
  description: 'Enter your load dimensions and weight to instantly find out if it is oversize, what permits you need, and whether a <a href="/glossary/pilot-car" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">pilot car</a> is required. Free, no login.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/load-dimension-checker' },
}

// US legal load dimensions
const FEDERAL_LIMITS = { width_ft:8.5, height_ft:13.5, length_ft:53, weight_lbs:80000 }

const STATE_OVERRIDES = [
  { state:'CA', width:8.5, height:14.0, length:65,  weight:80000 },
  { state:'TX', width:8.5, height:14.0, length:65,  weight:80000 },
  { state:'WA', width:8.5, height:14.0, length:75,  weight:105500 },
  { state:'MI', width:8.5, height:13.5, length:65,  weight:164000 },
  { state:'NY', width:8.5, height:13.5, length:65,  weight:80000 },
  { state:'FL', width:8.5, height:13.5, length:65,  weight:80000 },
]

const ESCORT_MATRIX = [
  { trigger:'Width 10–12 ft', requirement:'1 <a href="/glossary/escort-vehicle" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">escort vehicle</a> (front or rear per state)', states:'Most US states' },
  { trigger:'Width 12–14 ft', requirement:'1 front escort + 1 <a href="/glossary/chase-pilot-car" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">rear escort vehicle</a>',       states:'Most US states' },
  { trigger:'Width 14–16 ft', requirement:'2 escorts + high pole operator (some states)',  states:'AZ, TX, CA, WA, OR, NV' },
  { trigger:'Width 16+ ft',   requirement:'2 escorts + high pole + police escort',         states:'Most US states (<a href="/glossary/superload-pilot-car" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">superload</a>)' },
  { trigger:'Height 14–15 ft',requirement:'High pole operator required',                   states:'AZ, TX, NM, CA' },
  { trigger:'Height 15+ ft',  requirement:'High pole + police escort (many states)',        states:'Most US states' },
  { trigger:'Length 100+ ft', requirement:'Rear steer / steerman operator',               states:'CA, AZ, TX, OR, NV, WA' },
]

const schema = { '@context':'https://schema.org','@type':'WebApplication', name:'Load Dimension Checker — Is My Load Oversize?', url:'https://www.haulcommand.com/tools/load-dimension-checker', description:'Check if your load is oversize and what permits and escorts are required. Free, no login required.', applicationCategory:'BusinessApplication', isAccessibleForFree:true, offers:{"@type":'Offer',price:'0',priceCurrency:'USD'} }
const faq = { '@context':'https://schema.org','@type':'FAQPage', mainEntity:[
  {"@type":'Question', name:'What makes a load oversize in the US?', acceptedAnswer:{"@type":'Answer', text:'In the US, a load is considered oversize if it exceeds any of these federal limits: width over 8 feet 6 inches (8.5 ft), height over 13 feet 6 inches (13.5 ft), length over 53 feet (standard trailer), or weight over 80,000 lbs gross vehicle weight. Exceeding any of these dimensions requires an <a href="/glossary/oversize-trucking-permit" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">oversize load permit</a> in every state the load travels through.'}},
  {"@type":'Question', name:'When is a pilot car required?', acceptedAnswer:{"@type":'Answer', text:'A pilot car (escort vehicle) is required when a load exceeds state-specific width, height, or length thresholds. In most US states, loads exceeding 12 feet wide require at least one pilot car. At 14+ feet wide, two pilot cars are typically required. At 16+ feet wide, police escorts are additionally required in most states.'}},
  {"@type":'Question', name:'What is the maximum legal load width without a permit?', acceptedAnswer:{"@type":'Answer', text:'The maximum legal load width without an oversize permit in the United States is 8 feet 6 inches (8.5 ft) on most highways. Some states allow slightly different legal widths on certain road types. Any load exceeding this requires an oversize permit.'}},
]}

export default function LoadDimensionCheckerPage() {
  return (
    <>
      <JsonLd data={schema}/>
      <JsonLd data={faq}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
        <div className="border-b border-[#131c28] bg-gradient-to-r from-[#0a1929] to-[#07090d]">
          <div className="px-4 lg:px-10 py-12 max-w-4xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#22c55e] font-semibold mb-3">FREE TOOL · NO LOGIN REQUIRED</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-[#f0f2f5] mb-4">Is My Load Oversize?</h1>
            <p className="text-sm text-[#8a9ab0] max-w-2xl">Enter your load dimensions and weight to instantly find out if permits are required, what pilot car or escort rules apply, and what states have different thresholds.</p>
          </div>
        </div>
        <div className="px-4 lg:px-10 py-10 max-w-4xl mx-auto">

          {/* CHECKER */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-5">Enter Load Dimensions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[{label:'Width (ft)',ph:'12',id:'dim-width'},{label:'Height (ft)',ph:'14',id:'dim-height'},{label:'Length (ft)',ph:'100',id:'dim-length'},{label:'Weight (lbs)',ph:'80000',id:'dim-weight'}].map(f=>(
                <div key={f.id}>
                  <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">{f.label}</label>
                  <input id={f.id} type="number" placeholder={f.ph} className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#22c55e] focus:outline-none"/>
                </div>
              ))}
            </div>
            <button className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold py-3.5 rounded-xl text-sm transition-colors">Check My Load →</button>
            <p className="text-[10px] text-[#3a5068] text-center mt-3">Interactive engine launching Q2 2026. Use the reference tables below for immediate guidance.</p>
          </div>

          {/* FEDERAL LIMITS QUICK REFERENCE */}
          <div className="mb-8">
            <h2 className="text-base font-bold text-[#f0f2f5] mb-4">Federal Legal Load Limits — Quick Reference</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label:'Max Width',  val:"8'6\"",  over:'> 8.5 ft', color:'#ef4444' },
                { label:'Max Height', val:"13'6\"", over:'> 13.5 ft', color:'#d4950e' },
                { label:'Max Length', val:"53'",     over:'> 53 ft',  color:'#3b82f6' },
                { label:'Max GVW',    val:'80,000 lbs', over:'> 80k', color:'#8b5cf6' },
              ].map(d=>(
                <div key={d.label} className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 text-center">
                  <p className="text-[10px] text-[#566880] mb-2 font-semibold tracking-wider">{d.label}</p>
                  <p className="text-2xl font-black text-[#22c55e] mb-1">{d.val}</p>
                  <p className="text-[10px]" style={{color:d.color}}>Permit required if {d.over}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ESCORT MATRIX */}
          <div className="mb-10">
            <h2 className="text-base font-bold text-[#f0f2f5] mb-4">Escort / Pilot Car Requirements Matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1e3048]">
                    {['Trigger Dimension','Escort Requirement','Typical States'].map(h=>(
                      <th key={h} className="text-left text-[#566880] font-semibold py-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ESCORT_MATRIX.map((row,i)=>(
                    <tr key={i} className="border-b border-[#131c28] hover:bg-[#0f1a24]">
                      <td className="py-2.5 pr-4 text-[#d4950e] font-semibold whitespace-nowrap">{row.trigger}</td>
                      <td className="py-2.5 pr-4 text-[#8a9ab0]">{row.requirement}</td>
                      <td className="py-2.5 pr-4 text-[#566880]">{row.states}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#3a5068] mt-3">Reference Q1 2026. Requirements vary by state. Always confirm with the permit office before dispatch.</p>
          </div>

          {/* FAQ */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">Load Classification FAQs</h2>
            <div className="space-y-3">
              {[
                {q:'What makes a load oversize in the US?', a:'A load is oversize if it exceeds any of: width over 8.5 ft, height over 13.5 ft, length over 53 ft (standard trailer), or weight over 80,000 lbs GVW. Exceeding any of these requires an oversize permit in every state traveled through.'},
                {q:'When is a pilot car required?', a:'A pilot car is required when a load exceeds state-specific width, height, or length thresholds. In most US states, loads over 12 ft wide require at least one pilot car. At 14+ ft wide, two are typically required. At 16+ ft wide, police escorts are additionally required in most states.'},
                {q:'What is the maximum legal width without a permit?', a:'8 feet 6 inches (8.5 ft) on most US highways. Some states allow slightly different legal widths on certain road classes, but any load exceeding 8.5 ft requires an oversize permit in virtually all states.'},
                {q:'Is length or weight more important for determining if a load is oversize?', a:'Both matter independently. A load can be legal in weight but oversize in width, or legal in dimensions but overweight. You need a permit if you exceed any single threshold — they are not averaged or combined.'},
              ].map((item,i)=>(
                <details key={i} className="border border-[#131c28] rounded-xl p-4">
                  <summary className="text-sm font-semibold text-[#d0dce8] cursor-pointer list-none flex justify-between">{item.q}<span className="text-[#566880] ml-3">+</span></summary>
                  <p className="text-sm text-[#8a9ab0] mt-3 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[['/tools/permit-cost-calculator','Permit Cost Calculator'],['/tools/axle-weight-calculator','<a href="/glossary/axle-weight" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Axle Weight</a> Calculator'],['/tools/superload-calculator','Superload Calculator'],['/find-capacity','Find Pilot Car Now']].map(([href,label])=>(
              <Link key={href} href={href} className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#22c55e] hover:text-[#22c55e] transition-colors">{label} →</Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
