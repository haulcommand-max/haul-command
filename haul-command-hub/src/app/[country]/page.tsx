import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    COUNTRIES,
    getCountryBySlug,
    getAllCountrySlugs,
    SEO_SERVICES,
    SNIPPET_TOPICS,
    CountryConfig,
} from '@/lib/seo-countries';
import FAQSchema from '@/components/FAQSchema';
import { generateCountryFAQs } from '@/lib/faq-generators';
import BreadcrumbSchema, { ServiceSchema } from '@/components/BreadcrumbSchema';
import Navbar from '@/components/Navbar';
import { generateCountryHubHreflang } from '@/lib/seo/hreflang';

// ─── Static Params (ISR) ───
export function generateStaticParams() {
    return getAllCountrySlugs().map((slug) => ({ country: slug }));
}

// ─── Exact Title Map (Tier A) ───
const COUNTRY_TITLES: Record<string, string> = {
    us: 'Pilot Car Services in the United States | Haul Command',
    ca: 'Pilot Car Services in Canada | Haul Command',
    au: 'Pilot Vehicle Services in Australia | Haul Command',
    gb: 'Abnormal Load Escort UK | Haul Command',
    nz: 'Pilot Vehicle Services New Zealand | Haul Command',
    za: 'Abnormal Load Escort South Africa | Haul Command',
    de: 'Schwertransport Begleitfahrzeug Deutschland | Haul Command',
    nl: 'Exceptioneel Transport Begeleiding Nederland | Haul Command',
    ae: 'Oversized Load Escort UAE | Haul Command',
    br: 'Escolta para Cargas Especiais Brasil | Haul Command',
    // Tier B
    ie: 'Abnormal Load Escort Ireland | Haul Command',
    se: 'Special Transport Escort Sweden | Haul Command',
    no: 'Spesialtransport Eskorte Norway | Haul Command',
    dk: 'Særtransport Eskorte Denmark | Haul Command',
    fi: 'Erikoiskuljetus Saattopalvelu Finland | Haul Command',
    be: 'Convoi Exceptionnel Escorte Belgium | Haul Command',
    at: 'Schwertransport Begleitung Austria | Haul Command',
    ch: 'Schwertransport Begleitfahrzeug Switzerland | Haul Command',
    es: 'Escolta Transporte Especial España | Haul Command',
    fr: 'Convoi Exceptionnel Escorte France | Haul Command',
    it: 'Scorta Trasporti Eccezionali Italia | Haul Command',
    pt: 'Escolta Transporte Especial Portugal | Haul Command',
    sa: 'Oversized Load Escort Saudi Arabia | Haul Command',
    qa: 'Oversize Load Escort Qatar | Haul Command',
    mx: 'Escolta Carga Sobredimensionada México | Haul Command',
    // Tier D
    uy: 'Escolta Carga Sobredimensionada Uruguay | Haul Command',
    pa: 'Escolta Carga Sobredimensionada Panamá | Haul Command',
    cr: 'Escolta Transporte Especial Costa Rica | Haul Command',
};

function getCountryTitle(country: CountryConfig): string {
    // Exact title if defined
    if (COUNTRY_TITLES[country.slug]) return COUNTRY_TITLES[country.slug];
    // Tier C auto-template: {Localized Special Transport Escort} in {Country}
    return `${country.terms.escort_vehicle} in ${country.name} | Haul Command`;
}

// ─── Dynamic Metadata ───
export async function generateMetadata({
    params,
}: {
    params: Promise<{ country: string }>;
}): Promise<Metadata> {
    const { country: slug } = await params;
    const country = getCountryBySlug(slug);
    if (!country) return { title: 'Country Not Found' };

    const title = getCountryTitle(country);
    const description = `Find verified ${country.terms.pilot_car.toLowerCase()} operators, ${country.terms.escort_vehicle.toLowerCase()} services, and ${country.terms.oversize_load.toLowerCase()} professionals in ${country.name}. ${country.cities.slice(0, 5).join(', ')} and more. Updated for 2026. Get quotes instantly on Haul Command.`;

    return {
        title,
        description,
        keywords: [
            `${country.terms.pilot_car} ${country.name}`,
            `${country.terms.escort_vehicle} ${country.name}`,
            `${country.terms.oversize_load} ${country.name}`,
            `${country.terms.heavy_haul} ${country.name}`,
            `${country.terms.permit} ${country.name}`,
            `${country.terms.wide_load} ${country.name}`,
            ...country.cities.slice(0, 8).map((c) => `${country.terms.pilot_car} ${c}`),
        ],
        openGraph: {
            title,
            description,
            url: `https://haulcommand.com/${slug}`,
            siteName: 'Haul Command',
            type: 'website',
            locale: country.lang === 'en' ? 'en_US' : `${country.lang}_${country.code}`,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: `https://haulcommand.com/${slug}`,
            languages: generateCountryHubHreflang(),
        },
    };
}

