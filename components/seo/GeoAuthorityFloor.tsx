'use client';

import React from 'react';
import { useCityStats } from '@/lib/market/hooks/useMarketSignals';
import { Activity, Users, Truck, Zap } from 'lucide-react';

interface GeoAuthorityFloorProps {
    citySlug: string;
    cityName: string;
    stateName: string;
}

export function GeoAuthorityFloor({ citySlug, cityName, stateName }: GeoAuthorityFloorProps) {
    const { data, error, isLoading } = useCityStats(citySlug);

    if (error) return null; // Fail gracefully, don't crash the build (P0 requirement)

    const isLive = !isLoading && data;
    const loads = data?.loads_24h ?? '-';
    const drivers = data?.active_drivers ?? '-';
    const rate = data?.avg_rate_last_30d?.toFixed(2) ?? '-';

    return (
        <div className="bg-[#121217] border border-white/5 rounded-xl p-6 mb-8 mt-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <h3 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                    Live Market Data <span className="text-gray-500 font-normal">| {cityName}, {stateName}</span>
                </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Drivers */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <Users size={16} />
                        <span className="text-xs font-semibold uppercase">Active Pilots</span>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">
                        {isLoading ? <span className="animate-pulse">...</span> : drivers}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Ready for deployment</div>
                </div>

                {/* Loads 24h */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <Truck size={16} />
                        <span className="text-xs font-semibold uppercase">Loads (24H)</span>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">
                        {isLoading ? <span className="animate-pulse">...</span> : loads}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Originating within 50mi</div>
                </div>

                {/* Avg Rate */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <Activity size={16} />
                        <span className="text-xs font-semibold uppercase">Est. Rate/Mi</span>
                    </div>
                    <div className="text-2xl font-bold text-[#F1A91B] font-mono">
                        ${isLoading ? <span className="animate-pulse">..</span> : rate}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Based on recent corridor averages</div>
                </div>

                {/* Surge Probability */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <Zap size={16} className={data?.surge_probability === 'High' ? 'text-orange-500' : 'text-gray-400'} />
                        <span className="text-xs font-semibold uppercase">Surge Prob</span>
                    </div>
                    <div className="text-2xl font-bold text-white font-mono">
                        {isLoading ? <span className="animate-pulse">...</span> :
                            <span className={data?.surge_probability === 'High' ? 'text-orange-500' : 'text-emerald-500'}>
                                {data?.surge_probability}
                            </span>}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Demand velocity indicator</div>
                </div>
            </div>

            {isLive && (
                <div className="mt-4 text-[10px] text-gray-600 flex justify-end">
                    Last updated: {new Date(data.last_updated).toLocaleTimeString()}
                </div>
            )}
        </div>
    );
}
