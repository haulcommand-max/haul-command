import Link from 'next/link';
import { ChevronRight, Truck } from 'lucide-react';
import { ProgrammaticFAQ, getGenericFAQs } from '@/components/seo/ProgrammaticFAQ';
import { HubLinks, AuthorityLinks } from '@/lib/seo/internal-links';
import type { Metadata } from 'next';

// Killer Move #3 — Industry Vertical Pages
const VERTICALS: Record<string, {
    label: string; icon: string; color: string;
    headline: string; description: string;
    loadType: string; escortNeed: string;
    typicalWidth: string; typicalHeight: string;
    keywords: string[];
}> = {
    'mobile-home-transport': {
        label: 'Mobile Home Transport', icon: '🏠', color: '#3b82f6',
        headline: 'Pilot Car Services for Mobile Home Transport',
        description: 'Mobile home moves require certified escorts due to width (14–16 ft). Find pre-vetted pilot car operators experienced with single-wide, double-wide, and triple-wide manufactured home transport.',
        loadType: 'Manufactured/Mobile Home', escortNeed: 'Front + Rear typical @14ft+',
        typicalWidth: '14–18 ft', typicalHeight: '13–15 ft',
        keywords: ['mobile home escort service', 'pilot car mobile home', 'manufactured home transport escort', 'wide load escort mobile home'],
    },
    'wind-turbine-transport': {
        label: 'Wind Turbine Transport', icon: '💨', color: '#10b981',
        headline: 'Wind Turbine Component Escort Services',
        description: 'Wind turbine blades, nacelles, and towers are some of the most complex oversize moves. Corridors require certified escorts, height poles, and often police escort for bridge crossings.',
        loadType: 'Wind Turbine Components', escortNeed: 'Multi-unit escort convoy',
        typicalWidth: '16–22 ft', typicalHeight: '14–18 ft',
        keywords: ['wind turbine escort service', 'pilot car wind turbine', 'oversize escort wind energy', 'turbine blade transport escort'],
    },
    'heavy-equipment-transport': {
        label: 'Heavy Equipment Transport', icon: '🚜', color: '#f59e0b',
        headline: 'Escort Services for Heavy Equipment Transport',
        description: 'Excavators, bulldozers, cranes, and industrial equipment often require front and rear escorts. Haul Command matches you with escorts experienced in construction equipment corridors.',
        loadType: 'Construction & Industrial Equipment', escortNeed: 'Front + Rear based on dimensions',
        typicalWidth: '12–20 ft', typicalHeight: '13–16 ft',
        keywords: ['heavy equipment escort', 'construction equipment transport escort', 'oversize equipment pilot car', 'excavator transport escort'],
    },
    'farm-equipment-transport': {
        label: 'Farm Equipment Transport', icon: '🌾', color: '#84cc16',
        headline: 'Pilot Cars for Farm Equipment Moves',
        description: 'Wide planters, combines, and specialty ag equipment moves frequently during seasonal windows. Fast-fill escorts in rural corridors where supply is often thin.',
        loadType: 'Agricultural Equipment', escortNeed: 'Varies — typically 1 escort',
        typicalWidth: '12–16 ft', typicalHeight: '13–15 ft',
        keywords: ['farm equipment transport escort', 'agricultural equipment pilot car', 'wide load farm equipment', 'combine transport escort'],
    },
    'boat-transport': {
        label: 'Boat Transport', icon: '⛵', color: '#06b6d4',
        headline: 'Escort Services for Boat and Marine Transport',
        description: 'Large vessels and yachts on custom trailers often exceed 14 ft wide, requiring certified escort. Coastal routes and humid conditions demand height pole for bridge clearance.',
        loadType: 'Marine Vessels', escortNeed: '1–2 escorts based on width',
        typicalWidth: '12–18 ft', typicalHeight: '13–16 ft',
        keywords: ['boat transport escort', 'yacht transport pilot car', 'vessel transport escort', 'marine transport wide load'],
    },
    'modular-building-transport': {
        label: 'Modular Building Transport', icon: '🏗️', color: '#8b5cf6',
        headline: 'Escort Vehicles for Modular Building Moves',
        description: 'Modular home sections, office units, and prefab components are among the most common wide-load moves. Single and double escort requirements vary by section width.',
        loadType: 'Modular / Prefab Structures', escortNeed: 'Front + Rear typical @14ft+',
        typicalWidth: '14–18 ft', typicalHeight: '13–16 ft',
        keywords: ['modular building transport escort', 'prefab transport pilot car', 'wide load modular home', 'modular escort service'],
    },
    'crane-transport': {
        label: 'Crane Transport', icon: '🏗️', color: '#ec4899',
        headline: 'Pilot Car Services for Crane Transport',
        description: 'All-terrain cranes, tower cranes, and crane components are oversize by nature. Complex bridge analysis, height clearance, and multi-unit escorts are standard on these moves.',
        loadType: 'Crane Components & Units', escortNeed: 'Multi-unit + police possible',
        typicalWidth: '16–24 ft', typicalHeight: '14–18 ft',
        keywords: ['crane transport escort', 'pilot car crane move', 'oversize crane escort', 'all terrain crane transport escort'],
    },
    'transformer-transport': {
        label: 'Transformer Transport', icon: '⚡', color: '#F1A91B',
        headline: 'Escort Vehicle Services for Transformer Transport',
        description: 'Utility and industrial transformers are dense, heavy superloads requiring bridge analysis, utility crew, and certified escort from pickup to delivery.',
        loadType: 'Electrical Transformers', escortNeed: 'Front + Rear + utility crew',
        typicalWidth: '14–22 ft', typicalHeight: '14–17 ft',
        keywords: ['transformer transport escort', 'utility transformer pilot car', 'superload escort transformer', 'electrical equipment transport escort'],
    },
};

