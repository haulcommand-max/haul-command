"use client";

import React from 'react';
import useSWR from 'swr';
import { AlertTriangle, Construction, Cloud, Eye, Zap, Car, Wind, ShieldAlert } from 'lucide-react';

type Incident = {
    id: string;
    corridor_slug: string;
    incident_type: string;
    location_text: string | null;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    source: string;
    verified: boolean;
    created_at: string;
    expires_at: string;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    low: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#10b981' },
    moderate: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
    high: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
    critical: { bg: 'rgba(220,38,38,0.12)', border: 'rgba(220,38,38,0.3)', text: '#dc2626' },
};

const INCIDENT_ICONS: Record<string, any> = {
    police_spotted: Eye,
    road_blocked: AlertTriangle,
    heavy_wind: Wind,
    accident: Car,
    escort_shortage: Zap,
    construction: Construction,
    weather: Cloud,
    enforcement_hotspot: ShieldAlert,
};

function timeAgo(dateStr: string): string {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function CorridorRiskWidget({ corridorSlug }: { corridorSlug: string }) {
    const { data: incidents, isLoading } = useSWR<Incident[]>(
        `/api/crowd-intel?corridor=${corridorSlug}`,
        fetcher,
        { refreshInterval: 60_000 }
    );

    if (isLoading) return null;
    if (!incidents || incidents.length === 0) {
        return (
            <div style={{
                background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)',
                borderRadius: 12, padding: '12px 16px', marginBottom: '1rem',
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Clear — No active incidents
                </span>
            </div>
        );
    }

    const maxSeverity = incidents.reduce((max, i) => {
        const order = { low: 0, moderate: 1, high: 2, critical: 3 };
        return ((order as any)[i.severity] || 0) > ((order as any)[max] || 0) ? i.severity : max;
    }, 'low' as string);

    const headerStyle = SEVERITY_COLORS[maxSeverity] || SEVERITY_COLORS.moderate;

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, overflow: 'hidden', marginBottom: '1rem',
        }}>
            <div style={{
                background: headerStyle.bg, borderBottom: `1px solid ${headerStyle.border}`,
                padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={14} color={headerStyle.text} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: headerStyle.text, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {incidents.length} Active {incidents.length === 1 ? 'Alert' : 'Alerts'}
                    </span>
                </div>
                <span style={{ fontSize: 9, color: '#6b7280', fontWeight: 600 }}>
                    Crowd Intel
                </span>
            </div>

            <div style={{ padding: '8px 12px' }}>
                {incidents.slice(0, 5).map(incident => {
                    const IconComponent = INCIDENT_ICONS[incident.incident_type] || AlertTriangle;
                    const sev = SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.moderate;
                    return (
                        <div key={incident.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8, background: sev.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <IconComponent size={14} color={sev.text} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb', textTransform: 'capitalize' }}>
                                    {incident.incident_type.replace(/_/g, ' ')}
                                    {incident.verified && <span style={{ fontSize: 9, color: '#10b981', marginLeft: 6 }}>✓ Verified</span>}
                                </div>
                                {incident.location_text && (
                                    <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>{incident.location_text}</div>
                                )}
                            </div>
                            <span style={{ fontSize: 9, color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {timeAgo(incident.created_at)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
