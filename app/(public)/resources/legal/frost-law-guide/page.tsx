import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ArrowRight, AlertTriangle, Snowflake, Calendar, Scale, MapPin, Shield, Truck } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Frost Laws by State (2026) — Spring Weight Restrictions | Haul Command',
    description: 'Complete frost law guide for all US states. Spring weight restrictions, seasonal load reduction requirements, dates, and exemptions for oversize and heavy haul transport. Updated 2026.',
    keywords: [
        'frost laws', 'frost laws by state', 'spring weight restrictions', 'seasonal load restrictions',
        'frost law dates', 'frost law exemptions', 'oversize load frost laws', 'heavy haul spring restrictions',
        'weight restrictions by state', 'road weight limits spring', 'frost law map',
    ],
    alternates: { canonical: 'https://haulcommand.com/resources/legal/frost-law-guide' },
    openGraph: {
        title: 'Frost Laws by State (2026) | Haul Command',
        description: 'Complete guide to spring weight restrictions across all US states. Dates, exemptions, and load reduction requirements.',
    },
};

const PAGE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Frost Laws by State — Spring Weight Restrictions Guide (2026)',
    description: 'Complete frost law guide covering spring weight restrictions, load reduction requirements, and seasonal dates for oversize and heavy haul transport.',
    publisher: { '@type': 'Organization', name: 'Haul Command' },
    url: 'https://haulcommand.com/resources/legal/frost-law-guide',
};

const FAQ_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        { '@type': 'Question', name: 'What are frost laws?', acceptedAnswer: { '@type': 'Answer', text: 'Frost laws (also called spring weight restrictions or seasonal load restrictions) are temporary weight limits imposed by states during spring thaw periods. When frozen roads begin to thaw, the subgrade becomes saturated and weakened, making roadways vulnerable to damage from heavy loads. States reduce allowable axle weights by 10-35% during this period to protect road infrastructure.' } },
        { '@type': 'Question', name: 'When do frost laws go into effect?', acceptedAnswer: { '@type': 'Answer', text: 'Frost laws typically run from mid-February through mid-May, depending on the state and weather conditions. Northern states (Minnesota, Wisconsin, Michigan, North Dakota) generally have the longest frost law seasons. Most states announce exact dates 1-2 weeks before implementation based on road condition surveys.' } },
        { '@type': 'Question', name: 'What states have frost laws?', acceptedAnswer: { '@type': 'Answer', text: 'Approximately 30 states have some form of frost law or spring weight restriction. Common frost law states include Minnesota, Wisconsin, Michigan, North Dakota, South Dakota, Montana, Idaho, Vermont, New Hampshire, Maine, and most northern/midwestern states. Southern states generally do not have frost laws.' } },
        { '@type': 'Question', name: 'How much do frost laws reduce load weights?', acceptedAnswer: { '@type': 'Answer', text: 'Typical reductions range from 10% to 35% of normal legal axle weights. For example, a road normally rated for 80,000 lbs GVW might be reduced to 52,000-72,000 lbs during frost law season. Exact reductions vary by road classification, with local roads typically having larger reductions than state highways.' } },
        { '@type': 'Question', name: 'Are there exemptions from frost laws?', acceptedAnswer: { '@type': 'Answer', text: 'Many states offer exemptions for essential services (utilities, fuel delivery, agricultural supplies), interstate highways (which are federally maintained), and loads with special permits. Some states allow full weight on designated "all-season" routes. Check your state DOT for specific exemptions.' } },
    ],
};

