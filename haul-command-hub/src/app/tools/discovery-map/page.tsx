'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

interface DiscoveryZone {
    id: string; zone_name: string; zone_type: string; country_code: string;
    city: string; lat: number; lng: number; search_radius_miles: number;
    heavy_haul_score: number; escort_density_score: number;
}

interface IndustrialOrigin {
    id: string; name: string; company: string; origin_type: string;
    country_code: string; city: string; avg_loads_per_month: number;
}

const ZONE_ICONS: Record<string, string> = {
    logistics_hub: '🏭', port_area: '⚓', wind_farm: '🌬️', mining_site: '⛏️',
    industrial_origin: '🔧', interstate_junction: '🛣️', truck_stop_cluster: '🅿️',
    border_crossing: '🛂', metro_center: '🏙️', military_base: '🎖️',
};

const FLAG: Record<string, string> = {
    US: '🇺🇸', CA: '🇨🇦', AU: '🇦🇺', GB: '🇬🇧', NZ: '🇳🇿', ZA: '🇿🇦', DE: '🇩🇪', NL: '🇳🇱', AE: '🇦🇪', BR: '🇧🇷',
    BE: '🇧🇪', SA: '🇸🇦', SG: '🇸🇬', TH: '🇹🇭', IN: '🇮🇳', KR: '🇰🇷',
};

export default function AvailabilityMapPage() {
    const [zones, setZones] = useState<DiscoveryZone[]>([]);
    const [origins, setOrigins] = useState<IndustrialOrigin[]>([]);
    const [viewMode, setViewMode] = useState<'broker' | 'operator'>('broker');
    const [selectedCountry, setSelectedCountry] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            supabase.from('hc_discovery_zones').select('*').eq('is_active', true).order('heavy_haul_score', { ascending: false }),
            supabase.from('hc_industrial_origins').select('*').eq('is_active', true).order('avg_loads_per_month', { ascending: false }),
        ]).then(([z, o]) => {
            setZones(z.data || []);
            setOrigins(o.data || []);
            setLoading(false);
        });
    }, []);

    const countries = ['ALL', ...Array.from(new Set(zones.map(z => z.country_code))).sort()];
    const filtered = selectedCountry === 'ALL' ? zones : zones.filter(z => z.country_code === selectedCountry);
    const filteredOrigins = selectedCountry === 'ALL' ? origins : origins.filter(o => o.country_code === selectedCountry);

    return (
        <><Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 py-16">
                <header className="mb-12">
                    <div className="flex items-center space-x-4 mb-4">
                        <span className="bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded italic">LIVE MAP</span>
                        <span className="bg-accent text-black text-[10px] font-black px-2 py-0.5 rounded italic">{zones.length} ZONES</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">
                        GLOBAL ESCORT <span className="text-accent underline decoration-4 underline-offset-4">DISCOVERY MAP</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-3xl mt-4">
                        {viewMode === 'broker'
                            ? 'Find escort operators near your route. Freight hubs, corridors, and industrial origins mapped worldwide.'
                            : 'See where oversize loads originate. Position yourself near high-demand corridors and industrial hubs.'}
                    </p>
                </header>

                {/* View Toggle */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex">
                        <button onClick={() => setViewMode('broker')}
                            className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${viewMode === 'broker' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}`}>
                            🏢 Broker View
                        </button>
                        <button onClick={() => setViewMode('operator')}
                            className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${viewMode === 'operator' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}`}>
                            🚗 Operator View
                        </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {countries.map(c => (
                            <button key={c} onClick={() => setSelectedCountry(c)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCountry === c ? 'bg-accent text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}>{c === 'ALL' ? 'All Countries' : `${FLAG[c] || '🌍'} ${c}`}</button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Loading Discovery Map...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Zone List */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-white font-black text-xl">{viewMode === 'broker' ? 'Freight Hubs & Corridors' : 'Operator Demand Zones'}</p>
                                <span className="text-gray-500 text-xs font-bold">{filtered.length} zones</span>
                            </div>

                            {filtered.map(zone => (
                                <div key={zone.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-accent/30 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-3xl">{ZONE_ICONS[zone.zone_type] || '📍'}</span>
                                            <div>
                                                <h3 className="text-white font-black text-lg">{zone.zone_name}</h3>
                                                <p className="text-gray-500 text-xs">{FLAG[zone.country_code] || ''} {zone.city} • {zone.zone_type.replace(/_/g, ' ')} • {zone.search_radius_miles}mi radius</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 font-black uppercase">Demand Score</p>
                                            <p className={`text-2xl font-black ${zone.heavy_haul_score >= 80 ? 'text-red-400' : zone.heavy_haul_score >= 60 ? 'text-accent' : 'text-gray-400'}`}>
                                                {zone.heavy_haul_score}
                                            </p>
                                        </div>
                                    </div>
                                    {viewMode === 'broker' && (
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
                                            <a href={`/directory?lat=${zone.lat}&lng=${zone.lng}`}
                                                className="text-accent text-xs font-black hover:underline">📍 Find Escorts Near Here →</a>
                                            <a href="/tools/escort-calculator"
                                                className="text-gray-400 text-xs font-bold hover:text-white">🧮 Check Requirements</a>
                                        </div>
                                    )}
                                    {viewMode === 'operator' && (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-6">
                                                <div className="flex-grow">
                                                    <div className="flex justify-between text-[10px] text-gray-500 font-black mb-1">
                                                        <span>DEMAND INTENSITY</span><span>{zone.heavy_haul_score}/100</span>
                                                    </div>
                                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${zone.heavy_haul_score}%` }}></div>
                                                    </div>
                                                </div>
                                                <a href="/tools/compliance-card" className="text-accent text-xs font-black hover:underline whitespace-nowrap">
                                                    Get Compliance Card →
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Sidebar: Industrial Origins */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 sticky top-8">
                                <h3 className="text-white font-black text-lg mb-6">🏭 Industrial Origins</h3>
                                <p className="text-gray-500 text-xs mb-4">Where oversize loads start. Position near these for maximum demand.</p>
                                <div className="space-y-4">
                                    {filteredOrigins.slice(0, 10).map(o => (
                                        <div key={o.id} className="border-b border-white/5 pb-3">
                                            <p className="text-white font-bold text-sm">{o.name}</p>
                                            <p className="text-gray-500 text-xs">{o.company} • {o.origin_type.replace(/_/g, ' ')}</p>
                                            <p className="text-accent text-xs font-bold mt-1">~{o.avg_loads_per_month} loads/month</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="bg-gradient-to-b from-accent/10 to-transparent border border-accent/20 rounded-[32px] p-8">
                                <h3 className="text-white font-black text-lg mb-3">📍 Claim Your Territory</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    Be the first listed escort operator in your zone. High-demand corridors fill fast.
                                </p>
                                <a href="/directory"
                                    className="bg-accent text-black px-6 py-3 rounded-xl font-black text-sm block text-center hover:bg-white transition-all">
                                    CLAIM YOUR PROFILE — FREE
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
