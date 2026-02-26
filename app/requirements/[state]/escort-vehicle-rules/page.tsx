import Link from 'next/link';
import { ChevronRight, Shield, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

// ── Types from state_regulations ────────────────────────────────────────────

interface StateReg {
    state_code: string;
    country: string;
    state_name: string;
    single_escort_width_ft: number | null;
    double_escort_width_ft: number | null;
    max_width_ft: number | null;
    max_height_ft: number | null;
    max_length_ft: number | null;
    max_weight_lbs: number | null;
    night_moves_allowed: boolean | null;
    weekend_moves_allowed: boolean | null;
    holiday_moves_allowed: boolean | null;
    certification_required: boolean | null;
    insurance_min_usd: number | null;
    dot_source_url: string | null;
    confidence_score: number | null;
    last_updated_at: string | null;
    notes: string | null;
    reciprocity_states: string[] | null;
}

const STATE_NAMES: Record<string, string> = {
    al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California',
    co: 'Colorado', ct: 'Connecticut', de: 'Delaware', fl: 'Florida', ga: 'Georgia',
    hi: 'Hawaii', id: 'Idaho', il: 'Illinois', in: 'Indiana', ia: 'Iowa',
    ks: 'Kansas', ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland',
    ma: 'Massachusetts', mi: 'Michigan', mn: 'Minnesota', ms: 'Mississippi', mo: 'Missouri',
    mt: 'Montana', ne: 'Nebraska', nv: 'Nevada', nh: 'New Hampshire', nj: 'New Jersey',
    nm: 'New Mexico', ny: 'New York', nc: 'North Carolina', nd: 'North Dakota', oh: 'Ohio',
    ok: 'Oklahoma', or: 'Oregon', pa: 'Pennsylvania', ri: 'Rhode Island', sc: 'South Carolina',
    sd: 'South Dakota', tn: 'Tennessee', tx: 'Texas', ut: 'Utah', vt: 'Vermont',
    va: 'Virginia', wa: 'Washington', wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming',
};

// ── Static params ──────────────────────────────────────────────────────────────

export async function generateStaticParams() {
    try {    
        return Object.keys(STATE_NAMES).map(s => ({ state: s }));
    
    } catch {
        return []; // ISR handles at runtime
    }
}

export const dynamic = 'force-dynamic';


// ── Metadata ───────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { state: string } }): Promise<Metadata> {
    const name = STATE_NAMES[params.state.toLowerCase()] ?? params.state.toUpperCase();
    return {
        title: `${name} Escort Vehicle Requirements (2026) | Haul Command`,
        description: `Official ${name} pilot car and escort vehicle requirements. Certification, width thresholds, night/weekend rules, insurance minimums, and reciprocity.`,
        keywords: [`${name} pilot car requirements`, `escort vehicle rules ${name}`, `pilot car certification ${name}`],
        alternates: { canonical: `https://haulcommand.com/requirements/${params.state}/escort-vehicle-rules` },
    };
}

// ── Data fetch ─────────────────────────────────────────────────────────────────

