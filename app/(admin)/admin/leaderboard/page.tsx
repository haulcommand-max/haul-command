"use client";

import React, { useState } from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

export default function LeaderboardAdminPage() {
    const [weights, setWeights] = useState({
        proximity: 20,
        trust: 30,
        activity: 20,
        response: 15,
        completeness: 10,
        boost: 5
    });

    return (
        <div className="flex flex-col h-full bg-[#070707]">
            <AdminTopBar title="Leaderboard & Scoring" />

            <div className="px-8 pt-4 border-b border-[#1a1a1a] flex gap-8">
                <Tab label="Rankings" active />
                <Tab label="Scoring Weights" />
                <Tab label="Levels & Badges" />
                <Tab label="Anti-Gaming" />
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl">
                <section className="space-y-8">
                    <div>
                        <h3 className="text-xl font-black uppercase italic text-[#ffb400] mb-2">Scoring Weight Editor</h3>
                        <p className="text-sm text-[#666]">
                            Adjust the multipliers used to rank providers. Changes affect the global leaderboard in real-time.
                        </p>
                    </div>

                    <div className="space-y-6 bg-[#0c0c0c] border border-[#1a1a1a] p-8 rounded-xl shadow-2xl">
                        <WeightSlider
                            label="Proximity (Distance)"
                            value={weights.proximity}
                            onChange={(v: number) => setWeights({ ...weights, proximity: v })}
                        />
                        <WeightSlider
                            label="Trust Score (Verified/Reviews)"
                            value={weights.trust}
                            onChange={(v: number) => setWeights({ ...weights, trust: v })}
                        />
                        <WeightSlider
                            label="Activity (90d Volume)"
                            value={weights.activity}
                            onChange={(v: number) => setWeights({ ...weights, activity: v })}
                        />
                        <WeightSlider
                            label="Response Time (Heartbeat)"
                            value={weights.response}
                            onChange={(v: number) => setWeights({ ...weights, response: v })}
                        />
                        <WeightSlider
                            label="Profile Completeness"
                            value={weights.completeness}
                            onChange={(v: number) => setWeights({ ...weights, completeness: v })}
                        />
                        <WeightSlider
                            label="Sponsor Boost"
                            value={weights.boost}
                            onChange={(v: number) => setWeights({ ...weights, boost: v })}
                        />

                        <div className="pt-6 border-t border-[#1a1a1a] flex justify-between items-center">
                            <div className="text-[10px] font-black uppercase text-[#444]">
                                Total: <span className={Object.values(weights).reduce((a, b) => a + b, 0) === 100 ? 'text-green-500' : 'text-red-500'}>
                                    {Object.values(weights).reduce((a, b) => a + b, 0)}%
                                </span>
                            </div>
                            <button className="px-6 py-2 bg-[#ffb400] text-black text-xs font-black uppercase rounded hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-500/10">
                                Save & Deploy
                            </button>
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <div>
                        <h3 className="text-xl font-black uppercase italic text-[#666] mb-2">Impact Preview</h3>
                        <p className="text-sm text-[#444]">
                            How the new weights change the Top 3 positions.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <PreviewCard name="Texas Heavy Haul" oldRank={1} newRank={1} diff={0} score={98.2} />
                        <PreviewCard name="Sunshine Pilot Cars" oldRank={4} newRank={2} diff={2} score={94.5} />
                        <PreviewCard name="Stallone Specialized" oldRank={2} newRank={3} diff={-1} score={92.1} />
                    </div>

                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                        <h4 className="text-[10px] font-black uppercase text-red-500 mb-1">Anti-Gaming Active</h4>
                        <p className="text-xs text-[#888]">
                            Daily review cap is set to **3 per provider**. Suspicious click spikes will be quarantined.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

function WeightSlider({ label, value, onChange }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                <span className="text-[#888]">{label}</span>
                <span className="text-[#ffb400]">{value}%</span>
            </div>
            <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-1 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-[#ffb400]"
            />
        </div>
    );
}

function PreviewCard({ name, oldRank, newRank, diff, score }: any) {
    return (
        <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-[#1a1a1a] flex items-center justify-center text-xs font-black">
                    #{newRank}
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-tight">{name}</h4>
                    <p className="text-[10px] text-[#444]">Score: {score}</p>
                </div>
            </div>
            <div className={`text-[10px] font-black ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-[#444]'}`}>
                {diff > 0 ? `+${diff}` : diff === 0 ? '--' : diff}
            </div>
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
