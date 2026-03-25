'use client';

import { useState, useMemo } from 'react';
import ToolResultCTA from '@/components/hc/ToolResultCTA';
import ToolDisclaimer from '@/components/hc/ToolDisclaimer';
import hotelsRaw from '@/data/trucker_hotels.json';
import chainsRaw from '@/data/hotel_chains.json';
import truckStopsRaw from '@/data/truck_stops.json';

/* ── Types ── */
interface Hotel {
  state: string; city: string; name: string; phone: string; pilotRate: number | null;
  address: string; amenities: string[]; nearbyHighways: string[]; nearDining: boolean;
  nearShopping: boolean; chain: string | null; truckParking: boolean; laundry: boolean;
}

interface Chain {
  name: string; phone: string; url: string; pilotFriendly: boolean;
}

interface TruckStop {
  state: string; city: string; highway: string; name: string;
  wifi: boolean; parking: number; showers: boolean; scales: boolean;
}

const hotels = hotelsRaw as Hotel[];
const chains = chainsRaw as Chain[];
const truckStops = truckStopsRaw as TruckStop[];

const ALL_HOTEL_STATES = Array.from(new Set(hotels.map(h => h.state))).sort();
const ALL_TS_STATES = Array.from(new Set(truckStops.map(t => t.state))).sort();
const ALL_STATES = Array.from(new Set([...ALL_HOTEL_STATES, ...ALL_TS_STATES])).sort();
const ALL_HIGHWAYS = Array.from(new Set([...hotels.flatMap(h => h.nearbyHighways), ...truckStops.map(t => t.highway)])).sort();

type TabType = 'hotels' | 'truckstops' | 'chains';

