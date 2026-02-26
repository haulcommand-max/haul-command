'use client';

import React, { useState } from 'react';
import { Route, Search, ShieldAlert, Cpu, CheckCircle, Navigation, MapPin, DollarSign, AlertOctagon, TrendingUp, Truck } from 'lucide-react';

interface RouteIqResult {
    states_crossed: string[];
    distance_miles: number;
    escort_front_required: boolean;
    escort_rear_required: boolean;
    height_pole_required: boolean;
    police_escort_risk: 'low' | 'medium' | 'high' | 'unknown';
    police_risk_reasons: string[];
    estimated_permit_cost_range: { low: number; high: number; currency: string };
    estimated_escort_cost: { low: number; high: number; currency: string };
    fill_probability: number;
    demand_score: number;
    market_pulse: {
        supply_gap_score: number;
        suggested_post_time: string;
        nearby_available_escorts_count: number;
    };
}

export default function RouteIQPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<RouteIqResult | null>(null);
    const [error, setError] = useState('');

    const [formParams, setFormParams] = useState({
        origin_text: '',
        destination_text: '',
        width_ft: 14,
        height_ft: 15.5,
        length_ft: 110,
        weight_lbs: 100000
    });

    const handleRunAnalysis = async () => {
        if (!formParams.origin_text || !formParams.destination_text) {
            setError('Origin and Destination are required.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Using absolute URL to the edge function. 
            // In a real env, this uses the SUPABASE_URL envy variable or local proxy.
            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
            const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

            const res = await fetch(`${SUPABASE_URL}/functions/v1/hc_route_iq_compute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ANON_KEY}`
                },
                body: JSON.stringify(formParams)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to compute Route IQ');
            }

            const data: RouteIqResult = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePostLoad = () => {
        // Here we would either redirect to /post-load with query params
        // or open a modal to confirm the price and insert via Supabase.
        alert("Pre-filled Load Posting Flow Triggered! This drops the broker directly into a 1-click 'Confirm & Post' modal with all Route IQ data attached.");
    };

    return (
        <div className="min-h-screen bg-[#030303] text-slate-200">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">

                {/* Header Section */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1A91B]/10 border border-[#F1A91B]/20 rounded-full text-[#F1A91B] text-xs font-bold uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(241,169,27,0.15)]">
                        <Cpu className="w-3.5 h-3.5" /> HAUL COMMAND ROUTE IQ™
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
                        Stop Guessing on <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F1A91B] to-orange-500">Route Compliance.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 font-medium">
                        Instantly predict pilot car requirements, police escort triggers, and total escort costs across multiple states. Input dimensions. Get the truth.
                    </p>
                </div>

                {/* Interface Shell */}
                <div className="grid lg:grid-cols-12 gap-8 items-start">

                    {/* Input Panel (Col 5) */}
                    <div className="lg:col-span-5 bg-[#0a0a0f] border border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F1A91B] to-orange-500" />

                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Route className="w-5 h-5 text-[#F1A91B]" /> Load Setup
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-4 relative">
                                <div className="w-0.5 h-full bg-slate-800 absolute left-3.5 top-5 -z-10" />
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Origin</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-slate-500 border-2 border-[#0a0a0f]" />
                                        <input
                                            type="text"
                                            value={formParams.origin_text}
                                            onChange={(e) => setFormParams({ ...formParams, origin_text: e.target.value })}
                                            placeholder="City, State (e.g. Houston, TX)"
                                            className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-[#F1A91B] focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Destination</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-[#0a0a0f] shadow-[0_0_5px_#10b981]" />
                                        <input
                                            type="text"
                                            value={formParams.destination_text}
                                            onChange={(e) => setFormParams({ ...formParams, destination_text: e.target.value })}
                                            placeholder="City, State (e.g. Odessa, TX)"
                                            className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-[#F1A91B] focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <h4 className="text-sm font-bold text-white mb-4">Total Running Dimensions</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Width</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={formParams.width_ft}
                                                onChange={(e) => setFormParams({ ...formParams, width_ft: parseFloat(e.target.value) })}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white font-mono text-lg focus:border-[#F1A91B] focus:outline-none"
                                            />
                                            <span className="absolute right-3 top-3.5 text-slate-500 font-mono text-sm">ft</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Height</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={formParams.height_ft}
                                                onChange={(e) => setFormParams({ ...formParams, height_ft: parseFloat(e.target.value) })}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white font-mono text-lg focus:border-[#F1A91B] focus:outline-none"
                                            />
                                            <span className="absolute right-3 top-3.5 text-slate-500 font-mono text-sm">ft</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Length</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={formParams.length_ft}
                                                onChange={(e) => setFormParams({ ...formParams, length_ft: parseFloat(e.target.value) })}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white font-mono text-lg focus:border-[#F1A91B] focus:outline-none"
                                            />
                                            <span className="absolute right-3 top-3.5 text-slate-500 font-mono text-sm">ft</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Weight</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={formParams.weight_lbs}
                                                onChange={(e) => setFormParams({ ...formParams, weight_lbs: parseInt(e.target.value) })}
                                                className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-white font-mono text-lg focus:border-[#F1A91B] focus:outline-none"
                                            />
                                            <span className="absolute right-3 top-3.5 text-slate-500 font-mono text-sm">lbs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleRunAnalysis}
                                disabled={loading}
                                className="w-full py-4 mt-6 bg-[#F1A91B] hover:bg-[#d97706] disabled:opacity-50 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_20px_rgba(241,169,27,0.25)] flex items-center justify-center gap-2">
                                {loading ? 'Computing...' : <><Search className="w-5 h-5 stroke-[2.5]" /> Run Route IQ Analysis</>}
                            </button>
                        </div>
                    </div>

                    {/* Output / Results Panel (Col 7) */}
                    <div className="lg:col-span-7 space-y-6">
                        {!result ? (
                            <div className="bg-[#111] border border-white/5 rounded-3xl p-8 md:p-12 text-center h-full flex flex-col items-center justify-center min-h-[500px]">
                                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                    <ShieldAlert className="w-8 h-8 text-slate-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Awaiting Load Parameters</h3>
                                <p className="text-slate-400 max-w-md mx-auto mb-8">
                                    Enter your load's origin, destination, and dimensions to instantly calculate civilian pilot car and police escort requirements across your entire route.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl p-6 md:p-8 space-y-8 relative overflow-hidden">
                                {/* Success gradient glow */}
                                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#F1A91B]/10 blur-[100px] rounded-full pointer-events-none" />

                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-2">Analysis Complete</h3>
                                        <p className="text-slate-400 flex items-center gap-2">
                                            <Navigation className="w-4 h-4" /> {result.distance_miles} miles across {result.states_crossed.length} states
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-[#F1A91B]">
                                            {(result.fill_probability * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            Fill Probability
                                        </div>
                                    </div>
                                </div>

                                {/* Escort Requirements Grid */}
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest border-b border-white/5 pb-2">Civilian Escort Requirements</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${result.escort_front_required ? 'bg-[#F1A91B]/10 border-[#F1A91B]/30' : 'bg-[#111] border-white/5 opacity-50'}`}>
                                            <span className="text-sm font-bold text-white mb-1">Front Escort</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${result.escort_front_required ? 'text-[#F1A91B]' : 'text-slate-500'}`}>
                                                {result.escort_front_required ? 'Required' : 'Not Required'}
                                            </span>
                                        </div>
                                        <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${result.escort_rear_required ? 'bg-[#F1A91B]/10 border-[#F1A91B]/30' : 'bg-[#111] border-white/5 opacity-50'}`}>
                                            <span className="text-sm font-bold text-white mb-1">Rear Escort</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${result.escort_rear_required ? 'text-[#F1A91B]' : 'text-slate-500'}`}>
                                                {result.escort_rear_required ? 'Required' : 'Not Required'}
                                            </span>
                                        </div>
                                        <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${result.height_pole_required ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#111] border-white/5 opacity-50'}`}>
                                            <span className="text-sm font-bold text-white mb-1">Height Pole</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${result.height_pole_required ? 'text-blue-400' : 'text-slate-500'}`}>
                                                {result.height_pole_required ? 'Required' : 'Not Required'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Police Risk Assessment */}
                                <div className={`p-6 rounded-2xl border ${result.police_escort_risk === 'high' ? 'bg-red-500/10 border-red-500/30' : result.police_escort_risk === 'medium' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <AlertOctagon className={`w-6 h-6 ${result.police_escort_risk === 'high' ? 'text-red-500' : result.police_escort_risk === 'medium' ? 'text-orange-500' : 'text-emerald-500'}`} />
                                        <h4 className="text-lg font-bold text-white uppercase tracking-widest">
                                            {result.police_escort_risk} Police Escort Risk
                                        </h4>
                                    </div>
                                    {result.police_risk_reasons.length > 0 ? (
                                        <ul className="space-y-2 mt-4 ml-6 list-disc text-sm text-slate-300">
                                            {result.police_risk_reasons.map((reason, idx) => (
                                                <li key={idx}>{reason}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-400 mt-2">Dimensions do not typically trigger mandatory state police escorts for this distance.</p>
                                    )}
                                </div>

                                {/* Cost Estimates & CTA */}
                                <div className="pt-6 border-t border-white/5 grid md:grid-cols-2 gap-6 items-center">
                                    <div>
                                        <div className="text-sm font-bold text-slate-400 mb-1">Estimated Escort Spend</div>
                                        <div className="text-3xl font-black text-white flex items-center">
                                            <DollarSign className="w-6 h-6 text-slate-500" />
                                            {result.estimated_escort_cost.low} - {result.estimated_escort_cost.high}
                                        </div>
                                        <div className="text-[10px] text-slate-500 uppercase mt-1">Based on global rates & mileage</div>
                                    </div>

                                    <button
                                        onClick={handlePostLoad}
                                        className="w-full py-4 bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2">
                                        <Truck className="w-5 h-5" /> Post Load Now
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
