'use client';

/**
 * Infrastructure Index — Band C Rank 2
 * 
 * Heavy haul support infrastructure directory.
 * Categories: staging yards, secure parking, escort meetup zones,
 * oversize-friendly hotels, installers, truck repair, etc.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MobileGate } from '@/components/mobile/MobileGate';
import { DensityScoreboard } from '@/components/market/DensityScoreboard';
import { track } from '@/lib/telemetry';

const CATEGORIES = [
    { key: 'staging_yard', label: 'Staging Yards', icon: '🏗', color: '#F59E0B', desc: 'Secure load staging and prep areas' },
    { key: 'secure_parking', label: 'Secure Parking', icon: '🅿️', color: '#3B82F6', desc: 'Monitored oversize vehicle parking' },
    { key: 'escort_meetup', label: 'Escort Meetup Zones', icon: '📍', color: '#22C55E', desc: 'Designated escort staging points' },
    { key: 'oversize_hotel', label: 'OS-Friendly Hotels', icon: '🏨', color: '#8B5CF6', desc: 'Hotels with oversize parking' },
    { key: 'installer', label: 'Installers', icon: '🔧', color: '#14B8A6', desc: 'Warning light & equipment installers' },
    { key: 'truck_repair', label: 'Truck Repair', icon: '🔩', color: '#EF4444', desc: 'Heavy haul repair and service' },
    { key: 'equipment_upfitter', label: 'Equipment Upfitters', icon: '⚙️', color: '#EC4899', desc: 'Vehicle upfitting and outfitting' },
    { key: 'route_support', label: 'Route Support', icon: '🛣', color: '#6366F1', desc: 'Route survey and planning partners' },
];

interface InfraLocation {
    id: string;
    name: string;
    category: string;
    city: string;
    state: string;
    services: string[];
    oversize_friendly: boolean;
}

export default function InfrastructureIndexPage() {
    const [locations, setLocations] = useState<InfraLocation[]>([]);
    const [categorySummary, setCategorySummary] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        params.set('limit', '30');

        fetch(`/api/infrastructure?${params}`)
            .then(r => r.ok ? r.json() : { locations: [], category_summary: {} })
            .then(d => {
                setLocations(d.locations || []);
                setCategorySummary(d.category_summary || {});
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [selectedCategory]);

    useEffect(() => {
        track('infrastructure_page_seen' as any, { metadata: { category: selectedCategory || 'all' } });
    }, [selectedCategory]);

    const totalLocations = Object.values(categorySummary).reduce((a, b) => a + b, 0);

    const content = (
        <div style={{ minHeight: '100vh', background: '#060b12', color: '#f5f7fb' }}>
            {/* Hero */}
            <div style={{ padding: '48px 16px 24px', maxWidth: 900, margin: '0 auto' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px', borderRadius: 999, marginBottom: 16,
                    background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.15)',
                }}>
                    <span>🏗</span>
                    <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', color: '#F1A91B', textTransform: 'uppercase' }}>
                        Support Infrastructure
                    </span>
                </div>
                <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
                    Heavy Haul Support Network
                </h1>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', maxWidth: 600, lineHeight: 1.5, margin: 0 }}>
                    Find staging yards, secure parking, escort meetup points, hotels, and fleet support along your routes.
                </p>
                {totalLocations > 0 && (
                    <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                        {totalLocations} locations in network
                    </div>
                )}
            </div>

            {/* Category grid */}
            <div style={{ padding: '0 16px 24px', maxWidth: 900, margin: '0 auto' }}>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 10,
                }}>
                    {CATEGORIES.map(cat => {
                        const count = categorySummary[cat.key] || 0;
                        const isActive = selectedCategory === cat.key;
                        return (
                            <button
                                key={cat.key}
                                onClick={() => setSelectedCategory(isActive ? null : cat.key)}
                                style={{
                                    padding: '14px 12px', borderRadius: 14, textAlign: 'center',
                                    background: isActive ? `${cat.color}12` : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isActive ? `${cat.color}30` : 'rgba(255,255,255,0.06)'}`,
                                    cursor: 'pointer', transition: 'all 0.15s ease',
                                }}
                            >
                                <div style={{ fontSize: 22, marginBottom: 4 }}>{cat.icon}</div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: isActive ? cat.color : '#fff' }}>
                                    {cat.label}
                                </div>
                                {count > 0 && (
                                    <div style={{ fontSize: 9, color: cat.color, fontWeight: 700, marginTop: 2 }}>
                                        {count} locations
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Locations list */}
            <div style={{ padding: '0 16px 80px', maxWidth: 900, margin: '0 auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{
                                padding: '16px', borderRadius: 14,
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                height: 80,
                            }} />
                        ))}
                    </div>
                ) : locations.length === 0 ? (
                    <div style={{
                        padding: '40px 20px', borderRadius: 18, textAlign: 'center',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🏗</div>
                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
                            {selectedCategory ? `No ${CATEGORIES.find(c => c.key === selectedCategory)?.label || 'locations'} yet` : 'Infrastructure data loading'}
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                            Know a location that should be listed? Help us build the most complete heavy haul support network.
                        </div>
                        <Link href="/partner/apply" style={{
                            display: 'inline-flex', marginTop: 16, padding: '10px 20px', borderRadius: 12,
                            background: 'rgba(241,169,27,0.1)', border: '1px solid rgba(241,169,27,0.2)',
                            color: '#F1A91B', fontWeight: 800, fontSize: 12, textDecoration: 'none',
                        }}>
                            Suggest a Location →
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {locations.map(loc => {
                            const cat = CATEGORIES.find(c => c.key === loc.category);
                            return (
                                <div key={loc.id} style={{
                                    padding: '14px 16px', borderRadius: 14,
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex', gap: 12, alignItems: 'center',
                                }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: `${cat?.color || '#888'}08`, border: `1px solid ${cat?.color || '#888'}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 18, flexShrink: 0,
                                    }}>
                                        {cat?.icon || '📍'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {loc.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                            {[loc.city, loc.state].filter(Boolean).join(', ')}
                                        </div>
                                        {loc.services.length > 0 && (
                                            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                                {loc.services.slice(0, 4).map(s => (
                                                    <span key={s} style={{
                                                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                                        background: 'rgba(255,255,255,0.04)', color: '#888',
                                                    }}>{s}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {loc.oversize_friendly && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                                            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
                                            color: '#22C55E', whiteSpace: 'nowrap',
                                        }}>OS OK</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Partner CTA */}
                <div style={{
                    marginTop: 24, padding: '20px', borderRadius: 16, textAlign: 'center',
                    background: 'rgba(241,169,27,0.04)', border: '1px solid rgba(241,169,27,0.12)',
                }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
                        Own a Support Location?
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.5 }}>
                        Claim your location, reach heavy haul carriers, and get priority visibility on corridor routes.
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <Link href="/partner/apply" style={{
                            padding: '10px 20px', borderRadius: 10,
                            background: '#F1A91B', color: '#000', fontWeight: 800, fontSize: 12,
                            textDecoration: 'none',
                        }}>
                            Become a Partner
                        </Link>
                        <Link href="/claim" style={{
                            padding: '10px 20px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', fontWeight: 700, fontSize: 12,
                            textDecoration: 'none',
                        }}>
                            Claim Location
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );

    return <MobileGate mobile={content} desktop={content} />;
}