export default function HotelFinderClient() {
  const [activeTab, setActiveTab] = useState<TabType>('hotels');
  const [stateFilter, setStateFilter] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [highwayFilter, setHighwayFilter] = useState('');
  // Hotel-specific filters
  const [truckParkingOnly, setTruckParkingOnly] = useState(false);
  const [petFriendlyOnly, setPetFriendlyOnly] = useState(false);
  const [pilotRateOnly, setPilotRateOnly] = useState(false);
  // Truck stop-specific filters
  const [showersOnly, setShowersOnly] = useState(false);
  const [scalesOnly, setScalesOnly] = useState(false);
  const [wifiOnly, setWifiOnly] = useState(false);

  /* ── Hotel Filtering ── */
  const filteredHotels = useMemo(() => {
    let results = [...hotels];
    if (stateFilter) results = results.filter(h => h.state === stateFilter);
    if (citySearch.trim()) {
      const q = citySearch.trim().toLowerCase();
      results = results.filter(h => h.city.toLowerCase().includes(q));
    }
    if (highwayFilter) results = results.filter(h => h.nearbyHighways.includes(highwayFilter));
    if (truckParkingOnly) results = results.filter(h => h.truckParking);
    if (petFriendlyOnly) results = results.filter(h => h.amenities.some(a => a.toLowerCase().includes('pet')));
    if (pilotRateOnly) results = results.filter(h => h.pilotRate !== null);
    return results;
  }, [stateFilter, citySearch, highwayFilter, truckParkingOnly, petFriendlyOnly, pilotRateOnly]);

  const hotelStateGroups = useMemo(() => {
    const groups: Record<string, Hotel[]> = {};
    for (const h of filteredHotels) { if (!groups[h.state]) groups[h.state] = []; groups[h.state].push(h); }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredHotels]);

  /* ── Truck Stop Filtering ── */
  const filteredStops = useMemo(() => {
    let results = [...truckStops];
    if (stateFilter) results = results.filter(t => t.state === stateFilter);
    if (citySearch.trim()) {
      const q = citySearch.trim().toLowerCase();
      results = results.filter(t => t.city.toLowerCase().includes(q));
    }
    if (highwayFilter) results = results.filter(t => t.highway === highwayFilter);
    if (showersOnly) results = results.filter(t => t.showers);
    if (scalesOnly) results = results.filter(t => t.scales);
    if (wifiOnly) results = results.filter(t => t.wifi);
    return results;
  }, [stateFilter, citySearch, highwayFilter, showersOnly, scalesOnly, wifiOnly]);

  const stopStateGroups = useMemo(() => {
    const groups: Record<string, TruckStop[]> = {};
    for (const t of filteredStops) { if (!groups[t.state]) groups[t.state] = []; groups[t.state].push(t); }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredStops]);

  const tabs: { id: TabType; label: string; icon: string; count: number }[] = [
    { id: 'hotels', label: 'Hotels', icon: '🏨', count: hotels.length },
    { id: 'truckstops', label: 'Truck Stops', icon: '⛽', count: truckStops.length },
    { id: 'chains', label: 'Hotel Chains', icon: '🔗', count: chains.length },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Tab Navigation ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
              activeTab === tab.id
                ? 'bg-accent/20 border-accent/40 text-accent shadow-[0_0_15px_rgba(245,159,10,0.1)]'
                : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/20 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            <span className={`text-[10px] ml-1 px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-accent/30 text-accent' : 'bg-white/[0.06] text-gray-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ─── Search & Filters (shared for hotels and truck stops) ─── */}
      {activeTab !== 'chains' && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">State</label>
              <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors">
                <option value="">All States</option>
                {ALL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">City</label>
              <input type="text" placeholder="Search city..." value={citySearch} onChange={e => setCitySearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Highway</label>
              <select value={highwayFilter} onChange={e => setHighwayFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors">
                <option value="">All Highways</option>
                {ALL_HIGHWAYS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            {activeTab === 'hotels' && (
              <>
                <FilterPill active={truckParkingOnly} onClick={() => setTruckParkingOnly(v => !v)} icon="🚛" label="Truck Parking" />
                <FilterPill active={petFriendlyOnly} onClick={() => setPetFriendlyOnly(v => !v)} icon="🐕" label="Pet Friendly" />
                <FilterPill active={pilotRateOnly} onClick={() => setPilotRateOnly(v => !v)} icon="💲" label="Pilot Car Rate" color="green" />
              </>
            )}
            {activeTab === 'truckstops' && (
              <>
                <FilterPill active={showersOnly} onClick={() => setShowersOnly(v => !v)} icon="🚿" label="Showers" />
                <FilterPill active={scalesOnly} onClick={() => setScalesOnly(v => !v)} icon="⚖️" label="Scales" />
                <FilterPill active={wifiOnly} onClick={() => setWifiOnly(v => !v)} icon="📶" label="WiFi" />
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Stats Bar ─── */}
      {activeTab === 'hotels' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={filteredHotels.length} label="Hotels Found" />
          <StatCard value={filteredHotels.filter(h => h.pilotRate !== null).length} label="With Pilot Rates" color="accent" />
          <StatCard value={filteredHotels.filter(h => h.truckParking).length} label="Truck Parking" color="green" />
          <StatCard value={new Set(filteredHotels.map(h => h.state)).size} label="States" color="blue" />
        </div>
      )}
      {activeTab === 'truckstops' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={filteredStops.length} label="Truck Stops" />
          <StatCard value={filteredStops.filter(t => t.showers).length} label="With Showers" color="blue" />
          <StatCard value={filteredStops.filter(t => t.scales).length} label="With Scales" color="green" />
          <StatCard value={filteredStops.reduce((sum, t) => sum + t.parking, 0).toLocaleString()} label="Total Parking Spots" color="accent" />
        </div>
      )}

      {/* ─── HOTELS TAB ─── */}
      {activeTab === 'hotels' && (
        <>
          {filteredHotels.length === 0 ? (
            <EmptyState icon="🏨" title="No Hotels Found" desc="Try adjusting your filters or search a different state." />
          ) : (
            hotelStateGroups.map(([state, stateHotels]) => (
              <div key={state} className="space-y-3">
                <StateHeader state={state} count={stateHotels.length} unit="hotel" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {stateHotels.map((hotel, i) => (
                    <div key={`${hotel.state}-${hotel.city}-${i}`}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <h3 className="text-white font-bold text-sm truncate group-hover:text-accent transition-colors">{hotel.name}</h3>
                          <p className="text-gray-500 text-xs mt-0.5">{hotel.city}, {hotel.state} · {hotel.address}</p>
                        </div>
                        {hotel.pilotRate && (
                          <div className="flex-shrink-0 ml-3 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5 text-center">
                            <p className="text-green-400 font-black text-lg leading-none">${hotel.pilotRate}</p>
                            <p className="text-green-400/60 text-[9px] font-bold">PILOT RATE</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {hotel.nearbyHighways.map(hw => (
                          <span key={hw} className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">{hw}</span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {hotel.truckParking && <AmenityBadge label="🚛 Truck Parking" highlight />}
                        {hotel.amenities.map((a, idx) => <AmenityBadge key={idx} label={a} />)}
                        {hotel.nearDining && <AmenityBadge label="🍽️ Near Dining" />}
                        {hotel.nearShopping && <AmenityBadge label="🛒 Near Shopping" />}
                      </div>
                      <div className="flex items-center justify-between">
                        <a href={`tel:${hotel.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 text-accent text-sm font-bold hover:underline">
                          📞 {hotel.phone}
                        </a>
                        {hotel.chain && <span className="text-gray-600 text-[10px] font-medium">{hotel.chain}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ─── TRUCK STOPS TAB ─── */}
      {activeTab === 'truckstops' && (
        <>
          {filteredStops.length === 0 ? (
            <EmptyState icon="⛽" title="No Truck Stops Found" desc="Try adjusting your filters or search a different state." />
          ) : (
            stopStateGroups.map(([state, stateStops]) => (
              <div key={state} className="space-y-3">
                <StateHeader state={state} count={stateStops.length} unit="stop" />
                {/* Table format for truck stops — superior to competitor's plain text */}
                <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                        <th className="text-left text-gray-400 font-bold text-xs uppercase py-3 px-4">City</th>
                        <th className="text-left text-gray-400 font-bold text-xs uppercase py-3 px-3">Highway</th>
                        <th className="text-left text-gray-400 font-bold text-xs uppercase py-3 px-3">Name</th>
                        <th className="text-center text-gray-400 font-bold text-xs uppercase py-3 px-2">📶</th>
                        <th className="text-center text-gray-400 font-bold text-xs uppercase py-3 px-2">🅿️</th>
                        <th className="text-center text-gray-400 font-bold text-xs uppercase py-3 px-2">🚿</th>
                        <th className="text-center text-gray-400 font-bold text-xs uppercase py-3 px-2">⚖️</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stateStops.map((stop, i) => (
                        <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-4 text-white text-sm font-medium">{stop.city}</td>
                          <td className="py-2.5 px-3">
                            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">{stop.highway}</span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-300 text-sm">{stop.name}</td>
                          <td className="py-2.5 px-2 text-center">{stop.wifi ? <span className="text-green-400">✓</span> : <span className="text-gray-700">—</span>}</td>
                          <td className="py-2.5 px-2 text-center text-accent font-bold text-xs">{stop.parking}</td>
                          <td className="py-2.5 px-2 text-center">{stop.showers ? <span className="text-green-400">✓</span> : <span className="text-gray-700">—</span>}</td>
                          <td className="py-2.5 px-2 text-center">{stop.scales ? <span className="text-green-400">✓</span> : <span className="text-gray-700">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ─── CHAINS TAB ─── */}
      {activeTab === 'chains' && (
        <div className="space-y-4">
          <p className="text-gray-500 text-xs">Major hotel chains with trucker and pilot car programs. Call for special rates.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chains.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noopener noreferrer"
                className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-accent/30 hover:bg-accent/[0.03] transition-all flex items-center gap-3">
                <div className="flex-grow min-w-0">
                  <p className="text-white text-sm font-bold truncate group-hover:text-accent transition-colors">{c.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{c.phone}</p>
                </div>
                {c.pilotFriendly && (
                  <span className="flex-shrink-0 bg-green-500/10 text-green-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-green-500/20">PILOT OK</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── CTA ─── */}
      <ToolResultCTA
        context="Found a stop near your route? Now find pilot car escorts in the area."
        primary={{ label: "Find Escorts Nearby", href: "/directory", icon: "🔍" }}
        secondary={{ label: "Plan Your Route", href: "/tools/route-planner", icon: "🗺️" }}
      />

      <ToolDisclaimer
        dataSource="Operator submissions, public listing data, and truck stop directories"
        jurisdiction="Rates, availability, and amenities subject to change — verify with property"
      />
    </div>
  );
}

/* ── Reusable Sub-Components ── */

function FilterPill({ active, onClick, icon, label, color = 'accent' }: {
  active: boolean; onClick: () => void; icon: string; label: string; color?: string;
}) {
  const colorClass = color === 'green'
    ? (active ? 'bg-green-500/20 border-green-500/40 text-green-400' : '')
    : (active ? 'bg-accent/20 border-accent/40 text-accent' : '');
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
        active ? colorClass : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/20'
      }`}>
      {icon} {label}
    </button>
  );
}

function StatCard({ value, label, color }: { value: number | string; label: string; color?: string }) {
  const colorClass = color === 'accent' ? 'text-accent' : color === 'green' ? 'text-green-400' : color === 'blue' ? 'text-blue-400' : 'text-white';
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
      <p className={`text-2xl font-black ${colorClass}`}>{value}</p>
      <p className="text-gray-500 text-xs font-bold uppercase">{label}</p>
    </div>
  );
}

function StateHeader({ state, count, unit }: { state: string; count: number; unit: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-accent/20 text-accent font-black text-sm px-3 py-1 rounded-lg border border-accent/30">{state}</div>
      <span className="text-gray-500 text-xs font-bold">{count} {unit}{count > 1 ? 's' : ''}</span>
      <div className="flex-grow border-t border-white/[0.04]" />
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center">
      <span className="text-4xl mb-4 block">{icon}</span>
      <p className="text-white font-bold text-lg mb-1">{title}</p>
      <p className="text-gray-500 text-sm">{desc}</p>
    </div>
  );
}

function AmenityBadge({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <span className={`text-[10px] font-${highlight ? 'bold' : 'medium'} px-2 py-0.5 rounded border ${
      highlight ? 'bg-accent/10 text-accent border-accent/20' : 'bg-white/[0.04] text-gray-400 border-white/[0.06]'
    }`}>{label}</span>
  );
}
