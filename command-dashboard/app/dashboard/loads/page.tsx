"use client";

import { Phone, MapPin, Calendar, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

interface Load {
    id: string;
    origin: string;
    destination: string;
    date: string;
    value: number;
    status: 'pending' | 'confirmed' | 'on-route' | 'completed';
    positions: string[];
    broker: string;
    transcript?: string;
}

const MOCK_LOADS: Load[] = [
    {
        id: 'LD-2401',
        origin: 'Atlanta, GA',
        destination: 'Jacksonville, FL',
        date: '2026-02-15',
        value: 3200,
        status: 'confirmed',
        positions: ['Lead', 'Chase'],
        broker: 'Nationwide Logistics',
        transcript: 'Need lead and chase for Class A wide load...'
    },
    {
        id: 'LD-2402',
        origin: 'Savannah, GA',
        destination: 'Miami, FL',
        date: '2026-02-16',
        value: 4500,
        status: 'on-route',
        positions: ['Lead', 'Chase', 'High Pole'],
        broker: 'Southern Transport Co.'
    },
    {
        id: 'LD-2403',
        origin: 'Augusta, GA',
        destination: 'Tampa, FL',
        date: '2026-02-17',
        value: 2800,
        status: 'pending',
        positions: ['Lead'],
        broker: 'Express Escort Services',
        transcript: 'AI captured: Single wide load, need experienced lead...'
    }
];

const statusConfig = {
    'pending': { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: AlertCircle },
    'confirmed': { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: CheckCircle2 },
    'on-route': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    'completed': { color: 'text-slate-400', bg: 'bg-slate-400/10', icon: CheckCircle2 }
};

export default function LoadsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Load Intake & Dispatch</h1>
                    <p className="text-slate-400 mt-1">AI-captured loads via Voice Rail</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                        Filter
                    </button>
                    <button className="px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors">
                        + Manual Entry
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Pending</div>
                    <div className="text-2xl font-bold text-yellow-400 mt-1">12</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Confirmed</div>
                    <div className="text-2xl font-bold text-blue-400 mt-1">8</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">On Route</div>
                    <div className="text-2xl font-bold text-emerald-500 mt-1">5</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">24h Revenue</div>
                    <div className="text-2xl font-bold text-white mt-1">$18.2k</div>
                </div>
            </div>

            {/* Loads Table */}
            <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Load ID</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Route</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Positions</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {MOCK_LOADS.map((load) => {
                                const StatusIcon = statusConfig[load.status].icon;
                                return (
                                    <tr key={load.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-white font-semibold">{load.id}</span>
                                                {load.transcript && (
                                                    <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">AI</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                <span className="text-white">{load.origin}</span>
                                                <span className="text-slate-500">→</span>
                                                <span className="text-white">{load.destination}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {load.date}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                                                <DollarSign className="w-4 h-4" />
                                                {load.value.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                {load.positions.map((pos) => (
                                                    <span key={pos} className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded">
                                                        {pos}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig[load.status].bg}`}>
                                                <StatusIcon className={`w-3.5 h-3.5 ${statusConfig[load.status].color}`} />
                                                <span className={`text-xs font-medium ${statusConfig[load.status].color} uppercase`}>
                                                    {load.status.replace('-', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button className="text-blue-400 hover:text-blue-300 transition-colors">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Voice Rail Integration Notice */}
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-400/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                        <h3 className="text-white font-semibold">Voice Rail Active</h3>
                        <p className="text-slate-300 text-sm mt-1">
                            AI is monitoring missed calls and auto-capturing load details. Loads marked with "AI" badge were intake via Voice Rail.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
