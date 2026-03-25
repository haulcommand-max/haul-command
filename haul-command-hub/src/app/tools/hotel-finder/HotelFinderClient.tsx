'use client';

import { useState, useMemo } from 'react';
import ToolResultCTA from '@/components/hc/ToolResultCTA';
import ToolDisclaimer from '@/components/hc/ToolDisclaimer';
import hotelsRaw from '@/data/trucker_hotels.json';
import chainsRaw from '@/data/hotel_chains.json';

interface Hotel {
  state: string;
  city: string;
  name: string;
  phone: string;
  pilotRate: number | null;
  address: string;
  amenities: string[];
  nearbyHighways: string[];
  nearDining: boolean;
  nearShopping: boolean;
  chain: string | null;
  truckParking: boolean;
  laundry: boolean;
}

interface Chain {
  name: string;
  phone: string;
  url: string;
  pilotFriendly: boolean;
}

const hotels = hotelsRaw as Hotel[];
const chains = chainsRaw as Chain[];

const ALL_STATES = Array.from(new Set(hotels.map(h => h.state))).sort();
const ALL_HIGHWAYS = Array.from(new Set(hotels.flatMap(h => h.nearbyHighways))).sort();

export default function HotelFinderClient() {
  const [stateFilter, setStateFilter] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [highwayFilter, setHighwayFilter] = useState('');
  const [truckParkingOnly, setTruckParkingOnly] = useState(false);
  const [petFriendlyOnly, setPetFriendlyOnly] = useState(false);
  const [pilotRateOnly, setPilotRateOnly] = useState(false);
  const [showChains, setShowChains] = useState(false);

  const filtered = useMemo(() => {
    let results = [...hotels];

    if (stateFilter) {
      results = results.filter(h => h.state === stateFilter);
    }

    if (citySearch.trim()) {
      const q = citySearch.trim().toLowerCase();
      results = results.filter(h => h.city.toLowerCase().includes(q));
    }

    if (highwayFilter) {
      results = results.filter(h => h.nearbyHighways.includes(highwayFilter));
    }

    if (truckParkingOnly) {
      results = results.filter(h => h.truckParking);
    }

    if (petFriendlyOnly) {
      results = results.filter(h => h.amenities.some(a => a.toLowerCase().includes('pet')));
    }

    if (pilotRateOnly) {
      results = results.filter(h => h.pilotRate !== null);
    }

    return results;
  }, [stateFilter, citySearch, highwayFilter, truckParkingOnly, petFriendlyOnly, pilotRateOnly]);

  const stateGroups = useMemo(() => {
    const groups: Record<string, Hotel[]> = {};
    for (const h of filtered) {
      if (!groups[h.state]) groups[h.state] = [];
      groups[h.state].push(h);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="space-y-8">
      {/* ─── Search & Filters ─── */}
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* State */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">State</label>
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">All States</option>
              {ALL_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">City</label>
            <input
              type="text"
              placeholder="Search city..."
              value={citySearch}
              onChange={e => setCitySearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Highway */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Near Highway</label>
            <select
              value={highwayFilter}
              onChange={e => setHighwayFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">All Highways</option>
              {ALL_HIGHWAYS.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setTruckParkingOnly(v => !v)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              truckParkingOnly
                ? 'bg-accent/20 border-accent/40 text-accent'
                : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/20'
            }`}
          >
            🚛 Truck Parking
          </button>
          <button
            onClick={() => setPetFriendlyOnly(v => !v)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              petFriendlyOnly
                ? 'bg-accent/20 border-accent/40 text-accent'
                : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/20'
            }`}
          >
            🐕 Pet Friendly
          </button>
          <button
            onClick={() => setPilotRateOnly(v => !v)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              pilotRateOnly
                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/20'
            }`}
          >
            💲 Pilot Car Rate
          </button>
          <div className="ml-auto">
            <button
              onClick={() => setShowChains(v => !v)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                showChains
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : 'bg-white/[0.03] border-white/[0.08] text-gray-400 hover:border-white/20'
              }`}
            >
              🏨 {showChains ? 'Hide' : 'Show'} Hotel Chains
            </button>
          </div>
        </div>
      </div>

      {/* ─── Stats Bar ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-white">{filtered.length}</p>
          <p className="text-gray-500 text-xs font-bold uppercase">Hotels Found</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-accent">
            {filtered.filter(h => h.pilotRate !== null).length}
          </p>
          <p className="text-gray-500 text-xs font-bold uppercase">With Pilot Rates</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-green-400">
            {filtered.filter(h => h.truckParking).length}
          </p>
          <p className="text-gray-500 text-xs font-bold uppercase">Truck Parking</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-blue-400">
            {new Set(filtered.map(h => h.state)).size}
          </p>
          <p className="text-gray-500 text-xs font-bold uppercase">States</p>
        </div>
      </div>

      {/* ─── Hotel Chain Directory ─── */}
      {showChains && (
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <h2 className="text-white font-black text-lg tracking-tight mb-1">🏨 National Hotel Chains</h2>
          <p className="text-gray-500 text-xs mb-5">Major chains with trucker and pilot car programs. Call for special rates.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chains.map((c, i) => (
              <a
                key={i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-accent/30 hover:bg-accent/[0.03] transition-all flex items-center gap-3"
              >
                <div className="flex-grow min-w-0">
                  <p className="text-white text-sm font-bold truncate group-hover:text-accent transition-colors">{c.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{c.phone}</p>
                </div>
                {c.pilotFriendly && (
                  <span className="flex-shrink-0 bg-green-500/10 text-green-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-green-500/20">
                    PILOT OK
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── Hotel Results ─── */}
      {filtered.length === 0 ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center">
          <span className="text-4xl mb-4 block">🏨</span>
          <p className="text-white font-bold text-lg mb-1">No Hotels Found</p>
          <p className="text-gray-500 text-sm">Try adjusting your filters or search a different state.</p>
        </div>
      ) : (
        stateGroups.map(([state, stateHotels]) => (
          <div key={state} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-accent/20 text-accent font-black text-sm px-3 py-1 rounded-lg border border-accent/30">
                {state}
              </div>
              <span className="text-gray-500 text-xs font-bold">
                {stateHotels.length} hotel{stateHotels.length > 1 ? 's' : ''}
              </span>
              <div className="flex-grow border-t border-white/[0.04]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stateHotels.map((hotel, i) => (
                <div
                  key={`${hotel.state}-${hotel.city}-${i}`}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="text-white font-bold text-sm truncate group-hover:text-accent transition-colors">
                        {hotel.name}
                      </h3>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {hotel.city}, {hotel.state} · {hotel.address}
                      </p>
                    </div>
                    {hotel.pilotRate && (
                      <div className="flex-shrink-0 ml-3 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5 text-center">
                        <p className="text-green-400 font-black text-lg leading-none">${hotel.pilotRate}</p>
                        <p className="text-green-400/60 text-[9px] font-bold">PILOT RATE</p>
                      </div>
                    )}
                  </div>

                  {/* Highways */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {hotel.nearbyHighways.map(hw => (
                      <span key={hw} className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">
                        {hw}
                      </span>
                    ))}
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {hotel.truckParking && (
                      <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded border border-accent/20">
                        🚛 Truck Parking
                      </span>
                    )}
                    {hotel.amenities.map((a, idx) => (
                      <span key={idx} className="bg-white/[0.04] text-gray-400 text-[10px] font-medium px-2 py-0.5 rounded border border-white/[0.06]">
                        {a}
                      </span>
                    ))}
                    {hotel.nearDining && (
                      <span className="bg-white/[0.04] text-gray-400 text-[10px] font-medium px-2 py-0.5 rounded border border-white/[0.06]">
                        🍽️ Near Dining
                      </span>
                    )}
                    {hotel.nearShopping && (
                      <span className="bg-white/[0.04] text-gray-400 text-[10px] font-medium px-2 py-0.5 rounded border border-white/[0.06]">
                        🛒 Near Shopping
                      </span>
                    )}
                  </div>

                  {/* Phone + Chain */}
                  <div className="flex items-center justify-between">
                    <a
                      href={`tel:${hotel.phone.replace(/[^0-9]/g, '')}`}
                      className="flex items-center gap-2 text-accent text-sm font-bold hover:underline"
                    >
                      📞 {hotel.phone}
                    </a>
                    {hotel.chain && (
                      <span className="text-gray-600 text-[10px] font-medium">{hotel.chain}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ─── CTA ─── */}
      {filtered.length > 0 && (
        <ToolResultCTA
          context="Found a hotel near your route? Now find pilot car escorts in the area."
          primary={{ label: "Find Escorts Nearby", href: "/directory", icon: "🔍" }}
          secondary={{ label: "Plan Your Route", href: "/tools/route-planner", icon: "🗺️" }}
        />
      )}

      {/* ─── Disclaimer ─── */}
      <ToolDisclaimer
        dataSource="Hotel operator submissions and public listing data"
        jurisdiction="Rates and availability subject to change — verify with property"
      />
    </div>
  );
}
