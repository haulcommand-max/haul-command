'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

interface JurisdictionOption {
    jurisdiction_code: string;
    jurisdiction_name: string;
    country_code: string;
}

interface EscortResult {
    jurisdiction_code: string;
    jurisdiction_name: string;
    country_code: string;
    dimension_type: string;
    threshold_value: number;
    threshold_unit: string;
    escorts_required: number;
    escort_positions: string[];
    road_type: string;
    requires_height_pole: boolean;
    requires_police: boolean;
    requires_route_survey: boolean;
    requires_affidavit: boolean;
    authority_name: string;
    authority_url: string;
}

interface StateBreakdown {
    jurisdiction_code: string;
    jurisdiction_name: string;
    country_code: string;
    max_escorts: number;
    needs_height_pole: boolean;
    needs_police: boolean;
    needs_route_survey: boolean;
    needs_affidavit: boolean;
    positions: string[];
    authority_name: string;
    authority_url: string;
    rules: EscortResult[];
}

const US_STATES = [
    { code: 'US-AL', name: 'Alabama' }, { code: 'US-AK', name: 'Alaska' }, { code: 'US-AZ', name: 'Arizona' },
    { code: 'US-AR', name: 'Arkansas' }, { code: 'US-CA', name: 'California' }, { code: 'US-CO', name: 'Colorado' },
    { code: 'US-CT', name: 'Connecticut' }, { code: 'US-DE', name: 'Delaware' }, { code: 'US-FL', name: 'Florida' },
    { code: 'US-GA', name: 'Georgia' }, { code: 'US-HI', name: 'Hawaii' }, { code: 'US-ID', name: 'Idaho' },
    { code: 'US-IL', name: 'Illinois' }, { code: 'US-IN', name: 'Indiana' }, { code: 'US-IA', name: 'Iowa' },
    { code: 'US-KS', name: 'Kansas' }, { code: 'US-KY', name: 'Kentucky' }, { code: 'US-LA', name: 'Louisiana' },
    { code: 'US-ME', name: 'Maine' }, { code: 'US-MD', name: 'Maryland' }, { code: 'US-MA', name: 'Massachusetts' },
    { code: 'US-MI', name: 'Michigan' }, { code: 'US-MN', name: 'Minnesota' }, { code: 'US-MS', name: 'Mississippi' },
    { code: 'US-MO', name: 'Missouri' }, { code: 'US-MT', name: 'Montana' }, { code: 'US-NE', name: 'Nebraska' },
    { code: 'US-NV', name: 'Nevada' }, { code: 'US-NH', name: 'New Hampshire' }, { code: 'US-NJ', name: 'New Jersey' },
    { code: 'US-NM', name: 'New Mexico' }, { code: 'US-NY', name: 'New York' }, { code: 'US-NC', name: 'North Carolina' },
    { code: 'US-ND', name: 'North Dakota' }, { code: 'US-OH', name: 'Ohio' }, { code: 'US-OK', name: 'Oklahoma' },
    { code: 'US-OR', name: 'Oregon' }, { code: 'US-PA', name: 'Pennsylvania' }, { code: 'US-RI', name: 'Rhode Island' },
    { code: 'US-SC', name: 'South Carolina' }, { code: 'US-SD', name: 'South Dakota' }, { code: 'US-TN', name: 'Tennessee' },
    { code: 'US-TX', name: 'Texas' }, { code: 'US-UT', name: 'Utah' }, { code: 'US-VT', name: 'Vermont' },
    { code: 'US-VA', name: 'Virginia' }, { code: 'US-WA', name: 'Washington' }, { code: 'US-WV', name: 'West Virginia' },
    { code: 'US-WI', name: 'Wisconsin' }, { code: 'US-WY', name: 'Wyoming' },
];

