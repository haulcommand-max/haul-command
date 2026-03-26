import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    getCountryBySlug,
    getAllCountrySlugs,
    SEO_SERVICES,
} from '@/lib/seo-countries';
import FAQSchema from '@/components/FAQSchema';
import { generateServiceFAQs } from '@/lib/faq-generators';
import BreadcrumbSchema, { ServiceSchema } from '@/components/BreadcrumbSchema';
import Navbar from '@/components/Navbar';
import { generateServiceHreflang } from '@/lib/seo/hreflang';

// ─── Static Params (CAPPED: US only to stay under 80MB limit) ───
export function generateStaticParams() {
    const paths: { country: string; service: string }[] = [];
    // Only pre-render US service pages — highest SEO value
    for (const service of SEO_SERVICES) {
        paths.push({ country: 'us', service: service.slug });
    }
    return paths;
}

// ─── Metadata ───
export async function generateMetadata({
    params,
}: {
    params: Promise<{ country: string; service: string }>;
}): Promise<Metadata> {
    const { country: countrySlug, service: serviceSlug } = await params;
    const country = getCountryBySlug(countrySlug);
    const service = SEO_SERVICES.find((s) => s.slug === serviceSlug);

    if (!country || !service) return { title: 'Not Found' };

    const localTerm = country.terms[service.termKey] || service.label;
    const title = `${localTerm} in ${country.name} | Find Verified Operators | Haul Command`;
    const description = `Search for ${localTerm.toLowerCase()} operators across ${country.name}. Compare verified professionals in ${country.cities.slice(0, 4).join(', ')} and more. Instant quotes, certifications, and reviews on Haul Command.`;

    return {
        title,
        description,
        keywords: [
            `${localTerm} ${country.name}`,
            ...country.cities.slice(0, 6).map((c) => `${localTerm} ${c}`),
            ...country.regions.slice(0, 4).map((r) => `${localTerm} ${r}`),
            `${localTerm} cost`,
            `${localTerm} near me`,
        ],
        openGraph: {
            title,
            description,
            url: `https://haulcommand.com/${countrySlug}/${serviceSlug}`,
            siteName: 'Haul Command',
            type: 'website',
        },
        alternates: {
            canonical: `https://haulcommand.com/${countrySlug}/${serviceSlug}`,
            languages: generateServiceHreflang(serviceSlug),
        },
    };
}

// ─── Service Page ───
export default async function ServicePage({
    params,
}: {
    params: Promise<{ country: string; service: string }>;
}) {
    const { country: countrySlug, service: serviceSlug } = await params;
    const country = getCountryBySlug(countrySlug);
    const service = SEO_SERVICES.find((s) => s.slug === serviceSlug);

    if (!country || !service) notFound();

    const localTerm = country.terms[service.termKey] || service.label;
    const faqs = generateServiceFAQs(service.label, service.termKey, country);
    const baseUrl = 'https://haulcommand.com';

    return (
        <>
            <FAQSchema faqs={faqs} />
            <BreadcrumbSchema
                items={[
                    { name: 'Haul Command', url: baseUrl },
                    { name: country.name, url: `${baseUrl}/${countrySlug}` },
                    { name: localTerm, url: `${baseUrl}/${countrySlug}/${serviceSlug}` },
                ]}
            />
            <ServiceSchema
                serviceName={`${localTerm} — ${country.name}`}
                description={`Professional ${localTerm.toLowerCase()} services for ${country.terms.oversize_load.toLowerCase()} transport in ${country.name}.`}
                areaServed={country.name}
                url={`${baseUrl}/${countrySlug}/${serviceSlug}`}
            />

            <Navbar />

            <main className="min-h-screen bg-[#0a0e17]">
                {/* ─── Hero ─── */}
                <section className="relative pt-24 pb-16 bg-gradient-to-b from-blue-600/10 to-transparent">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_60%)]" />
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap">
                            <Link href="/" className="hover:text-white transition-colors">Haul Command</Link>
                            <span className="text-slate-600">/</span>
                            <Link href={`/${countrySlug}`} className="hover:text-white transition-colors">{country.flag} {country.name}</Link>
                            <span className="text-slate-600">/</span>
                            <span className="text-white">{localTerm}</span>
                        </nav>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                            {localTerm}
                            <br />
                            <span className="text-slate-300">in {country.name} {country.flag}</span>
                        </h1>

                        <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">
                            Find verified {localTerm.toLowerCase()} operators across {country.name}.
                            Search by city, region, or corridor to connect with qualified professionals instantly.
                        </p>

                        <Link
                            href="https://haulcommand.com/directory"
                            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25"
                        >
                            Search {localTerm} Operators →
                        </Link>
                    </div>
                </section>

                {/* ─── City Coverage ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {localTerm} — City Coverage
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Find {localTerm.toLowerCase()} operators in these {country.name} cities
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {country.cities.map((city) => (
                                <div
                                    key={city}
                                    className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-blue-500/30 transition-all duration-200"
                                >
                                    <span className="text-sm text-slate-200 group-hover:text-white transition-colors font-medium block">
                                        {city}
                                    </span>
                                    <span className="text-xs text-slate-500 mt-1 block">
                                        {localTerm}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── What You Need to Know ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-8">
                            What to Know About {localTerm} in {country.name}
                        </h2>

                        <div className="prose prose-invert prose-slate max-w-none">
                            <div className="space-y-6 text-slate-300 leading-relaxed">
                                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                                    <h3 className="text-white font-semibold mb-2 text-lg">Requirements</h3>
                                    <p>
                                        {localTerm} requirements in {country.name} vary by jurisdiction.
                                        Operators typically need specific certifications, proper vehicle equipment
                                        ({country.units === 'imperial' ? 'ANSI-compliant' : 'EN-standard'} signage, amber lights, radios),
                                        and liability insurance. Always verify credentials through Haul Command&apos;s verified operator badges.
                                    </p>
                                </div>

                                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                                    <h3 className="text-white font-semibold mb-2 text-lg">Pricing</h3>
                                    <p>
                                        {localTerm} costs in {country.name} are quoted in {country.currency} and depend on
                                        route distance, load dimensions, time of transport, and the number of escort vehicles required.
                                        Urban moves typically cost more than highway runs due to traffic complexity.
                                    </p>
                                </div>

                                <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                                    <h3 className="text-white font-semibold mb-2 text-lg">Equipment Types</h3>
                                    <p>
                                        Common {country.terms.oversize_load.toLowerCase()} types in {country.name} requiring
                                        {' '}{localTerm.toLowerCase()} include: {country.equipment_focus.join(', ')}.
                                        Each type has specific escort requirements based on dimensions and weight.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Other Services ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-8">
                            Other Services in {country.name}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SEO_SERVICES.filter((s) => s.slug !== serviceSlug).map((s) => (
                                <Link
                                    key={s.slug}
                                    href={`/${countrySlug}/${s.slug}`}
                                    className="group p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200"
                                >
                                    <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                                        {country.terms[s.termKey] || s.label}
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">in {country.name} →</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── FAQ Section ─── */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-8">
                            FAQ — {localTerm} in {country.name}
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
            </main>
        </>
    );
}
