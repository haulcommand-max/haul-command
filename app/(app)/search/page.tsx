'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    HcIconDirectory, HcIconMap, HcIconVerified,
    HcIconBridgeClearance, HcIconDispatchServices,
} from '@/components/icons';

/* â”€â”€â”€ Result types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/** Unified search result — maps from hc_search_all RPC output */
interface SearchResult {
    entity_type: string;
    entity_id: string;
    title: string;
    subtitle: string | null;
    city: string | null;
    region: string | null;
    country_code: string | null;
    tags: string[];
    is_verified: boolean;
    trust_score: number;
    score: number;
    // Preserved from legacy OperatorResult shape for backward compat
    slug?: string;
    height_pole?: boolean;
    is_dispatch_ready?: boolean;
    boost_tier?: string | null;
}

interface SearchResponse {
    results: SearchResult[];
    query: {
        q: string | null;
        country: string | null;
        region: string | null;
        limit: number;
        offset: number;
    };
}

/* â”€â”€â”€ Entity type display helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const ENTITY_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    operator: { label: 'Operator', color: '#00ff88', icon: 'ðŸš—' },
    pilot_car_operator: { label: 'Pilot Car', color: '#00ff88', icon: 'ðŸš—' },
    pilot_driver: { label: 'Pilot Driver', color: '#00e07a', icon: 'ðŸ‘¤' },
    broker: { label: 'Broker', color: '#818cf8', icon: 'ðŸ¤' },
    truck_stop: { label: 'Truck Stop', color: '#f59e0b', icon: 'â›½' },
    port: { label: 'Port', color: '#3b82f6', icon: 'ðŸ—ï¸' },
    port_infrastructure: { label: 'Port Infra', color: '#60a5fa', icon: 'ðŸ—ï¸' },
    terminal: { label: 'Terminal', color: '#6366f1', icon: 'ðŸ“¦' },
    hotel: { label: 'Hotel', color: '#a78bfa', icon: 'ðŸ¨' },
    support_hotel: { label: 'Support Hotel', color: '#a78bfa', icon: 'ðŸ¨' },
    place: { label: 'Place', color: '#fb923c', icon: 'ðŸ“' },
    escort_staging_zone: { label: 'Staging Zone', color: '#34d399', icon: 'ðŸŽ¯' },
    crane_rental_yard: { label: 'Crane Yard', color: '#fbbf24', icon: 'ðŸ—ï¸' },
    intermodal_rail_yard: { label: 'Rail Yard', color: '#60a5fa', icon: 'ðŸš‚' },
    weigh_station: { label: 'Weigh Station', color: '#94a3b8', icon: 'âš–ï¸' },
    border_crossing: { label: 'Border Crossing', color: '#ef4444', icon: 'ðŸš§' },
    military_base: { label: 'Military Base', color: '#64748b', icon: 'ðŸŽ–ï¸' },
    mining_site: { label: 'Mining Site', color: '#d97706', icon: 'â›ï¸' },
};

function getEntityDisplay(type: string) {
    return ENTITY_TYPE_LABELS[type] || { label: type.replace(/_/g, ' '), color: '#888', icon: 'ðŸ“„' };
}

/** Entity types in the pilot_car_operator_family that get operator-style rendering */
const OPERATOR_FAMILY = new Set(['operator', 'pilot_car_operator', 'pilot_driver', 'escort_staging_zone', 'broker']);

