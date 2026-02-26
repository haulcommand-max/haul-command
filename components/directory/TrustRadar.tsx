"use client";

import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

interface TrustRadarProps {
    data: {
        reliability: number;
        responsiveness: number;
        integrity: number;
        customer_signal: number;
        compliance: number;
        market_fit: number;
    };
}

export function TrustRadar({ data }: TrustRadarProps) {
    // Format data for Recharts
    const chartData = [
        { subject: 'Reliability', A: data.reliability, fullMark: 100 },
        { subject: 'Respond', A: data.responsiveness, fullMark: 100 },
        { subject: 'Integrity', A: data.integrity, fullMark: 100 },
        { subject: 'Customer', A: data.customer_signal, fullMark: 100 },
        { subject: 'Compliance', A: data.compliance, fullMark: 100 },
        { subject: 'Market Fit', A: data.market_fit, fullMark: 100 },
    ];

    return (
        <div className="w-full h-64 sm:h-80 bg-hc-command-black border border-hc-industrial-charcoal rounded-3xl p-4 relative overflow-hidden group">
            {/* Background grid accent */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-xs font-bold text-hc-charcoal-text uppercase tracking-widest">
                    Trust Dimension Analysis
                </h3>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                    <PolarGrid stroke="#2A2A2A" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#7A7A7A', fontSize: 10, fontWeight: 600, textAnchor: 'middle' }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#F1A91B' }}
                    />
                    <Radar
                        name="Trust Score"
                        dataKey="A"
                        stroke="#F1A91B"
                        strokeWidth={2}
                        fill="#F1A91B"
                        fillOpacity={0.2}
                        className="drop-shadow-[0_0_10px_rgba(241,169,27,0.3)]"
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
