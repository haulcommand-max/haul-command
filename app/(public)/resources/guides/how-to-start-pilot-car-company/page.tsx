import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, CheckCircle, Shield, AlertTriangle, ArrowRight, Star } from 'lucide-react';

export const metadata: Metadata = {
    title: 'How to Start a Pilot Car Company (2026) | Complete Guide | Haul Command',
    description: 'Step-by-step guide to starting a pilot car or escort vehicle company in the US. Business formation, insurance, equipment, state certifications, and finding your first loads.',
    keywords: [
        'how to start a pilot car company', 'start escort vehicle business', 'pilot car business guide',
        'escort operator startup', 'pilot car company formation', 'escort business insurance requirements',
    ],
    alternates: { canonical: 'https://haulcommand.com/resources/guides/how-to-start-pilot-car-company' },
    openGraph: {
        title: 'How to Start a Pilot Car Company | Haul Command',
        description: 'Complete 2026 guide: business formation, certification, equipment, insurance, and finding your first escort loads.',
    },
};

const PAGE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How to Start a Pilot Car Company (2026)',
    description: 'Step-by-step guide to starting a pilot car or escort vehicle company in the US.',
    publisher: { '@type': 'Organization', name: 'Haul Command' },
    url: 'https://haulcommand.com/resources/guides/how-to-start-pilot-car-company',
};

const FAQ_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        { '@type': 'Question', name: 'How much does it cost to start a pilot car company?', acceptedAnswer: { '@type': 'Answer', text: 'Startup costs typically range from $5,000–$25,000 depending on your state and vehicle. Key costs: business formation ($100–$500), commercial auto insurance ($2,000–$8,000/year), equipment ($500–$3,000), and certification fees ($50–$300 per state). Many operators use an existing personal vehicle to minimize upfront costs.' } },
        { '@type': 'Question', name: 'Do I need a special license to drive a pilot car?', acceptedAnswer: { '@type': 'Answer', text: 'A standard driver\'s license is sufficient in most states. However, many states require additional escort vehicle certification or training. Some states (like Texas and Florida) have their own certification programs. Check your state\'s DOT requirements before operating.' } },
        { '@type': 'Question', name: 'What insurance do I need for a pilot car business?', acceptedAnswer: { '@type': 'Answer', text: 'At minimum: commercial auto insurance (not personal), general liability insurance ($1M minimum recommended), and possibly a commercial umbrella policy. Many brokers require $1M–$3M auto liability per occurrence. Rates vary by state and driving history.' } },
        { '@type': 'Question', name: 'How do pilot car operators find work?', acceptedAnswer: { '@type': 'Answer', text: 'Primary channels: Haul Command directory profile and load board, Facebook groups (Pilot Cars & Wide Loads), direct relationships with heavy haul trucking companies, broker networks, and state-specific escort dispatch services. Most operators get their first jobs through personal contacts in the trucking industry.' } },
    ],
};

const STEPS = [
    {
        num: 1,
        title: 'Choose Your Business Structure',
        content: `Most pilot car operators start as a sole proprietor (cheapest, simplest) or single-member LLC (better liability protection). An LLC costs $50–$500 depending on state and protects your personal assets if you're sued. File with your state's Secretary of State office.`,
        tips: ['LLC recommended for liability protection', 'Get an EIN from the IRS (free, takes 5 minutes)', 'Open a dedicated business bank account'],
    },
    {
        num: 2,
        title: 'Get State Certification',
        content: `Certification requirements vary dramatically by state. Texas requires a state-issued escort flag car certification. Florida requires a Road Ranger exam. Many states recognize national certifications from NPCA or OOCL. Check our State Certification Map for exact requirements.`,
        tips: ['Some states have reciprocity agreements', 'NPCA certification is recognized in 35+ states', 'Plan 30–90 days for processing'],
    },
    {
        num: 3,
        title: 'Purchase Required Equipment',
        content: `Standard equipment: OVERSIZE LOAD sign (front and rear), amber strobe light, flags (orange on front, red on rear), CB radio (channel 19 standard), height pole if operating in states that require it, reflective tape, and safety vest. Budget $500–$3,000 for a full setup.`,
        tips: ['Height pole required by many states (16\' telescoping recommended)', 'Quality CB radio is non-negotiable', 'LED strobes are required in some states'],
    },
    {
        num: 4,
        title: 'Get Commercial Insurance',
        content: `You cannot use personal auto insurance for escort operations — it voids your policy. Commercial auto insurance typically costs $2,000–$8,000/year depending on your vehicle, driving record, and state. Most brokers require minimum $1M liability per occurrence. Get quotes from progressive commercial, State Farm commercial, or specialty trucking insurers.`,
        tips: ['Get at least 3 quotes', 'FMCSA registration may be required for interstate work', 'General liability policy adds extra protection'],
    },
    {
        num: 5,
        title: 'Register for Permits & Authorities',
        content: `If you plan to work across state lines, you may need USDOT number and MCS-90 endorsement for commercial vehicles over 10,001 lbs GVWR. Register for each state's oversize permit system so you understand what brokers are permitting. Most states have free shipper portals.`,
        tips: ['USDOT required for interstate commerce over 10,001 lbs GVWR', 'Many pilot car vehicles are under this threshold', 'Understand permit types before talking to brokers'],
    },
    {
        num: 6,
        title: 'Build Your Rate Structure',
        content: `Standard pilot car rates: local/day rate ($280–$450/day), regional ($350–$600/day), long-haul ($400–$800/day), per-mile rates ($0.80–$1.50/mile). Don't undercut established operators — it hurts the whole industry. Check our State Rate Guide for market benchmarks.`,
        tips: ['Never work for fuel money alone', 'Factor in deadhead miles', 'Include waiting time in your rates'],
    },
    {
        num: 7,
        title: 'Find Your First Loads',
        content: `Claim your free Haul Command profile to appear in broker searches. Post in pilot car Facebook groups. Contact local heavy haul trucking companies directly. Build relationships with permit services who coordinate escorts. Your first 5 jobs will likely come from personal contacts — every trucking person you know is a potential client.`,
        tips: ['Claim your Haul Command profile (free)', 'Join: "Pilot Cars & Wide Load" Facebook group', 'Contact local permitted trucking companies directly'],
    },
];

