import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '<a href="/glossary/superload-pilot-car" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Superload</a> Permit Calculator — Requirements by State | <a href="/glossary/haul-command" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Haul Command</a>',
  description: 'Determine if your load qualifies as a superload. Get superload permit requirements, engineering review thresholds, and police escort rules by state. Free, no login.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/superload-calculator' },
}

// Superload thresholds by state (width ft / height ft / weight lbs)
const STATE_SUPERLOAD: Record<string,{ w:number; h:number; lbs:number; police:string; eng:string; note:string }> = {
  TX: { w:18,  h:16,   lbs:254300, police:'Required ≥18ft wide or ≥16ft tall', eng:'Required ≥180k lbs or ≥16ft ht', note:'TX DOT Oversize Permit Office manages superload routing.' },
  CA: { w:16,  h:15.5, lbs:250000, police:'Required ≥16ft wide',               eng:'Required ≥200k lbs',               note:'Caltrans issues separate SA (Special Authorization) permits.' },
  FL: { w:18,  h:16,   lbs:200000, police:'Required ≥18ft wide',               eng:'Required ≥200k lbs',               note:'FDOT requires 10-day notice for superloads.' },
  OH: { w:16,  h:15,   lbs:200000, police:'Required ≥16ft wide',               eng:'Required ≥150k lbs',               note:'OH uses bespoke route analysis for superloads.' },
  WA: { w:18,  h:16,   lbs:200000, police:'Required ≥18ft wide',               eng:'Required ≥166k lbs',               note:'WSDOT requires engineering study for novel routes.' },
  LA: { w:18,  h:16,   lbs:200000, police:'Required ≥18ft wide',               eng:'Required ≥200k lbs',               note:'LA DOTD coordinates with parish governments.' },
  AZ: { w:18,  h:16,   lbs:200000, police:'Required ≥16ft wide',               eng:'Required ≥160k lbs',               note:'ADOT issues superload permits from Phoenix HQ only.' },
  PA: { w:16,  h:15,   lbs:200000, police:'Required ≥16ft wide',               eng:'Required ≥200k lbs',               note:'PennDOT requires pre-move conference for superloads.' },
  MT: { w:18,  h:17,   lbs:200000, police:'Required ≥20ft wide',               eng:'Required ≥200k lbs',               note:'MT MDT allows wider loads due to low traffic density.' },
  ND: { w:20,  h:18,   lbs:200000, police:'Discretionary',                       eng:'Required ≥200k lbs',               note:'ND allows very wide loads on many rural corridors.' },
}

const schema = { '@context':'https://schema.org','@type':'WebApplication', name:'Superload Permit Calculator', url:'https://www.haulcommand.com/tools/superload-calculator', description:'Determine if your load is a superload and get requirements by state. Free, no login required.', applicationCategory:'BusinessApplication', isAccessibleForFree:true, offers:{"@type":'Offer',price:'0',priceCurrency:'USD'} }
const faq = { '@context':'https://schema.org','@type':'FAQPage', mainEntity:[
  {"@type":'Question', name:'What is a superload?', acceptedAnswer:{"@type":'Answer', text:'A superload is any load that exceeds standard oversize permit thresholds — typically over 16 feet wide, 16 feet tall, or over 200,000 lbs. Exact thresholds vary by state. Superloads require special permits, engineering reviews, police escorts, and often advance coordination with multiple agencies.'}},
  {"@type":'Question', name:'How long does a superload permit take?', acceptedAnswer:{"@type":'Answer', text:'Superload permits typically take 5–15 business days, compared to 1–3 days for standard oversize permits. Engineering reviews, bridge surveys, and police escort coordination all add time. Expedited processing is available in some states for an additional fee.'}},
  {"@type":'Question', name:'Do superloads always need a police escort?', acceptedAnswer:{"@type":'Answer', text:'Most states require police escorts for loads exceeding 16–18 feet wide. Police <a href="/glossary/escort-requirements" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">escort requirements</a> also apply after certain hours, on specific road types, or when bridges require traffic control. Requirements vary significantly by state.'}},
  {"@type":'Question', name:'What is an engineering review for a superload?', acceptedAnswer:{"@type":'Answer', text:'An engineering review is a certified analysis by a licensed Professional Engineer (PE) that evaluates whether bridges and roads along the planned route can safely support the superload. Required by most states for loads exceeding 150,000–200,000 lbs.'}},
]}

