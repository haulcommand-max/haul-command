import type { Metadata } from 'next';
import Link from 'next/link';
import { getGlossaryIndex } from '@/lib/glossary/api';

export const metadata: Metadata = {
    title: 'ESC & Oversize Load Glossary | Haul Command',
    description: 'Complete glossary of escort vehicle, pilot car, oversize load, and heavy haul terminology. Industry-standard definitions used by professionals across North America.',
    alternates: { canonical: '/glossary' },
    robots: 'index,follow',
    openGraph: {
        title: 'ESC & Oversize Load Glossary | Haul Command',
        description: 'Authoritative definitions for the escort and oversize load industry.',
        url: 'https://haulcommand.com/glossary',
    },
};

export default async function GlossaryIndexPage() {
    const terms = await getGlossaryIndex();

    // Group by first letter
    const grouped = new Map<string, typeof terms>();
    for (const t of terms) {
        const letter = t.term[0]?.toUpperCase() || '#';
        if (!grouped.has(letter)) grouped.set(letter, []);
        grouped.get(letter)!.push(t);
    }

    // Get unique categories
    const categories = [...new Set(terms.map(t => t.category).filter(Boolean))] as string[];

    // Schema markup
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'ESC & Oversize Load Glossary',
        description: 'Authoritative glossary of escort vehicle, pilot car, and oversize load terminology.',
        url: 'https://haulcommand.com/glossary',
        numberOfItems: terms.length,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

            <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                    ESC &amp; Oversize Load Glossary
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginBottom: '2rem', maxWidth: '640px' }}>
                    {terms.length} industry terms used by pilot car operators, escort vehicles, and heavy haul professionals across North America.
                </p>

                {/* Category filters */}
                {categories.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
                        {categories.map(cat => (
                            <span key={cat} style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '12px',
                                fontWeight: 500,
                            }}>
                                {cat}
                            </span>
                        ))}
                    </div>
                )}

                {/* A-Z Jump links */}
                <nav style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    {[...grouped.keys()].sort().map(letter => (
                        <a
                            key={letter}
                            href={`#letter-${letter}`}
                            style={{
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#38bdf8',
                                fontSize: '13px',
                                fontWeight: 600,
                                textDecoration: 'none',
                            }}
                        >
                            {letter}
                        </a>
                    ))}
                </nav>

                {/* Term listing */}
                {[...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([letter, letterTerms]) => (
                    <section key={letter} id={`letter-${letter}`} style={{ marginBottom: '2rem' }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: '#38bdf8',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            paddingBottom: '8px',
                            marginBottom: '12px',
                        }}>
                            {letter}
                        </h2>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {letterTerms.map(t => (
                                <Link
                                    key={t.slug}
                                    href={`/glossary/${t.slug}`}
                                    style={{
                                        display: 'block',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        textDecoration: 'none',
                                        transition: 'background 0.15s',
                                    }}
                                >
                                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>
                                        {t.term}
                                    </span>
                                    {t.category && (
                                        <span style={{
                                            marginLeft: '8px',
                                            fontSize: '11px',
                                            color: 'rgba(255,255,255,0.3)',
                                            fontWeight: 400,
                                        }}>
                                            {t.category}
                                        </span>
                                    )}
                                    <span style={{
                                        display: 'block',
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: '13px',
                                        marginTop: '4px',
                                        lineHeight: 1.5,
                                    }}>
                                        {t.short_definition}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}

                {/* Empty state */}
                {terms.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'rgba(255,255,255,0.4)' }}>
                        <p style={{ fontSize: '1.1rem' }}>Glossary terms are being loaded. Check back soon.</p>
                    </div>
                )}
            </div>
        </>
    );
}
