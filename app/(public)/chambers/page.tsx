import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Chambers of Commerce Directory — US & Canada | Haul Command',
    description: 'Browse Chambers of Commerce across all US states and Canadian provinces. Connect with your local business community for pilot car and heavy haul support.',
};

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
    'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK',
    'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const CA_PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

const STATE_NAMES: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
    CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
    IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
    ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
    MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
    OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
    TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
    WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'Washington DC',
    AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
    NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
    NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
    SK: 'Saskatchewan', YT: 'Yukon',
};

export default async function ChambersLandingPage() {
    const supabase = createClient();

    // Get chamber counts by region
    const { data: counts } = await supabase
        .from('chambers')
        .select('region')
        .then(({ data }) => {
            const map: Record<string, number> = {};
            (data || []).forEach(c => {
                const r = c.region?.toUpperCase();
                if (r) map[r] = (map[r] || 0) + 1;
            });
            return { data: map };
        });

    const chamberCounts = counts || {};

    return (
        <main className="min-h-screen bg-slate-900 text-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <div className="border-b border-slate-800 pb-8">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">
                        Chambers of Commerce Directory
                    </h1>
                    <p className="text-xl text-slate-400">
                        US & Canada — Your link to local business networks, regulations, and pilot car support.
                    </p>
                </div>

                {/* US States */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-amber-500">🇺🇸</span> United States
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {US_STATES.map(code => (
                            <Link href={`/chambers/${code.toLowerCase()}`} key={code}
                                className="group p-4 bg-slate-800/30 hover:bg-slate-800/80 border border-slate-700 hover:border-amber-500/50 rounded-xl transition-all">
                                <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                                    {code}
                                </div>
                                <div className="text-xs text-slate-500 truncate">{STATE_NAMES[code]}</div>
                                {chamberCounts[code] && (
                                    <div className="text-[10px] text-amber-500/60 mt-1 font-mono">{chamberCounts[code]} chambers</div>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* CA Provinces */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-amber-500">🇨🇦</span> Canada
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {CA_PROVINCES.map(code => (
                            <Link href={`/chambers/${code.toLowerCase()}`} key={code}
                                className="group p-4 bg-slate-800/30 hover:bg-slate-800/80 border border-slate-700 hover:border-amber-500/50 rounded-xl transition-all">
                                <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                                    {code}
                                </div>
                                <div className="text-xs text-slate-500 truncate">{STATE_NAMES[code]}</div>
                                {chamberCounts[code] && (
                                    <div className="text-[10px] text-amber-500/60 mt-1 font-mono">{chamberCounts[code]} chambers</div>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Internal Link Footer */}
                <div className="border-t border-slate-800 pt-8 text-sm text-slate-500">
                    <p>Looking for specific regulations? Check our <Link href="/tools/state-requirements" className="text-amber-500 hover:underline">State Requirements Tool</Link> or browse <Link href="/map" className="text-amber-500 hover:underline">the jurisdiction map</Link>.</p>
                </div>
            </div>
        </main>
    );
}
