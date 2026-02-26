'use client';

import { useState } from 'react';
import { getAllStates, calculateMovementRisk, MovementInput, MovementOutput } from '@/lib/regulatory-engine';
import Navbar from '@/components/Navbar';

export default function FridayCheckerPage() {
    const states = getAllStates();
    const [formData, setFormData] = useState<MovementInput>({
        stateSlug: 'florida',
        width: 12,
        height: 13.5,
        length: 70,
        isFriday: true,
        isMetro: false,
    });

    const [result, setResult] = useState<MovementOutput | null>(null);

    const handleCalculate = () => {
        const res = calculateMovementRisk(formData);
        setResult(res || null);
    };

    return (
        <>
            <Navbar />
            <main className="flex-grow max-w-5xl mx-auto px-4 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-5xl font-black text-white italic tracking-tighter mb-4">
                        CAN I MOVE <span className="text-accent">FRIDAY?</span>
                    </h1>
                    <p className="text-gray-400 text-lg">Instant compliance check for weekend-adjacent heavy haul.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Form */}
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-10 backdrop-blur-md">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-gray-500 text-xs font-black uppercase tracking-widest mb-3">Target State</label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none transition-all"
                                    value={formData.stateSlug}
                                    onChange={(e) => setFormData({ ...formData, stateSlug: e.target.value })}
                                >
                                    {states.map(s => <option key={s.slug} value={s.slug}>{s.state}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-500 text-xs font-black uppercase tracking-widest mb-3">Width (ft)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none"
                                        value={formData.width}
                                        onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-500 text-xs font-black uppercase tracking-widest mb-3">Height (ft)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-6">
                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-accent"
                                        checked={formData.isFriday}
                                        onChange={(e) => setFormData({ ...formData, isFriday: e.target.checked })}
                                    />
                                    <span className="text-white font-bold group-hover:text-accent transition-colors">Friday Move</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-accent"
                                        checked={formData.isMetro}
                                        onChange={(e) => setFormData({ ...formData, isMetro: e.target.checked })}
                                    />
                                    <span className="text-white font-bold group-hover:text-accent transition-colors">Metro Zone</span>
                                </label>
                            </div>

                            <button
                                onClick={handleCalculate}
                                className="w-full bg-accent text-black py-4 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all shadow-[0_0_20px_rgba(245,159,10,0.2)]"
                            >
                                RUN SCAN
                            </button>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="relative">
                        {!result ? (
                            <div className="h-full border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center p-12 text-center opacity-40">
                                <div className="text-6xl mb-6">🛰️</div>
                                <p className="font-bold uppercase tracking-widest text-sm mb-2">Awaiting Telemetry</p>
                                <p className="text-xs text-gray-500">Configure dimensions to calculate risk priority</p>
                            </div>
                        ) : (
                            <div className="bg-black border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden h-full">
                                <div
                                    className="absolute top-0 right-0 w-32 h-32 opacity-20"
                                    style={{ background: `radial-gradient(circle, ${result.riskColor} 0%, transparent 70%)` }}
                                ></div>

                                <div className="mb-8">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Final Risk Assessment</p>
                                    <div className="flex items-baseline">
                                        <h2 className="text-6xl font-black tracking-tighter" style={{ color: result.riskColor }}>
                                            {result.riskScore}
                                        </h2>
                                        <span className="ml-3 text-gray-400 font-bold">/ 10 SCORE</span>
                                    </div>
                                    <p className="font-black italic uppercase tracking-tighter mt-1" style={{ color: result.riskColor }}>
                                        {result.riskLevel}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white/5 p-4 rounded-2xl">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Escorts Required</p>
                                        <p className="text-xl font-black">{result.escortsRequired}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Police Required</p>
                                        <p className={`text-xl font-black ${result.policeRequired ? 'text-red-500' : 'text-green-500'}`}>
                                            {result.policeRequired ? 'YES' : 'NO'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {result.heightPoleRequired && (
                                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center">
                                            <span className="text-xl mr-3">⚠️</span>
                                            <p className="text-xs text-red-200 font-medium">Height Pole Required. Verify route clearance before dispatch.</p>
                                        </div>
                                    )}
                                    {formData.isFriday && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex items-center">
                                            <span className="text-xl mr-3">📢</span>
                                            <p className="text-xs text-yellow-200 font-medium">Friday move detected. Major metro curfews apply after 2:00 PM.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <button
                                        onClick={() => window.location.href = `/generate/movement-certificate?state=${formData.stateSlug}&width=${formData.width}&height=${formData.height}&length=${formData.length}&friday=${formData.isFriday}&metro=${formData.isMetro}`}
                                        className="w-full bg-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/20 transition-all text-xs uppercase tracking-widest"
                                    >
                                        Generate Approval Certificate
                                    </button>
                                    <p className="text-[10px] text-gray-500 text-center mt-4">Required for B2B Broker Compliance</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
