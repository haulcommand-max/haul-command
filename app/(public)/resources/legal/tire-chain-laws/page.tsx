import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ArrowRight, AlertTriangle, Link2, MapPin, Shield, Truck, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Tire Chain Laws by State (2026) â€” Requirements & Regulations | Haul Command',
    description: 'Complete tire chain law guide for all US states. Requirements, dates, equipment specs, exemptions, and penalties for oversize loads, commercial vehicles, and escort operators.',
    keywords: [
        'tire chain laws', 'tire chain laws by state', 'chain requirements', 'tire chain regulations',
        'commercial vehicle chain requirements', 'chain control', 'oversize load chain requirements',
        'winter driving requirements', 'chain up stations', 'chain law penalties',
    ],
    alternates: { canonical: 'https://haulcommand.com/resources/legal/tire-chain-laws' },
    openGraph: {
        title: 'Tire Chain Laws by State (2026) | Haul Command',
        description: 'Complete guide to tire chain requirements, dates, and regulations for commercial vehicles and oversize loads across all US states.',
    },
};

const PAGE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Tire Chain Laws by State (2026)',
    description: 'Complete tire chain law guide covering requirements, dates, and regulations for commercial vehicles and oversize loads.',
    publisher: { '@type': 'Organization', name: 'Haul Command' },
    url: 'https://haulcommand.com/resources/legal/tire-chain-laws',
};

const FAQ_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        { '@type': 'Question', name: 'What states require tire chains?', acceptedAnswer: { '@type': 'Answer', text: 'States with chain laws include California, Colorado, Oregon, Washington, Nevada, Idaho, Montana, Wyoming, Utah, Vermont, New Hampshire, and others. Requirements vary â€” some mandate chains on specific mountain passes while others have statewide chain zones activated during winter weather events.' } },
        { '@type': 'Question', name: 'Do pilot cars need tire chains?', acceptedAnswer: { '@type': 'Answer', text: 'In most chain control states, pilot/escort vehicles must comply with chain requirements when chain controls are in effect. However, some states exempt 4WD/AWD vehicles with snow tires from chain requirements during R1 (lower-level) chain controls. During R2/R3 chain controls, chains are typically required on all vehicles regardless of drive type.' } },
        { '@type': 'Question', name: 'What are the penalties for not having chains?', acceptedAnswer: { '@type': 'Answer', text: 'Penalties vary by state. California can fine up to $1,000 and hold the driver liable for any resulting road closure delays. Oregon fines range from $165â€“$440. If a vehicle without chains causes an accident or road closure, the driver may also face civil liability for resulting damages and delays to other motorists.' } },
        { '@type': 'Question', name: 'What is the difference between R1, R2, and R3 chain controls?', acceptedAnswer: { '@type': 'Answer', text: 'R1: Chains or snow tires required on all vehicles except 4WD/AWD. R2: Chains required on all vehicles except 4WD/AWD with snow tires. R3: Chains required on ALL vehicles, no exceptions. Not all states use this tiered system â€” some simply have chain zones that activate during winter weather.' } },
    ],
};

