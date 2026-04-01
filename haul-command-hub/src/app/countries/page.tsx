import { Metadata } from 'next';
import Link from 'next/link';
import {
    COUNTRIES,
    getCountriesByTier,
} from '@/lib/seo-countries';
import BreadcrumbSchema, { OrganizationSchema } from '@/components/BreadcrumbSchema';
import Navbar from '@/components/Navbar';

const BASE_URL = 'https://haulcommand.com';

export const metadata: Metadata = {
    title: 'Pilot Car & Escort Vehicle Directory — 120 Countries | Haul Command',
    description: 'The world\'s largest directory of pilot car, escort vehicle, and oversize load transport professionals. Search verified operators across 120 countries organized by market maturity — Gold, Blue, Silver, Slate, and Copper tiers.',
    keywords: [
        'pilot car directory',
        'escort vehicle worldwide',
        'oversize load escort countries',
        'heavy haul escort international',
        'pilot car service global',
        'BF3 Begleitfahrzeug',
        'abnormal load escort',
        'escort vehicle directory',
    ],
    openGraph: {
        title: 'Pilot Car & Escort Vehicle Directory — 120 Countries | Haul Command',
        description: 'Find verified oversize load transport professionals across 120 countries worldwide. Browse by market tier, local terminology, and region.',
        url: `${BASE_URL}/countries`,
        siteName: 'Haul Command',
        type: 'website',
    },
    alternates: {
        canonical: `${BASE_URL}/countries`,
    },
};

