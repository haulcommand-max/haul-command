import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

interface Props {
    params: Promise<{ code: string }>;
}

const COUNTRY_META: Record<string, { name: string; flag: string; demonym: string }> = {
    us: { name: 'United States', flag: '🇺🇸', demonym: 'American' },
    ca: { name: 'Canada', flag: '🇨🇦', demonym: 'Canadian' },
    au: { name: 'Australia', flag: '🇦🇺', demonym: 'Australian' },
    gb: { name: 'United Kingdom', flag: '🇬🇧', demonym: 'British' },
    nz: { name: 'New Zealand', flag: '🇳🇿', demonym: 'New Zealand' },
    se: { name: 'Sweden', flag: '🇸🇪', demonym: 'Swedish' },
    no: { name: 'Norway', flag: '🇳🇴', demonym: 'Norwegian' },
    ae: { name: 'United Arab Emirates', flag: '🇦🇪', demonym: 'UAE' },
    sa: { name: 'Saudi Arabia', flag: '🇸🇦', demonym: 'Saudi' },
    de: { name: 'Germany', flag: '🇩🇪', demonym: 'German' },
    za: { name: 'South Africa', flag: '🇿🇦', demonym: 'South African' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { code } = await params;
    const meta = COUNTRY_META[code.toLowerCase()];
    if (!meta) return { title: 'Country Glossary | Haul Command' };

    return {
        title: `${meta.name} Oversize & Escort Terminology | Haul Command Glossary`,
        description: `${meta.demonym} transport terminology for oversize loads, escort vehicles, and heavy haul operations. Country-specific terms and regulatory language.`,
        alternates: { canonical: `/glossary/country/${code.toLowerCase()}` },
        robots: 'index,follow',
    };
}

export default async function CountryGlossaryPage({ params }: Props) {
    const { code } = await params;
    const isoCode = code.toUpperCase();
    const meta = COUNTRY_META[code.toLowerCase()];

    if (!meta) notFound();

    const supabase = await createClient();

    // Fetch all term variants for this country (only indexed ones)
    const { data: variants } = await supabase
        .from('glossary_term_variants')
        .select('concept_slug, term_local, is_primary, search_aliases, regulatory_notes')
        .eq('country_code', isoCode)
        .eq('noindex', false)
        .order('is_primary', { ascending: false });

    // Fetch concept details
    const conceptSlugs = [...new Set((variants ?? []).map(v => v.concept_slug))];
    const { data: concepts } = conceptSlugs.length > 0
        ? await supabase
            .from('glossary_concepts')
            .select('concept_slug, concept_name, concept_description, category')
            .in('concept_slug', conceptSlugs)
        : { data: [] };

    const conceptMap = new Map((concepts ?? []).map(c => [c.concept_slug, c]));

    type VariantWithConcept = {
        concept_slug: string;
        concept_name: string;
        concept_description: string;
        category: string;
        term_local: string;
        is_primary: boolean;
        regulatory_notes: string | null;
        search_aliases: string[];
    };

    const enriched: VariantWithConcept[] = (variants ?? [])
        .filter(v => conceptMap.has(v.concept_slug))
        .map(v => {
            const c = conceptMap.get(v.concept_slug)!;
            return { ...v, concept_name: c.concept_name, concept_description: c.concept_description, category: c.category || 'general' };
        });

    const grouped = new Map<string, VariantWithConcept[]>();
    for (const item of enriched) {
        if (!grouped.has(item.category)) grouped.set(item.category, []);
        grouped.get(item.category)!.push(item);
    }

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${meta.name} Transport Glossary`,
        description: `${meta.demonym} oversize load and escort vehicle terminology.`,
        url: `https://haulcommand.com/glossary/country/${code.toLowerCase()}`,
        numberOfItems: enriched.length,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

            <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>
                <nav style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                    <Link href="/glossary" style={{ color: '#38bdf8', textDecoration: 'none' }}>Glossary</Link>
                    <span style={{ margin: '0 8px' }}>›</span>
                    <span>{meta.name}</span>
                </nav>

                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                    {meta.flag} {meta.name} Transport Terminology
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginBottom: '2rem', maxWidth: '640px' }}>
                    {enriched.length} {meta.demonym} oversize load and escort vehicle terms mapped to global concepts.
                </p>

                {[...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
                    <section key={category} style={{ marginBottom: '2rem' }}>
                        <h2 style={{
                            fontSize: '1rem', fontWeight: 600, color: '#38bdf8',
                            textTransform: 'capitalize',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            paddingBottom: '8px', marginBottom: '12px',
                        }}>
                            {category.replace(/_/g, ' ')}
                        </h2>
                        <div style={{ display: 'grid', gap: '6px' }}>
                            {items.map((item, i) => (
                                <Link
                                    key={`${item.concept_slug}-${i}`}
                                    href={`/glossary/${item.concept_slug}`}
                                    style={{
                                        display: 'block', padding: '10px 14px', borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                                            {item.term_local}
                                        </span>
                                        {item.is_primary && (
                                            <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                primary
                                            </span>
                                        )}
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                                            → {item.concept_name}
                                        </span>
                                    </div>
                                    {item.regulatory_notes && (
                                        <span style={{ display: 'block', fontSize: '12px', color: 'rgba(250,204,21,0.7)', marginTop: '4px' }}>
                                            ⚖ {item.regulatory_notes}
                                        </span>
                                    )}
                                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginTop: '4px', lineHeight: 1.4 }}>
                                        {item.concept_description}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}

                {enriched.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'rgba(255,255,255,0.4)' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
                            {meta.flag} {meta.name} terminology is being mapped.
                        </p>
                        <p style={{ fontSize: '0.9rem' }}>
                            <Link href="/glossary" style={{ color: '#38bdf8', textDecoration: 'none' }}>Browse the global glossary →</Link>
                        </p>
                    </div>
                )}

                <section style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                        Browse other countries
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Object.entries(COUNTRY_META)
                            .filter(([k]) => k !== code.toLowerCase())
                            .map(([k, v]) => (
                                <Link
                                    key={k}
                                    href={`/glossary/country/${k}`}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.6)', fontSize: '13px',
                                        textDecoration: 'none',
                                    }}
                                >
                                    {v.flag} {v.name}
                                </Link>
                            ))}
                    </div>
                </section>
            </div>
        </>
    );
}
