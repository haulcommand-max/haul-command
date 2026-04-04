import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Haul Command vs WideLoadShipping.com — Full Comparison 2026 | Haul Command',
  description: 'Haul Command vs WideLoadShipping.com: Compare features, tools, operator directory, booking, and global coverage. See which platform wins for heavy haul.',
  alternates: { canonical: 'https://www.haulcommand.com/vs/wideloadshipping' },
}

const COMPARISON = [
  { feature:'Operator directory',          hc:true,  hc_note:'120 countries, verified trust scores', comp:true,  comp_note:'US-focused, unverified listings' },
  { feature:'Free permit tools',           hc:true,  hc_note:'No login, full access',               comp:false, comp_note:'Basic info only' },
  { feature:'Superload calculator',        hc:true,  hc_note:'10-state thresholds, free',           comp:false, comp_note:'Not available' },
  { feature:'Frost law tracker',           hc:true,  hc_note:'Live push alerts',                    comp:false, comp_note:'Not available' },
  { feature:'Real-time availability',      hc:true,  hc_note:'Operator broadcasts, live feed',      comp:false, comp_note:'Not available' },
  { feature:'Instant broker search',       hc:true,  hc_note:'/find-capacity live map',             comp:false, comp_note:'Static directory only' },
  { feature:'Load board',                  hc:true,  hc_note:'Two-sided marketplace',               comp:false, comp_note:'Quote request form only' },
  { feature:'Operator trust score',        hc:true,  hc_note:'Composite score, publicly visible',   comp:false, comp_note:'Not available' },
  { feature:'Verified credentials',        hc:true,  hc_note:'ID, insurance, state permits',        comp:false, comp_note:'Self-reported only' },
  { feature:'Training & certification',    hc:true,  hc_note:'50+ courses, 6-tier ladder',          comp:false, comp_note:'Not available' },
  { feature:'Push notifications',          hc:true,  hc_note:'Load match, requests, claim alerts',  comp:false, comp_note:'Not available' },
  { feature:'Mobile app',                  hc:true,  hc_note:'iOS + Android',                       comp:false, comp_note:'Mobile web only' },
  { feature:'Stripe Connect payouts',      hc:true,  hc_note:'Instant/next-day to operators',       comp:false, comp_note:'Not available' },
  { feature:'AdGrid advertising',          hc:true,  hc_note:'Self-serve, 8 zones',                 comp:false, comp_note:'Not available' },
  { feature:'Global coverage',             hc:true,  hc_note:'120 countries',                       comp:false, comp_note:'Primarily US' },
  { feature:'State regulation pages',      hc:true,  hc_note:'All 50 states + 120 countries',       comp:false, comp_note:'Basic info, US only' },
  { feature:'SEO-optimised glossary',      hc:true,  hc_note:'500+ terms across 120 countries',     comp:false, comp_note:'Not available' },
  { feature:'Free to access',              hc:true,  hc_note:'Most features free, no email gate',   comp:false, comp_note:'Lead capture required for quotes' },
]

const schema = { '@context':'https://schema.org','@type':'WebPage', name:'Haul Command vs WideLoadShipping.com', description:'Feature comparison of Haul Command and WideLoadShipping.com for heavy haul logistics.', url:'https://www.haulcommand.com/vs/wideloadshipping' }

export default function VsWideLoadShippingPage() {
  const hcWins = COMPARISON.filter(c=>c.hc&&!c.comp).length
  const ties   = COMPARISON.filter(c=>c.hc&&c.comp).length

  return (
    <>
      <JsonLd data={schema}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
        <div className="border-b border-[#131c28] bg-gradient-to-r from-[#0a1929] to-[#07090d]">
          <div className="px-4 lg:px-10 py-12 max-w-4xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#d4950e] font-semibold mb-3">COMPARISON · 2026</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-[#f0f2f5] mb-4">Haul Command vs WideLoadShipping</h1>
            <p className="text-sm text-[#8a9ab0] max-w-2xl">WideLoadShipping built a basic directory and quote-request model. Haul Command built a live marketplace, trust system, tools suite, and global operator OS. Here’s the comparison.</p>
          </div>
        </div>
        <div className="px-4 lg:px-10 py-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              {label:'Haul Command leads', val:hcWins, color:'#22c55e'},
              {label:'Both offer',         val:ties,   color:'#566880'},
              {label:'WLS only',           val:0,      color:'#566880'},
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
                  <th className="text-center text-[#566880] font-semibold py-3 px-4">WideLoadShipping</th>
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
            <h2 className="text-base font-bold text-[#f0f2f5] mb-3">Try Haul Command Free</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/find-capacity" className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold px-5 py-2.5 rounded-xl text-sm">Find Capacity Now</Link>
              <Link href="/tools/permit-cost-calculator" className="border border-[#1e3048] text-[#8a9ab0] hover:border-[#22c55e] px-5 py-2.5 rounded-xl text-sm">Free Permit Calculator</Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/vs/oversize-io" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs Oversize.io →</Link>
            <Link href="/vs/ods-north-america" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs ODS North America →</Link>
            <Link href="/vs/heavyhaulers" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs HeavyHaulers →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
