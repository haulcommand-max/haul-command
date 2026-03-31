"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, PhoneForwarded, BarChart3, Globe } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

/**
 * Enterprise Vapi Control Tower
 * Manages the global allocation, kill-switches, and specific country overrides.
 */

// WARNING: Component must be conditionally gated by 'vapi_voice_ai' feature flag at the Route level.
export default function VapiControlTower() {
    const supabase = createClient();
    const [globalKillSwitch, setGlobalKillSwitch] = useState(false); // TRUE = voice is halted
    const [capacity, setCapacity] = useState(1); // Simultaneous outbound
    const [countries, setCountries] = useState<any[]>([]);

    useEffect(() => {
        // Fetch current compliance profiles as overrides
        async function fetchState() {
            const { data } = await supabase.from('country_compliance_profiles').select('*').order('country_code');
            if (data) setCountries(data);
        }
        fetchState();
    }, []);

    const toggleKillSwitch = async () => {
        setGlobalKillSwitch(!globalKillSwitch);
        // Persist to some admin settings row (mocked for UI logic)
    };

    const updateCountryOutbound = async (countryCode: string, allowed: boolean) => {
        setCountries(prev => prev.map(c => c.country_code === countryCode ? { ...c, outbound_allowed: allowed } : c));
        await supabase.from('country_compliance_profiles')
            .update({ outbound_allowed: allowed })
            .eq('country_code', countryCode);
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-white max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <PhoneForwarded className="text-emerald-400" />
                        Vapi Global Interconnect Operations
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        AI inbound/outbound mesh controls across 25 global markets.
                    </p>
                </div>
                <button aria-label="Interactive Button"
                    onClick={toggleKillSwitch}
                    className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition-colors ${globalKillSwitch ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}
                >
                    <ShieldAlert size={18} />
                    {globalKillSwitch ? 'KILL SWITCH ENGAGED' : 'ENGAGE MASTER KILL SWITCH'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <h3 className="text-zinc-400 text-xs font-semibold uppercase mb-1">Live Inbound Capacity</h3>
                    <div className="text-3xl font-light text-emerald-400">Unlimited</div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <h3 className="text-zinc-400 text-xs font-semibold uppercase mb-1">Max Outbound Parallel</h3>
                    <div className="flex items-center gap-4 mt-2">
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={capacity}
                            onChange={(e) => setCapacity(parseInt(e.target.value))}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xl font-bold font-mono">{capacity}</span>
                    </div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <h3 className="text-zinc-400 text-xs font-semibold uppercase mb-1">Voice Quality Profile</h3>
                    <select className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm mt-1">
                        <option>Premium Alpha (Sales/Support)</option>
                        <option>Standard (Profile Claim)</option>
                        <option>Lite (Ping/Verification)</option>
                    </select>
                </div>
            </div>

            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Globe size={18} />
                Market Compliance Overrides
            </h3>

            <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-900/50 sticky top-0">
                        <tr>
                            <th className="p-3 text-zinc-400 font-medium">Market</th>
                            <th className="p-3 text-zinc-400 font-medium">Consent Rule</th>
                            <th className="p-3 text-zinc-400 font-medium">Outbound Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {countries.length > 0 ? countries.map(country => (
                            <tr key={country.country_code} className="hover:bg-zinc-900/50">
                                <td className="p-3 font-semibold">{country.country_code} - {country.region_name}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs ${country.call_recording_consent === 'strict_ban' ? 'bg-red-500/10 text-red-400' :
                                            'bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                        {country.call_recording_consent.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={country.outbound_allowed}
                                            onChange={(e) => updateCountryOutbound(country.country_code, e.target.checked)}
                                            className="form-checkbox text-blue-500 bg-zinc-800 border-zinc-700 rounded"
                                            disabled={globalKillSwitch}
                                        />
                                        <span className={country.outbound_allowed ? 'text-zinc-200' : 'text-zinc-600'}>
                                            {country.outbound_allowed ? 'Allowed' : 'Halted'}
                                        </span>
                                    </label>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-zinc-500 italic">No markets loaded. Verify Supabase tables.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
