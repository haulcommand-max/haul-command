import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { COUNTRIES } from '@/lib/seo-countries';
import HCFaqModule from '@/components/hc/FaqModule';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';

export const metadata: Metadata = {
  title: 'Heavy Haul Corridor Map — Browse by Country & Region',
  description:
    'Browse the world\'s most complete heavy haul logistics map. Find pilot car operators, escort services, and infrastructure across 57 countries.',
};

export default function MapPage() {
  const tierA = COUNTRIES.filter((c) => c.tier === 'A');
  const tierB = COUNTRIES.filter((c) => c.tier === 'B');
  const tierC = COUNTRIES.filter((c) => c.tier === 'C');
  const tierD = COUNTRIES.filter((c) => c.tier === 'D');

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Map</span>
        </nav>

        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Global <span className="text-accent">Coverage Map</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Explore heavy haul markets, escort services, and corridor intelligence across 57 countries.
            Select a region to browse verified operators, requirements, and infrastructure.
          </p>
        </header>

        {/* Market Tiers */}
        {[
          { label: 'Tier A — Primary Markets', countries: tierA, tone: 'accent' },
          { label: 'Tier B — Expanding Markets', countries: tierB, tone: 'blue' },
          { label: 'Tier C — Emerging Markets', countries: tierC, tone: 'gray' },
          { label: 'Tier D — Future Markets', countries: tierD, tone: 'gray' },
        ].map((tier) => (
          <section key={tier.label} className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              {tier.label}
              <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded font-mono">
                {tier.countries.length} countries
              </span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {tier.countries.map((c) => (
                <Link
                  key={c.code}
                  href={`/directory/${c.slug}`}
                  className="group bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:border-accent/30 hover:bg-accent/[0.03] transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.flag}</span>
                    <span className="text-white text-sm font-semibold group-hover:text-accent transition-colors">
                      {c.name}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {c.regions.slice(0, 3).join(', ')}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* Quick Jump to US States */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">US States — Quick Access</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'Florida', 'Texas', 'California', 'Ohio', 'Pennsylvania', 'Georgia',
              'Illinois', 'Washington', 'Oregon', 'New York', 'Michigan', 'North Carolina',
            ].map((state) => (
              <Link
                key={state}
                href={`/state/${state.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white/[0.04] hover:bg-accent/10 border border-white/[0.06] hover:border-accent/30 text-gray-300 hover:text-accent rounded-full px-4 py-1.5 text-xs font-medium transition-all"
              >
                {state}
              </Link>
            ))}
          </div>
        </section>

        <HCFaqModule
          items={[
            { question: 'What countries does Haul Command cover?', answer: 'Our directory framework covers 57 countries across North America, Europe, Asia-Pacific, Middle East, Latin America, and Africa. Coverage depth varies by market tier.' },
            { question: 'How do I navigate the map?', answer: 'Click on any country to browse its directory of verified operators, escort services, and infrastructure. You can drill down by state/province, metro area, and service type.' },
            { question: 'Can I see escort requirements on the map?', answer: 'Yes — each country and jurisdiction page includes escort requirement summaries with dimension thresholds, permit links, and authority contacts.' },
          ]}
        />

        <div className="mt-8">
          <HCTrustGuardrailsModule />
        </div>
      </main>
    </>
  );
}
