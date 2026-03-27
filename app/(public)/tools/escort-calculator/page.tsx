'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import {
    Ruler, Weight, ArrowUpDown, MoveHorizontal, Search, X,
    ChevronRight, CheckCircle2, Loader2,
} from 'lucide-react';
import {
    HcIconPilotCarOperators, HcIconHeavyHaulTrucking, HcIconRouteSurveyors,
    HcIconBridgeClearance, HcIconPoliceEscorts, HcIconRoutePlanner,
    HcIconDirectory, HcIconLoadBoard, HcIconLegalCompliance,
    HcIconMap, HcIconVerified, HcIconUrgentServices, HcIconInspectionServices,
    HcIconInsurance,
} from '@/components/icons';

/* ═══════════════════════════════════════════════════════════════════
   ESCORT CALCULATOR — Route Readiness Command Module
   
   Mobile-first. Premium input groups. Live summary panel.
   Route state picker with search + chips. Intelligent results.
   ═══════════════════════════════════════════════════════════════════ */

// -- Types -------------------------------------------------------------------

interface EscortResult {
    jurisdiction_code: string; jurisdiction_name: string; country_code: string;
    dimension_type: string; threshold_value: number; threshold_unit: string;
    escorts_required: number; escort_positions: string[]; road_type: string;
    requires_height_pole: boolean; requires_police: boolean; requires_route_survey: boolean;
    requires_affidavit: boolean; authority_name: string; authority_url: string;
}
interface StateBreakdown {
    jurisdiction_code: string; jurisdiction_name: string; country_code: string;
    max_escorts: number; needs_height_pole: boolean; needs_police: boolean;
    needs_route_survey: boolean; needs_affidavit: boolean; positions: string[];
    authority_name: string; authority_url: string; rules: EscortResult[];
}

// -- Constants ---------------------------------------------------------------

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

// -- Helpers -----------------------------------------------------------------

function getComplexity(w: number, h: number, l: number, wt: number): { level: string; color: string; note: string } {
    const score = (w > 16 ? 3 : w > 12 ? 1 : 0) + (h > 16 ? 3 : h > 14.5 ? 1 : 0) + (l > 120 ? 3 : l > 80 ? 1 : 0) + (wt > 200000 ? 3 : wt > 100000 ? 1 : 0);
    if (score >= 8) return { level: 'SUPERLOAD', color: '#ef4444', note: 'Multiple escorts required in most states. Police and route surveys likely.' };
    if (score >= 4) return { level: 'HIGH', color: '#f59e0b', note: 'Escorts likely in most states. May need height poles.' };
    if (score >= 2) return { level: 'MODERATE', color: '#C6923A', note: 'Escorts may be needed depending on jurisdiction.' };
    return { level: 'STANDARD', color: '#22c55e', note: 'May not require escorts in many states.' };
}

// -- Component ---------------------------------------------------------------

