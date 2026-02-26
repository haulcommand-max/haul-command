
import React from 'react';
import { notFound } from 'next/navigation';

export const metadata = {
    title: 'Haul Command Location Directory',
    description: 'Find verified oversize load escorts and pilot cars across North America.',
};

const VALID_COUNTRIES = ['us', 'ca'];

export default async function CountryLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ country: string }>;
}) {
    const { country } = await params;
    if (!VALID_COUNTRIES.includes(country.toLowerCase())) {
        notFound();
    }


    return (
        <div className="min-h-screen bg-slate-50">
            {/* Potential Global SEO Header could go here */}
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
            {/* Potential Global SEO Footer could go here */}
        </div>
    );
}
