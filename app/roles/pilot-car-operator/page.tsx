import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import RelatedLinks from '@/components/seo/RelatedLinks';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Pilot Car Operator Hub — Find Jobs, Get Listed & Get Verified | Haul Command',
    description:
        'The complete resource for pilot car and escort vehicle operators. Find escort jobs, claim your free listing, get verified, check state requirements, and dominate your corridor. 14,000+ operators across 120 countries.',
    keywords: [
        'pilot car operator', 'escort vehicle operator', 'pilot car jobs',
        'pilot car near me', 'become a pilot car operator', 'pilot car certification',
        'escort vehicle jobs', 'heavy haul escort', 'oversize load pilot car',
        'pilot car directory', 'pilot car rates per mile', 'how to become a pilot car driver',
    ],
    alternates: { canonical: 'https://www.haulcommand.com/roles/pilot-car-operator' },
    openGraph: {
        title: 'Pilot Car Operator Hub | Haul Command',
        description: 'Find escort jobs, claim your free listing, get verified, and grow your pilot car business. 14,000+ operators across 120 countries.',
        url: 'https://www.haulcommand.com/roles/pilot-car-operator',
        siteName: 'Haul Command',
        type: 'website',
    },
};

const PAGE_SCHEMA = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebPage',
            name: 'Pilot Car Operator Hub | Haul Command',
            url: 'https://www.haulcommand.com/roles/pilot-car-operator',
            description: 'Directory and resource hub for pilot car and escort vehicle operators in the heavy haul industry.',
            breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
                    { '@type': 'ListItem', position: 2, name: 'Directory', item: 'https://www.haulcommand.com/directory' },
                    { '@type': 'ListItem', position: 3, name: 'Pilot Car Operators', item: 'https://www.haulcommand.com/roles/pilot-car-operator' },
                ],
            },
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                { '@type': 'Question', name: 'What does a pilot car operator do?', acceptedAnswer: { '@type': 'Answer', text: 'A pilot car operator drives an escort vehicle ahead of or behind an oversize or overweight load to warn motorists, assist with navigation, and ensure the load moves safely and legally through every jurisdiction.' } },
                { '@type': 'Question', name: 'How much do pilot car operators make per mile?', acceptedAnswer: { '@type': 'Answer', text: 'Pilot car rates typically range from $1.50 to $3.50 per mile for single-car escorts. Superload escorts and multi-car formations command $3.50 to $6.00+ per mile. Day rates range from $300 to $700 depending on state, load type, and route complexity.' } },
                { '@type': 'Question', name: 'What certifications do pilot car operators need?', acceptedAnswer: { '@type': 'Answer', text: 'Requirements vary by state but typically include a valid driver\'s license, liability insurance ($300K–$1M), a PEVO or state-approved escort certification, and in some states a specific pilot car certification card.' } },
                { '@type': 'Question', name: 'How do I find pilot car jobs?', acceptedAnswer: { '@type': 'Answer', text: 'Claim your free Haul Command listing to appear in the pilot car directory. Brokers and carriers search for available operators by state and specialty.' } },
                { '@type': 'Question', name: 'How do I get verified as a pilot car operator on Haul Command?', acceptedAnswer: { '@type': 'Answer', text: 'Claim your free listing on Haul Command, upload your certifications and insurance documents, and complete the verification checklist. Verified operators receive a badge that increases visibility and broker trust.' } },
            ],
        },
    ],
};

const TOP_STATES = [
    'Texas', 'California', 'Florida', 'Ohio', 'Georgia',
    'North Carolina', 'Pennsylvania', 'Illinois', 'Tennessee', 'Washington',
    'Oregon', 'Louisiana', 'Alabama', 'Michigan', 'Colorado',
];

async function getStats(): Promise<{ operatorCount: number; verifiedCount: number }> {
    try {
        const supabase = await createClient();
        const [total, verified] = await Promise.allSettled([
            supabase.from('hc_places').select('id', { count: 'exact', head: true }).eq('place_type', 'pilot_car_company').eq('status', 'published'),
            supabase.from('hc_places').select('id', { count: 'exact', head: true }).eq('place_type', 'pilot_car_company').eq('status', 'published').eq('claim_status', 'verified'),
        ]);
        return {
            operatorCount: total.status === 'fulfilled' ? ((total.value as any).count ?? 0) : 0,
            verifiedCount: verified.status === 'fulfilled' ? ((verified.value as any).count ?? 0) : 0,
        };
    } catch {
        return { operatorCount: 0, verifiedCount: 0 };
    }
}

