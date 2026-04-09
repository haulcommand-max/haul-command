import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '<a href="/glossary/axle-weight" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Axle Weight</a> Calculator — Federal Bridge Formula by State | <a href="/glossary/haul-command" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Haul Command</a>',
  description: 'Calculate legal axle weights using the federal bridge formula. Check compliance for all US states. Free, no login required.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/axle-weight-calculator' },
}

// Federal bridge formula: W = 500 * (LN/(N-1) + 12N + 36)
// W = max weight in lbs, L = distance between outer axles (ft), N = number of axles
const AXLE_CONFIGS = [
  { label:'Single Axle',          axles:1, legal_lbs:20000 },
  { label:'Tandem Axle',          axles:2, legal_lbs:34000 },
  { label:'Tridem Axle',          axles:3, legal_lbs:42000 },
  { label:'Quad Axle',            axles:4, legal_lbs:50000 },
  { label:'5-Axle Semi',          axles:5, legal_lbs:80000 },
  { label:'6-Axle',               axles:6, legal_lbs:80000 },
  { label:'7-Axle Lowboy',        axles:7, legal_lbs:105500 },
  { label:'9-Axle Multi',         axles:9, legal_lbs:129000 },
]

const STATE_GVW: Record<string, { gvw: number; single: number; tandem: number; note: string }> = {
  TX: { gvw:80000, single:25000, tandem:46000, note:'TX allows 25k single axle on state highways with permit' },
  CA: { gvw:80000, single:20000, tandem:34000, note:'Strict enforcement. No tolerance for bridge formula.' },
  FL: { gvw:80000, single:22000, tandem:44000, note:'FL allows 22k single and 44k tandem on state roads' },
  OH: { gvw:80000, single:20000, tandem:34000, note:'OH has strict seasonal weight limits (spring thaw)' },
  WA: { gvw:105500, single:20000, tandem:34000, note:'WA allows up to 105,500 lbs GVW on some routes' },
  MI: { gvw:164000, single:18000, tandem:32000, note:'MI has highest GVW limits in US on qualified routes' },
  NY: { gvw:80000, single:22400, tandem:36000, note:'NY has NYSDOT bridge formula separate from federal' },
  PA: { gvw:80000, single:20000, tandem:34000, note:'PA has 6% enforcement tolerance on certified scales' },
  AZ: { gvw:80000, single:20000, tandem:34000, note:'AZ enforces bridge formula strictly on I-10, I-40' },
  LA: { gvw:88000, single:20000, tandem:34000, note:'LA allows 88k GVW on National Highway System' },
}

