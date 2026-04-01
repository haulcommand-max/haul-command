import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getGlossaryTerms, getGlossaryCategories } from '@/lib/glossary-unified';
import { COUNTRIES } from '@/lib/seo-countries';
import { COUNTRY_SLUG_MAP } from '@/lib/glossary-slugs';
import GlossaryMobileNav from '@/components/hc/GlossaryMobileNav';

export const revalidate = 86400; // 1 day ISR

export const metadata: Metadata = {
  title: 'Heavy Haul Glossary, Definitions, Terms & Rules | Haul Command',
  description: 'The definitive heavy haul and oversize load glossary. 3,000+ industry terms defined across 120 countries. Pilot car, escort vehicle, superload, and more.',
  openGraph: {
    title: 'Heavy Haul Glossary, Definitions, Terms & Rules | Haul Command',
    description: 'The definitive heavy haul and oversize load glossary. 3,000+ industry terms defined across 120 countries.',
    url: 'https://haulcommand.com/glossary/',
  },
  alternates: { canonical: 'https://haulcommand.com/glossary/' },
};

export default async function GlossaryPage() {
  const terms = await getGlossaryTerms();
  const categories = await getGlossaryCategories();

  // Group terms alphabetically
  const grouped = terms.reduce((acc, term) => {
    const letter = (term.term[0] || '#').toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(term);
    return acc;
  }, {} as Record<string, typeof terms>);

  const letters = Object.keys(grouped).sort();

  // Flagship topic hubs for prominent display
  const flagshipHubs = [
    { slug: 'pilot-car', label: 'Pilot Car Terms', icon: '🚗' },
    { slug: 'escort-vehicle', label: 'Escort Vehicle Terms', icon: '🚐' },
    { slug: 'pevo', label: 'PEVO Lingo', icon: '🎓' },
    { slug: 'oversize-load', label: 'Oversize Load Terms', icon: '📦' },
    { slug: 'superload', label: 'Superload Terms', icon: '⚡' },
    { slug: 'height-pole', label: 'Height Pole Terms', icon: '📏' },
    { slug: 'route-survey', label: 'Route Survey Terms', icon: '🗺️' },
    { slug: 'bridge-formula', label: 'Bridge & Weight Terms', icon: '🌉' },
    { slug: 'wide-load', label: 'Wide Load Terms', icon: '🔶' },
    { slug: 'deadhead', label: 'Operations Lingo', icon: '🛣️' },
    { slug: 'curfew', label: 'Travel Restriction Terms', icon: '⏰' },
    { slug: 'overweight-load', label: 'Overweight Load Terms', icon: '⚖️' },
  ];

  // Tier A countries for country nav
  const tierACountries = COUNTRIES.filter(c => c.tier === 'A');

  // Pass letter→count mapping for the mobile nav to disable empty letters
  const letterCounts: Record<string, number> = {};
  letters.forEach(l => { letterCounts[l] = grouped[l]?.length ?? 0; });

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12 min-h-screen pb-24 md:pb-12">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Heavy Haul Glossary</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">
            Heavy Haul <span className="text-accent">Glossary</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-3xl">
            {terms.length.toLocaleString()}+ industry terms defined across 120 countries.
            The most comprehensive heavy haul, oversize load, and escort terminology reference.
          </p>
        </header>

        {/* ═══ SEARCH-FIRST: Prominent search bar ═══ */}
        <GlossaryMobileNav letters={letters} letterCounts={letterCounts} totalTerms={terms.length} />

        {/* ═══ TOPIC HUB CARDS ═══ */}
        <section className="mb-10">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-gray-400">Browse by Topic</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {flagshipHubs.map(hub => (
              <Link
                key={hub.slug}
                href={`/glossary/${hub.slug}/`}
                className="bg-[#111823] border border-white/10 rounded-xl p-4 hover:border-accent/30 transition-all active:scale-[0.98] group"
              >
                <span className="text-xl mb-1.5 block">{hub.icon}</span>
                <span className="font-semibold text-white group-hover:text-accent transition-colors text-xs sm:text-sm leading-tight">
                  {hub.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ COUNTRY QUICK NAV ═══ */}
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Browse by Country</h2>
          <div className="flex flex-wrap gap-2">
            {tierACountries.map(c => (
              <Link
                key={c.code}
                href={`/glossary/pilot-car/${COUNTRY_SLUG_MAP[c.slug]}/`}
                className="px-3 py-1.5 bg-[#111823] border border-white/10 rounded-lg hover:border-accent/30 text-xs text-slate-300 hover:text-white transition-colors active:scale-[0.97]"
              >
                {c.flag} {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ TERMS BY LETTER ═══ */}
        <div className="space-y-10">
          {letters.map((letter) => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-40 sm:scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl sm:text-3xl font-black text-accent">{letter}</h2>
                <div className="h-px flex-grow bg-white/5" />
                <span className="text-[10px] text-gray-600 font-bold tabular-nums">{grouped[letter].length} terms</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {grouped[letter].map((item) => (
                  <Link
                    key={item.slug}
                    href={`/glossary/${item.slug}/`}
                    data-glossary-card
                    className="bg-[#111823]/50 border border-white/5 rounded-xl p-4 hover:border-accent/20 active:scale-[0.98] transition-all group"
                  >
                    <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors mb-1">{item.term}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.shortDefinition}</p>
                    {/* Future 10X layer hooks */}
                    {item.synonyms?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.synonyms.slice(0, 3).map(s => (
                          <span key={s} className="text-[9px] text-gray-600 bg-white/[0.03] px-1.5 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ═══ CTA ═══ */}
        <div className="mt-12 text-center bg-[#111823] border border-white/10 rounded-2xl p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Need Heavy Haul Services?</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/directory" className="inline-block bg-accent text-black font-black px-6 py-3 rounded-xl hover:bg-yellow-500 transition-colors text-sm">
              Find Verified Operators
            </Link>
            <Link href="/tools" className="inline-block bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors text-sm">
              Free Industry Tools
            </Link>
          </div>
        </div>

        {/* Schema markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'DefinedTermSet',
              name: 'Heavy Haul & Oversize Load Glossary',
              description: `${terms.length}+ industry terms for heavy haul transport, pilot car operations, and oversize load escort services across 120 countries.`,
              url: 'https://haulcommand.com/glossary/',
              publisher: {
                '@type': 'Organization',
                name: 'Haul Command',
                url: 'https://haulcommand.com',
              },
              numberOfItems: terms.length,
            }),
          }}
        />
      </main>
    </>
  );
}
