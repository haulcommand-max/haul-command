"use client";

import { useState, useMemo } from 'react';
import { Search, Globe, ChevronRight } from 'lucide-react';
import { GLOBAL_POSITIONS } from '@/lib/positions-global';

// Flattening the massive 120-country position matrix for dummy-proof searching
const flattenedPositions = GLOBAL_POSITIONS.flatMap(pos => 
  pos.countries.map(c => ({
    id: pos.id,
    label: pos.label_en,
    localLabel: pos.label_local,
    category: pos.category,
    countryCode: c,
    desc: pos.description
  }))
);

export function GlobalPositionSearch() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return [];
    const lower = query.toLowerCase();
    return flattenedPositions.filter(p => 
      p.label.toLowerCase().includes(lower) || 
      (p.localLabel && p.localLabel.toLowerCase().includes(lower)) ||
      p.countryCode.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower)
    ).slice(0, 10); // Show top 10 relevant matches instantly
  }, [query]);

  return (
    <div className="w-full relative max-w-3xl mx-auto z-50">
      <div className="relative group">
        <div className="absolute inset-0 bg-hc-gold/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative bg-[#111] border border-white/10 rounded-2xl flex items-center p-2 focus-within:border-hc-gold/50 focus-within:ring-1 focus-within:ring-hc-gold/50 transition-all">
          <div className="pl-4 pr-3 text-gray-500">
            <Search size={22} className={query ? "text-hc-gold" : ""} />
          </div>
          <input
            type="text"
            className="bg-transparent border-none appearance-none outline-none text-white w-full placeholder-gray-500 font-medium py-3 text-lg"
            placeholder="Search 73 positions across 120 countries (e.g., 'Flagger Texas' or 'Schwertsransport')"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")} className="px-4 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest">
              Clear
            </button>
          )}
        </div>
      </div>

      {query && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-[#111] border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-3xl overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {filtered.map((item, idx) => (
              <a 
                key={`${item.id}-${item.countryCode}-${idx}`}
                href={`/dictionary/${item.countryCode.toLowerCase()}/${item.id}`} 
                className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors group cursor-pointer border-b border-white/5 last:border-0"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:border-hc-gold/30 group-hover:text-hc-gold transition-colors flex-shrink-0">
                   <Globe size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold truncate group-hover:text-hc-gold transition-colors leading-tight">
                    {item.label} <span className="text-xs text-gray-500 font-normal uppercase tracking-widest ml-2 border border-white/10 rounded px-1.5 py-0.5">[{item.countryCode}]</span>
                  </h4>
                  {(item.localLabel || item.desc) && (
                    <p className="text-sm text-gray-400 truncate mt-1">{item.localLabel ? `Native: ${item.localLabel}` : item.desc}</p>
                  )}
                </div>
                <div className="text-gray-600 group-hover:text-white transition-colors">
                  <ChevronRight size={20} />
                </div>
              </a>
            ))}
          </div>
          <div className="p-3 bg-black/40 border-t border-white/5 text-center">
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
              ⚡ Intelligence Hub — Rendering 73 global positions across 120 nations instantly.
            </p>
          </div>
        </div>
      )}

      {query && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-[#111] border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-3xl">
          <p className="text-red-400 font-bold mb-2">No exact intelligence matches found.</p>
          <p className="text-sm text-gray-400">Try searching for a simpler term like "Tiller" or a country code like "DE".</p>
        </div>
      )}
    </div>
  );
}
