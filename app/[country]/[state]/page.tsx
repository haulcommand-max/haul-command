
import React from 'react';
import Link from 'next/link';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { getCityHubUrl } from '@/lib/seo/geo-mesh';

// This would be dynamic in a real application
const MOCK_CITIES_BY_STATE: Record<string, { name: string; slug: string }[]> = {
    'fl': [
        { name: 'Miami', slug: 'miami' },
        { name: 'Gainesville', slug: 'gainesville' },
        { name: 'Jacksonville', slug: 'jacksonville' },
        { name: 'Tampa', slug: 'tampa' },
        { name: 'Orlando', slug: 'orlando' }
    ],
    'tx': [
        { name: 'Houston', slug: 'houston' },
        { name: 'Dallas', slug: 'dallas' },
        { name: 'Austin', slug: 'austin' },
        { name: 'San Antonio', slug: 'san-antonio' }
    ]
};

export default async function StatePage({ params }: { params: Promise<{ country: string; state: string }> }) {
    const { country, state } = await params;
    const cities = MOCK_CITIES_BY_STATE[state.toLowerCase()] || [];
    const administrativeName = state.toUpperCase(); // In real app, map 'fl' -> 'Florida'

    return (
        <div className="max-w-4xl mx-auto">
            {/* Schema to be added: AdministrativeArea */}

            <nav className="text-sm breadcrumbs mb-6 text-slate-500">
                <ul className="flex gap-2">
                    <li><Link href={`/${country}`} className="hover:underline">{country.toUpperCase()}</Link></li>
                    <li>/</li>
                    <li className="font-bold text-slate-900">{administrativeName}</li>
                </ul>
            </nav>

            <h1 className="text-4xl font-extrabold text-slate-900 mb-6">
                Certified Pilot Cars in {administrativeName}
            </h1>

            <p className="text-lg text-slate-700 mb-8">
                Find local oversize load support in {administrativeName}. From high pole routing to rear chase cars,
                access our network of verified professionals.
            </p>

            {cities.length > 0 ? (
                <section>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Major Cities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {cities.map((city) => (
                            <Link
                                key={city.slug}
                                href={getCityHubUrl(country, state, city.slug)}
                                className="block p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-500 transition-colors"
                            >
                                <span className="font-medium text-slate-900">{city.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            ) : (
                <div className="p-8 bg-yellow-50 rounded-lg text-yellow-800 border border-yellow-200">
                    No directory data available for this region yet.
                </div>
            )}
        </div>
    );
}
