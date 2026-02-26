import React from 'react';
import { MapPin, Navigation, Radio } from 'lucide-react';

interface StaticRadarMapProps {
    cityName: string;
    state: string;
    radiusMiles?: number;
    activeDrivers?: number;
}

export function StaticRadarMap({ cityName, state, radiusMiles = 50, activeDrivers = 3 }: StaticRadarMapProps) {
    return (
        <div className="relative w-full h-[300px] bg-[#0a0a0f] border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center">

            {/* Abstract Map Grid Background */}
            <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Radar Sweep Animation Base */}
            <div className="absolute w-[400px] h-[400px] rounded-full border border-emerald-500/10 flex items-center justify-center">
                <div className="absolute w-[250px] h-[250px] rounded-full border border-emerald-500/20" />
                <div className="absolute w-[100px] h-[100px] rounded-full border border-emerald-500/30" />

                {/* Animated Sweep (CSS inline for simplicity, usually in tailwind config) */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.1) 100%)',
                        animation: 'spin 4s linear infinite'
                    }}
                />
            </div>

            {/* Center Pin (The City) */}
            <div className="absolute flex flex-col items-center justify-center z-10">
                <div className="relative flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-full border border-emerald-500/30 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
                </div>
                <div className="mt-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-bold text-white tracking-wider flex items-center gap-2">
                    {cityName}, {state}
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981]" />
                </div>
            </div>

            {/* Synthetic Driver Pins (Randomly placed within constraints) */}
            {[...Array(activeDrivers)].map((_, i) => (
                <div
                    key={i}
                    className="absolute"
                    style={{
                        top: `${30 + Math.random() * 40}%`,
                        left: `${20 + Math.random() * 60}%`,
                    }}
                >
                    <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                        <Radio className="w-3 h-3 text-amber-500" />
                        <span className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest bg-amber-500/10 px-1 rounded backdrop-blur-sm">Pilot</span>
                    </div>
                </div>
            ))}

            {/* Market Radius Overlay Data */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-xl flex flex-col gap-1">
                    <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Coverage Zone</span>
                    <span className="text-sm font-bold text-slate-200 font-mono">{radiusMiles} MI_RADIUS</span>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg flex items-center gap-2">
                    <Navigation className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider">ROUTING ONLINE</span>
                </div>
            </div>

        </div>
    );
}
