'use client';

import { useState } from 'react';
import { Calculator, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function StateComplianceCalculator({ regionCode, regionName }: { regionCode: string, regionName: string }) {
    const [width, setWidth] = useState('10');
    const [height, setHeight] = useState('14');
    const [length, setLength] = useState('65');
    const [overhang, setOverhang] = useState('0');

    // Mock logic based on typical heavy haul states for demo purposes.
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const l = parseFloat(length) || 0;
    const o = parseFloat(overhang) || 0;

    const needsPermit = w > 8.5 || h > 13.5 || l > 65 || o > 4;
    const needsFrontEscort = w > 12;
    const needsRearEscort = w > 14 || l > 110 || o > 20;
    const needsPolice = w > 16 || l > 150;
    const needsHeightPole = h > 16;
    
    const totalEscorts = (needsFrontEscort ? 1 : 0) + (needsRearEscort ? 1 : 0);

    const [hasCalculated, setHasCalculated] = useState(false);

    const handleCalculate = () => {
        setHasCalculated(true);
        import('@/lib/analytics/track').then(({ track }) => {
            track.event('calculator_submit', {
                region_code: regionCode,
                width: w,
                length: l,
                height: h,
                overhang: o,
                block_name: 'compliance_calculator'
            });
        });
    };

    return (
        <div className="bg-[#0a0a0f] border border-amber-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/5 mb-10">
            <div className="bg-amber-500/10 border-b border-amber-500/20 p-5 flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white italic tracking-tight">{regionName} Escort Calculator</h2>
                    <p className="text-xs text-amber-500 font-semibold tracking-wider uppercase">Regional Planning Estimates (Beta)</p>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-4">
                    <p className="text-sm text-gray-400 font-medium mb-2">Enter Baseline Load Dimensions:</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Width (ft)</label>
                            <input type="number" value={width} onChange={e => setWidth(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="8.5" step="0.5" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Height (ft)</label>
                            <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="13.5" step="0.5" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Length (ft)</label>
                            <input type="number" value={length} onChange={e => setLength(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="65" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Overhang (ft)</label>
                            <input type="number" value={overhang} onChange={e => setOverhang(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="0" />
                        </div>
                    </div>
                    <button 
                        onClick={handleCalculate}
                        className="w-full mt-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors uppercase tracking-widest"
                    >
                        Generate Estimates
                    </button>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider leading-relaxed mt-2 uppercase">
                        * Estimates are for preliminary planning purposes only and based on standard baseline rules. Local verification and valid jurisdictional permits are strictly required prior to movement. Do not dispatch based solely on simulated logic.
                    </p>
                </div>

                {/* Outputs */}
                <div className="bg-black/50 border border-white/5 rounded-xl p-5 relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                        <ShieldCheck className="w-32 h-32 text-amber-500" />
                    </div>
                    
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Preliminary Routing Estimates</p>
                    
                    <div className={`space-y-3 relative z-10 transition-opacity ${hasCalculated ? 'opacity-100' : 'opacity-30 pointer-events-none blur-[1px]'}`}>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-sm text-gray-400">Oversize Permit Indicated</span>
                            {needsPermit ? <span className="text-sm font-bold text-amber-500 text-right">Yes</span> : <span className="text-sm font-bold text-green-500 text-right">No</span>}
                        </div>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-sm text-gray-400">Estimated Escorts</span>
                            <span className={`text-sm font-bold text-right ${totalEscorts > 0 ? 'text-amber-500' : 'text-green-500'}`}>{totalEscorts}</span>
                        </div>
                        {(needsFrontEscort || needsRearEscort) && (
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-sm text-gray-400">Projected Config</span>
                                <span className="text-sm font-bold text-amber-500 text-right">
                                    {needsFrontEscort && needsRearEscort ? '1 Front + 1 Rear' : needsFrontEscort ? '1 Front' : '1 Rear'}
                                </span>
                            </div>
                        )}
                        {needsHeightPole && (
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-sm text-red-400 font-medium">Height Pole Required</span>
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                            </div>
                        )}
                        {needsPolice && (
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <span className="text-sm text-red-400 font-bold">Police Escort Required</span>
                                <ShieldCheck className="w-4 h-4 text-red-500" />
                            </div>
                        )}
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-sm text-gray-400">Time Restrictions</span>
                            <span className="text-xs font-bold text-amber-500 text-right max-w-[150px]">
                                {w > 12 ? 'Daylight Only' : '24/7 Permitted'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div 
                className="bg-amber-500 p-1 flex items-center justify-center hover:bg-amber-400 transition-colors cursor-pointer group"
                onClick={() => {
                    import('@/lib/analytics/track').then(({ track }) => {
                        track.event('claim_click', { action_context: 'calculator_footer_find_escorts', region_code: regionCode });
                    });
                }}
            >
                <Link href={`/directory/${regionCode === 'US' ? 'us' : 'us/' + regionCode.toLowerCase()}`} className="flex items-center gap-2 py-3 px-6 w-full justify-center">
                    <span className="text-white font-black uppercase tracking-widest text-sm">Find Available Escorts in this Market</span>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}