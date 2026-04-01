import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Heavy Haul Resources & Guides | Haul Command',
  description: 'Comprehensive guides for pilot car operators, heavy haul carriers, and oversize load professionals. Height pole requirements, certifications, regulations, and more.',
  alternates: { canonical: 'https://haulcommand.com/resources/' },
};

export interface ResourceGuide {
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: 'requirements' | 'certifications' | 'regulations' | 'operations' | 'business';
  glossaryLinks: string[];
  toolLinks: { label: string; href: string }[];
}

export const RESOURCE_GUIDES: ResourceGuide[] = [
  {
    slug: 'height-pole-requirements',
    title: 'Height Pole Requirements by State',
    description: 'Complete guide to height pole equipment standards, measurement procedures, and state-by-state requirements for overheight load escorts.',
    icon: '📏',
    category: 'requirements',
    glossaryLinks: ['height_pole_operator', 'overheight', 'bridge_strike'],
    toolLinks: [
      { label: 'Escort Calculator', href: '/tools/escort-calculator' },
      { label: 'Route Planner', href: '/tools/route-planner' },
    ],
  },
  {
    slug: 'pilot-car-certifications',
    title: 'Pilot Car Certifications Guide',
    description: 'Every pilot car certification program explained: ESC, WITPAC, state-specific requirements, reciprocity rules, and how to get certified fast.',
    icon: '🎓',
    category: 'certifications',
    glossaryLinks: ['pevo', 'witpac', 'bf3_operator', 'bf4_operator'],
    toolLinks: [
      { label: 'Certification Checker', href: '/tools/certifications' },
      { label: 'Requirements by State', href: '/requirements' },
    ],
  },
  {
    slug: 'state-oversize-load-regulations',
    title: 'State Oversize Load Regulations',
    description: 'Dimensional limits, escort thresholds, travel time restrictions, and permit requirements for all 50 US states plus cross-border Canada/Mexico rules.',
    icon: '📋',
    category: 'regulations',
    glossaryLinks: ['oversize_load', 'single_trip_permit', 'annual_permit', 'superload_permit'],
    toolLinks: [
      { label: 'Permit Checker', href: '/tools/permit-checker' },
      { label: 'Escort Rules', href: '/tools/escort-rules' },
    ],
  },
  {
    slug: 'road-conditions-by-state',
    title: 'Road Conditions & Seasonal Restrictions',
    description: 'Frost law dates, spring weight restrictions, seasonal road closures, and real-time condition resources for heavy haul route planning.',
    icon: '🌨️',
    category: 'operations',
    glossaryLinks: ['deadhead', 'layover', 'pre_trip_meeting'],
    toolLinks: [
      { label: 'Route Planner', href: '/tools/route-planner' },
      { label: 'Curfew Calculator', href: '/tools/curfew-calculator' },
    ],
  },
  {
    slug: 'tire-chain-laws',
    title: 'Tire Chain Laws for Heavy Transport',
    description: 'State-by-state chain requirements, exemptions for oversize loads, chain-up areas, and best practices for winter heavy haul operations.',
    icon: '⛓️',
    category: 'regulations',
    glossaryLinks: ['chain_of_responsibility', 'overweight_load'],
    toolLinks: [
      { label: 'Route Planner', href: '/tools/route-planner' },
    ],
  },
  {
    slug: 'trailer-types',
    title: 'Trailer Types for Heavy Haul & Oversize',
    description: 'Complete reference: lowboys, RGN, stepdeck, multi-axle, perimeter, beam trailers, SPMTs, and when to use each configuration.',
    icon: '🚛',
    category: 'operations',
    glossaryLinks: ['spmt_operator', 'steerman', 'superload'],
    toolLinks: [
      { label: 'Load Analyzer', href: '/tools/load-analyzer' },
      { label: 'Rate Estimator', href: '/tools/rate-estimator' },
    ],
  },
  {
    slug: 'bill-of-lading',
    title: 'Bill of Lading (BOL) for Heavy Haul',
    description: 'How freight documentation works for oversize and overweight loads: BOL fields, liability, insurance requirements, and digital BOL solutions.',
    icon: '📄',
    category: 'business',
    glossaryLinks: ['broker', 'cod', 'efs'],
    toolLinks: [
      { label: 'Broker Verify', href: '/tools/broker-verify' },
    ],
  },
  {
    slug: 'broker-vs-carrier',
    title: 'Broker vs Carrier: How Heavy Haul Works',
    description: 'Understanding the heavy haul supply chain: brokers, carriers, owner-operators, and how money flows from shipper to escort provider.',
    icon: '🤝',
    category: 'business',
    glossaryLinks: ['broker', 'cod', 'efs', 'detention', 'deadhead'],
    toolLinks: [
      { label: 'Rate Advisor', href: '/tools/rate-advisor' },
      { label: 'Find Operators', href: '/directory' },
    ],
  },
  {
    slug: 'cross-border-heavy-haul',
    title: 'Cross-Border Heavy Haul: US-Canada & US-Mexico',
    description: 'Compliance requirements, customs procedures, cabotage rules, and escort handoff protocols for cross-border oversize load moves.',
    icon: '🌎',
    category: 'regulations',
    glossaryLinks: ['superload', 'oversize_load', 'permit_runner'],
    toolLinks: [
      { label: 'Cross-Border Tools', href: '/tools/cross-border' },
      { label: 'Permit Checker', href: '/tools/permit-checker' },
    ],
  },
  {
    slug: 'how-to-start-pilot-car-company',
    title: 'How to Start a Pilot Car Company',
    description: 'Step-by-step business guide: equipment costs, certifications needed, insurance requirements, finding loads, and scaling from solo operator to fleet.',
    icon: '🚀',
    category: 'business',
    glossaryLinks: ['pevo', 'pilot_car', 'deadhead', 'detention', 'cod'],
    toolLinks: [
      { label: 'Claim Your Listing', href: '/claim' },
      { label: 'Rate Estimator', href: '/tools/rate-estimator' },
      { label: 'Certification Checker', href: '/tools/certifications' },
    ],
  },
];

