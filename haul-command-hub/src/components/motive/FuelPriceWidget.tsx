'use client';

import React from 'react';

interface FuelPrice {
  jurisdiction_code: string;
  avg_price: number;
  sample_count: number;
  last_observed: string;
}

interface FuelPriceWidgetProps {
  prices: FuelPrice[];
  title?: string;
}

/**
 * FuelPriceWidget — displays real fuel price observations from Motive fleet data.
 * Shows avg diesel prices by state with sample counts and freshness.
 * Used on Rates Intelligence and Load Analyzer pages.
 */
export default function FuelPriceWidget({ prices, title = 'Live Diesel Prices' }: FuelPriceWidgetProps) {
  if (!prices.length) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.04] flex items-center justify-between">
        <h3 className="text-white text-sm font-bold flex items-center gap-2">
          <span className="text-lg">⛽</span>
          {title}
        </h3>
        <span className="text-[10px] text-gray-500">powered by Haul Command fleet data</span>
      </div>
      <div className="divide-y divide-white/[0.03]">
        {prices.slice(0, 10).map((p) => (
          <div key={p.jurisdiction_code} className="px-5 py-2.5 flex items-center justify-between hover:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-xs w-8">{p.jurisdiction_code}</span>
              <span className="text-gray-500 text-[10px]">{p.sample_count} observations</span>
            </div>
            <div className="text-accent font-black text-sm tabular-nums">
              ${p.avg_price.toFixed(3)}/gal
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-2 bg-white/[0.01] text-[10px] text-gray-600">
        Source: Real fuel purchase data from ELD-connected fleets · Updated in real-time
      </div>
    </div>
  );
}
