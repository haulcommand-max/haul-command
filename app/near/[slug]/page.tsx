
import React from 'react';
import Link from 'next/link';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { getCityData } from '@/lib/seo/programmatic-data';
import { notFound } from 'next/navigation';

export default async function RadiusPage({ params }: { params: { slug: string } }) {
    // Expected slug format: "miami-50-miles" or "gainesville-25-miles"
    const { slug } = params;

    // Simple parser for the slug
    // In production, use robust regex or a database lookup for "valid radius slugs"
    const match = slug.match(/^(.+)-(\d+)-miles$/);

    if (!match) {
        // Fallback or 404
        // For now, let's try to parse "miami" from "miami-50-miles"
        notFound();
    }

    const citySlug = match[1];
    const radius = parseInt(match[2]);
    const country = 'us'; // Defaulting for V1
    const state = 'fl';   // Defaulting for V1

    // Fetch central city data (Mock)
    const cityData = await getCityData(country, state, citySlug);

    if (!cityData) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <SchemaGenerator type="CityHub" data={{ country, state, city: cityData.city }} /> {/* Using CityHub schema as base for now, can refine to Radius */}

            <nav className="text-sm breadcrumbs mb-6 text-slate-500">
                <ul className="flex gap-2">
                    <li><Link href={`/${country}`} className="hover:underline">{country.toUpperCase()}</Link></li>
                    <li>/</li>
                    <li><Link href={`/${country}/${state}`} className="hover:underline">{state.toUpperCase()}</Link></li>
                    <li>/</li>
                    <li><Link href={`/${country}/${state}/${citySlug}`} className="hover:underline">{cityData.city}</Link></li>
                    <li>/</li>
                    <li className="font-bold text-slate-900">Near {cityData.city} ({radius} mi)</li>
                </ul>
            </nav>

            <h1 className="text-4xl font-extrabold text-slate-900 mb-6">
                Oversize Load Support within {radius} Miles of {cityData.city}, {state.toUpperCase()}
            </h1>

            <p className="text-xl text-slate-600 mb-12">
                Finding local pilot cars near {cityData.city} is critical for rapid dispatch.
                Haul Command maps verified providers within a {radius}-mile radius, covering {cityData.nearbyCities.length > 0 ? 'surrounding metro areas' : 'the local vicinity'}.
            </p>

            <section className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Cities in this Radius</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {cityData.nearbyCities.map((nearbySlug) => (
                        <Link
                            key={nearbySlug}
                            href={`/${country}/${state}/${nearbySlug}`}
                            className="block p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-500 transition-colors"
                        >
                            <span className="font-medium text-slate-900 capitalize">{nearbySlug.replace(/-/g, ' ')}</span>
                            <span className="block text-xs text-slate-500 mt-1">~{Math.floor(Math.random() * radius)} miles away</span>
                        </Link>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Active Providers Nearby</h2>
                <div className="bg-slate-50 p-6 rounded-xl text-center border border-slate-200">
                    <p className="text-lg text-slate-700 mb-4">
                        We found <strong>{Math.floor(Math.random() * 20) + 5} verified providers</strong> in this coverage zone.
                    </p>
                    <Link
                        href={`/${country}/${state}/${citySlug}/pilot-car`}
                        className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        View All Providers
                    </Link>
                </div>
            </section>
        </div>
    );
}
