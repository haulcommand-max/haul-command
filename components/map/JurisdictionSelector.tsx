'use client';

import React, { useState } from 'react';

/**
 * JurisdictionSelector — Lightweight US/CA state/province grid
 * Replaces react-simple-maps to avoid React 19 peer dependency conflict.
 * Interactive grid with hover effects and selection states.
 */

const US_STATES: Array<{ code: string; name: string }> = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'DC' },
];

const CA_PROVINCES: Array<{ code: string; name: string }> = [
    { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' }, { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'New Brunswick' }, { code: 'NL', name: 'Newfoundland' }, { code: 'NS', name: 'Nova Scotia' },
    { code: 'NT', name: 'NW Territories' }, { code: 'NU', name: 'Nunavut' }, { code: 'ON', name: 'Ontario' },
    { code: 'PE', name: 'PEI' }, { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' },
    { code: 'YT', name: 'Yukon' },
];

interface JurisdictionSelectorProps {
    onSelectJurisdiction: (code: string, name: string) => void;
    selectedCode?: string | null;
}

export function JurisdictionSelector({ onSelectJurisdiction, selectedCode }: JurisdictionSelectorProps) {
    const [filter, setFilter] = useState('');

    const matchesFilter = (name: string, code: string) => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            {/* Search Filter */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search state or province..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full max-w-xs px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                />
            </div>

            {/* US States */}
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">🇺🇸 United States</h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-1.5 mb-8">
                {US_STATES.filter(s => matchesFilter(s.name, s.code)).map(s => (
                    <button
                        key={s.code}
                        onClick={() => onSelectJurisdiction(s.code, s.name)}
                        title={s.name}
                        className={`p-2 rounded-lg text-xs font-bold transition-all ${selectedCode === s.code
                                ? 'bg-amber-500 text-black ring-2 ring-amber-400 shadow-lg shadow-amber-500/20'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-105'
                            }`}
                    >
                        {s.code}
                    </button>
                ))}
            </div>

            {/* CA Provinces */}
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">🇨🇦 Canada</h3>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-1.5">
                {CA_PROVINCES.filter(p => matchesFilter(p.name, p.code)).map(p => (
                    <button
                        key={p.code}
                        onClick={() => onSelectJurisdiction(p.code, p.name)}
                        title={p.name}
                        className={`p-2 rounded-lg text-xs font-bold transition-all ${selectedCode === p.code
                                ? 'bg-amber-500 text-black ring-2 ring-amber-400 shadow-lg shadow-amber-500/20'
                                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-105'
                            }`}
                    >
                        {p.code}
                    </button>
                ))}
            </div>
        </div>
    );
}
