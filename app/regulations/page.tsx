import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Heavy Haul Regulations by Country & State — Global Hub | Haul Command',
  description: 'Oversize load regulations for 120 countries. Find permit requirements, pilot car rules, weight limits, and online filing links for every US state, Australian state, Canadian province, and more.',
  alternates: { canonical: 'https://www.haulcommand.com/regulations' },
}

const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
  ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
]

const CA_PROVINCES = [
  ['ab','Alberta'],['bc','British Columbia'],['mb','Manitoba'],['nb','New Brunswick'],
  ['nl','Newfoundland & Labrador'],['ns','Nova Scotia'],['on','Ontario'],['pe','Prince Edward Island'],
  ['qc','Quebec'],['sk','Saskatchewan'],
]

const AU_STATES = [
  ['nsw','New South Wales'],['vic','Victoria'],['qld','Queensland'],['wa','Western Australia'],
  ['sa','South Australia'],['tas','Tasmania'],['act','Australian Capital Territory'],['nt','Northern Territory'],
]

const OTHER_COUNTRIES = [
  { code:'gb', name:'United Kingdom', flag:'🇬🇧', regions:['England','Scotland','Wales','Northern Ireland'] },
  { code:'nz', name:'New Zealand',    flag:'🇳🇿', regions:['North Island','South Island'] },
  { code:'za', name:'South Africa',   flag:'🇿🇦', regions:['Gauteng','KwaZulu-Natal','Western Cape'] },
  { code:'ae', name:'UAE',            flag:'🇦🇪', regions:['Abu Dhabi','Dubai','Sharjah'] },
  { code:'de', name:'Germany',        flag:'🇩🇪', regions:['Bavaria','NRW','Baden-Württemberg'] },
  { code:'nl', name:'Netherlands',    flag:'🇳🇱', regions:['Noord-Holland','Zuid-Holland'] },
  { code:'br', name:'Brazil',         flag:'🇧🇷', regions:['São Paulo','Rio de Janeiro','Minas Gerais'] },
  { code:'mx', name:'Mexico',         flag:'🇲🇽', regions:['Jalisco','Nuevo León','Veracruz'] },
]

const SEEDED_STATES = new Set(['tx','ca','fl','oh','wa','az','la','pa'])

const schema = {
  '@context':'https://schema.org','@type':'WebPage',
  name:'Heavy Haul Regulations — Global Hub | Haul Command',
  description:'Oversize load regulations for 120 countries. Permit requirements, pilot car rules, weight limits for every US state, Canadian province, Australian state, and more.',
  url:'https://www.haulcommand.com/regulations',
}

const breadcrumb = { '@context':'https://schema.org','@type':'BreadcrumbList', itemListElement:[
  {"@type":'ListItem',position:1,name:'Home',item:'https://www.haulcommand.com'},
  {"@type":'ListItem',position:2,name:'Regulations',item:'https://www.haulcommand.com/regulations'},
]}

