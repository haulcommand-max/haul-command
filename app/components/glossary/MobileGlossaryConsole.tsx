'use client';
import React, { useState, useEffect } from 'react';

// The Haul Command Mobile Glossary Console
// Fulfills the explicit UX rules mapping a 120-country glossary without thin hubs.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function MobileGlossaryConsole({ initialCountry = 'Global' }) {
  const [activeCountry, setActiveCountry] = useState(initialCountry);
  const [activeTab, setActiveTab] = useState<'Local' | 'Global' | 'All'>('All');
  const [activeLetter, setActiveLetter] = useState('A');
  const [shimmer, setShimmer] = useState(true);
  const [topicCollapsed, setTopicCollapsed] = useState(true);

  // Turn off shimmer after initial render/pulse to indicate scrollability without annoyance
  useEffect(() => {
    const timer = setTimeout(() => setShimmer(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Mock Definitions that would be fetched instantly client-side via filtering
  const definitions = [
    { term: 'Pilot Vehicle', type: 'Local', desc: 'Australian terminology for an escort vehicle equipped with amber flashing lights and UHF radio.' },
    { term: 'Pilot Car', type: 'Global', desc: 'Standard North American term for an escort vehicle required for wide and heavy transport.' },
    { term: 'Permit Weight', type: 'Global', desc: 'The absolute maximum weight allowed on an axle configuration under a state-issued oversized permit.' }
  ];

  return (
    <div className="bg-hc-gray-900 min-h-screen pb-20 font-sans text-white">
      {/* 1. Header & Primary Promise */}
      <div className="p-4 pt-8">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-hc-yellow-400 to-yellow-600 mb-2">
          Global Terminology
        </h1>
        <p className="text-hc-gray-400 text-sm">3,162+ Heavy Haul & Logistics Definitions</p>
      </div>

      {/* 2. Country Selector - Primary Sticky Control */}
      <div className="sticky top-0 z-50 bg-hc-gray-900/95 backdrop-blur-sm border-b border-hc-gray-800 pb-4 shadow-xl">
        <div className="px-4 pt-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-hc-gray-500 mb-1 block">Jurisdiction</label>
          <select 
            value={activeCountry} 
            onChange={(e) => setActiveCountry(e.target.value)}
            className="w-full bg-black border border-hc-gray-700 rounded-lg p-3 text-white font-bold appearance-none focus:outline-none focus:border-hc-yellow-400 focus:ring-1 focus:ring-hc-yellow-400"
          >
            <option value="Global">🌍 Global Dictionary</option>
            <option value="AU">🇦🇺 Australia</option>
            <option value="US">🇺🇸 United States</option>
            <option value="DE">🇩🇪 Germany</option>
          </select>
        </div>

        {/* 3. Segmented Control */}
        <div className="px-4 mt-4">
          <div className="flex bg-black p-1 rounded-lg border border-hc-gray-800">
            {['Local', 'Global', 'All'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab ? 'bg-hc-gray-800 text-white shadow' : 'text-hc-gray-500 hover:text-white'}`}
              >
                {tab} Terms
              </button>
            ))}
          </div>
        </div>

        {/* 4. Alphabet Chip Rail (Sticky horizontal scroller) */}
        <div className={`mt-4 px-4 flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x ${shimmer ? 'animate-pulse' : ''}`}>
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveLetter(letter)}
              className={`min-w-[44px] h-[48px] rounded-xl flex items-center justify-center font-black text-lg transition-colors snap-center border-2 ${
                activeLetter === letter 
                  ? 'bg-hc-yellow-400 border-hc-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                  : 'bg-hc-gray-800 border-hc-gray-700 text-white active:bg-hc-gray-700'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* 5. First Definitions Immediately Visible */}
      <div className="p-4 space-y-4">
        {activeCountry !== 'Global' && (
          <h2 className="text-xs font-black uppercase text-hc-yellow-400 tracking-widest border-b border-hc-gray-800 pb-2 mb-4">
            {activeCountry} Specialized Terms
          </h2>
        )}
        
        {definitions.filter(d => activeTab === 'All' || d.type === activeTab).map((def, idx) => (
          <div key={idx} className="bg-black border border-hc-gray-800 p-5 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-white mb-2">{def.term}</h3>
            <span className="inline-block bg-hc-gray-800 text-[10px] text-hc-gray-300 uppercase px-2 py-1 rounded font-bold tracking-wider mb-3">
              {def.type} Usage
            </span>
            <p className="text-sm text-hc-gray-400 leading-relaxed mb-4">
              {def.desc}
            </p>
            {/* Inline Semantic Hub Links */}
            <div className="border-t border-hc-gray-800 pt-3 flex flex-wrap gap-2">
              <span className="text-xs text-blue-400 font-bold hover:underline cursor-pointer">Find {activeCountry === 'AU' ? 'Pilots' : 'Escorts'} &rarr;</span>
              <span className="text-xs text-hc-yellow-400 font-bold hover:underline cursor-pointer">View Regulations &rarr;</span>
            </div>
          </div>
        ))}
      </div>

      {/* 6. Browse by Topic - Collapsed Secondary Nav */}
      <div className="px-4 mt-8 pb-12">
        <div className="bg-black border border-hc-gray-800 rounded-xl overflow-hidden">
          <button 
            onClick={() => setTopicCollapsed(!topicCollapsed)}
            className="w-full flex justify-between items-center p-4 bg-hc-gray-800 text-white font-bold"
          >
            📂 More Ways to Browse (Topics)
            <span className="text-hc-gray-400">{topicCollapsed ? '+' : '-'}</span>
          </button>
          {!topicCollapsed && (
            <div className="p-4 grid grid-cols-2 gap-2 text-sm text-hc-gray-400">
              <a href="#" className="p-2 border border-hc-gray-700 rounded hover:text-white">Permits & Logic</a>
              <a href="#" className="p-2 border border-hc-gray-700 rounded hover:text-white">Bridge Clearances</a>
              <a href="#" className="p-2 border border-hc-gray-700 rounded hover:text-white">Route Surveying</a>
              <a href="#" className="p-2 border border-hc-gray-700 rounded hover:text-white">Fleet Insurance</a>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
