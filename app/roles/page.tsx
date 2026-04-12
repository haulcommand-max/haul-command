import type { Metadata } from 'next';
import Link from 'next/link';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Heavy Haul Roles â€” Pilot Car Operators, Brokers, Carriers & Dispatchers | Haul Command',
    description:
        'Find the right Haul Command tools for your role in the heavy haul industry. Pilot car operators, heavy haul brokers, oversize carriers, and dispatchers â€” every role has a dedicated hub.',
    keywords: [
        'heavy haul roles', 'pilot car operator', 'heavy haul broker', 'oversize carrier',
        'heavy haul dispatcher', 'escort vehicle operator', 'find pilot car', 'heavy haul jobs',
    ],
    alternates: { canonical: 'https://www.haulcommand.com/roles' },
    openGraph: {
        title: 'Heavy Haul Roles | Haul Command',
        description: 'Every role in heavy haul logistics â€” pilot car operators, brokers, carriers, and dispatchers â€” has a dedicated hub on Haul Command.',
        url: 'https://www.haulcommand.com/roles',
        siteName: 'Haul Command',
        type: 'website',
    },
};

const PAGE_SCHEMA = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebPage',
            name: 'Heavy Haul Roles | Haul Command',
            url: 'https://www.haulcommand.com/roles',
            description: 'Role hub for heavy haul logistics professionals â€” pilot car operators, brokers, carriers, dispatchers.',
            breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
                    { '@type': 'ListItem', position: 2, name: 'Roles', item: 'https://www.haulcommand.com/roles' },
                ],
            },
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                {
                    '@type': 'Question',
                    name: 'What is a heavy haul broker?',
                    acceptedAnswer: { '@type': 'Answer', text: 'A heavy haul broker is a logistics intermediary who arranges the transportation of oversize or overweight loads. They coordinate between shippers (who need loads moved) and carriers (who have the trucks and trailers), and also arrange for pilot car escort vehicles and permitting. Brokers typically charge a commission or flat fee per load.' },
                },
                {
                    '@type': 'Question',
                    name: 'What is the difference between a pilot car operator and a heavy haul carrier?',
                    acceptedAnswer: { '@type': 'Answer', text: 'A pilot car operator drives an escort vehicle that accompanies an oversize load for safety and compliance. A heavy haul carrier is the company operating the truck that actually transports the load. Both roles are required on most oversize moves â€” the carrier moves the freight, the pilot car escorts it.' },
                },
                {
                    '@type': 'Question',
                    name: 'What does a heavy haul dispatcher do?',
                    acceptedAnswer: { '@type': 'Answer', text: 'A heavy haul dispatcher coordinates the logistics of oversize load movements â€” arranging permits, booking pilot car escorts, confirming route surveys, and communicating with drivers and brokers. They are the operational hub that keeps every move compliant and on schedule.' },
                },
                {
                    '@type': 'Question',
                    name: 'How do I get listed as a pilot car operator on Haul Command?',
                    acceptedAnswer: { '@type': 'Answer', text: 'Claim your free Haul Command listing at haulcommand.com/claim. Add your operating states, certifications, insurance details, and equipment. Brokers and carriers search the directory to find available escorts â€” a verified listing dramatically increases your visibility.' },
                },
                {
                    '@type': 'Question',
                    name: 'How do I find a pilot car operator near me?',
                    acceptedAnswer: { '@type': 'Answer', text: 'Use the Haul Command directory to search by state, role, and availability. You can also use the find page for your specific city to see verified operators currently covering that market. Post a load on the load board to receive quotes from operators in the area.' },
                },
            ],
        },
    ],
};

const gold = '#D4A844';

