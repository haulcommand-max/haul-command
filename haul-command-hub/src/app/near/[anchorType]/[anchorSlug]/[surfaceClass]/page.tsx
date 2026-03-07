import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPageKey, getInternalLinks, formatClassName } from '@/lib/page-factory';
import { ClaimBanner } from '@/components/page-factory/ClaimBanner';
import { RelatedLinks } from '@/components/page-factory/RelatedLinks';
import { Breadcrumbs } from '@/components/page-factory/Breadcrumbs';

type Props = { params: Promise<{ anchorType: string; anchorSlug: string; surfaceClass: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { anchorType, anchorSlug, surfaceClass } = await params;
    const pk = await getPageKey('nearby_cluster', { anchor_type: anchorType, anchor_slug: anchorSlug, surface_class: surfaceClass });
    if (!pk) return { title: 'Not Found' };
    return {
        title: pk.title + ' | HAUL COMMAND',
        description: pk.meta_description,
        robots: pk.indexable ? 'index,follow' : 'noindex,nofollow',
        alternates: { canonical: pk.canonical_slug },
    };
}

export const revalidate = 86400;

export default async function NearbyClusterPage({ params }: Props) {
    const { anchorType, anchorSlug, surfaceClass } = await params;
    const pk = await getPageKey('nearby_cluster', { anchor_type: anchorType, anchor_slug: anchorSlug, surface_class: surfaceClass });
    if (!pk) notFound();

    const className = formatClassName(surfaceClass);
    const anchorName = anchorSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const links = await getInternalLinks(pk.id);

    return (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', minHeight: '100vh' }}>
            <Breadcrumbs crumbs={[
                { label: formatClassName(anchorType) },
                { label: anchorName },
                { label: `Nearby ${className}` },
            ]} />

            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)', fontWeight: 800,
                    color: '#e8eaf0', marginBottom: '0.5rem',
                }}>{pk.h1}</h1>
                <p style={{ color: '#8892a8', fontSize: '1rem' }}>
                    {pk.entity_count.toLocaleString()} {className.toLowerCase()} within 40km radius.
                </p>
            </header>

            <ClaimBanner count={pk.entity_count} />
            <RelatedLinks links={links} />
        </main>
    );
}
