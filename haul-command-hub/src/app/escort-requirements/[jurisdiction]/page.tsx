import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

interface Props { params: Promise<{ jurisdiction: string }>; }
interface EscortRule {
    id: string; jurisdiction_code: string; jurisdiction_name: string; country_code: string;
    jurisdiction_type: string; dimension_type: string; threshold_min_value: number;
    threshold_max_value: number | null; threshold_unit: string; escorts_required: number;
    escort_positions: string[]; road_type: string; requires_height_pole: boolean;
    requires_police: boolean; requires_route_survey: boolean; requires_affidavit: boolean;
    authority_name: string; authority_url: string; authority_phone: string;
    authority_hours: string; source_url: string; last_verified: string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { jurisdiction } = await params;
    const supabase = await createClient();
    const { data } = await supabase.rpc('hc_get_jurisdiction_requirements', { p_jurisdiction: jurisdiction.toUpperCase() });
    const rules: EscortRule[] = data || [];
    const name = rules[0]?.jurisdiction_name || jurisdiction;
    return {
        title: `${name} Escort Requirements — Oversize Load Rules`,
        description: `Complete escort vehicle requirements for ${name}. ${rules.length} rules covering width, height, length, and weight.`,
    };
}

function fmtPos(p: string) { return p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
function fmtDim(t: string) {
    const m: Record<string, string> = { width: '↔️ Width', height: '↕️ Height', length: '📏 Length', weight: '⚖️ Weight', overhang: '📐 Overhang', superload: '🔴 Superload' };
    return m[t] || t;
}

export default async function JurisdictionPage({ params }: Props) {
    const { jurisdiction } = await params;
    const supabase = await createClient();
    const { data } = await supabase.rpc('hc_get_jurisdiction_requirements', { p_jurisdiction: jurisdiction.toUpperCase() });
    const rules: EscortRule[] = data || [];

    if (!rules.length) return (
        <><Navbar /><main className="flex-grow max-w-4xl mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl font-black text-white italic">Jurisdiction Not Found</h1>
            <Link href="/escort-requirements" className="text-accent font-bold mt-6 inline-block">← View All</Link>
        </main></>
    );

    const { jurisdiction_name: name, jurisdiction_type: jType, authority_name: auth, authority_url: authUrl, authority_phone: authPhone, authority_hours: authHrs, last_verified: verified } = rules[0];
    const maxE = Math.max(...rules.map(r => r.escorts_required));
    const hasHP = rules.some(r => r.requires_height_pole);
    const hasPol = rules.some(r => r.requires_police);
    const hasSurv = rules.some(r => r.requires_route_survey);

    const faq = {
        '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
            { '@type': 'Question', name: `When do I need an escort in ${name}?`, acceptedAnswer: { '@type': 'Answer', text: `Escorts are required when loads exceed specific dimension thresholds. Check the table below for exact values.` } },
            { '@type': 'Question', name: `How many escorts in ${name}?`, acceptedAnswer: { '@type': 'Answer', text: `Up to ${maxE} escorts depending on dimensions.${hasHP ? ' Height pole may be required.' : ''}${hasPol ? ' Police escort may be required.' : ''}` } },
        ]
    };

    return (
        <><Navbar />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
            <main className="flex-grow max-w-5xl mx-auto px-4 py-16">
                <nav className="mb-8 flex items-center gap-2 text-xs text-gray-500">
                    <Link href="/" className="hover:text-accent">Home</Link><span>→</span>
                    <Link href="/escort-requirements" className="hover:text-accent">Escort Requirements</Link><span>→</span>
                    <span className="text-white font-bold">{name}</span>
                </nav>

                <header className="mb-12">
                    <div className="flex items-center space-x-4 mb-4">
                        <span className="bg-accent text-black text-[10px] font-black px-2 py-0.5 rounded italic">{jType.toUpperCase()}</span>
                        <span className="bg-white/10 text-white text-[10px] font-black px-2 py-0.5 rounded italic">{rules.length} RULES</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">
                        {name} <span className="text-accent">Escort Requirements</span>
                    </h1>
                    <p className="text-gray-400 text-lg mt-4">Complete escort rules for oversize loads in {name}.</p>
                </header>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <p className="text-gray-500 text-[10px] font-black uppercase mb-2">Max Escorts</p>
                        <p className="text-3xl font-black text-accent">{maxE}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <p className="text-gray-500 text-[10px] font-black uppercase mb-2">Height Pole</p>
                        <p className={`text-2xl font-black ${hasHP ? 'text-red-400' : 'text-green-400'}`}>{hasHP ? 'REQUIRED' : 'NO'}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <p className="text-gray-500 text-[10px] font-black uppercase mb-2">Police</p>
                        <p className={`text-2xl font-black ${hasPol ? 'text-red-400' : 'text-green-400'}`}>{hasPol ? 'REQUIRED' : 'NO'}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <p className="text-gray-500 text-[10px] font-black uppercase mb-2">Route Survey</p>
                        <p className={`text-2xl font-black ${hasSurv ? 'text-yellow-400' : 'text-green-400'}`}>{hasSurv ? 'REQUIRED' : 'NO'}</p>
                    </div>
                </div>

                {/* Table */}
                <section className="mb-12">
                    <h2 className="text-white font-black text-2xl mb-6">Dimension Thresholds</h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead><tr className="border-b border-white/10">
                                <th className="text-left text-[10px] text-gray-500 font-black uppercase px-6 py-4">Dimension</th>
                                <th className="text-left text-[10px] text-gray-500 font-black uppercase px-6 py-4">Threshold</th>
                                <th className="text-left text-[10px] text-gray-500 font-black uppercase px-6 py-4">Escorts</th>
                                <th className="text-left text-[10px] text-gray-500 font-black uppercase px-6 py-4">Positions</th>
                                <th className="text-left text-[10px] text-gray-500 font-black uppercase px-6 py-4">Special</th>
                            </tr></thead>
                            <tbody>{rules.map((r, i) => (
                                <tr key={r.id || i} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="px-6 py-4 text-sm font-bold text-white">{fmtDim(r.dimension_type)}</td>
                                    <td className="px-6 py-4 text-sm text-accent font-black">
                                        {r.dimension_type === 'superload' ? 'SUPERLOAD' : <>{r.threshold_min_value}{r.threshold_unit === 'ft' ? "'" : ` ${r.threshold_unit}`}{r.threshold_max_value ? ` — ${r.threshold_max_value}${r.threshold_unit === 'ft' ? "'" : ` ${r.threshold_unit}`}` : '+'}</>}
                                    </td>
                                    <td className="px-6 py-4"><span className="bg-accent/20 text-accent px-2 py-1 rounded text-xs font-black">{r.escorts_required}</span></td>
                                    <td className="px-6 py-4 text-xs text-gray-300">{r.escort_positions?.map(fmtPos).join(' + ')}</td>
                                    <td className="px-6 py-4 flex gap-1 flex-wrap">
                                        {r.requires_height_pole && <span className="bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded text-[9px] font-black">HP</span>}
                                        {r.requires_police && <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[9px] font-black">POLICE</span>}
                                        {r.requires_route_survey && <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded text-[9px] font-black">SURVEY</span>}
                                        {r.road_type && r.road_type !== 'all' && <span className="bg-white/10 text-gray-400 px-1.5 py-0.5 rounded text-[9px] font-black">{r.road_type.replace(/_/g, ' ').toUpperCase()}</span>}
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </section>

                {/* Authority */}
                {auth && <section className="mb-12">
                    <h2 className="text-white font-black text-2xl mb-6">Regulatory Authority</h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><p className="text-gray-500 text-[10px] font-black uppercase mb-2">Authority</p><p className="text-white font-bold">{auth}</p></div>
                        {authUrl && <div><p className="text-gray-500 text-[10px] font-black uppercase mb-2">Website</p><a href={authUrl} target="_blank" rel="noopener noreferrer" className="text-accent font-bold text-sm hover:underline">Official Rules →</a></div>}
                        {authPhone && <div><p className="text-gray-500 text-[10px] font-black uppercase mb-2">Phone</p><p className="text-white font-bold">{authPhone}</p>{authHrs && <p className="text-gray-500 text-xs mt-1">{authHrs}</p>}</div>}
                    </div>
                </section>}

                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-12">
                    <p className="text-yellow-400 text-xs font-bold">⚠️ DISCLAIMER</p>
                    <p className="text-gray-400 text-xs mt-2">Regulations are for informational purposes only. Verify with authorities. Last verified: {verified ? new Date(verified).toLocaleDateString() : 'Recently'}.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/tools/escort-calculator" className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 hover:border-accent/50 transition-all">
                        <h3 className="text-white font-black text-xl">🧮 Route Calculator</h3>
                        <p className="text-gray-400 text-sm mt-2">Multi-state escort requirements in one query.</p>
                    </Link>
                    <Link href="/directory" className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 rounded-2xl p-8 hover:border-green-500/50 transition-all">
                        <h3 className="text-white font-black text-xl">📍 Find Escorts in {name}</h3>
                        <p className="text-gray-400 text-sm mt-2">Browse verified operators available now.</p>
                    </Link>
                </div>
            </main>
        </>
    );
}
