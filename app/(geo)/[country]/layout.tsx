
import React from 'react';
import { notFound } from 'next/navigation';

export const metadata = {
    title: 'Haul Command Location Directory',
    description: 'Find verified oversize load escorts and pilot cars across North America.',
};

const VALID_COUNTRIES = ['us', 'ca'];

// Top-level static paths that share the /:segment pattern with (geo)/[country].
// If [country] resolves to one of these, Next.js should have served the static
// route already. But as a safety net — don't call notFound() on them.
const STATIC_TOP_LEVEL_PATHS = new Set([
    'roles', 'blog', 'glossary', 'pricing', 'tools', 'rates', 'training',
    'loads', 'reposition', 'claim', 'corridors', 'contact', 'available-now',
    'regulations', 'resources', 'trucker-services', 'map', 'requirements',
    'register', 'login', 'onboarding', 'dashboard', 'profile', 'settings',
    'directory', 'near', 'border', 'port', 'county', 'industry', 'emergency',
    'services', 'about', 'privacy', 'terms', 'sitemap', 'api',
]);

export default async function CountryLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ country: string }>;
}) {
    const { country } = await params;
    const slug = country.toLowerCase();

    // Pass through known static top-level paths — don't 404 them
    if (STATIC_TOP_LEVEL_PATHS.has(slug)) {
        return <>{children}</>;
    }

    if (!VALID_COUNTRIES.includes(slug)) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Potential Global SEO Header could go here */}
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
            {/* Potential Global SEO Footer could go here */}
        </div>
    );
}