const TIER_CONFIG = {
    A: { label: 'Tier A – Gold', description: 'Highest marketplace activity and operator density. Full directory coverage with verified listings, rate intelligence, and regulatory tools.', color: 'from-amber-500/20 to-yellow-500/10', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300', dot: 'bg-amber-400' },
    B: { label: 'Tier B – Blue', description: 'Strong demand with growing operator networks. Active verification with expanding coverage and tools.', color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300', dot: 'bg-blue-400' },
    C: { label: 'Tier C – Silver', description: 'Emerging markets with expansion potential. Infrastructure mapping underway with foundational coverage.', color: 'from-slate-400/20 to-gray-500/10', border: 'border-slate-400/30', badge: 'bg-slate-400/20 text-slate-300', dot: 'bg-slate-400' },
    D: { label: 'Tier D – Slate', description: 'Early-stage markets with foundational coverage. Logistics corridors identified and operator sourcing in progress.', color: 'from-slate-600/20 to-gray-700/10', border: 'border-slate-600/30', badge: 'bg-slate-600/20 text-slate-400', dot: 'bg-slate-600' },
    E: { label: 'Tier E – Copper', description: 'Developing corridors and future expansion targets. Market intelligence being collected for future coverage.', color: 'from-orange-800/20 to-stone-700/10', border: 'border-orange-800/30', badge: 'bg-orange-800/20 text-orange-400', dot: 'bg-orange-700' },
} as const;

const TIERS = ['A', 'B', 'C', 'D', 'E'] as const;

export default function CountriesPage() {
    const tierCounts = TIERS.map(t => ({ tier: t, count: getCountriesByTier(t).length }));
    const totalCountries = COUNTRIES.length;

    // FAQ schema
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'How many countries does Haul Command cover?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `Haul Command covers ${totalCountries} countries across five market tiers: ${tierCounts.map(t => `${t.count} ${TIER_CONFIG[t.tier].label.split('–')[1]?.trim()}`).join(', ')}. Each country uses localized terminology for pilot car and escort services.`,
                },
            },
            {
                '@type': 'Question',
                name: 'What do market tiers mean on Haul Command?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Market tiers indicate the maturity and coverage depth of each country on the platform. Gold (Tier A) markets have the most verified operators and complete tooling. Copper (Tier E) markets are currently being mapped for future expansion.',
                },
            },
            {
                '@type': 'Question',
                name: 'What is the local term for pilot car in different countries?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Terminology varies by country: "Pilot Car" (US, Canada, Australia), "Escort Vehicle" (UK, New Zealand), "BF3-Begleitfahrzeug" (Germany, Austria), "Convoi Exceptionnel" escort (France), "Vehículo Piloto" (Latin America), "รถนำ" (Thailand). Haul Command indexes all local terms.',
                },
            },
        ],
    };

    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Haul Command', url: BASE_URL },
                    { name: 'Countries', url: `${BASE_URL}/countries` },
                ]}
            />
            <OrganizationSchema />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <Navbar />

            <main className="min-h-screen bg-[#0a0e17]">
                {/* ─── Hero ─── */}
                <section className="relative pt-24 pb-16 bg-gradient-to-b from-blue-600/10 to-transparent">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]" />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                            🌍 {totalCountries} Countries. One Platform.
                        </h1>

                        {/* ─── Answer-First Block ─── */}
                        <div className="text-lg text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
                            <p>
                                Haul Command is the world&apos;s largest directory of pilot car, escort vehicle, and oversize load
                                transport professionals. Browse all {totalCountries} supported countries organized by market maturity.
                            </p>
                        </div>

                        {/* ─── Tier Breakdown (dynamic — always correct) ─── */}
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-slate-400">
                            {tierCounts.map(({ tier, count }) => {
                                const config = TIER_CONFIG[tier];
                                return (
                                    <span key={tier} className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                                        {count} {config.label.split('–')[1]?.trim()}
                                    </span>
                                );
                            })}
                        </div>

                        {/* ─── Quick Actions ─── */}
                        <div className="flex flex-wrap justify-center gap-3 mt-8">
                            <Link
                                href="/directory"
                                className="px-5 py-2.5 bg-accent text-black font-bold text-sm rounded-xl hover:bg-yellow-400 transition-colors"
                            >
                                Browse Full Directory
                            </Link>
                            <Link
                                href="/claim"
                                className="px-5 py-2.5 bg-white/5 border border-white/10 text-sm text-gray-300 rounded-xl hover:text-white hover:border-white/20 transition-all"
                            >
                                Claim Your Profile
                            </Link>
                            <Link
                                href="/glossary"
                                className="px-5 py-2.5 bg-white/5 border border-white/10 text-sm text-gray-300 rounded-xl hover:text-white hover:border-white/20 transition-all"
                            >
                                📖 Glossary of Terms
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ─── Local Terminology Callout ─── */}
                <section className="border-t border-white/5 bg-white/[0.01]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                        <h2 className="text-sm font-bold text-accent uppercase tracking-widest mb-4">
                            Local Terminology Worldwide
                        </h2>
                        <p className="text-sm text-slate-400 max-w-3xl mb-4">
                            Oversize load escort services are called different names around the world. Haul Command indexes all local terms
                            so you can search in your language. Each links to its glossary definition with legal requirements and translations.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <Link href="/glossary/us/pilot-car" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">🇺🇸 Pilot Car</Link>
                            <Link href="/glossary/gb/escort-vehicle" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">🇬🇧 Escort Vehicle</Link>
                            <Link href="/glossary/de/begleitfahrzeug" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">🇩🇪 BF3-Begleitfahrzeug</Link>
                            <Link href="/glossary/fr/convoi-exceptionnel" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">🇫🇷 Convoi Exceptionnel</Link>
                            <Link href="/glossary/au/pilot-vehicle" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">🇦🇺 Pilot Vehicle</Link>
                            <Link href="/glossary/za/abnormal-load-escort" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">🇿🇦 Abnormal Load Escort</Link>
                            <Link href="/glossary/nl/begeleidingsvoertuig" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-accent hover:border-accent/30 transition-all">🇳🇱 Begeleidingsvoertuig</Link>
                            <Link href="/glossary" className="px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg text-accent hover:bg-accent/20 transition-all font-medium">View all terms →</Link>
                        </div>
                    </div>
                </section>

                {/* ─── Tier Sections ─── */}
                {TIERS.map((tier) => {
                    const config = TIER_CONFIG[tier];
                    const countries = getCountriesByTier(tier);

                    return (
                        <section key={tier} className="py-12 border-t border-white/5">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`${config.badge} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider`}>
                                        {config.label}
                                    </span>
                                    <span className="text-sm text-slate-500">{countries.length} countries</span>
                                </div>
                                <p className="text-slate-400 mb-6 text-sm max-w-2xl">{config.description}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {countries.map((country) => (
                                        <Link
                                            key={country.slug}
                                            href={`/directory/${country.slug}`}
                                            className={`group p-5 rounded-xl border ${config.border} bg-gradient-to-br ${config.color} hover:scale-[1.02] transition-all duration-200`}
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-2xl">{country.flag}</span>
                                                <div>
                                                    <h3 className="text-white font-semibold group-hover:text-blue-300 transition-colors">
                                                        {country.name}
                                                    </h3>
                                                    <span className="text-xs text-slate-400">{country.lang.toUpperCase()} · {country.currency}</span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-400 mb-2">
                                                {country.terms.pilot_car} · {country.terms.escort_vehicle}
                                            </p>

                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                {country.regions.length > 0 && <span>{country.regions.length} regions</span>}
                                                {country.regions.length > 0 && country.cities.length > 0 && <span>·</span>}
                                                {country.cities.length > 0 && <span>{country.cities.length} cities</span>}
                                                {country.regions.length === 0 && country.cities.length === 0 && <span>Coverage expanding</span>}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </section>
                    );
                })}

                {/* ─── FAQ Section ─── */}
                <section className="py-12 border-t border-white/5">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6">
                        <h2 className="text-lg font-bold text-white mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-2">How many countries does Haul Command cover?</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Haul Command covers {totalCountries} countries across five market tiers based on coverage maturity:{' '}
                                    {tierCounts.map(t => `${t.count} ${TIER_CONFIG[t.tier].label.split('–')[1]?.trim()}`).join(', ')}.
                                    New markets are added as logistics corridors are verified.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-2">What do market tiers mean on Haul Command?</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Market tiers indicate the depth of directory coverage and available tools. Gold markets have verified operator listings, rate intelligence, and full regulatory tools.
                                    Copper markets are in the early mapping phase. As data is verified and operators claim their profiles, markets automatically advance to higher tiers.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-2">What is the local term for &quot;pilot car&quot; in different countries?</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Terminology varies by country: &quot;Pilot Car&quot; (US, Canada), &quot;Escort Vehicle&quot; (UK, NZ), &quot;Pilot Vehicle&quot; (Australia),
                                    &quot;BF3-Begleitfahrzeug&quot; (Germany, Austria), &quot;Convoi Exceptionnel&quot; escort (France),
                                    &quot;Vehículo Piloto&quot; (Latin America), &quot;Abnormal Load Escort&quot; (South Africa).
                                    The <Link href="/glossary" className="text-accent hover:underline">Haul Command Glossary</Link> indexes all local terms with definitions and legal context.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Bottom CTA ─── */}
                <section className="py-12 border-t border-white/5 bg-gradient-to-b from-accent/[0.03] to-transparent">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
                        <h2 className="text-xl font-bold text-white mb-3">Are you a logistics operator?</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Claim your profile on Haul Command to get verified, rank in directory search, and receive inbound broker leads from your market.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link href="/claim" className="px-6 py-3 bg-accent text-black font-bold text-sm rounded-xl hover:bg-yellow-400 transition-colors">
                                Claim Your Listing
                            </Link>
                            <Link href="/contact?intent=broker" className="px-6 py-3 bg-white/5 border border-white/10 text-sm text-gray-300 rounded-xl hover:text-white hover:border-white/20 transition-all">
                                I&apos;m a Broker — Notify Me
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