export default function HowToStartPilotCarPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_SCHEMA) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

            <div style={{ minHeight: '100vh', background: '#080810', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
                <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1.5rem' }}>

                    {/* Breadcrumb */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, flexWrap: 'wrap' }}>
                        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
                        <ChevronRight style={{ width: 12, height: 12 }} />
                        <Link href="/resources" style={{ color: '#6b7280', textDecoration: 'none' }}>Resources</Link>
                        <ChevronRight style={{ width: 12, height: 12 }} />
                        <Link href="/resources#guides" style={{ color: '#6b7280', textDecoration: 'none' }}>Guides</Link>
                        <ChevronRight style={{ width: 12, height: 12 }} />
                        <span style={{ color: '#C6923A' }}>Start a Pilot Car Company</span>
                    </nav>

                    <header style={{ marginBottom: '2.5rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, marginBottom: 16 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>Complete Guide · 7 Steps</span>
                        </div>
                        <h1 style={{ margin: '0 0 1rem', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                            How to Start a Pilot Car Company
                        </h1>
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#9ca3af', lineHeight: 1.65, maxWidth: 680 }}>
                            A step-by-step guide to launching a profitable escort vehicle business in the US — including business formation, certification, insurance, equipment, and finding your first loads. Updated for 2026.
                        </p>
                        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>⏱ 12 min read</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>📅 Updated March 2026</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>🏷 Escort Operations · Business</span>
                        </div>
                    </header>

                    {/* Quick Summary */}
                    <div style={{ background: 'rgba(198,146,58,0.06)', border: '1px solid rgba(198,146,58,0.2)', borderRadius: 14, padding: '1.5rem', marginBottom: '2.5rem', borderLeft: '4px solid #C6923A' }}>
                        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800, color: '#f9fafb' }}>Quick Summary</h2>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#d1d5db', lineHeight: 1.6 }}>
                            Starting a pilot car company requires: business formation (LLC recommended), state certification, commercial insurance ($2K–$8K/yr), required equipment ($500–$3K), and a profile on Haul Command to connect with brokers. Startup cost: <strong style={{ color: '#C6923A' }}>$5,000–$25,000</strong> depending on state and vehicle.
                        </p>
                        <Link href="/resources/certification/state-pilot-car-certifications" style={{ fontSize: 13, color: '#C6923A', fontWeight: 700, textDecoration: 'none' }}>
                            Check your state's certification requirements →
                        </Link>
                    </div>

                    {/* Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                        {STEPS.map(step => (
                            <section key={step.num} id={`step-${step.num}`} style={{ scrollMarginTop: 80 }}>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(198,146,58,0.3), rgba(198,146,58,0.1))', border: '1px solid rgba(198,146,58,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#C6923A', flexShrink: 0, marginTop: 2 }}>
                                        {step.num}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', fontWeight: 800, color: '#f9fafb' }}>
                                            Step {step.num}: {step.title}
                                        </h2>
                                        <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#a1a1aa', lineHeight: 1.7 }}>{step.content}</p>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1rem' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Key Points</div>
                                            {step.tips.map((tip, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                                                    <CheckCircle style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0, marginTop: 1 }} />
                                                    <span style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.5 }}>{tip}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* FAQ */}
                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f9fafb', marginBottom: '1.25rem' }}>
                            Common Questions
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {FAQ_SCHEMA.mainEntity.map((faq, i) => (
                                <details key={i} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                                    <summary style={{ padding: '1rem 1.25rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#f9fafb', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {faq.name}
                                        <span style={{ color: '#C6923A', fontSize: 18, flexShrink: 0, marginLeft: 12 }}>+</span>
                                    </summary>
                                    <div style={{ padding: '0 1.25rem 1.25rem', fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.65 }}>
                                        {faq.acceptedAnswer.text}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>

                    {/* CTA block */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2rem', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
                        <Shield style={{ width: 28, height: 28, color: '#C6923A' }} />
                        <div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 900, color: '#f9fafb' }}>Ready to Get to Work?</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#9ca3af', maxWidth: 460 }}>
                                Claim your free Haul Command profile — show up in broker searches, receive load offers, and build your verified reputation.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Link href="/claim" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none' }}>
                                Claim Free Profile <ArrowRight style={{ width: 14, height: 14 }} />
                            </Link>
                            <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
                                Browse Directory
                            </Link>
                        </div>
                    </div>

                    {/* Related resources */}
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Related Resources</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                            {[
                                { href: '/resources/certification/state-pilot-car-certifications', label: 'State Certification Map' },
                                { href: '/resources/certification/equipment-requirements', label: 'Equipment Requirements' },
                                { href: '/resources/business/insurance-requirements', label: 'Insurance Requirements' },
                                { href: '/resources/business/rate-negotiation-guide', label: 'Rate Negotiation Guide' },
                                { href: '/glossary/pilot-car', label: 'Glossary: Pilot Car' },
                                { href: '/rates', label: 'Pilot Car Rate Guide' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 13, color: '#C6923A', fontWeight: 600, textDecoration: 'none' }}>
                                    {l.label} →
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
