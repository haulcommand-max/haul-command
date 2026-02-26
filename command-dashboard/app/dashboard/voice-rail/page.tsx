"use client";

import { Phone, PhoneIncoming, PhoneMissed, Clock, MapPin, DollarSign, MessageSquare } from 'lucide-react';

interface VoiceCall {
    id: string;
    timestamp: string;
    phone: string;
    broker: string;
    duration: string;
    status: 'captured' | 'transferred' | 'missed' | 'voicemail';
    transcript: string;
    detected: {
        origin?: string;
        destination?: string;
        date?: string;
        positions?: string[];
    };
    revenue?: number;
}

const MOCK_CALLS: VoiceCall[] = [
    {
        id: 'CALL-8821',
        timestamp: '2026-02-13 14:23',
        phone: '+1 (404) 555-0182',
        broker: 'Nationwide Logistics',
        duration: '2:34',
        status: 'captured',
        transcript: 'Hey, I need a lead and chase for a wide load from Atlanta to Jacksonville on the 15th. Class A permit, about 14 feet wide...',
        detected: {
            origin: 'Atlanta, GA',
            destination: 'Jacksonville, FL',
            date: '2026-02-15',
            positions: ['Lead', 'Chase']
        },
        revenue: 3200
    },
    {
        id: 'CALL-8820',
        timestamp: '2026-02-13 11:45',
        phone: '+1 (912) 555-0234',
        broker: 'Southern Transport Co.',
        duration: '3:12',
        status: 'captured',
        transcript: 'Looking for full escort package - lead, chase, and high pole. Savannah to Miami, date is the 16th...',
        detected: {
            origin: 'Savannah, GA',
            destination: 'Miami, FL',
            date: '2026-02-16',
            positions: ['Lead', 'Chase', 'High Pole']
        },
        revenue: 4500
    },
    {
        id: 'CALL-8819',
        timestamp: '2026-02-13 09:12',
        phone: '+1 (706) 555-0156',
        broker: 'Unknown Caller',
        duration: '0:47',
        status: 'voicemail',
        transcript: 'AI left text-back message: "Driving right now. Send me the load details here."',
        detected: {}
    },
    {
        id: 'CALL-8818',
        timestamp: '2026-02-12 16:58',
        phone: '+1 (813) 555-0298',
        broker: 'Express Escort Services',
        duration: '1:23',
        status: 'transferred',
        transcript: 'Caller requested to speak with manager. Transferred to dispatch.',
        detected: {
            origin: 'Augusta, GA',
            destination: 'Tampa, FL'
        }
    }
];

const statusConfig = {
    'captured': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Captured', icon: PhoneIncoming },
    'transferred': { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Transferred', icon: Phone },
    'missed': { color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Missed', icon: PhoneMissed },
    'voicemail': { color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Text-Back Sent', icon: MessageSquare }
};

export default function VoiceRailPage() {
    const totalCaptured = MOCK_CALLS.filter(c => c.status === 'captured').length;
    const totalRevenue = MOCK_CALLS.reduce((sum, c) => sum + (c.revenue || 0), 0);
    const captureRate = (totalCaptured / MOCK_CALLS.length * 100).toFixed(0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Voice Rail Command</h1>
                    <p className="text-slate-400 mt-1">AI Load Intake & Missed Call Recovery</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-emerald-500 font-semibold">Voice Rail Active</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Calls Today</div>
                    <div className="text-2xl font-bold text-white mt-1">{MOCK_CALLS.length}</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Captured</div>
                    <div className="text-2xl font-bold text-emerald-500 mt-1">{totalCaptured}</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Capture Rate</div>
                    <div className="text-2xl font-bold text-blue-400 mt-1">{captureRate}%</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Revenue Captured</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">${(totalRevenue / 1000).toFixed(1)}k</div>
                </div>
            </div>

            {/* Call Log */}
            <div className="space-y-3">
                {MOCK_CALLS.map((call) => {
                    const StatusIcon = statusConfig[call.status].icon;
                    const hasDetectedInfo = Object.keys(call.detected).length > 0;

                    return (
                        <div key={call.id} className="bg-slate-900 rounded-lg border border-slate-800 p-5 hover:border-slate-700 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${statusConfig[call.status].bg}`}>
                                        <StatusIcon className={`w-5 h-5 ${statusConfig[call.status].color}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-semibold">{call.broker}</span>
                                            <span className="text-slate-500">•</span>
                                            <span className="text-slate-400 text-sm">{call.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{call.timestamp}</span>
                                            <span>•</span>
                                            <span>{call.duration}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full ${statusConfig[call.status].bg}`}>
                                    <span className={`text-xs font-medium ${statusConfig[call.status].color} uppercase`}>
                                        {statusConfig[call.status].label}
                                    </span>
                                </div>
                            </div>

                            {/* Transcript */}
                            <div className="bg-slate-950/50 rounded-lg p-3 mb-3">
                                <div className="text-sm text-slate-300 italic">"{call.transcript}"</div>
                            </div>

                            {/* Detected Information */}
                            {hasDetectedInfo && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {call.detected.origin && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                            <div>
                                                <div className="text-slate-500 text-xs">Origin</div>
                                                <div className="text-white">{call.detected.origin}</div>
                                            </div>
                                        </div>
                                    )}
                                    {call.detected.destination && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-slate-500" />
                                            <div>
                                                <div className="text-slate-500 text-xs">Destination</div>
                                                <div className="text-white">{call.detected.destination}</div>
                                            </div>
                                        </div>
                                    )}
                                    {call.detected.date && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-slate-500" />
                                            <div>
                                                <div className="text-slate-500 text-xs">Date</div>
                                                <div className="text-white">{call.detected.date}</div>
                                            </div>
                                        </div>
                                    )}
                                    {call.revenue && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <DollarSign className="w-4 h-4 text-emerald-500" />
                                            <div>
                                                <div className="text-slate-500 text-xs">Est. Revenue</div>
                                                <div className="text-emerald-400 font-semibold">${call.revenue.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Positions */}
                            {call.detected.positions && call.detected.positions.length > 0 && (
                                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
                                    <span className="text-slate-500 text-sm">Positions:</span>
                                    {call.detected.positions.map((pos) => (
                                        <span key={pos} className="text-xs px-2 py-1 bg-amber-500/10 text-amber-500 rounded">
                                            {pos}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* "Missed Call = Lost Load" Reminder */}
            <div className="bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/20 rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-lg">Missed Call = Lost Load</h3>
                        <p className="text-slate-300 mt-1">
                            Voice Rail captured <span className="text-emerald-400 font-semibold">${(totalRevenue / 1000).toFixed(1)}k</span> in revenue that would have been lost to missed calls today.
                        </p>
                    </div>
                    <PhoneMissed className="w-12 h-12 text-rose-500/50" />
                </div>
            </div>
        </div>
    );
}
