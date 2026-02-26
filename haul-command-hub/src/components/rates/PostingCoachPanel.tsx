
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import FairRateGauge from "./FairRateGauge";

interface PostingCoachPanelProps {
    origin: string;
    destination: string;
    equipment: string;
    currentRate: number;
}

const PostingCoachPanel: React.FC<PostingCoachPanelProps> = ({
    origin,
    destination,
    equipment,
    currentRate,
}) => {
    const [hint, setHint] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchHint() {
            setLoading(true);
            const { data, error } = await supabase.rpc("get_posting_rate_hint", {
                p_origin: origin,
                p_destination: destination,
                p_equipment: equipment,
            });

            if (!error && data) {
                setHint(data);
            }
            setLoading(false);
        }

        if (origin && destination) {
            fetchHint();
        }
    }, [origin, destination, equipment]);

    if (loading) return <div className="animate-pulse text-xs text-gray-500">Calculating Market Alpha...</div>;
    if (!hint) return null;

    return (
        <div className="bg-black/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center border border-accent/30">
                    <span className="text-xl">🧠</span>
                </div>
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Dispatch Brain</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Real-time Alpha</p>
                </div>
            </div>

            <FairRateGauge
                currentRate={currentRate}
                benchmarkRate={hint.benchmark_rate}
                confidence={hint.confidence_score}
            />

            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[11px] text-gray-400 leading-tight">
                    <span className="text-white font-bold">Pro Tip:</span> {hint.coaching_message}
                </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-black">Fill Likely</p>
                    <p className="text-sm font-black text-white">{hint.fill_speed_hours}h</p>
                </div>
                <div className="h-8 w-px bg-white/10"></div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-black">Demand</p>
                    <p className="text-sm font-black text-accent">{hint.demand_multiplier}x</p>
                </div>
                <div className="h-8 w-px bg-white/10"></div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-black">Reliability</p>
                    <p className="text-sm font-black text-green-500">{hint.confidence_score}%</p>
                </div>
            </div>
        </div>
    );
};

export default PostingCoachPanel;
