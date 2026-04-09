import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Haul Command vs Oversize.io — Full Comparison 2026 | Haul Command',
  description: 'Haul Command vs Oversize.io: Side-by-side comparison of features, pricing, tools access, global coverage, and operator directory. See why Haul Command wins.',
  alternates: { canonical: 'https://www.haulcommand.com/vs/oversize-io' },
}

const COMPARISON = [
  { feature:'Permit cost calculator',     hc:true,  hc_note:'Free, no login',         comp:true,  comp_note:'Login required / gated' },
  { feature:'Axle weight calculator',     hc:true,  hc_note:'Free, no login',         comp:true,  comp_note:'Partial feature' },
  { feature:'Superload calculator',       hc:true,  hc_note:'Free',                   comp:false, comp_note:'Not available' },
  { feature:'Frost law tracker',          hc:true,  hc_note:'Free, push alerts',      comp:false, comp_note:'Not available' },
  { feature:'Load dimension checker',     hc:true,  hc_note:'Free',                   comp:false, comp_note:'Not available' },
  { feature:'Route planner',              hc:true,  hc_note:'Free',                   comp:true,  comp_note:'Paid tier only' },
  { feature:'Operator directory',         hc:true,  hc_note:'120 countries, verified',comp:false, comp_note:'US only, unverified' },
  { feature:'Real-time availability',     hc:true,  hc_note:'Live broadcasted feed',  comp:false, comp_note:'Not available' },
  { feature:'Find capacity',              hc:true,  hc_note:'Live broker search',     comp:false, comp_note:'Not available' },
  { feature:'Load board',                 hc:true,  hc_note:'Two-sided marketplace',  comp:false, comp_note:'Not available' },
  { feature:'Standing orders',            hc:true,  hc_note:'Unique HC feature',      comp:false, comp_note:'Not available' },
  { feature:'Training & certification',   hc:true,  hc_note:'6-tier, 50+ courses',    comp:false, comp_note:'Not available' },
  { feature:'Trust score / verification', hc:true,  hc_note:'Visible on all profiles',comp:false, comp_note:'Not available' },
  { feature:'Push notifications',         hc:true,  hc_note:'Load match, claims, alerts',comp:false,comp_note:'Not available' },
  { feature:'Global coverage',            hc:true,  hc_note:'120 countries',          comp:false, comp_note:'US only' },
  { feature:'Mobile app',                 hc:true,  hc_note:'iOS + Android',          comp:true,  comp_note:'iOS + Android' },
  { feature:'AdGrid / advertising',       hc:true,  hc_note:'Self-serve, 8 zones',    comp:false, comp_note:'Not available' },
  { feature:'Free tier',                  hc:true,  hc_note:'Most tools free, no wall',comp:false,comp_note:'Login wall on most tools' },
]

const schema = { '@context':'https://schema.org','@type':'WebPage', name:'Haul Command vs Oversize.io', description:'Feature-by-feature comparison of Haul Command and Oversize.io for heavy haul logistics.', url:'https://www.haulcommand.com/vs/oversize-io' }

export default function VsOversizeIoPage() {
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
            <h1 className="text-2xl lg:text-4xl font-extrabold text-[#f0f2f5] mb-4">Haul Command vs Oversize.io</h1>
            <p className="text-sm text-[#8a9ab0] max-w-2xl">A transparent feature-by-feature comparison. We built Haul Command to replace every tool Oversize.io locks behind a paywall — and add what they never built.</p>
          </div>
        </div>
        <div className="px-4 lg:px-10 py-10 max-w-4xl mx-auto">

          {/* SCORE CARDS */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              {label:'Haul Command leads', val:hcWins, color:'#22c55e'},
              {label:'Both offer',          val:ties,   color:'#566880'},
              {label:'Oversize.io only',    val:compWins,color:'#ef4444'},
            ].map(s=>(
              <div key={s.label} className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5 text-center">
                <p className="text-3xl font-black" style={{color:s.color}}>{s.val}</p>
                <p className="text-[10px] text-[#566880] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* COMPARISON TABLE */}
          <div className="overflow-x-auto mb-10">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e3048]">
                  <th className="text-left text-[#566880] font-semibold py-3 pr-4 w-1/3">Feature</th>
                  <th className="text-center text-[#d4950e] font-bold py-3 px-4">Haul Command</th>
                  <th className="text-center text-[#566880] font-semibold py-3 px-4">Oversize.io</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row,i)=>(
                  <tr key={i} className="border-b border-[#131c28] hover:bg-[#0f1a24]">
                    <td className="py-3 pr-4 text-[#d0dce8] font-semibold">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {row.hc
                        ? <><span className="text-[#22c55e] font-bold">✔</span>{row.hc_note&&<p className="text-[10px] text-[#566880] mt-0.5">{row.hc_note}</p>}</>
                        : <span className="text-[#3a5068]">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.comp
                        ? <><span className="text-[#566880] font-bold">✔</span>{row.comp_note&&<p className="text-[10px] text-[#566880] mt-0.5">{row.comp_note}</p>}</>
                        : <><span className="text-[#3a5068]">✕</span>{row.comp_note&&<p className="text-[10px] text-[#3a5068] mt-0.5">{row.comp_note}</p>}</>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* THE STORY */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">Why Heavy Haul Professionals Are Switching to Haul Command</h2>
            {[
              {title:'Free tools, no login wall', body:'Every Haul Command tool — permit calculator, axle weight calculator, superload checker, frost law tracker — is fully free and requires no account. Oversize.io gates most functionality behind paid plans.'},
              {title:'Global operator directory', body:'Haul Command indexes operators across 120 countries with real-time availability, trust scores, and verified credentials. Oversize.io has no operator directory.'},
              {title:'Two-sided marketplace', body:'Haul Command connects brokers and operators through a live load board, real-time capacity feed, and instant request system. Oversize.io is a tools-only platform — no marketplace.'},
              {title:'Training and certification', body:'Haul Command’s Training Academy offers 50+ courses across 6 tiers, including the first pan-Australia, pan-Canada, and UK heavy haul certifications. Oversize.io offers none.'},
            ].map((item,i)=>(
              <div key={i} className={`${i<3?'border-b border-[#131c28] pb-4 mb-4':''}`}>
                <p className="text-xs font-bold text-[#22c55e] mb-1">✔ {item.title}</p>
                <p className="text-xs text-[#8a9ab0] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#0f1a24] to-[#0a1929] border border-[#1e3048] rounded-2xl p-8 text-center mb-8">
            <h2 className="text-lg font-bold text-[#f0f2f5] mb-3">Try Haul Command Free — No Credit Card</h2>
            <p className="text-sm text-[#8a9ab0] mb-6">All tools. All public. No login required for core features.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/tools/permit-cost-calculator" className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold px-5 py-2.5 rounded-xl text-sm">Try Permit Calculator →</Link>
              <Link href="/register" className="border border-[#d4950e] text-[#d4950e] hover:bg-[#d4950e20] font-semibold px-5 py-2.5 rounded-xl text-sm">Create Free Account</Link>
            </div>
          </div>

          {/* OTHER COMPARISONS */}
          <div className="flex flex-wrap gap-2">
            <Link href="/vs/ods-north-america" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs ODS North America →</Link>
            <Link href="/vs/wideloadshipping" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs WideLoadShipping →</Link>
            <Link href="/vs/heavyhaulers" className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e]">vs HeavyHaulers →</Link>
          </div>
        </div>
      </div>
    </>
  )
}
