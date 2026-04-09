
import React from 'react';
import Link from 'next/link';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { GeoMeshLinks } from '@/components/seo/GeoMeshLinks';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { ClaimListingCTA, PostLoadCTA, OperatorsNeededCTA } from '@/components/seo/ConversionCTAs';
import { getCityData, getServiceData, getProviderStats } from '@/lib/seo/programmatic-data';
import { notFound } from 'next/navigation';

export default async function CityServicePage({ params }: { params: Promise<{ country: string; state: string; city: string; service: string }> }) {
    const { country, state, city: citySlug, service: serviceSlug } = await params;

    const [cityData, serviceData] = await Promise.all([
        getCityData(country, state, citySlug),
        getServiceData(serviceSlug)
    ]);

    if (!cityData || !serviceData) {
        notFound();
    }

    const stats = await getProviderStats(citySlug, serviceSlug);

    return (
        <div className="max-w-5xl mx-auto">
            <SchemaGenerator type="CityService" data={{ country, state, city: cityData.city, service: serviceData }} />

            <nav className="text-sm breadcrumbs mb-6 text-slate-500">
                <ul className="flex gap-2">
                    <li><Link aria-label="Navigation Link" href={`/${country}`} className="hover:underline">{country.toUpperCase()}</Link></li>
                    <li>/</li>
                    <li><Link aria-label="Navigation Link" href={`/${country}/${state}`} className="hover:underline">{state.toUpperCase()}</Link></li>
                    <li>/</li>
                    <li><Link aria-label="Navigation Link" href={`/${country}/${state}/${citySlug}`} className="hover:underline">{cityData.city}</Link></li>
                    <li>/</li>
                    <li className="font-bold text-white">{serviceData.name}</li>
                </ul>
            </nav>

            <header className="mb-12 border-b border-white/10 pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                            {serviceData.name} in {cityData.city}, {state.toUpperCase()}
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl">
                            Verified {serviceData.name.toLowerCase()} providers serving {cityData.city} and the surrounding {state.toUpperCase()} region.
                            Funds verified, trusted, and road-ready.
                        </p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 min-w-[250px]">
                        <div className="text-sm text-blue-800 font-medium mb-1">Available Providers</div>
                        <div className="text-3xl font-black text-blue-900">{stats.count}</div>
                        <div className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            {stats.verifiedCount} Haul Command Verified
                        </div>
                    </div>
                </div>
            </header>

            {/* Provider Grid Placeholder */}
            <section className="mb-16">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Top Rated {serviceData.name} Providers</h2>
                    <Link aria-label="Navigation Link" href={`/auth/register`} className="text-blue-600 font-medium hover:underline">
                        Register your business →
                    </Link>
                </div>

                <div className="bg-[#121212] rounded-xl shadow-sm border border-white/10 divide-y divide-slate-100">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:bg-[#0A0A0A] transition-colors">
                            <div className="w-16 h-16 bg-[#1E1E1E] rounded-full flex items-center justify-center text-slate-400 font-bold text-xl">
                                P{i}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white">Premier Escort Service {i}</h3>
                                <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                                    <span>⭐ 4.9 (12 reviews)</span>
                                    <span>•</span>
                                    <span>{cityData.city}, {state.toUpperCase()}</span>
                                    <span>•</span>
                                    <span className="text-green-600 font-medium">Verified Insurance</span>
                                </div>
                            </div>
                            <button aria-label="Interactive Button" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                View Profile
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Escorts Matter Here (Geo-Intelligence Block) */}
            <section className="mb-16">
                <h2 className="text-2xl font-bold text-white mb-4">Why {serviceData.name} Matters in {cityData.city}</h2>
                <div className="prose prose-slate max-w-none text-slate-600">
                    <p>
                        Transporting oversize loads through {cityData.city} requires careful coordination.
                        With localized traffic patterns and critical infrastructure in {state.toUpperCase()},
                        a professional {serviceData.name.toLowerCase()} is essential for safety and compliance.
                    </p>
                    <p>
                        Haul Command providers in {cityData.city} are vetted for equipment standards,
                        insurance coverage, and local route knowledge.
                    </p>
                </div>
            </section>

            {/* Geo Mesh Internal Linking */}
            <GeoMeshLinks currentCity={cityData} serviceSlug={serviceSlug} />

            {/* Snippet Injector — featured snippet capture */}
            <SnippetInjector
                blocks={['definition', 'faq', 'cost_range', 'steps']}
                term={serviceData.name.toLowerCase()}
                geo={`${cityData.city}, ${state.toUpperCase()}`}
                country={country.toUpperCase()}
            />

            {/* Conversion CTAs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 32 }}>
                <PostLoadCTA corridorName={`${cityData.city}, ${state.toUpperCase()}`} variant="card" />
                <OperatorsNeededCTA surfaceName={`${cityData.city}, ${state.toUpperCase()}`} />
            </div>

            {/* Claim CTA */}
            <div style={{ marginTop: 24 }}>
                <ClaimListingCTA entityId="new" companyName={undefined} variant="banner" />
            </div>
        </div>
    );
}
