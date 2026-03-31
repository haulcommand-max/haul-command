'use client';

import React, { useState } from 'react';
import { Truck, ShieldAlert, Navigation, Settings2, ShieldCheck, CheckCircle2, ChevronRight, Calculator, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function InteractiveComplianceCalculator({ 
  regionName, 
  countryCode 
}: { 
  regionName: string;
  countryCode: string;
}) {
    const [dimensions, setDimensions] = useState({ width: 8.5, height: 13.5, length: 53, weight: 80000 });
    const [isCalculating, setIsCalculating] = useState(false);

    // Mock logic for compliance (in a real app, this reads from compliance_rules DB)
    const getCompliance = () => {
        const rules = [];
        let escorts = 0;
        let requiresPolice = false;
        let requiresPole = false;
        let flags = true;
        let banners = true;

        if (dimensions.width > 12) {
            escorts += 1;
            rules.push({ type: 'escort', text: '1 Front Escort Vehicle Required (Width > 12ft)' });
        }
        if (dimensions.width >= 14) {
            escorts += 1;
            rules.push({ type: 'escort', text: '1 Rear Escort Vehicle Required (Width >= 14ft)' });
        }
        if (dimensions.width >= 16) {
            requiresPolice = true;
            rules.push({ type: 'police', text: 'Police Escort Required for Extreme Width (>= 16ft)' });
        }
        if (dimensions.height >= 14.5) {
            requiresPole = true;
            rules.push({ type: 'pole', text: 'High Pole Pilot Car Required (Height >= 14.5ft)' });
        }
        if (dimensions.length > 90) {
            escorts = Math.max(escorts, 1);
            rules.push({ type: 'escort', text: 'Rear Steer / Escort Required (Length > 90ft)' });
        }
        if (dimensions.weight > 80000) {
            rules.push({ type: 'permit', text: 'Overweight Permit Required' });
        }

        if (rules.length === 0) {
            rules.push({ type: 'clear', text: 'Legal Dimensions - No Special Escorts Required' });
        }

        return { rules, escorts, requiresPolice, requiresPole, flags, banners };
    };

    const { rules, escorts, requiresPolice, requiresPole, flags, banners } = getCompliance();

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsCalculating(true);
        setTimeout(() => setIsCalculating(false), 600);
    };

    return (
        <div className="bg-hc-surface border border-hc-border rounded-2xl overflow-hidden shadow-2xl z-20 relative">
            <div className="p-6 border-b border-hc-border flex items-center justify-between bg-hc-surface-hover">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-hc-gold-500/10 flex items-center justify-center border border-hc-gold-500/20">
                        <Calculator className="w-5 h-5 text-hc-gold-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wide">Live Route & Compliance AI</h3>
                        <p className="text-xs text-hc-muted uppercase tracking-widest">{regionName} Regulatory Matrix</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12">
                {/* Inputs */}
                <div className="lg:col-span-5 p-6 border-b md:border-b-0 md:border-r border-hc-border bg-[#0a0a0a]">
                    <form onSubmit={handleCalculate} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-hc-muted uppercase tracking-wider">Width (ft)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    className="w-full bg-black border border-hc-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-hc-gold-500/50 outline-none transition-colors"
                                    value={dimensions.width}
                                    onChange={(e) => setDimensions({...dimensions, width: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-hc-muted uppercase tracking-wider">Height (ft)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    className="w-full bg-black border border-hc-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-hc-gold-500/50 outline-none transition-colors"
                                    value={dimensions.height}
                                    onChange={(e) => setDimensions({...dimensions, height: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-hc-muted uppercase tracking-wider">Length (ft)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-black border border-hc-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-hc-gold-500/50 outline-none transition-colors"
                                    value={dimensions.length}
                                    onChange={(e) => setDimensions({...dimensions, length: parseFloat(e.target.value) || 0})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-hc-muted uppercase tracking-wider">Weight (lbs)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-black border border-hc-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-hc-gold-500/50 outline-none transition-colors"
                                    value={dimensions.weight}
                                    onChange={(e) => setDimensions({...dimensions, weight: parseInt(e.target.value) || 0})}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-bold text-sm uppercase tracking-widest rounded-xl transition-all hover:shadow-gold-sm"
                        >
                            {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <Settings2 className="w-4 h-4 text-black" />}
                            Recalculate Constraints
                        </button>
                        <p className="text-[10px] text-hc-subtle text-center">Data algorithmically synced with local DOT requirements for {regionName}.</p>
                    </form>
                </div>

                {/* Outputs */}
                <div className="lg:col-span-7 p-6 space-y-6 relative">
                    {isCalculating && (
                        <div className="absolute inset-0 z-10 bg-hc-bg/80 backdrop-blur-sm flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-hc-gold-500 animate-spin" />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-black border border-hc-border rounded-xl text-center">
                            <span className="block text-2xl font-black text-white">{escorts}</span>
                            <span className="text-[10px] font-bold text-hc-muted uppercase tracking-widest">Escorts Reqd</span>
                        </div>
                        <div className="p-3 bg-black border border-hc-border rounded-xl text-center">
                            <span className={`block text-2xl font-black ${requiresPolice ? 'text-hc-danger' : 'text-hc-success'}`}>
                                {requiresPolice ? 'YES' : 'NO'}
                            </span>
                            <span className="text-[10px] font-bold text-hc-muted uppercase tracking-widest">Police Escort</span>
                        </div>
                        <div className="p-3 bg-black border border-hc-border rounded-xl text-center">
                            <span className={`block text-2xl font-black ${requiresPole ? 'text-hc-gold-500' : 'text-hc-success'}`}>
                                {requiresPole ? 'YES' : 'NO'}
                            </span>
                            <span className="text-[10px] font-bold text-hc-muted uppercase tracking-widest">High Pole</span>
                        </div>
                        <div className="p-3 bg-black border border-hc-border rounded-xl text-center">
                            <span className="block text-2xl font-black text-hc-success">
                                {flags && banners ? 'REQ' : 'NO'}
                            </span>
                            <span className="text-[10px] font-bold text-hc-muted uppercase tracking-widest">Flags/Banners</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-hc-muted uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-hc-success" /> Exact Requirements Checklist
                        </h4>
                        <ul className="space-y-2">
                            {rules.map((rule, idx) => (
                                <li key={idx} className="flex gap-3 p-3 bg-black border border-hc-border rounded-xl items-start">
                                    {rule.type === 'clear' ? (
                                        <CheckCircle2 className="w-4 h-4 text-hc-success flex-shrink-0 mt-0.5" />
                                    ) : rule.type === 'police' ? (
                                        <ShieldAlert className="w-4 h-4 text-hc-danger flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <Navigation className="w-4 h-4 text-hc-gold-500 flex-shrink-0 mt-0.5" />
                                    )}
                                    <span className="text-sm font-medium text-white">{rule.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-2">
                        <Link aria-label="Find Available Escorts"
                            href={`/directory?country=${countryCode}&region=${regionName.toUpperCase()}&escorts=${escorts}&pole=${requiresPole}`}
                            className="inline-flex items-center gap-2 px-5 py-2 border border-hc-gold-500/50 text-hc-gold-500 hover:bg-hc-gold-500 hover:text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                        >
                            Find Qualified Pilots Now <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
