'use client';

import React, { useState } from 'react';
import { Shield, Zap, Truck, Award, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

interface FilterState {
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

const EQUIPMENT_OPTIONS = [
  { key: 'height_pole', label: 'Height Pole', icon: '📏' },
  { key: 'arrow_board', label: 'Arrow Board', icon: '➡️' },
  { key: 'flags_signs', label: 'Flags & Signs', icon: '🚩' },
  { key: 'oversize_banners', label: 'OVERSIZE Banners', icon: '⚠️' },
  { key: 'radio_cb', label: 'CB Radio', icon: '📻' },
  { key: 'gps_tracker', label: 'GPS Tracker', icon: '📡' },
  { key: 'dashcam', label: 'Dashcam', icon: '📹' },
  { key: 'fire_extinguisher', label: 'Fire Extinguisher', icon: '🧯' },
];

export function DirectoryHardFilter({ onFilterChange }: { onFilterChange?: (filters: FilterState) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    highPole: false,
    twic: false,
    hazmat: false,
    superload: false,
    avCertified: false,
    gpsTracked: false,
    availableNow: false,
    verified: false,
    equipmentType: [],
  });

  const updateFilter = (key: keyof FilterState, value: boolean | string[]) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    
    // Count active filters
    let count = 0;
    if (next.highPole) count++;
    if (next.twic) count++;
    if (next.hazmat) count++;
    if (next.superload) count++;
    if (next.avCertified) count++;
    if (next.gpsTracked) count++;
    if (next.availableNow) count++;
    if (next.verified) count++;
    count += next.equipmentType.length;
    setActiveCount(count);
    
    onFilterChange?.(next);
  };

  const toggleEquipment = (key: string) => {
    const current = filters.equipmentType;
    const next = current.includes(key) 
      ? current.filter(k => k !== key) 
      : [...current, key];
    updateFilter('equipmentType', next);
  };

  const clearAll = () => {
    const empty: FilterState = {
      highPole: false, twic: false, hazmat: false, superload: false,
      avCertified: false, gpsTracked: false, availableNow: false, verified: false,
      equipmentType: [],
    };
    setFilters(empty);
    setActiveCount(0);
    onFilterChange?.(empty);
  };

  return (
    <div className="w-full">
      {/* Toggle Strip */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0b0b0c] border border-white/10 rounded-xl px-5 py-3 text-sm font-bold text-white hover:border-[#C6923A]/40 transition group"
      >
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-[#C6923A]" />
          <span>Hard Filters</span>
          {activeCount > 0 && (
            <span className="bg-[#C6923A] text-black text-[10px] font-black px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="mt-2 bg-[#0a0a0b] border border-white/10 rounded-xl p-5 space-y-5 animate-in slide-in-from-top-2 duration-200">
          {/* Certifications */}
          <div>
            <h4 className="text-[10px] text-[#C6923A] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Shield className="w-3 h-3" /> Certifications
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'highPole' as const, label: 'Height Pole Certified', icon: '📏', desc: 'Has height pole equipment' },
                { key: 'twic' as const, label: 'TWIC Card', icon: '🔐', desc: 'Port/maritime clearance' },
                { key: 'hazmat' as const, label: 'HazMat Endorsed', icon: '☢️', desc: 'Hazardous materials' },
                { key: 'superload' as const, label: 'Superload Rated', icon: '🏗', desc: '200,000+ lbs' },
                { key: 'avCertified' as const, label: 'AV Escort Certified', icon: '🤖', desc: 'Autonomous vehicle escort' },
                { key: 'verified' as const, label: 'HC Verified', icon: '✅', desc: 'Identity confirmed' },
              ].map(cert => (
                <button
                  key={cert.key}
                  onClick={() => updateFilter(cert.key, !filters[cert.key])}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                    filters[cert.key]
                      ? 'bg-[#C6923A]/10 border-[#C6923A]/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-base">{cert.icon}</span>
                  <div>
                    <div className="text-xs font-bold">{cert.label}</div>
                    <div className="text-[9px] text-neutral-600">{cert.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <h4 className="text-[10px] text-[#22c55e] font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Availability
            </h4>
            <button
              onClick={() => updateFilter('availableNow', !filters.availableNow)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border transition-all ${
                filters.availableNow
                  ? 'bg-[#22c55e]/10 border-[#22c55e]/40 text-white'
                  : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:border-white/20'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${filters.availableNow ? 'bg-[#22c55e] shadow-[0_0_10px_#22c55e]' : 'bg-neutral-700'}`} />
              <div className="text-left">
                <div className="text-xs font-bold">Available Right Now</div>
                <div className="text-[9px] text-neutral-600">Show only operators who pinged "Live" in the last 30 minutes</div>
              </div>
            </button>
          </div>

          {/* Equipment */}
          <div>
            <h4 className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Truck className="w-3 h-3" /> Equipment
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_OPTIONS.map(eq => (
                <button
                  key={eq.key}
                  onClick={() => toggleEquipment(eq.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
                    filters.equipmentType.includes(eq.key)
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                      : 'bg-white/[0.02] border-white/5 text-neutral-500 hover:border-white/20'
                  }`}
                >
                  <span>{eq.icon}</span>
                  {eq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <button
              onClick={clearAll}
              className="text-[10px] text-neutral-500 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 transition"
            >
              <X className="w-3 h-3" /> Clear All
            </button>
            <div className="text-[10px] text-neutral-600">
              {activeCount} filter{activeCount !== 1 ? 's' : ''} active
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
