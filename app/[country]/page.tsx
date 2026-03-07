
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { getStateUrl } from '@/lib/seo/geo-mesh';
import { getCountryBySlug, getRegionsByCountry } from '@/lib/server/geo';

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
    const { country } = await params;

    // ── Resolve country from DB (no hardcoded US/CA check) ──
    const countryData = await getCountryBySlug(country);
    if (!countryData) return notFound();

    // ── Get regions from DB ──
    const regions = await getRegionsByCountry(countryData.iso2);

    return (
        <div className="max-w-4xl mx-auto">
            <SchemaGenerator type="Organization" data={{}} />

            <h1 className="text-4xl font-extrabold text-slate-900 mb-6">
                Oversize Load Escorts in {countryData.name}
            </h1>

            <p className="text-xl text-slate-600 mb-12">
                Browse verified pilot car providers, route surveyors, and high pole operators across {countryData.name}.
                Haul Command connects you with the most reliable network worldwide.
            </p>

            {regions.length > 0 ? (
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Select a Region</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {regions.map((region) => (
                            <Link
                                key={region.code}
                                href={getStateUrl(country, region.code.toLowerCase())}
                                className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-slate-200"
                            >
                                <span className="text-lg font-medium text-blue-600 hover:underline">
                                    {region.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            ) : (
                <section className="p-8 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <h2 className="text-xl font-bold text-amber-800 mb-2">Coverage Building</h2>
                    <p className="text-amber-700">
                        We&apos;re expanding our verified provider network in {countryData.name}.
                        Region-level browsing will be available soon.
                    </p>
                    <Link
                        href="/directory"
                        className="inline-block mt-4 px-6 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors"
                    >
                        Browse Full Directory →
                    </Link>
                </section>
            )}
        </div>
    );
}
