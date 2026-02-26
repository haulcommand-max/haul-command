/**
 * DirectoryPopularSearches — Trending searches from the last 30 days.
 * Shows what operators/cities users are searching for most.
 * Feeds the directory home and search bar suggestion list.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TrendingSearch {
    city: string;
    state: string | null;
    service: string | null;
    search_count: number;
    ctr_pct: number | null;
}

export default function DirectoryPopularSearches() {
    const [trending, setTrending] = useState<TrendingSearch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/directory/popular-searches')
            .then(r => r.json())
            .then(d => { setTrending(d.trending ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[...Array(6)].map((_, i) => (
                <div key={i} style={{ width: 120, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
            ))}
        </div>
    );

    if (trending.length === 0) return null;

    return (
        <div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4b5563', marginBottom: 10 }}>
                🔥 Trending Searches
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {trending.slice(0, 12).map((t, i) => {
                    const label = [t.city, t.state].filter(Boolean).join(', ');
                    const href = t.state
                        ? `/directory/us/${t.state.toLowerCase()}/${t.city.toLowerCase().replace(/\s+/g, '-')}`
                        : `/directory`;
                    return (
                        <Link
                            key={`${t.city}-${t.state}-${i}`}
                            href={href}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600,
                                textDecoration: 'none',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#d1d5db',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(241,169,27,0.08)';
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(241,169,27,0.25)';
                                (e.currentTarget as HTMLElement).style.color = '#F1A91B';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                                (e.currentTarget as HTMLElement).style.color = '#d1d5db';
                            }}
                        >
                            <span>{label}</span>
                            {t.search_count > 10 && (
                                <span style={{ fontSize: 9, fontWeight: 800, color: '#F1A91B', background: 'rgba(241,169,27,0.15)', padding: '1px 6px', borderRadius: 10 }}>
                                    {t.search_count}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
