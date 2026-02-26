'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Shield, TrendingUp, Zap, Map, Users, Star, Award,
    Globe, Truck, CheckCircle, ArrowRight, Activity,
    ChevronRight, BarChart3, Lock, Clock, Anchor
} from 'lucide-react';
import { LOGO_MARK_SRC, ALT_TEXT } from '@/lib/config/brand';

// ══════════════════════════════════════════════════════════════
// ENHANCED FOOTER — SEO Link Mesh + Trust Signals + Social Proof
// ══════════════════════════════════════════════════════════════

const TOP_STATES = [
    { code: 'tx', name: 'Texas' }, { code: 'fl', name: 'Florida' }, { code: 'ca', name: 'California' },
    { code: 'oh', name: 'Ohio' }, { code: 'pa', name: 'Pennsylvania' }, { code: 'ga', name: 'Georgia' },
    { code: 'nc', name: 'North Carolina' }, { code: 'il', name: 'Illinois' }, { code: 'ny', name: 'New York' },
    { code: 'la', name: 'Louisiana' }, { code: 'ok', name: 'Oklahoma' }, { code: 'az', name: 'Arizona' },
];

const SERVICES = [
    { slug: 'pilot-car-services', name: 'Pilot Car Services' },
    { slug: 'escort-vehicle-services', name: 'Escort Vehicle Services' },
    { slug: 'oversize-load-escorts', name: 'Oversize Load Escorts' },
    { slug: 'wide-load-escorts', name: 'Wide Load Escorts' },
    { slug: 'route-survey-services', name: 'Route Surveys' },
    { slug: 'height-pole-services', name: 'Height Pole Services' },
];

export default function EnhancedFooter() {
    return (
        <footer style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: '#050505',
            padding: '4rem 0 2rem',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
                {/* Trust Bar */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap',
                    padding: '1.5rem', marginBottom: '3rem',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)',
                }}>
                    {[
                        { icon: Shield, text: 'Verified Escorts', color: '#10b981' },
                        { icon: Lock, text: 'Escrow Protected', color: '#3b82f6' },
                        { icon: Clock, text: 'Median Fill: 47min', color: '#F1A91B' },
                        { icon: Globe, text: 'US + Canada', color: '#a855f7' },
                        { icon: Award, text: 'Industry Leaderboard', color: '#f59e0b' },
                    ].map(item => (
                        <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <item.icon style={{ width: 14, height: 14, color: item.color }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* Link Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    {/* Product */}
                    <div>
                        <h3 style={{ fontSize: 11, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Product</h3>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { href: '/loads', label: 'Load Board' },
                                { href: '/directory', label: 'Escort Directory' },
                                { href: '/leaderboards', label: 'Leaderboard' },
                                { href: '/escort/corridor', label: 'Corridor Intelligence' },
                                { href: '/rates', label: 'Rate Guides (Free)' },
                                { href: '/tools/permit-checker', label: 'Permit Checker (Free)' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none', transition: 'color 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#d1d5db')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                                >{l.label}</Link>
                            ))}
                        </nav>
                    </div>

                    {/* Popular Heavy Haul Regions — SEO link mesh */}
                    <div>
                        <h3 style={{ fontSize: 11, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Popular Regions</h3>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { href: '/directory/us/tx', label: 'Texas Pilot Cars' },
                                { href: '/directory/us/fl', label: 'Florida Pilot Cars' },
                                { href: '/directory/us/ga', label: 'Georgia Pilot Cars' },
                                { href: '/directory/us/ca', label: 'California Pilot Cars' },
                                { href: '/directory/us/la', label: 'Louisiana Pilot Cars' },
                                { href: '/directory/us/nc', label: 'North Carolina Pilot Cars' },
                                { href: '/directory/us/ok', label: 'Oklahoma Pilot Cars' },
                                { href: '/directory/us/az', label: 'Arizona Pilot Cars' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none', transition: 'color 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#d1d5db')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                                >{l.label}</Link>
                            ))}
                        </nav>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 style={{ fontSize: 11, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Services</h3>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {SERVICES.map(s => (
                                <Link key={s.slug} href={`/us/tx/${s.slug}`} style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none', transition: 'color 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#d1d5db')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                                >{s.name}</Link>
                            ))}
                        </nav>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 style={{ fontSize: 11, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Company</h3>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                { href: '/terms', label: 'Terms of Service' },
                                { href: '/privacy', label: 'Privacy Policy' },
                                { href: '/contact', label: 'Contact Us' },
                                { href: '/onboarding/start', label: 'Get Started' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none', transition: 'color 0.15s' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#d1d5db')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
                                >{l.label}</Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '2rem',
                    marginTop: '0.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Logo mark — never render text badge if logo exists */}
                        <Image
                            src={LOGO_MARK_SRC}
                            alt={ALT_TEXT}
                            width={24}
                            height={24}
                            style={{ objectFit: 'contain', display: 'block', opacity: 0.85 }}
                        />
                        <span style={{ fontSize: 11, color: '#4b5563', fontWeight: 600 }}>© 2026 Haul Command. The Operating System for Heavy Haul.</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#374151', fontWeight: 600 }}>
                        Built for the corridor. Not the crowd.
                    </div>
                </div>
            </div>
        </footer>
    );
}
