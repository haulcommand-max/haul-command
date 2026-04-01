import Link from 'next/link';
import { ChevronRight, AlertTriangle, Clock, Zap } from 'lucide-react';
import { createClient as createServer } from '@/utils/supabase/server';
import { ProgrammaticFAQ, getCountyFAQs } from '@/components/seo/ProgrammaticFAQ';
import { HubLinks, AuthorityLinks } from '@/lib/seo/internal-links';
import type { Metadata } from 'next';

const TIER_CONFIG = {
    sniper: { label: 'Severe Driver Shortage', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '🔴' },
    expansion: { label: 'Moderate Opportunity', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '🟡' },
    monitor: { label: 'Background Index', color: '#6b7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.15)', icon: '⚪' },
};

export async function generateMetadata({ params }: any): Promise<Metadata> {
    const slug = params['county-slug'];
    const name = slug.replace(/-/g, ' ').replace(/^([\w]+)-(county|district|division)-(\w+)$/, (_: string, c: string) => c.replace(/\b\w/g, (x: string) => x.toUpperCase()));
    return {
        title: `Pilot Car Services in ${name} | Haul Command`,
        description: `Find certified pilot car and escort vehicle drivers in ${name}. High-demand corridor with verified operators available for dispatch.`,
        keywords: [`pilot car ${name}`, `escort vehicle ${name}`, `oversize load escort ${name}`, `pilot car driver shortage ${name}`],
    };
}

export default async function CountyPage({ params }: any) {
    const slug = params['county-slug'];
    const supabase = createServer();

    const { data: county } = await supabase
        .from('hc_county_sniper')
        .select('*')
        .eq('county_slug', slug)
        .single();

    const name = county?.county_name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const state = county?.state_province ?? '';
    const tier = county?.tier ?? 'monitor';
    const cfg = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.monitor;
    const score = county ? Math.round(county.supply_gap_score) : 0;

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* Breadcrumb */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    {state && <><Link href={`/directory/us/${state.toLowerCase()}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{state}</Link><ChevronRight style={{ width: 12, height: 12 }} /></>}
                    <span style={{ color: '#d1d5db' }}>{name}</span>
                </nav>

                {/* Header */}
                <header style={{ marginBottom: 28 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 20, marginBottom: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: 2 }}>{cfg.icon} {cfg.label}</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#f9fafb', letterSpacing: -0.5 }}>
                        Pilot Car Services in <span style={{ color: '#F1A91B' }}>{name}</span>
                    </h1>
                    {county?.nearest_metro && <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280' }}>Nearest metro: {county.nearest_metro}</p>}
                </header>

                {/* Supply Gap Score */}
                {county && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.25rem', marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 36, fontWeight: 900, color: cfg.color, fontFamily: "'JetBrains Mono', monospace" }}>{score}</div>
                            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>Supply Gap Score</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#F1A91B', fontFamily: 'JetBrains Mono' }}>{Math.round(county.heavy_haul_activity)}%</div>
                            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>HH Activity</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono' }}>{100 - Math.round(county.registered_driver_density)}%</div>
                            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>Driver Gap</div>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {county?.notes && (
                    <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '1rem', marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 6 }}>Corridor Intelligence</div>
                        <p style={{ margin: 0, fontSize: 12, color: '#93c5fd', lineHeight: 1.6 }}>{county.notes}</p>
                    </div>
                )}

                {/* CTA */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
                    <Link href="/start" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
                        <Zap style={{ width: 14, height: 14 }} /> I Want Loads Here
                    </Link>
                    <Link href="/loads/post" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d1d5db', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                        <AlertTriangle style={{ width: 14, height: 14 }} /> Post a Load
                    </Link>
                </div>

                {/* FAQ */}
                <ProgrammaticFAQ faqs={getCountyFAQs(name, state)} />

                {/* Hub Links */}
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: 10 }}>Pilot Car Resources</div>
                    <HubLinks compact />
                    <div style={{ marginTop: 12 }}>
                        <AuthorityLinks type="directory" />
                    </div>
                </div>
            </div>
        </div>
    );
}
