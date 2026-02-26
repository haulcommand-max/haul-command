import React from 'react';
import type { LocalizedGlossaryTerm } from '@/lib/glossary/localized';
import { generateGlossaryHreflang } from '@/lib/glossary/localized';
import { LocaleToggle } from '@/components/i18n/LocaleToggle';
import Link from 'next/link';

/**
 * GlossaryTermView — server-rendered glossary term page content.
 * Renders localized content with hreflang, usage proof, related terms.
 */

interface GlossaryTermViewProps {
    term: LocalizedGlossaryTerm;
    usages: { page_path: string; page_type: string; context_snippet?: string; occurrences: number }[];
    showFrenchToggle: boolean;
}

export function GlossaryTermView({ term, usages, showFrenchToggle }: GlossaryTermViewProps) {
    const hreflangTags = generateGlossaryHreflang(term.slug, term.available_locales);

    return (
        <>
            {/* Hreflang tags (rendered in head via metadata in the page) */}
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'DefinedTerm',
                        name: term.term_display,
                        description: term.short_definition_display,
                        inDefinedTermSet: {
                            '@type': 'DefinedTermSet',
                            name: 'Haul Command ESC Glossary',
                            url: 'https://haulcommand.com/glossary',
                        },
                        ...(term.sources?.length ? { citation: term.sources } : {}),
                    }),
                }}
            />

            <article className="glossary-term-page">
                {/* Header */}
                <header style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                            {term.term_display}
                        </h1>
                        {showFrenchToggle && (
                            <LocaleToggle currentLocale={term.locale} />
                        )}
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {term.category && (
                            <span style={badgeStyle}>{term.category}</span>
                        )}
                        {term.jurisdiction && (
                            <span style={{ ...badgeStyle, borderColor: 'rgba(250,204,21,0.3)', color: '#fbbf24' }}>
                                {term.jurisdiction}
                            </span>
                        )}
                        {(term.acronyms?.length ?? 0) > 0 && term.acronyms.map(a => (
                            <span key={a} style={{ ...badgeStyle, borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                                {a}
                            </span>
                        ))}
                    </div>

                    {/* Short definition — above fold */}
                    <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, maxWidth: '720px' }}>
                        {term.short_definition_display}
                    </p>
                </header>

                {/* Long definition */}
                {term.long_definition_display && (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={sectionHeadingStyle}>Full Definition</h2>
                        <div style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.8 }}>
                            {term.long_definition_display}
                        </div>
                    </section>
                )}

                {/* Example Usage */}
                {term.example_usage_display && (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={sectionHeadingStyle}>Example Usage</h2>
                        <blockquote style={{
                            borderLeft: '3px solid #38bdf8',
                            paddingLeft: '16px',
                            color: 'rgba(255,255,255,0.7)',
                            fontStyle: 'italic',
                        }}>
                            {term.example_usage_display}
                        </blockquote>
                    </section>
                )}

                {/* Common Mistakes */}
                {term.common_mistakes_display && (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={sectionHeadingStyle}>Common Mistakes</h2>
                        <div style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                            {term.common_mistakes_display}
                        </div>
                    </section>
                )}

                {/* Related Terms */}
                {(term.related_slugs?.length ?? 0) > 0 && (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={sectionHeadingStyle}>Related Terms</h2>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {term.related_slugs.map(rs => (
                                <Link
                                    key={rs}
                                    href={`/glossary/${rs}`}
                                    style={{
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#38bdf8',
                                        fontSize: '13px',
                                        textDecoration: 'none',
                                    }}
                                >
                                    {rs.replace(/-/g, ' ')}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Usage Proof */}
                {usages.length > 0 && (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={sectionHeadingStyle}>
                            Used across {usages.length} Haul Command page{usages.length > 1 ? 's' : ''}
                        </h2>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {usages.slice(0, 10).map((u, i) => (
                                <li key={i} style={{ marginBottom: '8px' }}>
                                    <Link
                                        href={u.page_path}
                                        style={{ color: '#38bdf8', fontSize: '13px', textDecoration: 'none' }}
                                    >
                                        {u.page_path}
                                    </Link>
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginLeft: '8px' }}>
                                        {u.page_type}
                                    </span>
                                    {u.context_snippet && (
                                        <span style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>
                                            &ldquo;{u.context_snippet}&rdquo;
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Synonyms */}
                {(term.synonyms?.length ?? 0) > 0 && (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={sectionHeadingStyle}>Also Known As</h2>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {term.synonyms.map(s => (
                                <span key={s} style={{ ...badgeStyle, color: 'rgba(255,255,255,0.6)' }}>{s}</span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Sources */}
                {term.sources && term.sources.length > 0 && (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2 style={sectionHeadingStyle}>Sources</h2>
                        <ol style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', paddingLeft: '20px' }}>
                            {term.sources.map((src: any, i: number) => (
                                <li key={i}>
                                    {typeof src === 'string' ? src : src.title || src.name || JSON.stringify(src)}
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                {/* Last updated */}
                <footer style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '2rem' }}>
                    Last updated: {new Date(term.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </footer>
            </article>
        </>
    );
}

const badgeStyle: React.CSSProperties = {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    border: '1px solid rgba(56,189,248,0.2)',
    color: '#38bdf8',
    background: 'rgba(56,189,248,0.05)',
};

const sectionHeadingStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '12px',
    marginTop: 0,
};
