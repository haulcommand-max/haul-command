'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// The Haul Command Mobile Glossary Console
// 120-country glossary — real Supabase data, no mocks.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface GlossaryEntry {
  slug: string;
  term: string;
  short_definition: string;
  category: string | null;
  jurisdiction: string | null;
  applicable_countries: string[] | null;
}

interface CountryOption {
  country_code: string;
  country_name: string;
  flag_emoji: string;
}

export default function MobileGlossaryConsole({ initialCountry = 'Global' }) {
  const [activeCountry, setActiveCountry] = useState(initialCountry);
  const [activeTab, setActiveTab] = useState<'Local' | 'Global' | 'All'>('All');
  const [activeLetter, setActiveLetter] = useState('A');
  const [shimmer, setShimmer] = useState(true);
  const [topicCollapsed, setTopicCollapsed] = useState(true);
  const [definitions, setDefinitions] = useState<GlossaryEntry[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createClient();

  // Turn off shimmer after initial render
  useEffect(() => {
    const timer = setTimeout(() => setShimmer(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Load available countries from country_tiers
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('country_tiers')
          .select('country_code, country_name, flag_emoji')
          .order('expansion_priority', { ascending: false });
        if (data) setCountries(data);
      } catch {
        // Silently fall back to hardcoded options if table doesn't exist
      }
    })();
  }, [supabase]);

  // Fetch glossary terms from glossary_public view
  const fetchTerms = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('glossary_public')
        .select('slug, term, short_definition, category, jurisdiction, applicable_countries')
        .ilike('term', `${activeLetter}%`)
        .order('term', { ascending: true })
        .limit(20);

      // Filter by country if not Global
      if (activeCountry !== 'Global') {
        query = query.contains('applicable_countries', [activeCountry]);
      }

      const { data, error } = await query;
      if (!error && data) {
        setDefinitions(data);
      }

      // Also get total count
      const { count } = await supabase
        .from('glossary_public')
        .select('*', { count: 'exact', head: true });
      if (count !== null) setTotalCount(count);
    } catch {
      // Silently handle errors
    }
    setLoading(false);
  }, [supabase, activeLetter, activeCountry]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  // Filter definitions by tab (Local = country-specific, Global = universal)
  const filteredDefinitions = definitions.filter(d => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Local') {
      return d.applicable_countries && d.applicable_countries.length > 0 && !d.applicable_countries.includes('GLOBAL');
    }
    if (activeTab === 'Global') {
      return !d.applicable_countries || d.applicable_countries.length === 0 || d.applicable_countries.includes('GLOBAL');
    }
    return true;
  });

  return (
    <div className="bg-hc-gray-900 min-h-screen pb-20 font-sans text-white">
      {/* 1. Header & Primary Promise */}
      <div className="p-4 pt-8">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-hc-yellow-400 to-yellow-600 mb-2">
          Global Terminology
        </h1>
        <p className="text-hc-gray-400 text-sm">
          {totalCount > 0 ? `${totalCount.toLocaleString()}+` : '3,162+'} Heavy Haul & Logistics Definitions
        </p>
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
            {countries.length > 0
              ? countries.map(c => (
                  <option key={c.country_code} value={c.country_code}>
                    {c.flag_emoji} {c.country_name}
                  </option>
                ))
              : <>
                  <option value="AU">🇦🇺 Australia</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="DE">🇩🇪 Germany</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="CA">🇨🇦 Canada</option>
                </>
            }
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
            <motion.button
              key={letter}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              onClick={() => setActiveLetter(letter)}
              className={`min-w-[44px] h-[48px] rounded-xl flex items-center justify-center font-black text-lg snap-center border-2 ${
                activeLetter === letter 
                  ? 'bg-hc-yellow-400 border-hc-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                  : 'bg-hc-gray-800 border-amber-500/40 text-amber-400'
              }`}
            >
              {letter}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 5. Definitions — Real data from Supabase */}
      <div className="p-4 space-y-4">
        {activeCountry !== 'Global' && (
          <h2 className="text-xs font-black uppercase text-hc-yellow-400 tracking-widest border-b border-hc-gray-800 pb-2 mb-4">
            {activeCountry} Specialized Terms
          </h2>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-black border border-hc-gray-800 p-5 rounded-xl animate-pulse">
                <div className="h-5 bg-hc-gray-800 rounded w-1/3 mb-3" />
                <div className="h-3 bg-hc-gray-800 rounded w-1/4 mb-4" />
                <div className="h-4 bg-hc-gray-800 rounded w-full mb-2" />
                <div className="h-4 bg-hc-gray-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredDefinitions.length === 0 ? (
          <div className="text-center py-12 text-hc-gray-500">
            <div className="text-3xl mb-3">📖</div>
            <p className="text-sm font-bold">No terms found for &quot;{activeLetter}&quot;{activeCountry !== 'Global' ? ` in ${activeCountry}` : ''}</p>
            <p className="text-xs mt-1">Try another letter or switch to All Terms</p>
          </div>
        ) : (
          filteredDefinitions.map((def) => (
            <Link href={`/glossary/${def.slug}`} key={def.slug} className="block">
              <div className="bg-black border border-hc-gray-800 p-5 rounded-xl shadow-lg hover:border-hc-yellow-400/30 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2">{def.term}</h3>
                <div className="flex gap-2 mb-3">
                  {def.category && (
                    <span className="inline-block bg-hc-gray-800 text-[10px] text-hc-gray-300 uppercase px-2 py-1 rounded font-bold tracking-wider">
                      {def.category}
                    </span>
                  )}
                  {def.jurisdiction && (
                    <span className="inline-block bg-amber-500/10 text-[10px] text-amber-400 uppercase px-2 py-1 rounded font-bold tracking-wider">
                      {def.jurisdiction}
                    </span>
                  )}
                </div>
                <p className="text-sm text-hc-gray-400 leading-relaxed mb-4">
                  {def.short_definition}
                </p>
                {/* Inline Semantic Hub Links */}
                <div className="border-t border-hc-gray-800 pt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-blue-400 font-bold">View Full Definition &rarr;</span>
                  <span className="text-xs text-hc-yellow-400 font-bold">View Regulations &rarr;</span>
                </div>
              </div>
            </Link>
          ))
        )}
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
              <Link href="/glossary?category=permits" className="p-2 border border-hc-gray-700 rounded hover:text-white">Permits & Logic</Link>
              <Link href="/glossary?category=bridge" className="p-2 border border-hc-gray-700 rounded hover:text-white">Bridge Clearances</Link>
              <Link href="/glossary?category=routing" className="p-2 border border-hc-gray-700 rounded hover:text-white">Route Surveying</Link>
              <Link href="/glossary?category=insurance" className="p-2 border border-hc-gray-700 rounded hover:text-white">Fleet Insurance</Link>
              <Link href="/glossary?category=escort" className="p-2 border border-hc-gray-700 rounded hover:text-white">Escort Types</Link>
              <Link href="/glossary?category=compliance" className="p-2 border border-hc-gray-700 rounded hover:text-white">Compliance</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
