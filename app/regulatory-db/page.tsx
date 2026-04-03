import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import { FreshnessConfidenceBadge } from '@/components/legal/FreshnessConfidenceBadge';
import type { LegalConfidence } from '@/lib/legal/freshness-confidence';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { OperatorsNeededCTA } from '@/components/seo/ConversionCTAs';
import '@/components/ai-search/answer-block.css';
import '@/components/hyperlocal/hyperlocal.css';

export const revalidate = 3600; // Rebuild hourly (state_regulations updates frequently)

export const metadata: Metadata = {
    title: 'Pilot Car Requirements by State & Province 2026 | Haul Command',
    description: 'Searchable database of oversize load escort vehicle regulations for all 50 US states and 10 Canadian provinces. Updated 2026.',
    openGraph: {
        title: 'Pilot Car Requirements by State & Province 2026 | Haul Command',
        description: 'State-by-state escort vehicle rules, certification requirements, and reciprocity agreements.',
        url: 'https://haulcommand.com/regulatory-db',
    },
};

interface StateReg {
    state_code: string;
    country: string;
    state_name: string | null;
    single_escort_width_ft: number | null;
    double_escort_width_ft: number | null;
    max_width_ft: number | null;
    night_moves_allowed: boolean | null;
    weekend_moves_allowed: boolean | null;
    certification_required: boolean | null;
    insurance_min_usd: number | null;
    dot_source_url: string | null;
    confidence_score: number | null;
    last_updated_at: string | null;
    notes: string | null;
    reciprocity_states: string[] | null;
}

const COUNTRY_LABELS: Record<string, string> = { US: '🇺🇸 United States', CA: '🍁 Canada' };

const STATE_NAMES_FULL: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    // Canada
    AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
    NL: 'Newfoundland', NS: 'Nova Scotia', ON: 'Ontario', PE: 'Prince Edward Island',
    QC: 'Quebec', SK: 'Saskatchewan',
};