const ROLES = [
    {
        href: '/roles/pilot-car-operator',
        icon: 'ðŸš—',
        title: 'Pilot Car Operators',
        subtitle: 'Escort Vehicle Operators (EVOs)',
        badges: ['Find Jobs', 'Claim Listing', 'Get Verified'],
        desc: 'The certified escort professionals who escort oversize loads safely through every state and jurisdiction. Find jobs, get verified, and dominate your corridors.',
        primaryCta: { label: 'ðŸ“‹ Browse Escort Jobs', href: '/loads' },
        secondaryCta: { label: 'âœ“ Claim Free Listing', href: '/claim' },
        color: gold,
        intent: 'I want to find pilot car jobs or grow my escort business',
        stats: [{ val: '14,000+', label: 'Operators' }, { val: '120', label: 'Countries' }],
    },
    {
        href: '/broker',
        icon: 'ðŸ“‹',
        title: 'Heavy Haul Brokers',
        subtitle: 'Load Coordinators & Freight Brokers',
        badges: ['Find Escorts', 'Post Loads', 'Track Coverage'],
        desc: 'Brokers who arrange oversize load movements, coordinate escorts, and keep every permitted load compliant. Find verified escorts fast, without the guesswork.',
        primaryCta: { label: 'ðŸ—ºï¸ Check Live Coverage', href: '/map' },
        secondaryCta: { label: 'ðŸ“¦ Post an Escort Need', href: '/loads/new' },
        color: '#3B82F6',
        intent: 'I need to find verified escorts and cover my loads',
        stats: [{ val: '<15min', label: 'Avg Response' }, { val: '24/7', label: 'Coverage' }],
    },
    {
        href: '/roles/heavy-haul-carrier',
        icon: 'ðŸš›',
        title: 'Heavy Haul Carriers',
        subtitle: 'Flatbed, Lowboy & Oversize Operators',
        badges: ['Find Escorts', 'Post Loads', 'List Operation'],
        desc: 'The carriers running the loads â€” flatbeds, lowboys, RGNs, and modular trailers. Find escorts for your move, post loads, or list your carrier company.',
        primaryCta: { label: 'ðŸ” Find Carriers', href: '/directory' },
        secondaryCta: { label: 'ðŸ“¦ Post a Load', href: '/loads' },
        color: '#8B5CF6',
        intent: 'I need escorts for my load or want to list my carrier operation',
        stats: [{ val: '50', label: 'US States' }, { val: '46+', label: 'Categories' }],
    },
    {
        href: '/roles/dispatcher',
        icon: 'ðŸ“¡',
        title: 'Dispatchers',
        subtitle: 'Load Dispatch & Operations Coordinators',
        badges: ['Dispatch Tools', 'Escort Coordinator', 'Load Board'],
        desc: 'The operational hub of every heavy haul move. Manage loads, coordinate pilot car escorts, track permits, and run compliant moves on time.',
        primaryCta: { label: 'ðŸ“¡ Open Load Board', href: '/loads' },
        secondaryCta: { label: 'ðŸ” Find Escort Now', href: '/directory' },
        color: '#22C55E',
        intent: 'I dispatch heavy haul loads and need to coordinate escorts',
        stats: [{ val: '35', label: 'Corridors' }, { val: '180+', label: 'City Markets' }],
    },
];

