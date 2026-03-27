import { createClient } from '@/utils/supabase/server';
import { Metadata } from 'next';
import Link from 'next/link';

const COUNTRY_NAMES: Record<string, string> = {
    US: 'United States', CA: 'Canada', AU: 'Australia', GB: 'United Kingdom', NZ: 'New Zealand',
    ZA: 'South Africa', DE: 'Germany', NL: 'Netherlands', AE: 'United Arab Emirates', BR: 'Brazil',
    IE: 'Ireland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', BE: 'Belgium',
    AT: 'Austria', CH: 'Switzerland', ES: 'Spain', FR: 'France', IT: 'Italy', PT: 'Portugal',
    SA: 'Saudi Arabia', QA: 'Qatar', MX: 'Mexico', PL: 'Poland', CZ: 'Czech Republic',
    SK: 'Slovakia', HU: 'Hungary', SI: 'Slovenia', EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania',
    HR: 'Croatia', RO: 'Romania', BG: 'Bulgaria', GR: 'Greece', TR: 'Turkey', KW: 'Kuwait',
    OM: 'Oman', BH: 'Bahrain', SG: 'Singapore', MY: 'Malaysia', JP: 'Japan', KR: 'South Korea',
    CL: 'Chile', AR: 'Argentina', CO: 'Colombia', PE: 'Peru', UY: 'Uruguay', PA: 'Panama', CR: 'Costa Rica',
};
const FLAG: Record<string, string> = {
    US: '🇺🇸', CA: '🇨🇦', AU: '🇦🇺', GB: '🇬🇧', NZ: '🇳🇿', ZA: '🇿🇦', DE: '🇩🇪', NL: '🇳🇱', AE: '🇦🇪', BR: '🇧🇷',
    IE: '🇮🇪', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', BE: '🇧🇪', AT: '🇦🇹', CH: '🇨🇭', ES: '🇪🇸', FR: '🇫🇷',
    IT: '🇮🇹', PT: '🇵🇹', SA: '🇸🇦', QA: '🇶🇦', MX: '🇲🇽', PL: '🇵🇱', CZ: '🇨🇿', SK: '🇸🇰', HU: '🇭🇺', SI: '🇸🇮',
    EE: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹', HR: '🇭🇷', RO: '🇷🇴', BG: '🇧🇬', GR: '🇬🇷', TR: '🇹🇷', KW: '🇰🇼', OM: '🇴🇲',
    BH: '🇧🇭', SG: '🇸🇬', MY: '🇲🇾', JP: '🇯🇵', KR: '🇰🇷', CL: '🇨🇱', AR: '🇦🇷', CO: '🇨🇴', PE: '🇵🇪', UY: '🇺🇾', PA: '🇵🇦', CR: '🇨🇷',
};
const CATEGORY_LABELS: Record<string, string> = {
    escort_operations: '🚗 Escort Operations',
    regulations: '📋 Regulations & Permits',
    equipment: '🔧 Equipment',
    operations: '🏗️ Operations',
    safety: '⚡ Safety',
    finance: '💰 Finance & Rates',
    cargo_types: '📦 Cargo Types',
    specialized_hauling: '🏭 Specialized Hauling',
    infrastructure: '🛤️ Infrastructure',
};

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
    const { country } = await params;
    const cc = country.toUpperCase();
    const name = COUNTRY_NAMES[cc] || cc;
    return {
        title: `${name} Heavy Haul & Pilot Car Glossary | HAUL COMMAND`,
        description: `Complete glossary of ${name} oversize transport, escort vehicle, and heavy haul terminology. Local terms, regulations, and industry language for ${name}.`,
        openGraph: {
            title: `${FLAG[cc] || ''} ${name} Heavy Haul Glossary`,
            description: `Master the local terminology for oversize transport and escort operations in ${name}.`,
        },
    };
}

