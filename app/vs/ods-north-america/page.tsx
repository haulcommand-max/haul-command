import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Haul Command vs ODS North America — Full Comparison 2026 | Haul Command',
  description: 'Haul Command vs ODS North America: Compare features, pricing, global coverage, and dispatch tools. See how Haul Command replaces the ODS model.',
  alternates: { canonical: 'https://www.haulcommand.com/vs/ods-north-america' },
}

const COMPARISON = [
  { feature:'Online operator directory',  hc:true,  hc_note:'120 countries, live, verified',  comp:true,  comp_note:'North America focus, limited' },
  { feature:'Real-time availability broadcast', hc:true, hc_note:'Operator-controlled, instant', comp:false, comp_note:'Manual / phone-based' },
  { feature:'Online load posting',        hc:true,  hc_note:'Self-serve load board',         comp:false, comp_note:'Agent-mediated only' },
  { feature:'Instant permit cost quotes', hc:true,  hc_note:'Free calculator, 50 states',    comp:false, comp_note:'Quote request model' },
  { feature:'Consolidated invoicing',     hc:true,  hc_note:'Auto-generated per job',        comp:true,  comp_note:'ODS core service' },
  { feature:'Payment processing',         hc:true,  hc_note:'Stripe Connect, instant payouts',comp:false,comp_note:'Invoice/check based' },
  { feature:'Operator trust scores',      hc:true,  hc_note:'Verified, public, on profiles', comp:false, comp_note:'Not available' },
  { feature:'Standing orders / escrow',   hc:true,  hc_note:'Pre-funded, recurring',         comp:false, comp_note:'Not available' },
  { feature:'Training & certification',   hc:true,  hc_note:'50+ courses, 6 tiers',          comp:false, comp_note:'Not available' },
  { feature:'Route intelligence',         hc:true,  hc_note:'AI + human surveyor marketplace',comp:true, comp_note:'Human surveyor network' },
  { feature:'Self-serve booking',         hc:true,  hc_note:'Broker posts, operator accepts', comp:false,comp_note:'ODS agent books for you' },
  { feature:'Global coverage',            hc:true,  hc_note:'120 countries',                  comp:false,comp_note:'US + Canada primarily' },
  { feature:'Mobile app',                 hc:true,  hc_note:'iOS + Android',                 comp:false, comp_note:'Web only' },
  { feature:'Free tools',                 hc:true,  hc_note:'All tools free, no login',      comp:false, comp_note:'Tools not publicly available' },
  { feature:'No agent dependency',        hc:true,  hc_note:'Platform-native self-serve',    comp:false, comp_note:'ODS model requires agent' },
  { feature:'Data products',              hc:true,  hc_note:'Corridor rates, API, reports',  comp:false, comp_note:'Not available' },
]

const schema = { '@context':'https://schema.org','@type':'WebPage', name:'Haul Command vs ODS North America', description:'Feature-by-feature comparison of Haul Command and ODS North America for heavy haul logistics dispatch.', url:'https://www.haulcommand.com/vs/ods-north-america' }

export default function VsODSPage() {
  const hcWins = COMPARISON.filter(c=>c.hc&&!c.comp).length
  const ties   = COMPARISON.filter(c=>c.hc&&c.comp).length
  const compWins = COMPARISON.filter(c=>!c.hc&&c.comp).length

  return (
    <>
      <JsonLd data={schema}/>
      <div className=" bg-[#07090d] text-[#f0f2f5]">
        <div className="border-b border-[#131c28] bg-gradient-to-r from-[#0a1929] to-[#07090d]">
          <div className="px-4 lg:px-10 py-12 max-w-4xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#d4950e] font-semibold mb-3">COMPARISON · 2026</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-[#f0f2f5] mb-4">Haul Command vs ODS North America</h1>
            <p className="text-sm text-[#8a9ab0] max-w-2xl">ODS North America built a dispatch and invoicing model on phone-based agent relationships. Haul Command replaces that model with a self-serve platform, instant payouts, verified trust, and global coverage.</p>
          </div>
        </div>
        <div className="px-4 lg:px-10 py-10 max-w-4xl mx-auto">

          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              {label:'Haul Command leads', val:hcWins, color:'#22c55e'},
              {label:'Both offer',          val:ties,   color:'#566880'},
              {label:'ODS only',            val:compWins,color:'#566880'},
            ].map(s=>(
              <div key={s.label} className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5 text-center">
                <p className="text-3xl font-black" style={{color:s.color}}>{s.val}</p>
                <p className="text-[10px] text-[#566880] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto mb-10">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e3048]">
                  <th className="text-left text-[#566880] font-semibold py-3 pr-4 w-1/3">Feature</th>
                  <th className="text-center text-[#d4950e] font-bold py-3 px-4">Haul Command</th>
                  <th className="text-center text-[#566880] font-semibold py-3 px-4">ODS North America</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row,i)=>(
                  <tr key={i} className="border-b border-[#131c28] hover:bg-[#0f1a24]">
                    <td className="py-3 pr-4 text-[#d0dce8] font-semibold">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {row.hc
                        ? <><span className="text-[#22c55e] font-bold">âœ”</span>{row.hc_note&&<p className="text-[10px] text-[#566880] mt-0.5">{row.hc_note}</p>}</>
                        : <span className="text-[#3a5068]">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.comp
                        ? <><span className="text-[#566880] font-bold">âœ”</span>{row.comp_note&&<p className="text-[10px] text-[#566880] mt-0.5">{row.comp_note}</p>}</>
                        : <><span className="text-[#3a5068]">âœ•</span>{row.comp_note&&<p className="text-[10px] text-[#3a5068] mt-0.5">{row.comp_note}</p>}</>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">From Agent Model to Platform Model</h2>
            {[
              {title:'Self-serve replaces agent dependency', body:'ODS requires you to contact a human agent to book escorts. Haul Command's load board, capacity feed, and instant booking let operators and brokers transact directly — 24/7, globally.'},
              {title:'Instant payouts replace invoice delays', body:'ODS uses traditional invoice and check payment cycles. Haul Command's HC Pay issues instant or next-day payouts via Stripe Connect to verified operators in 120 countries.'},
              {title:'Trust scores replace word-of-mouth', body:'ODS has no public verification layer. Haul Command's trust score, badge system, and report card make every operator's reputation visible before a broker makes contact.'},
              {title:'120 countries replace North America', body:'ODS concentrates on US and Canada. Haul Command operates across 120 countries with country-specific regulation data, local certifications, and hyperlocal pages in every market.'},
            ].map((item,i)=>(
              <div key={i} className={`${i<3?'border-b border-[#131c28] pb-4 mb-4':''}`}>
                <p className="text-xs font-bold text-[#22c55e] mb-1">âœ” {item.title}</p>
                <p className="text-xs text-[#8a9ab0] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-[#0f1a24] to-[#0a1929] border border-[#1e3048] rounded-2xl p-8 text-center mb-8">
            <h2 className="text-lg font-bold text-[#f0f2f5] mb-3">Try Haul Command — Free</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/find-capacity" className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold px-5 py-2.5 rounded-xl text-sm">Find Capacity Now â†’</Link>
              <Link href="/register" className="border border-[#d4950e] text-[#d4950e] hover:bg-[#d4950e20] font-semibold px-5 py-2.5 rounded-xl text-sm">Create Free Account</Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/vs/oversize-io" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs Oversize.io â†’</Link>
            <Link href="/vs/wideloadshipping" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs WideLoadShipping â†’</Link>
            <Link href="/vs/heavyhaulers" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs HeavyHaulers â†’</Link>
          </div>
        </div>
      </div>
    </>
  )
}