export default function RolesHubPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_SCHEMA) }} />

            <ProofStrip variant="bar" />

            <main style={{ minHeight: '100vh', background: '#06080f', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>

                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 0', fontSize: 11, color: '#6b7280', display: 'flex', gap: 6, alignItems: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
                    <span>â€º</span>
                    <span style={{ color: gold }}>Roles</span>
                </nav>

                {/* Hero */}
                <section style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,168,68,0.08), transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(2.5rem,5vw,4rem) 20px 2.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)', borderRadius: 20, marginBottom: 18 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Heavy Haul Logistics â€” All Roles</span>
                        </div>
                        <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.035em', color: '#f9fafb' }}>
                            What's Your Role in<br />
                            <span style={{ color: gold }}>Heavy Haul?</span>
                        </h1>
                        <p style={{ margin: '0 auto 30px', fontSize: 16, color: '#9ca3af', lineHeight: 1.7, maxWidth: 600 }}>
                            Every job in the oversize load ecosystem â€” escort operators, brokers, carriers, and dispatchers â€” has a dedicated hub on Haul Command. Pick your role to get started.
                        </p>
                    </div>
                </section>

                {/* Role Cards */}
                <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        {ROLES.map((role) => (
                            <div key={role.href} style={{ display: 'flex', flexDirection: 'column', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: `1px solid ${role.color}22`, overflow: 'hidden' }}>
                                {/* Card Header */}
                                <div style={{ padding: '22px 22px 18px', background: `${role.color}09`, borderBottom: `1px solid ${role.color}15` }}>
                                    <div style={{ fontSize: 36, marginBottom: 10 }}>{role.icon}</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb', marginBottom: 3 }}>{role.title}</div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: role.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{role.subtitle}</div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                                        {role.badges.map(b => (
                                            <span key={b} style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: `${role.color}15`, color: role.color, border: `1px solid ${role.color}30` }}>{b}</span>
                                        ))}
                                    </div>
                                    <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>{role.desc}</p>
                                </div>
                                {/* Intent Label */}
                                <div style={{ padding: '10px 22px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>"{role.intent}"</div>
                                </div>
                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                    {role.stats.map(s => (
                                        <div key={s.label} style={{ padding: '12px 22px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div style={{ fontSize: 20, fontWeight: 900, color: role.color }}>{s.val}</div>
                                            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* CTAs */}
                                <div style={{ padding: '14px 18px', marginTop: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                    <Link href={role.primaryCta.href} style={{ flex: 1, minWidth: 130, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: `linear-gradient(135deg, ${role.color}, ${role.color}cc)`, color: role.color === gold ? '#000' : '#fff', fontSize: 12, fontWeight: 900, textDecoration: 'none', textAlign: 'center' }}>
                                        {role.primaryCta.label}
                                    </Link>
                                    <Link href={role.secondaryCta.href} style={{ flex: 1, minWidth: 120, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                                        {role.secondaryCta.label}
                                    </Link>
                                </div>
                                {/* Full Hub Link */}
                                <Link href={role.href} style={{ display: 'block', padding: '10px 18px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: role.color, textDecoration: 'none', background: `${role.color}06`, borderTop: `1px solid ${role.color}18` }}>
                                    Full {role.title} Hub â†’
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FAQ Section */}
                <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px 2.5rem' }}>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f9fafb', margin: '0 0 14px' }}>Heavy Haul Role FAQ</h2>
                    {[
                        { q: 'What is a heavy haul broker?', a: 'A heavy haul broker is a logistics intermediary who arranges the transportation of oversize or overweight loads. They coordinate between shippers and carriers, and also arrange pilot car escorts and permitting. Brokers typically charge a commission or flat fee per load.' },
                        { q: 'What is the difference between a pilot car and a heavy haul carrier?', a: 'A pilot car operator drives an escort vehicle that accompanies an oversize load for safety and compliance. A heavy haul carrier operates the truck that transports the load. Both are required on most oversize moves â€” the carrier moves the freight, the pilot car escorts it.' },
                        { q: 'How do I get listed as a pilot car operator on Haul Command?', a: 'Claim your free Haul Command listing at /claim. Add your operating states, certifications, insurance, and equipment. Brokers can then search the directory to find you by state and availability.' },
                        { q: 'How many pilot cars does a load need?', a: 'It depends on load dimensions and the states traveled through. Use the Haul Command escort vehicle calculator to get an instant estimate based on your load dimensions and route.' },
                        { q: 'Do heavy haul carriers need permits in every state?', a: 'Yes. Every state the load travels through requires a separate permit. Requirements vary by load width, height, length, and weight. Use the state escort requirements tool to look up the rules for each state on your route.' },
                    ].map(({ q, a }) => (
                        <details key={q} style={{ marginBottom: 10, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <summary style={{ padding: '14px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 14, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ color: gold }}>+</span> {q}
                            </summary>
                            <p style={{ padding: '12px 18px 16px', margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.05)' }}>{a}</p>
                        </details>
                    ))}
                </section>

                {/* Internal link mesh */}
                <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 2rem', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Link href="/glossary/pilot-car" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>ðŸ“– What Is a Pilot Car?</Link>
                    <Link href="/glossary/oversize-load" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>ðŸ“– Oversize Load Definition</Link>
                    <Link href="/tools/escort-calculator" style={{ padding: '8px 14px', background: 'rgba(212,168,68,0.08)', border: '1px solid rgba(212,168,68,0.2)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: gold, textDecoration: 'none' }}>ðŸ§® Escort Calculator</Link>
                    <Link href="/escort-requirements" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>âš–ï¸ State Escort Rules</Link>
                    <Link href="/directory" style={{ padding: '8px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#22C55E', textDecoration: 'none' }}>ðŸ” Browse Directory</Link>
                    <Link href="/pricing" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>ðŸ’² All Plans</Link>
                </section>

                {/* No Dead End */}
                <NoDeadEndBlock
                    heading="Not Sure Where to Start?"
                    moves={[
                        { href: '/loads', icon: 'ðŸ“‹', title: 'Browse Escort Jobs', desc: 'Find loads needing coverage now', primary: true, color: gold },
                        { href: '/directory', icon: 'ðŸ”', title: 'Find Operators', desc: 'Browse verified by state', primary: true, color: '#22C55E' },
                        { href: '/claim', icon: 'âœ“', title: 'Claim Free Listing', desc: 'Get listed in 2 minutes' },
                        { href: '/available-now', icon: 'ðŸŸ¢', title: 'Available Right Now', desc: 'Live operator availability' },
                        { href: '/corridors', icon: 'ðŸ›£ï¸', title: 'Corridor Intelligence', desc: 'Route complexity data' },
                        { href: '/pricing', icon: 'ðŸ’Ž', title: 'Pro Plans', desc: 'Priority placement from $29/mo' },
                    ]}
                />

            </main>
        </>
    );
}