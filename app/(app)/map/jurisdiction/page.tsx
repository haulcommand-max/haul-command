'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

// ══════════════════════════════════════════════════════════════
// JURISDICTION MAP CONTROL SURFACE
// Dark command-center aesthetic · Interactive SVG map
// Tap a state → bottom drawer with operators, rules, support
// ══════════════════════════════════════════════════════════════

const T = {
    bg: '#060b12',
    bgElevated: '#0f1720',
    bgCard: '#121a24',
    bgPanel: 'rgba(15,23,32,0.95)',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',
    textPrimary: '#ffffff',
    textBody: '#cfd8e3',
    textSecondary: '#8fa3b8',
    textLabel: '#9fb3c8',
    gold: '#f5b942',
    blue: '#3ba4ff',
    green: '#27d17f',
    red: '#f87171',
    amber: '#f59e0b',
    purple: '#a78bfa',
} as const;

const supabase = createClient();

// ── State paths (simplified SVG paths for US states aligned to viewBox 0 0 960 600)
const US_STATES: Record<string, { code: string; name: string; cx: number; cy: number; path: string }> = {
    'US-WA': { code: 'US-WA', name: 'Washington', cx: 120, cy: 60, path: 'M80,30 L170,30 L175,95 L80,95 Z' },
    'US-OR': { code: 'US-OR', name: 'Oregon', cx: 110, cy: 130, path: 'M80,95 L175,95 L175,170 L80,170 Z' },
    'US-CA': { code: 'US-CA', name: 'California', cx: 85, cy: 260, path: 'M55,170 L120,170 L115,370 L50,320 Z' },
    'US-NV': { code: 'US-NV', name: 'Nevada', cx: 150, cy: 240, path: 'M120,170 L185,170 L180,320 L115,320 Z' },
    'US-ID': { code: 'US-ID', name: 'Idaho', cx: 190, cy: 130, path: 'M175,55 L230,55 L230,190 L175,190 Z' },
    'US-MT': { code: 'US-MT', name: 'Montana', cx: 290, cy: 60, path: 'M230,30 L385,30 L385,100 L230,100 Z' },
    'US-WY': { code: 'US-WY', name: 'Wyoming', cx: 290, cy: 150, path: 'M230,110 L350,110 L350,190 L230,190 Z' },
    'US-UT': { code: 'US-UT', name: 'Utah', cx: 210, cy: 250, path: 'M180,190 L260,190 L260,310 L180,310 Z' },
    'US-CO': { code: 'US-CO', name: 'Colorado', cx: 330, cy: 250, path: 'M270,200 L395,200 L395,290 L270,290 Z' },
    'US-AZ': { code: 'US-AZ', name: 'Arizona', cx: 190, cy: 370, path: 'M115,310 L210,310 L220,430 L100,430 Z' },
    'US-NM': { code: 'US-NM', name: 'New Mexico', cx: 290, cy: 370, path: 'M220,290 L340,290 L340,430 L220,430 Z' },
    'US-ND': { code: 'US-ND', name: 'North Dakota', cx: 410, cy: 65, path: 'M385,35 L480,35 L480,100 L385,100 Z' },
    'US-SD': { code: 'US-SD', name: 'South Dakota', cx: 410, cy: 130, path: 'M385,100 L480,100 L480,170 L385,170 Z' },
    'US-NE': { code: 'US-NE', name: 'Nebraska', cx: 430, cy: 200, path: 'M380,170 L510,170 L510,230 L380,230 Z' },
    'US-KS': { code: 'US-KS', name: 'Kansas', cx: 450, cy: 265, path: 'M395,230 L530,230 L530,300 L395,300 Z' },
    'US-OK': { code: 'US-OK', name: 'Oklahoma', cx: 470, cy: 330, path: 'M370,300 L555,300 L555,370 L370,370 Z' },
    'US-TX': { code: 'US-TX', name: 'Texas', cx: 440, cy: 430, path: 'M340,370 L560,370 L545,535 L320,500 Z' },
    'US-MN': { code: 'US-MN', name: 'Minnesota', cx: 510, cy: 85, path: 'M480,30 L570,30 L575,160 L480,160 Z' },
    'US-IA': { code: 'US-IA', name: 'Iowa', cx: 530, cy: 195, path: 'M510,160 L590,160 L590,230 L510,230 Z' },
    'US-MO': { code: 'US-MO', name: 'Missouri', cx: 560, cy: 275, path: 'M530,230 L620,230 L620,330 L530,330 Z' },
    'US-AR': { code: 'US-AR', name: 'Arkansas', cx: 570, cy: 360, path: 'M550,320 L630,320 L630,395 L550,395 Z' },
    'US-LA': { code: 'US-LA', name: 'Louisiana', cx: 570, cy: 440, path: 'M545,400 L625,400 L635,480 L545,480 Z' },
    'US-WI': { code: 'US-WI', name: 'Wisconsin', cx: 580, cy: 105, path: 'M565,50 L625,50 L630,165 L565,165 Z' },
    'US-IL': { code: 'US-IL', name: 'Illinois', cx: 610, cy: 230, path: 'M590,165 L640,165 L640,320 L590,320 Z' },
    'US-MI': { code: 'US-MI', name: 'Michigan', cx: 660, cy: 110, path: 'M625,55 L700,55 L700,185 L625,185 Z' },
    'US-IN': { code: 'US-IN', name: 'Indiana', cx: 660, cy: 235, path: 'M640,180 L685,180 L685,310 L640,310 Z' },
    'US-OH': { code: 'US-OH', name: 'Ohio', cx: 710, cy: 220, path: 'M685,170 L745,170 L745,280 L685,280 Z' },
    'US-KY': { code: 'US-KY', name: 'Kentucky', cx: 680, cy: 295, path: 'M620,270 L750,270 L750,325 L620,325 Z' },
    'US-TN': { code: 'US-TN', name: 'Tennessee', cx: 680, cy: 340, path: 'M610,325 L770,325 L770,365 L610,365 Z' },
    'US-MS': { code: 'US-MS', name: 'Mississippi', cx: 610, cy: 410, path: 'M580,370 L635,370 L640,475 L580,475 Z' },
    'US-AL': { code: 'US-AL', name: 'Alabama', cx: 660, cy: 410, path: 'M640,365 L695,365 L700,475 L640,475 Z' },
    'US-GA': { code: 'US-GA', name: 'Georgia', cx: 720, cy: 400, path: 'M700,355 L770,355 L775,460 L700,460 Z' },
    'US-FL': { code: 'US-FL', name: 'Florida', cx: 750, cy: 490, path: 'M700,460 L800,460 L820,540 L740,560 L700,500 Z' },
    'US-SC': { code: 'US-SC', name: 'South Carolina', cx: 760, cy: 355, path: 'M730,340 L800,340 L800,380 L730,380 Z' },
    'US-NC': { code: 'US-NC', name: 'North Carolina', cx: 780, cy: 310, path: 'M720,295 L850,295 L850,340 L720,340 Z' },
    'US-VA': { code: 'US-VA', name: 'Virginia', cx: 780, cy: 270, path: 'M720,250 L850,250 L860,295 L720,295 Z' },
    'US-WV': { code: 'US-WV', name: 'West Virginia', cx: 740, cy: 260, path: 'M710,235 L755,235 L755,280 L710,280 Z' },
    'US-PA': { code: 'US-PA', name: 'Pennsylvania', cx: 790, cy: 190, path: 'M740,165 L850,165 L850,210 L740,210 Z' },
    'US-NY': { code: 'US-NY', name: 'New York', cx: 810, cy: 140, path: 'M760,100 L870,100 L870,170 L760,170 Z' },
    'US-NJ': { code: 'US-NJ', name: 'New Jersey', cx: 840, cy: 210, path: 'M828,195 L860,195 L860,240 L828,240 Z' },
    'US-CT': { code: 'US-CT', name: 'Connecticut', cx: 870, cy: 155, path: 'M855,145 L890,145 L890,170 L855,170 Z' },
    'US-MA': { code: 'US-MA', name: 'Massachusetts', cx: 880, cy: 135, path: 'M855,125 L910,125 L910,148 L855,148 Z' },
    'US-VT': { code: 'US-VT', name: 'Vermont', cx: 845, cy: 90, path: 'M838,65 L860,65 L860,105 L838,105 Z' },
    'US-NH': { code: 'US-NH', name: 'New Hampshire', cx: 865, cy: 80, path: 'M860,50 L885,50 L885,105 L860,105 Z' },
    'US-ME': { code: 'US-ME', name: 'Maine', cx: 895, cy: 55, path: 'M885,20 L930,20 L930,100 L885,100 Z' },
    'US-MD': { code: 'US-MD', name: 'Maryland', cx: 810, cy: 240, path: 'M778,228 L845,228 L845,252 L778,252 Z' },
    'US-DE': { code: 'US-DE', name: 'Delaware', cx: 845, cy: 245, path: 'M838,232 L858,232 L858,260 L838,260 Z' },
    'US-RI': { code: 'US-RI', name: 'Rhode Island', cx: 895, cy: 155, path: 'M888,148 L905,148 L905,168 L888,168 Z' },
};