export default function EscortCalculatorPage() {
    const [width, setWidth] = useState(14);
    const [height, setHeight] = useState(15);
    const [length, setLength] = useState(100);
    const [weight, setWeight] = useState(80000);
    const [selectedStates, setSelectedStates] = useState<string[]>(['US-TX', 'US-FL']);
    const [results, setResults] = useState<StateBreakdown[]>([]);
    const [loading, setLoading] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [email, setEmail] = useState('');
    const [emailSubmitted, setEmailSubmitted] = useState(false);
    const [stateSearch, setStateSearch] = useState('');

    const filteredStates = US_STATES.filter(s =>
        s.name.toLowerCase().includes(stateSearch.toLowerCase())
    );

    const toggleState = (code: string) => {
        setSelectedStates(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const handleCalculate = async () => {
        if (selectedStates.length === 0) return;
        setLoading(true);
        setResults([]);

        try {
            const { data, error } = await supabase.rpc('hc_calculate_route_escorts', {
                p_width: width,
                p_height: height,
                p_length: length,
                p_weight: weight,
                p_jurisdictions: selectedStates,
            });

            if (error) throw error;

            // Group by jurisdiction
            const grouped: Record<string, StateBreakdown> = {};
            for (const row of (data || [])) {
                const key = row.jurisdiction_code;
                if (!grouped[key]) {
                    grouped[key] = {
                        jurisdiction_code: row.jurisdiction_code,
                        jurisdiction_name: row.jurisdiction_name,
                        country_code: row.country_code,
                        max_escorts: 0,
                        needs_height_pole: false,
                        needs_police: false,
                        needs_route_survey: false,
                        needs_affidavit: false,
                        positions: [],
                        authority_name: row.authority_name,
                        authority_url: row.authority_url,
                        rules: [],
                    };
                }
                grouped[key].rules.push(row);
                grouped[key].max_escorts = Math.max(grouped[key].max_escorts, row.escorts_required);
                if (row.requires_height_pole) grouped[key].needs_height_pole = true;
                if (row.requires_police) grouped[key].needs_police = true;
                if (row.requires_route_survey) grouped[key].needs_route_survey = true;
                if (row.requires_affidavit) grouped[key].needs_affidavit = true;
                for (const pos of row.escort_positions || []) {
                    if (!grouped[key].positions.includes(pos)) grouped[key].positions.push(pos);
                }
            }

            // Add states with no matching rules (no escort needed)
            for (const code of selectedStates) {
                if (!grouped[code]) {
                    const stateName = US_STATES.find(s => s.code === code)?.name || code;
                    grouped[code] = {
                        jurisdiction_code: code,
                        jurisdiction_name: stateName,
                        country_code: 'US',
                        max_escorts: 0,
                        needs_height_pole: false,
                        needs_police: false,
                        needs_route_survey: false,
                        needs_affidavit: false,
                        positions: [],
                        authority_name: '',
                        authority_url: '',
                        rules: [],
                    };
                }
            }

            setResults(Object.values(grouped).sort((a, b) =>
                selectedStates.indexOf(a.jurisdiction_code) - selectedStates.indexOf(b.jurisdiction_code)
            ));
        } catch (err) {
            console.error('Calculator error:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalEscorts = results.reduce((sum, r) => sum + r.max_escorts, 0);
    const statesNeedingEscorts = results.filter(r => r.max_escorts > 0).length;
    const estimatedCostPerEscort = 175; // cents/mile avg
    const avgRouteDistance = 250; // miles per state
    const estimatedTotal = statesNeedingEscorts * avgRouteDistance * estimatedCostPerEscort / 100;

    const handleEmailSubmit = async () => {
        if (!email) return;
        await supabase.from('hc_compliance_card_downloads').insert({
            email,
            jurisdiction_code: selectedStates.join(','),
            card_type: 'route_analysis',
            source: 'calculator',
        });
        setEmailSubmitted(true);
        setShowEmail(false);
    };

    return (
        <>
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 py-16">
                {/* Hero */}
                <header className="mb-16">
                    <div className="flex items-center space-x-4 mb-4">
                        <span className="bg-accent text-black text-[10px] font-black px-2 py-0.5 rounded italic">FREE TOOL</span>
                        <span className="bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded italic">57 COUNTRIES</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter">
                        DO I NEED AN <span className="text-accent underline decoration-4 underline-offset-4">ESCORT?</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-3xl mt-4">
                        Enter your load dimensions and route — instantly see how many escorts you need in each state,
                        whether you need a height pole, police escort, or route survey. Covers all 57 countries.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Input Panel */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Dimensions Card */}
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-6">Load Dimensions</p>
                            <div className="space-y-5">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-gray-400">Width</span>
                                        <span className="text-accent font-black text-lg">{width}&apos;</span>
                                    </div>
                                    <input type="range" min="8" max="30" step="0.5" className="w-full accent-accent h-2"
                                        value={width} onChange={(e) => setWidth(Number(e.target.value))} />
                                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                        <span>8&apos; (Legal)</span><span>30&apos; (Superload)</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-gray-400">Height</span>
                                        <span className="text-accent font-black text-lg">{height}&apos;</span>
                                    </div>
                                    <input type="range" min="13" max="22" step="0.5" className="w-full accent-accent h-2"
                                        value={height} onChange={(e) => setHeight(Number(e.target.value))} />
                                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                        <span>13&apos; (Legal)</span><span>22&apos; (Super)</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-gray-400">Length</span>
                                        <span className="text-accent font-black text-lg">{length}&apos;</span>
                                    </div>
                                    <input type="range" min="60" max="200" step="5" className="w-full accent-accent h-2"
                                        value={length} onChange={(e) => setLength(Number(e.target.value))} />
                                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                        <span>60&apos;</span><span>200&apos;</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span className="text-gray-400">Weight</span>
                                        <span className="text-accent font-black text-lg">{weight.toLocaleString()} lbs</span>
                                    </div>
                                    <input type="range" min="40000" max="500000" step="5000" className="w-full accent-accent h-2"
                                        value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
                                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                        <span>40K</span><span>500K (Superload)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Route States */}
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-md">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-4">Route States (select in order)</p>
                            <input
                                type="text"
                                placeholder="Search states..."
                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-accent outline-none mb-4"
                                value={stateSearch}
                                onChange={(e) => setStateSearch(e.target.value)}
                            />
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
                                {filteredStates.map(s => (
                                    <button
                                        key={s.code}
                                        onClick={() => toggleState(s.code)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedStates.includes(s.code)
                                                ? 'bg-accent text-black'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                            {selectedStates.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-[10px] text-gray-500 font-black uppercase mb-2">Route Order ({selectedStates.length} states)</p>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedStates.map((code, i) => (
                                            <span key={code} className="flex items-center gap-1">
                                                <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-bold">
                                                    {US_STATES.find(s => s.code === code)?.name}
                                                </span>
                                                {i < selectedStates.length - 1 && <span className="text-gray-600">→</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleCalculate}
                            disabled={loading || selectedStates.length === 0}
                            className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg hover:bg-accent transition-all shadow-xl disabled:opacity-50"
                        >
                            {loading ? 'ANALYZING ROUTE...' : 'CALCULATE ESCORT REQUIREMENTS'}
                        </button>
                    </div>

                    {/* Results Panel */}
                    <div className="lg:col-span-8 space-y-8">
                        {results.length === 0 && !loading ? (
                            <div className="aspect-video bg-white/5 border border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center p-20 text-center">
                                <div className="text-6xl mb-6">🚛</div>
                                <p className="text-gray-500 uppercase tracking-widest font-black text-sm italic">
                                    Select your load dimensions & route states
                                </p>
                                <p className="text-gray-600 text-xs mt-2">Then hit Calculate to see every escort requirement on your route</p>
                            </div>
                        ) : loading ? (
                            <div className="aspect-video bg-white/5 border border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center p-20">
                                <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-6"></div>
                                <p className="text-gray-500 uppercase tracking-widest font-black text-sm italic">Scanning {selectedStates.length} jurisdictions...</p>
                            </div>
                        ) : (
                            <>
                                {/* Summary Panel */}
                                <div className="bg-black border border-white/10 rounded-[32px] p-10 relative overflow-hidden shadow-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none"></div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                                        <div>
                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Escorts</p>
                                            <p className="text-5xl font-black text-accent italic">{totalEscorts}</p>
                                            <p className="text-gray-500 text-xs mt-1">across {statesNeedingEscorts} states</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Height Poles</p>
                                            <p className="text-5xl font-black italic" style={{ color: results.some(r => r.needs_height_pole) ? '#ef4444' : '#22c55e' }}>
                                                {results.filter(r => r.needs_height_pole).length}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">states require HP</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Police Escorts</p>
                                            <p className="text-5xl font-black italic" style={{ color: results.some(r => r.needs_police) ? '#ef4444' : '#22c55e' }}>
                                                {results.filter(r => r.needs_police).length}
                                            </p>
                                            <p className="text-gray-500 text-xs mt-1">states require police</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Est. Escort Cost</p>
                                            <p className="text-5xl font-black text-white italic">${estimatedTotal.toLocaleString()}</p>
                                            <p className="text-gray-500 text-xs mt-1">@ $1.75/mi avg</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Per-State Breakdown */}
                                <div className="space-y-4">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">State-by-State Breakdown</p>
                                    {results.map((state, idx) => (
                                        <div key={state.jurisdiction_code}
                                            className={`border rounded-2xl p-6 transition-all ${state.max_escorts > 0
                                                    ? 'bg-white/5 border-white/10'
                                                    : 'bg-white/[0.02] border-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-accent font-black text-lg w-8">{idx + 1}</span>
                                                    <div>
                                                        <h3 className="text-white font-black text-lg">{state.jurisdiction_name}</h3>
                                                        <p className="text-gray-500 text-xs">{state.jurisdiction_code} • {state.authority_name || 'State DOT'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {state.max_escorts === 0 ? (
                                                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-black">
                                                            ✓ WITHIN LIMITS
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="bg-accent/20 text-accent px-3 py-1 rounded-lg text-sm font-black">
                                                                {state.max_escorts} {state.max_escorts === 1 ? 'ESCORT' : 'ESCORTS'}
                                                            </span>
                                                            {state.needs_height_pole && (
                                                                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-lg text-[10px] font-black">
                                                                    HEIGHT POLE
                                                                </span>
                                                            )}
                                                            {state.needs_police && (
                                                                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg text-[10px] font-black">
                                                                    POLICE
                                                                </span>
                                                            )}
                                                            {state.needs_route_survey && (
                                                                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg text-[10px] font-black">
                                                                    ROUTE SURVEY
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {state.rules.length > 0 && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-white/5">
                                                    {state.rules.map((rule, ri) => (
                                                        <div key={ri} className="bg-black/30 rounded-xl p-3">
                                                            <p className="text-[10px] text-gray-500 font-black uppercase">{rule.dimension_type}</p>
                                                            <p className="text-sm text-white font-bold mt-1">
                                                                ≥ {rule.threshold_value}{rule.threshold_unit === 'ft' ? "'" : rule.threshold_unit}
                                                            </p>
                                                            <p className="text-[10px] text-accent mt-1">
                                                                {rule.escort_positions?.join(' + ')}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Lead Capture CTA */}
                                {!emailSubmitted ? (
                                    <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-[32px] p-8">
                                        <div className="flex flex-col md:flex-row items-center gap-6">
                                            <div className="flex-grow">
                                                <h3 className="text-white font-black text-xl italic">Get the Full Route Report (PDF)</h3>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    Includes: detailed escort configs, authority contacts, estimated costs per state,
                                                    required certifications, and compliance checklist.
                                                </p>
                                            </div>
                                            {!showEmail ? (
                                                <button onClick={() => setShowEmail(true)}
                                                    className="bg-accent text-black px-8 py-4 rounded-xl font-black text-sm whitespace-nowrap hover:bg-white transition-all">
                                                    DOWNLOAD FREE PDF
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input type="email" placeholder="your@email.com"
                                                        className="bg-black border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:border-accent outline-none w-56"
                                                        value={email} onChange={(e) => setEmail(e.target.value)} />
                                                    <button onClick={handleEmailSubmit}
                                                        className="bg-accent text-black px-6 py-3 rounded-xl font-black text-sm hover:bg-white transition-all">
                                                        SEND
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-[32px] p-8 text-center">
                                        <p className="text-green-400 font-black text-xl">✓ Route Report Sent!</p>
                                        <p className="text-gray-400 text-sm mt-2">Check your email for the full PDF breakdown.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
