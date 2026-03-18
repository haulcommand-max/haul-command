import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPageKey, getSurfaces, getInternalLinks, getCityRollups, formatClassName, getCountryName } from '@/lib/page-factory';
import { SurfaceGrid } from '@/components/page-factory/SurfaceGrid';
import { ClaimBanner } from '@/components/page-factory/ClaimBanner';
import { RelatedLinks } from '@/components/page-factory/RelatedLinks';
import { Breadcrumbs } from '@/components/page-factory/Breadcrumbs';
import Link from 'next/link';

type Props = { params: Promise<{ country: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { country, slug } = await params;
    const pk = await getPageKey('country_class', { country_slug: country, surface_class: slug });
    if (!pk) return { title: 'Not Found' };
    return {
        title: pk.title + ' | HAUL COMMAND',
        description: pk.meta_description,
        robots: pk.indexable ? 'index,follow' : 'noindex,nofollow',
        alternates: { canonical: pk.canonical_slug },
    };
}

export const revalidate = 86400;

export default async function CountryClassPage({ params }: Props) {
    const { country, slug } = await params;
    const pk = await getPageKey('country_class', { country_slug: country, surface_class: slug });
    if (!pk) notFound();

    const [surfaces, links, cities] = await Promise.all([
        getSurfaces({ country_code: pk.country_code!, surface_class: slug }, 60),
        getInternalLinks(pk.id),
        getCityRollups(pk.country_code!, slug),
    ]);

    const countryName = getCountryName(pk.country_code!);
    const className = formatClassName(slug);

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
                { label: className },
            ]} />

            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800,
                    color: '#e8eaf0', lineHeight: 1.2, marginBottom: '0.5rem',
                }}>
                    {pk.h1}
                </h1>
                <p style={{ color: '#8892a8', fontSize: '1.05rem' }}>
                    {pk.entity_count.toLocaleString()} verified {className.toLowerCase()} locations in {countryName}.
                    Quality scored and claimable.
                </p>
            </header>

            {cities.length > 0 && (
                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ color: '#c8cdd8', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                        Top Cities
                    </h2>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {cities.slice(0, 15).map((c: any) => (
                            <Link
                                key={c.city}
                                href={`/pf/${country}/${c.city?.toLowerCase().replace(/\s+/g, '-')}/${slug}`}
                                style={{
                                    background: 'rgba(100,120,255,0.08)',
                                    border: '1px solid rgba(100,120,255,0.12)',
                                    borderRadius: '8px', padding: '6px 14px',
                                    color: '#8090ff', fontSize: '0.85rem', textDecoration: 'none',
                                }}
                            >
                                {c.city} ({c.total})
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <SurfaceGrid surfaces={surfaces} />
            <ClaimBanner count={surfaces.filter(s => s.is_claimable).length} />
            <RelatedLinks links={links} />

            <section style={{ margin: '3rem 0' }}>
                <h2 style={{ color: '#c8cdd8', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Frequently Asked Questions
                </h2>
                <details style={{ color: '#9ca3af', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#c8cdd8', fontWeight: 500 }}>
                        How many {className.toLowerCase()} are in {countryName}?
                    </summary>
                    <p style={{ paddingTop: '0.5rem', paddingLeft: '1rem' }}>
                        HAUL COMMAND tracks {pk.entity_count.toLocaleString()} {className.toLowerCase()} across {countryName},
                        each verified and quality scored.
                    </p>
                </details>
                <details style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#c8cdd8', fontWeight: 500 }}>
                        Can I claim a listing?
                    </summary>
                    <p style={{ paddingTop: '0.5rem', paddingLeft: '1rem' }}>
                        Yes. Click any listing to view details and claim it in under 30 seconds.
                        Verified operators get priority placement, lead routing, and corridor visibility.
                    </p>
                </details>
            </section>
        </main>
    );
}
