'use client';

import dynamic from 'next/dynamic';

const GlobalCommandMap = dynamic(
  () => import('@/components/map/GlobalCommandMap').then(m => m.GlobalCommandMap),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-[600px] bg-[#0a0a0b] border border-white/5 rounded-xl animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#C6923A] text-xs font-bold uppercase tracking-widest mb-2">⟐ Initializing Command Map</div>
          <div className="text-neutral-600 text-[10px]">Loading global operator radar...</div>
        </div>
      </div>
    )
  }
);

export function CommandMapWrapper() {
  return <GlobalCommandMap />;
}