// ─── Tier Color Mapping ───
function getTierStyle(tier: string) {
    switch (tier) {
        case 'A': return { bg: 'from-amber-500/20 to-yellow-500/10', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300', label: 'Gold' };
        case 'B': return { bg: 'from-blue-500/20 to-cyan-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300', label: 'Blue' };
        case 'C': return { bg: 'from-slate-400/20 to-gray-500/10', border: 'border-slate-400/30', badge: 'bg-slate-400/20 text-slate-300', label: 'Silver' };
        case 'D': return { bg: 'from-slate-600/20 to-gray-700/10', border: 'border-slate-600/30', badge: 'bg-slate-600/20 text-slate-400', label: 'Slate' };
        default: return { bg: 'from-gray-500/20 to-gray-600/10', border: 'border-gray-500/30', badge: 'bg-gray-500/20 text-gray-400', label: '' };
    }
}

// ─── Country Hub Page ───
export default async function CountryPage({
    params,
}: {
    params: Promise<{ country: string }>;
}) {
    const { country: slug } = await params;
    const country = getCountryBySlug(slug);
    if (!country) notFound();

    const tier = getTierStyle(country.tier);
    const faqs = generateCountryFAQs(country);
    const baseUrl = 'https://haulcommand.com';

    return (
        <>
            {/* ─── Structured Data ─── */}
            <FAQSchema faqs={faqs} />
            <BreadcrumbSchema
                items={[
                    { name: 'Haul Command', url: baseUrl },
                    { name: country.name, url: `${baseUrl}/${slug}` },
                ]}
            />
            <ServiceSchema
                serviceName={`${country.terms.pilot_car} & ${country.terms.escort_vehicle} — ${country.name}`}
                description={`Professional ${country.terms.pilot_car.toLowerCase()} and ${country.terms.escort_vehicle.toLowerCase()} services for ${country.terms.oversize_load.toLowerCase()} transport across ${country.name}.`}
                areaServed={country.name}
                url={`${baseUrl}/${slug}`}
            />

            <Navbar />

            <main className="min-h-screen bg-[#0a0e17]">
                {/* ─── Hero Section ─── */}
                <section className={`relative pt-24 pb-16 bg-gradient-to-b ${tier.bg}`}>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]" />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                            <Link href="/" className="hover:text-white transition-colors">Haul Command</Link>
                            <span className="text-slate-600">/</span>
                            <span className="text-white">{country.flag} {country.name}</span>
                        </nav>

                        <div className="flex flex-col lg:flex-row items-start gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-5xl">{country.flag}</span>
                                    <span className={`${tier.badge} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider`}>
                                        Tier {country.tier} — {tier.label}
                                    </span>
                                </div>

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                                    {country.terms.pilot_car} &amp; {country.terms.escort_vehicle}
                                    <br />
                                    <span className="text-slate-300">in {country.name}</span>
                                </h1>

                                {/* ─── Definition Block (Snippet-optimized) ─── */}
                                <p className="text-lg text-slate-300 max-w-2xl mb-4 leading-relaxed">
                                    An {country.terms.oversize_load.toLowerCase()} escort in {country.name} is a certified
                                    {' '}{country.terms.pilot_car.toLowerCase()} that guides wide or heavy transport loads to
                                    ensure roadway safety, {country.terms.permit.toLowerCase()} compliance, and traffic control.
                                </p>
                                <p className="text-base text-slate-400 max-w-2xl mb-8 leading-relaxed">
                                    Find verified {country.terms.pilot_car.toLowerCase()} operators and {country.terms.escort_vehicle.toLowerCase()} professionals
                                    for {country.terms.oversize_load.toLowerCase()} transport across {country.name}.
                                    {' '}Covering {country.regions.length} regions and {country.cities.length}+ cities.
                                    <span className="text-blue-400 ml-2 text-sm font-medium">Updated for 2026</span>
                                </p>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                    <StatCard label="Regions" value={country.regions.length.toString()} />
                                    <StatCard label="Cities" value={`${country.cities.length}+`} />
                                    <StatCard label="Currency" value={country.currency} />
                                    <StatCard label="Units" value={country.units === 'imperial' ? 'Imperial' : 'Metric'} />
                                </div>

                                {/* CTA */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href={`/${slug}/pilot-car-service`}
                                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25"
                                    >
                                        Find {country.terms.pilot_car} Operators →
                                    </Link>
                                    <Link
                                        href={`/${slug}/oversize-load-escort`}
                                        className="inline-flex items-center justify-center px-6 py-3 border border-slate-600 hover:border-slate-400 text-slate-200 font-semibold rounded-lg transition-colors"
                                    >
                                        {country.terms.oversize_load} Escorts
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Services Grid ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Services in {country.name}
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Professional {country.terms.oversize_load.toLowerCase()} transport services available across {country.name}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SEO_SERVICES.map((service) => (
                                <Link
                                    key={service.slug}
                                    href={`/${slug}/${service.slug}`}
                                    className={`group p-5 rounded-xl border ${tier.border} bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                                            {country.terms[service.termKey] || service.label}
                                        </h3>
                                        <span className="text-slate-600 group-hover:text-blue-400 transition-colors">→</span>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        Professional {(country.terms[service.termKey] || service.label).toLowerCase()} services
                                        across {country.name}. Find verified operators in {country.cities.slice(0, 3).join(', ')} and more.
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Regions Grid ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Regions &amp; States
                        </h2>
                        <p className="text-slate-400 mb-8">
                            {country.terms.pilot_car} coverage across {country.name}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {country.regions.map((region) => (
                                <div
                                    key={region}
                                    className="p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                                >
                                    <span className="text-sm text-slate-200">{region}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Cities Grid ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Top Cities for {country.terms.pilot_car} in {country.name}
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Find operators in major cities across {country.name}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {country.cities.map((city) => (
                                <Link
                                    key={city}
                                    href={`/${slug}/city/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}`}
                                    className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-blue-500/30 transition-all duration-200"
                                >
                                    <span className="text-sm text-slate-200 group-hover:text-white transition-colors font-medium">
                                        {city}
                                    </span>
                                    <span className="block text-xs text-slate-500 mt-1">
                                        {country.terms.pilot_car} →
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Equipment Focus ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Equipment Specializations
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Common {country.terms.oversize_load.toLowerCase()} types requiring {country.terms.escort_vehicle.toLowerCase()} services in {country.name}
                        </p>

                        <div className="flex flex-wrap gap-3">
                            {country.equipment_focus.map((equipment) => (
                                <span
                                    key={equipment}
                                    className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-sm text-slate-300 capitalize"
                                >
                                    {equipment}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Escort Requirements Table (AI Snippet Target) ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {country.terms.escort_vehicle} Requirements by Load Size — {country.name}
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Updated for 2026. When do you need a {country.terms.pilot_car.toLowerCase()} in {country.name}?
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-200">Load Width ({country.units === 'imperial' ? 'ft' : 'm'})</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-200">Classification</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-200">Front Escort</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-200">Rear Escort</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-200">Police Escort</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-slate-300">
                                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="py-3 px-4">Up to {country.units === 'imperial' ? '8.5' : '2.5'}</td>
                                        <td className="py-3 px-4">Standard</td>
                                        <td className="py-3 px-4 text-green-400">Not Required</td>
                                        <td className="py-3 px-4 text-green-400">Not Required</td>
                                        <td className="py-3 px-4 text-green-400">No</td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="py-3 px-4">{country.units === 'imperial' ? '8.5–12' : '2.5–3.5'}</td>
                                        <td className="py-3 px-4">{country.terms.oversize_load}</td>
                                        <td className="py-3 px-4 text-yellow-400">Required</td>
                                        <td className="py-3 px-4 text-slate-400">Varies</td>
                                        <td className="py-3 px-4 text-green-400">No</td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="py-3 px-4">{country.units === 'imperial' ? '12–16' : '3.5–5.0'}</td>
                                        <td className="py-3 px-4">Wide {country.terms.oversize_load}</td>
                                        <td className="py-3 px-4 text-red-400">Required</td>
                                        <td className="py-3 px-4 text-red-400">Required</td>
                                        <td className="py-3 px-4 text-yellow-400">Varies</td>
                                    </tr>
                                    <tr className="hover:bg-white/[0.02]">
                                        <td className="py-3 px-4">{country.units === 'imperial' ? '16+' : '5.0+'}</td>
                                        <td className="py-3 px-4">{country.terms.superload}</td>
                                        <td className="py-3 px-4 text-red-400">Required</td>
                                        <td className="py-3 px-4 text-red-400">Required</td>
                                        <td className="py-3 px-4 text-red-400">Often Required</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ─── Snippet Authority / Knowledge Hub ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {country.terms.oversize_load} Knowledge Hub — {country.name}
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Essential guides for {country.terms.oversize_load.toLowerCase()} transport in {country.name}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SNIPPET_TOPICS.map((topic) => (
                                <Link
                                    key={topic.slug}
                                    href={`/${slug}/guide/${topic.slug}`}
                                    className="group p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200"
                                >
                                    <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors mb-2">
                                        {topic.title}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        Localized to {country.name}: {country.terms[topic.termKey] || topic.title}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── FAQ Section ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-8">
                            Frequently Asked Questions — {country.name}
                        </h2>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <details
                                    key={index}
                                    className="group rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
                                >
                                    <summary className="cursor-pointer px-6 py-4 text-white font-medium hover:bg-white/[0.03] transition-colors flex items-center justify-between">
                                        {faq.question}
                                        <span className="text-slate-500 group-open:rotate-180 transition-transform ml-4 flex-shrink-0">▾</span>
                                    </summary>
                                    <div className="px-6 pb-4 text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                                        {faq.answer}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Entity Reinforcement Section (Google entity graph) ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {country.terms.oversize_load} Transport Authorities — {country.name}
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Key regulatory bodies, highways, and {country.terms.permit.toLowerCase()} offices for {country.terms.oversize_load.toLowerCase()} in {country.name}. Updated for 2026.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                                <h3 className="text-white font-semibold mb-3">🏛️ Government Bodies</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {country.name} transport regulation, {country.terms.permit.toLowerCase()} offices, and
                                    highway authorities governing {country.terms.oversize_load.toLowerCase()} movement.
                                </p>
                            </div>
                            <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                                <h3 className="text-white font-semibold mb-3">🛣️ Major Corridors</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Key {country.terms.heavy_haul.toLowerCase()} routes connecting
                                    {' '}{country.cities.slice(0, 3).join(', ')}, and major ports/industrial zones.
                                </p>
                            </div>
                            <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                                <h3 className="text-white font-semibold mb-3">📋 {country.terms.permit} Offices</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Where to apply for {country.terms.permit.toLowerCase()} in {country.regions.slice(0, 4).join(', ')}.
                                    Processing times and documentation requirements.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Cross-links to Other Countries ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Explore Other Countries
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Haul Command operates across 120 countries worldwide
                        </p>

                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                            {COUNTRIES
                                .filter((c) => c.slug !== slug)
                                .slice(0, 24)
                                .map((c) => (
                                    <Link
                                        key={c.slug}
                                        href={`/${c.slug}`}
                                        className="p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-center"
                                    >
                                        <span className="text-lg block">{c.flag}</span>
                                        <span className="text-xs text-slate-400 block mt-1 truncate">{c.name}</span>
                                    </Link>
                                ))}
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                href="/countries"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                View all 120 countries →
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ─── Footer CTA ─── */}
                <section className="py-20 bg-gradient-to-t from-blue-950/30 to-transparent border-t border-white/5">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to Move in {country.name}?
                        </h2>
                        <p className="text-slate-300 mb-8 text-lg">
                            Join {country.name}&apos;s leading {country.terms.pilot_car.toLowerCase()} operators on Haul Command.
                            Get listed, find loads, and grow your business.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="https://haulcommand.com/register"
                                className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25"
                            >
                                List Your Company — Free
                            </Link>
                            <Link
                                href={`/${slug}/pilot-car-service`}
                                className="inline-flex items-center justify-center px-8 py-3.5 border border-slate-600 hover:border-blue-400 text-slate-200 hover:text-white font-semibold rounded-lg transition-all duration-200"
                            >
                                Search Operators
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

// ─── Stat Card Component ───
function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-3 rounded-lg border border-white/5 bg-white/[0.03] text-center">
            <span className="block text-xl font-bold text-white">{value}</span>
            <span className="block text-xs text-slate-400 mt-1">{label}</span>
        </div>
    );
}
