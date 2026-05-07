import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export function HCFooterTrustMeta() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-lg hc-card-on-texture my-8">
      <div className="flex-shrink-0 bg-[#C6923A]/15 p-3 rounded-full text-[#C6923A]">
        <ShieldCheckIcon className="w-8 h-8" />
      </div>
      <div className="text-center md:text-left">
        <h4 className="text-base font-semibold text-white mb-1">
          Verified Operating OS
        </h4>
        <p className="text-sm text-gray-400">
          Haul Command verifies all pilot car operators and escorts for adequate insurance, certification, and business standing.
        </p>
      </div>
    </div>
  );
}