export default async function GlossaryCountryPage({ params }: { params: Promise<{ country: string }> }) {
    const { country } = await params;
    const cc = country.toUpperCase();
    const name = COUNTRY_NAMES[cc] || cc;
    const flag = FLAG[cc] || '';
    const sb = await createClient();

    const { data: terms } = await sb.rpc('hc_glossary_for_country', { p_country_code: cc });
    const grouped = (terms || []).reduce((acc: Record<string, any[]>, t: any) => {
        const cat = t.category || 'general';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(t);
        return acc;
    }, {});

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: `${name} Heavy Haul & Escort Glossary`,
        description: `Localized oversize transport terminology for ${name}`,
        hasDefinedTerm: (terms || []).map((t: any) => ({
            '@type': 'DefinedTerm',
            name: t.local_term || t.term,
            description: t.snippet_answer || t.short_definition,
        })),
    };

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: (terms || [])
            .filter((t: any) => t.snippet_question && t.snippet_answer)
            .map((t: any) => ({
                '@type': 'Question',
                name: t.snippet_question,
                acceptedAnswer: { '@type': 'Answer', text: t.snippet_answer },
            })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <main style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
                {/* Hero */}
                <section style={{
                    padding: '3rem 2rem 2rem', textAlign: 'center',
                    background: 'linear-gradient(180deg, #14120e 0%, #0A0A0A 100%)',
                    borderBottom: '1px solid rgba(198,146,58,0.15)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{flag}</div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                        <span style={{ color: '#C6923A' }}>{name}</span> Glossary
                    </h1>
                    <p style={{ color: '#8fa3b8', maxWidth: '640px', margin: '0.75rem auto 0', lineHeight: 1.6 }}>
                        Localized terminology for heavy haul, oversize transport, and escort operations in {name}.
                        Speak the language that builds trust in your market.
                    </p>
                    <div style={{
                        marginTop: '1rem', display: 'inline-flex', gap: '1.5rem',
                        background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.18)',
                        borderRadius: '12px', padding: '0.75rem 1.5rem',
                    }}>
                        <span style={{ color: '#8fa3b8', fontSize: '0.85rem' }}>
                            <strong style={{ color: '#C6923A' }}>{terms?.length || 0}</strong> terms localized
                        </span>
                        <span style={{ color: '#8fa3b8', fontSize: '0.85rem' }}>
                            <strong style={{ color: '#C6923A' }}>{Object.keys(grouped).length}</strong> categories
                        </span>
                    </div>
                </section>

                {/* Country nav */}
                <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'auto' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {Object.entries(FLAG).map(([code, f]) => (
                            <Link
                                key={code}
                                href={`/glossary/${code.toLowerCase()}`}
                                style={{
                                    padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem',
                                    textDecoration: 'none', transition: 'all 0.2s',
                                    background: code === cc ? 'rgba(198,146,58,0.2)' : 'rgba(255,255,255,0.04)',
                                    border: code === cc ? '1px solid rgba(198,146,58,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                    color: code === cc ? '#C6923A' : '#8fa3b8',
                                }}
                            >
                                {f}
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* Glossary grid */}
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
                    {Object.entries(grouped).map(([category, catTerms]) => (
                        <section key={category} style={{ marginBottom: '2.5rem' }}>
                            <h2 style={{
                                fontSize: '1.1rem', fontWeight: 700, color: '#C6923A',
                                borderBottom: '1px solid rgba(198,146,58,0.2)', paddingBottom: '0.5rem', marginBottom: '1rem',
                            }}>
                                {CATEGORY_LABELS[category] || category}
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                                {(catTerms as any[]).map((t: any, i: number) => (
                                    <article key={i} style={{
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '12px', padding: '1.25rem', transition: 'border-color 0.2s',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                                                    {t.local_term || t.term}
                                                </h3>
                                                {t.local_term && t.local_term !== t.term && (
                                                    <p style={{ fontSize: '0.75rem', color: '#6b7b8e', margin: '0.15rem 0 0' }}>
                                                        US equiv: {t.term}
                                                    </p>
                                                )}
                                            </div>
                                            <span style={{
                                                fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px',
                                                background: 'rgba(198,146,58,0.1)', color: '#C6923A',
                                            }}>
                                                {t.language_code}
                                            </span>
                                        </div>
                                        {t.snippet_answer && (
                                            <p style={{ fontSize: '0.85rem', color: '#a0aebf', lineHeight: 1.6, margin: '0.5rem 0 0' }}>
                                                {t.snippet_answer.length > 200 ? t.snippet_answer.slice(0, 200) + '…' : t.snippet_answer}
                                            </p>
                                        )}
                                        {t.cultural_notes && (
                                            <p style={{
                                                fontSize: '0.75rem', color: '#C6923A', marginTop: '0.5rem',
                                                padding: '0.5rem', background: 'rgba(198,146,58,0.06)', borderRadius: '6px',
                                                borderLeft: '2px solid rgba(198,146,58,0.3)',
                                            }}>
                                                ⚡ {t.cultural_notes}
                                            </p>
                                        )}
                                        {t.regulatory_context && (
                                            <p style={{ fontSize: '0.7rem', color: '#5a6a7e', marginTop: '0.4rem' }}>
                                                📋 {t.regulatory_context}
                                            </p>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))}

                    {(!terms || terms.length === 0) && (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6b7b8e' }}>
                            <p style={{ fontSize: '1.2rem' }}>No glossary terms localized for {name} yet.</p>
                            <p style={{ fontSize: '0.9rem' }}>Check back soon — we&apos;re expanding coverage to all 120 countries.</p>
                        </div>
                    )}
                </div>

                {/* Breadcrumbs */}
                <nav style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem 2rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#5a6a7e' }}>
                        <Link href="/" style={{ color: '#8fa3b8', textDecoration: 'none' }}>Home</Link>
                        {' → '}
                        <Link href="/glossary" style={{ color: '#8fa3b8', textDecoration: 'none' }}>Glossary</Link>
                        {' → '}
                        <span style={{ color: '#C6923A' }}>{flag} {name}</span>
                    </div>
                </nav>
            </main>
        </>
    );
}
