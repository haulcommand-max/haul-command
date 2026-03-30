import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getGlossaryTerms, getGlossaryCategories } from '@/lib/glossary-unified';
import { COUNTRIES } from '@/lib/seo-countries';
import { COUNTRY_SLUG_MAP } from '@/lib/glossary-slugs';

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

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-12 min-h-screen">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Heavy Haul Glossary</span>
        </nav>

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            Heavy Haul <span className="text-accent">Glossary</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl">
            {terms.length.toLocaleString()}+ industry terms defined across 120 countries.
            The most comprehensive heavy haul, oversize load, and escort terminology reference.
          </p>
        </header>

        {/* Topic Hub Cards */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">Browse by Topic</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {flagshipHubs.map(hub => (
              <Link
                key={hub.slug}
                href={`/glossary/${hub.slug}/`}
                className="bg-[#111823] border border-white/10 rounded-xl p-5 hover:border-accent/30 transition-all hover:scale-[1.02] group"
              >
                <span className="text-2xl mb-2 block">{hub.icon}</span>
                <span className="font-semibold text-white group-hover:text-accent transition-colors text-sm">
                  {hub.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Country Quick Nav */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-white mb-6">Browse by Country</h2>
          <div className="flex flex-wrap gap-3">
            {tierACountries.map(c => (
              <Link
                key={c.code}
                href={`/glossary/pilot-car/${COUNTRY_SLUG_MAP[c.slug]}/`}
                className="px-4 py-2 bg-[#111823] border border-white/10 rounded-lg hover:border-accent/30 text-sm text-slate-300 hover:text-white transition-colors"
              >
                {c.flag} {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Letter Quick Nav */}
        <div className="flex flex-wrap gap-2 mb-10 sticky top-16 bg-[#0B0F14]/95 backdrop-blur-md py-3 z-10">
          {letters.map((letter) => (
            <a key={letter} href={`#letter-${letter}`} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-accent hover:bg-accent/10 transition-colors">
              {letter}
            </a>
          ))}
        </div>

        {/* Terms by Letter */}
        <div className="space-y-12">
          {letters.map((letter) => (
            <section key={letter} id={`letter-${letter}`}>
              <h2 className="text-3xl font-black text-accent mb-6 border-b border-white/5 pb-2">{letter}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[letter].map((item) => (
                  <Link
                    key={item.slug}
                    href={`/glossary/${item.slug}/`}
                    className="bg-[#111823]/50 border border-white/5 rounded-xl p-4 hover:border-accent/20 transition-colors group"
                  >
                    <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors mb-1">{item.term}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{item.shortDefinition}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-[#111823] border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Need Heavy Haul Services?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/directory" className="inline-block bg-accent text-black font-black px-6 py-3 rounded-xl hover:bg-yellow-500 transition-colors">
              Find Verified Operators
            </Link>
            <Link href="/tools" className="inline-block bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
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
