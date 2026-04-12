import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, CheckCircle, Shield, AlertTriangle, ArrowRight, Star } from 'lucide-react';

export const metadata: Metadata = {
    title: 'How to Start a Pilot Car Company (2026) | Free 10-Step Guide | Haul Command',
    description: 'Free step-by-step guide to starting a pilot car or escort vehicle company. Business formation, insurance, equipment, state certifications, rates, and finding your first loads. Updated 2026.',
    keywords: [
        'how to start a pilot car company', 'start escort vehicle business', 'pilot car business guide',
        'escort operator startup', 'pilot car company formation', 'escort business insurance requirements',
        'pilot car startup cost', 'how much does it cost to start a pilot car business',
        'pilot car certification requirements', 'pilot car equipment list', 'pilot car rates by state',
        'how to become a pilot car driver', 'escort vehicle company', 'pilot car business plan',
    ],
    alternates: { canonical: 'https://haulcommand.com/resources/guides/how-to-start-pilot-car-company' },
    openGraph: {
        title: 'How to Start a Pilot Car Company (2026) | Free 10-Step Guide',
        description: 'Complete free guide: business formation, certification, equipment, insurance, rates, and finding loads. No ebook purchase required.',
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
        { '@type': 'Question', name: 'How much does it cost to start a pilot car company?', acceptedAnswer: { '@type': 'Answer', text: 'Startup costs typically range from $5,000â€“$25,000 depending on your state and vehicle. Key costs: business formation ($100â€“$500), commercial auto insurance ($2,000â€“$8,000/year), equipment ($500â€“$3,000), and certification fees ($50â€“$300 per state). Many operators use an existing personal vehicle to minimize upfront costs.' } },
        { '@type': 'Question', name: 'Do I need a special license to drive a pilot car?', acceptedAnswer: { '@type': 'Answer', text: 'A standard driver\'s license is sufficient in most states. However, many states require additional escort vehicle certification or training. Some states (like Texas and Florida) have their own certification programs. Check your state\'s DOT requirements before operating.' } },
        { '@type': 'Question', name: 'What insurance do I need for a pilot car business?', acceptedAnswer: { '@type': 'Answer', text: 'At minimum: commercial auto insurance (not personal), general liability insurance ($1M minimum recommended), and possibly a commercial umbrella policy. Many brokers require $1Mâ€“$3M auto liability per occurrence. Rates vary by state and driving history.' } },
        { '@type': 'Question', name: 'How do pilot car operators find work?', acceptedAnswer: { '@type': 'Answer', text: 'Primary channels: Haul Command directory profile and load board, Facebook groups (Pilot Cars & Wide Loads), direct relationships with heavy haul trucking companies, broker networks, and state-specific escort dispatch services. Most operators get their first jobs through personal contacts in the trucking industry.' } },
    ],
};

const STARTUP_COSTS = [
    { item: 'Business Formation (LLC)', low: 50, high: 500, note: 'Varies by state' },
    { item: 'State Certification(s)', low: 50, high: 300, note: 'Per state â€” some free' },
    { item: 'Commercial Auto Insurance', low: 2000, high: 8000, note: 'Per year minimum' },
    { item: 'OVERSIZE LOAD Signs (2)', low: 80, high: 200, note: 'Front + rear required' },
    { item: 'Amber Strobe/LED Light Bar', low: 50, high: 400, note: 'LED recommended' },
    { item: 'CB Radio + Antenna', low: 60, high: 250, note: 'Channel 19 standard' },
    { item: 'Height Pole (Telescoping)', low: 200, high: 600, note: 'Required in many states' },
    { item: 'Flags, Vest, Safety Gear', low: 30, high: 100, note: 'Orange front, red rear' },
    { item: 'Reflective Tape & Markings', low: 15, high: 50, note: 'DOT-C2 required' },
    { item: 'Business Cards & Branding', low: 20, high: 150, note: 'Including vehicle magnets' },
];

