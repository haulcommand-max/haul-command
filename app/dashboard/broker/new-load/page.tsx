import React from 'react';

export default function PostLoadForm() {
    return (
        <div className="min-h-screen bg-transparent text-white p-10 font-sans">
            <h1 className="text-4xl font-black uppercase text-white mb-2">Deploy Load Vector</h1>
            <p className="text-xl text-gray-400 mb-10 border-l-2 border-blue-500 pl-4">Inject a high-priority logistical operation directly into the load board for Tier-1 routing.</p>

            <form className="max-w-4xl bg-gray-900 border border-gray-800 p-8 space-y-6" action={async () => {
                'use server';
                // Handled via CheckoutGateway in prod
                console.log("Vector Deployed.");
            }}>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-mono text-gray-500 uppercase block mb-2">Origin City</label>
                        <input name="origin" className="w-full bg-gray-950 border border-gray-700 p-4 text-white focus:border-blue-500 outline-none" required />
                    </div>
                    <div>
                        <label className="text-xs font-mono text-gray-500 uppercase block mb-2">Destination City</label>
                        <input name="destination" className="w-full bg-gray-950 border border-gray-700 p-4 text-white focus:border-blue-500 outline-none" required />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-mono text-gray-500 uppercase block mb-2">Payload Description</label>
                    <textarea name="description" rows={4} className="w-full bg-gray-950 border border-gray-700 p-4 text-white focus:border-blue-500 outline-none" placeholder="Oversized transformer requiring bucket trucks and active escort." required></textarea>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-mono text-gray-500 uppercase block mb-2">Budget Target (USD)</label>
                        <input name="budget" type="number" className="w-full bg-gray-950 border border-gray-700 p-4 text-white focus:border-blue-500 outline-none font-mono" placeholder="4500" required />
                    </div>
                    <div>
                        <label className="text-xs font-mono text-gray-500 uppercase block mb-2">MSB Settlement Config</label>
                        <select className="w-full bg-gray-950 border border-gray-700 p-4 text-white focus:border-blue-500 outline-none font-mono">
                            <option value="STRIPE">Stripe / USD</option>
                            <option value="NOWPAYMENTS">Crypto (Stablecoin Conversion)</option>
                        </select>
                    </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest text-sm py-5 uppercase transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] mt-4">
                    INITIATE ESCROW & PUBLISH
                </button>
            </form>
        </div>
    );
}
