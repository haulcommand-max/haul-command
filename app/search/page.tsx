'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

interface OperatorResult {
    id: string;
    company_name: string;
    city: string;
    state: string;
    country_code: string;
    phone: string;
    trust_score: number;
    freshness_score: number;
    reputation_score: number;
    role_subtypes: string[];
    height_pole: boolean;
    is_dispatch_ready: boolean;
    is_verified: boolean;
    boost_tier: string | null;
    corridors: string[];
    slug: string;
}

interface SearchResponse {
    results: OperatorResult[];
    total: number;
    page: number;
    totalPages: number;
    facets: Record<string, Array<{ value: string; count: number }>>;
    processingTimeMs: number;
}

const POSITION_TYPES = ['All', 'Pilot Car', 'Chase Car', 'Lead Car', 'High Pole', 'Route Survey'];
const SORT_OPTIONS = [
    { value: 'relevance', label: 'Best Match' },
    { value: 'reputation_desc', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest First' },
    { value: 'newest', label: 'Newest' },
];

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<OperatorResult[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState('relevance');
    const [stateFilter, setStateFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [facets, setFacets] = useState<Record<string, Array<{ value: string; count: number }>>>({});
    const [processingTime, setProcessingTime] = useState(0);
    const [geoEnabled, setGeoEnabled] = useState(false);
    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLng, setUserLng] = useState<number | null>(null);
    const [radius, setRadius] = useState(100);
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    const doSearch = useCallback(async (searchQuery: string, p: number = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                q: searchQuery || '*',
                page: String(p),
                per_page: '20',
                sort: sortBy,
            });

            if (stateFilter) params.set('state', stateFilter);
            if (roleFilter !== 'All') {
                const roleMap: Record<string, string> = {
                    'Pilot Car': 'pilot_car',
                    'Chase Car': 'chase_car',
                    'Lead Car': 'lead_car',
                    'High Pole': 'high_pole',
                    'Route Survey': 'route_survey',
                };
                params.set('role', roleMap[roleFilter] || roleFilter);
            }

            if (geoEnabled && userLat && userLng) {
                params.set('lat', String(userLat));
                params.set('lng', String(userLng));
                params.set('radius_miles', String(radius));
            }

            const res = await fetch(`/api/search/operators?${params}`);
            const data: SearchResponse = await res.json();

            setResults(data.results || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 0);
            setPage(p);
            setFacets(data.facets || {});
            setProcessingTime(data.processingTimeMs || 0);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    }, [sortBy, stateFilter, roleFilter, geoEnabled, userLat, userLng, radius]);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => doSearch(query, 1), 300);
        return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
    }, [query, doSearch]);

    // Get user location
    const enableGeo = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLat(pos.coords.latitude);
                    setUserLng(pos.coords.longitude);
                    setGeoEnabled(true);
                },
                () => setGeoEnabled(false)
            );
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#00ff88';
        if (score >= 60) return '#ffaa00';
        if (score >= 40) return '#ff6644';
        return '#ff3333';
    };

    const getBoostBadge = (tier: string | null) => {
        if (!tier) return null;
        const badges: Record<string, { label: string; color: string; bg: string }> = {
            premium: { label: '⚡ PREMIUM', color: '#fff', bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
            featured: { label: '★ FEATURED', color: '#fff', bg: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
            spotlight: { label: '● SPOTLIGHT', color: '#fff', bg: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
        };
        return badges[tier] || null;
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e0e0e0', fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Search Header */}
            <div style={{
                background: 'linear-gradient(180deg, #111118 0%, #0a0a0f 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '24px 0',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                backdropFilter: 'blur(20px)',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <Link href="/" style={{ color: '#00ff88', fontWeight: 800, fontSize: 20, textDecoration: 'none', letterSpacing: '-0.5px' }}>
                            HAUL COMMAND
                        </Link>
                        <span style={{ color: '#666', fontSize: 14 }}>Search Operators</span>
                    </div>

                    {/* Search Bar */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search operators, cities, corridors..."
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 44px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12,
                                    color: '#fff',
                                    fontSize: 16,
                                    outline: 'none',
                                    transition: 'border 0.2s',
                                }}
                                onFocus={(e) => (e.target.style.borderColor = '#00ff88')}
                                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 20, opacity: 0.5 }}>🔍</span>
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                color: '#fff',
                                fontSize: 14,
                            }}
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        {POSITION_TYPES.map(role => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                    border: roleFilter === role ? '1px solid #00ff88' : '1px solid rgba(255,255,255,0.1)',
                                    background: roleFilter === role ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: roleFilter === role ? '#00ff88' : '#999',
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {role}
                            </button>
                        ))}

                        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

                        {!geoEnabled ? (
                            <button onClick={enableGeo} style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.04)',
                                color: '#999',
                                fontSize: 13,
                                cursor: 'pointer',
                            }}>
                                📍 Near Me
                            </button>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#00ff88', fontSize: 13 }}>📍 {radius}mi</span>
                                <input
                                    type="range"
                                    min={10}
                                    max={500}
                                    value={radius}
                                    onChange={(e) => setRadius(Number(e.target.value))}
                                    style={{ width: 100, accentColor: '#00ff88' }}
                                />
                            </div>
                        )}

                        {stateFilter && (
                            <button onClick={() => setStateFilter('')} style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: '1px solid #00ff88',
                                background: 'rgba(0,255,136,0.15)',
                                color: '#00ff88',
                                fontSize: 13,
                                cursor: 'pointer',
                            }}>
                                {stateFilter} ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'flex', gap: 24 }}>
                {/* Sidebar Facets */}
                <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {facets.state && facets.state.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 10 }}>
                                State
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {facets.state.slice(0, 15).map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => setStateFilter(f.value === stateFilter ? '' : f.value)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '6px 10px',
                                            borderRadius: 6,
                                            border: 'none',
                                            background: f.value === stateFilter ? 'rgba(0,255,136,0.15)' : 'transparent',
                                            color: f.value === stateFilter ? '#00ff88' : '#aaa',
                                            fontSize: 13,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span>{f.value}</span>
                                        <span style={{ opacity: 0.5 }}>{f.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {facets.country_code && facets.country_code.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 10 }}>
                                Country
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {facets.country_code.map(f => (
                                    <div key={f.value} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px', fontSize: 13, color: '#aaa' }}>
                                        <span>{f.value}</span>
                                        <span style={{ opacity: 0.5 }}>{f.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Results */}
                <div style={{ flex: 1 }}>
                    {/* Stats Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: 13, color: '#888' }}>
                        <span>
                            {loading ? 'Searching...' : `${total.toLocaleString()} operators found`}
                            {processingTime > 0 && ` in ${processingTime}ms`}
                        </span>
                        <span>Page {page} of {totalPages || 1}</span>
                    </div>

                    {/* Results Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {results.map((op) => {
                            const boost = getBoostBadge(op.boost_tier);
                            return (
                                <Link
                                    key={op.id}
                                    href={`/providers/${op.slug || op.id}`}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{
                                        background: boost ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                                        border: boost ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: 14,
                                        padding: '18px 20px',
                                        display: 'flex',
                                        gap: 16,
                                        alignItems: 'flex-start',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        position: 'relative',
                                    }}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,255,136,0.3)';
                                            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLDivElement).style.borderColor = boost ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)';
                                            (e.currentTarget as HTMLDivElement).style.background = boost ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
                                        }}
                                    >
                                        {/* Score Circle */}
                                        <div style={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: '50%',
                                            border: `2px solid ${getScoreColor(op.reputation_score || 0)}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            background: `${getScoreColor(op.reputation_score || 0)}15`,
                                        }}>
                                            <span style={{ fontWeight: 800, fontSize: 18, color: getScoreColor(op.reputation_score || 0) }}>
                                                {op.reputation_score || '—'}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{op.company_name}</span>
                                                {op.is_verified && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,255,136,0.15)', color: '#00ff88', fontWeight: 600 }}>✓ VERIFIED</span>}
                                                {op.is_dispatch_ready && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontWeight: 600 }}>DISPATCH READY</span>}
                                                {op.height_pole && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600 }}>HIGH POLE</span>}
                                            </div>
                                            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                                                {op.city && op.state ? `${op.city}, ${op.state}` : op.state || ''} {op.country_code && `· ${op.country_code}`}
                                            </div>
                                            {op.role_subtypes && op.role_subtypes.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                                    {op.role_subtypes.slice(0, 4).map(r => (
                                                        <span key={r} style={{
                                                            fontSize: 11,
                                                            padding: '3px 8px',
                                                            borderRadius: 4,
                                                            background: 'rgba(255,255,255,0.06)',
                                                            color: '#aaa',
                                                            textTransform: 'capitalize',
                                                        }}>
                                                            {r.replace(/_/g, ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Boost Badge */}
                                        {boost && (
                                            <span style={{
                                                position: 'absolute',
                                                top: -1,
                                                right: 16,
                                                padding: '4px 12px',
                                                borderRadius: '0 0 8px 8px',
                                                background: boost.bg,
                                                color: boost.color,
                                                fontSize: 10,
                                                fontWeight: 800,
                                                letterSpacing: '0.05em',
                                            }}>
                                                {boost.label}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}

                        {!loading && results.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No operators found</div>
                                <div style={{ fontSize: 14 }}>Try broadening your search or removing filters</div>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                            <button
                                disabled={page <= 1}
                                onClick={() => doSearch(query, page - 1)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: page <= 1 ? '#444' : '#fff',
                                    cursor: page <= 1 ? 'default' : 'pointer',
                                }}
                            >
                                ← Previous
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => doSearch(query, page + 1)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: page >= totalPages ? '#444' : '#fff',
                                    cursor: page >= totalPages ? 'default' : 'pointer',
                                }}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
