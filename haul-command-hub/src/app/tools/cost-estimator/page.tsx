'use client';

import { useState } from 'react';
import { getAllStates } from '@/lib/regulatory-engine';
import Navbar from '@/components/Navbar';

export default function CostEstimatorPage() {
    const states = getAllStates();
    const [inputs, setInputs] = useState({
        stateSlug: 'florida',
        miles: 300,
        escortCount: 2,
        policeCount: 0,
        isWeekend: false,
    });

    const rates = {
        escort: 2.25,
        police: 125, // hourly
        admin: 150,
    };

    const escortTotal = inputs.miles * inputs.escortCount * rates.escort;
    const policeTotal = inputs.policeCount * 8 * rates.police; // assume 8h
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
                            <p className="text-[10px] text-gray-500 mt-2 italic">*Based on current market averages for {inputs.stateSlug.toUpperCase()}. Actual rates vary by vendor.</p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
