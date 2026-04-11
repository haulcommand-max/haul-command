import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export function HCFooterTrustMeta() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-lg bg-slate-900 border border-slate-800 my-8">
      <div className="flex-shrink-0 bg-slate-950 p-3 rounded-full text-hc-gold-500">
        <ShieldCheckIcon className="w-8 h-8" />
      </div>
      <div className="text-center md:text-left">
        <h4 className="text-base font-semibold text-white mb-1">
          Verified Operating OS
        </h4>
        <p className="text-sm text-slate-400">
          Haul Command verifies all pilot car operators and escorts for adequate insurance, certification, and business standing.
        </p>
      </div>
    </div>
  );
}
