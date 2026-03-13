'use client';

/**
 * /directory - HAUL COMMAND Directory Discovery Page
 * 
 * GeoDirectory concept taken to 2026:
 *   - Full-bleed MapLibre map with live provider pins
 *   - Floating search + category filter overlay
 *   - Slide-up results panel (mobile) / side panel (desktop)
 *   - Click a pin -> see rich detail card -> link to /place/[id]
 *   - Live stats ticker, category toggles, "Near me" button
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Link from 'next/link';
import {
    Search, MapPin, ShieldCheck, Star, Filter,
    X, ChevronDown, ChevronUp, Crosshair, Loader2,
    Award, Navigation, Eye, Users, Globe, ArrowRight,
} from 'lucide-react';
import {
    HcIconPilotCarOperators, HcIconTruckStops, HcIconPortsTerminals,
    HcIconRailIntermodal, HcIconHotels, HcIconHeavyHaulTrucking,
    HcIconClaimsVerification, HcIconVerified, HcIconAndMore,
    HcIconBridgeClearance,
    HcIcon,
} from '@/components/icons';

// -- Types ------------------------------------------------------------------

interface DirectoryPin {
    id: string;
    slug: string;
    name: string;
    entity_type: string;
    city: string;
    state: string;
    country: string;
    claim_status: string;
    rank_score: number;
    completeness: number;
    verified: boolean;
    has_high_pole: boolean;
    twic: boolean;
    rating: number;
    review_count: number;
    phone: string | null;
    lat: number;
    lng: number;
}

interface CategoryFilter {
    key: string;
    label: string;
    icon: React.ComponentType<any>;
    color: string;
    active: boolean;
}

// -- Constants ----------------------------------------------------------------

const MAP_STYLE =
    process.env.NEXT_PUBLIC_MAPLIBRE_STYLE ??
    'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const ENTITY_LABELS: Record<string, string> = {
    pilot_car_operator: 'Pilot Car',
    pilot_driver: 'Pilot Driver',
    truck_stop: 'Truck Stop',
    terminal: 'Terminal',
    port: 'Port',
    port_infrastructure: 'Port Infra',
    seaport: 'Seaport',
    intermodal_rail_yard: 'Rail Yard',
    hotel: 'Hotel',
    support_hotel: 'Support Hotel',
};

const CATEGORIES: CategoryFilter[] = [
    { key: 'all', label: 'All', icon: HcIconAndMore, color: '#C6923A', active: true },
    { key: 'pilot_car', label: 'Pilot Cars', icon: HcIconPilotCarOperators, color: '#C6923A', active: false },
    { key: 'truck_stop', label: 'Truck Stops', icon: HcIconTruckStops, color: '#10B981', active: false },
    { key: 'port', label: 'Ports', icon: HcIconPortsTerminals, color: '#06B6D4', active: false },
    { key: 'terminal', label: 'Terminals', icon: HcIconRailIntermodal, color: '#8B5CF6', active: false },
    { key: 'hotel', label: 'Hotels', icon: HcIconHotels, color: '#F59E0B', active: false },
    { key: 'high_pole', label: 'High Pole', icon: HcIconBridgeClearance, color: '#3B82F6', active: false },
    { key: 'twic', label: 'TWIC', icon: HcIconClaimsVerification, color: '#EF4444', active: false },
];

// -- Helpers ------------------------------------------------------------------

function getEntityIcon(type: string): React.ComponentType<any> {
    switch (type) {
        case 'pilot_car_operator': case 'pilot_driver': return HcIconPilotCarOperators;
        case 'truck_stop': return HcIconTruckStops;
        case 'port': case 'port_infrastructure': case 'seaport': return HcIconPortsTerminals;
        case 'terminal': case 'intermodal_rail_yard': return HcIconRailIntermodal;
        case 'hotel': case 'support_hotel': return HcIconHotels;
        default: return HcIconHeavyHaulTrucking;
    }
}

function getRankBadge(score: number) {
    if (score >= 80) return { label: 'Top Rated', color: '#22C55E', bg: 'rgba(34,197,94,0.1)' };
    if (score >= 50) return { label: 'Established', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' };
    if (score >= 20) return { label: 'Active', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'New', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };
}

// -- Component ----------------------------------------------------------------

export default function DirectoryPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const popupRef = useRef<maplibregl.Popup | null>(null);

    const [pins, setPins] = useState<DirectoryPin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedPin, setSelectedPin] = useState<DirectoryPin | null>(null);
    const [panelOpen, setPanelOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [geolocating, setGeolocating] = useState(false);
    const userMarkerRef = useRef<maplibregl.Marker | null>(null);

    // Stats
    const totalProviders = pins.length;
    const verifiedCount = pins.filter(p => p.verified).length;
    const claimedCount = pins.filter(p => p.claim_status === 'claimed' || p.claim_status === 'verified').length;

    // -- Fetch directory pins -------------------------------------------------

    const fetchPins = useCallback(async (category?: string, query?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (category && category !== 'all') params.set('category', category);
            if (query) params.set('q', query);
            params.set('limit', '1500');
            const res = await fetch(`/api/map/directory-pins?${params}`);
            if (!res.ok) throw new Error('fetch failed');
            const fc = await res.json();
            const parsed: DirectoryPin[] = (fc.features ?? []).map((f: any) => ({
                ...f.properties,
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
            }));
            setPins(parsed);

            // Update map source
            const map = mapRef.current;
            if (map && map.getSource('directory-pins')) {
                (map.getSource('directory-pins') as maplibregl.GeoJSONSource).setData(fc);
            }
        } catch {
            setPins([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // -- Helper: place a "You Are Here" pulsing marker ------------------------

    const placeUserMarker = useCallback((map: maplibregl.Map, lat: number, lng: number) => {
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
            userMarkerRef.current = null;
        }

        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.innerHTML = `
            <div style="position:relative;width:20px;height:20px">
                <div style="position:absolute;inset:0;border-radius:50%;background:rgba(198,146,58,0.25);animation:user-pulse 2s ease-out infinite"></div>
                <div style="position:absolute;inset:4px;border-radius:50%;background:#C6923A;border:2px solid #fff;box-shadow:0 0 12px rgba(198,146,58,0.6)"></div>
            </div>
        `;

        const marker = new maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(map);

        userMarkerRef.current = marker;
    }, []);

    // -- Geolocation: auto-center on load -------------------------------------

    const flyToUser = useCallback((lat: number, lng: number) => {
        setUserLocation({ lat, lng });
        const map = mapRef.current;
        if (map) {
            map.flyTo({
                center: [lng, lat],
                zoom: 9,
                speed: 1.8,
                curve: 1.3,
            });
            placeUserMarker(map, lat, lng);
        }
    }, [placeUserMarker]);

    const requestGeolocation = useCallback(() => {
        if (!navigator.geolocation) return;
        setGeolocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                flyToUser(pos.coords.latitude, pos.coords.longitude);
                setGeolocating(false);
            },
            () => {
                setGeolocating(false);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
        );
    }, [flyToUser]);

    // -- Initialize map -------------------------------------------------------

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        if (!document.getElementById('user-pulse-css')) {
            const style = document.createElement('style');
            style.id = 'user-pulse-css';
            style.textContent = `
                @keyframes user-pulse {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(3.5); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: MAP_STYLE,
            center: [-95.7, 37.0],
            zoom: 4,
            pitch: 0,
            bearing: 0,
            attributionControl: false,
            maxZoom: 16,
        });

        mapRef.current = map;

        map.on('load', () => {
            setMapReady(true);
            map.resize();
            setTimeout(() => map.resize(), 200);

            if (containerRef.current) {
                const ro = new ResizeObserver(() => map.resize());
                ro.observe(containerRef.current);
            }

            requestGeolocation();

            // Directory pins source
            map.addSource('directory-pins', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
                cluster: true,
                clusterMaxZoom: 12,
                clusterRadius: 55,
            });

            // Cluster circles
            map.addLayer({
                id: 'dir-clusters',
                type: 'circle',
                source: 'directory-pins',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': [
                        'step', ['get', 'point_count'],
                        '#C6923A',
                        10, '#9F7AEA',
                        50, '#EF4444',
                    ],
                    'circle-radius': [
                        'step', ['get', 'point_count'],
                        20, 10, 28, 50, 36,
                    ],
                    'circle-opacity': 0.85,
                    'circle-stroke-width': 3,
                    'circle-stroke-color': 'rgba(0,0,0,0.5)',
                },
            });

            // Cluster count labels
            map.addLayer({
                id: 'dir-cluster-count',
                type: 'symbol',
                source: 'directory-pins',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-size': 13,
                    'text-font': ['Open Sans Bold'],
                },
                paint: { 'text-color': '#fff' },
            });

            // Individual pins
            map.addLayer({
                id: 'dir-pins',
                type: 'circle',
                source: 'directory-pins',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': [
                        'case',
                        ['get', 'verified'], '#22C55E',
                        '#C6923A',
                    ],
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        4, 4,
                        10, 7,
                        14, 10,
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'rgba(0,0,0,0.6)',
                    'circle-opacity': 0.9,
                },
            });

            // Pin glow halo
            map.addLayer({
                id: 'dir-pin-glow',
                type: 'circle',
                source: 'directory-pins',
                filter: ['all', ['!', ['has', 'point_count']], ['get', 'verified']],
                paint: {
                    'circle-color': 'rgba(34, 197, 94, 0.15)',
                    'circle-radius': [
                        'interpolate', ['linear'], ['zoom'],
                        4, 8,
                        10, 14,
                        14, 20,
                    ],
                    'circle-blur': 1,
                },
            }, 'dir-pins');

            // Click on cluster -> zoom in
            map.on('click', 'dir-clusters', (e) => {
                const features = map.queryRenderedFeatures(e.point, { layers: ['dir-clusters'] });
                const clusterId = features?.[0]?.properties?.cluster_id;
                if (clusterId == null) return;
                (map.getSource('directory-pins') as maplibregl.GeoJSONSource).getClusterExpansionZoom(clusterId).then(zoom => {
                    map.easeTo({
                        center: (features[0].geometry as any).coordinates,
                        zoom,
                    });
                });
            });

            // Click on individual pin -> show card
            map.on('click', 'dir-pins', (e) => {
                const f = e.features?.[0];
                if (!f) return;
                const props = f.properties as any;
                const coords = (f.geometry as any).coordinates.slice();

                setSelectedPin({
                    id: props.id,
                    slug: props.slug || '',
                    name: props.name,
                    entity_type: props.entity_type || 'pilot_car_operator',
                    city: props.city,
                    state: props.state,
                    country: props.country,
                    claim_status: props.claim_status || 'unclaimed',
                    rank_score: Number(props.rank_score) || 0,
                    completeness: Number(props.completeness) || 0,
                    verified: props.verified === true || props.verified === 'true',
                    has_high_pole: props.has_high_pole === true || props.has_high_pole === 'true',
                    twic: props.twic === true || props.twic === 'true',
                    rating: Number(props.rating) || 0,
                    review_count: Number(props.review_count) || 0,
                    phone: props.phone || null,
                    lat: coords[1],
                    lng: coords[0],
                });

                setPanelOpen(true);
            });

            // Hover cursor
            map.on('mouseenter', 'dir-pins', () => { map.getCanvas().style.cursor = 'pointer'; });
            map.on('mouseleave', 'dir-pins', () => { map.getCanvas().style.cursor = ''; });
            map.on('mouseenter', 'dir-clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
            map.on('mouseleave', 'dir-clusters', () => { map.getCanvas().style.cursor = ''; });

            // Controls
            map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

            // Fetch initial data
            fetchPins();
        });

        return () => {
            if (userMarkerRef.current) userMarkerRef.current.remove();
            map.remove();
            mapRef.current = null;
        };
    }, [fetchPins, requestGeolocation, placeUserMarker]);

    // -- Search handler -------------------------------------------------------

    const handleSearch = useCallback(() => {
        fetchPins(activeCategory, searchQuery);
    }, [fetchPins, activeCategory, searchQuery]);

    const handleCategoryChange = useCallback((key: string) => {
        setActiveCategory(key);
        fetchPins(key, searchQuery);
    }, [fetchPins, searchQuery]);

    // -- Near Me --------------------------------------------------------------

    const handleNearMe = useCallback(() => {
        if (userLocation) {
            const map = mapRef.current;
            if (map) {
                map.flyTo({
                    center: [userLocation.lng, userLocation.lat],
                    zoom: 10,
                    speed: 1.5,
                });
            }
            return;
        }
        requestGeolocation();
    }, [userLocation, requestGeolocation]);

    // -- Filtered pins for list -----------------------------------------------

    const listPins = useMemo(() => {
        let result = [...pins];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.city?.toLowerCase().includes(q) ||
                p.state?.toLowerCase().includes(q)
            );
        }
        result.sort((a, b) => {
            if (a.verified !== b.verified) return a.verified ? -1 : 1;
            return (b.rank_score || 0) - (a.rank_score || 0);
        });
        return result.slice(0, 50);
    }, [pins, searchQuery]);

    // -- Render ---------------------------------------------------------------

    return (
        <div className="h-screen w-full bg-hc-bg text-hc-text font-display flex flex-col overflow-hidden">

            {/* COMMAND BAR (Search + Filters + Stats) */}
            <div className="flex-shrink-0 bg-[rgba(11,11,12,0.96)] backdrop-blur-xl border-b border-hc-border z-30">
                {/* Search Row */}
                <div className="flex items-center gap-2 px-4 py-3 md:px-6">
                    <Search className="w-5 h-5 text-hc-gold-500 flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search providers, cities, or services..."
                        className="flex-1 bg-transparent text-white text-sm placeholder:text-hc-subtle outline-none"
                    />
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(''); fetchPins(activeCategory); }} className="text-hc-subtle hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Near Me Button */}
                    <button
                        onClick={handleNearMe}
                        disabled={geolocating}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 border ${
                            userLocation
                                ? 'bg-hc-gold-500/15 border-hc-gold-500/40 text-hc-gold-400'
                                : 'bg-transparent border-hc-border text-hc-muted hover:text-white hover:border-hc-gold-500/40'
                        }`}
                    >
                        {geolocating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Crosshair className={`w-3.5 h-3.5 ${userLocation ? 'text-hc-gold-500 animate-pulse' : ''}`} />
                        )}
                        {geolocating ? 'Locating' : userLocation ? 'Centered' : 'Near Me'}
                    </button>

                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex-shrink-0"
                    >
                        Go
                    </button>
                </div>

                {/* Category + Stats Strip */}
                <div className="border-t border-hc-border/50 px-4 md:px-6 py-2 flex items-center justify-between gap-4">
                    {/* Categories */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = activeCategory === cat.key;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => handleCategoryChange(cat.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 ${isActive
                                        ? 'bg-hc-gold-500/15 text-hc-gold-400 border border-hc-gold-500/30'
                                        : 'text-hc-muted hover:text-white hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" style={{ color: isActive ? cat.color : undefined }} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-hc-gold-500" />
                            <span className="text-sm font-black text-white">{totalProviders.toLocaleString()}</span>
                            <span className="text-[10px] text-hc-subtle uppercase tracking-wider">Providers</span>
                        </div>
                        <div className="w-px h-4 bg-hc-border" />
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-hc-success" />
                            <span className="text-sm font-black text-hc-success">{verifiedCount}</span>
                            <span className="text-[10px] text-hc-subtle uppercase tracking-wider">Verified</span>
                        </div>
                        <div className="w-px h-4 bg-hc-border" />
                        <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-hc-gold-500" />
                            <span className="text-[10px] text-hc-subtle uppercase tracking-wider">Live Map</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN SPLIT VIEW */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>

                {/* LIST PANEL (Left on desktop, drawer on mobile) */}
                <div style={{ width: 420, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', background: '#0B0B0C' }}>
                    {/* Panel Header */}
                    <div className="border-b border-hc-border px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-hc-gold-500" />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                                {listPins.length} {activeCategory === 'all' ? 'Providers' : ENTITY_LABELS[activeCategory] || 'Results'}
                            </span>
                        </div>
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="flex items-center gap-1 text-[10px] text-hc-subtle hover:text-white uppercase tracking-wider transition-colors"
                        >
                            <Filter className="w-3 h-3" />
                            Filter
                        </button>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto scrollbar-none">
                        {listPins.length === 0 && !loading ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <MapPin className="w-8 h-8 text-hc-subtle mb-3" />
                                <p className="text-sm font-bold text-white mb-1">No providers found</p>
                                <p className="text-xs text-hc-subtle">Try adjusting your search or category filter</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-hc-border">
                                {listPins.map((pin) => {
                                    const trust = getRankBadge(pin.rank_score);
                                    return (
                                        <Link
                                            key={pin.id}
                                            href={`/place/${pin.slug || pin.id}`}
                                            className="group flex items-center gap-3 px-4 py-3 hover:bg-hc-surface transition-colors"
                                            onMouseEnter={() => {
                                                const map = mapRef.current;
                                                if (map && pin.lat && pin.lng) {
                                                    map.flyTo({ center: [pin.lng, pin.lat], zoom: Math.max(map.getZoom(), 10), duration: 800 });
                                                }
                                            }}
                                        >
                                            {/* Avatar */}
                                            <div className="w-10 h-10 bg-hc-elevated border border-hc-border rounded-xl flex items-center justify-center flex-shrink-0 group-hover:border-hc-gold-500/30 transition-colors">
                                                {React.createElement(getEntityIcon(pin.entity_type), { className: 'w-4 h-4 text-hc-gold-500' })}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white truncate group-hover:text-hc-gold-400 transition-colors">
                                                        {pin.name}
                                                    </span>
                                                    {pin.verified && (
                                                        <ShieldCheck className="w-3.5 h-3.5 text-hc-success flex-shrink-0" />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[11px] text-hc-subtle truncate">
                                                        {[pin.city, pin.state].filter(Boolean).join(', ')}
                                                    </span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-hc-elevated text-hc-gold-500">
                                                        {ENTITY_LABELS[pin.entity_type] || pin.entity_type}
                                                    </span>
                                                    {pin.rank_score > 0 && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: trust.color, backgroundColor: trust.bg }}>
                                                            {trust.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right side */}
                                            <div className="text-right flex-shrink-0">
                                                {pin.rating > 0 && (
                                                    <div className="flex items-center gap-0.5 text-xs font-bold text-white">
                                                        <Star className="w-3 h-3 text-hc-gold-500" />
                                                        {pin.rating.toFixed(1)}
                                                    </div>
                                                )}
                                                <ArrowRight className="w-3.5 h-3.5 text-hc-subtle mt-1 group-hover:text-hc-gold-500 transition-colors" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* MAP (Right on desktop, full on mobile) */}
                <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                    <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

                    {/* Mobile stats bar */}
                    <div className="md:hidden absolute top-3 left-3 z-20">
                        <div className="flex items-center gap-2 bg-[rgba(11,11,12,0.92)] backdrop-blur-xl border border-hc-border rounded-xl px-3 py-2 shadow-panel">
                            <Users className="w-3 h-3 text-hc-gold-500" />
                            <span className="text-xs font-black text-white">{totalProviders.toLocaleString()}</span>
                            <span className="text-[9px] text-hc-subtle uppercase">Providers</span>
                        </div>
                    </div>

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                            <div className="flex items-center gap-3 bg-[rgba(11,11,12,0.95)] backdrop-blur-xl border border-hc-border rounded-2xl px-6 py-4 shadow-panel">
                                <Loader2 className="w-5 h-5 text-hc-gold-500 animate-spin" />
                                <span className="text-sm font-bold text-white">Loading providers...</span>
                            </div>
                        </div>
                    )}

                    {/* Selected Pin Card (Rich Detail View) */}
                    {selectedPin && (
                        <div
                            className="absolute bottom-4 left-3 right-3 md:bottom-6 md:left-auto md:right-6 z-20 md:w-[440px]"
                            style={{ pointerEvents: 'auto' }}
                        >
                            <div className="bg-[rgba(11,11,12,0.97)] backdrop-blur-2xl border border-hc-border/60 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-slide-up">
                                {/* Close */}
                                <button
                                    onClick={() => setSelectedPin(null)}
                                    className="absolute top-3 right-3 z-10 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-hc-subtle" />
                                </button>

                                {/* Top accent bar */}
                                <div
                                    className="h-1 w-full"
                                    style={{
                                        background: selectedPin.verified
                                            ? 'linear-gradient(90deg, #22C55E, #10B981)'
                                            : 'linear-gradient(90deg, #C6923A, #F59E0B)',
                                    }}
                                />

                                <div className="p-5">
                                    {/* Header Row */}
                                    <div className="flex items-start gap-4 pr-8 mb-4">
                                        <div
                                            className="w-14 h-14 bg-hc-elevated border border-hc-border rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{
                                                borderColor: selectedPin.verified
                                                    ? 'rgba(34,197,94,0.3)'
                                                    : 'rgba(198,146,58,0.3)',
                                            }}
                                        >
                                            {React.createElement(getEntityIcon(selectedPin.entity_type), {
                                                className: 'w-6 h-6 text-hc-gold-500',
                                            })}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-lg font-black text-white truncate uppercase tracking-tight leading-tight">
                                                {selectedPin.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-hc-gold-500 flex-shrink-0" />
                                                <span className="text-xs text-hc-muted font-medium">
                                                    {[selectedPin.city, selectedPin.state, selectedPin.country?.toUpperCase()].filter(Boolean).join(', ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Badges Row */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        <span className="px-2.5 py-1 bg-hc-gold-500/10 text-hc-gold-500 border border-hc-gold-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                            {ENTITY_LABELS[selectedPin.entity_type] || selectedPin.entity_type}
                                        </span>
                                        {selectedPin.verified && (
                                            <span className="flex items-center gap-1 px-2.5 py-1 bg-hc-success/10 text-hc-success border border-hc-success/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                <ShieldCheck className="w-3 h-3" /> Verified
                                            </span>
                                        )}
                                        {selectedPin.rank_score > 0 && (
                                            <span
                                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                                                style={{
                                                    backgroundColor: getRankBadge(selectedPin.rank_score).bg,
                                                    color: getRankBadge(selectedPin.rank_score).color,
                                                    border: `1px solid ${getRankBadge(selectedPin.rank_score).color}33`,
                                                }}
                                            >
                                                <Award className="w-3 h-3" /> {getRankBadge(selectedPin.rank_score).label}
                                            </span>
                                        )}
                                        {selectedPin.twic && (
                                            <span className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                <ShieldCheck className="w-3 h-3" /> TWIC
                                            </span>
                                        )}
                                        {selectedPin.has_high_pole && (
                                            <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                <HcIconBridgeClearance size={12} /> High Pole
                                            </span>
                                        )}
                                        {(selectedPin.claim_status === 'claimed' || selectedPin.claim_status === 'verified') ? (
                                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                Claimed
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-white/5 text-hc-subtle border border-hc-border rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                Unclaimed
                                            </span>
                                        )}
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                        <div className="text-center p-2.5 bg-white/[0.03] border border-white/[0.04] rounded-xl">
                                            <div className="text-base font-black text-white">
                                                {selectedPin.completeness > 0 ? `${Math.round(selectedPin.completeness)}%` : '\u2014'}
                                            </div>
                                            <div className="text-[8px] text-hc-subtle uppercase tracking-widest font-bold mt-0.5">Profile</div>
                                        </div>
                                        <div className="text-center p-2.5 bg-white/[0.03] border border-white/[0.04] rounded-xl">
                                            <div className="text-base font-black text-white flex items-center justify-center gap-0.5">
                                                {selectedPin.rating > 0 ? selectedPin.rating.toFixed(1) : '\u2014'}
                                                {selectedPin.rating > 0 && <Star className="w-3 h-3 text-hc-gold-500" />}
                                            </div>
                                            <div className="text-[8px] text-hc-subtle uppercase tracking-widest font-bold mt-0.5">Rating</div>
                                        </div>
                                        <div className="text-center p-2.5 bg-white/[0.03] border border-white/[0.04] rounded-xl">
                                            <div className="text-base font-black text-white">{selectedPin.review_count || '\u2014'}</div>
                                            <div className="text-[8px] text-hc-subtle uppercase tracking-widest font-bold mt-0.5">Reviews</div>
                                        </div>
                                        <div className="text-center p-2.5 bg-white/[0.03] border border-white/[0.04] rounded-xl">
                                            <div className="text-base font-black text-white">
                                                {selectedPin.rank_score > 0 ? selectedPin.rank_score : '\u2014'}
                                            </div>
                                            <div className="text-[8px] text-hc-subtle uppercase tracking-widest font-bold mt-0.5">Rank</div>
                                        </div>
                                    </div>

                                    {/* Completeness Bar */}
                                    {selectedPin.completeness > 0 && (
                                        <div className="mb-4">
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min(100, selectedPin.completeness)}%`,
                                                        background:
                                                            selectedPin.completeness >= 80
                                                                ? 'linear-gradient(90deg, #22C55E, #10B981)'
                                                                : selectedPin.completeness >= 50
                                                                    ? 'linear-gradient(90deg, #C6923A, #F59E0B)'
                                                                    : 'linear-gradient(90deg, #EF4444, #F87171)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Phone (if available) */}
                                    {selectedPin.phone && (
                                        <a
                                            href={`tel:${selectedPin.phone}`}
                                            className="flex items-center gap-2 w-full py-2.5 mb-3 bg-white/[0.03] border border-white/[0.04] rounded-xl px-4 hover:bg-white/[0.06] transition-colors"
                                        >
                                            <Navigation className="w-4 h-4 text-hc-gold-500" />
                                            <span className="text-sm font-bold text-white">{selectedPin.phone}</span>
                                            <span className="text-[9px] text-hc-subtle uppercase tracking-wider ml-auto">Call</span>
                                        </a>
                                    )}

                                    {/* CTA */}
                                    <Link
                                        href={`/place/${selectedPin.slug || selectedPin.id}`}
                                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-black text-xs uppercase tracking-[0.15em] rounded-xl transition-all hover:shadow-[0_0_20px_rgba(198,146,58,0.3)] hover:-translate-y-0.5"
                                    >
                                        View Full Profile <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Drawer Toggle */}
                <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                    <button
                        onClick={() => setPanelOpen(!panelOpen)}
                        className="flex items-center gap-2 bg-hc-gold-500 text-black font-bold text-xs uppercase tracking-widest rounded-full px-5 py-3 shadow-dispatch"
                    >
                        {panelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        {panelOpen ? 'Show Map' : `${totalProviders} Providers`}
                    </button>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes user-pulse {
                    0% { transform: scale(1); opacity: 0.7; }
                    100% { transform: scale(3); opacity: 0; }
                }
                @keyframes slide-up {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
            `}</style>
        </div>
    );
}
