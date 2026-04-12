"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, LockKeyhole, Shield, Zap } from "lucide-react";

// ─── Shared filter type (matches DirectoryHardFilter) ──────
export interface HardFilterState {
  highPole: boolean;
  twic: boolean;
  hazmat: boolean;
  superload: boolean;
  avCertified: boolean;
  gpsTracked: boolean;
  availableNow: boolean;
  verified: boolean;
  equipmentType: string[];
}

interface OperatorResult {
  id: string;
  slug?: string;
  name: string;
  phone: string;
  location: string;
  score: number;
  badges?: Record<string, boolean>;
  equipment_tags?: string[];
  is_available_now?: boolean;
}

export function DirectorySearchList({
  initialQuery = "",
  filters,
}: {
  initialQuery?: string;
  filters?: HardFilterState;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<OperatorResult[]>([]);
  const [isCensored, setIsCensored] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filtersApplied, setFiltersApplied] = useState<Record<string, any> | null>(null);

  const fetchOperators = useCallback(async (searchQuery: string, hardFilters?: HardFilterState) => {
    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      
      // Hard filter params
      if (hardFilters) {
        if (hardFilters.twic) params.set('twic', 'true');
        if (hardFilters.hazmat) params.set('hazmat', 'true');
        if (hardFilters.highPole) params.set('highPole', 'true');
        if (hardFilters.superload) params.set('superload', 'true');
        if (hardFilters.avCertified) params.set('avCertified', 'true');
        if (hardFilters.gpsTracked) params.set('gpsTracked', 'true');
        if (hardFilters.verified) params.set('verified', 'true');
        if (hardFilters.availableNow) params.set('availableNow', 'true');
        hardFilters.equipmentType.forEach(eq => params.append('equipment', eq));
      }

      const res = await fetch(`/api/directory/search?${params.toString()}`);
      const data = await res.json();

      setResults(data.operators || []);
      setIsCensored(data.censored === true);
      setTotalCount(data.total ?? 0);
      setFiltersApplied(data.filters_applied || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperators(query, filters);
  }, [query, filters, fetchOperators]);

  // Badge renderer
  const renderBadges = (badges?: Record<string, boolean>, isAvailable?: boolean) => {
    if (!badges && !isAvailable) return null;
    const active: { key: string; label: string; color: string; icon: string }[] = [];
    if (isAvailable) active.push({ key: 'live', label: 'LIVE', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: '🟢' });
    if (badges?.twic) active.push({ key: 'twic', label: 'TWIC', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '🔐' });
    if (badges?.hazmat) active.push({ key: 'hazmat', label: 'HazMat', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: '☢️' });
    if (badges?.highPole) active.push({ key: 'highPole', label: 'Height Pole', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: '📏' });
    if (badges?.superload) active.push({ key: 'superload', label: 'Superload', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '🏗' });
    if (badges?.avCertified) active.push({ key: 'av', label: 'AV Cert', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: '🤖' });
    if (badges?.verified) active.push({ key: 'verified', label: 'Verified', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '✅' });
    if (active.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {active.map(b => (
          <span key={b.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${b.color}`}>
            <span>{b.icon}</span> {b.label}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by city, state, or company name..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Active filter indicator */}
      {filtersApplied && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0b0f14] border border-white/10 rounded-lg">
          <Shield className="w-3.5 h-3.5 text-[#C6923A]" />
          <span className="text-[11px] text-neutral-400 font-medium">
            Filtered results — showing operators matching your certification requirements
          </span>
          <span className="ml-auto text-[10px] font-bold text-[#C6923A]">
            {totalCount.toLocaleString()} match{totalCount !== 1 ? 'es' : ''}
          </span>
        </div>
      )}

      {/* Role / Position Filters */}
      <div className="flex overflow-x-auto pb-2 gap-2 hc-scrollbar-hide">
        {[
          "All Roles",
          "Pilot Car (PEVO)",
          "Tillerman",
          "Height Pole",
          "Route Surveyor",
          "Bucket Truck",
          "Broker / Dispatch",
          "Police Escort",
          "Mechanic",
          "Heavy Wrecker"
        ].map((role, idx) => (
          <button
            key={role}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              idx === 0 
                ? "bg-amber-500 text-white border-amber-500" 
                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-500 hover:text-white"
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center text-slate-400">Loading Directory Infrastructure...</div>}

      {/* Results List */}
      <div className="relative">
        <div className={`space-y-4`}>
          {results.map((op, idx) => {
            const shouldBlur = isCensored && idx >= 2;

            return (
              <div
                key={op.id}
                className={`group relative flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-[#16181B] to-[#0A0D14] p-6 shadow-2xl transition-all duration-300 hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(198,146,58,0.15)] ${
                  op.is_available_now ? 'ring-2 ring-emerald-500/30' : ''
                }`}
              >
                {/* Glow Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                <div className={`flex flex-col md:flex-row gap-5 ${shouldBlur ? "blur-md select-none opacity-40" : ""} relative z-10 w-full`}>
                  {/* Operator Avatar/Vehicle Photo */}
                  <div className="hidden sm:block shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-[#0B0B0C] border border-white/10 overflow-hidden relative shadow-inner">
                      {/* Placeholder for high-quality profile imagery */}
                      <img src={`/ads/premium-operator.png`} alt={op.name} className="w-full h-full object-cover opacity-80" />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-extrabold text-xl tracking-tight">{op.name}</h3>
                      {op.is_available_now && (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Zap className="w-3 h-3 fill-emerald-400" /> DISPATCH READY
                        </span>
                      )}
                      {op.score >= 50 ? (
                        <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md bg-[#C6923A]/10 text-[#C6923A] border border-[#C6923A]/30">
                          <Shield className="w-3 h-3 fill-[#C6923A]/20" />
                          <span className="text-white bg-[#C6923A] px-1.5 py-0.5 rounded text-[9px]">{op.score} TP</span>
                          {op.score >= 80 ? 'Verified Authority' : 'Claimed'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-400 border border-white/10">
                          <Shield className="w-3 h-3" />
                          <span className="text-white bg-neutral-600 px-1.5 py-0.5 rounded text-[9px]">{op.score} TP</span>
                          Unverified
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400 font-medium mb-3">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <span>{op.location || 'Location Not Set'}</span>
                    </div>

                    <div className="mt-auto">
                      {renderBadges(op.badges, false)}
                    </div>
                  </div>

                  {/* Pricing / Trust / CTA Column */}
                  <div className="flex flex-col md:items-end justify-center gap-4 relative z-10 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 shrink-0 min-w-[200px]">
                    <div className="flex items-center justify-between md:justify-end gap-3 w-full">
                      <div className="text-left md:text-right">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Command Score</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-black tracking-tighter ${op.score >= 80 ? 'text-emerald-400' : op.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {op.score}
                          </span>
                          <span className="text-sm font-medium text-gray-600">/ 100</span>
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex md:hidden items-center justify-center font-black text-lg ${op.score >= 80 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                        {op.score}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 w-full mt-2 md:mt-0">
                      <Link href={`/directory/profile/${op.slug || op.id}`} className="flex-1 md:w-full items-center justify-center text-center px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] uppercase tracking-widest font-bold rounded-xl transition-all">
                        View Dossier
                      </Link>
                      <Link href={`/loads/post?operator=${op.id}`} className="flex-1 md:w-full items-center justify-center text-center px-4 py-3 bg-[#C6923A] hover:bg-[#E0B05C] text-black shadow-[0_0_15px_rgba(198,146,58,0.4)] text-[11px] uppercase tracking-widest font-black rounded-xl transition-all">
                        Request Route
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Censorship Honeypot Overlay */}
        {isCensored && results.length > 2 && (
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020617] to-transparent flex flex-col items-center justify-end pb-8">
            <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-xl text-center max-w-md shadow-2xl backdrop-blur-md">
              <LockKeyhole className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h4 className="text-white font-bold text-lg">Identity Verification Required</h4>
              <p className="text-slate-400 text-sm mt-2 mb-4 leading-relaxed">
                To prevent data scraping and protect our operator network, you must login to view all 1.5M+ unmasked profiles, phone numbers, and live availability schedules.
              </p>
              <Link href="/login" className="inline-flex w-full items-center justify-center rounded-md px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-bold mt-4">
                Login to Unlock Directory
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
