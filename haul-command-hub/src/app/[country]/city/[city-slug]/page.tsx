import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    COUNTRIES,
    getCountryBySlug,
    SEO_SERVICES,
    CountryConfig,
} from '@/lib/seo-countries';
import FAQSchema from '@/components/FAQSchema';
import BreadcrumbSchema, { ServiceSchema } from '@/components/BreadcrumbSchema';
import Navbar from '@/components/Navbar';

function slugifyCity(city: string): string {
    return encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
}

function findCity(country: CountryConfig, citySlug: string): string | null {
    return country.cities.find(c => slugifyCity(c) === citySlug) ?? null;
}

// ─── Static Params (CAPPED: US cities only to stay under 80MB limit) ───
export function generateStaticParams() {
    const usCountry = COUNTRIES.find(c => c.slug === 'us');
    if (!usCountry) return [];
    return usCountry.cities.map((city) => ({
        country: 'us',
        'city-slug': slugifyCity(city),
    }));
}

// ─── Metadata ───
export async function generateMetadata({
    params,
}: {
    params: Promise<{ country: string; 'city-slug': string }>;
}): Promise<Metadata> {
    const { country: countrySlug, 'city-slug': citySlug } = await params;
    const country = getCountryBySlug(countrySlug);
    if (!country) return { title: 'Not Found' };
    const city = findCity(country, citySlug);
    if (!city) return { title: 'Not Found' };

    const title = `${country.terms.pilot_car} in ${city}, ${country.name}`;
    const description = `Find verified ${country.terms.pilot_car.toLowerCase()} operators and ${country.terms.escort_vehicle.toLowerCase()} services in ${city}, ${country.name}. Get instant quotes for ${country.terms.oversize_load.toLowerCase()} transport. Updated 2026.`;

    return {
        title,
        description,
        openGraph: { title, description, url: `https://haulcommand.com/${countrySlug}/city/${citySlug}` },
        alternates: { canonical: `https://haulcommand.com/${countrySlug}/city/${citySlug}` },
    };
}

// ─── Page ───
export default async function CityPage({
    params,
}: {
    params: Promise<{ country: string; 'city-slug': string }>;
}) {
    const { country: countrySlug, 'city-slug': citySlug } = await params;
    const country = getCountryBySlug(countrySlug);
    if (!country) notFound();
    const city = findCity(country, citySlug);
    if (!city) notFound();

    const baseUrl = 'https://haulcommand.com';
    const nearbyCities = country.cities.filter(c => c !== city).slice(0, 8);

    const faqs = [
        {
            question: `How much does a ${country.terms.pilot_car.toLowerCase()} cost in ${city}?`,
            answer: `${country.terms.pilot_car} rates in ${city}, ${country.name} typically range from ${country.currency} ${country.units === 'imperial' ? '1.50–3.50 per mile' : '1.20–2.80 per km'} depending on load dimensions, route complexity, and urgency. Use our cost estimator for a personalized quote.`,
        },
        {
            question: `Do I need a ${country.terms.pilot_car.toLowerCase()} in ${city}?`,
            answer: `In ${country.name}, ${country.terms.pilot_car.toLowerCase()} services are required for loads exceeding standard ${country.units === 'imperial' ? '8.5 ft' : '2.5 m'} width. ${city} may have additional local ordinances for metro areas.`,
        },
        {
            question: `How do I find a ${country.terms.escort_vehicle.toLowerCase()} operator in ${city}?`,
            answer: `Haul Command connects you with verified ${country.terms.escort_vehicle.toLowerCase()} operators in ${city}. Search our directory, compare ratings, and get instant quotes from local operators.`,
        },
    ];

    return (
        <>
            <FAQSchema faqs={faqs} />
            <BreadcrumbSchema
                items={[
                    { name: 'Haul Command', url: baseUrl },
                    { name: country.name, url: `${baseUrl}/${countrySlug}` },
                    { name: city, url: `${baseUrl}/${countrySlug}/city/${citySlug}` },
                ]}
            />
            <ServiceSchema
                serviceName={`${country.terms.pilot_car} in ${city}, ${country.name}`}
                description={`Professional ${country.terms.pilot_car.toLowerCase()} and ${country.terms.escort_vehicle.toLowerCase()} services in ${city}, ${country.name}.`}
                areaServed={`${city}, ${country.name}`}
                url={`${baseUrl}/${countrySlug}/city/${citySlug}`}
            />

            <Navbar />

            <main className="min-h-screen bg-[#0a0e17]">
                {/* Hero */}
                <section className="relative pt-24 pb-16 bg-gradient-to-b from-blue-500/10 to-transparent">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                            <Link href="/" className="hover:text-white transition-colors">Haul Command</Link>
                            <span className="text-slate-600">/</span>
                            <Link href={`/${countrySlug}`} className="hover:text-white transition-colors">{country.flag} {country.name}</Link>
                            <span className="text-slate-600">/</span>
                            <span className="text-white">{city}</span>
                        </nav>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                            {country.terms.pilot_car} &amp; {country.terms.escort_vehicle}
                            <br />
                            <span className="text-slate-300">in {city}, {country.name}</span>
                        </h1>

                        <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">
                            Find verified {country.terms.pilot_car.toLowerCase()} operators and
                            {' '}{country.terms.escort_vehicle.toLowerCase()} professionals for
                            {' '}{country.terms.oversize_load.toLowerCase()} transport in {city}.
                            <span className="text-blue-400 ml-2 text-sm font-medium">Updated for 2026</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href="https://haulcommand.com/register"
                                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all shadow-lg shadow-blue-500/25"
                            >
                                List Your Company — Free
                            </Link>
                            <Link
                                href={`/${countrySlug}/pilot-car-service`}
                                className="inline-flex items-center justify-center px-6 py-3 border border-slate-600 hover:border-slate-400 text-slate-200 font-semibold rounded-lg transition-colors"
                            >
                                Find Operators in {city} →
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Services */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-8">
                            {country.terms.oversize_load} Services in {city}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {SEO_SERVICES.map((service) => (
                                <Link
                                    key={service.slug}
                                    href={`/${countrySlug}/${service.slug}`}
                                    className="group p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-all"
                                >
                                    <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors mb-2">
                                        {country.terms[service.termKey] || service.label}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        Professional {(country.terms[service.termKey] || service.label).toLowerCase()} in {city}, {country.name}.
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-16 border-t border-white/5">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-white mb-8">
                            FAQ — {country.terms.pilot_car} in {city}
                        </h2>
                        <div className="space-y-4">
                            {faqs.map((faq, i) => (
                                <details key={i} className="group rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                                    <summary className="cursor-pointer px-6 py-4 text-white font-medium hover:bg-white/[0.03] transition-colors flex items-center justify-between">
                                        {faq.question}
                                        <span className="text-slate-500 group-open:rotate-180 transition-transform ml-4">▾</span>
                                    </summary>
                                    <div className="px-6 pb-4 text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                                        {faq.answer}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Nearby Cities */}
                {nearbyCities.length > 0 && (
                    <section className="py-16 border-t border-white/5">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6">
                            <h2 className="text-2xl font-bold text-white mb-8">
                                Nearby Cities in {country.name}
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {nearbyCities.map((c) => (
                                    <Link
                                        key={c}
                                        href={`/${countrySlug}/city/${slugifyCity(c)}`}
                                        className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-blue-500/30 transition-all"
                                    >
                                        <span className="text-sm text-slate-200 group-hover:text-white font-medium">{c}</span>
                                        <span className="block text-xs text-slate-500 mt-1">{country.terms.pilot_car} →</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
