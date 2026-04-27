'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { stateFullName } from '@/lib/geo/state-names';
import {
  Shield, MapPin, Star, Zap, Award, CheckCircle,
  SlidersHorizontal, Radio, Truck
} from 'lucide-react';

interface DirectoryGridProps {
  providers: any[];
  targetCountry: string;
}

const STATE_OPTIONS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
].map(code => ({ code, name: stateFullName(code) || code }));

const SORT_OPTIONS = [
  { value: 'trust',  label: 'Trust Score' },
  { value: 'name',   label: 'Name A–Z' },
  { value: 'state',  label: 'State' },
  { value: 'recent', label: 'Recently Active' },
];

const EQUIPMENT_OPTIONS = [
  { value: '',             label: 'All Equipment' },
  { value: 'pilot-car',    label: 'Pilot Car' },
  { value: 'height-pole',  label: 'Height Pole' },
  { value: 'bucket-truck', label: 'Bucket Truck' },
  { value: 'route-survey', label: 'Route Survey' },
];

function TrustBadge({ score }: { score: number }) {
  if (!score || score === 0) return null;
  const color = score >= 80 ? '#F1A91B' : score >= 60 ? '#22c55e' : '#6B7280';
  const label = score >= 80 ? 'High Trust' : score >= 60 ? 'Verified' : 'Listed';
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl flex-shrink-0"
      style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
      <span className="text-xl font-black" style={{ color }}>{score}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
    </div>
  );
}

function AvailabilityDot({ lastSeen }: { lastSeen?: string }) {
  if (!lastSeen) return null;
  const hours = (Date.now() - new Date(lastSeen).getTime()) / 3_600_000;
  const isRecent = hours < 72;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
      isRecent ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isRecent ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
      {isRecent ? 'Active' : 'Listed'}
    </span>
  );
}

