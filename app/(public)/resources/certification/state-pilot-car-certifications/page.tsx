import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Shield, ExternalLink, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Pilot Car Certification by State (2026) â€” All 50 States | Haul Command',
    description: 'Complete guide to pilot car and escort vehicle certification requirements for all 50 US states. Testing requirements, reciprocity agreements, renewal periods, and official links.',
    keywords: [
        'pilot car certification by state', 'escort vehicle certification requirements', 'state pilot car license',
        'pilot car certification Texas', 'pilot car certification Florida', 'NPCA certification',
        'escort flag car certificate', 'pilot car reciprocity by state', 'how to get pilot car certified',
    ],
    alternates: { canonical: 'https://haulcommand.com/resources/certification/state-pilot-car-certifications' },
    openGraph: {
        title: 'Pilot Car Certification by State | Haul Command',
        description: '2026 guide to pilot car certification in all 50 states â€” requirements, reciprocity, and renewal.',
    },
};

interface StateCert {
    code: string;
    name: string;
    required: boolean;
    certBody: string;
    reciprocity: string;
    renewal: string;
    notes: string;
    tier: 'strict' | 'moderate' | 'minimal';
}

const STATE_CERTS: StateCert[] = [
    { code: 'AL', name: 'Alabama', required: true, certBody: 'ALDOT', reciprocity: 'NPCA honored', renewal: '2 years', notes: 'Requires state-approved course', tier: 'moderate' },
    { code: 'AK', name: 'Alaska', required: false, certBody: 'None required', reciprocity: 'N/A', renewal: 'N/A', notes: 'No state certification required', tier: 'minimal' },
    { code: 'AZ', name: 'Arizona', required: true, certBody: 'ADOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Vehicle inspection required', tier: 'moderate' },
    { code: 'AR', name: 'Arkansas', required: true, certBody: 'ArDOT', reciprocity: 'Limited', renewal: '2 years', notes: 'Flag car permit required', tier: 'moderate' },
    { code: 'CA', name: 'California', required: true, certBody: 'Caltrans', reciprocity: 'None â€” CA only', renewal: '2 years', notes: 'Strict state-only certification; written + practical exam', tier: 'strict' },
    { code: 'CO', name: 'Colorado', required: true, certBody: 'CDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Equipment inspection required', tier: 'moderate' },
    { code: 'CT', name: 'Connecticut', required: true, certBody: 'ConnDOT', reciprocity: 'Limited', renewal: '2 years', notes: 'New England states have limited reciprocity', tier: 'moderate' },
    { code: 'DE', name: 'Delaware', required: false, certBody: 'DelDOT', reciprocity: 'N/A', renewal: 'N/A', notes: 'No formal certification; escort permit required', tier: 'minimal' },
    { code: 'FL', name: 'Florida', required: true, certBody: 'FDOT', reciprocity: 'None â€” FL only', renewal: '2 years', notes: 'Road Ranger exam required; strict equipment standards', tier: 'strict' },
    { code: 'GA', name: 'Georgia', required: true, certBody: 'GDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Background check required', tier: 'moderate' },
    { code: 'HI', name: 'Hawaii', required: true, certBody: 'HDOT', reciprocity: 'None', renewal: '2 years', notes: 'Island-specific rules apply', tier: 'strict' },
    { code: 'ID', name: 'Idaho', required: true, certBody: 'ITD', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Winter operation endorsement available', tier: 'moderate' },
    { code: 'IL', name: 'Illinois', required: true, certBody: 'IDOT', reciprocity: 'Partial', renewal: '2 years', notes: 'Chicago metro has additional local requirements', tier: 'moderate' },
    { code: 'IN', name: 'Indiana', required: true, certBody: 'INDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Escorted move permit required for each haul', tier: 'moderate' },
    { code: 'IA', name: 'Iowa', required: false, certBody: 'Iowa DOT', reciprocity: 'N/A', renewal: 'N/A', notes: 'No formal certification; escort is coordinated through permit office', tier: 'minimal' },
    { code: 'KS', name: 'Kansas', required: true, certBody: 'KDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Flag car permit required; written exam', tier: 'moderate' },
    { code: 'KY', name: 'Kentucky', required: true, certBody: 'KYTC', reciprocity: 'Limited', renewal: '2 years', notes: 'Height pole endorsement offered', tier: 'moderate' },
    { code: 'LA', name: 'Louisiana', required: true, certBody: 'LADOTD', reciprocity: 'NPCA honored', renewal: '2 years', notes: 'Major oil field transport hub; active enforcement', tier: 'strict' },
    { code: 'ME', name: 'Maine', required: true, certBody: 'MaineDOT', reciprocity: 'New England limited', renewal: '3 years', notes: 'Seasonal weight limits enforced strictly', tier: 'moderate' },
    { code: 'MD', name: 'Maryland', required: true, certBody: 'SHA Maryland', reciprocity: 'NPCA honored', renewal: '2 years', notes: 'MVA registration required', tier: 'moderate' },
    { code: 'MA', name: 'Massachusetts', required: true, certBody: 'MassDOT', reciprocity: 'None â€” MA only', renewal: '2 years', notes: 'Permit class and written test required', tier: 'strict' },
    { code: 'MI', name: 'Michigan', required: true, certBody: 'MDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Spring weight restrictions are strictly enforced', tier: 'moderate' },
    { code: 'MN', name: 'Minnesota', required: true, certBody: 'MnDOT', reciprocity: 'Partial', renewal: '2 years', notes: 'Night move restrictions may apply', tier: 'moderate' },
    { code: 'MS', name: 'Mississippi', required: true, certBody: 'MDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Active oil and gas transport corridor', tier: 'moderate' },
    { code: 'MO', name: 'Missouri', required: true, certBody: 'MoDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Written and practical exam', tier: 'moderate' },
    { code: 'MT', name: 'Montana', required: false, certBody: 'MDT Montana', reciprocity: 'N/A', renewal: 'N/A', notes: 'Permit required but no formal escort certification', tier: 'minimal' },
    { code: 'NE', name: 'Nebraska', required: true, certBody: 'NDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Agricultural and wind energy hauls common', tier: 'moderate' },
    { code: 'NV', name: 'Nevada', required: true, certBody: 'NDOT Nevada', reciprocity: 'NPCA honored', renewal: '2 years', notes: 'Las Vegas metro has additional requirements', tier: 'moderate' },
    { code: 'NH', name: 'New Hampshire', required: true, certBody: 'NHDOT', reciprocity: 'New England limited', renewal: '3 years', notes: 'Strict bridge weight compliance', tier: 'moderate' },
    { code: 'NJ', name: 'New Jersey', required: true, certBody: 'NJDOT', reciprocity: 'None â€” NJ only', renewal: '2 years', notes: 'Written exam + NJ-specific equipment requirements', tier: 'strict' },
    { code: 'NM', name: 'New Mexico', required: true, certBody: 'NMDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Mountain rule restrictions in winter', tier: 'moderate' },
    { code: 'NY', name: 'New York', required: true, certBody: 'NYSDOT', reciprocity: 'None â€” NY only', renewal: '2 years', notes: 'NYC metro has special permit requirements; strict enforcement', tier: 'strict' },
    { code: 'NC', name: 'North Carolina', required: true, certBody: 'NCDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Photo ID escort certification card issued', tier: 'moderate' },
    { code: 'ND', name: 'North Dakota', required: false, certBody: 'NDDOT', reciprocity: 'N/A', renewal: 'N/A', notes: 'No formal certification; oil field escort common', tier: 'minimal' },
    { code: 'OH', name: 'Ohio', required: true, certBody: 'ODOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Heavy manufacturing transport corridor', tier: 'moderate' },
    { code: 'OK', name: 'Oklahoma', required: true, certBody: 'ODOT Oklahoma', reciprocity: 'NPCA honored', renewal: '2 years', notes: 'Oil field transport extensively regulated', tier: 'moderate' },
    { code: 'OR', name: 'Oregon', required: true, certBody: 'ODOT Oregon', reciprocity: 'Limited', renewal: '2 years', notes: 'Strict environmental and forest road rules', tier: 'strict' },
    { code: 'PA', name: 'Pennsylvania', required: true, certBody: 'PennDOT', reciprocity: 'Partial', renewal: '4 years', notes: 'Turnpike escort rules differ from state roads', tier: 'moderate' },
    { code: 'RI', name: 'Rhode Island', required: true, certBody: 'RIDOT', reciprocity: 'New England limited', renewal: '2 years', notes: 'Small state but active bridge weight enforcement', tier: 'moderate' },
    { code: 'SC', name: 'South Carolina', required: true, certBody: 'SCDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Port of Charleston active transport corridor', tier: 'moderate' },
    { code: 'SD', name: 'South Dakota', required: false, certBody: 'SDDOT', reciprocity: 'N/A', renewal: 'N/A', notes: 'No formal certification required', tier: 'minimal' },
    { code: 'TN', name: 'Tennessee', required: true, certBody: 'TDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Auto transport corridor; written exam required', tier: 'moderate' },
    { code: 'TX', name: 'Texas', required: true, certBody: 'TxDMV', reciprocity: 'None â€” TX only', renewal: '2 years', notes: 'Largest escort market in the US; strict certification; TxDMV flag car permit required', tier: 'strict' },
    { code: 'UT', name: 'Utah', required: true, certBody: 'UDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Mining and energy transport common', tier: 'moderate' },
    { code: 'VT', name: 'Vermont', required: true, certBody: 'VTrans', reciprocity: 'New England limited', renewal: '2 years', notes: 'Strict spring weight restrictions', tier: 'moderate' },
    { code: 'VA', name: 'Virginia', required: true, certBody: 'VDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Port of Virginia active heavy haul corridor', tier: 'moderate' },
    { code: 'WA', name: 'Washington', required: true, certBody: 'WSDOT', reciprocity: 'Limited', renewal: '2 years', notes: 'Wind energy and aerospace transport common', tier: 'strict' },
    { code: 'WV', name: 'West Virginia', required: true, certBody: 'WVDOH', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Coal and heavy equipment transport', tier: 'moderate' },
    { code: 'WI', name: 'Wisconsin', required: true, certBody: 'WisDOT', reciprocity: 'NPCA honored', renewal: '2 years', notes: 'Strict spring thaw weight restrictions', tier: 'moderate' },
    { code: 'WY', name: 'Wyoming', required: true, certBody: 'WYDOT', reciprocity: 'NPCA honored', renewal: '3 years', notes: 'Oil and gas transport; mountain route restrictions apply', tier: 'moderate' },
];

const TIER_CONFIG = {
    strict: { label: 'Strict', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', desc: 'State-only cert required, no reciprocity' },
    moderate: { label: 'Standard', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', desc: 'Certification required; NPCA often honored' },
    minimal: { label: 'Minimal', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', desc: 'No formal certification required' },
};

const PAGE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Pilot Car Certification Requirements by State (2026)',
    description: 'Complete guide to pilot car certification requirements for all 50 US states.',
    publisher: { '@type': 'Organization', name: 'Haul Command' },
    url: 'https://haulcommand.com/resources/certification/state-pilot-car-certifications',
};

export default function StateCertificationPage() {
    const strictCount = STATE_CERTS.filter(s => s.tier === 'strict').length;
    const moderateCount = STATE_CERTS.filter(s => s.tier === 'moderate').length;
    const minimalCount = STATE_CERTS.filter(s => s.tier === 'minimal').length;
    const requiredCount = STATE_CERTS.filter(s => s.required).length;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_SCHEMA) }} />

            <div style={{ minHeight: '100vh', background: '#080810', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>

                    {/* Breadcrumb */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, flexWrap: 'wrap' }}>
                        <Link href="/resources" style={{ color: '#6b7280', textDecoration: 'none' }}>Resources</Link>
                        <ChevronRight style={{ width: 12, height: 12 }} />
                        <Link href="/resources#certification" style={{ color: '#6b7280', textDecoration: 'none' }}>Certifications</Link>
                        <ChevronRight style={{ width: 12, height: 12 }} />
                        <span style={{ color: '#10b981' }}>State Certification Map</span>
                    </nav>

                    <header style={{ marginBottom: '2rem' }}>
                        <h1 style={{ margin: '0 0 0.75rem', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                            Pilot Car Certification by State
                        </h1>
                        <p style={{ margin: '0 0 1.5rem', fontSize: '1rem', color: '#9ca3af', lineHeight: 1.65, maxWidth: 680 }}>
                            Requirements for all 50 US states â€” updated March 2026. Includes certification bodies, reciprocity agreements, renewal periods, and key compliance notes.
                        </p>

                        <div style={{ marginBottom: '2.5rem', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                            <img 
                                src="/images/infographics/reciprocity_infographic_1774962616582.png" 
                                alt="US Pilot Car Certification Reciprocity Map" 
                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                        </div>

                        {/* Summary stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
                            {[
                                { val: requiredCount, label: 'States Requiring Cert', color: '#f9fafb' },
                                { val: strictCount, label: 'Strict (No Reciprocity)', color: '#ef4444' },
                                { val: moderateCount, label: 'NPCA Honored', color: '#f59e0b' },
                                { val: minimalCount, label: 'No Cert Required', color: '#10b981' },
                            ].map(s => (
                                <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</div>
                                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            {Object.entries(TIER_CONFIG).map(([tier, cfg]) => (
                                <div key={tier} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 20 }}>
                                    <Shield style={{ width: 12, height: 12, color: cfg.color }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                                    <span style={{ fontSize: 11, color: '#6b7280' }}>â€” {cfg.desc}</span>
                                </div>
                            ))}
                        </div>
                    </header>

                    {/* State Table */}
                    <div style={{ overflowX: 'auto', marginBottom: '3rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    {['State', 'Certification', 'Reciprocity', 'Renewal', 'Notes'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {STATE_CERTS.map((s, i) => {
                                    const cfg = TIER_CONFIG[s.tier];
                                    return (
                                        <tr key={s.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Link href={`/directory/us/${s.code.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                                                        <span style={{ fontWeight: 700, color: '#f9fafb', fontSize: '0.9rem' }}>{s.code}</span>
                                                        <span style={{ color: '#6b7280', marginLeft: 4, fontSize: '0.8rem' }}>{s.name}</span>
                                                    </Link>
                                                </div>
                                            </td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 4, fontSize: 10, fontWeight: 700, color: cfg.color, textTransform: 'uppercase' }}>
                                                    {cfg.label}
                                                </span>
                                                <span style={{ marginLeft: 6, fontSize: '0.8rem', color: '#9ca3af' }}>{s.certBody}</span>
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: s.reciprocity === 'None â€” TX only' || s.reciprocity === 'None â€” CA only' || s.reciprocity === 'None â€” NY only' || s.reciprocity === 'None â€” FL only' || s.reciprocity === 'None â€” NJ only' || s.reciprocity === 'None â€” MA only' ? '#ef4444' : '#9ca3af' }}>
                                                {s.reciprocity}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{s.renewal}</td>
                                            <td style={{ padding: '10px 12px', fontSize: '0.78rem', color: '#6b7280', maxWidth: 280 }}>{s.notes}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* CTA */}
                    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Shield style={{ width: 22, height: 22, color: '#10b981', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb' }}>Browse Certified Operators by State</div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Find verified pilot car operators for any US state in the Haul Command directory.</div>
                        </div>
                        <Link href="/directory/us" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 12, fontWeight: 800, borderRadius: 10, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                            Browse Directory <ArrowRight style={{ width: 12, height: 12 }} />
                        </Link>
                    </div>

                    <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.6 }}>
                        <strong style={{ color: '#6b7280' }}>Disclaimer:</strong> Certification requirements change frequently. Always verify with your state DOT before operating. This guide is updated quarterly but is not a substitute for official state sources.{' '}
                        <Link href="/resources" style={{ color: '#C6923A', textDecoration: 'none' }}>Back to Resources â†’</Link>
                    </div>

                </div>
            </div>
        </>
    );
}