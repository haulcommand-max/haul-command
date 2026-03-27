import { Metadata } from 'next';
import Link from 'next/link';
import {
    COUNTRIES,
    getCountriesByTier,
} from '@/lib/seo-countries';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
    title:'Pilot Car & Escort Vehicle Directory — 120 countries',
    description: 'Find pilot car operators and escort vehicle professionals across 120 countries. The world\'s largest oversize load transport directory covering North America, Europe, Middle East, Asia Pacific, and Latin America.',
    keywords: [
        'pilot car directory',
        'escort vehicle worldwide',
        'oversize load escort countries',
        'heavy haul escort international',
        'pilot car service global',
    ],
    openGraph: {
        title:'Pilot Car & Escort Vehicle Directory — 120 countries',
        description: 'Find verified oversize load transport professionals across 120 countries worldwide.',
        url: 'https://haulcommand.com/countries',
        siteName: 'Haul Command',
        type: 'website',
    },
    alternates: {
        canonical: 'https://haulcommand.com/countries',
    },
};

const TIER_CONFIG = {
    A: { label: 'Tier A – Gold', description: 'Highest marketplace activity and operator density', color: 'from-amber-500/20 to-yellow-500/10', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300' },
    B: { label: 'Tier B – Blue', description: 'Strong demand with growing operator networks', color: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' },
    C: { label: 'Tier C – Silver', description: 'Emerging markets with expansion potential', color: 'from-slate-400/20 to-gray-500/10', border: 'border-slate-400/30', badge: 'bg-slate-400/20 text-slate-300' },
    D: { label: 'Tier D – Slate', description: 'Early-stage markets with foundational coverage', color: 'from-slate-600/20 to-gray-700/10', border: 'border-slate-600/30', badge: 'bg-slate-600/20 text-slate-400' },
} as const;

export default function CountriesPage() {
    const baseUrl = 'https://haulcommand.com';

    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Haul Command', url: baseUrl },
                    { name: 'Countries', url: `${baseUrl}/countries` },
                ]}
            />

            <Navbar />

            <main className="min-h-screen bg-[#0a0e17]">
                {/* ─── Hero ─── */}
                <section className="relative pt-24 pb-16 bg-gradient-to-b from-blue-600/10 to-transparent">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]" />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                            🌍 120 countries. One Platform.
                        </h1>
                        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed">
                            Haul Command is the world&apos;s largest directory of pilot car, escort vehicle, and oversize load transport professionals.
                            Find verified operators in any of our {COUNTRIES.length} supported countries.
                        </p>

                        <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                {getCountriesByTier('A').length} Gold
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                {getCountriesByTier('B').length} Blue
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-400" />
                                {getCountriesByTier('C').length} Silver
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-600" />
                                {getCountriesByTier('D').length} Slate
                            </span>
                        </div>
                    </div>
                </section>

                {/* ─── Tier Sections ─── */}
                {(['A', 'B', 'C', 'D'] as const).map((tier) => {
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
                                <p className="text-slate-400 mb-6 text-sm">{config.description}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {countries.map((country) => (
                                        <Link
                                            key={country.slug}
                                            href={`/${country.slug}`}
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
                                                <span>{country.regions.length} regions</span>
                                                <span>·</span>
                                                <span>{country.cities.length} cities</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </section>
                    );
                })}
            </main>
        </>
    );
}