export default function ResourcesPage() {
  const categories = [
    { key: 'requirements', label: 'Requirements', icon: '📏' },
    { key: 'certifications', label: 'Certifications', icon: '🎓' },
    { key: 'regulations', label: 'Regulations', icon: '📋' },
    { key: 'operations', label: 'Operations', icon: '🛣️' },
    { key: 'business', label: 'Business', icon: '💼' },
  ] as const;

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 min-h-screen">
      <nav className="text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span className="mx-2">›</span>
        <span className="text-white">Resources</span>
      </nav>

      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
          Heavy Haul <span className="text-accent">Resource Hub</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-3xl">
          In-depth guides for pilot car operators, heavy haul carriers, and oversize load professionals.
          Every guide links directly to our tools, glossary, and verified operator directory.
        </p>
      </header>

      {/* Category sections */}
      {categories.map(cat => {
        const guides = RESOURCE_GUIDES.filter(g => g.category === cat.key);
        if (guides.length === 0) return null;
        return (
          <section key={cat.key} className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">{cat.icon}</span>
              {cat.label}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map(guide => (
                <Link
                  key={guide.slug}
                  href={`/resources/${guide.slug}`}
                  className="bg-[#111823] border border-white/10 rounded-2xl p-6 hover:border-accent/30 transition-all hover:scale-[1.01] group block"
                >
                  <span className="text-3xl mb-3 block">{guide.icon}</span>
                  <h3 className="text-base font-bold text-white group-hover:text-accent transition-colors mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-3 mb-4">{guide.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {guide.toolLinks.slice(0, 2).map(tool => (
                      <span key={tool.href} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                        {tool.label}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Bottom CTA */}
      <div className="mt-8 text-center bg-gradient-to-br from-accent/5 to-transparent border border-accent/15 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-gray-400 mb-6 max-w-lg mx-auto">
          Join 7,500+ operators and carriers on the Haul Command platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/claim" className="inline-block bg-accent text-black font-black px-8 py-3 rounded-xl hover:bg-yellow-500 transition-colors">
            List Your Business
          </Link>
          <Link href="/glossary" className="inline-block bg-white/10 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/20 transition-colors">
            Browse Glossary
          </Link>
        </div>
      </div>

      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Heavy Haul Resources & Guides',
            description: 'Comprehensive resource hub for the oversize transport and pilot car industry.',
            url: 'https://haulcommand.com/resources/',
            publisher: { '@type': 'Organization', name: 'Haul Command', url: 'https://haulcommand.com' },
            numberOfItems: RESOURCE_GUIDES.length,
          }),
        }}
      />
    </main>
  );
}