export async function generateMetadata({ params }: any): Promise<Metadata> {
    const v = VERTICALS[params.vertical];
    return {
        title: `${v?.label ?? 'Industry Escort'} Services | Haul Command`,
        description: v?.description?.slice(0, 155) ?? 'Find certified pilot car escorts for any industry vertical.',
        keywords: v?.keywords ?? [],
    };
}

export default function VerticalPage({ params }: any) {
    const slug = params.vertical;
    const v = VERTICALS[slug];
    if (!v) return <div style={{ padding: 40, color: '#6b7280', background: '#0a0a0f', minHeight: '100vh' }}>Vertical not found.</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <Link href="/industry" style={{ color: '#6b7280', textDecoration: 'none' }}>Industries</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <span style={{ color: '#d1d5db' }}>{v.label}</span>
                </nav>

                <header style={{ marginBottom: 28 }}>
                    <div style={{ display: 'inline-flex', gap: 8, padding: '4px 14px', background: `${v.color}12`, border: `1px solid ${v.color}25`, borderRadius: 20, marginBottom: 12 }}>
                        <span style={{ fontSize: 16 }}>{v.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: v.color, textTransform: 'uppercase', letterSpacing: 2 }}>{v.label}</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#f9fafb', letterSpacing: -0.5 }}>{v.headline}</h1>
                    <p style={{ margin: '12px 0 0', fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{v.description}</p>
                </header>

                {/* Load specs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
                    {[
                        { label: 'Load Type', val: v.loadType },
                        { label: 'Escort Need', val: v.escortNeed },
                        { label: 'Typical Width', val: v.typicalWidth },
                        { label: 'Typical Height', val: v.typicalHeight },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: v.color, marginBottom: 4 }}>{s.val}</div>
                            <div style={{ fontSize: 8, color: '#4b5563', textTransform: 'uppercase' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
                    <Link href="/loads/post" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, background: `linear-gradient(135deg,${v.color},${v.color}bb)`, color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                        <Truck style={{ width: 14, height: 14 }} /> Post {v.label} Load
                    </Link>
                    <Link href="/directory" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d5db', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                        Find Specialized Escorts →
                    </Link>
                </div>

                {/* Other verticals */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>More Industry Types</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {Object.entries(VERTICALS).filter(([s]) => s !== slug).map(([s, iv]) => (
                            <Link key={s} href={`/industry/${s}/pilot-car`} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7280' }}>{iv.icon} {iv.label}</Link>
                        ))}
                    </div>
                </div>

                <ProgrammaticFAQ faqs={getGenericFAQs('rules')} title={`${v.label} — Escort Regulations`} />

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <HubLinks compact />
                    <div style={{ marginTop: 10 }}><AuthorityLinks type="money" /></div>
                </div>
            </div>
        </div>
    );
}