const CHAIN_LAW_STATES = [
    { state: 'California', requirement: 'Chain controls (R1/R2/R3) on mountain passes', season: 'Nov â€“ Apr', escorts: 'Must comply when controls active', severity: 'high' },
    { state: 'Colorado', requirement: 'Traction Law + chain law on I-70 corridor', season: 'Sep 1 â€“ May 31', escorts: 'Must comply; 4WD may exempt in lower controls', severity: 'high' },
    { state: 'Oregon', requirement: 'Statewide chain advisory zones', season: 'Nov 1 â€“ Apr 1', escorts: 'Must carry chains; studded tires allowed Novâ€“Apr', severity: 'high' },
    { state: 'Washington', requirement: 'Chain controls on mountain passes', season: 'Nov â€“ Mar', escorts: '4WD/AWD with snow tires OK in most zones', severity: 'high' },
    { state: 'Nevada', requirement: 'Chain controls on select highways', season: 'Oct â€“ May', escorts: 'Must comply when controls activated', severity: 'medium' },
    { state: 'Idaho', requirement: 'Chain-up areas on I-90, US-95, SH-21', season: 'Nov â€“ Apr', escorts: '4WD/AWD with snow tires typically exempt', severity: 'medium' },
    { state: 'Montana', requirement: 'Chain requirements on select passes', season: 'Oct â€“ May', escorts: 'Must carry chains in mountain zones', severity: 'medium' },
    { state: 'Wyoming', requirement: 'Closures + chain requirements on I-80, I-25', season: 'Oct â€“ May', escorts: 'Must comply; frequent closures in winter', severity: 'high' },
    { state: 'Utah', requirement: 'Chain restrictions on specific canyons', season: 'Nov â€“ Apr', escorts: '4WD/AWD with M+S tires may be exempt', severity: 'medium' },
    { state: 'Vermont', requirement: 'Studded tires/chains allowed; no mandate', season: 'Oct â€“ Apr (studs)', escorts: 'Chains recommended for mountain routes', severity: 'low' },
    { state: 'New Hampshire', requirement: 'No chain law but chains/studs permitted', season: 'Oct â€“ May (studs)', escorts: 'Carry chains for northern mountain routes', severity: 'low' },
    { state: 'Maine', requirement: 'Studded tires allowed; chains permitted', season: 'Oct â€“ May (studs)', escorts: 'Recommended for escort operations', severity: 'low' },
    { state: 'Minnesota', requirement: 'No chain law; chains/studs allowed', season: 'N/A', escorts: 'Chains not required but recommended', severity: 'low' },
    { state: 'Michigan', requirement: 'No chain law in most areas; studs prohibited', season: 'N/A', escorts: 'Snow tires recommended; no chains needed', severity: 'low' },
    { state: 'Pennsylvania', requirement: 'Chain/traction device requirement in snow emergencies', season: 'Nov â€“ Apr', escorts: 'Must comply when emergency declared', severity: 'medium' },
    { state: 'New Mexico', requirement: 'Chain controls on select mountain passes', season: 'Nov â€“ Mar', escorts: 'Must comply when controls active', severity: 'low' },
    { state: 'Arizona', requirement: 'Chain controls on I-40, I-17 in snow', season: 'Nov â€“ Mar', escorts: 'Must comply when controls activated', severity: 'low' },
];

const severityColor = (s: string) => s === 'high' ? '#ef4444' : s === 'medium' ? '#f59e0b' : '#10b981';

