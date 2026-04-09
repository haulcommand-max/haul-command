import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Haul Command vs HeavyHaulers.com — Full Comparison 2026 | Haul Command',
  description: 'Haul Command vs HeavyHaulers.com: Features, pricing, tools, operator trust, global coverage. See why operators and brokers choose Haul Command.',
  alternates: { canonical: 'https://www.haulcommand.com/vs/heavyhaulers' },
}

const COMPARISON = [
  { feature:'Operator directory',        hc:true,  hc_note:'120 countries, trust-verified',      comp:true,  comp_note:'US-focused broker network' },
  { feature:'Self-serve booking',        hc:true,  hc_note:'Operator posts, broker accepts',     comp:false, comp_note:'HH agent-mediated quote' },
  { feature:'Real-time availability',    hc:true,  hc_note:'Live broadcast feed',                comp:false, comp_note:'Not available' },
  { feature:'Permit cost tools',         hc:true,  hc_note:'Free, all 50 states',               comp:false, comp_note:'Not available (HH books permits)' },
  { feature:'Axle weight calculator',    hc:true,  hc_note:'Federal bridge formula, free',       comp:false, comp_note:'Not available' },
  { feature:'Superload resources',       hc:true,  hc_note:'Calculator + state thresholds',      comp:true,  comp_note:'Blog content only' },
  { feature:'Operator trust scores',     hc:true,  hc_note:'Composite score, public profile',    comp:false, comp_note:'Not available' },
  { feature:'Training & certification',  hc:true,  hc_note:'50+ courses, 6-tier ladder',         comp:false, comp_note:'Not available' },
  { feature:'Push notifications',        hc:true,  hc_note:'Load match, availability alerts',    comp:false, comp_note:'Email only' },
  { feature:'Instant payouts',           hc:true,  hc_note:'Stripe Connect, next-day',           comp:false, comp_note:'Check/ACH, delayed' },
  { feature:'Standing orders',           hc:true,  hc_note:'Pre-funded recurring escrow jobs',   comp:false, comp_note:'Not available' },
  { feature:'Global coverage',           hc:true,  hc_note:'120 countries',                      comp:false, comp_note:'US primary' },
  { feature:'Mobile app',                hc:true,  hc_note:'iOS + Android',                      comp:true,  comp_note:'iOS + Android' },
  { feature:'Load board',                hc:true,  hc_note:'Self-serve two-sided marketplace',   comp:true,  comp_note:'HH-curated only' },
  { feature:'AdGrid advertising',        hc:true,  hc_note:'Self-serve, 8 precision zones',      comp:false, comp_note:'Not available' },
  { feature:'Free public tools',         hc:true,  hc_note:'No login for core tools',            comp:false, comp_note:'Login/quote required' },
  { feature:'Compliance data',           hc:true,  hc_note:'All 50 states + 120 countries',      comp:true,  comp_note:'US only, partial' },
]

const schema = { '@context':'https://schema.org','@type':'WebPage', name:'Haul Command vs HeavyHaulers.com', url:'https://www.haulcommand.com/vs/heavyhaulers' }

export default function VsHeavyHaulersPage() {
  const hcWins = COMPARISON.filter(c=>c.hc&&!c.comp).length
  const ties   = COMPARISON.filter(c=>c.hc&&c.comp).length
  const compWins = COMPARISON.filter(c=>!c.hc&&c.comp).length

  return (
    <>
      <JsonLd data={schema}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
        <div className="border-b border-[#131c28] bg-gradient-to-r from-[#0a1929] to-[#07090d]">
          <div className="px-4 lg:px-10 py-12 max-w-4xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#d4950e] font-semibold mb-3">COMPARISON · 2026</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-[#f0f2f5] mb-4">Haul Command vs HeavyHaulers.com</h1>
            <p className="text-sm text-[#8a9ab0] max-w-2xl">HeavyHaulers built a broker-side quoting model. Haul Command puts both sides on the same platform — with trust verification, self-serve tools, live availability, and global reach.</p>
          </div>
        </div>
        <div className="px-4 lg:px-10 py-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              {label:'Haul Command leads', val:hcWins,   color:'#22c55e'},
              {label:'Both offer',         val:ties,     color:'#566880'},
              {label:'HeavyHaulers only',  val:compWins, color:'#566880'},
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
                  <th className="text-center text-[#566880] font-semibold py-3 px-4">HeavyHaulers.com</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row,i)=>(
                  <tr key={i} className="border-b border-[#131c28] hover:bg-[#0f1a24]">
                    <td className="py-3 pr-4 text-[#d0dce8] font-semibold">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {row.hc ? <><span className="text-[#22c55e] font-bold">✔</span>{row.hc_note&&<p className="text-[10px] text-[#566880] mt-0.5">{row.hc_note}</p>}</> : <span className="text-[#3a5068]">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.comp ? <><span className="text-[#566880] font-bold">✔</span>{row.comp_note&&<p className="text-[10px] text-[#566880] mt-0.5">{row.comp_note}</p>}</> : <><span className="text-[#3a5068]">✕</span>{row.comp_note&&<p className="text-[10px] text-[#3a5068] mt-0.5">{row.comp_note}</p>}</>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gradient-to-r from-[#0f1a24] to-[#0a1929] border border-[#1e3048] rounded-2xl p-8 text-center mb-6">
            <h2 className="text-base font-bold text-[#f0f2f5] mb-3">Join the Platform HeavyHaulers Can’t Build</h2>
            <p className="text-sm text-[#8a9ab0] mb-5">Self-serve. Real-time. 120 countries. Trust-verified.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/register" className="bg-[#d4950e] hover:bg-[#c4850e] text-white font-bold px-5 py-2.5 rounded-xl text-sm">Create Free Account</Link>
              <Link href="/available-now/broadcast" className="border border-[#1e3048] text-[#8a9ab0] hover:border-[#22c55e] px-5 py-2.5 rounded-xl text-sm">Broadcast Availability</Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/vs/oversize-io"      className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs Oversize.io →</Link>
            <Link href="/vs/ods-north-america" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs ODS North America →</Link>
            <Link href="/vs/wideloadshipping" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs WideLoadShipping →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
