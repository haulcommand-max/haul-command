import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Download, BookOpen, Shield, Truck, Globe, Scale, Wrench, AlertTriangle, Star, Users, FileText, Map, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Heavy Haul Resource Hub — Guides, Permits & Pilot Car Training | Haul Command',
    description: 'Free guides, permit checklists, state certification maps, escort requirement summaries, and downloadable templates for pilot car operators, freight brokers, and heavy haul professionals.',
    keywords: [
        'pilot car training guide', 'oversize load permit guide', 'how to start pilot car company',
        'escort vehicle certification by state', 'heavy haul resource library', 'oversize load checklist',
        'bill of lading template', 'pilot car escort requirements pdf', 'superload permits guide',
        'frost laws guide', 'tire chain laws by state', 'heavy haul compliance resources',
    ],
    alternates: { canonical: 'https://haulcommand.com/resources' },
    robots: 'index,follow',
    openGraph: {
        title: 'Heavy Haul Resource Hub | Haul Command',
        description: 'The #1 free resource library for pilot car operators, freight brokers, and oversize load professionals. Guides, templates, certification maps, and compliance tools.',
        url: 'https://haulcommand.com/resources',
        images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
};

// ── Schema ────────────────────────────────────────────────────────────────────
const COLLECTION_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Heavy Haul Resource Hub',
    description: 'Free guides, permit tools, certification maps, and downloadable templates for the oversize load industry.',
    url: 'https://haulcommand.com/resources',
    publisher: { '@type': 'Organization', name: 'Haul Command', url: 'https://haulcommand.com' },
    numberOfItems: 40,
};

const FAQ_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'How do I become a certified pilot car operator?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Requirements vary by state. Most require a valid driver\'s license, a safety course (e.g., ESCORT or state-approved), an approved vehicle, and specific equipment (flags, lights, height pole). See our State Certification Guide for exact requirements by state.',
            },
        },
        {
            '@type': 'Question',
            name: 'What permits do I need for an oversize load?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Oversize loads exceeding 8\'6" wide, 13\'6" tall, or 80,000 lbs gross require state-issued permits for each state traveled. Superloads may require engineering route surveys, pilot cars, and law enforcement escorts. Use our Permit Calculator for an instant estimate.',
            },
        },
        {
            '@type': 'Question',
            name: 'What are the maximum legal dimensions for a load without a permit?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'In most US states: 8\'6" wide, 13\'6" tall, 53\' long, 80,000 lbs gross. Individual state limits vary — always verify with our state regulations tool.',
            },
        },
        {
            '@type': 'Question',
            name: 'How far can something stick out the back of a vehicle?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Federal law allows rear overhang up to 4 feet without a flag. Beyond 4 feet requires a red flag/light. Beyond 6 feet requires a permit in most states. State rules vary.',
            },
        },
        {
            '@type': 'Question',
            name: 'What is the difference between a lead car and a chase car?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'A lead (front) escort car travels ahead to warn oncoming traffic, check clearances, and communicate hazards. A chase (rear) car follows to prevent unsafe overtaking and monitor the load from behind. Most states require both for wide loads above certain thresholds.',
            },
        },
    ],
};

// ── Resource Data ──────────────────────────────────────────────────────────────

