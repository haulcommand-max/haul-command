import { Metadata } from 'next'
import { JsonLd } from '@/components/seo/JsonLd'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Advertise on Haul Command — Reach 1.5M Heavy Haul Operators | AdGrid',
  description: 'Self-serve advertising for the heavy haul industry. Target by country, corridor, state, service type, and operator role. Reach pilot car operators, brokers, carriers, and shippers.',
  alternates: { canonical: 'https://www.haulcommand.com/advertise' },
}

const ZONES = [
  { name:'Country Takeover',      price:'$499/wk',  desc:'Full-width sponsor on every page in a country. Max 1 per country.',            icon:'🌐', color:'#d4950e' },
  { name:'State / Region Banner',  price:'$149/wk',  desc:'Top banner on all state directory and city pages.',                           icon:'📍', color:'#8b5cf6' },
  { name:'Corridor Sponsor',       price:'$99/wk',   desc:'Exclusive sponsor on corridor pages for your key routes.',                    icon:'🛣️',  color:'#3b82f6' },
  { name:'Live Feed Banner',       price:'$199/wk',  desc:'Top-slot on the /available-now real-time operator feed. Broker-heavy traffic.', icon:'📹', color:'#22c55e' },
  { name:'Training Page Sponsor',  price:'$149/wk',  desc:'Sponsor banner on the HC Training Academy — directly above certification tiers.', icon:'🎫', color:'#f59e0b' },
  { name:'Tool Page Sponsor',      price:'$99/wk',   desc:'Sponsor on permit, axle weight, frost law, and route planner tools.',        icon:'🛠️',  color:'#22c55e' },
  { name:'Directory Search Top',   price:'$249/wk',  desc:'Featured placement above organic results in global directory search.',       icon:'🔍',  color:'#3b82f6' },
  { name:'Glossary / Regs Sponsor',price:'$79/wk',   desc:'Authority pages. Insurer, law firm, or compliance tool placement.',          icon:'📚',  color:'#8b5cf6' },
]

const VERTICALS = [
  'Insurance Companies', 'Equipment Manufacturers', 'Fuel Card Programs',
  'Permit Software', 'Training Providers', 'Factoring Companies',
  'Trucking Schools', 'Legal Services', 'Fleet Technology', 'Safety Equipment',
]

const schema = {
  '@context':'https://schema.org','@type':'WebPage',
  name:'Advertise on Haul Command — AdGrid Platform',
  description:'Self-serve ad platform targeting heavy haul operators, brokers, and carriers across 120 countries.',
  url:'https://www.haulcommand.com/advertise',
}

const faqSchema = {
  '@context':'https://schema.org','@type':'FAQPage',
  mainEntity:[
    { '@type':'Question', name:'Who sees Haul Command ads?', acceptedAnswer:{ '@type':'Answer', text:'Pilot car operators, escort vehicle operators, heavy haul brokers, carriers, shippers, and dispatchers. Verified professional audience across 120 countries.' } },
    { '@type':'Question', name:'Can I target by state or corridor?', acceptedAnswer:{ '@type':'Answer', text:'Yes. Ads can be targeted by country, state/province, city, corridor, service type, and operator role.' } },
    { '@type':'Question', name:'How quickly do ads go live?', acceptedAnswer:{ '@type':'Answer', text:'Ads go live within 2 hours of approval. Campaign approval normally takes under 2 hours.' } },
  ],
}