const FROST_LAW_STATES = [
    { state: 'Minnesota', season: 'Mar 1 "“ May 15', reduction: '10% on 10-ton roads', severity: 'high', notes: 'MnDOT publishes county-by-county road restrictions' },
    { state: 'Wisconsin', season: 'Mar 1 "“ May 1', reduction: 'Up to 6 ton/axle reduction', severity: 'high', notes: 'Posting dates vary by county' },
    { state: 'Michigan', season: 'Feb 15 "“ May 15', reduction: 'Up to 35% reduction', severity: 'high', notes: 'Weight restrictions on all seasonal roads' },
    { state: 'North Dakota', season: 'Mar 1 "“ May 31', reduction: '10-ton limit on county roads', severity: 'high', notes: 'Interstate highways exempt' },
    { state: 'South Dakota', season: 'Mar 1 "“ Apr 30', reduction: 'Variable by road class', severity: 'high', notes: 'Governor issues proclamation' },
    { state: 'Montana', season: 'Mar 15 "“ May 15', reduction: 'Up to 6,000 lb/axle reduction', severity: 'medium', notes: 'MDT publishes restriction maps' },
    { state: 'Idaho', season: 'Feb "“ Apr (variable)', reduction: 'Up to 20% reduction', severity: 'medium', notes: 'Varies by highway district' },
    { state: 'Vermont', season: 'Mar 1 "“ May 15', reduction: '24,000 lb GVW on Class 3 roads', severity: 'high', notes: 'Town highways most restricted' },
    { state: 'New Hampshire', season: 'Mar "“ May (variable)', reduction: 'Up to 6 ton/axle reduction', severity: 'medium', notes: 'Municipal roads primarily affected' },
    { state: 'Maine', season: 'Mar "“ May (variable)', reduction: '23,000 lb limit on posted roads', severity: 'medium', notes: 'Posted road restrictions' },
    { state: 'Iowa', season: 'Feb 15 "“ May 15', reduction: 'Farm-to-market roads restricted', severity: 'medium', notes: 'County-level restrictions' },
    { state: 'Nebraska', season: 'Mar 1 "“ Apr 30', reduction: 'Variable by county', severity: 'medium', notes: 'County boards set restrictions' },
    { state: 'Pennsylvania', season: 'Feb "“ Apr (variable)', reduction: 'Reduced weight on posted roads', severity: 'low', notes: 'PennDOT weight posting system' },
    { state: 'New York', season: 'Mar "“ Apr (variable)', reduction: 'Town road restrictions', severity: 'low', notes: 'Local highway superintendents post' },
    { state: 'Oregon', season: 'Variable', reduction: 'Seasonal restrictions on select routes', severity: 'low', notes: 'ODOT freeze/thaw program' },
    { state: 'Washington', season: 'Variable', reduction: 'Seasonal restrictions on select routes', severity: 'low', notes: 'WSDOT seasonal postings' },
    { state: 'Wyoming', season: 'Mar "“ May (variable)', reduction: 'Up to 20% on local roads', severity: 'medium', notes: 'County-managed restrictions' },
    { state: 'Indiana', season: 'Feb "“ Apr (variable)', reduction: 'County road weight embargoes', severity: 'low', notes: 'County highway departments manage' },
    { state: 'Illinois', season: 'Feb "“ May (variable)', reduction: 'Local jurisdiction restrictions', severity: 'low', notes: 'County and township roads' },
    { state: 'Ohio', season: 'Feb "“ May (variable)', reduction: 'County engineer weight limits', severity: 'low', notes: 'Posted road restrictions' },
];

const severityColor = (s: string) => s === 'high' ? '#ef4444' : s === 'medium' ? '#f59e0b' : '#10b981';