export default async function RegulatoryDbPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; country?: string }>;
}) {
    const resolvedParams = await searchParams;
    const supabase = supabaseServer();
    const country = resolvedParams.country?.toUpperCase();
    const query = resolvedParams.q?.trim() ?? '';

    let dbQuery = supabase
        .from('state_regulations')
        .select('state_code, country, state_name, single_escort_width_ft, double_escort_width_ft, max_width_ft, night_moves_allowed, weekend_moves_allowed, certification_required, insurance_min_usd, dot_source_url, confidence_score, last_updated_at, notes, reciprocity_states')
        .order('country')
        .order('state_code')
        .limit(200);

    if (country) dbQuery = dbQuery.eq('country', country);
    if (query) dbQuery = dbQuery.ilike('notes', `%${query}%`);

    const { data: regs = [] } = await dbQuery;

    // Group by country → region
    const grouped: Record<string, StateReg[]> = {};
    for (const reg of (regs ?? []) as StateReg[]) {
        const c = reg.country ?? 'US';
        if (!grouped[c]) grouped[c] = [];
        grouped[c].push(reg);
    }

    const hasResults = Object.keys(grouped).length > 0;

    return (
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#d97706', textTransform: 'uppercase', marginBottom: 10 }}>
                    ⚖️ Regulatory Database
                </div>
                <h1 style={{ fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, margin: '0 0 12px' }}>
                    Pilot Car Requirements by State & Province
                </h1>
                <p style={{ fontSize: 15, color: 'var(--hc-muted, #aaa)', maxWidth: 640, margin: '0 0 24px' }}>
                    Official escort vehicle certification, equipment, and reciprocity rules — sourced from state DOTs and provincial transport ministries.
                </p>

                {/* AI Answer Block — citation-ready for search engines */}
                <StaticAnswerBlock
                    question="What are the pilot car requirements for oversize loads in the United States and Canada?"
                    answer="Pilot car (escort vehicle) requirements vary by state and province. Most US states require at least one escort vehicle for loads exceeding 12-14 feet in width, with two escorts required above 16 feet. Certification requirements, insurance minimums, and equipment standards differ by jurisdiction."
                    confidence="verified_but_review_due"
                    lastVerified={new Date().toISOString()}
                    source="State DOT & Provincial Transport Ministries"
                    sourceUrl="/regulatory-db"
                    ctaLabel="Search Requirements by State"
                    ctaUrl="#search"
                />

                {/* Search + filter */}
                <form method="GET" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        name="q"
                        defaultValue={query}
                        placeholder="Search rules (e.g. 'sign size', 'radio', 'reciprocity')..."
                        style={inputStyle}
                    />
                    <select name="country" defaultValue={country ?? ''} style={selectStyle}>
                        <option value="">All Countries</option>
                        <option value="US">🇺🇸 United States</option>
                        <option value="CA">🍁 Canada</option>
                    </select>
                    <button type="submit" style={btnStyle}>Search</button>
                    {(query || country) && (
                        <Link aria-label="Navigation Link" href="/regulatory-db" style={{ ...btnStyle, background: 'transparent', border: '1px solid var(--hc-border,#333)' }}>
                            Clear
                        </Link>
                    )}
                </form>
            </div>

            {/* Results */}
            {!hasResults ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--hc-muted, #888)' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                    {query
                        ? `No states found matching "${query}". Try a different search term.`
                        : 'No state regulations loaded yet. Check back soon.'}
                </div>
            ) : (
                Object.entries(grouped).map(([countryCode, stateRegs]) => (
                    <section key={countryCode} style={{ marginBottom: 48 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid var(--hc-border,#222)' }}>
                            {COUNTRY_LABELS[countryCode] ?? countryCode}
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                            {stateRegs.map((reg) => {
                                const confidence = reg.confidence_score ?? 0;
                                const confColor = confidence >= 0.8 ? '#10b981' : confidence >= 0.5 ? '#f59e0b' : '#ef4444';
                                return (
                                    <div key={reg.state_code} style={ruleCard}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <Link aria-label="Navigation Link" href={`/requirements/${reg.state_code.toLowerCase()}/escort-vehicle-rules`}
                                                style={{ fontSize: 15, fontWeight: 800, color: '#d97706', textDecoration: 'none' }}>
                                                {STATE_NAMES_FULL[reg.state_code] ?? reg.state_code}
                                            </Link>
                                            <FreshnessConfidenceBadge
                                                confidence={
                                                    confidence >= 0.8 ? 'verified_current' as LegalConfidence
                                                    : confidence >= 0.5 ? 'verified_but_review_due' as LegalConfidence
                                                    : confidence > 0 ? 'partially_verified' as LegalConfidence
                                                    : 'seeded_needs_human_review' as LegalConfidence
                                                }
                                                lastVerified={reg.last_updated_at}
                                                officialSource={reg.dot_source_url ? 'State DOT' : null}
                                                officialSourceUrl={reg.dot_source_url}
                                                compact={true}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: 'var(--hc-muted, #aaa)' }}>
                                            {reg.single_escort_width_ft && (
                                                <div><span style={{ color: '#f59e0b', fontWeight: 700 }}>{reg.single_escort_width_ft}′+</span> 1 escort</div>
                                            )}
                                            {reg.double_escort_width_ft && (
                                                <div><span style={{ color: '#ef4444', fontWeight: 700 }}>{reg.double_escort_width_ft}′+</span> 2 escorts</div>
                                            )}
                                            <div>Night: <span style={{ color: reg.night_moves_allowed ? '#10b981' : '#ef4444', fontWeight: 700 }}>{reg.night_moves_allowed == null ? '?' : reg.night_moves_allowed ? 'OK' : 'No'}</span></div>
                                            <div>Cert: <span style={{ color: reg.certification_required ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{reg.certification_required == null ? '?' : reg.certification_required ? 'Required' : 'No'}</span></div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                                            <Link aria-label="Navigation Link" href={`/requirements/${reg.state_code.toLowerCase()}/escort-vehicle-rules`}
                                                style={{ fontSize: 10, color: '#d97706', fontWeight: 700, textDecoration: 'none' }}>
                                                Full Details →
                                            </Link>
                                            {reg.dot_source_url && (
                                                <a href={reg.dot_source_url} target="_blank" rel="noopener noreferrer"
                                                    style={{ fontSize: 10, color: '#6b7280', textDecoration: 'none' }}>
                                                    DOT Source ↗
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))
            )}

            {/* Snippet Injector — featured snippet capture */}
            <SnippetInjector
                blocks={['definition', 'faq', 'steps', 'regulation_summary']}
                term="escort vehicle"
                geo="United States"
                country="US"
            />

            {/* Operators Needed conversion CTA */}
            <OperatorsNeededCTA
                surfaceName="underserved states"
                operatorsNeeded={50}
            />

            {/* SEO footer */}
            <section style={{ borderTop: '1px solid var(--hc-border, #222)', paddingTop: 28, marginTop: 8 }}>
                <p style={{ fontSize: 13, color: 'var(--hc-muted, #aaa)', lineHeight: 1.7, maxWidth: 700 }}>
                    Haul Command aggregates escort vehicle requirements from{' '}
                    <Link aria-label="Navigation Link" href="/united-states" style={{ color: '#d97706' }}>all 50 US states</Link> and{' '}
                    <Link aria-label="Navigation Link" href="/canada" style={{ color: '#d97706' }}>10 Canadian provinces</Link>.
                    Regulations are updated periodically. Always verify with your state DOT before dispatch.
                    For permit-specific questions, use the{' '}
                    <Link aria-label="Navigation Link" href="/tools/permit-calculator" style={{ color: '#d97706' }}>permit calculator</Link>.
                </p>
            </section>
        </main>
    );
}

// Styles
const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 10, fontSize: 13, minWidth: 280, flex: 1,
    border: '1px solid var(--hc-border, #333)', background: 'var(--hc-panel, #1a1a1a)',
    color: 'var(--hc-text, #f5f5f5)', outline: 'none',
};
const selectStyle: React.CSSProperties = {
    padding: '10px 12px', borderRadius: 10, fontSize: 13,
    border: '1px solid var(--hc-border, #333)', background: 'var(--hc-panel, #1a1a1a)',
    color: 'var(--hc-text, #f5f5f5)', outline: 'none', cursor: 'pointer',
};
const btnStyle: React.CSSProperties = {
    padding: '10px 20px', background: '#d97706', color: '#111',
    fontWeight: 800, fontSize: 13, borderRadius: 10, border: 'none',
    cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
};
const ruleCard: React.CSSProperties = {
    padding: '14px 16px', background: 'var(--hc-panel, #141414)',
    border: '1px solid var(--hc-border, #222)', borderRadius: 10,
};
const categoryBadge: React.CSSProperties = {
    display: 'inline-block', padding: '2px 8px', background: 'rgba(217,119,6,0.12)',
    color: '#d97706', border: '1px solid rgba(217,119,6,0.25)',
    borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
};
