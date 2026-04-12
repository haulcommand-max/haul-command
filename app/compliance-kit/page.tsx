import React from 'react';
import { RouteIQVisualizer } from '@/app/components/RouteIQVisualizer';

export default function CompliancePermitConcierge() {
    return (
        <main className=" bg-transparent text-white p-10 font-sans selection:bg-blue-500/30">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-5xl font-black uppercase text-white tracking-tighter mb-4">Permit Operations Hub</h1>
                <p className="text-gray-400 font-mono tracking-widest text-sm mb-10 border-l-2 border-blue-500 pl-4">
                    Instantly calculate multi-state routing fees. Fully integrated with Haul Command Escrow networks.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-gray-900 border border-gray-800 p-8 shadow-2xl">
                        <h3 className="text-xl font-bold uppercase tracking-widest text-blue-400 mb-6 border-b border-gray-800 pb-2">Vector Entry</h3>
                        <form className="space-y-6" action={async () => {
                            'use server';
                            console.log("Vector payload calculated.");
                            // Connects payload to CheckOut gateway in prod
                        }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-mono text-gray-500 uppercase">Origin State</label>
                                    <input type="text" className="w-full bg-gray-950 border border-gray-700 p-3 text-white focus:border-blue-500 outline-none" defaultValue="TX" />
                                </div>
                                <div>
                                    <label className="text-xs font-mono text-gray-500 uppercase">Destination State</label>
                                    <input type="text" className="w-full bg-gray-950 border border-gray-700 p-3 text-white focus:border-blue-500 outline-none" defaultValue="CO" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-mono text-gray-500 uppercase">Axle Width (Feet)</label>
                                <input type="number" className="w-full bg-gray-950 border border-gray-700 p-3 text-white focus:border-blue-500 outline-none" defaultValue={14.5} step="0.1" />
                            </div>
                            <div className="bg-blue-950/20 p-4 border border-blue-900/50">
                                <h4 className="font-mono text-sm text-blue-400">ESTIMATED ROUTE IQ FEE: <span className="text-white text-lg font-bold ml-2">$340.00</span></h4>
                            </div>
                            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest text-sm py-4 uppercase transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)]">
                                SECURE COMPLIANCE PACKET
                            </button>
                        </form>
                    </div>

                    <div className="space-y-6">
                        <RouteIQVisualizer origin="Houston, TX" destination="Denver, CO" />
                        
                        <div className="bg-gray-900 border border-red-900/30 p-6">
                            <h3 className="text-red-500 font-bold uppercase text-sm mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                Restricted Curfew Active
                            </h3>
                            <p className="text-sm text-gray-400">Route IQ has identified a major metropolitan delay at I-25 Northbound from 0600 - 0900 local time. Dispatch must hold.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}