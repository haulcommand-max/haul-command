'use client';

import { useState } from 'react';
import Link from 'next/link';

interface RuleDictionary {
  name: string;
  slug: string;
  permit_authority: string;
  permit_portal_url: string;
  police_scheduling_authority: string;
  night_movement: string;
  weekend_movement: string;
  major_metro_curfew: string;
}

export default function PermitCheckerClient({ 
  countryCode, 
  countryName, 
  dictionary 
}: { 
  countryCode: string; 
  countryName: string; 
  dictionary: RuleDictionary[];
}) {
  const [search, setSearch] = useState('');

  const filtered = dictionary.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.permit_authority.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
      <div className="mb-6">
        <input 
          type="text" 
          placeholder={`Search ${countryName} jurisdictions or authorities...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-accent text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
        {filtered.map((rule) => {
          return (
            <div key={rule.slug} className="p-6 rounded-xl border bg-white/[0.02] border-white/5 hover:border-accent/30 transition-colors ag-card-hover group">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-xl font-bold text-white group-hover:text-accent transition-colors">{rule.name}</h4>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="block text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Permit Authority</span>
                  <div className="text-gray-300 font-medium">{rule.permit_authority}</div>
                </div>

                <div>
                  <span className="block text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Police / Escort Authority</span>
                  <div className="text-gray-400">{rule.police_scheduling_authority}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/10">
                  <div>
                    <span className="block text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Night Movement</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.night_movement === 'No' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {rule.night_movement}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-500 uppercase tracking-wider text-[10px] font-bold mb-1">Weekend Movement</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${rule.weekend_movement === 'No' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {rule.weekend_movement}
                    </span>
                  </div>
                </div>

                {rule.major_metro_curfew && (
                  <div className="mt-2 text-xs text-yellow-500/80 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                    <span className="font-bold">Curfew:</span> {rule.major_metro_curfew}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/10">
                <Link 
                  href={rule.permit_portal_url} 
                  target="_blank" 
                  className="w-full block text-center bg-white/5 hover:bg-white text-white hover:text-black font-bold py-2 rounded transition-colors text-sm border border-white/10 hover:border-white"
                >
                  Open Official Permit Portal ↗
                </Link>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-12 text-gray-500">
            No jurisdictions found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
