'use client';

import { useState } from 'react';
import { getAllStates, calculateMovementRisk, MovementInput, MovementOutput } from '@/lib/regulatory-engine';
import Navbar from '@/components/Navbar';

export default function SuperloadMeterPage() {
    const states = getAllStates();
    const [formData, setFormData] = useState<MovementInput>({
        stateSlug: 'texas',
        width: 16,
        height: 15,
        length: 120,
        isFriday: false,
        isMetro: true,
        cityName: 'Houston',
    });

    const [result, setResult] = useState<MovementOutput | null>(null);

    const handleCalculate = () => {
        const res = calculateMovementRisk(formData);
        setResult(res || null);
    };

    return (
        <>
            <Navbar />
            <main className="flex-grow max-w-6xl mx-auto px-4 py-16">
                <header className="mb-16">
                    <div className="flex items-center space-x-4 mb-4">
                        <span className="bg-accent text-black text-[10px] font-black px-2 py-0.5 rounded italic">PRO VERSION</span>
                        <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">
                            SUPERLOAD <span className="text-accent underline decoration-4 underline-offset-4">RISK METER</span>
                        </h1>
                    </div>
                    <p className="text-gray-400 text-lg max-w-2xl">High-dimension predictive analytics for massive freight coordination. Detect bottlenecks before they stall your convoy.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Controls */}
                    <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-md h-fit">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3">Operating Jurisdiction</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent outline-none"
                                        value={formData.stateSlug}
                                        onChange={(e) => setFormData({ ...formData, stateSlug: e.target.value })}
                                    >
                                        {states.map(s => <option key={s.slug} value={s.slug}>{s.state}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="City/County"
                                        className="bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent outline-none"
                                        value={formData.cityName}
                                        onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest">Dimension Thresholds</label>
                                <div className="space-y-2">
                                    <p className="flex justify-between text-xs font-bold"><span className="text-gray-400">Width:</span> <span className="text-white">{formData.width}'</span></p>
                                    <input type="range" min="8" max="30" step="0.5" className="w-full accent-accent" value={formData.width} onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-2">
                                    <p className="flex justify-between text-xs font-bold"><span className="text-gray-400">Height:</span> <span className="text-white">{formData.height}'</span></p>
                                    <input type="range" min="13.5" max="25" step="0.5" className="w-full accent-accent" value={formData.height} onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })} />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <button
                                    onClick={handleCalculate}
                                    className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg hover:bg-accent transition-all shadow-xl"
                                >
                                    CALCULATE RISK
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Intelligence Display */}
                    <div className="lg:col-span-8 space-y-8">
                        {!result ? (
                            <div className="aspect-video bg-white/5 border border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center p-20 text-center">
                                <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-6"></div>
                                <p className="text-gray-500 uppercase tracking-widest font-black text-sm italic">Initializing Predictive Matrix...</p>
                            </div>
                        ) : (
                            <>
                                {/* Main Risk Panel */}
                                <div className="bg-black border border-white/10 rounded-[40px] p-10 relative overflow-hidden shadow-2xl">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                                        <div>
                                            <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-4">Cumulative Movement Risk</p>
                                            <div className="flex items-center">
                                                <div className="text-8xl font-black italic tracking-tighter mr-6" style={{ color: result.riskColor }}>{result.riskScore * 10}%</div>
                                                <div>
                                                    <p className="text-2xl font-black text-white italic">{result.riskLevel}</p>
                                                    <p className="text-gray-400 text-xs">Based on {formData.cityName}, {formData.stateSlug.toUpperCase()} regulations.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow max-w-xs space-y-4">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold text-gray-500"><span>POLICE PROBABILITY</span> <span className="text-white">95%</span></div>
                                                <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-red-500 w-[95%]"></div></div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold text-gray-500"><span>UTILITY COORDINATION</span> <span className="text-white">65%</span></div>
                                                <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 w-[65%]</div></div>
                         </div>
                         <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-bold text-gray-500"><span>ENG. REVIEW LIKELIHOOD</span> <span className="text-white">80%</span></div>
                                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[80%]"></div></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Insight Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                            <p className="text-accent text-[10px] font-black uppercase mb-4 tracking-widest">Escort Config</p>
                                            <p className="text-2xl font-black text-white leading-tight">
                                                {result.escortsRequired} Certified Units <span className="text-gray-500 text-xs">Required</span>
                                            </p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                            <p className="text-accent text-[10px] font-black uppercase mb-4 tracking-widest">Est. Permit Delay</p>
                                            <p className="text-2xl font-black text-white leading-tight">
                                                4-7 Business Days <span className="text-gray-500 text-xs">Backlogged</span>
                                            </p>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                            <p className="text-accent text-[10px] font-black uppercase mb-4 tracking-widest">Compliance Badge</p>
                                            <p className="text-sm font-bold text-green-500">ELIGIBLE FOR GENERATION</p>
                                            <button
                                                onClick={() => window.location.href = `/generate/movement-certificate?state=${formData.stateSlug}&width=${formData.width}&height=${formData.height}&length=${formData.length}&friday=${formData.isFriday}&metro=${formData.isMetro}&city=${formData.cityName}`}
                                                className="mt-2 text-[10px] font-black uppercase underline underline-offset-4 text-gray-400 hover:text-white transition-colors"
                                            >
                                                Generate Certificate Now
                                            </button>
                                        </div>
                                    </div>

                                    {/* Warning Bar */}
                                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-start">
                                        <span className="text-2xl mr-4">🚧</span>
                                        <div>
                                            <h4 className="text-red-500 font-bold text-sm mb-1 uppercase tracking-widest">Local Override Detected</h4>
                                            <p className="text-xs text-gray-400 leading-relaxed">Houston, TX mandates police escorts for all loads exceeding 16' width during weekend windows. Standard state rules are superseded by metro ordinance.</p>
                                        </div>
                                    </div>
                                </>
            )}
                            </div>
                    </div>
            </main>
        </>
    );
}
