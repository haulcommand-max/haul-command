
import React from 'react';
import Link from 'next/link';
import { getCityServiceUrl, getCityHubUrl } from '@/lib/seo/geo-mesh';

type GeoLinksProps = {
    currentCity: { country: string; state: string; city: string; slug: string; nearbyCities: string[] };
    serviceSlug?: string; // If present, link to service pages. If not, link to city hubs.
};

export const GeoMeshLinks = ({ currentCity, serviceSlug }: GeoLinksProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Nearby {serviceSlug ? 'Services' : 'Locations'}</h3>
                <ul className="grid grid-cols-2 gap-2">
                    {currentCity.nearbyCities.map((citySlug) => (
                        <li key={citySlug}>
                            <Link
                                href={serviceSlug
                                    ? getCityServiceUrl(currentCity.country, currentCity.state, citySlug, serviceSlug)
                                    : getCityHubUrl(currentCity.country, currentCity.state, citySlug)
                                }
                                className="text-blue-600 hover:underline capitalize"
                            >
                                {citySlug.replace(/-/g, ' ')} {serviceSlug ? '' : ''}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Coverage Area</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Haul Command verifies providers across {currentCity.state.toUpperCase()} and surrounding regions.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Link href={`/${currentCity.country}/${currentCity.state}`} className="px-3 py-1 bg-white border rounded-full text-xs font-medium hover:bg-slate-100">
                        {currentCity.state.toUpperCase()} Statewide
                    </Link>
                    <Link href={`/near/${currentCity.slug}-50-miles`} className="px-3 py-1 bg-white border rounded-full text-xs font-medium hover:bg-slate-100">
                        Near {currentCity.city} (50 mi)
                    </Link>
                </div>
            </div>
        </div>
    );
};
