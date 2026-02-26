
import React from 'react';
import Link from 'next/link';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { getStateUrl } from '@/lib/seo/geo-mesh';

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
    const { country } = await params;
    const countryName = country === 'us' ? 'United States' : 'Canada';

    // Mock list of states/provinces (Would come from DB/Constants in real app)
    const regions = country === 'us'
        ? [
            { name: 'Florida', code: 'fl' },
            { name: 'Georgia', code: 'ga' },
            { name: 'Texas', code: 'tx' },
            { name: 'California', code: 'ca' },
            // ... add more
        ]
        : [
            { name: 'Ontario', code: 'on' },
            { name: 'Alberta', code: 'ab' },
            { name: 'British Columbia', code: 'bc' },
            // ... add more
        ];

    return (
        <div className="max-w-4xl mx-auto">
            <SchemaGenerator type="Organization" data={{}} /> {/* Fallback/Base schema */}

            <h1 className="text-4xl font-extrabold text-slate-900 mb-6">
                Oversize Load Escorts in {countryName}
            </h1>

            <p className="text-xl text-slate-600 mb-12">
                Browse verified pilot car providers, route surveyors, and high pole operators across {countryName}.
                Haul Command connects you with the most reliable network in North America.
            </p>

            <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Select a Region</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {regions.map((region) => (
                        <Link
                            key={region.code}
                            href={getStateUrl(country, region.code)}
                            className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-slate-200"
                        >
                            <span className="text-lg font-medium text-blue-600 hover:underline">
                                {region.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
