"use client";

import { MapPin, Star, Shield, CheckCircle2, AlertTriangle, Truck, Phone, Mail } from 'lucide-react';

interface Provider {
    id: string;
    name: string;
    type: 'escort' | 'installer' | 'permit';
    state: string;
    city: string;
    capabilities: string[];
    hcScore: number;
    certifications: string[];
    activeLoads: number;
    completionRate: number;
    contact: {
        phone: string;
        email: string;
    };
}

const MOCK_PROVIDERS: Provider[] = [
    {
        id: 'ESC-GA-001',
        name: 'Southern Escort Professionals',
        type: 'escort',
        state: 'GA',
        city: 'Atlanta',
        capabilities: ['Lead', 'Chase', 'High Pole'],
        hcScore: 4.8,
        certifications: ['TWIC', 'Class A CDL', 'CPR'],
        activeLoads: 3,
        completionRate: 98,
        contact: {
            phone: '+1 (404) 555-0192',
            email: 'ops@southernescort.com'
        }
    },
    {
        id: 'ESC-FL-008',
        name: 'Sunshine State Escort Services',
        type: 'escort',
        state: 'FL',
        city: 'Jacksonville',
        capabilities: ['Lead', 'Chase'],
        hcScore: 4.6,
        certifications: ['TWIC', 'First Aid'],
        activeLoads: 2,
        completionRate: 96,
        contact: {
            phone: '+1 (904) 555-0256',
            email: 'dispatch@sunshineescort.com'
        }
    },
    {
        id: 'INS-GA-042',
        name: 'Precision Pole Installers',
        type: 'installer',
        state: 'GA',
        city: 'Savannah',
        capabilities: ['Transmission Poles', 'Distribution'],
        hcScore: 4.9,
        certifications: ['Lineman Cert', 'OSHA 30', 'Class A CDL'],
        activeLoads: 5,
        completionRate: 99,
        contact: {
            phone: '+1 (912) 555-0378',
            email: 'crew@precisionpole.com'
        }
    },
    {
        id: 'PER-GA-015',
        name: 'Southeast Permit Solutions',
        type: 'permit',
        state: 'GA',
        city: 'Atlanta',
        capabilities: ['GA', 'FL', 'SC', 'NC'],
        hcScore: 4.7,
        certifications: ['Certified Permit Specialist'],
        activeLoads: 12,
        completionRate: 97,
        contact: {
            phone: '+1 (404) 555-0489',
            email: 'permits@sepermit.com'
        }
    }
];

const typeConfig = {
    'escort': { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Escort Service' },
    'installer': { color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Installer' },
    'permit': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Permit Agency' }
};

export default function NetworkPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Infrastructure Network</h1>
                    <p className="text-slate-400 mt-1">White-Label Directory & Route Revival</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
                        Filter by State
                    </button>
                    <button className="px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors">
                        + Add Provider
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Total Providers</div>
                    <div className="text-2xl font-bold text-white mt-1">247</div>
                    <div className="text-xs text-emerald-500 mt-1">Across 12 states</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Escorts</div>
                    <div className="text-2xl font-bold text-blue-400 mt-1">156</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Installers</div>
                    <div className="text-2xl font-bold text-amber-500 mt-1">68</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-sm">Avg HC Score™</div>
                    <div className="text-2xl font-bold text-yellow-400 mt-1">4.7</div>
                </div>
            </div>

            {/* Provider Grid */}
            <div className="grid gap-4">
                {MOCK_PROVIDERS.map((provider) => (
                    <div key={provider.id} className="bg-slate-900 rounded-lg border border-slate-800 p-5 hover:border-slate-700 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${typeConfig[provider.type].bg}`}>
                                    <Truck className={`w-6 h-6 ${typeConfig[provider.type].color}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-white font-semibold text-lg">{provider.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded ${typeConfig[provider.type].bg} ${typeConfig[provider.type].color}`}>
                                            {typeConfig[provider.type].label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <MapPin className="w-4 h-4" />
                                        <span>{provider.city}, {provider.state}</span>
                                        <span>•</span>
                                        <span className="font-mono text-slate-500">{provider.id}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="text-right mr-3">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="text-white font-bold">{provider.hcScore}</span>
                                    </div>
                                    <div className="text-xs text-slate-400">HC Score™</div>
                                </div>
                                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                    Contact
                                </button>
                            </div>
                        </div>

                        {/* Capabilities */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {provider.capabilities.map((cap) => (
                                <span key={cap} className="text-xs px-3 py-1 bg-slate-800 text-slate-300 rounded-full">
                                    {cap}
                                </span>
                            ))}
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-4 gap-4 pt-3 border-t border-slate-800">
                            <div>
                                <div className="text-slate-500 text-xs">Active Loads</div>
                                <div className="text-white font-semibold">{provider.activeLoads}</div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs">Completion Rate</div>
                                <div className="text-emerald-400 font-semibold">{provider.completionRate}%</div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs">Certifications</div>
                                <div className="text-blue-400 font-semibold">{provider.certifications.length}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-300 text-sm">{provider.contact.phone}</span>
                            </div>
                        </div>

                        {/* Certifications */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            <div className="flex gap-2">
                                {provider.certifications.map((cert) => (
                                    <span key={cert} className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded">
                                        {cert}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Route Revival Campaign Banner */}
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-400/10 border border-amber-500/20 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                        <h3 className="text-white font-semibold">Route Revival Campaign</h3>
                        <p className="text-slate-300 text-sm mt-1">
                            Send corridor-specific blasts to reactivate dormant broker relationships.
                        </p>
                        <p className="text-slate-400 text-xs mt-2">
                            Example: "We're running GA-FL corridor this week. Need coverage?"
                        </p>
                        <button className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors text-sm">
                            Create Campaign
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
