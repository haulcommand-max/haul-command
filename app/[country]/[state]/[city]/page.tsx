
import React from 'react';
import Link from 'next/link';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import { GeoMeshLinks } from '@/components/seo/GeoMeshLinks';
import { getCityData, getAllServices } from '@/lib/seo/programmatic-data';
import { getCityServiceUrl } from '@/lib/seo/geo-mesh';
import { notFound } from 'next/navigation';

export default async function CityHubPage({ params }: { params: Promise<{ country: string; state: string; city: string }> }) {
    const { country, state, city: citySlug } = await params;
    const cityData = await getCityData(country, state, citySlug);

    if (!cityData) {
        notFound();
    }

    const services = await getAllServices();

    return (
        <div className="max-w-5xl mx-auto">
            <SchemaGenerator type="CityHub" data={{ country, state, city: cityData.city }} />

            <nav className="text-sm breadcrumbs mb-6 text-slate-500">
                <ul className="flex gap-2">
                    <li><Link href={`/${country}`} className="hover:underline">{country.toUpperCase()}</Link></li>
                    <li>/</li>
                    <li><Link href={`/${country}/${state}`} className="hover:underline">{state.toUpperCase()}</Link></li>
                    <li>/</li>
                    <li className="font-bold text-slate-900">{cityData.city}</li>
                </ul>
            </nav>

            <header className="mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
                    Oversize Load Directory: {cityData.city}, {state.toUpperCase()}
                </h1>
                <p className="text-xl text-slate-600 max-w-3xl">
                    Connect with verified pilot car operators, route surveyors, and heavy haul support in {cityData.city}.
                    Haul Command is the trusted network for {state.toUpperCase()} logistics.
                </p>
            </header>

            <section className="mb-16">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Available Services in {cityData.city}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <Link
                            key={service.id}
                            href={getCityServiceUrl(country, state, citySlug, service.slug)}
                            className="group block p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-500 transition-all"
                        >
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 mb-2">
                                {service.name}
                            </h3>
                            <p className="text-slate-600 text-sm">
                                {service.description}
                            </p>
                            <div className="mt-4 text-sm font-medium text-blue-600 flex items-center">
                                View Providers <span className="ml-1">→</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Geo Mesh Internal Linking */}
            <GeoMeshLinks currentCity={cityData} />
        </div>
    );
}
