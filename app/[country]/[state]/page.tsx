
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { getCityHubUrl } from '@/lib/seo/geo-mesh';
import { getCountryBySlug, getRegionByCode, getCitiesByCountryRegion } from '@/lib/server/geo';

export default async function StatePage({ params }: { params: Promise<{ country: string; state: string }> }) {
    const { country, state } = await params;

    // ── Resolve country from DB ──
    const countryData = await getCountryBySlug(country);
    if (!countryData) return notFound();

    // ── Resolve region from DB ──
    const region = await getRegionByCode(countryData.iso2, state);
    const regionName = region?.name ?? state.toUpperCase();

    // ── Get cities from actual directory listings (no mocks) ──
    const cities = await getCitiesByCountryRegion(countryData.iso2, state);

    return (
        <div className="max-w-4xl mx-auto">
            <SchemaGenerator type="Organization" data={{}} />

            <nav className="text-sm breadcrumbs mb-6 text-slate-500">
                <ul className="flex gap-2">
                    <li><Link href={`/${country}`} className="hover:underline">{countryData.name}</Link></li>
                    <li>/</li>
                    <li className="font-bold text-slate-900">{regionName}</li>
                </ul>
            </nav>

            <h1 className="text-4xl font-extrabold text-slate-900 mb-6">
                Certified Pilot Cars in {regionName}
            </h1>

            <p className="text-lg text-slate-700 mb-8">
                Find local oversize load support in {regionName}, {countryData.name}. From high pole routing to rear chase cars,
                access our network of verified professionals.
            </p>

            {cities.length > 0 ? (
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Major Cities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {cities.map((cityName) => {
                            const slug = cityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                            return (
                                <Link
                                    key={slug}
                                    href={getCityHubUrl(country, state, slug)}
                                    className="block p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-500 transition-colors"
                                >
                                    <span className="font-medium text-slate-900">{cityName}</span>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            ) : (
                <section className="p-8 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <h2 className="text-xl font-bold text-amber-800 mb-2">Coverage Building</h2>
                    <p className="text-amber-700">
                        No listed providers in {regionName} yet.
                        Browse the full directory or search nearby regions.
                    </p>
                    <div className="flex gap-3 justify-center mt-4">
                        <Link
                            href={`/directory?country=${countryData.iso2}&region=${state.toUpperCase()}`}
                            className="px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors"
                        >
                            Search Directory →
                        </Link>
                        <Link
                            href={`/${country}`}
                            className="px-6 py-2 bg-white text-slate-700 font-bold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                        >
                            View All Regions
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
}