export default function TireChainLawsPage() {
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
                        <span style={{ color: '#f59e0b' }}>Tire Chain Laws</span>
                    </nav>

                    <header style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, marginBottom: 16 }}>
                            <Link2 style={{ width: 12, height: 12, color: '#f59e0b' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1 }}>Compliance Reference Â· 17 States</span>
                        </div>
                        <h1 style={{ margin: '0 0 1rem', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                            Tire Chain Laws by State
                        </h1>
                        <p style={{ margin: 0, fontSize: '1.05rem', color: '#9ca3af', lineHeight: 1.65, maxWidth: 700 }}>
                            Complete guide to tire chain requirements for commercial vehicles, oversize loads, and escort operators. Know what&apos;s required before you hit a chain control checkpoint.
                        </p>
                        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>ðŸ“… Updated March 2026</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>ðŸ· Compliance Â· Safety Â· Winter Operations</span>
                        </div>
                    </header>

                    {/* Chain Control Levels Explainer */}
                    <section style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 14, padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid #f59e0b' }}>
                        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: '#f9fafb' }}>Chain Control Levels Explained</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {[
                                { level: 'R1', desc: 'Chains or snow tires required except 4WD/AWD', color: '#10b981' },
                                { level: 'R2', desc: 'Chains required except 4WD/AWD with snow tires', color: '#f59e0b' },
                                { level: 'R3', desc: 'Chains required on ALL vehicles â€” no exceptions', color: '#ef4444' },
                            ].map(r => (
                                <div key={r.level} style={{ background: `${r.color}08`, border: `1px solid ${r.color}25`, borderRadius: 10, padding: '1rem' }}>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: r.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{r.level}</div>
                                    <p style={{ margin: 0, fontSize: 12, color: '#d1d5db', lineHeight: 1.5 }}>{r.desc}</p>
                                </div>
                            ))}
                        </div>
                        <p style={{ margin: '12px 0 0', fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                            Note: Not all states use the R1/R2/R3 system. Some states simply activate &quot;chain zones&quot; during winter weather.
                        </p>
                    </section>

                    {/* State-by-State Table */}
                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f9fafb', marginBottom: '1rem' }}>Tire Chain Requirements by State</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
                                <thead>
                                    <tr>
                                        {['State', 'Requirement', 'Season', 'Escort/Pilot Car', 'Severity'].map(h => (
                                            <th key={h} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {CHAIN_LAW_STATES.map((s, i) => (
                                        <tr key={s.state} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                            <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f9fafb', fontWeight: 700, whiteSpace: 'nowrap' }}>{s.state}</td>
                                            <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#d1d5db', minWidth: 200 }}>{s.requirement}</td>
                                            <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#d1d5db', whiteSpace: 'nowrap' }}>{s.season}</td>
                                            <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#9ca3af', fontSize: 12 }}>{s.escorts}</td>
                                            <td style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: severityColor(s.severity), background: `${severityColor(s.severity)}15`, border: `1px solid ${severityColor(s.severity)}30` }}>
                                                    {s.severity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Escort Operator Equipment */}
                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f9fafb', marginBottom: '1rem' }}>Chain Equipment for Escort Operators</h2>
                        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                                {[
                                    { title: 'Class S Chains', desc: 'Most common for light trucks/SUVs. SAE Class S clearance fits most escort vehicles without fender modification.', price: '$60â€“$150/set' },
                                    { title: 'Cable Chains', desc: 'Lighter, easier to install. Acceptable in most states for non-commercial vehicles. Good for pilot car operators.', price: '$40â€“$100/set' },
                                    { title: 'AutoSock / Fabric Chains', desc: 'Accepted in some states as alternative to chains during R1 controls. Check state approval before relying on these.', price: '$80â€“$120/set' },
                                    { title: 'Snow Tires (M+S rated)', desc: 'Mud and snow rated tires may exempt you from chains during R1/lower controls in many states. 3PMSF symbol preferred.', price: '$120â€“$250/tire' },
                                ].map(eq => (
                                    <div key={eq.title} style={{ background: 'rgba(255,255,255,0.015)', borderRadius: 10, padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#f9fafb' }}>{eq.title}</h3>
                                            <span style={{ fontSize: 12, color: '#C6923A', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>{eq.price}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.55 }}>{eq.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 14, textAlign: 'center' }}>
                                <Link href="/store" style={{ fontSize: 13, color: '#C6923A', fontWeight: 700, textDecoration: 'none' }}>
                                    Browse chains & winter equipment on Haul Command Marketplace â†’
                                </Link>
                            </div>
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
                                        <span style={{ color: '#f59e0b', fontSize: 18, flexShrink: 0, marginLeft: 12 }}>+</span>
                                    </summary>
                                    <div style={{ padding: '0 1.25rem 1.25rem', fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.65 }}>
                                        {faq.acceptedAnswer.text}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2rem', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
                        <Truck style={{ width: 28, height: 28, color: '#C6923A' }} />
                        <div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 900, color: '#f9fafb' }}>Plan Your Route with Confidence</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#9ca3af', maxWidth: 460 }}>
                                Use Haul Command&apos;s route planning tools to check chain requirements, frost laws, and escort requirements for your entire corridor â€” before you dispatch.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Link href="/tools/route-survey" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none' }}>
                                Route Survey Tool <ArrowRight style={{ width: 14, height: 14 }} />
                            </Link>
                            <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
                                Find Escort Operators
                            </Link>
                        </div>
                    </div>

                    {/* Related Resources */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Related Resources</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                            {[
                                { href: '/resources/legal/frost-law-guide', label: 'Frost Laws by State' },
                                { href: '/resources/data/road-conditions', label: 'Live Road Conditions' },
                                { href: '/resources/data/highway-closures', label: 'Highway Closures & Alerts' },
                                { href: '/regulations', label: 'Oversize Load Regulations' },
                                { href: '/resources/certification/equipment-requirements', label: 'Escort Equipment Requirements' },
                                { href: '/resources/guides/how-to-start-pilot-car-company', label: 'Start a Pilot Car Company' },
                                { href: '/store', label: 'Equipment Marketplace' },
                                { href: '/directory', label: 'Operator Directory' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 13, color: '#f59e0b', fontWeight: 600, textDecoration: 'none' }}>
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