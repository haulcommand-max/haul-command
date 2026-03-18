import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPageKey, getSurfaces, getInternalLinks, formatClassName, getCountryName } from '@/lib/page-factory';
import { SurfaceGrid } from '@/components/page-factory/SurfaceGrid';
import { ClaimBanner } from '@/components/page-factory/ClaimBanner';
import { RelatedLinks } from '@/components/page-factory/RelatedLinks';
import { Breadcrumbs } from '@/components/page-factory/Breadcrumbs';

type Props = { params: Promise<{ country: string; slug: string; surfaceClass: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { country, slug: city, surfaceClass } = await params;
    const pk = await getPageKey('city_class', { country_slug: country, city_slug: city, surface_class: surfaceClass });
    if (!pk) return { title: 'Not Found' };
    return {
        title: pk.title + ' | HAUL COMMAND',
        description: pk.meta_description,
        robots: pk.indexable ? 'index,follow' : 'noindex,nofollow',
        alternates: { canonical: pk.canonical_slug },
    };
}

export const revalidate = 86400;

export default async function CityClassPage({ params }: Props) {
    const { country, slug: city, surfaceClass } = await params;
    const pk = await getPageKey('city_class', { country_slug: country, city_slug: city, surface_class: surfaceClass });
    if (!pk) notFound();

    const cityName = city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const countryName = getCountryName(pk.country_code!);
    const className = formatClassName(surfaceClass);

    const [surfaces, links] = await Promise.all([
        getSurfaces({ country_code: pk.country_code!, city: cityName, surface_class: surfaceClass }, 60),
        getInternalLinks(pk.id),
    ]);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: pk.title,
        description: pk.meta_description,
        url: `https://haulcommand.com${pk.canonical_slug}`,
        numberOfItems: pk.entity_count,
    };

    return (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', minHeight: '100vh' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <Breadcrumbs crumbs={[
                { label: countryName, href: `/directory/surfaces/${country}` },
                { label: className, href: `/pf/${country}/${surfaceClass}` },
                { label: cityName },
            ]} />

            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)', fontWeight: 800,
                    color: '#e8eaf0', lineHeight: 1.2, marginBottom: '0.5rem',
                }}>{pk.h1}</h1>
                <p style={{ color: '#8892a8', fontSize: '1rem' }}>
                    {pk.entity_count.toLocaleString()} {className.toLowerCase()} in {cityName}, {countryName}.
                </p>
            </header>

            <SurfaceGrid surfaces={surfaces} />
            <ClaimBanner count={surfaces.filter(s => s.is_claimable).length} />
            <RelatedLinks links={links} />

            <section style={{ margin: '3rem 0' }}>
                <h2 style={{ color: '#c8cdd8', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>FAQ</h2>
                <details style={{ color: '#9ca3af', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#c8cdd8', fontWeight: 500 }}>
                        How many {className.toLowerCase()} are in {cityName}?
                    </summary>
                    <p style={{ paddingTop: '0.5rem', paddingLeft: '1rem' }}>
                        HAUL COMMAND tracks {pk.entity_count.toLocaleString()} {className.toLowerCase()} in {cityName}.
                    </p>
                </details>
            </section>
        </main>
    );
}
