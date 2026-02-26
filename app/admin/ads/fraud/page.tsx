import { createClient } from '@/utils/supabase/server';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Ad Fraud Shield — Haul Command Admin',
};

interface FraudSession {
    session_id: string;
    viewer_ip_hash: string;
    impressions: number;
    clicks: number;
    rapid_clicks: number;
    risk_score: number;
    risk_flags: string[];
    is_blocked: boolean;
    last_seen_at: string;
}

export default async function AdFraudDashboardPage() {
    const supabase = createClient();

    // High-risk sessions (last 24h)
    const { data: riskySessions } = await supabase
        .from('ad_fraud_signals')
        .select('*')
        .gt('risk_score', 0.5)
        .gt('last_seen_at', new Date(Date.now() - 24 * 3600000).toISOString())
        .order('risk_score', { ascending: false })
        .limit(50);

    // Blocked sessions
    const { count: blockedCount } = await supabase
        .from('ad_fraud_signals')
        .select('session_id', { count: 'exact', head: true })
        .eq('is_blocked', true);

    // Invalid events 24h
    const { count: invalidEvents } = await supabase
        .from('ad_event_ledger')
        .select('id', { count: 'exact', head: true })
        .eq('billable', false)
        .gte('event_time', new Date(Date.now() - 24 * 3600000).toISOString());

    // Valid events 24h
    const { count: validEvents } = await supabase
        .from('ad_event_ledger')
        .select('id', { count: 'exact', head: true })
        .eq('billable', true)
        .gte('event_time', new Date(Date.now() - 24 * 3600000).toISOString());

    // Revenue protected (sum of non-billable cost would have been)
    const { data: protectedRevenue } = await supabase
        .from('ad_event_ledger')
        .select('cost_cents')
        .eq('billable', false)
        .gt('fraud_score', 0.65)
        .gte('event_time', new Date(Date.now() - 24 * 3600000).toISOString());

    const protectedCents = (protectedRevenue || []).reduce((sum, r) => sum + (r.cost_cents || 0), 0);

    const riskColor = (score: number) =>
        score >= 0.85 ? 'text-red-400 bg-red-500/10 border-red-500/20' :
            score >= 0.65 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-black text-white">🛡️ Fraud Shield</h1>
                    <p className="text-sm text-slate-500 mt-1">Real-time fraud detection, session scoring, and billing protection</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-xs text-slate-500 font-bold uppercase">Valid Events (24h)</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">{(validEvents || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-xs text-slate-500 font-bold uppercase">Invalid Events (24h)</p>
                        <p className="text-2xl font-black text-red-400 mt-1">{(invalidEvents || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-xs text-slate-500 font-bold uppercase">Fraud Rate</p>
                        <p className="text-2xl font-black text-amber-400 mt-1">
                            {((validEvents || 0) + (invalidEvents || 0)) > 0
                                ? ((invalidEvents || 0) / ((validEvents || 0) + (invalidEvents || 0)) * 100).toFixed(1)
                                : '0.0'}%
                        </p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-xs text-slate-500 font-bold uppercase">Blocked Sessions</p>
                        <p className="text-2xl font-black text-red-400 mt-1">{blockedCount || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-xs text-slate-500 font-bold uppercase">Revenue Protected</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">${(protectedCents / 100).toFixed(2)}</p>
                    </div>
                </div>

                {/* Risky Sessions */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700">
                        <h2 className="font-bold text-white">High-Risk Sessions (24h)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                    <th className="px-6 py-3">Session</th>
                                    <th className="px-6 py-3">Risk Score</th>
                                    <th className="px-6 py-3">Flags</th>
                                    <th className="px-6 py-3">Impressions</th>
                                    <th className="px-6 py-3">Clicks</th>
                                    <th className="px-6 py-3">Rapid</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">IP Hash</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {(riskySessions || []).map((s: FraudSession) => (
                                    <tr key={s.session_id} className="hover:bg-slate-800/30">
                                        <td className="px-6 py-3 font-mono text-xs text-slate-400">{s.session_id.slice(0, 12)}…</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${riskColor(s.risk_score)}`}>
                                                {(s.risk_score * 100).toFixed(0)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(s.risk_flags || []).map(f => (
                                                    <span key={f} className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-800 text-slate-400 rounded border border-slate-700">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-slate-400">{s.impressions}</td>
                                        <td className="px-6 py-3 text-slate-400">{s.clicks}</td>
                                        <td className="px-6 py-3 text-red-400 font-bold">{s.rapid_clicks}</td>
                                        <td className="px-6 py-3">
                                            {s.is_blocked ? (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 rounded-full border border-red-500/20">BLOCKED</span>
                                            ) : (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">FLAGGED</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 font-mono text-xs text-slate-600">{(s.viewer_ip_hash || '').slice(0, 8)}</td>
                                    </tr>
                                ))}
                                {(!riskySessions || riskySessions.length === 0) && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-600">
                                            No high-risk sessions detected in the last 24 hours. ✅
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AdRank Explain */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="font-bold text-white mb-4">AdRank Formula</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Bid', weight: '55%', color: 'text-amber-400' },
                            { label: 'CTR Predicted', weight: '20%', color: 'text-blue-400' },
                            { label: 'Relevance', weight: '10%', color: 'text-emerald-400' },
                            { label: 'Advertiser Trust', weight: '8%', color: 'text-purple-400' },
                            { label: 'Ad Quality', weight: '7%', color: 'text-cyan-400' },
                            { label: 'Fraud Penalty', weight: '-35%', color: 'text-red-400' },
                            { label: 'Dwell Required', weight: '800ms', color: 'text-slate-400' },
                            { label: 'Token TTL', weight: '10min', color: 'text-slate-400' },
                        ].map(item => (
                            <div key={item.label} className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                                <p className="text-[10px] text-slate-500 uppercase font-bold">{item.label}</p>
                                <p className={`text-lg font-black ${item.color} mt-1`}>{item.weight}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