// Canadian provinces (simplified)
const CA_PROVINCES: Record<string, { code: string; name: string; cx: number; cy: number }> = {
    'CA-AB': { code: 'CA-AB', name: 'Alberta', cx: 235, cy: 15 },
    'CA-BC': { code: 'CA-BC', name: 'British Columbia', cx: 130, cy: 15 },
    'CA-SK': { code: 'CA-SK', name: 'Saskatchewan', cx: 340, cy: 15 },
    'CA-MB': { code: 'CA-MB', name: 'Manitoba', cx: 430, cy: 15 },
    'CA-ON': { code: 'CA-ON', name: 'Ontario', cx: 600, cy: 15 },
    'CA-QC': { code: 'CA-QC', name: 'Quebec', cx: 750, cy: 15 },
};

interface DrawerData {
    meta: { jurisdiction_code: string; name: string; updated_at: string } | null;
    operators: Array<{
        operator_id: string;
        business_name: string;
        phone: string;
        website_url: string | null;
        categories: string[];
        verified: boolean;
        rating: number;
        response_time_sec_avg: number;
        coverage_notes: string | null;
    }>;
    rulepacks: Array<{
        rulepack_id: string;
        topic: string;
        summary: string;
        source_links: string[] | null;
        effective_date: string | null;
    }>;
    support_contacts: Array<{
        contact_id: string;
        contact_type: string;
        label: string;
        phone: string | null;
        website_url: string | null;
        notes: string | null;
    }>;
    message?: string;
}