export default function AdvertisePage() {
  return (
    <>
      <JsonLd data={schema}/>
      <JsonLd data={faqSchema}/>
      <div className="min-h-screen bg-[#07090d] text-[#f0f2f5]">

        {/* HERO */}
        <div className="relative overflow-hidden border-b border-[#131c28]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1200] via-[#07090d] to-[#07090d]"/>
          <div className="relative px-4 lg:px-10 py-16 max-w-5xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-[#d4950e] font-semibold mb-4">HC ADGRID · HEAVY HAUL ADVERTISING</p>
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-[#f0f2f5] mb-5 max-w-3xl leading-tight">
              Reach the People Who Move Heavy&nbsp;Loads
            </h1>
            <p className="text-sm lg:text-base text-[#8a9ab0] mb-8 max-w-2xl leading-relaxed">
              The only self-serve ad platform targeting pilot car operators, carriers, brokers, and shippers across 120 countries. Premium native placement. No minimum spend.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/advertise/book" className="bg-[#d4950e] hover:bg-[#c4850e] text-black font-bold px-6 py-3 rounded-xl text-sm transition-colors">
                Book a Campaign →
              </Link>
              <a href="mailto:ads@haulcommand.com" className="border border-[#d4950e40] text-[#d4950e] hover:bg-[#d4950e20] font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
                Talk to Sales
              </a>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-10 py-12 max-w-5xl mx-auto">

          {/* REACH STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { stat:'120', label:'Countries Covered' },
              { stat:'1.5M', label:'Operator Target' },
              { stat:'50K+', label:'Hyperlocal Pages' },
              { stat:'100%', label:'Industry Verified' },
            ].map(s=>(
              <div key={s.stat} className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-5 text-center">
                <p className="text-2xl font-black text-[#d4950e]">{s.stat}</p>
                <p className="text-[10px] text-[#566880] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* AD ZONES */}
          <div className="mb-12">
            <h2 className="text-base font-bold text-[#f0f2f5] mb-6">Advertising Zones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ZONES.map((z,i)=>(
                <div key={i} className="bg-[#0f1a24] border border-[#1e3048] rounded-xl p-4 flex items-start gap-4 hover:border-[#d4950e40] transition-colors">
                  <span className="text-xl shrink-0">{z.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-[#d0dce8]">{z.name}</p>
                      <span className="text-xs font-bold shrink-0" style={{color:z.color}}>{z.price}</span>
                    </div>
                    <p className="text-xs text-[#566880] leading-relaxed">{z.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TARGETING */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-12">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">Precision Targeting</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label:'Country', icon:'🌐', desc:'Target any of 120 countries' },
                { label:'State / Province', icon:'📍', desc:'All ~2,400 state/province zones' },
                { label:'Corridor', icon:'🛣️', desc:'Origin-to-destination route pairs' },
                { label:'Service Type', icon:'🚛', desc:'Pilot car, escort, high pole, survey' },
                { label:'Operator Role', icon:'🧑‍🔧', desc:'Operator, broker, carrier, dispatcher' },
                { label:'Intent Moment', icon:'⚡', desc:'Tool pages, permit calc, load board' },
              ].map(t=>(
                <div key={t.label} className="p-3 border border-[#131c28] rounded-xl">
                  <span className="text-lg">{t.icon}</span>
                  <p className="text-xs font-semibold text-[#d0dce8] mt-2">{t.label}</p>
                  <p className="text-[10px] text-[#566880]">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* WHO ADVERTISES */}
          <div className="mb-12">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-4">Perfect For</h2>
            <div className="flex flex-wrap gap-2">
              {VERTICALS.map(v=>(
                <span key={v} className="text-xs bg-[#0f1a24] border border-[#1e3048] text-[#8a9ab0] px-3 py-1.5 rounded-lg">{v}</span>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6 mb-10">
            <h2 className="text-sm font-bold text-[#f0f2f5] mb-5">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {[
                { q:'Who sees Haul Command ads?', a:'Pilot car operators, escort vehicle operators, heavy haul brokers, carriers, shippers, and dispatchers — a verified professional audience across 120 countries.' },
                { q:'How are ads displayed?', a:'Native placements that match the site’s premium industrial design. No pop-ups, no intrusive formats — ads appear in designated AdGrid zones on relevant pages.' },
                { q:'Can I target by state or corridor?', a:'Yes. Campaigns can be targeted by country, state/province, city, corridor, service type, and operator role. Contextual and intent-aware.' },
                { q:'How quickly do ads go live?', a:'Campaigns go live within 2 hours of approval. Creative review normally completes within 2 hours of submission.' },
                { q:'What if I don’t have creative?', a:'We generate premium ad creative for any campaign. Tell us your goal and we produce compliant, effective creative at no extra cost.' },
              ].map((item,i)=>(
                <details key={i} className="border border-[#131c28] rounded-xl p-4">
                  <summary className="text-sm font-semibold text-[#d0dce8] cursor-pointer list-none flex justify-between">{item.q}<span className="text-[#566880] ml-3">+</span></summary>
                  <p className="text-sm text-[#8a9ab0] mt-3 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="border border-[#d4950e40] bg-[#1a1200] rounded-2xl p-8 text-center">
            <p className="text-[11px] tracking-[0.15em] text-[#d4950e] font-semibold mb-3">READY TO REACH THE INDUSTRY?</p>
            <h2 className="text-xl font-bold text-[#f0f2f5] mb-3">Book your first campaign in minutes</h2>
            <p className="text-sm text-[#8a9ab0] mb-6 max-w-md mx-auto">Self-serve. No minimum spend. Live within 2 hours.</p>
            <Link href="/advertise/book" className="bg-[#d4950e] hover:bg-[#c4850e] text-black font-bold px-8 py-3 rounded-xl text-sm transition-colors inline-block">
              Book Campaign →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
