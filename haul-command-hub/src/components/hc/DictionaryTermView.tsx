"use client";

import { useEffect, useState } from 'react';
import { GlossaryEntry } from '@/lib/glossary';
import { Lock, ShieldCheck, Zap, ArrowLeft, Globe2, BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DictionaryTermView({ term }: { term: GlossaryEntry }) {
  const [viewCount, setViewCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Tactical and Autonomous categories are instantly locked for freemium users to drive high-end conversion
  const isPremiumCategory = ['tactical_logistics', 'autonomous_future_tech'].includes(term.category);

  useEffect(() => {
    // Track reads locally to enforce a freemium lead magnet wrapper limit
    const currentCache = localStorage.getItem('hc_dict_views');
    const count = currentCache ? parseInt(currentCache, 10) : 0;
    
    const hasSeenThisTerm = sessionStorage.getItem(`hc_term_${term.id}`);
    
    if (!hasSeenThisTerm) {
      sessionStorage.setItem(`hc_term_${term.id}`, 'true');
      const newCount = count + 1;
      localStorage.setItem('hc_dict_views', newCount.toString());
      setViewCount(newCount);
      
      // Soft lock after 3 reads. Premium terms lock instantly.
      if (newCount > 3 || isPremiumCategory) {
        setIsLocked(true);
      }
    } else {
      setViewCount(count);
      if (count > 3 || isPremiumCategory) setIsLocked(true);
    }
  }, [term.id, isPremiumCategory]);

  return (
    <div className="min-h-screen bg-hc-black text-hc-white p-6 md:p-12 font-sans relative">
      <div className="max-w-4xl mx-auto">
        
        {/* Breadcrumb / Back Navigation */}
        <Link href="/dictionary" className="inline-flex items-center gap-2 text-gray-400 hover:text-hc-gold transition-colors mb-12 uppercase tracking-widest text-sm font-bold">
          <ArrowLeft size={16} />
          Return to Global Dictionary
        </Link>
        
        {/* Header Block */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono uppercase tracking-widest text-gray-400">
              {term.category.replace('_', ' ')}
            </span>
            {isPremiumCategory && (
              <span className="px-3 py-1 bg-hc-gold/10 border border-hc-gold/20 rounded-full text-xs font-mono uppercase tracking-widest text-hc-gold flex items-center gap-1">
                <Lock size={12} /> Pro Intel
              </span>
            )}
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase text-white tracking-tighter mb-4 leading-none">
            {term.term}
          </h1>
          {term.hcBrandTerm && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-hc-gold/10 border-l-4 border-hc-gold rounded">
              <ShieldCheck className="text-hc-gold" size={18} />
              <span className="text-sm font-mono tracking-widest uppercase text-hc-gold font-bold">
                {term.hcBrandTerm}
              </span>
            </div>
          )}
        </div>

        {/* Global Matrix Payload */}
        <div className="flex flex-wrap gap-4 mb-12">
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            <Globe2 size={16} className="text-gray-500" />
            <span className="uppercase tracking-wider">Active Jurisdictions:</span>
            <div className="flex gap-2 ml-2">
              {term.countries.map(c => <span key={c} className="font-bold text-white">{c}</span>)}
            </div>
          </div>
        </div>

        {/* Dynamic Paywall / Definition Content View */}
        <div className="relative">
          <div className={`text-lg md:text-xl leading-relaxed text-gray-300 font-medium ${isLocked ? 'blur-md select-none opacity-40' : ''} transition-all duration-700`}>
            {term.definition}
            
            {term.regulatoryRef && (
              <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm uppercase tracking-widest">
                  <BookOpen size={16} />
                  Regulatory Citation
                </div>
                <div className="font-mono text-hc-gold text-lg">
                  {term.regulatoryRef}
                </div>
              </div>
            )}
          </div>

          {/* Paywall Overlay */}
          {isLocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-[#111] border border-white/10 p-8 md:p-12 rounded-2xl shadow-2xl max-w-2xl w-full">
                <div className="w-16 h-16 bg-hc-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="text-hc-gold w-8 h-8" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4">
                  {isPremiumCategory ? "Military/Tech Intel Locked" : "Search Limit Reached"}
                </h3>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                  {isPremiumCategory 
                    ? "Combat logistics pipelines, OIF routing protocols, and early-stage autonomous V2X operations are restricted to Pro operators to protect strategic advantages."
                    : "You've accessed 3 ultra-premium dictionary entries this session. Upgrade your command center to continue ingesting the 500+ global regulation vectors."}
                </p>
                <Link href="/pricing" className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-hc-gold text-black font-black uppercase tracking-widest text-sm hover:bg-yellow-400 transition-colors rounded-lg">
                  <Zap size={18} fill="currentColor" />
                  Upgrade to Command Pro
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Warning Readout for Aliases / SEO Payload */}
        {!isLocked && term.aliases && term.aliases.length > 0 && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <div className="flex items-center gap-2 text-gray-500 mb-6 uppercase tracking-widest text-sm font-bold">
              <AlertTriangle size={16} />
              Known Industry Aliases
            </div>
            <div className="flex flex-wrap gap-3">
              {term.aliases.map(alias => (
                <span key={alias} className="px-4 py-2 bg-[#1A1A1A] border border-white/5 rounded text-gray-400 text-sm">
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