export function DirectoryGrid({ providers, targetCountry }: DirectoryGridProps) {
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [equipFilter, setEquipFilter] = useState('');
  const [sortBy, setSortBy] = useState('trust');
  const [showFilters, setShowFilters] = useState(false);

  const displayItems = useMemo(() => {
    let items = [...providers];
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(p =>
        (p.company || p.name || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.state_inferred || '').toLowerCase().includes(q)
      );
    }
    if (stateFilter) items = items.filter(p => (p.state_inferred || '').toUpperCase() === stateFilter);
    if (equipFilter) items = items.filter(p => (p.equipment_types || '').toLowerCase().includes(equipFilter));
    items.sort((a, b) => {
      if (sortBy === 'trust')  return (b.confidence_score || 0) - (a.confidence_score || 0);
      if (sortBy === 'name')   return (a.company || a.name || '').localeCompare(b.company || b.name || '');
      if (sortBy === 'state')  return (a.state_inferred || '').localeCompare(b.state_inferred || '');
      if (sortBy === 'recent') return new Date(b.last_seen_at || 0).getTime() - new Date(a.last_seen_at || 0).getTime();
      return 0;
    });
    return items;
  }, [providers, search, stateFilter, equipFilter, sortBy]);

  const claimed = displayItems.filter(p => p.confidence_score > 40).length;
  const unclaimed = displayItems.length - claimed;

  return (
    <div>
      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] focus-within:border-[#F1A91B]/40 transition-colors">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by operator name, city, or state..."
              className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
            />
            {search && <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white text-xs">✕</button>}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
              showFilters ? 'border-[#F1A91B]/40 bg-[#F1A91B]/10 text-[#F1A91B]' : 'border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/20'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">State</label>
              <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#F1A91B]/40">
                <option value="">All States</option>
                {STATE_OPTIONS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Equipment</label>
              <select value={equipFilter} onChange={e => setEquipFilter(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#F1A91B]/40">
                {EQUIPMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">Sort By</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#F1A91B]/40">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setSearch(''); setStateFilter(''); setEquipFilter(''); setSortBy('trust'); }}
                className="w-full px-3 py-2 rounded-lg border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-all">
                Clear All
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            <span className="font-bold text-white">{displayItems.length.toLocaleString()}</span> operators found
            {(search || stateFilter || equipFilter) && <span className="text-[#C6923A]"> (filtered)</span>}
          </span>
          <div className="flex items-center gap-3 text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" />{claimed.toLocaleString()} claimed</span>
            <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-yellow-400" />{unclaimed.toLocaleString()} unclaimed</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayItems.length > 0 ? displayItems.map((p: any) => {
          const state = stateFullName(p.state_inferred, true);
          const trust = p.confidence_score || 0;
          const isClaimed = trust > 40;
          const isHighTrust = trust > 80;
          const name = p.company || p.name || 'Unclaimed Operator';

          return (
            <div key={p.contact_id}
              className={`relative rounded-2xl overflow-hidden transition-all duration-200 group flex flex-col justify-between ${
                isHighTrust
                  ? 'border border-[#C6923A]/30 bg-[#0e0d0a] hover:border-[#F1A91B]/50 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(198,146,58,0.15)]'
                  : isClaimed
                  ? 'border border-white/10 bg-[#0c0c0c] hover:border-white/20 hover:-translate-y-0.5'
                  : 'border border-white/[0.06] bg-[#080808] hover:border-white/10'
              }`}>

              {isHighTrust && (
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: 'rgba(198,146,58,0.06)', filter: 'blur(24px)', transform: 'translate(30%,-30%)' }} />
              )}

              <div className="p-5">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-base font-black leading-tight mb-1 truncate ${isClaimed ? 'text-white' : 'text-gray-400'}`}>{name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />{p.city ? `${p.city}, ` : ''}{state}
                      </span>
                      <AvailabilityDot lastSeen={p.last_seen_at} />
                    </div>
                  </div>
                  <TrustBadge score={trust} />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {p.verification_status === 'verified' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {p.equipment_types && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {typeof p.equipment_types === 'string' ? p.equipment_types.split(',')[0]?.trim() : 'Escort'}
                    </span>
                  )}
                  {p.rating_avg && Number(p.rating_avg) > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      <Star className="w-3 h-3" /> {Number(p.rating_avg).toFixed(1)}
                    </span>
                  )}
                  {!isClaimed && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F1A91B]/10 text-[#C6923A] border border-[#C6923A]/30">Unclaimed</span>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5 flex gap-2">
                {isClaimed ? (
                  <>
                    <Link href={`/directory/dossier/${p.contact_id}`}
                      className="flex-1 py-2.5 rounded-xl text-center text-xs font-bold text-gray-300 border border-white/10 hover:border-white/20 hover:text-white transition-all">
                      View Profile
                    </Link>
                    <Link href={`/auth/signup?intent=dispatch&target=${p.contact_id}`}
                      className="flex-[1.2] py-2.5 rounded-xl text-center text-xs font-black text-black bg-[#F1A91B] hover:bg-[#D4951A] transition-all flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3" /> Live Ping
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href={`/directory/dossier/${p.contact_id}`}
                      className="flex-1 py-2.5 rounded-xl text-center text-xs font-semibold text-gray-400 border border-white/[0.06] hover:border-white/10 hover:text-gray-300 transition-all">
                      View Listing
                    </Link>
                    <Link href={`/claim?operator=${p.contact_id}`}
                      className="flex-[1.2] py-2.5 rounded-xl text-center text-xs font-black text-black bg-[#F1A91B] hover:bg-[#D4951A] transition-all">
                      Claim Free →
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-16 text-center">
            <div className="hc-card-on-texture rounded-2xl p-12 max-w-md mx-auto">
              <MapPin className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <p className="text-white font-black mb-2">No operators match your search.</p>
              <p className="text-gray-400 text-sm mb-6">Try broadening your search or clearing filters.</p>
              <Link href="/claim" className="inline-block px-6 py-3 bg-[#F1A91B] text-black font-black rounded-xl text-sm hover:bg-[#D4951A] transition-all">
                Add Your Listing Free
              </Link>
            </div>
          </div>
        )}
      </div>

      {displayItems.length > 0 && unclaimed > 0 && (
        <div className="mt-8 p-5 rounded-2xl border border-[#C6923A]/20 bg-[#C6923A]/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-black text-white text-sm">{unclaimed.toLocaleString()} operators in this list haven&apos;t claimed their profile yet.</p>
            <p className="text-gray-400 text-xs mt-1">Claimed profiles get 10× more visibility, trust scores, and broker inquiries.</p>
          </div>
          <Link href="/claim" className="flex-shrink-0 px-6 py-2.5 bg-[#F1A91B] text-black font-black rounded-xl text-sm hover:bg-[#D4951A] transition-all whitespace-nowrap">
            Claim Your Listing Free →
          </Link>
        </div>
      )}
    </div>
  );
}
