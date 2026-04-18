import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MapPin, Truck, DollarSign, Shield, Clock, ArrowRight, ChevronRight, Search, Package } from 'lucide-react';
import { HCContentPageShell, HCContentSection, HCContentContainer } from "@/components/content-system/shell/HCContentPageShell";
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { stateFullName } from '@/lib/geo/state-names';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Heavy Haul Load Board | Haul Command',
    description: 'Browse oversize and heavy haul loads requiring pilot car and escort services. Find jobs, check verified escrow, and get matched with loads in your area.',
    alternates: { canonical: 'https://www.haulcommand.com/load-board' },
};

export default async function LoadBoard() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    let loads: any[] = [];
    try {
        const { data } = await supabase
            .from('jobs')
            .select('*, profiles:posted_by(display_name, trust_score), hc_escrows(status)')
            .eq('status', 'OPEN')
            .order('created_at', { ascending: false })
            .limit(50);
        loads = data ?? [];
    } catch (e) {
        console.warn('[load-board] Query failed:', e);
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Heavy Haul Load Board',
        description: 'Active oversize and heavy haul loads requiring escort services',
        numberOfItems: loads.length,
        url: 'https://www.haulcommand.com/load-board',
    };

    return (
        <HCContentPageShell>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <ProofStrip variant="bar" />

            {/* Hero Header */}
            <div style={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'linear-gradient(180deg, #0A0D14, #0D0F16)', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: 0, right: 0, width: 400, height: 300,
                    background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
                    pointerEvents: 'none', transform: 'translate(20%, -20%)',
                }} />
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 2.5rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '5px 12px', borderRadius: 20,
                            background: loads.length > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(198,146,58,0.1)',
                            border: `1px solid ${loads.length > 0 ? 'rgba(34,197,94,0.25)' : 'rgba(198,146,58,0.25)'}`,
                            fontSize: 10, fontWeight: 800,
                            color: loads.length > 0 ? '#86efac' : '#C6923A',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: loads.length > 0 ? '#22c55e' : '#C6923A' }} />
                            {loads.length > 0 ? `${loads.length} Active Loads` : 'Board Ready'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <h1 style={{
                                margin: '0 0 8px', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                                fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.025em',
                            }}>
                                Heavy Haul Load Board
                            </h1>
                            <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.5, maxWidth: 500 }}>
                                Browse oversize loads requiring escort services. Verified escrow and broker trust scores.
                            </p>
                        </div>
                        <Link href="/load-board/post" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '12px 24px', borderRadius: 12,
                            background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                            color: '#000', fontSize: 13, fontWeight: 800, textDecoration: 'none',
                            letterSpacing: '0.01em',
                        }}>
                            <Package style={{ width: 15, height: 15 }} />
                            Post a Load
                        </Link>
                    </div>
                </div>
            </div>

            {/* Load Cards */}
            <HCContentSection>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {loads.length > 0 ? loads.map((load: any) => {
                            const hasEscrow = load.hc_escrows?.some((e: any) => e.status === 'ESCROW_LOCKED');
                            const trustScore = load.profiles?.trust_score;
                            const brokerName = load.profiles?.display_name || 'Posted by Broker';
                            const originState = stateFullName(load.origin_state) || load.origin_state || '';
                            const destState = stateFullName(load.destination_state) || load.destination_state || '';

                            return (
                                <Link
                                    key={load.id}
                                    href={`/load-board/${load.id}`}
                                    style={{
                                        display: 'block', textDecoration: 'none',
                                        background: '#111214', border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: 16, padding: '20px 24px',
                                        transition: 'all 0.2s ease',
                                    }}
                                    className="hover:border-[rgba(255,255,255,0.16)] hover:-translate-y-0.5"
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                                        {/* Route info */}
                                        <div style={{ flex: 1, minWidth: 240 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.01em' }}>
                                                    {load.origin_city || 'Origin'}
                                                    <span style={{ color: '#475569', margin: '0 8px', fontSize: 14 }}>→</span>
                                                    {load.destination_city || 'Destination'}
                                                </h3>
                                                {hasEscrow && (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        padding: '3px 10px', borderRadius: 6,
                                                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                                                        fontSize: 10, fontWeight: 700, color: '#86efac',
                                                    }}>
                                                        <Shield style={{ width: 10, height: 10 }} /> Funds Verified
                                                    </span>
                                                )}
                                            </div>

                                            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.5, maxWidth: 500 }}>
                                                {load.description || 'Oversize load requiring pilot car escort services.'}
                                            </p>

                                            {/* Meta row */}
                                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
                                                {(originState || destState) && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
                                                        <MapPin style={{ width: 12, height: 12, color: '#64748b' }} />
                                                        {originState}{originState && destState ? ' → ' : ''}{destState}
                                                    </span>
                                                )}
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8' }}>
                                                    <Truck style={{ width: 12, height: 12, color: '#64748b' }} />
                                                    {brokerName}
                                                </span>
                                                {trustScore && trustScore > 0 && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: trustScore > 8 ? '#93c5fd' : '#f59e0b' }}>
                                                        <Shield style={{ width: 12, height: 12 }} />
                                                        Trust: {trustScore}/10
                                                    </span>
                                                )}
                                                {load.created_at && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
                                                        <Clock style={{ width: 12, height: 12 }} />
                                                        {new Date(load.created_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price + CTA */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                                            {load.budget_amount ? (
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: 24, fontWeight: 900, color: '#22c55e' }}>
                                                        ${Number(load.budget_amount).toLocaleString()}
                                                    </span>
                                                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Budget</div>
                                                </div>
                                            ) : (
                                                <span style={{
                                                    padding: '6px 14px', borderRadius: 8,
                                                    background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.2)',
                                                    fontSize: 12, fontWeight: 700, color: '#C6923A',
                                                }}>
                                                    Request Quote
                                                </span>
                                            )}
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                fontSize: 11, fontWeight: 700, color: '#3b82f6',
                                            }}>
                                                View Details <ArrowRight style={{ width: 12, height: 12 }} />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        }) : (
                            /* Empty state */
                            <div style={{
                                padding: '64px 24px', textAlign: 'center',
                                background: 'rgba(198,146,58,0.03)', border: '1px solid rgba(198,146,58,0.15)',
                                borderRadius: 20,
                            }}>
                                <Package style={{ width: 40, height: 40, color: '#C6923A', margin: '0 auto 20px' }} />
                                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#f9fafb', marginBottom: 8 }}>
                                    No Active Loads
                                </h3>
                                <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.6 }}>
                                    The load board is ready for your first posting. Post an oversize or heavy haul load to get matched with verified escort operators instantly.
                                </p>
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <Link href="/load-board/post" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '14px 28px', borderRadius: 12,
                                        background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                                        color: '#000', fontSize: 14, fontWeight: 800, textDecoration: 'none',
                                    }}>
                                        <Package style={{ width: 16, height: 16 }} /> Post a Load
                                    </Link>
                                    <Link href="/available-now" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '14px 28px', borderRadius: 12,
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#d1d5db', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                                    }}>
                                        Browse Available Escorts
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </HCContentSection>

            <HCContentSection>
                <HCContentContainer>
                    <NoDeadEndBlock
                        heading="What Would You Like to Do?"
                        moves={[
                            { href: '/load-board/post', icon: '📦', title: 'Post a Load', desc: 'Get escort bids instantly', primary: true, color: '#C6923A' },
                            { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Escorts ready for dispatch', primary: true, color: '#22C55E' },
                            { href: '/tools/escort-calculator', icon: '🧮', title: 'Rate Calculator', desc: 'Estimate escort costs' },
                            { href: '/directory', icon: '🔍', title: 'Operator Directory', desc: 'Find verified escorts' },
                            { href: '/escort-requirements', icon: '⚖️', title: 'Requirements', desc: 'State-by-state rules' },
                            { href: '/training', icon: '🎓', title: 'Get Certified', desc: 'Earn your badge' },
                        ]}
                    />
                </HCContentContainer>
            </HCContentSection>
        </HCContentPageShell>
    );
}