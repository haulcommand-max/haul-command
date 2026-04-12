'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface DiscoveryZone { id: string; zone_name: string; zone_type: string; country_code: string; city: string; lat: number; lng: number; search_radius_miles: number; heavy_haul_score: number; }
interface IndustrialOrigin { id: string; name: string; company: string; origin_type: string; country_code: string; city: string; avg_loads_per_month: number; }

const ZONE_ICONS: Record<string, string> = { logistics_hub: 'ðŸ­', port_area: 'âš“', wind_farm: 'ðŸŒ¬ï¸', mining_site: 'â›ï¸', industrial_origin: 'ðŸ”§', interstate_junction: 'ðŸ›£ï¸', truck_stop_cluster: 'ðŸ…¿ï¸', border_crossing: 'ðŸ›‚', metro_center: 'ðŸ™ï¸', military_base: 'ðŸŽ–ï¸' };
const FLAG: Record<string, string> = { US: 'ðŸ‡ºðŸ‡¸', CA: 'ðŸ‡¨ðŸ‡¦', AU: 'ðŸ‡¦ðŸ‡º', GB: 'ðŸ‡¬ðŸ‡§', NZ: 'ðŸ‡³ðŸ‡¿', ZA: 'ðŸ‡¿ðŸ‡¦', DE: 'ðŸ‡©ðŸ‡ª', NL: 'ðŸ‡³ðŸ‡±', AE: 'ðŸ‡¦ðŸ‡ª', BR: 'ðŸ‡§ðŸ‡·', BE: 'ðŸ‡§ðŸ‡ª', SA: 'ðŸ‡¸ðŸ‡¦', SG: 'ðŸ‡¸ðŸ‡¬', TH: 'ðŸ‡¹ðŸ‡­', IN: 'ðŸ‡®ðŸ‡³', KR: 'ðŸ‡°ðŸ‡·' };

