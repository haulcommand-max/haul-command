'use client';

import { useState } from 'react';
import certifications from '@/data/certifications.json';
import ToolResultCTA, { TOOL_CTAS } from '@/components/hc/ToolResultCTA';
import ToolDisclaimer from '@/components/hc/ToolDisclaimer';

type CertType = 'All' | 'Pilot Car (PEVO)' | 'Flagger' | 'Specialized';

export default function CertificationsClient() {
  const [activeTab, setActiveTab] = useState<CertType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCerts = certifications.filter((cert) => {
    if (activeTab !== 'All' && cert.type !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!cert.state.toLowerCase().includes(q) && !cert.provider.toLowerCase().includes(q) && !cert.type.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="bg-black/80 border border-white/[0.08] rounded-xl overflow-hidden backdrop-blur-md">
      {/* Search & Tabs */}
      <div className="p-4 sm:p-6 border-b border-white/[0.08]">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Search by state or provider (e.g., WA, ESC)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-mono"
            />
          </div>

          <div className="flex bg-white/[0.03] rounded-lg p-1 w-full md:w-auto">
            {(['All', 'Pilot Car (PEVO)', 'Flagger', 'Specialized'] as CertType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-accent text-black shadow-lg shadow-accent/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-accent/5 p-4 border-b border-accent/10 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-400">Total Programs: <strong className="text-white">{filteredCerts.length}</strong></span>
          <span className="text-gray-400 hidden sm:inline">Active Tab: <strong className="text-white">{activeTab}</strong></span>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4 sm:p-6">
        {filteredCerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCerts.map((cert, idx) => (
              <a
                key={idx}
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/40 hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                    cert.type === 'Pilot Car (PEVO)' ? 'bg-green-500/20 text-green-400' :
                    cert.type === 'Specialized' ? 'bg-accent/20 text-accent' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {cert.type.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{cert.state}</span>
                </div>
                
                <h3 className="text-white font-bold text-sm mb-1 group-hover:text-accent transition-colors">
                  {cert.provider}
                </h3>
                
                <p className="text-gray-500 text-xs mb-4 line-clamp-3 min-h-[48px]">
                  {cert.description}
                </p>
                
                <div className="flex justify-between items-center text-xs font-mono pt-3 border-t border-white/[0.06]">
                  <span className="text-gray-400">{cert.format}</span>
                  <strong className="text-white">{cert.price}</strong>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 font-mono text-sm">No certifications found for "{searchQuery}" under {activeTab}.</p>
          </div>
        )}
      </div>

      <ToolResultCTA 
        {...TOOL_CTAS.complianceResult()}
        context="Need reliable escorts verified with these certifications? Search the global directory."
      />
      <ToolDisclaimer dataSource="State DOTs and Certification Boards" jurisdiction="United States" />
    </div>
  );
}