async function getStateReg(stateCode: string): Promise<StateReg | null> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
    const { data } = await supabase
        .from('state_regulations')
        .select('*')
        .eq('state_code', stateCode.toUpperCase())
        .eq('country', 'US')
        .maybeSingle();
    return data as StateReg | null;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function StateRequirementsPage({ params }: { params: { state: string } }) {
    const st = params.state.toLowerCase();
    const name = STATE_NAMES[st] ?? st.toUpperCase();
    const reg = await getStateReg(st);

    const Yes = () => <CheckCircle style={{ width: 14, height: 14, color: '#10b981', display: 'inline' }} />;
    const No = () => <XCircle style={{ width: 14, height: 14, color: '#ef4444', display: 'inline' }} />;
    const Unknown = () => <span style={{ fontSize: 11, color: '#6b7280' }}>—</span>;

    const confidenceColor = !reg?.confidence_score ? '#6b7280'
        : reg.confidence_score >= 0.8 ? '#10b981'
            : reg.confidence_score >= 0.5 ? '#f59e0b'
                : '#ef4444';

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
            {
                '@type': 'Question',
                'name': `Does ${name} require pilot car certification?`,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': reg?.certification_required == null
                        ? `${name} certification requirements: contact your state DOT for the latest rules.`
                        : `${name} ${reg.certification_required ? 'requires' : 'does not require'} state-specific pilot car operator certification.`,
                },
            },
            {
                '@type': 'Question',
                'name': `When is a second escort required in ${name}?`,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': reg?.double_escort_width_ft
                        ? `${name} requires a second escort vehicle for loads exceeding ${reg.double_escort_width_ft} feet wide.`
                        : `Check with your ${name} DOT permit office for double escort thresholds.`,
                },
            },
            {
                '@type': 'Question',
                'name': `Are night moves allowed in ${name}?`,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': reg?.night_moves_allowed == null
                        ? `Verify night move restrictions with your ${name} oversize permit office.`
                        : `${name} ${reg.night_moves_allowed ? 'generally permits' : 'restricts'} night moves for oversize loads. Always confirm variance rules on your permit.`,
                },
            },
        ],
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* Breadcrumb */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    <Link href="/regulatory-db" style={{ color: '#6b7280', textDecoration: 'none' }}>Regulatory DB</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <span style={{ color: '#d1d5db' }}>{name}</span>
                </nav>

                {/* Header */}
                <header style={{ marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '4px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, marginBottom: 12 }}>
                        <Shield style={{ width: 12, height: 12, color: '#ef4444' }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 2 }}>Compliance Guide</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#f9fafb' }}>
                        <span style={{ color: '#F1A91B' }}>{name}</span> Escort Vehicle Requirements
                    </h1>
                    {reg && (
                        <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                            {reg.dot_source_url && (
                                <a href={reg.dot_source_url} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#d97706', textDecoration: 'none' }}>
                                    <ExternalLink style={{ width: 10, height: 10 }} /> Official DOT Source
                                </a>
                            )}
                            {reg.confidence_score && (
                                <span style={{ fontSize: 11, color: confidenceColor }}>
                                    Data confidence: {Math.round(reg.confidence_score * 100)}%
                                </span>
                            )}
                            {reg.last_updated_at && (
                                <span style={{ fontSize: 11, color: '#6b7280' }}>
                                    Updated {new Date(reg.last_updated_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    )}
                </header>

                {!reg ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
                        <AlertTriangle style={{ width: 32, height: 32, color: '#f59e0b', margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 15, color: '#9ca3af' }}>Regulation data for <strong>{name}</strong> is not yet loaded.</p>
                        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Check back soon or contact the {name} DOT directly.</p>
                        <Link href="/regulatory-db" style={{ display: 'inline-block', marginTop: 16, padding: '8px 20px', background: 'rgba(217,119,6,0.12)', color: '#d97706', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                            Browse all states →
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Requirements table */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
                            {[
                                { label: 'State Certification Required', val: reg.certification_required, type: 'bool' },
                                { label: 'Night Moves Allowed', val: reg.night_moves_allowed, type: 'bool' },
                                { label: 'Weekend Moves Allowed', val: reg.weekend_moves_allowed, type: 'bool' },
                                { label: 'Holiday Moves Allowed', val: reg.holiday_moves_allowed, type: 'bool' },
                                { label: 'Min Insurance', val: reg.insurance_min_usd ? `$${reg.insurance_min_usd.toLocaleString()}` : null, type: 'text' },
                                { label: 'Max Legal Width', val: reg.max_width_ft ? `${reg.max_width_ft} ft` : null, type: 'text' },
                                { label: 'Max Legal Height', val: reg.max_height_ft ? `${reg.max_height_ft} ft` : null, type: 'text' },
                                { label: 'Max Weight', val: reg.max_weight_lbs ? `${reg.max_weight_lbs.toLocaleString()} lbs` : null, type: 'text' },
                            ].map((row, i, arr) => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                    <span style={{ fontSize: 13, color: '#d1d5db', fontWeight: 600 }}>{row.label}</span>
                                    {row.type === 'bool'
                                        ? (row.val == null ? <Unknown /> : row.val ? <Yes /> : <No />)
                                        : <span style={{ fontSize: 13, fontWeight: 700, color: '#F1A91B' }}>{row.val ?? '—'}</span>}
                                </div>
                            ))}
                        </div>

                        {/* Width thresholds */}
                        {(reg.single_escort_width_ft || reg.double_escort_width_ft) && (
                            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 14, padding: '1.25rem', marginBottom: 24 }}>
                                <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 1 }}>Escort Thresholds</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Single Escort Required</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {reg.single_escort_width_ft ? `${reg.single_escort_width_ft}'+ wide` : '—'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Double Escort Required</div>
                                        <div style={{ fontSize: 24, fontWeight: 900, color: '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {reg.double_escort_width_ft ? `${reg.double_escort_width_ft}'+ wide` : '—'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reciprocity */}
                        {reg.reciprocity_states && reg.reciprocity_states.length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem', marginBottom: 24 }}>
                                <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>Reciprocity States</h3>
                                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>{name} recognizes pilot car certifications from:</p>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {reg.reciprocity_states.filter((s): s is string => typeof s === 'string' && s.length > 0).map(s => (
                                        <Link key={s} href={`/requirements/${s.toLowerCase()}/escort-vehicle-rules`} style={{
                                            padding: '4px 12px', borderRadius: 8, textDecoration: 'none',
                                            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                                            color: '#10b981', fontSize: 11, fontWeight: 700,
                                        }}>{s}</Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* State notes */}
                        {reg.notes && (
                            <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '1rem', marginBottom: 24 }}>
                                <AlertTriangle style={{ width: 14, height: 14, color: '#3b82f6', marginBottom: 6 }} />
                                <p style={{ margin: 0, fontSize: 12, color: '#93c5fd', lineHeight: 1.6 }}>{reg.notes}</p>
                            </div>
                        )}
                    </>
                )}

                {/* CTA */}
                <div style={{ background: 'linear-gradient(135deg, rgba(241,169,27,0.08), rgba(241,169,27,0.02))', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20, padding: '2rem', textAlign: 'center', marginTop: 12 }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>Find Escort Operators in {name}</h3>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                        <Link href={`/regulatory-db`} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: '#d1d5db', fontSize: 13, fontWeight: 700, borderRadius: 10, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
                            All States →
                        </Link>
                        <Link href="/tools/permit-checker" style={{ display: 'inline-flex', padding: '10px 28px', background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none' }}>
                            Check Permit Complexity →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
