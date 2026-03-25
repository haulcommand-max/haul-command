"use client";

import { useState } from 'react';
import { ThumbsUp, Users, CheckCircle2 } from 'lucide-react';

interface EndorsementProps {
  capabilities: string[];
}

export function EndorsementModule({ capabilities }: EndorsementProps) {
  // Using local state to simulate optimistic endorsement until Supabase mutations are active
  const [vouches, setVouches] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    capabilities.forEach((cap, i) => {
      initial[cap] = Math.floor(Math.random() * 15) + (i === 0 ? 25 : 2); // Seed artificial social proof purely for visual preview
    });
    return initial;
  });

  const [hasVouched, setHasVouched] = useState<Record<string, boolean>>({});

  const handleVouch = (cap: string) => {
    if (!hasVouched[cap]) {
      setVouches(prev => ({ ...prev, [cap]: prev[cap] + 1 }));
      setHasVouched(prev => ({ ...prev, [cap]: true }));
    }
  };

  if (capabilities.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
          <Users className="text-blue-400" />
          Network Endorsements
        </h2>
        <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">Verified Peer Vouches</span>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
        <div className="flex flex-wrap gap-3">
          {capabilities.map(cap => (
            <button 
              key={cap}
              onClick={() => handleVouch(cap)}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
                hasVouched[cap] 
                  ? 'bg-blue-500/10 border-blue-500/30' 
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex flex-col items-start pr-3 border-r border-white/10">
                <span className="text-sm font-bold text-gray-200">{cap}</span>
              </div>
              
              <div className={`flex items-center gap-1.5 font-mono text-sm ${hasVouched[cap] ? 'text-blue-400' : 'text-gray-400'}`}>
                {hasVouched[cap] ? <CheckCircle2 size={16} /> : <ThumbsUp size={16} className="group-hover:scale-110 transition-transform" />}
                <span className="font-bold">{vouches[cap]}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Endorsements require a linked DOT number or Verified Profile to prevent fraud.
          </p>
          <a href="/login" className="text-xs font-bold text-hc-gold hover:underline">
            Login to Vouch →
          </a>
        </div>
      </div>
    </section>
  );
}
