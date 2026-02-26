
"use client";

import React, { useState, useEffect } from 'react';
import { EscortCostEstimator, EscortCostRequest, EscortCostEstimate } from '@/lib/logic/escort_cost_estimator';
import { ConfidenceMonitor } from './ConfidenceMonitor';
import { EscortCostResult } from './EscortCostResult';

export default function EscortCalculator() {
    const [request, setRequest] = useState<EscortCostRequest>({
        miles: 0,
        region: 'southeast',
        escortType: 'pilot_car',
        billingMode: 'per_mile',
        positions: { leadCount: 0, chaseCount: 0, highPoleCount: 0, steerCount: 0 },
        policeRequired: false,
        routeSurveyRequired: false,
        nightOps: false,
        weekend: false,
        afterHours: false
    });

    const [estimate, setEstimate] = useState<EscortCostEstimate | null>(null);

    // Auto-calculate on change
    useEffect(() => {
        if (request.miles > 0) {
            const result = EscortCostEstimator.calculate(request);
            setEstimate(result);
        } else {
            setEstimate(null);
        }
    }, [request]);

    const handleChange = (field: keyof EscortCostRequest, value: any) => {
        setRequest(prev => ({ ...prev, [field]: value }));
    };

    const handlePositionChange = (field: keyof EscortCostRequest['positions'], value: number) => {
        setRequest(prev => ({
            ...prev,
            positions: { ...prev.positions, [field]: value }
        }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-w-7xl mx-auto">
            {/* LEFT: Inputs */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Route & Config</h2>

                    {/* Miles */}
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-1">Estimated Miles</label>
                        <input
                            type="number"
                            className="w-full bg-black/50 border border-white/10 rounded p-2 text-white"
                            value={request.miles || ''}
                            onChange={(e) => handleChange('miles', Number(e.target.value))}
                            placeholder="e.g. 450"
                        />
                    </div>

                    {/* Region */}
                    <div className="mb-4">
                        <label className="block text-gray-400 text-sm mb-1">Region</label>
                        <select
                            className="w-full bg-black/50 border border-white/10 rounded p-2 text-white"
                            value={request.region}
                            onChange={(e) => handleChange('region', e.target.value)}
                        >
                            <option value="southeast">Southeast</option>
                            <option value="midwest">Midwest</option>
                            <option value="northeast">Northeast</option>
                            <option value="southwest">Southwest</option>
                            <option value="west_coast">West Coast</option>
                            <option value="canada">Canada</option>
                        </select>
                    </div>

                    {/* Positions */}
                    <div className="mb-4 space-y-2">
                        <label className="block text-gray-400 text-sm mb-1">Escort Lineup</label>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">Lead Cars</span>
                            <input type="number" className="w-16 bg-black/50 border border-white/10 rounded p-1 text-white text-center"
                                value={request.positions.leadCount} onChange={(e) => handlePositionChange('leadCount', Number(e.target.value))} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300">Chase Cars</span>
                            <input type="number" className="w-16 bg-black/50 border border-white/10 rounded p-1 text-white text-center"
                                value={request.positions.chaseCount} onChange={(e) => handlePositionChange('chaseCount', Number(e.target.value))} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-yellow-400">High Pole</span>
                            <input type="number" className="w-16 bg-black/50 border border-white/10 rounded p-1 text-white text-center"
                                value={request.positions.highPoleCount} onChange={(e) => handlePositionChange('highPoleCount', Number(e.target.value))} />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={request.policeRequired} onChange={(e) => handleChange('policeRequired', e.target.checked)} className="accent-blue-500" />
                            <span className="text-gray-300">Police Required</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={request.routeSurveyRequired} onChange={(e) => handleChange('routeSurveyRequired', e.target.checked)} className="accent-blue-500" />
                            <span className="text-gray-300">Route Survey Required</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={request.nightOps} onChange={(e) => handleChange('nightOps', e.target.checked)} className="accent-purple-500" />
                            <span className="text-purple-300">Night Ops</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* CENTER: Results */}
            <div className="lg:col-span-5">
                <EscortCostResult estimate={estimate} loading={false} />
            </div>

            {/* RIGHT: Confidence */}
            <div className="lg:col-span-3">
                <ConfidenceMonitor request={request} />
            </div>
        </div>
    );
}
