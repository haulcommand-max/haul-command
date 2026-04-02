import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    REGULATIONS,
    getRegulation,
    type CountryRegulation,
    type EscortThreshold,
} from '@/lib/regulations/global-regulations-db';

// ── Static params — pre-render all country pages ──
export async function generateStaticParams() {
    return REGULATIONS.map(r => ({ country: r.countryCode.toLowerCase() }));
}

// ── Dynamic metadata ──
export async function generateMetadata({
    params,
}: {
    params: Promise<{ country: string }>;
}): Promise<Metadata> {
    const { country } = await params;
    const reg = getRegulation(country.toUpperCase());
    if (!reg) return { title: 'Country Not Found' };

    const term = reg.terminology.primary;
    return {
        title: `${reg.countryName} ${capitalizeFirst(term)} Regulations & Escort Requirements`,
        description: reg.voiceAnswer.slice(0, 160),
        keywords: [
            `${term} ${reg.countryName}`,
            `escort requirements ${reg.countryName}`,
            `oversize load regulations ${reg.countryName}`,
            `pilot car rules ${reg.countryName}`,
            `${reg.terminology.primary} near me`,
        ],
        alternates: { canonical: `/regulations/${country.toLowerCase()}` },
    };
}

function capitalizeFirst(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Styled sub-components ──

function ThresholdRow({ t, idx }: { t: EscortThreshold; idx: number }) {
    const typeColors: Record<string, string> = {
        civil: '#4ADE80',
        police: '#F87171',
        both: '#FBBF24',
        certified: '#60A5FA',
        case_by_case: '#A78BFA',
    };
    return (
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#D1D5DB' }}>
                {t.condition}
            </td>
            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        background: 'rgba(212,168,67,0.1)',
                        color: '#D4A843',
                        border: '1px solid rgba(212,168,67,0.2)',
                    }}
                >
                    {t.escortsRequired}
                </span>
            </td>
            <td style={{ padding: '0.75rem 1rem' }}>
                <span
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        color: typeColors[t.escortType] ?? '#9CA3AF',
                        background: `${typeColors[t.escortType] ?? '#9CA3AF'}15`,
                    }}
                >
                    {t.escortType.replace(/_/g, ' ')}
                </span>
            </td>
            <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#9CA3AF' }}>
                {t.notes ?? '—'}
            </td>
        </tr>
    );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div
            style={{
                padding: '1.25rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
            }}
        >
            <h3
                style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#6B7280',
                    marginBottom: '0.75rem',
                }}
            >
                {label}
            </h3>
            {children}
        </div>
    );
}

// ── Main Page ──