const RESOURCE_CLUSTERS = [
    {
        id: 'guides',
        icon: BookOpen,
        color: '#38bdf8',
        label: 'Guides & How-Tos',
        description: 'Step-by-step operational guides for operators and brokers',
        resources: [
            { title: 'How to Start a Pilot Car Company', desc: 'Business formation, insurance, equipment, and certification in one guide.', href: '/resources/guides/how-to-start-pilot-car-company', tag: 'Guide', downloadable: false },
            { title: 'How to Become a Certified Escort Driver', desc: 'State-by-state requirements, testing prep, and reciprocity rules explained.', href: '/resources/guides/become-certified-escort-driver', tag: 'Guide', downloadable: false },
            { title: 'Heavy Equipment Transport — Complete Guide', desc: 'Oversized cargo planning, route surveys, escort specs, and permit workflow.', href: '/resources/guides/heavy-equipment-transport', tag: 'Guide', downloadable: false },
            { title: 'Aircraft Shipping & Transport Guide', desc: 'Special considerations for aviation component transport — clearances, routes, and escorts.', href: '/resources/guides/aircraft-shipping', tag: 'Specialty', downloadable: false },
            { title: 'Boat & Marine Equipment Shipping Guide', desc: 'Permits, escort requirements, and width considerations for oversize boat and marine vessel transport.', href: '/resources/guides/boat-shipping', tag: 'Specialty', downloadable: false },
            { title: 'Trailer Types — Complete Reference', desc: 'Flatbed, lowboy, RGN, double-drop, stretch, and specialty trailers — specs, capacity, and best use cases.', href: '/resources/guides/trailer-types', tag: 'Reference', downloadable: false },
            { title: 'Cross-Border Oversize Hauling (US/Canada)', desc: 'Regulatory differences, cabotage rules, and escort requirements for cross-border moves.', href: '/resources/guides/cross-border-oversize', tag: 'Guide', downloadable: false },
            { title: 'Wind Turbine Blade Transport Guide', desc: 'Specialized routing, turning geometry tools, and escort configurations for blade hauls.', href: '/resources/guides/wind-turbine-transport', tag: 'Specialty', downloadable: false },
            { title: 'Autonomous Vehicle Escort Operations', desc: 'Emerging regulations and operational protocols for escorting autonomous trucks and AV test vehicles.', href: '/resources/guides/autonomous-vehicle-escort', tag: 'Specialty', downloadable: false },
        ],
    },
    {
        id: 'legal',
        icon: Scale,
        color: '#f59e0b',
        label: 'Legal & Permits',
        description: 'Permit workflows, dimensional limits, and compliance references',
        resources: [
            { title: 'Maximum Legal Load Sizes by State', desc: 'Width, height, length, and weight limits for all 50 states — no permit needed thresholds.', href: '/regulations', tag: 'Reference', downloadable: false },
            { title: 'Superload Permit Process — Step by Step', desc: 'Engineering studies, route approvals, and multi-state coordination for loads over 200,000 lbs.', href: '/resources/legal/superload-permit-process', tag: 'Permits', downloadable: false },
            { title: 'Frost Law Guide — Spring Restrictions by State', desc: '20 states covered — when frost laws activate, weight reduction %, severity ratings, and exemptions.', href: '/resources/legal/frost-law-guide', tag: 'Law', downloadable: false },
            { title: 'Tire Chain Laws & Requirements', desc: '17 states — chain control levels (R1/R2/R3), escort vehicle requirements, and equipment specs.', href: '/resources/legal/tire-chain-laws', tag: 'Law', downloadable: false },
            { title: 'Federal Bridge Formula Calculator', desc: 'Understand axle weight distribution requirements and FHWA bridge formula compliance.', href: '/tools/bridge-weight', tag: 'Tool', downloadable: false },
            { title: 'Divisible Load Guide', desc: 'When loads must be broken down by law — definitions, exceptions, and exemptions by state.', href: '/resources/legal/divisible-load-guide', tag: 'Law', downloadable: false },
            { title: 'Holiday Restrictions by State', desc: 'Oversize load travel restrictions during federal holidays, weekends, and state-observed holidays.', href: '/resources/legal/holiday-restrictions', tag: 'Law', downloadable: false },
            { title: 'Maximum Overhang & Rear Projection Laws', desc: 'How far loads can stick out the front, back, and sides of a vehicle — state-by-state limits.', href: '/resources/legal/overhang-laws', tag: 'Law', downloadable: false },
            { title: 'Axle Weight Regulations by State', desc: 'Legal axle weight limits — steer, drive, single, tandem, tridem — and overweight permit thresholds for all 50 states.', href: '/resources/legal/axle-regulations', tag: 'Law', downloadable: false },
            { title: 'Trip / IRP Permits Guide', desc: 'International Registration Plan permits — apportioned registration, reciprocity rules, and filing process by state.', href: '/resources/legal/irp-permits', tag: 'Permits', downloadable: false },
            { title: 'Fuel / IFTA Permits Guide', desc: 'IFTA fuel tax reporting, temporary permits, and compliance requirements for interstate carriers.', href: '/resources/legal/ifta-permits', tag: 'Permits', downloadable: false },
            { title: 'Oversize / Overweight Fines & Penalties', desc: 'State-by-state fine schedules, penalty structures, and enforcement consequences for oversize and overweight violations.', href: '/resources/legal/oversize-fines', tag: 'Law', downloadable: false },
            { title: 'Annual Permits — Oversize/Overweight', desc: 'Annual blanket permits vs. single-trip permits — when each type makes sense, costs, and application process by state.', href: '/resources/legal/annual-permits', tag: 'Permits', downloadable: false },
        ],
    },
    {
        id: 'certification',
        icon: Shield,
        color: '#10b981',
        label: 'Certifications & Training',
        description: 'State-by-state pilot car certification requirements and training resources',
        resources: [
            { title: 'State Pilot Car Certification Map', desc: 'Interactive guide showing certification requirements for all 50 states — testing, reciprocity, and renewal.', href: '/resources/certification/state-pilot-car-certifications', tag: 'Certification', downloadable: false },
            { title: 'NPCA Certification Overview', desc: 'National Pilot Car Association certification process, exam prep, and industry recognition.', href: '/resources/certification/npca-overview', tag: 'Certification', downloadable: false },
            { title: 'Height Pole Operation & Testing', desc: 'Rules for height pole setup, calibration, and state-specific height pole operator requirements.', href: '/resources/certification/height-pole-guide', tag: 'Training', downloadable: false },
            { title: 'Escort Vehicle Equipment Requirements', desc: 'Flags, lights, signs, radios, and vehicle specs required by state law.', href: '/resources/certification/equipment-requirements', tag: 'Reference', downloadable: false },
            { title: 'Online Training Programs Directory', desc: 'Approved training providers for escort vehicle operator certification across the US and Canada.', href: '/training', tag: 'Training', downloadable: false },
            { title: 'Continuing Education for Escort Operators', desc: 'CEU requirements, renewal timelines, and advanced certifications for experienced operators.', href: '/resources/certification/continuing-education', tag: 'Training', downloadable: false },
        ],
    },
    {
        id: 'business',
        icon: Truck,
        color: '#a78bfa',
        label: 'Business Resources',
        description: 'Templates, contracts, and business tools for operators and brokers',
        resources: [
            { title: 'Bill of Lading Template (Download)', desc: 'Industry-standard BOL template for oversize and heavy haul shipments — print-ready PDF.', href: '/resources/business/bill-of-lading-template', tag: 'Download', downloadable: true },
            { title: 'Pilot Car Service Agreement Template', desc: 'Legal contract template for escort service engagements — fully editable.', href: '/resources/business/service-agreement-template', tag: 'Download', downloadable: true },
            { title: 'Escort Checklist — Pre-Trip (Download)', desc: 'Vehicle inspection, equipment check, and comms pre-trip checklist for escort operators.', href: '/resources/business/escort-pre-trip-checklist', tag: 'Download', downloadable: true },
            { title: 'Insurance Requirements for Pilot Cars', desc: 'Minimum auto liability limits, commercial endorsements, and state-specific requirements.', href: '/resources/business/insurance-requirements', tag: 'Guide', downloadable: false },
            { title: 'Broker-Operator Rate Negotiation Guide', desc: 'How to price escort services, negotiate with brokers, and avoid below-market contracts.', href: '/resources/business/rate-negotiation-guide', tag: 'Guide', downloadable: false },
            { title: 'Pilot Car Rates by State (2026)', desc: 'Market rate data for local, regional, and long-haul escort services across all 50 states.', href: '/rates', tag: 'Data', downloadable: false },
        ],
    },
    {
        id: 'equipment',
        icon: Wrench,
        color: '#fb923c',
        label: 'Equipment & Safety',
        description: 'Required gear, safety standards, and equipment specifications',
        resources: [
            { title: 'Oversize Signage Requirements by State', desc: '"OVERSIZE LOAD" sign specs — size, placement, and lighting requirements per state law.', href: '/resources/equipment/oversize-signage', tag: 'Compliance', downloadable: false },
            { title: 'CB Radio & Communication Protocols', desc: 'Channel assignments, callout procedures, and communication standards for escort operations.', href: '/resources/equipment/cb-radio-guide', tag: 'Guide', downloadable: false },
            { title: 'Escort Vehicle Lighting Requirements', desc: 'Amber flashing light specs, placement rules, and state-by-state lighting law summary.', href: '/resources/equipment/lighting-requirements', tag: 'Compliance', downloadable: false },
            { title: 'Flag & Safety Equipment Guide', desc: 'Flag color, size, and placement specifications for oversize load escorts.', href: '/resources/equipment/flag-requirements', tag: 'Compliance', downloadable: false },
        ],
    },
    {
        id: 'data',
        icon: Globe,
        color: '#22d3ee',
        label: 'Live Data & Conditions',
        description: 'Real-time conditions, road closures, and market intelligence',
        resources: [
            { title: 'Road Conditions by State', desc: 'Live highway conditions, seasonal closures, and construction delay feeds for all 50 states.', href: '/resources/data/road-conditions', tag: 'Live', downloadable: false },
            { title: 'Live Highway Closures & Alerts', desc: 'Real-time DOT closure notices affecting oversize load routes across the US and Canada.', href: '/resources/data/highway-closures', tag: 'Live', downloadable: false },
            { title: 'Permit Processing Times by State', desc: 'Average permit processing delays by state DOT — plan your haul accordingly.', href: '/resources/data/permit-processing-times', tag: 'Data', downloadable: false },
            { title: 'Pilot Car Market Rate Index', desc: 'Weekly market rate index for escort services — regional and national benchmarks.', href: '/rates', tag: 'Data', downloadable: false },
            { title: 'Oversize Load Running Hours by State', desc: 'Sunrise/sunset, curfew hours, and state-by-state operating windows for oversize movements.', href: '/resources/data/running-hours', tag: 'Data', downloadable: false },
            { title: 'Peak Season Rate Trends', desc: 'Historical and current rate data showing seasonal demand patterns for escort services.', href: '/resources/data/peak-season-rates', tag: 'Data', downloadable: false },
        ],
    },
];

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    Guide: { bg: 'rgba(56,189,248,0.1)', text: '#38bdf8' },
    Specialty: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7' },
    Reference: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' },
    Permits: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
    Law: { bg: 'rgba(239,68,68,0.1)', text: '#f87171' },
    Tool: { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
    Certification: { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
    Training: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8' },
    Download: { bg: 'rgba(251,146,60,0.12)', text: '#fb923c' },
    Data: { bg: 'rgba(34,211,238,0.1)', text: '#22d3ee' },
    Live: { bg: 'rgba(34,197,94,0.1)', text: '#4ade80' },
    Compliance: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24' },
};

const TRUST_STATS = [
    { value: '3,000+', label: 'Glossary Terms' },
    { value: '56+', label: 'Resource Guides' },
    { value: '50', label: 'States Covered' },
    { value: '120', label: 'Countries' },
];

export default function ResourceHubPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTION_SCHEMA) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

            <div style={{ minHeight: '100vh', background: '#080810', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>

                {/* ── Hero ────────────────────────────────────────────────── */}
                <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(198,146,58,0.1), transparent 70%)', pointerEvents: 'none' }} />
                    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>

                        {/* Breadcrumb */}
                        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
                            <ChevronRight style={{ width: 12, height: 12 }} />
                            <span style={{ color: '#C6923A' }}>Resource Hub</span>
                        </nav>

                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 280 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.25)', borderRadius: 20, marginBottom: 16 }}>
                                    <BookOpen style={{ width: 12, height: 12, color: '#C6923A' }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#C6923A', textTransform: 'uppercase', letterSpacing: 1 }}>Knowledge & Compliance Hub</span>
                                </div>
                                <h1 style={{ margin: '0 0 1rem', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                                    The Heavy Haul<br />
                                    <span style={{ color: '#C6923A' }}>Resource Library</span>
                                </h1>
                                <p style={{ margin: '0 0 2rem', fontSize: '1.1rem', color: '#9ca3af', lineHeight: 1.65, maxWidth: 560 }}>
                                    Every guide, permit reference, checklist, and certification map a pilot car operator, broker, or shipper needs — free, accurate, and sourced from 24+ months of heavy haul market intelligence.
                                </p>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none' }}>
                                        Find Operators <ArrowRight style={{ width: 14, height: 14 }} />
                                    </Link>
                                    <Link href="/tools/permit-calculator" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
                                        Permit Calculator
                                    </Link>
                                </div>
                            </div>

                            {/* Trust stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>
                                {TRUST_STATS.map(s => (
                                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem', textAlign: 'center', minWidth: 110 }}>
                                        <div style={{ fontSize: 26, fontWeight: 900, color: '#C6923A', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{s.value}</div>
                                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Quick Jump Navigation ────────────────────────────────── */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
                        <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
                            {RESOURCE_CLUSTERS.map(cluster => {
                                const Icon = cluster.icon;
                                return (
                                    <a key={cluster.id} href={`#${cluster.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#6b7280', textDecoration: 'none', whiteSpace: 'nowrap', borderBottom: `2px solid transparent`, transition: 'all 0.15s', flexShrink: 0 }}>
                                        <Icon style={{ width: 14, height: 14, color: cluster.color, flexShrink: 0 }} />
                                        {cluster.label}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
                    {/* ── Document Filter Bar (New) ─────────────────────────── */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem', background: '#111', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <select style={{ flex: 1, minWidth: 140, background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                            <option value="">Any Country (120)</option>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="AU">Australia</option>
                        </select>
                        <select style={{ flex: 1, minWidth: 140, background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                            <option value="">Any State/Province</option>
                        </select>
                        <select style={{ flex: 1, minWidth: 140, background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                            <option value="">Source Type</option>
                            <option value="manual">Official Workbooks</option>
                            <option value="code">Legislative Code</option>
                            <option value="guideline">Escort Guidelines</option>
                        </select>
                        <select style={{ flex: 1, minWidth: 100, background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                            <option value="">Year</option>
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                        </select>
                        <button style={{ padding: '8px 24px', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontWeight: 800, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                            Filter
                        </button>
                    </div>

                    {/* ── Resource Clusters ─────────────────────────────────── */}
                    {RESOURCE_CLUSTERS.map(cluster => {
                        const ClusterIcon = cluster.icon;
                        return (
                            <section key={cluster.id} id={cluster.id} style={{ marginBottom: '4rem', scrollMarginTop: '80px' }}>
                                {/* Cluster header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${cluster.color}12`, border: `1px solid ${cluster.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <ClusterIcon style={{ width: 18, height: 18, color: cluster.color }} />
                                        </div>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f9fafb' }}>{cluster.label}</h2>
                                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{cluster.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Resource cards grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                    {cluster.resources.map(resource => {
                                        const tagStyle = TAG_COLORS[resource.tag] || TAG_COLORS.Reference;
                                        return (
                                            <Link
                                                key={resource.href}
                                                href={resource.href}
                                                style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', background: 'rgba(255,255,255,0.025)', border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 14, textDecoration: 'none', transition: 'all 0.18s', cursor: 'pointer' }}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                                                    <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f9fafb', lineHeight: 1.4 }}>{resource.title}</h3>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        {resource.downloadable && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 4, fontSize: 9, fontWeight: 700, color: '#fb923c', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                                <Download style={{ width: 8, height: 8 }} /> PDF
                                                            </span>
                                                        )}
                                                        <span style={{ padding: '2px 8px', background: tagStyle.bg, borderRadius: 4, fontSize: 9, fontWeight: 700, color: tagStyle.text, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                                                            {resource.tag}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.55, flex: 1 }}>{resource.desc}</p>
                                                <span style={{ fontSize: 11, color: cluster.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    {resource.downloadable ? 'Download Free' : 'Read Guide'} <ArrowRight style={{ width: 10, height: 10 }} />
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}

                    {/* ── FAQ Section ───────────────────────────────────────── */}
                    <section style={{ marginBottom: '4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText style={{ width: 18, height: 18, color: '#C6923A' }} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f9fafb' }}>Frequently Asked Questions</h2>
                                <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Industry questions answered by experienced heavy haul professionals</p>
                            </div>
                        </div>

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

                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <Link href="/glossary" style={{ fontSize: 13, color: '#C6923A', fontWeight: 700, textDecoration: 'none' }}>
                                Browse the full industry glossary (3,000+ terms) →
                            </Link>
                        </div>
                    </section>

                    {/* ── Lead Gen / Gated Downloads CTA ───────────────────── */}
                    <section style={{ background: 'linear-gradient(135deg, rgba(198,146,58,0.08) 0%, rgba(198,146,58,0.03) 100%)', border: '1px solid rgba(198,146,58,0.2)', borderRadius: 20, padding: '2.5rem', marginBottom: '4rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(198,146,58,0.1)', borderRadius: 20, marginBottom: 16 }}>
                            <Download style={{ width: 12, height: 12, color: '#C6923A' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#C6923A', textTransform: 'uppercase', letterSpacing: 1 }}>Free Downloads</span>
                        </div>
                        <h2 style={{ margin: '0 0 0.75rem', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 900, color: '#f9fafb' }}>
                            Get the Complete Escort Toolkit
                        </h2>
                        <p style={{ margin: '0 0 2rem', fontSize: '1rem', color: '#9ca3af', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                            Bill of lading template, pre-trip checklist, service agreement, and state certification guide — all in one free download bundle.
                        </p>

                        {/* Email capture form */}
                        <form
                            action="/api/leads/resource-download"
                            method="POST"
                            style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}
                        >
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="your@email.com"
                                style={{ flex: 1, minWidth: 220, padding: '11px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }}
                            />
                            <button
                                type="submit"
                                style={{ padding: '11px 22px', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                                Download Free Bundle
                            </button>
                        </form>
                        <p style={{ marginTop: 12, fontSize: 11, color: '#4b5563' }}>
                            No spam. Unsubscribe anytime. Used by 1,500+ operators.
                        </p>
                    </section>

                    {/* ── Cross-Links Section ───────────────────────────────── */}
                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f9fafb', marginBottom: '1.25rem' }}>Explore Haul Command</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {[
                                { href: '/directory', icon: Users, label: 'Pilot Car Directory', desc: 'Find verified operators near you', color: '#C6923A' },
                                { href: '/glossary', icon: BookOpen, label: 'Industry Glossary', desc: '3,000+ terms defined', color: '#38bdf8' },
                                { href: '/escort-requirements', icon: Shield, label: 'Escort Requirements', desc: 'State-by-state rules', color: '#10b981' },
                                { href: '/rates', icon: Star, label: 'Rate Guide', desc: 'Market rates by state', color: '#f59e0b' },
                                { href: '/loads', icon: Truck, label: 'Load Board', desc: 'Active oversize loads', color: '#a78bfa' },
                                { href: '/map', icon: Map, label: 'Live Map', desc: 'Operators near you', color: '#22d3ee' },
                            ].map(card => {
                                const Icon = card.icon;
                                return (
                                    <Link key={card.href} href={card.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textDecoration: 'none', transition: 'all 0.15s' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${card.color}10`, border: `1px solid ${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon style={{ width: 16, height: 16, color: card.color }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{card.label}</div>
                                            <div style={{ fontSize: 11, color: '#6b7280' }}>{card.desc}</div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── Bottom CTA ───────────────────────────────────────── */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <AlertTriangle style={{ width: 20, height: 20, color: '#C6923A', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb' }}>Are you an escort operator?</div>
                                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Claim your free profile and start receiving load offers.</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <Link href="/claim" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 12, fontWeight: 800, borderRadius: 10, textDecoration: 'none' }}>
                                Claim Free Listing
                            </Link>
                            <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 12, fontWeight: 700, borderRadius: 10, textDecoration: 'none' }}>
                                Sign Up Free
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