export default function SuperloadCalculatorPage() {
  return (
    <>
      <JsonLd data={schema}/>
      <JsonLd data={faq}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
        <div className="border-b border-[#131c28] bg-gradient-to-r from-[#1a0a0a] to-[#07090d]">
          <div className="px-4 lg:px-10 py-12 max-w-4xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#ef4444] font-semibold mb-3">FREE TOOL · NO LOGIN REQUIRED</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-[#f0f2f5] mb-4">Superload Permit Calculator</h1>
            <p className="text-sm text-[#8a9ab0] max-w-2xl">Is your load a superload? Enter dimensions and weight to determine thresholds by state — including engineering review requirements, police escort rules, and permit lead times.</p>
          </div>
        </div>
        <div className="px-4 lg:px-10 py-10 max-w-4xl mx-auto">

          {/* THRESHOLD CHECKER */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-5">Check Your Load</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[{label:'Width (ft)',ph:'18',id:'sl-width'},{label:'Height (ft)',ph:'16',id:'sl-height'},{label:'Length (ft)',ph:'150',id:'sl-length'},{label:'Weight (lbs)',ph:'250000',id:'sl-weight'}].map(f=>(
                <div key={f.id}>
                  <label className="block text-[10px] text-[#566880] mb-1.5 font-semibold tracking-wider">{f.label}</label>
                  <input id={f.id} type="number" placeholder={f.ph} className="w-full bg-[#07090d] border border-[#1e3048] rounded-xl px-3 py-2.5 text-sm text-[#f0f2f5] placeholder-[#3a5068] focus:border-[#ef4444] focus:outline-none"/>
                </div>
              ))}
            </div>
            <button className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-3.5 rounded-xl text-sm transition-colors">Check Superload Status →</button>
            <p className="text-[10px] text-[#3a5068] text-center mt-3">Interactive engine launching Q2 2026. For complex superloads contact us: <a href="mailto:superload@haulcommand.com" className="text-[#d4950e]">superload@haulcommand.com</a></p>
          </div>

          {/* WHAT IS A SUPERLOAD */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">What Is a Superload?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label:'Width Threshold',   val:'16–18+ ft',    desc:'Most states trigger superload status at 16–18 feet wide. Standard oversize max is typically 14–16 ft.' },
                { label:'Height Threshold',  val:'15.5–17+ ft',  desc:'Vehicle height above 15.5–16 ft typically triggers superload classification in most states.' },
                { label:'Weight Threshold',  val:'150k–200k+ lbs',desc:'Gross vehicle weight above 150,000–200,000 lbs typically requires superload engineering review.' },
              ].map(t=>(
                <div key={t.label} className="bg-[#07090d] rounded-xl p-4 border border-[#131c28]">
                  <p className="text-[10px] text-[#566880] mb-1 font-semibold tracking-wider">{t.label}</p>
                  <p className="text-xl font-black text-[#ef4444] mb-2">{t.val}</p>
                  <p className="text-[11px] text-[#8a9ab0] leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* STATE TABLE */}
          <div className="mb-10">
            <h2 className="text-base font-bold text-[#f0f2f5] mb-4">Superload Thresholds by State</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1e3048]">
                    {['State','Width','Height','GVW','Police Escort','Engineering Review','Notes'].map(h=>(
                      <th key={h} className="text-left text-[#566880] font-semibold py-2 pr-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(STATE_SUPERLOAD).map(([state,d])=>(
                    <tr key={state} className="border-b border-[#131c28] hover:bg-[#0f1a24]">
                      <td className="py-2.5 pr-3 text-[#d0dce8] font-semibold">{state}</td>
                      <td className="py-2.5 pr-3 text-[#ef4444] font-bold">{d.w}&apos;</td>
                      <td className="py-2.5 pr-3 text-[#ef4444] font-bold">{d.h}&apos;</td>
                      <td className="py-2.5 pr-3 text-[#ef4444] font-bold">{d.lbs.toLocaleString()}</td>
                      <td className="py-2.5 pr-3 text-[#8a9ab0]">{d.police}</td>
                      <td className="py-2.5 pr-3 text-[#8a9ab0]">{d.eng}</td>
                      <td className="py-2.5 pr-3 text-[#566880]">{d.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#3a5068] mt-3">Reference Q1 2026. Confidence: <span className="text-[#d4950e]">partially_verified</span>. Always confirm with state DOT before dispatch.</p>
          </div>

          {/* FAQ */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">Superload FAQs</h2>
            <div className="space-y-3">
              {[
                {q:'What is a superload?', a:'A superload is any load that exceeds standard oversize permit thresholds — typically over 16 feet wide, 16 feet tall, or over 200,000 lbs. Exact thresholds vary by state. Superloads require special permits, engineering reviews, police escorts, and often advance agencies coordination.'},
                {q:'How long does a superload permit take?', a:'Superload permits typically take 5–15 business days. Engineering reviews, bridge surveys, and police escort coordination all add time. Some states offer expedited processing for an additional fee.'},
                {q:'Do superloads always need a police escort?', a:'Most states require police escorts for loads exceeding 16–18 feet wide. Requirements also apply after certain hours, on specific road types, or when bridges require traffic control. Requirements vary significantly by state.'},
                {q:'What is an engineering review for a superload?', a:'A certified analysis by a licensed PE that evaluates whether bridges and roads along the planned route can safely support the load. Required by most states for loads exceeding 150,000–200,000 lbs. Typically costs $500–$5,000 per state.'},
                {q:'Can I get a superload permit online?', a:'Very few states allow online superload permit filing due to the complexity of routing and engineering requirements. Most require direct coordination with the state DOT permit office.'},
              ].map((item,i)=>(
                <details key={i} className="border border-[#131c28] rounded-xl p-4">
                  <summary className="text-sm font-semibold text-[#d0dce8] cursor-pointer list-none flex justify-between">{item.q}<span className="text-[#566880] ml-3">+</span></summary>
                  <p className="text-sm text-[#8a9ab0] mt-3 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[['/tools/permit-cost-calculator','Permit Cost Calculator'],['/tools/axle-weight-calculator','<a href="/glossary/axle-weight" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Axle Weight</a> Calculator'],['/tools/load-dimension-checker','Load Dimension Checker'],['/regulations','Regulations Hub']].map(([href,label])=>(
              <Link key={href} href={href} className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#ef4444] hover:text-[#ef4444] transition-colors">{label} →</Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
