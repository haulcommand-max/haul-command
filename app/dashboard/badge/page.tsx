/**
 * /dashboard/badge — Operator badge embed page
 * Shows the operator their embeddable badge snippet + preview.
 * Accessible to authenticated operators from their dashboard.
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Your Directory Badge | Haul Command',
    description: 'Embed your Haul Command verification badge on your website to earn backlinks and build trust.',
};

export const dynamic = 'force-dynamic';

async function getBadgeForUser() {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const svc = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Get the user from the session cookie — client-side will handle auth redirect
    // Return null to let the page handle it gracefully
    return null as null | { badge_token: string; badge_type: string; tier: string; embed_count: number };
}

export default async function BadgePage() {
    const BASE_URL = 'https://haulcommand.com';

    // Badge types with descriptions
    const BADGE_TYPES = [
        {
            id: 'featured',
            label: 'Featured Operator',
            description: 'For all published operators. Shows your name and verification status.',
            color: '#F1A91B',
        },
        {
            id: 'top10',
            label: 'Top Rated Badge',
            description: 'For elite operators with trust score 80+. Purple prestige badge.',
            color: '#7c3aed',
        },
        {
            id: 'twic_verified',
            label: 'TWIC Verified Badge',
            description: 'For TWIC-certified operators. Shows port-access authority.',
            color: '#10b981',
        },
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#08090e', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'inline-block', padding: '3px 10px', background: 'rgba(241,169,27,0.1)', border: '1px solid rgba(241,169,27,0.25)', borderRadius: 6, fontSize: 10, fontWeight: 800, color: '#F1A91B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                        Authority Badge Program
                    </div>
                    <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 900, color: '#f9fafb' }}>
                        Your Haul Command Badge
                    </h1>
                    <p style={{ margin: 0, fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>
                        Embed your verification badge on your website.
                        Every embed creates a backlink to your Haul Command profile — boosting your SEO authority.
                    </p>
                </div>

                {/* How to embed */}
                <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.5rem', marginBottom: 24 }}>
                    <h2 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280' }}>
                        How to Embed
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Step 1 */}
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 28, height: 28, borderRadius: '50%', background: 'rgba(241,169,27,0.15)', border: '1px solid rgba(241,169,27,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#F1A91B' }}>1</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>Copy your badge snippet</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Use the HTML img tag below. The badge is served as an SVG image from our CDN.</div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 28, height: 28, borderRadius: '50%', background: 'rgba(241,169,27,0.15)', border: '1px solid rgba(241,169,27,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#F1A91B' }}>2</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>Paste on your website or email signature</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Works in any HTML page, WordPress, email, or social bio link.</div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 28, height: 28, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#10b981' }}>3</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>Get discovered + build authority</div>
                                <div style={{ fontSize: 12, color: '#6b7280' }}>Each embed links back to your profile — Google sees this as a trust signal.</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Badge previews */}
                <section style={{ marginBottom: 24 }}>
                    <h2 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280' }}>
                        Badge Library
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {BADGE_TYPES.map(bt => (
                            <div key={bt.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${bt.color}20`, borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: bt.color, marginBottom: 3 }}>{bt.label}</div>
                                    <div style={{ fontSize: 11, color: '#6b7280' }}>{bt.description}</div>
                                </div>
                                {/* Live badge preview */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`${BASE_URL}/api/directory/badge/preview-${bt.id}`}
                                    alt={`${bt.label} preview`}
                                    width={220}
                                    height={60}
                                    style={{ borderRadius: 8, flexShrink: 0 }}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Get your badge CTA */}
                <section style={{ background: 'linear-gradient(135deg, rgba(241,169,27,0.08), rgba(241,169,27,0.02))', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>Get your badge token</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9ca3af' }}>
                        Your badge token is automatically generated when your profile is published.
                        Visit your profile settings to copy your embed snippet.
                    </p>
                    <a
                        href="/app/profile"
                        style={{ display: 'inline-block', padding: '10px 28px', background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none' }}
                    >
                        Go to Profile Settings →
                    </a>
                </section>

                {/* SEO note */}
                <p style={{ marginTop: 24, fontSize: 11, color: '#4b5563', textAlign: 'center' }}>
                    Each badge served generates a <strong style={{ color: '#6b7280' }}>do-follow backlink</strong> to your Haul Command profile.
                    Haul Command DA grows as more operators embed badges — your profile rides that authority.
                </p>
            </div>
        </div>
    );
}
