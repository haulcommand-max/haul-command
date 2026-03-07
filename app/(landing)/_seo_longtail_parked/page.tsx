import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
    generateLongTailPages,
    generateDefinitionBlock,
    generateFAQBlock,
    generateQuickTable,
    generateStepsList,
    CORE_SERVICES,
    EQUIPMENT_MODIFIERS,
    INTENT_MODIFIERS,
} from '@/lib/seo/long-tail-domination';
import { COUNTRY_KEYWORD_SEEDS } from '@/lib/seo/global-keyword-matrix';

// ══════════════════════════════════════════════════════════════
// LONG-TAIL PROGRAMMATIC SEO PAGE
// [service]/[...slug] — handles all combinatorial routes:
//   /pilot-car/us/florida
//   /oversize-escort/wind-turbine/us/texas  
//   /pilot-car/near-me/us
//   /heavy-haul-escort/requirements/au/queensland
// ══════════════════════════════════════════════════════════════

const T = {
    bg: '#fafcff',
    textPrimary: '#0f1729',
    textBody: '#374151',
    textSecondary: '#6b7280',
    accent: '#2563eb',
    accentLight: '#dbeafe',
    gold: '#d97706',
    green: '#059669',
    border: '#e5e7eb',
    cardBg: '#ffffff',
    snippetBg: '#eff6ff',
    tableBg: '#f9fafb',
};

function findPageConfig(segments: string[]) {
    if (segments.length < 2) return null;

    const serviceSlug = segments[0];
    const service = CORE_SERVICES.find(s => s.slug === serviceSlug);
    if (!service) return null;

    // Parse remaining segments
    let equipment: typeof EQUIPMENT_MODIFIERS[0] | undefined;
    let modifier: typeof INTENT_MODIFIERS[0] | undefined;
    let country = '';
    let state = '';
    let city = '';

    const remaining = segments.slice(1);

    for (const seg of remaining) {
        if (!equipment && !modifier && !country) {
            const eq = EQUIPMENT_MODIFIERS.find(e => e.slug === seg);
            if (eq) { equipment = eq; continue; }
            const mod = INTENT_MODIFIERS.find(m => m.slug === seg);
            if (mod) { modifier = mod; continue; }
        }
        if (!country) { country = seg.toUpperCase(); continue; }
        if (!state) { state = seg; continue; }
        if (!city) { city = seg; continue; }
    }

    if (!country) return null;

    const seed = COUNTRY_KEYWORD_SEEDS.find(s => s.iso2 === country);
    const countryName = seed?.country ?? country;
    const localTerms = service.localized[country] ?? [service.label.toLowerCase()];
    const primaryTerm = localTerms[0];

    const geo = city
        ? titleize(city.replace(/-/g, ' '))
        : state
            ? titleize(state.replace(/-/g, ' '))
            : countryName;

    return {
        service, equipment, modifier, country, state, city,
        countryName, primaryTerm, geo, localTerms, seed,
    };
}