export default function EscortCalculatorPage() {
    const supabase = createClient();
    const [width, setWidth] = useState(14);
    const [height, setHeight] = useState(15);
    const [length, setLength] = useState(100);
    const [weight, setWeight] = useState(80000);
    const [selectedStates, setSelectedStates] = useState<string[]>(['US-TX', 'US-FL']);
    const [results, setResults] = useState<StateBreakdown[]>([]);
    const [loading, setLoading] = useState(false);
    const [stateSearch, setStateSearch] = useState('');
    const [statePickerOpen, setStatePickerOpen] = useState(false);

    const filteredStates = US_STATES.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()) && !selectedStates.includes(s.code));
    const toggleState = (code: string) => setSelectedStates(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
    const complexity = useMemo(() => getComplexity(width, height, length, weight), [width, height, length, weight]);

    const handleCalculate = async () => {
        if (selectedStates.length === 0) return;
        setLoading(true); setResults([]);
        try {
            const { data, error } = await supabase.rpc('hc_calculate_route_escorts', {
                p_width: width, p_height: height, p_length: length, p_weight: weight, p_jurisdictions: selectedStates,
            });
            if (error) throw error;
            const grouped: Record<string, StateBreakdown> = {};
            for (const row of (data || [])) {
                const key = row.jurisdiction_code;
                if (!grouped[key]) {
                    grouped[key] = { jurisdiction_code: row.jurisdiction_code, jurisdiction_name: row.jurisdiction_name, country_code: row.country_code, max_escorts: 0, needs_height_pole: false, needs_police: false, needs_route_survey: false, needs_affidavit: false, positions: [], authority_name: row.authority_name, authority_url: row.authority_url, rules: [] };
                }
                grouped[key].rules.push(row);
                grouped[key].max_escorts = Math.max(grouped[key].max_escorts, row.escorts_required);
                if (row.requires_height_pole) grouped[key].needs_height_pole = true;
                if (row.requires_police) grouped[key].needs_police = true;
                if (row.requires_route_survey) grouped[key].needs_route_survey = true;
                if (row.requires_affidavit) grouped[key].needs_affidavit = true;
                for (const pos of row.escort_positions || []) { if (!grouped[key].positions.includes(pos)) grouped[key].positions.push(pos); }
            }
            for (const code of selectedStates) {
                if (!grouped[code]) { grouped[code] = { jurisdiction_code: code, jurisdiction_name: US_STATES.find(s => s.code === code)?.name || code, country_code: 'US', max_escorts: 0, needs_height_pole: false, needs_police: false, needs_route_survey: false, needs_affidavit: false, positions: [], authority_name: '', authority_url: '', rules: [] }; }
            }
            setResults(Object.values(grouped).sort((a, b) => selectedStates.indexOf(a.jurisdiction_code) - selectedStates.indexOf(b.jurisdiction_code)));
        } catch (err) { console.error('Calculator error:', err); } finally { setLoading(false); }
    };

    const totalEscorts = results.reduce((s, r) => s + r.max_escorts, 0);
    const statesNeedingEscorts = results.filter(r => r.max_escorts > 0).length;
    const hasResults = results.length > 0;

    return (
        <main className="flex-grow pb-20 md:pb-0">
            <style>{`
                /* ── Route Calculator Styles — Mobile First ── */
                .rc-layout { display: flex; flex-direction: column; gap: 0; }
                .rc-inputs { padding: 16px; }
                .rc-summary { padding: 16px; border-top: 1px solid rgba(255,255,255,0.06); }

                @media (min-width: 768px) {
                    .rc-layout { flex-direction: row; }
                    .rc-inputs { width: 400px; flex-shrink: 0; padding: 24px; border-right: 1px solid rgba(255,255,255,0.06); border-top: none; overflow-y: auto; max-height: calc(100vh - 3.5rem); }
                    .rc-summary { flex: 1; padding: 24px; overflow-y: auto; max-height: calc(100vh - 3.5rem); border-top: none; }
                }

                /* Premium slider styling */
                .rc-slider {
                    -webkit-appearance: none; appearance: none;
                    width: 100%; height: 6px; border-radius: 999px;
                    background: rgba(255,255,255,0.08);
                    outline: none; cursor: pointer;
                }
                .rc-slider::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    width: 22px; height: 22px; border-radius: 50%;
                    background: linear-gradient(135deg, #C6923A, #E0B05C);
                    border: 3px solid #0B0B0C;
                    box-shadow: 0 0 0 2px rgba(198,146,58,0.3), 0 2px 8px rgba(0,0,0,0.4);
                    cursor: grab;
                    transition: box-shadow 0.15s ease;
                }
                .rc-slider::-webkit-slider-thumb:hover {
                    box-shadow: 0 0 0 4px rgba(198,146,58,0.3), 0 4px 16px rgba(198,146,58,0.2);
                }
                .rc-slider::-moz-range-thumb {
                    width: 22px; height: 22px; border-radius: 50%;
                    background: linear-gradient(135deg, #C6923A, #E0B05C);
                    border: 3px solid #0B0B0C;
                    box-shadow: 0 0 0 2px rgba(198,146,58,0.3), 0 2px 8px rgba(0,0,0,0.4);
                    cursor: grab;
                }
                .rc-slider:active::-webkit-slider-thumb { cursor: grabbing; }

                /* State picker dropdown */
                .state-picker-dropdown {
                    position: absolute; top: 100%; left: 0; right: 0;
                    max-height: 200px; overflow-y: auto;
                    background: #111214; border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px; margin-top: 4px; z-index: 50;
                    scrollbar-width: thin; scrollbar-color: #333 transparent;
                }
            `}</style>

            {/* ── PAGE HEADER ── */}
            <div style={{ padding: '20px 16px 0', background: 'linear-gradient(180deg, rgba(198,146,58,0.04) 0%, transparent 100%)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.2em', background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.2)', padding: '3px 8px', borderRadius: 6 }}>Free Tool</span>
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.2em', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '3px 8px', borderRadius: 6 }}>120 countries</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(20px, 5vw, 32px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                        Route Escort Requirements
                    </h1>
                    <p style={{ fontSize: 13, color: '#8fa3b8', maxWidth: 480, lineHeight: 1.5, marginBottom: 16 }}>
                        Enter load dimensions and route — instantly see escort counts, height poles, police, and survey requirements per state.
                    </p>
                </div>
            </div>

            {/* ── TWO-COLUMN LAYOUT ── */}
            <div className="rc-layout" style={{ maxWidth: 1200, margin: '0 auto' }}>

                {/* ═══ LEFT COLUMN: Inputs ═══ */}
                <div className="rc-inputs">

                    {/* DIMENSION INPUTS — Premium Input Groups */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <HcIconHeavyHaulTrucking size={14} style={{ color: '#C6923A' }} /> Load Dimensions
                        </div>

                        {[
                            { label: 'Width', value: width, set: setWidth, min: 8, max: 30, step: 0.5, unit: 'ft', icon: MoveHorizontal, hint: 'Standard lane: 12 ft' },
                            { label: 'Height', value: height, set: setHeight, min: 13, max: 22, step: 0.5, unit: 'ft', icon: ArrowUpDown, hint: 'Standard clearance: 13.5 ft' },
                            { label: 'Length', value: length, set: setLength, min: 60, max: 200, step: 5, unit: 'ft', icon: Ruler, hint: 'Standard trailer: 53 ft' },
                            { label: 'Weight', value: weight, set: setWeight, min: 40000, max: 500000, step: 5000, unit: 'lbs', icon: Weight, hint: '80,000 lbs legal limit', fmt: true },
                        ].map(d => {
                            const Icon = d.icon;
                            const displayVal = d.fmt ? d.value.toLocaleString() : d.value;
                            return (
                                <div key={d.label} style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Icon style={{ width: 14, height: 14, color: '#5A6577' }} />
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#B0B8C4' }}>{d.label}</span>
                                        </div>
                                        <span style={{
                                            fontSize: 16, fontWeight: 900, color: '#C6923A',
                                            fontFamily: 'var(--font-mono, monospace)',
                                            background: 'rgba(198,146,58,0.08)',
                                            padding: '2px 10px', borderRadius: 8,
                                            border: '1px solid rgba(198,146,58,0.15)',
                                        }}>
                                            {displayVal} <span style={{ fontSize: 10, fontWeight: 600, color: '#8fa3b8' }}>{d.unit}</span>
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={d.min} max={d.max} step={d.step}
                                        value={d.value}
                                        onChange={e => d.set(Number(e.target.value))}
                                        className="rc-slider"
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                        <span style={{ fontSize: 9, color: '#3A4553' }}>{d.fmt ? d.min.toLocaleString() : d.min}</span>
                                        <span style={{ fontSize: 9, color: '#3A4553', fontStyle: 'italic' }}>{d.hint}</span>
                                        <span style={{ fontSize: 9, color: '#3A4553' }}>{d.fmt ? d.max.toLocaleString() : d.max}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* COMPLEXITY SIGNAL */}
                    <div style={{
                        padding: '10px 14px', borderRadius: 12, marginBottom: 20,
                        background: `${complexity.color}08`,
                        border: `1px solid ${complexity.color}20`,
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: `${complexity.color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <HcIconUrgentServices size={14} style={{ color: complexity.color }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 900, color: complexity.color, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                                {complexity.level} Complexity
                            </div>
                            <div style={{ fontSize: 10, color: '#8fa3b8', marginTop: 1 }}>{complexity.note}</div>
                        </div>
                    </div>

                    {/* ROUTE STATE PICKER */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <HcIconRoutePlanner size={14} style={{ color: '#C6923A' }} /> Route States
                        </div>

                        {/* Selected states as chips with route order */}
                        {selectedStates.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                {selectedStates.map((code, i) => {
                                    const state = US_STATES.find(s => s.code === code);
                                    return (
                                        <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                            <button
                                                onClick={() => toggleState(code)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                    padding: '5px 10px', borderRadius: 8,
                                                    background: 'rgba(198,146,58,0.12)',
                                                    border: '1px solid rgba(198,146,58,0.25)',
                                                    color: '#E0B05C', fontSize: 11, fontWeight: 700,
                                                    cursor: 'pointer', transition: 'all 0.15s',
                                                    minHeight: 32,
                                                }}
                                            >
                                                <span style={{ fontSize: 8, fontWeight: 900, color: '#5A6577', background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: 4 }}>{i + 1}</span>
                                                {state?.name}
                                                <X style={{ width: 10, height: 10, color: '#8fa3b8' }} />
                                            </button>
                                            {i < selectedStates.length - 1 && (
                                                <span style={{ color: '#3A4553', margin: '0 2px', fontSize: 10 }}>→</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* State search input */}
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '0 12px', height: 44,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 10,
                            }}>
                                <Search style={{ width: 14, height: 14, color: '#5A6577', flexShrink: 0 }} />
                                <input
                                    type="text"
                                    placeholder="Add states to your route..."
                                    value={stateSearch}
                                    onChange={e => { setStateSearch(e.target.value); setStatePickerOpen(true); }}
                                    onFocus={() => setStatePickerOpen(true)}
                                    style={{
                                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                        color: 'white', fontSize: 13,
                                    }}
                                />
                                {stateSearch && (
                                    <button onClick={() => { setStateSearch(''); setStatePickerOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        <X style={{ width: 14, height: 14, color: '#5A6577' }} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown results */}
                            {statePickerOpen && stateSearch && filteredStates.length > 0 && (
                                <div className="state-picker-dropdown">
                                    {filteredStates.slice(0, 10).map(s => (
                                        <button
                                            key={s.code}
                                            onClick={() => { toggleState(s.code); setStateSearch(''); setStatePickerOpen(false); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                width: '100%', padding: '10px 14px',
                                                background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                color: '#B0B8C4', fontSize: 13, fontWeight: 500,
                                                cursor: 'pointer', textAlign: 'left',
                                                transition: 'background 0.1s',
                                                minHeight: 44,
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(198,146,58,0.06)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            {s.name}
                                            <span style={{ fontSize: 9, color: '#5A6577' }}>{s.code}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PRIMARY CTA */}
                    <button
                        onClick={handleCalculate}
                        disabled={loading || selectedStates.length === 0}
                        style={{
                            width: '100%', minHeight: 52, borderRadius: 14,
                            background: selectedStates.length === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #C6923A 0%, #E0B05C 50%, #C6923A 100%)',
                            color: selectedStates.length === 0 ? '#5A6577' : '#000',
                            border: 'none', cursor: selectedStates.length === 0 ? 'not-allowed' : 'pointer',
                            fontSize: 13, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: selectedStates.length > 0 ? '0 4px 24px rgba(198,146,58,0.3)' : 'none',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? (
                            <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Analyzing {selectedStates.length} States...</>
                        ) : (
                            <><HcIconPilotCarOperators size={18} style={{ color: '#000' }} /> Check Route Requirements</>
                        )}
                    </button>

                    {/* Trust signals */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', justifyContent: 'center', marginTop: 12 }}>
                        {[
                            { icon: HcIconMap, text: '120 countries' },
                            { icon: HcIconLegalCompliance, text: 'Jurisdiction-aware' },
                            { icon: HcIconVerified, text: 'No signup needed' },
                        ].map(({ icon: Icon, text }) => (
                            <span key={text} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#5A6577', fontWeight: 600 }}>
                                <Icon size={10} style={{ color: '#5A6577' }} /> {text}
                            </span>
                        ))}
                    </div>
                </div>

                {/* ═══ RIGHT COLUMN: Live Summary + Results ═══ */}
                <div className="rc-summary">

                    {/* LIVE SUMMARY PANEL — always visible */}
                    <div style={{
                        padding: '14px 16px', borderRadius: 14, marginBottom: 20,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#5A6577', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>
                            Route Summary
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
                            {[
                                { label: 'Width', value: `${width} ft`, warn: width > 14 },
                                { label: 'Height', value: `${height} ft`, warn: height > 14.5 },
                                { label: 'Length', value: `${length} ft`, warn: length > 100 },
                                { label: 'Weight', value: `${weight.toLocaleString()} lbs`, warn: weight > 105500 },
                            ].map(({ label, value, warn }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, background: warn ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${warn ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)'}` }}>
                                    <span style={{ fontSize: 10, color: '#5A6577', fontWeight: 600 }}>{label}</span>
                                    <span style={{ fontSize: 12, fontWeight: 800, color: warn ? '#f59e0b' : 'white', fontFamily: 'var(--font-mono, monospace)' }}>{value}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8fa3b8' }}>
                            <HcIconRoutePlanner size={12} style={{ color: '#C6923A' }} />
                            <span style={{ fontWeight: 600 }}>Route:</span>
                            {selectedStates.length > 0 ? (
                                <span>{selectedStates.map(c => US_STATES.find(s => s.code === c)?.name).join(' → ')}</span>
                            ) : (
                                <span style={{ color: '#3A4553', fontStyle: 'italic' }}>No states selected</span>
                            )}
                        </div>
                        {/* Potential flags preview */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {width > 14 && <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.15)' }}>⚠ Overwidth</span>}
                            {height > 14.5 && <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.15)' }}>⚠ Overheight</span>}
                            {length > 100 && <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.15)' }}>⚠ Overlength</span>}
                            {weight > 105500 && <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.15)' }}>⚠ Overweight</span>}
                        </div>
                    </div>

                    {/* EMPTY STATE — Intelligent preview */}
                    {!hasResults && !loading && (
                        <div style={{
                            padding: 24, borderRadius: 16,
                            border: '1px dashed rgba(198,146,58,0.2)',
                            background: 'rgba(198,146,58,0.02)',
                            textAlign: 'center',
                        }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(198,146,58,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                <HcIconInspectionServices size={28} style={{ color: '#C6923A' }} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 6 }}>
                                Your Route Report Will Appear Here
                            </div>
                            <div style={{ fontSize: 12, color: '#8fa3b8', maxWidth: 300, margin: '0 auto', lineHeight: 1.5, marginBottom: 16 }}>
                                Set your load dimensions, select route states, and hit <strong style={{ color: '#C6923A' }}>Check Route Requirements</strong> to see:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 260, margin: '0 auto', textAlign: 'left' }}>
                                {[
                                    { icon: HcIconPilotCarOperators, text: 'Escort count per state' },
                                    { icon: HcIconBridgeClearance, text: 'Height pole requirements' },
                                    { icon: HcIconPoliceEscorts, text: 'Police escort flags' },
                                    { icon: HcIconRouteSurveyors, text: 'Route survey needs' },
                                ].map(({ icon: Icon, text }) => (
                                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#B0B8C4' }}>
                                        <Icon size={14} style={{ color: '#C6923A', flexShrink: 0 }} />
                                        {text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* LOADING STATE */}
                    {loading && (
                        <div style={{
                            padding: 40, borderRadius: 16,
                            border: '1px solid rgba(198,146,58,0.15)',
                            background: 'rgba(198,146,58,0.03)',
                            textAlign: 'center',
                        }}>
                            <Loader2 style={{ width: 32, height: 32, color: '#C6923A', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Scanning {selectedStates.length} jurisdictions...
                            </div>
                            <div style={{ fontSize: 11, color: '#5A6577', marginTop: 4 }}>
                                Checking escort rules for {width}′W × {height}′H × {length}′L at {weight.toLocaleString()} lbs
                            </div>
                        </div>
                    )}

                    {/* ═══ RESULTS ═══ */}
                    {hasResults && (
                        <>
                            {/* Summary Stats */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16,
                            }}>
                                {[
                                    { label: 'Total Escorts', value: totalEscorts, color: '#C6923A' },
                                    { label: 'States w/ Escorts', value: statesNeedingEscorts, color: statesNeedingEscorts > 0 ? '#f59e0b' : '#22c55e' },
                                    { label: 'Height Poles', value: results.filter(r => r.needs_height_pole).length, color: results.some(r => r.needs_height_pole) ? '#ef4444' : '#22c55e' },
                                    { label: 'Police Required', value: results.filter(r => r.needs_police).length, color: results.some(r => r.needs_police) ? '#ef4444' : '#22c55e' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} style={{
                                        padding: '12px 14px', borderRadius: 12,
                                        background: `${color}06`,
                                        border: `1px solid ${color}18`,
                                        textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: 24, fontWeight: 900, color, fontFamily: 'var(--font-mono, monospace)' }}>{value}</div>
                                        <div style={{ fontSize: 9, fontWeight: 700, color: '#5A6577', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* State-by-State Breakdown */}
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#5A6577', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>
                                STATE-BY-STATE BREAKDOWN
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                                {results.map((state, idx) => (
                                    <div key={state.jurisdiction_code} style={{
                                        padding: '14px 16px', borderRadius: 14,
                                        background: state.max_escorts > 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                                        border: `1px solid ${state.max_escorts > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                                    }}>
                                        {/* Header */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: state.rules.length > 0 ? 10 : 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 12, fontWeight: 900, color: '#C6923A', width: 20, textAlign: 'center' }}>{idx + 1}</span>
                                                <div>
                                                    <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{state.jurisdiction_name}</h3>
                                                    <p style={{ fontSize: 10, color: '#5A6577' }}>{state.authority_name || 'State DOT'}</p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                                                {state.max_escorts === 0 ? (
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '3px 8px', borderRadius: 6 }}>
                                                        <CheckCircle2 style={{ width: 10, height: 10, display: 'inline', verticalAlign: '-1px', marginRight: 3 }} />
                                                        WITHIN LIMITS
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span style={{ fontSize: 11, fontWeight: 900, color: '#C6923A', background: 'rgba(198,146,58,0.12)', padding: '3px 10px', borderRadius: 6 }}>
                                                            {state.max_escorts} {state.max_escorts === 1 ? 'ESCORT' : 'ESCORTS'}
                                                        </span>
                                                        {state.needs_height_pole && <span style={{ fontSize: 9, fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '3px 6px', borderRadius: 6 }}>HP</span>}
                                                        {state.needs_police && <span style={{ fontSize: 9, fontWeight: 800, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '3px 6px', borderRadius: 6 }}>POLICE</span>}
                                                        {state.needs_route_survey && <span style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 6px', borderRadius: 6 }}>SURVEY</span>}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rule breakdown grid */}
                                        {state.rules.length > 0 && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                {state.rules.map((rule, ri) => (
                                                    <div key={ri} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.3)' }}>
                                                        <div style={{ fontSize: 9, fontWeight: 700, color: '#5A6577', textTransform: 'uppercase' }}>{rule.dimension_type}</div>
                                                        <div style={{ fontSize: 12, fontWeight: 800, color: 'white', marginTop: 2 }}>≥ {rule.threshold_value}{rule.threshold_unit === 'ft' ? "′" : ` ${rule.threshold_unit}`}</div>
                                                        <div style={{ fontSize: 9, fontWeight: 600, color: '#C6923A', marginTop: 2 }}>{rule.escort_positions?.join(' + ')}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* NEXT ACTIONS */}
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#5A6577', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>
                                Next Steps
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                {[
                                    { href: '/directory', label: 'Find Escorts', desc: 'On this route', icon: HcIconDirectory, color: '#C6923A' },
                                    { href: '/loads/post', label: 'Post a Load', desc: 'Get matched', icon: HcIconLoadBoard, color: '#22c55e' },
                                    { href: '/tools/rate-lookup', label: 'Check Rates', desc: 'Market pricing', icon: HcIconInsurance, color: '#3b82f6' },
                                    { href: '/escort-requirements', label: 'Full Rules', desc: 'State details', icon: HcIconLegalCompliance, color: '#a855f7' },
                                ].map(({ href, label, desc, icon: Icon, color }) => (
                                    <Link key={href} href={href} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '12px 14px', borderRadius: 12,
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        textDecoration: 'none', transition: 'all 0.15s',
                                        minHeight: 48,
                                    }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={16} style={{ color }} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{label}</div>
                                            <div style={{ fontSize: 9, color: '#5A6577' }}>{desc}</div>
                                        </div>
                                        <ChevronRight style={{ width: 12, height: 12, color: '#3A4553', marginLeft: 'auto' }} />
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </main>
    );
}