const STEPS = [
    {
        num: 1,
        title: 'Choose Your Business Structure',
        content: `Most pilot car operators start as a sole proprietor (cheapest, simplest) or single-member LLC (better liability protection). An LLC costs $50â€“$500 depending on state and protects your personal assets if you're sued. File with your state's Secretary of State office. If you plan to hire drivers or scale, consider an S-Corp for tax advantages once revenue exceeds $40K/year.`,
        tips: ['LLC recommended for liability protection', 'Get an EIN from the IRS (free, takes 5 minutes)', 'Open a dedicated business bank account', 'Keep personal and business finances completely separate'],
    },
    {
        num: 2,
        title: 'Get State Certification',
        content: `Certification requirements vary dramatically by state. Texas requires a state-issued escort flag car certification. Florida requires a Road Ranger exam. Many states recognize national certifications like CEVO (Coaching the Emergency Vehicle Operator) or CSE. Some states have reciprocity agreements â€” meaning one cert covers multiple states. Check our State Certification Map for exact requirements and enroll directly through Haul Command.`,
        tips: ['Some states have reciprocity agreements (NASTO, SASHTO, MAASTO, WASHTO regions)', 'CEVO certification ($299) is recognized in 35+ states', 'CSE certification ($449) is the gold standard for height-pole operators', 'Plan 30â€“90 days for processing', 'Haul Command verified operators earn 40% more on average'],
    },
    {
        num: 3,
        title: 'Choose the Right Vehicle',
        content: `Most states require a full-size pickup truck or SUV for escort operations. Common choices: Ford F-150/F-250, Chevy Silverado, Dodge Ram, or Toyota Tundra. Key requirements: 4WD (essential for winter and off-road staging areas), good visibility, enough cargo space for equipment, and reliable in all weather. Many operators start with their existing truck. Avoid sedans â€” most states prohibit them for escort work.`,
        tips: ['Full-size truck or SUV required in most states', '4WD strongly recommended for all-season operation', 'White or yellow vehicles increase visibility', 'Vehicle must be in good mechanical condition â€” DOT inspections apply'],
    },
    {
        num: 4,
        title: 'Purchase Required Equipment',
        content: `Standard equipment: OVERSIZE LOAD sign (front and rear, 7' x 18" minimum), amber LED strobe light bar (360Â° visibility), flags (18" square, orange on front corners, red on rear), CB radio (channel 19 standard for trucker communication), height pole if operating in states that require it (16' telescoping recommended), reflective tape, Class 2 safety vest, and fire extinguisher. Budget $500â€“$3,000 for a full setup.`,
        tips: ['Height pole required by many states (16\' telescoping recommended)', 'Quality CB radio is non-negotiable â€” Cobra 29 LTD or Uniden Bearcat recommended', 'LED strobes required in some states â€” check minimum flash rate requirements', 'Keep spare flags, bulbs, and fuses in your vehicle at all times', 'Browse the Haul Command Equipment Marketplace for verified gear'],
    },
    {
        num: 5,
        title: 'Get Commercial Insurance',
        content: `You cannot use personal auto insurance for escort operations â€” it voids your policy. Commercial auto insurance typically costs $2,000â€“$8,000/year depending on your vehicle, driving record, and state. Most brokers require minimum $1M liability per occurrence. Some large carriers require $2Mâ€“$3M. Get quotes from Progressive Commercial, State Farm Commercial, or specialty trucking insurers like Canal Insurance or Great West Casualty.`,
        tips: ['Get at least 3-5 quotes â€” rates vary dramatically', 'FMCSA registration may be required for interstate work', 'General liability policy ($500Kâ€“$1M) adds extra protection', 'Upload your COI to Haul Command for instant carrier verification', 'Many brokers won\'t dispatch without verified insurance on file'],
    },
    {
        num: 6,
        title: 'Register for Permits & Authorities',
        content: `If you plan to work across state lines, you may need a USDOT number and MCS-90 endorsement for commercial vehicles over 10,001 lbs GVWR. Register for each state's oversize permit system so you understand what brokers are permitting. Most states have free shipper portals. Understanding the permit landscape makes you more valuable to carriers â€” you can advise on escort requirements before they even start planning.`,
        tips: ['USDOT required for interstate commerce over 10,001 lbs GVWR', 'Many pilot car vehicles are under this threshold', 'Understand permit types before talking to brokers', 'Use the Haul Command Permit Checker to look up requirements instantly'],
    },
    {
        num: 7,
        title: 'Build Your Rate Structure',
        content: `Standard pilot car rates: local/day rate ($280â€“$450/day), regional ($350â€“$600/day), long-haul ($400â€“$800/day), per-mile rates ($0.80â€“$1.50/mile). Don't undercut established operators â€” it hurts the whole industry and signals inexperience to carriers. Factor in deadhead miles (driving to the pickup point unpaid), waiting time, and overnight costs. Check the Haul Command Rate Guide for real-time market benchmarks by state.`,
        tips: ['Never work for fuel money alone â€” your minimum should cover fuel + insurance + profit', 'Factor in deadhead miles â€” charge portal-to-portal', 'Include waiting time in your rates ($25â€“$50/hr standard)', 'Rush/emergency rates should be 1.5xâ€“2x standard', 'Night/weekend/holiday rates should add a 25â€“75% premium'],
    },
    {
        num: 8,
        title: 'Set Up Your Haul Command Profile',
        content: `Your Haul Command profile is your digital storefront. Claim your free listing, upload your insurance certificate for instant verification, add your certifications for a verified badge, and set your service area by corridors. Verified operators with complete profiles receive 5x more dispatch offers than unverified operators. This is your #1 source of inbound work.`,
        tips: ['Claim your free profile at haulcommand.com/claim', 'Upload your COI for a Verified Insurance badge', 'Add all state certifications for a Certified Operator badge', 'Set your corridors to receive auto-matched loads', 'Pro upgrade ($29/mo) gives you unlimited responses + priority matching'],
    },
    {
        num: 9,
        title: 'Find Your First Loads',
        content: `With your Haul Command profile active, you'll start appearing in broker searches. Post your availability on the Haul Command load board. Join pilot car Facebook groups ("Pilot Cars & Wide Loads" is the largest). Contact local heavy haul trucking companies directly â€” find them on Haul Command's carrier directory. Build relationships with permit services who coordinate escorts. Your first 5 jobs will likely come from personal contacts â€” every trucking person you know is a potential client.`,
        tips: ['Claim your Haul Command profile (free)', 'Set your availability daily for priority matching', 'Join: "Pilot Cars & Wide Load" Facebook group (28K+ members)', 'Contact local permitted trucking companies directly', 'Respond to dispatch offers within 15 minutes for best fill rates'],
    },
    {
        num: 10,
        title: 'Scale Your Business',
        content: `Once you're consistently booked, start thinking about scaling. Add a second vehicle and hire a driver. Subscribe to high-demand corridors on Haul Command for guaranteed first-look at loads. Upgrade to Pro or Elite for priority dispatch. Build your trust score by completing jobs, maintaining good reviews, and keeping certifications current. Top operators on Haul Command earn $8,000â€“$15,000/month.`,
        tips: ['Subscribe to 2-3 high-demand corridors ($19/mo each)', 'Upgrade to Pro ($29/mo) or Elite ($79/mo) for priority matching', 'Use Haul Command FastPay to get paid same-day instead of NET-30', 'Target wind energy corridors â€” highest margins in the industry', 'Consider adding height-pole capability â€” it doubles your rate'],
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
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>Free Guide Â· 10 Steps Â· No Ebook Purchase Required</span>
                        </div>
                        <h1 style={{ margin: '0 0 1rem', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                            How to Start a Pilot Car Company
                        </h1>
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#9ca3af', lineHeight: 1.65, maxWidth: 680 }}>
                            A complete, free guide to launching a profitable escort vehicle business â€” including business formation, certification, vehicle selection, insurance, equipment, rates, and scaling to $8Kâ€“$15K/month. Updated for 2026. No ebook purchase required.
                        </p>
                        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>â± 12 min read</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>ðŸ“… Updated March 2026</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>ðŸ· Escort Operations Â· Business</span>
                        </div>
                    </header>

                    {/* Quick Summary */}
                    <div style={{ background: 'rgba(198,146,58,0.06)', border: '1px solid rgba(198,146,58,0.2)', borderRadius: 14, padding: '1.5rem', marginBottom: '2.5rem', borderLeft: '4px solid #C6923A' }}>
                        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800, color: '#f9fafb' }}>Quick Summary</h2>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#d1d5db', lineHeight: 1.6 }}>
                            Starting a pilot car company requires: business formation (LLC recommended), state certification, commercial insurance ($2Kâ€“$8K/yr), required equipment ($500â€“$3K), and a profile on Haul Command to connect with brokers. Startup cost: <strong style={{ color: '#C6923A' }}>$5,000â€“$25,000</strong> depending on state and vehicle. Top Haul Command operators earn <strong style={{ color: '#10b981' }}>$8,000â€“$15,000/month</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <Link href="/resources/certification/state-pilot-car-certifications" style={{ fontSize: 13, color: '#C6923A', fontWeight: 700, textDecoration: 'none' }}>
                                Check your state&apos;s certification requirements â†’
                            </Link>
                            <Link href="/services/certification" style={{ fontSize: 13, color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>
                                Enroll in CEVO/CSE Certification â†’
                            </Link>
                        </div>
                    </div>

                    {/* Startup Cost Calculator */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.5rem', marginBottom: '2.5rem' }}>
                        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800, color: '#f9fafb' }}>ðŸ’° Startup Cost Breakdown</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {STARTUP_COSTS.map(c => (
                                <div key={c.item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.015)', borderRadius: 8, fontSize: 13 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span style={{ color: '#d1d5db', fontWeight: 600 }}>{c.item}</span>
                                        <span style={{ color: '#6b7280', fontSize: 11 }}>{c.note}</span>
                                    </div>
                                    <span style={{ color: '#C6923A', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                                        ${c.low.toLocaleString()}â€“${c.high.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginTop: 8, background: 'rgba(198,146,58,0.08)', borderRadius: 10, border: '1px solid rgba(198,146,58,0.2)' }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb' }}>Estimated Total Range</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: '#C6923A', fontFamily: "'JetBrains Mono', monospace" }}>
                                ${STARTUP_COSTS.reduce((s, c) => s + c.low, 0).toLocaleString()}â€“${STARTUP_COSTS.reduce((s, c) => s + c.high, 0).toLocaleString()}
                            </span>
                        </div>
                        <p style={{ margin: '12px 0 0', fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                            Note: Many operators start with an existing truck, reducing vehicle costs. Insurance is the largest ongoing expense. Equipment can be purchased through the <Link href="/store" style={{ color: '#C6923A', textDecoration: 'none' }}>Haul Command Marketplace</Link>.
                        </p>
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

                    {/* Certification Enrollment CTA */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(16,185,129,0.1)', borderRadius: 20, marginBottom: 12 }}>
                            <Star style={{ width: 12, height: 12, color: '#10b981' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>Get Certified Now</span>
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 900, color: '#f9fafb' }}>Certified Operators Earn 40% More</h3>
                        <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: '#9ca3af', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                            Enroll in CEVO or CSE certification through Haul Command. Recognized in 35+ states. Verified badge on your profile means priority dispatch and higher rates.
                        </p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Link href="/services/certification" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'linear-gradient(135deg, #10b981, #34d399)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none' }}>
                                CEVO Certification â€” $299 <ArrowRight style={{ width: 14, height: 14 }} />
                            </Link>
                            <Link href="/services/certification" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
                                CSE Certification â€” $449
                            </Link>
                        </div>
                    </div>

                    {/* Main CTA block */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2rem', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
                        <Shield style={{ width: 28, height: 28, color: '#C6923A' }} />
                        <div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 900, color: '#f9fafb' }}>Ready to Get to Work?</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#9ca3af', maxWidth: 460 }}>
                                Claim your free Haul Command profile â€” show up in broker searches, receive load offers, and build your verified reputation. Top operators earn $8Kâ€“$15K/month.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                            <Link href="/claim" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none' }}>
                                Claim Free Profile <ArrowRight style={{ width: 14, height: 14 }} />
                            </Link>
                            <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
                                View Pro Plans
                            </Link>
                            <Link href="/store" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
                                Equipment Marketplace
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
                                { href: '/resources/legal/frost-law-guide', label: 'Frost Laws by State' },
                                { href: '/resources/legal/tire-chain-laws', label: 'Tire Chain Laws' },
                                { href: '/services/certification', label: 'Get CEVO/CSE Certified' },
                                { href: '/store', label: 'Equipment Marketplace' },
                                { href: '/tools/escort-calculator', label: 'Escort Cost Calculator' },
                                { href: '/tools/permit-checker', label: 'Permit Requirements Checker' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 13, color: '#C6923A', fontWeight: 600, textDecoration: 'none' }}>
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