function titleize(s: string): string {
    return s.replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({ params }: { params: { slug: string[] } }): Promise<Metadata> {
    const config = findPageConfig(params.slug);
    if (!config) return { title: 'Not Found' };

    const { primaryTerm, geo, equipment, modifier, countryName } = config;
    const title = [
        titleize(primaryTerm),
        equipment ? `for ${equipment.label}` : '',
        modifier?.nearMeBoosted ? modifier.label : '',
        `in ${geo}`,
        modifier && !modifier.nearMeBoosted ? `— ${modifier.label}` : '',
    ].filter(Boolean).join(' ');

    return {
        title: `${title} | Haul Command`,
        description: `Find verified ${primaryTerm} providers${equipment ? ` for ${equipment.label.toLowerCase()} transport` : ''} in ${geo}. Compare operators, rates, and reviews.`,
        openGraph: {
            title,
            description: `Book a ${primaryTerm} in ${geo}. Verified operators, real-time availability.`,
        },
    };
}

export default function LongTailPage({ params }: { params: { slug: string[] } }) {
    const config = findPageConfig(params.slug);
    if (!config) notFound();

    const { service, equipment, modifier, country, state, city, countryName, primaryTerm, geo, localTerms, seed } = config;

    // Generate snippet blocks
    const definition = generateDefinitionBlock(primaryTerm, geo, country);
    const faq = generateFAQBlock(primaryTerm, geo, country);
    const table = generateQuickTable(primaryTerm, geo, country);
    const steps = generateStepsList(primaryTerm, geo);

    // Build breadcrumb
    const breadcrumbs = [
        { label: 'Directory', href: '/directory' },
        { label: countryName, href: `/${service.slug}/${country.toLowerCase()}` },
    ];
    if (state) breadcrumbs.push({ label: titleize(state.replace(/-/g, ' ')), href: `/${service.slug}/${country.toLowerCase()}/${state}` });
    if (city) breadcrumbs.push({ label: titleize(city.replace(/-/g, ' ')), href: `/${service.slug}/${country.toLowerCase()}/${city}` });

    // Internal links
    const relatedEquipment = EQUIPMENT_MODIFIERS
        .filter(e => e.slug !== equipment?.slug && e.commonIn.includes(country))
        .slice(0, 6);

    const relatedModifiers = INTENT_MODIFIERS
        .filter(m => m.slug !== modifier?.slug)
        .slice(0, 6);

    const nearbyStates = (seed?.regions ?? []).slice(0, 8);

    return (
        <div style={{ background: T.bg, minHeight: '100vh' }}>
            {/* JSON-LD Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Service',
                        name: `${titleize(primaryTerm)} in ${geo}`,
                        description: `Professional ${primaryTerm} services in ${geo}`,
                        areaServed: { '@type': 'Place', name: geo },
                        provider: { '@type': 'Organization', name: 'Haul Command' },
                    }),
                }}
            />
            {faq.schemaMarkup && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({ '@context': 'https://schema.org', ...faq.schemaMarkup }),
                    }}
                />
            )}
            {steps.schemaMarkup && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({ '@context': 'https://schema.org', ...steps.schemaMarkup }),
                    }}
                />
            )}

            <div style={{ maxWidth: 880, margin: '0 auto', padding: '32px 20px 80px' }}>
                {/* Breadcrumb */}
                <nav style={{ marginBottom: 24 }}>
                    <ol style={{ display: 'flex', gap: 8, listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: T.textSecondary, flexWrap: 'wrap' }}>
                        {breadcrumbs.map((b, i) => (
                            <li key={b.href} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Link href={b.href} style={{ color: T.accent, textDecoration: 'none', fontWeight: 500 }}>{b.label}</Link>
                                {i < breadcrumbs.length - 1 && <span>›</span>}
                            </li>
                        ))}
                        <li style={{ fontWeight: 700, color: T.textPrimary }}>
                            › {modifier ? modifier.label : equipment ? equipment.label : geo}
                        </li>
                    </ol>
                </nav>

                {/* H1 */}
                <h1 style={{
                    fontSize: 36, fontWeight: 900, color: T.textPrimary,
                    lineHeight: 1.15, marginBottom: 16,
                    fontFamily: "var(--font-display, 'Space Grotesk', system-ui)",
                }}>
                    {titleize(primaryTerm)}
                    {equipment && <span style={{ color: T.accent }}> for {equipment.label}</span>}
                    {modifier?.nearMeBoosted && <span style={{ color: T.green }}> {modifier.label}</span>}
                    {' '}in {geo}
                    {modifier && !modifier.nearMeBoosted && <span style={{ color: T.gold }}> — {modifier.label}</span>}
                </h1>

                <p style={{ fontSize: 18, color: T.textBody, lineHeight: 1.7, marginBottom: 32, maxWidth: 720 }}>
                    Find verified {primaryTerm} operators
                    {equipment ? ` specializing in ${equipment.label.toLowerCase()} transport` : ''}
                    {' '}in {geo}.
                    {modifier?.nearMeBoosted ? ' Available now with real-time dispatch.' : ''}
                    {' '}Compare rates, reviews, and availability on Haul Command.
                </p>

                {/* ── CTA Block */}
                <div style={{
                    display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap',
                }}>
                    <Link href="/directory" style={{
                        padding: '14px 28px', borderRadius: 12,
                        background: T.accent, color: '#fff',
                        fontSize: 15, fontWeight: 800, textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
                    }}>
                        Find Operators in {geo} →
                    </Link>
                    <Link href="/available-now" style={{
                        padding: '14px 28px', borderRadius: 12,
                        background: '#fff', color: T.green,
                        fontSize: 15, fontWeight: 800, textDecoration: 'none',
                        border: `2px solid ${T.green}`,
                    }}>
                        🟢 Available Now
                    </Link>
                </div>

                {/* ── Definition Block (Snippet Bait) */}
                <section style={{
                    padding: 24, borderRadius: 16, marginBottom: 32,
                    background: T.snippetBg, border: `1px solid ${T.accentLight}`,
                }}>
                    <div dangerouslySetInnerHTML={{ __html: definition.html }} style={{
                        fontSize: 16, lineHeight: 1.7, color: T.textBody,
                    }} />
                </section>

                {/* ── Steps (HowTo Schema) */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary, marginBottom: 16 }}>
                        How to Arrange a {titleize(primaryTerm)} in {geo}
                    </h2>
                    <div dangerouslySetInnerHTML={{ __html: steps.html }} style={{
                        fontSize: 15, lineHeight: 1.8, color: T.textBody,
                        paddingLeft: 20,
                    }} />
                </section>

                {/* ── Quick Reference Table (Snippet Target) */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary, marginBottom: 16 }}>
                        Escort Requirements Quick Reference — {geo}
                    </h2>
                    <div style={{
                        borderRadius: 12, overflow: 'hidden',
                        border: `1px solid ${T.border}`,
                    }}>
                        <div dangerouslySetInnerHTML={{ __html: table.html }} style={{
                            fontSize: 14, lineHeight: 1.6,
                        }} />
                    </div>
                    <style>{`
                        table { width: 100%; border-collapse: collapse; }
                        th { background: ${T.tableBg}; padding: 12px 16px; text-align: left; font-weight: 700; font-size: 13px; color: ${T.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid ${T.border}; }
                        td { padding: 12px 16px; border-bottom: 1px solid ${T.border}; color: ${T.textBody}; }
                        tr:hover td { background: ${T.snippetBg}; }
                    `}</style>
                </section>

                {/* ── FAQ Section (FAQPage Schema) */}
                <section style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary, marginBottom: 20 }}>
                        Frequently Asked Questions
                    </h2>
                    <div dangerouslySetInnerHTML={{ __html: faq.html }} style={{
                        fontSize: 15, lineHeight: 1.7, color: T.textBody,
                    }} />
                    <style>{`
                        section [itemtype*="Question"] { margin-bottom: 20px; padding: 20px; background: white; border: 1px solid ${T.border}; border-radius: 12px; }
                        section [itemtype*="Question"] h3 { font-size: 17px; font-weight: 700; color: ${T.textPrimary}; margin: 0 0 8px; }
                        section [itemtype*="Question"] p { margin: 0; color: ${T.textBody}; }
                    `}</style>
                </section>

                {/* ── Internal Links: Related Equipment */}
                {relatedEquipment.length > 0 && (
                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, marginBottom: 14 }}>
                            Related Equipment Escorts in {geo}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                            {relatedEquipment.map(e => (
                                <Link
                                    key={e.slug}
                                    href={`/${service.slug}/${e.slug}/${country.toLowerCase()}${state ? `/${state}` : ''}`}
                                    style={{
                                        display: 'block', padding: '14px 16px',
                                        background: T.cardBg, border: `1px solid ${T.border}`,
                                        borderRadius: 10, textDecoration: 'none',
                                        fontSize: 14, fontWeight: 600, color: T.accent,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {e.label} Escort →
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Internal Links: Nearby Regions */}
                {nearbyStates.length > 0 && (
                    <section style={{ marginBottom: 32 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, marginBottom: 14 }}>
                            {titleize(primaryTerm)} in Other Regions
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {nearbyStates.map(r => (
                                <Link
                                    key={r}
                                    href={`/${service.slug}/${country.toLowerCase()}/${r.toLowerCase().replace(/\s+/g, '-')}`}
                                    style={{
                                        padding: '8px 14px', borderRadius: 8,
                                        background: T.accentLight, color: T.accent,
                                        fontSize: 13, fontWeight: 600, textDecoration: 'none',
                                    }}
                                >
                                    {r}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Internal Links: Modifiers */}
                <section style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, marginBottom: 14 }}>
                        More {titleize(primaryTerm)} Options
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {relatedModifiers.slice(0, 8).map(m => (
                            <Link
                                key={m.slug}
                                href={`/${service.slug}/${m.slug}/${country.toLowerCase()}${state ? `/${state}` : ''}`}
                                style={{
                                    padding: '8px 14px', borderRadius: 8,
                                    background: '#fef3c7', color: T.gold,
                                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                                }}
                            >
                                {m.label}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ── Bottom CTA */}
                <div style={{
                    textAlign: 'center', padding: 40,
                    background: T.cardBg, borderRadius: 16,
                    border: `1px solid ${T.border}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: T.textPrimary, marginBottom: 12 }}>
                        Need a {titleize(primaryTerm)} in {geo}?
                    </h2>
                    <p style={{ fontSize: 16, color: T.textSecondary, marginBottom: 20, maxWidth: 480, margin: '0 auto 20px' }}>
                        Haul Command connects you with verified operators in minutes, not hours.
                    </p>
                    <Link href="/directory" style={{
                        display: 'inline-block', padding: '16px 36px', borderRadius: 12,
                        background: T.accent, color: '#fff',
                        fontSize: 16, fontWeight: 900, textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
                    }}>
                        Browse All Operators →
                    </Link>
                </div>
            </div>
        </div>
    );
}