const POSITION_TYPES = ['All', 'Pilot Car', 'Truck Stop', 'Port', 'Place', 'Broker'];
const SORT_OPTIONS = [
    { value: 'relevance', label: 'Best Match' },
    { value: 'trust_desc', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest' },
];

/* â”€â”€â”€ Main Page Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState('relevance');
    const [stateFilter, setStateFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [geoEnabled, setGeoEnabled] = useState(false);
    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLng, setUserLng] = useState<number | null>(null);
    const [radius, setRadius] = useState(100);
    const [searchMs, setSearchMs] = useState(0);
    const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

    /* â”€â”€â”€ Search function — calls /api/search/all (backed by hc_search_all RPC) â”€â”€â”€ */
    const doSearch = useCallback(async (searchQuery: string) => {
        setLoading(true);
        const start = performance.now();
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (stateFilter) params.set('region', stateFilter);

            // Map type filter to tags
            if (typeFilter !== 'All') {
                const tagMap: Record<string, string> = {
                    'Pilot Car': 'pilot_car_operator_family',
                    'Truck Stop': 'truck_stop',
                    'Port': 'port',
                    'Place': 'place',
                    'Broker': 'broker',
                };
                const tag = tagMap[typeFilter];
                if (tag) params.set('tags', tag);
            }

            if (geoEnabled && userLat && userLng) {
                params.set('lat', String(userLat));
                params.set('lng', String(userLng));
                params.set('radius_km', String(Math.round(radius * 1.609))); // miles â†’ km
            }

            params.set('limit', '50');

            const res = await fetch(`/api/search/all?${params}`);
            const data: SearchResponse = await res.json();

            setResults(data.results || []);
            setTotal(data.results?.length || 0);
            setSearchMs(Math.round(performance.now() - start));
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    }, [stateFilter, typeFilter, geoEnabled, userLat, userLng, radius]);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => doSearch(query), 300);
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

    /* â”€â”€â”€ Compute facets from results â”€â”€â”€ */
    const stateFacets = results.reduce((acc, r) => {
        if (r.region) {
            acc[r.region] = (acc[r.region] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const typeFacets = results.reduce((acc, r) => {
        const display = getEntityDisplay(r.entity_type);
        acc[display.label] = (acc[display.label] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const sortedStateFacets = Object.entries(stateFacets)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    /* â”€â”€â”€ Get link for result â”€â”€â”€ */
    const getResultLink = (r: SearchResult) => {
        // Operator family â†’ /place/{slug or id}
        if (OPERATOR_FAMILY.has(r.entity_type)) {
            return `/place/${r.slug || r.entity_id}`;
        }
        // Everything else â†’ /place/{entity_id}
        return `/place/${r.entity_id}`;
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
                        <Link aria-label="Navigation Link" href="/" style={{ color: '#F1A91B', fontWeight: 800, fontSize: 20, textDecoration: 'none', letterSpacing: '-0.5px' }}>
                            HAUL COMMAND
                        </Link>
                        <span style={{ color: '#666', fontSize: 14 }}>Search Everything</span>
                    </div>

                    {/* Search Bar */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search operators, truck stops, ports, cities..."
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
                                onFocus={(e) => (e.target.style.borderColor = '#F1A91B')}
                                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', opacity: 0.5 }}>
                                <HcIconDirectory size={18} />
                            </span>
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
                            <button aria-label="Interactive Button"
                                key={role}
                                onClick={() => setTypeFilter(role)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                    border: typeFilter === role ? '1px solid #F1A91B' : '1px solid rgba(255,255,255,0.1)',
                                    background: typeFilter === role ? 'rgba(241,169,27,0.15)' : 'rgba(255,255,255,0.04)',
                                    color: typeFilter === role ? '#F1A91B' : '#999',
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
                            <button aria-label="Interactive Button" onClick={enableGeo} style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.04)',
                                color: '#999',
                                fontSize: 13,
                                cursor: 'pointer',
                            }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <HcIconMap size={14} /> Near Me
                                </span>
                            </button>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#F1A91B', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <HcIconMap size={14} /> {radius}mi
                                </span>
                                <input
                                    type="range"
                                    min={10}
                                    max={500}
                                    value={radius}
                                    onChange={(e) => setRadius(Number(e.target.value))}
                                    style={{ width: 100, accentColor: '#F1A91B' }}
                                />
                            </div>
                        )}

                        {stateFilter && (
                            <button aria-label="Interactive Button" onClick={() => setStateFilter('')} style={{
                                padding: '6px 14px',
                                borderRadius: 20,
                                border: '1px solid #F1A91B',
                                background: 'rgba(241,169,27,0.15)',
                                color: '#F1A91B',
                                fontSize: 13,
                                cursor: 'pointer',
                            }}>
                                {stateFilter} âœ•
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' as const }}>
                {/* Sidebar Facets — hidden on mobile via media query in layout */}
                <div className="search-sidebar" style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <style>{`.search-sidebar { display: none !important; } @media(min-width:768px) { .search-sidebar { display: flex !important; } }`}</style>
                    {/* Type breakdown */}
                    {Object.keys(typeFacets).length > 0 && (
                        <div>
                            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 10 }}>
                                Entity Types
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {Object.entries(typeFacets).sort((a, b) => b[1] - a[1]).map(([label, cnt]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px', fontSize: 13, color: '#aaa' }}>
                                        <span>{label}</span>
                                        <span style={{ opacity: 0.5 }}>{cnt}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* State facets */}
                    {sortedStateFacets.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', marginBottom: 10 }}>
                                State / Region
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {sortedStateFacets.map(([val, cnt]) => (
                                    <button aria-label="Interactive Button"
                                        key={val}
                                        onClick={() => setStateFilter(val === stateFilter ? '' : val)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: '6px 10px',
                                            borderRadius: 6,
                                            border: 'none',
                                            background: val === stateFilter ? 'rgba(241,169,27,0.15)' : 'transparent',
                                            color: val === stateFilter ? '#F1A91B' : '#aaa',
                                            fontSize: 13,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <span>{val}</span>
                                        <span style={{ opacity: 0.5 }}>{cnt}</span>
                                    </button>
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
                            {loading ? 'Searching...' : `${total.toLocaleString()} results found`}
                            {searchMs > 0 && ` in ${searchMs}ms`}
                        </span>
                        <span style={{ fontSize: 11, color: '#555' }}>Powered by FTS</span>
                    </div>

                    {/* Results Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {results.map((r) => {
                            const entityDisplay = getEntityDisplay(r.entity_type);
                            const isOperator = OPERATOR_FAMILY.has(r.entity_type);

                            return (
                                <Link aria-label="Navigation Link"
                                    key={`${r.entity_type}-${r.entity_id}`}
                                    href={getResultLink(r)}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
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
                                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(241,169,27,0.3)';
                                            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
                                        }}
                                    >
                                        {/* Score / Icon Circle */}
                                        <div style={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: '50%',
                                            border: isOperator
                                                ? `2px solid ${getScoreColor(r.trust_score || 0)}`
                                                : `2px solid ${entityDisplay.color}30`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            background: isOperator
                                                ? `${getScoreColor(r.trust_score || 0)}15`
                                                : `${entityDisplay.color}10`,
                                            fontSize: isOperator ? 18 : 22,
                                        }}>
                                            {isOperator ? (
                                                <span style={{ fontWeight: 800, fontSize: 18, color: getScoreColor(r.trust_score || 0) }}>
                                                    {r.trust_score || '—'}
                                                </span>
                                            ) : (
                                                <span>{entityDisplay.icon}</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{r.title || 'Unknown'}</span>
                                                {r.is_verified && (
                                                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,255,136,0.15)', color: '#00ff88', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                        <HcIconVerified size={12} /> VERIFIED
                                                    </span>
                                                )}
                                                {/* Entity type badge */}
                                                <span style={{
                                                    fontSize: 10,
                                                    padding: '2px 8px',
                                                    borderRadius: 4,
                                                    background: `${entityDisplay.color}15`,
                                                    color: entityDisplay.color,
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                }}>
                                                    {entityDisplay.label}
                                                </span>
                                            </div>

                                            {/* Location + subtitle */}
                                            <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                                                {r.city && r.region ? `${r.city}, ${r.region}` : r.region || r.city || ''}
                                                {r.country_code && ` · ${r.country_code}`}
                                            </div>

                                            {r.subtitle && (
                                                <div style={{ fontSize: 12, color: '#666', marginTop: 4, maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {r.subtitle}
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {r.tags && r.tags.length > 0 && (
                                                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                                    {r.tags.slice(0, 4).map(t => (
                                                        <span key={t} style={{
                                                            fontSize: 11,
                                                            padding: '3px 8px',
                                                            borderRadius: 4,
                                                            background: 'rgba(255,255,255,0.06)',
                                                            color: '#aaa',
                                                            textTransform: 'capitalize',
                                                        }}>
                                                            {t.replace(/_/g, ' ')}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Search score indicator */}
                                        {r.score > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 12,
                                                fontSize: 10,
                                                color: '#555',
                                                fontWeight: 600,
                                            }}>
                                                {r.score.toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}

                        {!loading && results.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
                                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', opacity: 0.4 }}>
                                    <HcIconDirectory size={48} variant="empty_state" />
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No results found</div>
                                <div style={{ fontSize: 14 }}>Try broadening your search or removing filters</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}