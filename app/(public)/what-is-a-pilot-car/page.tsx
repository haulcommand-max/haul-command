import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'What Is a Pilot Car? Complete Guide | Haul Command',
  description: 'A pilot car (escort vehicle) guides oversize loads safely on public roads. Learn what pilot cars do, when they are required, certifications needed, and how much they earn.',
  alternates: { canonical: 'https://www.haulcommand.com/what-is-a-pilot-car' },
};

export default function WhatIsAPilotCarPage() {
  const faqs = [
    { q: 'What is a pilot car?', a: 'A pilot car (also called an escort vehicle or PEVO — Pilot Escort Vehicle Operator) is a vehicle that travels ahead of, alongside, or behind an oversize load on public roads. The pilot car alerts other drivers, clears the route, and communicates with the oversize load driver to ensure safe passage.' },
    { q: 'When is a pilot car required?', a: 'Requirements vary by state, province, and country. In the US, most states require a pilot car when a load exceeds 14 feet wide, 14.5 feet tall, or 100 feet long. Some states add weight thresholds. Always check state-specific requirements before moving an oversize load.' },
    { q: 'What certification does a pilot car operator need?', a: 'Requirements vary by state. Some states require no certification; others require a Pilot Car Certification (like PCSA or state-specific licenses), a valid CDL endorsement, or completion of a state-approved training program. Haul Command Certification is recognized across 120 countries.' },
    { q: 'How much does a pilot car cost?', a: 'US pilot car rates typically range from $300–$700 per day for a lead or chase car, depending on state, route complexity, and certifications required. Height poles add $450–$850/day. Route surveys add $500–$1,200/day. Night moves carry a 20–50% premium.' },
    { q: 'How much do pilot car operators earn?', a: 'Experienced pilot car operators in high-demand markets earn $60,000–$120,000+ annually. Earnings depend on certification level, specialty services offered, geographic coverage, and whether you work independently or through a broker network.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Dark hero */}
      <div className="bg-[#0B0F14] text-white py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-1.5 text-xs text-[#F1A91B] font-bold uppercase tracking-widest mb-4">
            <span>Glossary</span>
            <span>›</span>
            <span>Pilot Car</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">What Is a Pilot Car?</h1>
          <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
            A complete guide to pilot cars, escort vehicles, PEVO certification, requirements by state, and earnings — across 120 countries.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Quick answer */}
        <div className="bg-[#F1A91B]/5 border border-[#F1A91B]/20 rounded-2xl p-6 mb-10">
          <h2 className="font-black text-gray-900 text-xl mb-3">Quick Answer</h2>
          <p className="text-gray-700 leading-relaxed">
            A <strong>pilot car</strong> (also called an escort vehicle or PEVO) is a vehicle that accompanies an oversize or overweight load on public roads. Pilot cars warn other drivers, verify route clearances, and communicate with the load driver to ensure safe passage. They are legally required when loads exceed certain dimension or weight thresholds — which vary by jurisdiction.
          </p>
        </div>

        {/* Key roles */}
        <h2 className="text-2xl font-black text-gray-900 mb-6">Types of Pilot Car / Escort Support</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            { icon: '🚗', title: 'Lead Car', desc: 'Travels ahead of the load, warns oncoming traffic and clears intersections.' },
            { icon: '🚙', title: 'Chase Car', desc: 'Follows behind the load, protects the rear and alerts following traffic.' },
            { icon: '📏', title: 'Height Pole Car', desc: 'Carries a pole matching load height to test bridge and utility clearances.' },
            { icon: '🗺️', title: 'Route Survey', desc: 'Pre-move inspection of the route to identify obstacles and measure clearances.' },
            { icon: '🔧', title: 'Bucket Truck', desc: 'Lifts power lines and cables to allow overheight loads to pass underneath.' },
            { icon: '🚔', title: 'Police Escort', desc: 'Required by some states for extreme loads or specific route segments.' },
          ].map(t => (
            <div key={t.title} className="flex gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-2xl shrink-0">{t.icon}</span>
              <div>
                <div className="font-bold text-gray-900 text-sm">{t.title}</div>
                <div className="text-xs text-gray-600 mt-1 leading-relaxed">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ with schema */}
        <h2 className="text-2xl font-black text-gray-900 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4 mb-10">
          {faqs.map(faq => (
            <div key={faq.q} className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-black text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Internal links — no dead ends */}
        <div className="bg-[#0B0F14] text-white rounded-2xl p-8">
          <h3 className="font-black text-lg mb-2">Find Verified Pilot Cars Now</h3>
          <p className="text-gray-400 text-sm mb-6">7,711+ operators in 120 countries. Check rates, verify certifications, and find available escorts near your route.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/directory" className="px-4 py-2 bg-[#F1A91B] text-black font-bold rounded-lg text-sm">Find Escorts →</Link>
            <Link href="/rates" className="px-4 py-2 bg-white/10 border border-white/20 text-white font-semibold rounded-lg text-sm">Rate Index</Link>
            <Link href="/escort-requirements" className="px-4 py-2 bg-white/10 border border-white/20 text-white font-semibold rounded-lg text-sm">Requirements by State</Link>
            <Link href="/training" className="px-4 py-2 bg-white/10 border border-white/20 text-white font-semibold rounded-lg text-sm">Get Certified</Link>
            <Link href="/glossary" className="px-4 py-2 bg-white/10 border border-white/20 text-white font-semibold rounded-lg text-sm">Glossary</Link>
          </div>
        </div>

        {/* FAQ JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a }
          }))
        })}} />
      </div>
    </div>
  );
}