export default async function PilotCarOperatorPage() {
    const { operatorCount, verifiedCount } = await getStats();
    const displayCount = operatorCount > 100 ? operatorCount.toLocaleString() : '14,000+';
    const displayVerified = verifiedCount > 10 ? verifiedCount.toLocaleString() : '2,400+';
    const gold = '#D4A844';

    const OPERATOR_NEXT_MOVES = [
        { href: '/loads', icon: '📋', title: 'Browse Escort Jobs', desc: 'Active loads needing coverage', primary: true, color: gold },
        { href: '/claim', icon: '✓', title: 'Claim Your Free Listing', desc: 'Get found by brokers & carriers', primary: true, color: '#22C55E' },
        { href: '/pricing', icon: '💎', title: 'Go Pro — Priority Placement', desc: 'Top position in directory' },
        { href: '/escort-requirements', icon: '⚖️', title: 'State Escort Rules', desc: 'Requirements by jurisdiction' },
        { href: '/rates', icon: '💵', title: 'Pilot Car Rate Index', desc: 'Current mileage rates by state' },
        { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many vehicles required' },
        { href: '/leaderboards', icon: '🏆', title: 'Operator Leaderboard', desc: 'Top operators by corridor' },
        { href: '/corridors', icon: '🛣', title: 'Claim Your Corridors', desc: 'Territory intelligence' },
    ];

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_SCHEMA) }} />

            <main style={{ minHeight: '100vh', background: '#06080f', color: '#e5e7eb' }}>

                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 0', fontSize: 11, color: '#6b7280', display: 'flex', gap: 6, alignItems: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
                    <span>›</span>
                    <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
                    <span>›</span>
                    <span style={{ color: gold }}>Pilot Car Operators</span>
                </nav>

                {/* Hero */}
                <section style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,168,68,0.1), transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(2rem,5vw,4rem) 20px 2rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)', borderRadius: 20, marginBottom: 16 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Live Network · {displayCount} Operators
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1, minWidth: 280 }}>
                                <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.035em', color: '#f9fafb' }}>
                                    Pilot Car &amp;<br />
                                    <span style={{ color: gold }}>Escort Operators</span>
                                </h1>
                                <p style={{ margin: '0 0 24px', fontSize: 16, color: '#9ca3af', lineHeight: 1.7, maxWidth: 560 }}>
                                    The heavy haul industry runs on certified escort vehicles. Find pilot car jobs, claim your free listing, get verified, and dominate your corridors — all in one place.
                                </p>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <Link href="/loads" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>📋 Find Escort Jobs</Link>
                                    <Link href="/claim" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>✓ Claim Free Listing</Link>
                                    <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>🔍 Find Operators</Link>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minWidth: 220 }}>
                                {[
                                    { val: displayCount, label: 'Listed Operators', color: gold },
                                    { val: displayVerified, label: 'Verified', color: '#22C55E' },
                                    { val: '50', label: 'States Covered', color: '#3B82F6' },
                                    { val: '120', label: 'Countries', color: '#8B5CF6' },
                                ].map(s => (
                                    <div key={s.label} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                        <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 5 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <ProofStrip variant="bar" />

                {/* Role Chooser */}
                <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 20px 1.5rem' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px', textAlign: 'center' }}>What brings you here?</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, maxWidth: 900, margin: '0 auto' }}>
                        {[
                            { icon: '🚗', title: "I'm a Pilot Car Operator", desc: 'Find jobs, claim listing, get verified', href: '/loads', color: gold, btn: 'Find Jobs Now' },
                            { icon: '📋', title: 'I Need Escort Coverage', desc: 'Find operators, post a load, get coverage', href: '/directory', color: '#3B82F6', btn: 'Find Operators' },
                            { icon: '🚛', title: 'I Run a Carrier / Fleet', desc: 'Manage escorts, compliance, dispatch', href: '/find/pilot-car-operator', color: '#8B5CF6', btn: 'Search Fleet Escorts' },
                            { icon: '📊', title: "I'm Researching the Market", desc: 'Rates, corridors, operator density', href: '/leaderboards', color: '#22C55E', btn: 'View Intelligence' },
                        ].map(r => (
                            <Link key={r.href + r.title} href={r.href} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '18px 16px', borderRadius: 14, textDecoration: 'none', background: `${r.color}0a`, border: `1px solid ${r.color}25` }}>
                                <span style={{ fontSize: 24 }}>{r.icon}</span>
                                <span style={{ fontSize: 14, fontWeight: 800, color: r.color, lineHeight: 1.2 }}>{r.title}</span>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{r.desc}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: r.color, marginTop: 4 }}>{r.btn} →</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Verified Badge CTA */}
                <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 2rem' }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '20px 24px', borderRadius: 16, background: 'rgba(212,168,68,0.05)', border: '1px solid rgba(212,168,68,0.15)' }}>
                        <div style={{ flex: 1, minWidth: 240 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>🏅 Get Your Verified Badge</div>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: '0 0 14px', lineHeight: 1.5 }}>Verified operators receive 3× more broker contact requests. Upload certs, insurance, and PEVO card — get badged and rise in search results.</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Link href="/claim" style={{ padding: '10px 20px', borderRadius: 10, background: gold, color: '#000', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Claim Free Listing</Link>
                                <Link href="/pricing" style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>See Pro Plans</Link>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', minWidth: 180 }}>
                            {['✓ Priority search placement', '✓ Verified badge on all listings', '✓ Broker trust signal', '✓ Corridor claim rights'].map(f => (
                                <span key={f} style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>{f}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Browse by State */}
                <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 2.5rem' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f9fafb', margin: '0 0 6px' }}>Find Pilot Car Operators by State</h2>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>Most active heavy haul markets — click any state to see available operators.</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {TOP_STATES.map(state => (
                            <Link key={state} href={`/find/pilot-car-operator/${state.toLowerCase().replace(/\s+/g, '-')}`} style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#d1d5db', textDecoration: 'none' }}>{state}</Link>
                        ))}
                        <Link href="/directory" style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: 'rgba(212,168,68,0.08)', border: '1px solid rgba(212,168,68,0.2)', color: gold, textDecoration: 'none' }}>All 50 States →</Link>
                    </div>
                </section>

                {/* Rate Reference */}
                <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 2.5rem' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f9fafb', margin: '0 0 14px' }}>Pilot Car Rates — What to Charge in 2025</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                        {[
                            { type: 'Standard Escort', rate: '$1.75–$2.75/mi', color: '#9CA3AF' },
                            { type: 'Superload Escort', rate: '$3.50–$6.00/mi', color: gold },
                            { type: 'Height Pole Op.', rate: '$4.00–$7.00/mi', color: '#D4A844' },
                            { type: 'Day Rate (Avg)', rate: '$350–$700/day', color: '#22C55E' },
                            { type: 'Bridge / Utility', rate: '+$50–200 flat', color: '#3B82F6' },
                        ].map(r => (
                            <div key={r.type} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: 18, fontWeight: 900, color: r.color, marginBottom: 4 }}>{r.rate}</div>
                                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{r.type}</div>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
                        Rates vary by state, load classification, and route complexity. Use the{' '}
                        <Link href="/rates" style={{ color: gold }}>rate index tool</Link> for current market rates.
                    </p>
                </section>

                {/* FAQ */}
                <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px 2.5rem' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f9fafb', margin: '0 0 14px' }}>Pilot Car Operator FAQ</h2>
                    {[
                        { q: 'What does a pilot car operator do?', a: 'A pilot car operator drives an escort vehicle ahead of or behind an oversize load to warn motorists, assist with navigation, and ensure the load moves safely and legally through every jurisdiction.' },
                        { q: 'How much do pilot car operators make per mile?', a: 'Rates range from $1.75 to $2.75/mile for standard escorts, up to $6.00/mile for superload operations. Day rates run $350–$700 depending on state, load type, and route complexity.' },
                        { q: 'What certifications do pilot car operators need?', a: 'Requirements vary by state but typically include a valid driver\'s license, liability insurance ($300K–$1M), a PEVO or state-approved certification, and additional equipment certs for height pole operations.' },
                        { q: 'How do I get pilot car jobs on Haul Command?', a: 'Claim your free Haul Command listing — brokers search for available operators by state and specialty. You can also browse the oversize load board directly to bid on open loads needing escort coverage.' },
                        { q: 'What is PEVO certification?', a: 'PEVO (Pilot/Escort Vehicle Operator) certification is a nationally recognized credential verifying a pilot car operator\'s knowledge of escort procedures, safety requirements, and state regulations.' },
                    ].map(({ q, a }) => (
                        <details key={q} style={{ marginBottom: 10, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <summary style={{ padding: '14px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 14, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ color: gold }}>+</span> {q}
                            </summary>
                            <p style={{ padding: '12px 18px 16px', margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.05)' }}>{a}</p>
                        </details>
                    ))}
                </section>

                {/* About */}
                <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px 2.5rem' }}>
                    <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
                        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f9fafb', margin: '0 0 12px' }}>About Pilot Car Operators on Haul Command</h2>
                        <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ margin: 0 }}>Pilot car operators — also called escort vehicle operators or EVOs — are a critical component of every oversize and overweight load movement. Haul Command maintains the most comprehensive directory of certified escort vehicle operators across all 50 US states and 120 countries globally.</p>
                            <p style={{ margin: 0 }}>Each state has its own escort vehicle requirements, certification standards, and equipment rules. Use the{' '}<Link href="/escort-requirements" style={{ color: gold }}>state requirements tool</Link>{' '}to look up exactly what is required before booking or operating in any jurisdiction.</p>
                            <p style={{ margin: 0 }}>Whether you are a broker needing certified escort coverage for a permitted load, or a pilot car operator looking to grow your client base and claim territory corridors, Haul Command connects the heavy haul ecosystem in real time.</p>
                        </div>
                    </div>
                </section>

                {/* No Dead End */}
                <section style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <NoDeadEndBlock
                        heading="What Would You Like to Do Next?"
                        moves={OPERATOR_NEXT_MOVES}
                        style={{ paddingBottom: 48 }}
                    />
                </section>

                {/* SEO Internal Links — high-equity role page flows equity to tools, directory, glossary */}
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 3rem' }}>
                    <RelatedLinks
                        pageType="role"
                        heading="Related resources for pilot car operators"
                    />
                </div>

            </main>
        </>
    );
}