export default function AvailabilityMapPage() {
    const supabase = createClient();
    const [zones, setZones] = useState<DiscoveryZone[]>([]);
    const [origins, setOrigins] = useState<IndustrialOrigin[]>([]);
    const [viewMode, setViewMode] = useState<'broker' | 'operator'>('broker');
    const [selectedCountry, setSelectedCountry] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            supabase.from('hc_discovery_zones').select('*').eq('is_active', true).order('heavy_haul_score', { ascending: false }),
            supabase.from('hc_industrial_origins').select('*').eq('is_active', true).order('avg_loads_per_month', { ascending: false }),
        ]).then(([z, o]) => { setZones(z.data || []); setOrigins(o.data || []); setLoading(false); });
    }, []);

    const countries = ['ALL', ...Array.from(new Set(zones.map(z => z.country_code))).sort()];
    const filtered = selectedCountry === 'ALL' ? zones : zones.filter(z => z.country_code === selectedCountry);
    const filteredOrigins = selectedCountry === 'ALL' ? origins : origins.filter(o => o.country_code === selectedCountry);

    return (
        <main className="flex-grow max-w-7xl mx-auto px-4 py-12 sm:py-16">
            <header className="mb-8 sm:mb-12">
                <div className="flex items-center space-x-4 mb-4"><span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded italic">LIVE MAP</span><span className="bg-[var(--color-accent)] text-white text-[10px] font-black px-2 py-0.5 rounded italic">{zones.length} ZONES</span></div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white italic tracking-tighter">GLOBAL ESCORT <span className="text-[var(--color-accent)] underline decoration-4 underline-offset-4">DISCOVERY MAP</span></h1>
                <p className="text-gray-400 text-base sm:text-lg max-w-3xl mt-4">{viewMode === 'broker' ? 'Find escort operators near your route. Freight hubs and industrial origins mapped worldwide.' : 'See where oversize loads originate. Position near high-demand corridors.'}</p>
            </header>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex">
                    <button aria-label="Interactive Button" onClick={() => setViewMode('broker')} className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-black transition-all ${viewMode === 'broker' ? 'bg-[var(--color-accent)] text-white' : 'text-gray-400 hover:text-white'}`}>ðŸ¢ Broker</button>
                    <button aria-label="Interactive Button" onClick={() => setViewMode('operator')} className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-black transition-all ${viewMode === 'operator' ? 'bg-[var(--color-accent)] text-white' : 'text-gray-400 hover:text-white'}`}>ðŸš— Operator</button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">{countries.map(c => (<button aria-label="Interactive Button" key={c} onClick={() => setSelectedCountry(c)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCountry === c ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{c === 'ALL' ? 'All' : `${FLAG[c] || 'ðŸŒ'} ${c}`}</button>))}</div>
            </div>
            {loading ? (
                <div className="text-center py-20"><div className="w-16 h-16 border-4 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] rounded-full animate-spin mx-auto mb-6"></div><p className="text-gray-500 font-black uppercase tracking-widest text-sm">Loading Discovery Map...</p></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between mb-4"><p className="text-white font-black text-xl">{viewMode === 'broker' ? 'Freight Hubs & Corridors' : 'Operator Demand Zones'}</p><span className="text-gray-500 text-xs font-bold">{filtered.length} zones</span></div>
                        {filtered.map(zone => (
                            <div key={zone.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-[var(--color-accent)]/30 transition-all">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3 sm:gap-4"><span className="text-2xl sm:text-3xl">{ZONE_ICONS[zone.zone_type] || 'ðŸ“'}</span><div><h3 className="text-white font-black text-base sm:text-lg">{zone.zone_name}</h3><p className="text-gray-500 text-xs">{FLAG[zone.country_code] || ''} {zone.city} â€¢ {zone.zone_type.replace(/_/g, ' ')} â€¢ {zone.search_radius_miles}mi</p></div></div>
                                    <div className="text-right"><p className="text-[10px] text-gray-500 font-black uppercase">Demand</p><p className={`text-2xl font-black ${zone.heavy_haul_score >= 80 ? 'text-red-400' : zone.heavy_haul_score >= 60 ? 'text-[var(--color-accent)]' : 'text-gray-400'}`}>{zone.heavy_haul_score}</p></div>
                                </div>
                                {viewMode === 'broker' && <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4"><a href={`/directory?lat=${zone.lat}&lng=${zone.lng}`} className="text-[var(--color-accent)] text-xs font-black hover:underline">ðŸ“ Find Escorts â†’</a><a href="/tools/escort-calculator" className="text-gray-400 text-xs font-bold hover:text-white">ðŸ§® Requirements</a></div>}
                                {viewMode === 'operator' && <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 sm:gap-6"><div className="flex-grow"><div className="flex justify-between text-[10px] text-gray-500 font-black mb-1"><span>DEMAND</span><span>{zone.heavy_haul_score}/100</span></div><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[var(--color-accent)] rounded-full" style={{ width: `${zone.heavy_haul_score}%` }}></div></div></div><a href="/tools/compliance-card" className="text-[var(--color-accent)] text-xs font-black hover:underline whitespace-nowrap">Get Card â†’</a></div>}
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 sticky top-8">
                            <h3 className="text-white font-black text-lg mb-6">ðŸ­ Industrial Origins</h3>
                            <p className="text-gray-500 text-xs mb-4">Where oversize loads start. Position near these for maximum demand.</p>
                            <div className="space-y-4">{filteredOrigins.slice(0, 10).map(o => (<div key={o.id} className="border-b border-white/5 pb-3"><p className="text-white font-bold text-sm">{o.name}</p><p className="text-gray-500 text-xs">{o.company} â€¢ {o.origin_type.replace(/_/g, ' ')}</p><p className="text-[var(--color-accent)] text-xs font-bold mt-1">~{o.avg_loads_per_month} loads/month</p></div>))}</div>
                        </div>
                        <div className="bg-gradient-to-b from-[var(--color-accent)]/10 to-transparent border border-[var(--color-accent)]/20 rounded-3xl p-6 sm:p-8">
                            <h3 className="text-white font-black text-lg mb-3">ðŸ“ Claim Your Territory</h3>
                            <p className="text-gray-400 text-sm mb-4">Be the first listed escort operator in your zone.</p>
                            <a href="/claim" className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-xl font-black text-sm block text-center hover:bg-[#121212] transition-all">CLAIM YOUR PROFILE â€” FREE</a>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}