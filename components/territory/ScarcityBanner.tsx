'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

// ═══ Territory Scarcity Banner (Section 3) ═══
// Renders "Only X spots left" on dashboards, onboarding, profiles

interface TerritoryScarcityProps {
    regionKey: string; // e.g. "TX", "FL"
    style?: 'banner' | 'compact' | 'overlay';
}

const supabase = createClient();

export function TerritoryScarcityBanner({ regionKey, style = 'banner' }: TerritoryScarcityProps) {
    const [data, setData] = useState<{ max_gold: number; current_gold: number; max_elite: number; current_elite: number; drivers_competing: number } | null>(null);

    useEffect(() => {
        supabase.from('hc_territory_config').select('*').eq('region_key', regionKey).single()
            .then(({ data: d }) => { if (d) setData(d); });
    }, [regionKey]);

    if (!data) return null;
    const goldLeft = data.max_gold - data.current_gold;
    const eliteLeft = data.max_elite - data.current_elite;
    if (goldLeft > 10 && eliteLeft > 5) return null; // Don't show if plenty of spots

    if (style === 'compact') {
        return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 8, background: goldLeft <= 5 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.08)', border: `1px solid ${goldLeft <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)'}` }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: goldLeft <= 5 ? '#ef4444' : '#f59e0b' }}>
                    {goldLeft <= 0 ? '🔒 FULL' : `🔥 ${goldLeft} Gold spot${goldLeft !== 1 ? 's' : ''} left`}
                </span>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(241,169,27,0.06), rgba(239,68,68,0.04))',
            border: '1px solid rgba(241,169,27,0.15)',
            borderRadius: 14, padding: '1rem 1.25rem',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>
                        {regionKey} Territory Status
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {data.drivers_competing} drivers competing in this zone
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: goldLeft <= 3 ? '#ef4444' : '#F1A91B', fontFamily: "'JetBrains Mono', monospace" }}>{goldLeft}</div>
                        <div style={{ fontSize: 8, color: '#6b7280', textTransform: 'uppercase' }}>Gold Left</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: eliteLeft <= 2 ? '#ef4444' : '#818cf8', fontFamily: "'JetBrains Mono', monospace" }}>{eliteLeft}</div>
                        <div style={{ fontSize: 8, color: '#6b7280', textTransform: 'uppercase' }}>Elite Left</div>
                    </div>
                </div>
            </div>

            {/* Progress bars */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginBottom: 4 }}>
                        <span>Gold Spots</span>
                        <span>{data.current_gold}/{data.max_gold}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #F1A91B, #d97706)', width: `${(data.current_gold / data.max_gold) * 100}%`, transition: 'width 0.5s' }} />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginBottom: 4 }}>
                        <span>Elite Spots</span>
                        <span>{data.current_elite}/{data.max_elite}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #818cf8, #6366f1)', width: `${(data.current_elite / data.max_elite) * 100}%`, transition: 'width 0.5s' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══ Scarcity Nudge (for onboarding) ═══
export function ScarcityNudge({ regionKey }: { regionKey: string }) {
    const [data, setData] = useState<{ max_gold: number; current_gold: number; drivers_competing: number } | null>(null);

    useEffect(() => {
        supabase.from('hc_territory_config').select('*').eq('region_key', regionKey).single()
            .then(({ data: d }) => { if (d) setData(d); });
    }, [regionKey]);

    if (!data) return null;
    const left = data.max_gold - data.current_gold;

    return (
        <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f87171' }}>
                ⚡ Only {left} Elite spots left in {regionKey} — {data.drivers_competing} drivers competing
            </span>
        </div>
    );
}
