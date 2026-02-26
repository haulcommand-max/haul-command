
import React from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

import { supabaseServer } from '@/lib/supabase/server';

export default async function HeatAdminPage() {
    const supabase = supabaseServer();

    // Fetch live 7-day heat
    const { data: heatData } = await supabase
        .from('vw_active_metro_heat')
        .select('*')
        .order('avg_7d_heat', { ascending: false });

    // Aggregate stats
    const criticalCells = heatData?.filter(h => h.avg_7d_heat > 80).length || 0;
    const avgScarcity = heatData?.reduce((acc, curr) => acc + curr.avg_7d_heat, 0) / (heatData?.length || 1);

    return (
        <div className="flex flex-col h-full bg-[#070707]">
            <AdminTopBar title="Heat Engine & Scarcity" />

            <div className="px-8 pt-4 border-b border-[#1a1a1a] flex gap-8">
                <Tab label="Heat Map" active />
                <Tab label="Cells Detail" />
                <Tab label="Alert Rules" />
                <Tab label="Rollup Status" />
            </div>

            <div className="p-8 flex-1 flex flex-col xl:flex-row gap-8 overflow-y-auto">
                {/* Left Col: Map & Stats */}
                <div className="flex-1 flex flex-col gap-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatCard label="Critical Cells (>80)" value={criticalCells.toString()} color={criticalCells > 0 ? "text-red-500" : "text-[#ffb400]"} />
                        <StatCard label="Avg Scarcity" value={`${avgScarcity.toFixed(1)}`} color="text-[#ffb400]" />
                        <StatCard label="Push Alerts (24h)" value="142" color="text-white" />
                        <StatCard label="Pending Growth" value="+8.4%" color="text-green-500" />
                    </div>

                    <div className="flex-1 min-h-[500px] bg-[#0c0c0c] border border-[#1a1a1a] rounded-xl flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-98.5,39.8,3,0/1200x800?access_token=pk.placeholder')] bg-cover bg-center grayscale group-hover:scale-110 transition-transform duration-[10s]"></div>
                        <div className="relative z-10 text-center">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter text-[#444] mb-2 opacity-50">Operational Heat Map</h3>
                            <p className="text-xs font-bold text-[#ffb400]/50 tracking-widest uppercase mb-8">Live Supply/Demand Overlay</p>
                            <button className="px-8 py-3 bg-[#ffb400] text-black text-xs font-black uppercase rounded shadow-2xl hover:bg-yellow-500 transition-all">
                                Initialize Map Engine
                            </button>
                        </div>

                        {/* Overlay Stats */}
                        <div className="absolute bottom-8 left-8 space-y-4">
                            <MapLegend label="Surge Demand (80-100)" color="bg-red-500" />
                            <MapLegend label="Equilibrium (40-79)" color="bg-[#ffb400]" />
                            <MapLegend label="Oversupply (0-39)" color="bg-green-500" />
                        </div>
                    </div>
                </div>

                {/* Right Col: Leaderboard */}
                <div className="w-full xl:w-[400px] bg-[#0c0c0c] border border-[#1a1a1a] rounded-xl p-6 flex flex-col">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Top Demand Metros</h3>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {heatData?.map((cell: any, i: number) => {
                            const isCritical = cell.avg_7d_heat > 80;
                            return (
                                <div key={i} className={`p-4 rounded-lg border ${isCritical ? 'bg-red-950/20 border-red-500/20' : 'bg-[#111] border-[#222]'} flex items-center justify-between`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-white">{cell.metro_area}, {cell.region_code}</span>
                                            {isCritical && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-black uppercase rounded">Critical</span>}
                                        </div>
                                        <div className="text-xs text-[#888]">Weekly Loads: {cell.weekly_loads}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xl font-black ${isCritical ? 'text-red-500' : 'text-[#ffb400]'}`}>
                                            {cell.avg_7d_heat.toFixed(1)}
                                        </div>
                                        <div className="text-[9px] uppercase tracking-widest text-[#666]">Heat Index</div>
                                    </div>
                                </div>
                            );
                        })}
                        {(!heatData || heatData.length === 0) && (
                            <div className="text-center text-[#666] text-sm py-10 italic">
                                No heat data recorded in last 7 days.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: any) {
    return (
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-6 rounded-lg">
            <p className="text-[10px] font-black uppercase text-[#444] mb-1">{label}</p>
            <p className={`text-2xl font-black tracking-tighter ${color}`}>{value}</p>
        </div>
    );
}

function MapLegend({ label, color }: any) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-sm ${color}`}></div>
            <span className="text-[10px] font-black uppercase text-[#666] tracking-widest">{label}</span>
        </div>
    );
}

function Tab({ label, active }: any) {
    return (
        <button className={`py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${active ? 'border-[#ffb400] text-[#ffb400]' : 'border-transparent text-[#444] hover:text-[#888]'}`}>
            {label}
        </button>
    );
}
