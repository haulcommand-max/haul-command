import React from 'react';

/**
 * CountryEquivalentsPanel — "What this is called in other countries"
 * The 10x authority signal for glossary term pages.
 */

interface CountryEquivalent {
    country_code: string;
    country_name: string;
    term: string;
    regulatory_notes: string | null;
}

interface Props {
    conceptName: string;
    equivalents: CountryEquivalent[];
    currentCountry?: string;
}

const FLAG_MAP: Record<string, string> = {
    US: '🇺🇸', CA: '🇨🇦', AU: '🇦🇺', GB: '🇬🇧', NZ: '🇳🇿',
    SE: '🇸🇪', NO: '🇳🇴', AE: '🇦🇪', SA: '🇸🇦', DE: '🇩🇪', ZA: '🇿🇦',
};

export function CountryEquivalentsPanel({ conceptName, equivalents, currentCountry }: Props) {
    if (equivalents.length < 2) return null; // Need at least 2 countries to show comparison

    return (
        <section style={{ marginBottom: '2rem' }}>
            <h2 style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#fff',
                marginBottom: '12px',
                marginTop: 0,
            }}>
                What &ldquo;{conceptName}&rdquo; is called in other countries
            </h2>

            <div style={{
                display: 'grid',
                gap: '1px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '10px',
                overflow: 'hidden',
            }}>
                {equivalents.map(eq => (
                    <div
                        key={`${eq.country_code}-${eq.term}`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 16px',
                            background: eq.country_code === currentCountry
                                ? 'rgba(56,189,248,0.08)'
                                : 'rgba(15,23,42,0.8)',
                        }}
                    >
                        {/* Flag */}
                        <span style={{ fontSize: '20px', flexShrink: 0 }}>
                            {FLAG_MAP[eq.country_code] || '🌐'}
                        </span>

                        {/* Country */}
                        <span style={{
                            width: '120px',
                            flexShrink: 0,
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.5)',
                        }}>
                            {eq.country_name}
                        </span>

                        {/* Local term */}
                        <span style={{
                            fontWeight: 600,
                            color: '#fff',
                            fontSize: '14px',
                            flex: 1,
                        }}>
                            {eq.term}
                            {eq.country_code === currentCountry && (
                                <span style={{
                                    marginLeft: '8px',
                                    fontSize: '10px',
                                    color: '#38bdf8',
                                    fontWeight: 400,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    your region
                                </span>
                            )}
                        </span>

                        {/* Regulatory note */}
                        {eq.regulatory_notes && (
                            <span style={{
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.35)',
                                maxWidth: '200px',
                                textAlign: 'right',
                            }}>
                                {eq.regulatory_notes}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Schema markup for translation equivalents */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'DefinedTerm',
                        name: conceptName,
                        alternateName: equivalents.map(e => e.term),
                        inDefinedTermSet: {
                            '@type': 'DefinedTermSet',
                            name: 'Haul Command Global Transport Glossary',
                            url: 'https://haulcommand.com/glossary',
                        },
                    }),
                }}
            />
        </section>
    );
}
