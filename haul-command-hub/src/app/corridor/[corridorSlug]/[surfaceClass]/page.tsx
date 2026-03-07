import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPageKey, getInternalLinks, formatClassName } from '@/lib/page-factory';
import { ClaimBanner } from '@/components/page-factory/ClaimBanner';
import { RelatedLinks } from '@/components/page-factory/RelatedLinks';
import { Breadcrumbs } from '@/components/page-factory/Breadcrumbs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = { params: Promise<{ corridorSlug: string; surfaceClass: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { corridorSlug, surfaceClass } = await params;
    const pk = await getPageKey('corridor_class', { corridor_slug: corridorSlug, surface_class: surfaceClass });
    if (!pk) return { title: 'Not Found' };
    return {
        title: pk.title + ' | HAUL COMMAND',
        description: pk.meta_description,
        robots: pk.indexable ? 'index,follow' : 'noindex,nofollow',
        alternates: { canonical: pk.canonical_slug },
    };
}

export const revalidate = 86400;

export default async function CorridorClassPage({ params }: Props) {
    const { corridorSlug, surfaceClass } = await params;
    const pk = await getPageKey('corridor_class', { corridor_slug: corridorSlug, surface_class: surfaceClass });
    if (!pk) notFound();

    const className = formatClassName(surfaceClass);
    const corridorName = corridorSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Get corridor details
    const { data: corridor } = await supabase
        .from('hc_corridor_edges')
        .select('*')
        .eq('corridor_key', corridorSlug)
        .limit(1)
        .single();

    const links = await getInternalLinks(pk.id);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: pk.title,
        description: pk.meta_description,
        numberOfItems: pk.entity_count,
    };

    return (
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', minHeight: '100vh' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <Breadcrumbs crumbs={[
                { label: 'Corridors', href: '/directory/corridors' },
                { label: corridorName, href: `/directory/corridors/${corridorSlug}` },
                { label: className },
            ]} />

            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)', fontWeight: 800,
                    color: '#e8eaf0', marginBottom: '0.5rem',
                }}>{pk.h1}</h1>
                <p style={{ color: '#8892a8', fontSize: '1rem' }}>
                    {pk.entity_count.toLocaleString()} {className.toLowerCase()} along this corridor.
                </p>

                {corridor && (
                    <div style={{
                        display: 'flex', gap: '1.5rem', marginTop: '1rem',
                        flexWrap: 'wrap', fontSize: '0.85rem',
                    }}>
                        <span style={{ color: '#9ca3af' }}>
                            📍 {corridor.origin_city}, {corridor.origin_state} → {corridor.dest_city}, {corridor.dest_state}
                        </span>
                        {corridor.miles > 0 && (
                            <span style={{ color: '#ffb400' }}>📏 {corridor.miles} mi</span>
                        )}
                        {corridor.cls_tier && (
                            <span style={{
                                background: 'rgba(0,200,150,0.1)', color: '#00c896',
                                padding: '2px 10px', borderRadius: '6px',
                            }}>
                                CLS: {corridor.cls_tier}
                            </span>
                        )}
                    </div>
                )}
            </header>

            <ClaimBanner count={pk.entity_count} />
            <RelatedLinks links={links} />
        </main>
    );
}