type DrawerTab = 'operators' | 'rules' | 'support';

// ── Analytics tracker
function trackEvent(event: string, data?: Record<string, string>) {
    try {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', event, data);
        }
    } catch { /* analytics is best-effort */ }
}

// ── Skeleton Loader
function DrawerSkeleton() {
    return (
        <div style={{display: 'flex',flexDirection: 'column',gap: 12,padding: '16px 0' }}>
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 12,padding: 16 }}>
                    <div className="skeleton" style={{width: 180,height: 14,borderRadius: 6,marginBottom: 8 }} />
                    <div className="skeleton" style={{width: 120,height: 12,borderRadius: 6,marginBottom: 6 }} />
                    <div className="skeleton" style={{width: 200,height: 10,borderRadius: 6 }} />
                </div>
            ))}
        </div>
    );
}

// ── Operator Card
function OperatorCard({ op }: { op: DrawerData['operators'][0] }) {
    return (
        <div style={{background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 14,padding: 16,transition: 'all 0.18s'}}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${T.gold}40`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
        >
            <div style={{display: 'flex',justifyContent: 'space-between',alignItems: 'flex-start',marginBottom: 10 }}>
                <div>
                    <div style={{display: 'flex',alignItems: 'center',gap: 6,marginBottom: 4 }}>
                        <span style={{fontSize: 15,fontWeight: 800,color: T.textPrimary }}>{op.business_name}</span>
                        {op.verified && (
                            <span style={{padding: '2px 7px',borderRadius: 6,fontSize: 9,fontWeight: 800,background: 'rgba(39,209,127,0.15)',color: T.green,border: '1px solid rgba(39,209,127,0.3)',textTransform: 'uppercase'}}>✓ Verified</span>
                        )}
                    </div>
                    <div style={{display: 'flex',gap: 4,flexWrap: 'wrap' }}>
                        {(op.categories || []).map(c => (
                            <span key={c} style={{padding: '2px 7px',borderRadius: 5,fontSize: 9,fontWeight: 700,background: 'rgba(59,164,255,0.1)',color: T.blue,border: '1px solid rgba(59,164,255,0.2)'}}>{c.replace(/_/g, ' ')}</span>
                        ))}
                    </div>
                </div>
                <div style={{textAlign: 'right',flexShrink: 0 }}>
                    <div style={{fontSize: 20,fontWeight: 900,color: T.gold,lineHeight: 1 }}>
                        {op.rating > 0 ? op.rating.toFixed(1) : '—'}
                    </div>
                    <div style={{fontSize: 9,color: T.textLabel,marginTop: 2 }}>RATING</div>
                </div>
            </div>
            {op.coverage_notes && (
                <p style={{margin: '0 0 10px',fontSize: 12,color: T.textSecondary,lineHeight: 1.5 }}>{op.coverage_notes}</p>
            )}
            <div style={{display: 'flex',gap: 8,flexWrap: 'wrap' }}>
                <a
                    href={`tel:${op.phone}`}
                    onClick={() => trackEvent('operator_called', { operator_id: op.operator_id })}
                    style={{padding: '8px 16px',borderRadius: 10,background: `linear-gradient(135deg, ${T.green}, #059669)`,color: '#fff',fontSize: 12,fontWeight: 800,textDecoration: 'none',textTransform: 'uppercase',letterSpacing: '0.05em'}}>
                    📞 Call
                </a>
                <a
                    href={`sms:${op.phone}`}
                    onClick={() => trackEvent('operator_texted', { operator_id: op.operator_id })}
                    style={{padding: '8px 16px',borderRadius: 10,background: T.bgElevated,border: `1px solid ${T.border}`,color: T.textBody,fontSize: 12,fontWeight: 700,textDecoration: 'none'}}>
                    💬 Text
                </a>
                {op.website_url && (
                    <a
                        href={op.website_url} target="_blank" rel="noopener noreferrer"
                        style={{padding: '8px 16px',borderRadius: 10,background: T.bgElevated,border: `1px solid ${T.border}`,color: T.textBody,fontSize: 12,fontWeight: 700,textDecoration: 'none'}}>
                        🌐 Website
                    </a>
                )}
            </div>
            <div style={{marginTop: 8,fontSize: 11,color: T.textLabel }}>
                ⚡ Avg Response: {op.response_time_sec_avg > 0 ? `${Math.round(op.response_time_sec_avg / 60)}min` : '—'}
            </div>
        </div>
    );
}

// ── Rules Card
function RulepackCard({ rp }: { rp: DrawerData['rulepacks'][0] }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div
            style={{background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 14,padding: 16,cursor: 'pointer',transition: 'all 0.18s'}}
            onClick={() => {
                setExpanded(!expanded);
                trackEvent('rulepack_opened', { rulepack_id: rp.rulepack_id, topic: rp.topic });
            }}
        >
            <div style={{display: 'flex',justifyContent: 'space-between',alignItems: 'center' }}>
                <span style={{fontSize: 14,fontWeight: 700,color: T.textPrimary }}>{rp.topic}</span>
                <span style={{fontSize: 16,color: T.textSecondary,transition: 'transform 0.2s',transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
            </div>
            {expanded && (
                <div style={{marginTop: 10 }}>
                    <p style={{fontSize: 13,color: T.textBody,lineHeight: 1.6,margin: 0 }}>{rp.summary}</p>
                    {rp.effective_date && (
                        <p style={{fontSize: 11,color: T.textLabel,marginTop: 6 }}>Effective: {rp.effective_date}</p>
                    )}
                    {rp.source_links && rp.source_links.length > 0 && (
                        <div style={{display: 'flex',gap: 6,marginTop: 8,flexWrap: 'wrap' }}>
                            {rp.source_links.map((link, i) => (
                                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    style={{padding: '4px 10px',borderRadius: 8,fontSize: 10,fontWeight: 700,background: 'rgba(59,164,255,0.1)',color: T.blue,border: '1px solid rgba(59,164,255,0.2)',textDecoration: 'none'}}>
                                    Source {i + 1} ↗
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Support Contact Card
function SupportContactCard({ contact }: { contact: DrawerData['support_contacts'][0] }) {
    return (
        <div style={{background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 14,padding: 16 }}>
            <div style={{display: 'flex',alignItems: 'center',gap: 8,marginBottom: 8 }}>
                <span style={{padding: '3px 9px',borderRadius: 6,fontSize: 9,fontWeight: 800,background: 'rgba(167,139,250,0.12)',color: T.purple,border: '1px solid rgba(167,139,250,0.25)',textTransform: 'uppercase'}}>{contact.contact_type}</span>
                <span style={{fontSize: 14,fontWeight: 700,color: T.textPrimary }}>{contact.label}</span>
            </div>
            {contact.notes && <p style={{fontSize: 12,color: T.textSecondary,margin: '0 0 8px',lineHeight: 1.5 }}>{contact.notes}</p>}
            <div style={{display: 'flex',gap: 8 }}>
                {contact.phone && (
                    <a href={`tel:${contact.phone}`}
                        onClick={() => trackEvent('support_contact_opened', { contact_id: contact.contact_id })}
                        style={{padding: '6px 14px',borderRadius: 8,fontSize: 11,fontWeight: 700,background: T.bgElevated,border: `1px solid ${T.border}`,color: T.textBody,textDecoration: 'none'}}>📞 {contact.phone}</a>
                )}
                {contact.website_url && (
                    <a href={contact.website_url} target="_blank" rel="noopener noreferrer"
                        style={{padding: '6px 14px',borderRadius: 8,fontSize: 11,fontWeight: 700,background: T.bgElevated,border: `1px solid ${T.border}`,color: T.textBody,textDecoration: 'none'}}>🌐 Visit ↗</a>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════
export default function JurisdictionMapPage() {
    const [selectedCode, setSelectedCode] = useState<string | null>(null);
    const [drawerData, setDrawerData] = useState<DrawerData | null>(null);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [drawerTab, setDrawerTab] = useState<DrawerTab>('operators');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [hoveredState, setHoveredState] = useState<string | null>(null);
    const [countryFilter, setCountryFilter] = useState<'US' | 'CA'>('US');
    const drawerRef = useRef<HTMLDivElement>(null);

    const selectJurisdiction = useCallback(async (code: string) => {
        setSelectedCode(code);
        setDrawerOpen(true);
        setDrawerLoading(true);
        setDrawerTab('operators');
        trackEvent('jurisdiction_selected', { jurisdiction_code: code });

        const { data, error } = await supabase.rpc('get_jurisdiction_drawer', { p_jurisdiction_code: code });
        if (!error && data) {
            setDrawerData(data as DrawerData);
        } else {
            setDrawerData({
                meta: null,
                operators: [],
                rulepacks: [],
                support_contacts: [],
                message: 'Unable to load jurisdiction data',
            });
        }
        setDrawerLoading(false);
        trackEvent('drawer_opened', { jurisdiction_code: code });
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        setSelectedCode(null);
        setDrawerData(null);
    }, []);

    useEffect(() => {
        trackEvent('map_opened');
    }, []);

    const selectedName = useMemo(() => {
        if (!selectedCode) return '';
        return US_STATES[selectedCode]?.name ?? CA_PROVINCES[selectedCode]?.name ?? selectedCode;
    }, [selectedCode]);

    const tabCounts = useMemo(() => ({
        operators: drawerData?.operators?.length ?? 0,
        rules: drawerData?.rulepacks?.length ?? 0,
        support: drawerData?.support_contacts?.length ?? 0,
    }), [drawerData]);

    return (
        <div style={{background: T.bg,minHeight: '100vh',position: 'relative',overflow: 'hidden' }}>
            {/* ── Header */}
            <div className="hc-container" style={{paddingTop: 20,paddingBottom: 10 }}>
                <div style={{display: 'flex',justifyContent: 'space-between',alignItems: 'flex-end',flexWrap: 'wrap',gap: 12 }}>
                    <div>
                        <h1 style={{margin: 0,fontSize: 28,fontWeight: 800,color: T.textPrimary,letterSpacing: '-0.01em',lineHeight: 1,fontFamily: "var(--font-display, 'Space Grotesk', system-ui)"}}>
                            Jurisdiction Map
                        </h1>
                        <p style={{margin: '6px 0 0',fontSize: 13,color: T.textSecondary,lineHeight: 1.5 }}>
                            Tap a state to view operators, regulations, and support contacts
                        </p>
                    </div>
                    {/* Country toggle */}
                    <div style={{display: 'flex',gap: 3,background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 10,padding: 3 }}>
                        {(['US', 'CA'] as const).map(c => (
                            <button aria-label="Interactive Button" key={c} onClick={() => setCountryFilter(c)} style={{padding: '7px 20px',borderRadius: 8,fontSize: 11,fontWeight: 700,background: countryFilter === c ? T.bgElevated : 'transparent',border: `1px solid ${countryFilter === c ? T.borderStrong : 'transparent'}`,color: countryFilter === c ? T.textPrimary : T.textSecondary,cursor: 'pointer',textTransform: 'uppercase',letterSpacing: '0.06em',transition: 'all 0.15s'}}>
                                {c === 'US' ? '🇺🇸 United States' : '🇨🇦 Canada'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Map Canvas */}
            <div className="hc-container" style={{paddingBottom: 20 }}>
                <div style={{position: 'relative',borderRadius: 16,overflow: 'hidden',border: `1px solid ${T.border}`,background: '#0b0f14',boxShadow: '0 20px 60px rgba(0,0,0,0.45)'}}>
                    {/* Grid overlay */}
                    <div style={{position: 'absolute',inset: 0,pointerEvents: 'none',zIndex: 0,backgroundImage: `linear-gradient(rgba(59,164,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,164,255,0.03) 1px, transparent 1px)`,backgroundSize: '48px 48px'}} />

                    {countryFilter === 'US' ? (
                        <svg viewBox="0 0 960 600" style={{width: '100%',height: 'auto',display: 'block',cursor: 'pointer' }}>
                            {/* Subtle background */}
                            <rect width="960" height="600" fill="#0b0f14" />

                            {/* State shapes */}
                            {Object.values(US_STATES).map(state => {
                                const isSelected = selectedCode === state.code;
                                const isHovered = hoveredState === state.code;
                                return (
                                    <g key={state.code}
                                        onClick={() => selectJurisdiction(state.code)}
                                        onMouseEnter={() => setHoveredState(state.code)}
                                        onMouseLeave={() => setHoveredState(null)}
                                        style={{cursor: 'pointer' }}
                                    >
                                        <path
                                            d={state.path}
                                            fill={isSelected ? `${T.gold}30` : isHovered ? `${T.blue}20` : '#151e28'}
                                            stroke={isSelected ? T.gold : isHovered ? T.blue : '#243040'}
                                            strokeWidth={isSelected ? 2 : 1}
                                            style={{transition: 'all 0.2s ease' }}
                                        />
                                        <text
                                            x={state.cx} y={state.cy}
                                            textAnchor="middle" dominantBaseline="middle"
                                            fill={isSelected ? T.gold : isHovered ? T.blue : T.textLabel}
                                            fontSize={state.code.length > 4 ? 9 : 10}
                                            fontWeight={isSelected ? 900 : 700}
                                            fontFamily="'Inter', sans-serif"
                                            style={{pointerEvents: 'none',transition: 'fill 0.2s' }}
                                        >
                                            {state.code.replace('US-', '')}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Hint text */}
                            <text x="480" y="580" textAnchor="middle" fill={T.textLabel} fontSize="11" opacity="0.4"
                                fontFamily="'Inter', sans-serif" fontWeight="500">
                                pinch to zoom • tap a state
                            </text>
                        </svg>
                    ) : (
                        /* ── Canada grid */
                        <div style={{padding: 30,display: 'grid',gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',gap: 10 }}>
                            {Object.values(CA_PROVINCES).map(prov => {
                                const isSelected = selectedCode === prov.code;
                                return (
                                    <button aria-label="Interactive Button"
                                        key={prov.code}
                                        onClick={() => selectJurisdiction(prov.code)}
                                        style={{padding: '16px 12px',borderRadius: 12,background: isSelected ? `${T.gold}15` : T.bgCard,border: `1px solid ${isSelected ? T.gold : T.border}`,color: isSelected ? T.gold : T.textPrimary,fontSize: 13,fontWeight: 700,cursor: 'pointer',textAlign: 'center',transition: 'all 0.18s'}}
                                    >
                                        <div style={{fontSize: 18,marginBottom: 4 }}>{prov.code.replace('CA-', '')}</div>
                                        <div style={{fontSize: 11,color: T.textSecondary }}>{prov.name}</div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Live badge */}
                    <div style={{position: 'absolute',top: 14,left: 14,zIndex: 20,display: 'flex',alignItems: 'center',gap: 7,padding: '6px 13px',background: 'rgba(6,11,18,0.85)',backdropFilter: 'blur(12px)',border: `1px solid rgba(39,209,127,0.3)`,borderRadius: 8}}>
                        <div style={{width: 7,height: 7,borderRadius: '50%',background: T.green,boxShadow: `0 0 8px ${T.green}` }} />
                        <span style={{fontSize: 10,fontWeight: 800,color: T.green,textTransform: 'uppercase',letterSpacing: '0.12em' }}>
                            {countryFilter === 'US' ? '50 States + DC' : '13 Provinces/Territories'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Bottom Sheet Drawer */}
            <div
                ref={drawerRef}
                style={{position: 'fixed',bottom: 0,left: 0,right: 0,zIndex: 50,background: T.bgPanel,backdropFilter: 'blur(24px) saturate(1.4)',borderTop: `1px solid ${T.borderStrong}`,borderRadius: '20px 20px 0 0',transform: drawerOpen ? 'translateY(0)' : 'translateY(100%)',transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',maxHeight: '70vh',overflowY: 'auto',boxShadow: drawerOpen ? '0 -20px 60px rgba(0,0,0,0.6)' : 'none'}}
            >
                {/* Drag handle */}
                <div style={{display: 'flex',justifyContent: 'center',paddingTop: 10,paddingBottom: 6 }}>
                    <div style={{width: 40,height: 4,borderRadius: 2,background: 'rgba(255,255,255,0.15)' }} />
                </div>

                <div style={{padding: '0 20px 24px',maxWidth: 800,margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{display: 'flex',justifyContent: 'space-between',alignItems: 'center',marginBottom: 16 }}>
                        <div>
                            <h2 style={{margin: 0,fontSize: 22,fontWeight: 800,color: T.textPrimary,letterSpacing: '-0.01em' }}>
                                {selectedName || 'Select a Jurisdiction'}
                            </h2>
                            {selectedCode && (
                                <span style={{fontSize: 11,color: T.textLabel,fontFamily: "'JetBrains Mono', monospace",letterSpacing: '0.05em' }}>
                                    {selectedCode}
                                </span>
                            )}
                        </div>
                        <button aria-label="Interactive Button"
                            onClick={closeDrawer}
                            style={{width: 32,height: 32,borderRadius: 8,background: T.bgCard,border: `1px solid ${T.border}`,color: T.textSecondary,fontSize: 16,cursor: 'pointer',display: 'flex',alignItems: 'center',justifyContent: 'center'}}
                        >✕</button>
                    </div>

                    {/* Tab bar */}
                    <div style={{display: 'flex',gap: 4,marginBottom: 16,background: T.bgCard,borderRadius: 10,padding: 3 }}>
                        {([
                            { key: 'operators' as DrawerTab, label: '👷 Operators', count: tabCounts.operators },
                            { key: 'rules' as DrawerTab, label: '📋 Rules', count: tabCounts.rules },
                            { key: 'support' as DrawerTab, label: '📞 Support', count: tabCounts.support },
                        ]).map(tab => (
                            <button aria-label="Interactive Button" key={tab.key} onClick={() => setDrawerTab(tab.key)} style={{flex: 1,padding: '8px 12px',borderRadius: 8,fontSize: 12,fontWeight: 700,background: drawerTab === tab.key ? T.bgElevated : 'transparent',border: `1px solid ${drawerTab === tab.key ? T.borderStrong : 'transparent'}`,color: drawerTab === tab.key ? T.textPrimary : T.textSecondary,cursor: 'pointer',transition: 'all 0.15s'}}>
                                {tab.label} {!drawerLoading && <span style={{opacity: 0.5 }}>({tab.count})</span>}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    {drawerLoading ? (
                        <DrawerSkeleton />
                    ) : drawerData ? (
                        <div style={{display: 'flex',flexDirection: 'column',gap: 10 }}>
                            {drawerTab === 'operators' && (
                                drawerData.operators.length > 0
                                    ? drawerData.operators.map(op => <OperatorCard key={op.operator_id} op={op} />)
                                    : <EmptyTabState icon="👷" label="No operators listed yet" sublabel="Be the first — claim your profile in this jurisdiction" />
                            )}
                            {drawerTab === 'rules' && (
                                drawerData.rulepacks.length > 0
                                    ? drawerData.rulepacks.map(rp => <RulepackCard key={rp.rulepack_id} rp={rp} />)
                                    : <EmptyTabState icon="📋" label="No regulations documented yet" sublabel="Rules for this jurisdiction are being compiled" />
                            )}
                            {drawerTab === 'support' && (
                                drawerData.support_contacts.length > 0
                                    ? drawerData.support_contacts.map(c => <SupportContactCard key={c.contact_id} contact={c} />)
                                    : <EmptyTabState icon="📞" label="No support contacts yet" sublabel="Coming soon for this jurisdiction" />
                            )}
                        </div>
                    ) : null}

                    {/* Export button */}
                    {drawerData && selectedCode && (
                        <button aria-label="Interactive Button"
                            onClick={() => trackEvent('state_packet_exported', { jurisdiction_code: selectedCode })}
                            style={{display: 'block',width: '100%',marginTop: 16,padding: '12px 20px',borderRadius: 12,background: `linear-gradient(135deg, ${T.gold}, #d97706)`,color: '#0a0f16',fontWeight: 900,fontSize: 12,border: 'none',cursor: 'pointer',textTransform: 'uppercase',letterSpacing: '0.07em',boxShadow: `0 3px 16px rgba(245,185,66,0.28)`}}
                        >
                            📥 Export State Packet for {selectedName}
                        </button>
                    )}
                </div>
            </div>

            {/* Backdrop overlay when drawer is open */}
            {drawerOpen && (
                <div
                    onClick={closeDrawer}
                    style={{position: 'fixed',inset: 0,zIndex: 40,background: 'rgba(0,0,0,0.4)',backdropFilter: 'blur(4px)'}}
                />
            )}

            {/* Animations */}
            <style>{`
                .skeleton {
                    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.6s infinite;
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

function EmptyTabState({ icon, label, sublabel }: { icon: string; label: string; sublabel: string }) {
    return (
        <div style={{textAlign: 'center',padding: '32px 20px',background: T.bgCard,border: `1px dashed ${T.border}`,borderRadius: 14}}>
            <div style={{fontSize: 36,marginBottom: 10,opacity: 0.4 }}>{icon}</div>
            <p style={{margin: '0 0 6px',fontSize: 14,fontWeight: 700,color: T.textPrimary }}>{label}</p>
            <p style={{margin: 0,fontSize: 12,color: T.textSecondary }}>{sublabel}</p>
        </div>
    );
}