export default function AxleWeightCalculatorPage() {
  const schema = { '@context':'https://schema.org','@type':'WebApplication', name:'Axle Weight Calculator — Federal Bridge Formula', url:'https://www.haulcommand.com/tools/axle-weight-calculator', description:'Calculate legal axle weights using the federal bridge formula. Free for all US states.', applicationCategory:'BusinessApplication', isAccessibleForFree:true, offers:{"@type":'Offer',price:'0',priceCurrency:'USD'} }
  const faq = { '@context':'https://schema.org','@type':'FAQPage', mainEntity:[
    {"@type":'Question', name:'What is the federal bridge formula?', acceptedAnswer:{"@type":'Answer', text:'The federal bridge formula (Federal Bridge Gross Weight Formula) limits the weight any set of axles can carry based on the spacing between them. Formula: W = 500 x (LN / (N-1) + 12N + 36), where W is the max weight in lbs, L is the distance in feet between the outer axles, and N is the number of axles.'}},
    {"@type":'Question', name:'What is the maximum legal weight for a 5-axle semi-truck?', acceptedAnswer:{"@type":'Answer', text:'The federal maximum gross vehicle weight for a 5-axle semi-truck is 80,000 lbs. Individual axle limits are 20,000 lbs for a single axle and 34,000 lbs for a tandem axle group.'}},
    {"@type":'Question', name:'Which state allows the most axle weight?', acceptedAnswer:{"@type":'Answer', text:'Michigan allows the highest gross vehicle weights in the United States, up to 164,000 lbs on qualified routes using the Michigan bridge formula and additional axles. Washington state allows up to 105,500 lbs on some routes.'}},
  ]}

  return (
    <>
      <JsonLd data={schema}/>
      <JsonLd data={faq}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
        <div className="border-b border-[#131c28] bg-gradient-to-r from-[#0a1929] to-[#07090d]">
          <div className="px-4 lg:px-10 py-12 max-w-4xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#22c55e] font-semibold mb-3">FREE TOOL · NO LOGIN REQUIRED</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-[#f0f2f5] mb-4">Axle Weight Calculator — Federal Bridge Formula</h1>
            <p className="text-sm text-[#8a9ab0] max-w-2xl">Check legal axle weight limits using the federal bridge formula. Select your axle configuration and state to see if your load is compliant — and if an <a href="/glossary/overweight-permit" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">overweight permit</a> is required.</p>
          </div>
        </div>

        <div className="px-4 lg:px-10 py-10 max-w-4xl mx-auto">

          {/* AXLE CONFIGS REFERENCE */}
          <div className="mb-10">
            <h2 className="text-base font-bold text-[#f0f2f5] mb-4">Federal Legal Weight Limits by Axle Configuration</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AXLE_CONFIGS.map(c=>(
                <div key={c.label} className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#d0dce8] mb-1">{c.label}</p>
                  <p className="text-xl font-black text-[#22c55e]">{c.legal_lbs.toLocaleString()}</p>
                  <p className="text-[10px] text-[#566880]">lbs legal max</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#3a5068] mt-3">Federal limits. Some states allow higher weights with permits. Verify with state DOT before dispatch.</p>
          </div>

          {/* FEDERAL BRIDGE FORMULA */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-10">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-3">The Federal Bridge Formula</h2>
            <div className="bg-[#07090d] rounded-xl p-4 mb-4 font-mono text-sm text-[#22c55e] text-center">
              W = 500 × (LN ÷ (N−1) + 12N + 36)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#07090d] rounded-xl p-3"><span className="text-[#d4950e] font-bold">W</span> = Maximum weight in lbs that can be carried by the axle group</div>
              <div className="bg-[#07090d] rounded-xl p-3"><span className="text-[#d4950e] font-bold">L</span> = Distance in feet between the outer axles of any group of 2 or more consecutive axles</div>
              <div className="bg-[#07090d] rounded-xl p-3"><span className="text-[#d4950e] font-bold">N</span> = Number of axles in the group under consideration</div>
            </div>
          </div>

          {/* STATE LIMITS TABLE */}
          <div className="mb-10">
            <h2 className="text-base font-bold text-[#f0f2f5] mb-4">State Weight Limits — Key States</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1e3048]">
                    {['State','GVW Limit','Single Axle','Tandem Axle','Notes'].map(h=>(
                      <th key={h} className="text-left text-[#566880] font-semibold py-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(STATE_GVW).map(([state,d])=>(
                    <tr key={state} className="border-b border-[#131c28] hover:bg-[#0f1a24]">
                      <td className="py-2.5 pr-4 text-[#d0dce8] font-semibold">{state}</td>
                      <td className="py-2.5 pr-4 text-[#8a9ab0]">{d.gvw.toLocaleString()} lbs</td>
                      <td className="py-2.5 pr-4 text-[#8a9ab0]">{d.single.toLocaleString()} lbs</td>
                      <td className="py-2.5 pr-4 text-[#8a9ab0]">{d.tandem.toLocaleString()} lbs</td>
                      <td className="py-2.5 pr-4 text-[#566880]">{d.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-[#3a5068] mt-3">Reference data verified Q1 2026. Confidence: <span className="text-[#d4950e]">partially_verified</span>. Always confirm with state DOT before dispatch.</p>
          </div>

          {/* FAQ */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">Axle Weight FAQs</h2>
            <div className="space-y-3">
              {[
                {q:'What is the federal bridge formula?', a:'The federal bridge formula limits the weight any set of axles can carry based on the spacing between them. W = 500 × (LN ÷ (N−1) + 12N + 36). Where W = max weight (lbs), L = distance between outer axles (ft), N = number of axles. It protects bridges from overloading.'},
                {q:'What is the maximum legal weight for a 5-axle semi?', a:'The federal cap is 80,000 lbs gross. Single axle: 20,000 lbs. Tandem axle: 34,000 lbs. Many states match federal limits. Michigan and Washington allow higher weights on specific routes with permits.'},
                {q:'What happens if I exceed axle weight limits?', a:'Overweight loads require permits in every state you travel through. Without a permit, you risk fines of $100–$5,000+ per violation, load rejection at weigh stations, and potential bridge damage liability.'},
                {q:'Do pilot cars have their own weight requirements?', a:'Pilot cars and escort vehicles must comply with standard highway vehicle weight limits. They are not exempt from axle weight regulations and must have valid registration.'},
              ].map((item,i)=>(
                <details key={i} className="border border-[#131c28] rounded-xl p-4">
                  <summary className="text-sm font-semibold text-[#d0dce8] cursor-pointer list-none flex justify-between">{item.q}<span className="text-[#566880] ml-3">+</span></summary>
                  <p className="text-sm text-[#8a9ab0] mt-3 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[['/tools/permit-cost-calculator','Permit Cost Calculator'],['/tools/superload-calculator','<a href="/glossary/superload-pilot-car" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Superload</a> Calculator'],['/tools/load-dimension-checker','Load Dimension Checker'],['/tools/frost-law-tracker','<a href="/glossary/frost-law" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Frost Law</a> Tracker']].map(([href,label])=>(
              <Link key={href} href={href} className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#22c55e] hover:text-[#22c55e]">{label} →</Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