export default async function CountryRegulationPage({
    params,
}: {
    params: Promise<{ country: string }>;
}) {
    const { country } = await params;
    const reg = getRegulation(country.toUpperCase());
    if (!reg) notFound();

    const term = reg.terminology.primary;
    const dq = reg.dataQuality;
    const dqColor = dq === 'high' ? '#4ADE80' : dq === 'medium' ? '#FBBF24' : '#F87171';

    return (
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
            {/* Breadcrumb */}
            <nav style={{ marginBottom: '1.5rem', fontSize: '0.8125rem', color: '#6B7280' }}>
                <Link href="/regulations" style={{ color: '#9CA3AF', textDecoration: 'none' }}>
                    Regulations
                </Link>
                <span style={{ margin: '0 0.5rem' }}>›</span>
                <span style={{ color: '#D1D5DB' }}>{reg.countryName}</span>
            </nav>

            {/* Hero */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.125rem 0.5rem', borderRadius: '9999px', border: '1px solid rgba(212,168,67,0.3)', color: '#D4A843' }}>
                        Tier {reg.tier}
                    </span>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.125rem 0.5rem', borderRadius: '9999px', border: `1px solid ${dqColor}33`, color: dqColor }}>
                        {dq} confidence
                    </span>
                </div>
                <h1
                    className="speakable-headline"
                    data-speakable="true"
                    style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.025em',
                        lineHeight: 1.2,
                        color: '#F9FAFB',
                        marginBottom: '1rem',
                    }}
                >
                    {reg.countryName} {capitalizeFirst(term)} Regulations
                </h1>

                {/* Voice-ready answer block */}
                <div
                    className="speakable-summary"
                    data-speakable="true"
                    style={{
                        padding: '1.25rem 1.5rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(212,168,67,0.06)',
                        borderLeft: '3px solid #D4A843',
                        fontSize: '1rem',
                        lineHeight: 1.7,
                        color: '#D1D5DB',
                    }}
                >
                    {reg.voiceAnswer}
                </div>
            </div>

            {/* Standard Vehicle Limits */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '2.5rem',
                }}
            >
                {[
                    { label: 'Max Width', value: `${reg.standardLimits.widthM}m`, icon: '↔️' },
                    ...(reg.standardLimits.heightM
                        ? [{ label: 'Max Height', value: `${reg.standardLimits.heightM}m`, icon: '↕️' }]
                        : []),
                    ...(reg.standardLimits.lengthM
                        ? [{ label: 'Max Length', value: `${reg.standardLimits.lengthM}m`, icon: '📏' }]
                        : []),
                    ...(reg.standardLimits.weightT
                        ? [{ label: 'Max Weight', value: `${reg.standardLimits.weightT}t`, icon: '⚖️' }]
                        : []),
                ].map(stat => (
                    <div
                        key={stat.label}
                        style={{
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.02)',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F3F4F6' }}>
                            {stat.value}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Escort Thresholds Table */}
            {reg.escortThresholds.length > 0 && (
                <section style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F3F4F6', marginBottom: '1rem' }}>
                        Escort Thresholds
                    </h2>
                    <div style={{ overflowX: 'auto', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Condition
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Escorts
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Type
                                    </th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Notes
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reg.escortThresholds.map((t, i) => (
                                    <ThresholdRow key={i} t={t} idx={i} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Info Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2.5rem',
                }}
            >
                {/* Terminology */}
                <InfoBlock label="Local Terminology">
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#F3F4F6', margin: '0 0 0.25rem' }}>
                        {reg.terminology.primary}
                    </p>
                    {reg.terminology.secondary && reg.terminology.secondary.length > 0 && (
                        <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', margin: 0 }}>
                            Also known as: {reg.terminology.secondary.join(', ')}
                        </p>
                    )}
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                        Language: {reg.terminology.language}
                    </p>
                </InfoBlock>

                {/* Permit System */}
                <InfoBlock label="Permit System">
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#D1D5DB', margin: '0 0 0.25rem' }}>
                        {reg.permitSystem.authority}
                    </p>
                    {reg.permitSystem.digitalSystem && (
                        <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', margin: '0 0 0.25rem' }}>
                            Digital system: <strong>{reg.permitSystem.digitalSystem}</strong>
                        </p>
                    )}
                    {reg.permitSystem.permitTypes && (
                        <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', margin: 0 }}>
                            Types: {reg.permitSystem.permitTypes.join(', ')}
                        </p>
                    )}
                    {reg.permitSystem.url && (
                        <a
                            href={reg.permitSystem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-block',
                                marginTop: '0.5rem',
                                fontSize: '0.75rem',
                                color: '#D4A843',
                                textDecoration: 'none',
                            }}
                        >
                            Official website →
                        </a>
                    )}
                </InfoBlock>

                {/* Equipment */}
                {reg.equipment && reg.equipment.length > 0 && (
                    <InfoBlock label="Required Equipment">
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {reg.equipment.map((item, i) => (
                                <li
                                    key={i}
                                    style={{
                                        fontSize: '0.8125rem',
                                        color: '#D1D5DB',
                                        padding: '0.25rem 0',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    }}
                                >
                                    <span style={{ color: '#4ADE80', marginRight: '0.5rem' }}>✓</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </InfoBlock>
                )}

                {/* Certification */}
                {reg.certification && (
                    <InfoBlock label="Certification">
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: reg.certification.required ? '#F87171' : '#4ADE80',
                                }}
                            >
                                {reg.certification.required ? '⚠ REQUIRED' : '✓ Recommended'}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', margin: 0 }}>
                            {reg.certification.details}
                        </p>
                    </InfoBlock>
                )}

                {/* Escort Categories (e.g. BF3/BF4) */}
                {reg.escortCategories && reg.escortCategories.length > 0 && (
                    <InfoBlock label="Escort Categories">
                        {reg.escortCategories.map((cat, i) => (
                            <div key={i} style={{ marginBottom: i < reg.escortCategories!.length - 1 ? '0.75rem' : 0 }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#60A5FA', margin: '0 0 0.125rem' }}>
                                    {cat.name}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>
                                    Triggers: {cat.triggers}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>
                                    {cat.description}
                                </p>
                            </div>
                        ))}
                    </InfoBlock>
                )}

                {/* Restrictions */}
                {reg.restrictions && reg.restrictions.length > 0 && (
                    <InfoBlock label="Travel Restrictions">
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {reg.restrictions.map((r, i) => (
                                <li
                                    key={i}
                                    style={{
                                        fontSize: '0.8125rem',
                                        color: '#FBBF24',
                                        padding: '0.25rem 0',
                                    }}
                                >
                                    <span style={{ marginRight: '0.5rem' }}>⚠</span>
                                    {r}
                                </li>
                            ))}
                        </ul>
                    </InfoBlock>
                )}
            </div>

            {/* CTA */}
            <div
                style={{
                    padding: '1.5rem 2rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.02))',
                    border: '1px solid rgba(212,168,67,0.15)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                }}
            >
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F3F4F6', margin: '0 0 0.25rem' }}>
                        Need a {term} in {reg.countryName}?
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>
                        Find verified operators in our directory — instant availability, reviews, and dispatch.
                    </p>
                </div>
                <Link
                    href={`/directory?country=${reg.countryCode}`}
                    style={{
                        padding: '0.625rem 1.25rem',
                        borderRadius: '0.5rem',
                        background: '#D4A843',
                        color: '#0B0B0C',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                    }}
                >
                    Find {capitalizeFirst(term)} Operators →
                </Link>
            </div>

            {/* Structured Data — FAQPage + SpeakableSpecification */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: [
                            {
                                '@type': 'Question',
                                name: `Do I need a ${term} in ${reg.countryName}?`,
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: reg.voiceAnswer,
                                },
                            },
                            {
                                '@type': 'Question',
                                name: `What are the escort requirements in ${reg.countryName}?`,
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: reg.escortThresholds
                                        .map(
                                            t =>
                                                `${t.condition}: ${t.escortsRequired} ${t.escortType} escort(s)${t.notes ? ` (${t.notes})` : ''}`,
                                        )
                                        .join('. '),
                                },
                            },
                            {
                                '@type': 'Question',
                                name: `Who issues oversize load permits in ${reg.countryName}?`,
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: `Permits are issued by ${reg.permitSystem.authority}${reg.permitSystem.digitalSystem ? ` via the ${reg.permitSystem.digitalSystem} system` : ''}.${reg.permitSystem.permitTypes ? ` Available permit types: ${reg.permitSystem.permitTypes.join(', ')}.` : ''}`,
                                },
                            },
                        ],
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: `${reg.countryName} ${capitalizeFirst(term)} Regulations`,
                        url: `https://www.haulcommand.com/regulations/${reg.countryCode.toLowerCase()}`,
                        speakable: {
                            '@type': 'SpeakableSpecification',
                            cssSelector: ['.speakable-headline', '.speakable-summary'],
                        },
                    }),
                }}
            />
        </div>
    );
}
