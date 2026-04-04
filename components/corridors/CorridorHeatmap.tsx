import React from 'react';

interface SignalData {
  fill_rate_7d?: number | string;
  load_velocity?: number | string;
  pricing_trend?: 'up' | 'down' | 'stable';
  search_volume_index?: number;
}

interface Props {
  corridorName: string;
  signals?: {
    signal_data: SignalData;
    composite_score: number;
    recorded_at: string;
  };
  isPro?: boolean; // If false, blur or lock the data
}

export function CorridorHeatmap({ corridorName, signals, isPro = false }: Props) {
  // Mock data if no signals yet
  const data: SignalData = signals?.signal_data ?? {
    fill_rate_7d: 0.65,
    load_velocity: 'High',
    pricing_trend: 'up',
    search_volume_index: 84
  };

  const fillRate = typeof data.fill_rate_7d === 'number' ? data.fill_rate_7d : parseFloat(data.fill_rate_7d as string) || 0;
  const fillRatePct = Math.round(fillRate * 100);

  return (
    <div className="rounded-2xl border border-white/8 bg-[#0f1420] overflow-hidden">
      <div className="border-b border-white/8 px-6 py-4 flex items-center justify-between bg-white/2">
        <div className="flex items-center gap-3">
          <span className="text-xl">🗺️</span>
          <h3 className="font-bold text-white text-lg">Demand Heatmap <span className="text-white/40 text-sm font-normal">| Live Pulse</span></h3>
        </div>
        {!isPro && (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold text-amber-400 border border-amber-500/20">
            Pro Feature
          </span>
        )}
      </div>

      <div className="p-6 relative">
        {!isPro && (
          <div className="absolute inset-0 z-10 backdrop-blur-md bg-[#0f1420]/60 flex flex-col items-center justify-center">
            <div className="text-3xl mb-3">🔒</div>
            <p className="text-white font-bold mb-2">Heatmap data is locked</p>
            <p className="text-white/50 text-sm mb-4 px-8 text-center max-w-sm">
              Upgrade to Corridor Intelligence Pro to see real-time broker demand, velocity, and fill rates for {corridorName}.
            </p>
            <a href="/data-products/corridor-intelligence" className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-black hover:bg-amber-400 transition">
              Unlock Intelligence
            </a>
          </div>
        )}

        {/* Heatmap UI */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${!isPro ? 'opacity-30 pointer-events-none blur-[2px]' : ''}`}>
          
          {/* Fill Rate */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">7-Day Fill Rate</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-black text-white">{fillRatePct}%</span>
            </div>
            {/* Visual Bar */}
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${fillRatePct < 50 ? 'bg-red-500' : fillRatePct < 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${fillRatePct}%` }}
              />
            </div>
            <p className="text-[10px] text-white/30 mt-2">
              {fillRatePct < 50 ? 'Severe coverage gap' : fillRatePct < 80 ? 'Moderate capacity' : 'Saturated'}
            </p>
          </div>

          {/* Load Velocity */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Load Velocity</p>
            <div className="flex items-center gap-2 h-10">
              <span className="text-xl font-bold text-white capitalize">{data.load_velocity}</span>
              <span className="text-blue-400">⚡</span>
            </div>
            <p className="text-[10px] text-white/30 mt-2 tracking-wide">Movement speed vs baseline</p>
          </div>

          {/* Pricing Trend */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Pricing Trend</p>
            <div className="flex items-center gap-2 h-10">
              <span className={`text-xl font-bold ${
                data.pricing_trend === 'up' ? 'text-green-400' : 
                data.pricing_trend === 'down' ? 'text-red-400' : 'text-white'
              }`}>
                {data.pricing_trend === 'up' ? 'Testing High' : 
                 data.pricing_trend === 'down' ? 'Softening' : 'Stable'}
              </span>
              <span>{data.pricing_trend === 'up' ? '↗' : data.pricing_trend === 'down' ? '↘' : '→'}</span>
            </div>
            <p className="text-[10px] text-white/30 mt-2 tracking-wide">Compared to 30d trailing</p>
          </div>

          {/* Search Volume */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Search Volume</p>
            <div className="flex items-center gap-2 h-10">
              <span className="text-3xl font-black text-white">{data.search_volume_index ?? 0}</span>
              <span className="text-white/40 text-xs self-end pb-1">/100</span>
            </div>
             <p className="text-[10px] text-white/30 mt-2 tracking-wide">Broker lookup intent</p>
          </div>

        </div>
      </div>
    </div>
  );
}
