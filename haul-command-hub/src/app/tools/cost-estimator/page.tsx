'use client';

import { useState, useMemo } from 'react';
import { getAllStates, getStateBySlug, getPoliceInfo } from '@/lib/regulatory-engine';
import Navbar from '@/components/Navbar';

// Base escort per-mile rate by region — adjusted per state risk score
const REGIONAL_ESCORT_RATES: Record<string, number> = {
    florida: 2.50, texas: 2.00, california: 3.00, 'new-york': 3.25,
    georgia: 2.25, ohio: 2.10, illinois: 2.40, pennsylvania: 2.60,
    michigan: 2.30, 'north-carolina': 2.15, virginia: 2.35, indiana: 2.05,
    tennessee: 2.10, missouri: 2.00, wisconsin: 2.15, minnesota: 2.20,
    colorado: 2.30, arizona: 2.15, maryland: 2.50, louisiana: 2.20,
    alabama: 2.05, kentucky: 2.00, 'south-carolina': 2.10,
    oklahoma: 1.95, oregon: 2.40, connecticut: 2.70,
    iowa: 1.90, mississippi: 1.95, arkansas: 1.90, kansas: 1.90,
    nevada: 2.35, utah: 2.15, nebraska: 1.95, 'west-virginia': 2.10,
    'new-mexico': 2.05, idaho: 2.00, maine: 2.25, 'new-hampshire': 2.40,
    montana: 2.00, 'rhode-island': 2.60, delaware: 2.50,
    'south-dakota': 1.90, 'north-dakota': 1.90, vermont: 2.35,
    wyoming: 2.00, 'new-jersey': 2.80, washington: 2.50, massachusetts: 2.75,
    hawaii: 3.50, alaska: 3.25,
};
const DEFAULT_ESCORT_RATE = 2.25;
const ADMIN_FEE = 150;

export default function CostEstimatorPage() {
    const states = getAllStates();
    const [inputs, setInputs] = useState({
        stateSlug: 'florida',
        miles: 300,
        escortCount: 2,
        policeCount: 0,
        isWeekend: false,
    });

    const rates = useMemo(() => {
        const state = getStateBySlug(inputs.stateSlug);
        const policeInfo = state ? getPoliceInfo(state.state) : null;
        const escortPerMile = REGIONAL_ESCORT_RATES[inputs.stateSlug] ?? DEFAULT_ESCORT_RATE;
        // Adjust escort rate by state risk score (higher risk = slightly higher cost)
        const riskAdjustment = state ? 1 + (state.risk_score_base - 3) * 0.05 : 1;
        // Weekend surcharge
        const weekendMultiplier = inputs.isWeekend ? 1.25 : 1;

        return {
            escort: Math.round(escortPerMile * riskAdjustment * weekendMultiplier * 100) / 100,
            police: policeInfo?.hourly_rate ?? 100,
            admin: ADMIN_FEE,
            stateName: state?.state ?? inputs.stateSlug,
        };
    }, [inputs.stateSlug, inputs.isWeekend]);

    const escortTotal = inputs.miles * inputs.escortCount * rates.escort;
    const policeTotal = inputs.policeCount * 8 * rates.police; // assume 8h shift
    const total = escortTotal + policeTotal + rates.admin;

    return (
        <>
            <Navbar />
            <main className="flex-grow max-w-5xl mx-auto px-4 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-5xl font-black text-white italic tracking-tighter mb-4">
                        ESCORT <span className="text-accent">COST ESTIMATOR</span>
                    </h1>
                    <p className="text-gray-400 text-lg">Calculate transparent convoy expenses in seconds.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-10 backdrop-blur-md">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-gray-500 text-xs font-black uppercase tracking-widest mb-3">Operating State</label>
                                <select
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none"
                                    value={inputs.stateSlug}
                                    onChange={(e) => setInputs({ ...inputs, stateSlug: e.target.value })}
                                >
                                    {states.map(s => <option key={s.slug} value={s.slug}>{s.state}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-500 text-xs font-black uppercase tracking-widest mb-3">Total Mileage</label>
                                <input
                                    type="number"
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none"
                                    value={inputs.miles}
                                    onChange={(e) => setInputs({ ...inputs, miles: Number(e.target.value) })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-500 text-xs font-black uppercase tracking-widest mb-3">Escort Units</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none"
                                        value={inputs.escortCount}
                                        onChange={(e) => setInputs({ ...inputs, escortCount: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-500 text-xs font-black uppercase tracking-widest mb-3">Police Escorts</label>
                                    <input
                                        type="number"
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-accent outline-none"
                                        value={inputs.policeCount}
                                        onChange={(e) => setInputs({ ...inputs, policeCount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="accent-accent w-4 h-4"
                                    checked={inputs.isWeekend}
                                    onChange={(e) => setInputs({ ...inputs, isWeekend: e.target.checked })}
                                />
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Weekend / Holiday Move</span>
                            </label>

                            <button className="w-full bg-accent text-black py-4 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all">
                                GENERATE ESTIMATE
                            </button>
                        </div>
                    </div>

                    <div className="bg-black border border-white/10 rounded-[32px] p-8 md:p-10 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Escort Fleet Service</p>
                                <p className="text-xl font-black text-white">${escortTotal.toLocaleString()}</p>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Police Admin Coordination</p>
                                <p className="text-xl font-black text-white">${policeTotal.toLocaleString()}</p>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Processing & Compliance Fee</p>
                                <p className="text-xl font-black text-white">${rates.admin.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="mt-12 bg-accent/10 border border-accent/20 p-6 rounded-2xl">
                            <p className="text-accent text-xs font-black uppercase mb-1">Estimated Total Convoy Cost</p>
                            <p className="text-5xl font-black text-white">${total.toLocaleString()}</p>
                            <p className="text-[10px] text-gray-500 mt-2 italic">*{rates.stateName}: ${rates.escort}/mi escort, ${rates.police}/hr police{inputs.isWeekend ? ' (weekend surcharge applied)' : ''}. Actual rates vary by vendor.</p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