export default function FrostLawGuidePage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_SCHEMA) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

            <div style={{ minHeight: '100vh', background: '#080810', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
                <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>

                    {/* Breadcrumb */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, flexWrap: 'wrap' }}>
                        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
                        <ChevronRight style={{ width: 12, height: 12 }} />
                        <Link href="/resources" style={{ color: '#6b7280', textDecoration: 'none' }}>Resources</Link>
                        <ChevronRight style={{ width: 12, height: 12 }} />
                        <Link href="/resources#legal" style={{ color: '#6b7280', textDecoration: 'none' }}>Legal</Link>
                        <ChevronRight style={{ width: 12, height: 12 }} />
                        <span style={{ color: '#38bdf8' }}>Frost Laws</span>
                    </nav>

                    <header style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 20, marginBottom: 16 }}>
                            <Snowflake style={{ width: 12, height: 12, color: '#38bdf8' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 1 }}>Compliance Reference · 20 States</span>
                        </div>
                        <h1 style={{ margin: '0 0 1rem', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                            Frost Laws by State — Spring Weight Restrictions
                        </h1>
                        <p style={{ margin: 0, fontSize: '1.05rem', color: '#9ca3af', lineHeight: 1.65, maxWidth: 700 }}>
                            Complete guide to seasonal weight restrictions across the US. Know when frost laws activate, how much weight is reduced, and which routes are exempt — before your load gets turned away.
                        </p>
                        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>ðŸ“… Updated March 2026</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>ðŸ· Compliance · Weight Restrictions</span>
                        </div>
                    </header>

                    {/* What Are Frost Laws */}
                    <section style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 14, padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid #38bdf8' }}>
                        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800, color: '#f9fafb' }}>What Are Frost Laws?</h2>
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#d1d5db', lineHeight: 1.65 }}>
                            Frost laws (also called <strong>spring weight restrictions</strong> or <strong>seasonal load restrictions</strong>) are temporary weight limits imposed by states during spring thaw. When frozen roads thaw, the subgrade becomes saturated and weakened — heavy loads can cause permanent road damage. States reduce allowable axle weights by <strong style={{ color: '#ef4444' }}>10"“35%</strong> to protect infrastructure.
                        </p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#d1d5db', lineHeight: 1.65 }}>
                            For heavy haul and oversize load operations, frost laws can shut down entire corridors for 6"“12 weeks. Planning around these restrictions is critical for avoiding delays, fines, and road damage liability.
                        </p>
                    </section>

                    {/* Key Dates Alert */}
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <AlertTriangle style={{ width: 20, height: 20, color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>Peak Frost Law Season: February "“ May</div>
                            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>
                                Most states activate frost laws between mid-February and late March, with restrictions lasting through April or May. Check your specific route states before dispatching any oversize or heavy haul loads during this window.
                            </p>
                        </div>
                    </div>

                    {/* State-by-State Table */}
                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f9fafb', marginBottom: '1rem' }}>Frost Laws by State — Quick Reference</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        {['State', 'Typical Season', 'Weight Reduction', 'Severity', 'Notes'].map(h => (
                                            <th key={h} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {FROST_LAW_STATES.map((s, i) => (
                                        <tr key={s.state} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                            <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f9fafb', fontWeight: 700 }}>{s.state}</td>
                                            <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#d1d5db', whiteSpace: 'nowrap' }}>{s.season}</td>
                                            <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#d1d5db' }}>{s.reduction}</td>
                                            <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: severityColor(s.severity), background: `${severityColor(s.severity)}15`, border: `1px solid ${severityColor(s.severity)}30` }}>
                                                    {s.severity}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#9ca3af', fontSize: 12 }}>{s.notes}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* How to Plan Around Frost Laws */}
                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f9fafb', marginBottom: '1rem' }}>How to Plan Around Frost Laws</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                            {[
                                { icon: Calendar, title: 'Check Dates Early', desc: 'Monitor your state DOT for frost law announcements 2-4 weeks before typical start dates. Book escorts and permits before restrictions activate.', color: '#38bdf8' },
                                { icon: MapPin, title: 'Use All-Season Routes', desc: 'Many states designate "all-season" routes exempt from frost laws. Plan your haul along these corridors when possible.', color: '#10b981' },
                                { icon: Scale, title: 'Reduce Axle Weights', desc: 'If you can\'t avoid frost law roads, reduce axle weights to comply. This may mean splitting loads or adjusting trailer configurations.', color: '#f59e0b' },
                                { icon: Truck, title: 'Pre-Position Equipment', desc: 'Stage equipment before frost laws activate. Pre-positioned loads on all-season routes avoid restrictions entirely.', color: '#a78bfa' },
                            ].map(tip => {
                                const Icon = tip.icon;
                                return (
                                    <div key={tip.title} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <Icon style={{ width: 16, height: 16, color: tip.color }} />
                                            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f9fafb' }}>{tip.title}</h3>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.55 }}>{tip.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* FAQ */}
                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f9fafb', marginBottom: '1rem' }}>Frequently Asked Questions</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {FAQ_SCHEMA.mainEntity.map((faq, i) => (
                                <details key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                                    <summary style={{ padding: '1rem 1.25rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#f9fafb', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {faq.name}
                                        <span style={{ color: '#38bdf8', fontSize: 18, flexShrink: 0, marginLeft: 12 }}>+</span>
                                    </summary>
                                    <div style={{ padding: '0 1.25rem 1.25rem', fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.65 }}>
                                        {faq.acceptedAnswer.text}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>

                    {/* Permit Packet Upsell */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(198,146,58,0.08) 0%, rgba(198,146,58,0.03) 100%)', border: '1px solid rgba(198,146,58,0.2)', borderRadius: 16, padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                        <Shield style={{ width: 24, height: 24, color: '#C6923A', margin: '0 auto 12px' }} />
                        <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 900, color: '#f9fafb' }}>Get the Full Compliance Package</h3>
                        <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: '#9ca3af', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                            Pre-filled permit applications, weight restriction summaries, all-season route maps, and escort requirements — all in one downloadable packet per state. Stop guessing, start complying.
                        </p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Link href="/permits" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none' }}>
                                State Permit Packets — $29/state <ArrowRight style={{ width: 14, height: 14 }} />
                            </Link>
                            <Link href="/tools/permit-checker" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
                                Free Permit Checker
                            </Link>
                        </div>
                    </div>

                    {/* Related Resources */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Related Resources</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                            {[
                                { href: '/resources/legal/tire-chain-laws', label: 'Tire Chain Laws by State' },
                                { href: '/resources/data/road-conditions', label: 'Live Road Conditions' },
                                { href: '/resources/data/highway-closures', label: 'Highway Closures & Alerts' },
                                { href: '/regulations', label: 'Oversize Load Regulations' },
                                { href: '/permits', label: 'State Permit Requirements' },
                                { href: '/tools/route-survey', label: 'Route Survey Tool' },
                                { href: '/resources/guides/how-to-start-pilot-car-company', label: 'Start a Pilot Car Company' },
                                { href: '/directory', label: 'Find Escort Operators' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 13, color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
                                    {l.label} â†’
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}