export default function RegulationsHubPage() {
  return (
    <>
      <JsonLd data={schema}/>
      <JsonLd data={breadcrumb}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">
        <div className="border-b border-[#131c28] bg-gradient-to-r from-[#0a1929] to-[#07090d]">
          <div className="px-4 lg:px-10 py-12 max-w-5xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#d4950e] font-semibold mb-3">GLOBAL REGULATIONS HUB</p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-[#f0f2f5] mb-4">Oversize Load Regulations by Country</h1>
            <p className="text-sm text-[#8a9ab0] max-w-2xl">Permit requirements, pilot car rules, width/height limits, and online filing links for every US state, Canadian province, Australian state, and 90+ countries. Updated quarterly.</p>
          </div>
        </div>

        <div className="px-4 lg:px-10 py-10 max-w-5xl mx-auto">

          {/* QUICK TOOLS */}
          <div className="flex flex-wrap gap-3 mb-10">
            <p className="w-full text-xs text-[#566880] font-semibold tracking-wider">RELATED TOOLS</p>
            {[
              ['/tools/permit-cost-calculator','Permit Cost Calculator'],
              ['/tools/axle-weight-calculator','Axle Weight Calculator'],
              ['/tools/superload-calculator','Superload Calculator'],
              ['/tools/frost-law-tracker','Frost Law Tracker'],
              ['/tools/load-dimension-checker','Is My Load Oversize?'],
            ].map(([href,label])=>(
              <Link key={href} href={href} className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8ab0d0] px-3 py-2 rounded-lg hover:border-[#d4950e] hover:text-[#d4950e] transition-colors">{label} →</Link>
            ))}
          </div>

          {/* US STATES */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🇺🇸</span>
              <h2 className="text-base font-bold text-[#f0f2f5]">United States — All 50 States</h2>
              <span className="text-[10px] text-[#22c55e] bg-[#0d2000] px-2 py-0.5 rounded">{SEEDED_STATES.size} verified</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {US_STATES.map(([code, name])=>{
                const slug = code.toLowerCase()
                const isSeeded = SEEDED_STATES.has(slug)
                return (
                  <Link key={code} href={`/regulations/us/${slug}`}
                    className={`px-3 py-2.5 rounded-xl border text-xs transition-colors ${
                      isSeeded
                        ? 'border-[#1e3048] bg-[#0f1a24] text-[#d0dce8] hover:border-[#d4950e]'
                        : 'border-dashed border-[#1a2535] bg-[#0a0f18] text-[#3a5068] hover:border-[#1e3048] hover:text-[#566880]'
                    }`}>
                    <span className="font-bold">{code}</span>
                    <span className="block text-[9px] mt-0.5 truncate">{name}</span>
                    {!isSeeded && <span className="block text-[8px] text-[#2a3a50] mt-0.5">coming soon</span>}
                  </Link>
                )
              })}
            </div>
          </section>

          {/* CANADA */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🇨🇦</span>
              <h2 className="text-base font-bold text-[#f0f2f5]">Canada — All Provinces &amp; Territories</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {CA_PROVINCES.map(([code,name])=>(
                <Link key={code} href={`/regulations/ca/${code}`}
                  className="px-3 py-2.5 rounded-xl border border-dashed border-[#1a2535] bg-[#0a0f18] text-[#3a5068] hover:border-[#1e3048] hover:text-[#566880] text-xs transition-colors">
                  <span className="font-bold">{code.toUpperCase()}</span>
                  <span className="block text-[9px] mt-0.5 truncate">{name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* AUSTRALIA */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🇦🇺</span>
              <h2 className="text-base font-bold text-[#f0f2f5]">Australia — All States &amp; Territories</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {AU_STATES.map(([code,name])=>(
                <Link key={code} href={`/regulations/au/${code}`}
                  className="px-3 py-2.5 rounded-xl border border-dashed border-[#1a2535] bg-[#0a0f18] text-[#3a5068] hover:border-[#1e3048] hover:text-[#566880] text-xs transition-colors">
                  <span className="font-bold">{code.toUpperCase()}</span>
                  <span className="block text-[9px] mt-0.5 truncate">{name}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* OTHER COUNTRIES */}
          <section className="mb-10">
            <h2 className="text-base font-bold text-[#f0f2f5] mb-4">More Countries</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {OTHER_COUNTRIES.map(c=>(
                <Link key={c.code} href={`/regulations/${c.code}`}
                  className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 hover:border-[#d4950e] transition-colors">
                  <span className="text-xl">{c.flag}</span>
                  <p className="text-xs font-bold text-[#d0dce8] mt-2">{c.name}</p>
                  <p className="text-[10px] text-[#566880] mt-1">{c.regions.join(' · ')}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* EXPAND CTA */}
          <div className="bg-[#0f1a24] border border-dashed border-[#1e3048] rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-[#d0dce8] mb-2">Missing your country or state?</p>
            <p className="text-xs text-[#566880] mb-4">We’re adding verified regulations for 120 countries. Request priority coverage for your region.</p>
            <a href="mailto:regs@haulcommand.com" className="text-xs text-[#d4950e] border border-[#d4950e40] px-4 py-2 rounded-lg hover:bg-[#2a1f08] transition-colors">Request a Region →</a>
          </div>
        </div>
      </div>
    </>
  )
}
