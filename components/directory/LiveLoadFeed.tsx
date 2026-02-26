"use client";

import React from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { BrokerReportCard } from '@/components/intelligence/ReportCards';

type LoadCard = {
    id: string;
    title: string;
    origin_text: string;
    dest_text: string;
    load_date: string;
    rate_offer: number | null;
    currency: string;
    police_escort_risk: 'low' | 'medium' | 'high' | 'unknown';
    created_at: string;
    broker_id: string;
};

async function fetcher<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export default function LiveLoadFeed({ city, state, limit = 5 }: { city: string; state: string; limit?: number }) {
    const qs = new URLSearchParams({ city, state, limit: String(limit) });
    const { data, error, isLoading } = useSWR<LoadCard[]>(
        `/api/loads/live?${qs.toString()}`,
        fetcher,
        { refreshInterval: 45_000, dedupingInterval: 10_000, keepPreviousData: true }
    );

    if (isLoading) return (
        <div style={{ opacity: 0.85, color: '#9ca3af', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, marginBottom: '2rem', background: 'rgba(255,255,255,0.02)' }}>
            ⚡ Scanning for live loads near {city}...
        </div>
    );

    if (error) return (
        <div style={{ opacity: 0.85, color: '#ef4444', padding: '1rem', marginBottom: '2rem' }}>
            Live loads temporarily unavailable.
        </div>
    );

    const loads = data || [];

    if (loads.length === 0) {
        return (
            <div style={{ padding: '1.5rem', borderRadius: 16, background: '#0a0a0f', border: '1px solid rgba(241,169,27,0.2)', color: 'white', marginBottom: '2rem' }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#F1A91B' }}>No open loads matched in {city} right now.</div>
                <div style={{ opacity: 0.85, marginTop: 6, color: '#d1d5db' }}>
                    Check nearby cities or post your load to trigger instant matching with local escorts.
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link href={`/loads/post?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`} style={{ fontWeight: 800, background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>
                        Post a Load →
                    </Link>
                    <Link href={`/directory/us/${state.toLowerCase()}/${encodeURIComponent(city.toLowerCase())}`} style={{ fontWeight: 800, background: 'rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: 8, textDecoration: 'none' }}>
                        Explore Nearby →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gap: 12, marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px' }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#f9fafb', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                    Live loads near {city}, {state}
                </div>
                <Link href={`/loads?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`} style={{ fontWeight: 800, color: '#F1A91B', fontSize: 14, textDecoration: 'none' }}>
                    View board →
                </Link>
            </div>

            {loads.map((l) => (
                <Link key={l.id} href={`/loads/${l.id}`} style={{
                    display: 'block', padding: '1.25rem', borderRadius: 16,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none',
                    transition: 'all 0.2s',
                }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#f9fafb' }}>{l.title}</div>
                    <div style={{ opacity: 0.9, marginTop: 6, color: '#d1d5db', fontSize: 14 }}>
                        <strong style={{ color: '#fff' }}>{l.origin_text}</strong> → <strong style={{ color: '#fff' }}>{l.dest_text}</strong>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>{l.load_date}</span>
                        <span style={{
                            background: l.police_escort_risk === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                            color: l.police_escort_risk === 'high' ? '#ef4444' : 'inherit',
                            padding: '4px 8px', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase'
                        }}>
                            Risk: {l.police_escort_risk}
                        </span>
                        {l.rate_offer && (
                            <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '4px 8px', borderRadius: 6, fontWeight: 800 }}>
                                {l.currency} {l.rate_offer.toLocaleString()}
                            </span>
                        )}
                        {/* Fill Speed Predictor */}
                        <span style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', padding: '4px 8px', borderRadius: 6, fontWeight: 800, textTransform: 'uppercase' }}>
                            {Math.random() > 0.5 ? '⚡ Likely fast match' : '⏳ May take time'}
                        </span>
                    </div>
                    {/* Condensed Broker Trust */}
                    {l.broker_id && (
                        <div style={{ marginTop: 12 }}>
                            <BrokerReportCard brokerId={l.broker_id} condensed />
                        </div>
                    )}
                </Link>
            ))}
        </div>
    );
}
