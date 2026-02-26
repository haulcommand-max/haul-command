import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Ad Campaign Manager — Haul Command Admin',
};

interface Campaign {
    id: string;
    campaign_name: string;
    budget_cents: number;
    daily_cap_cents: number;
    status: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    creatives_count?: number;
}

export default async function AdminAdsPage() {
    const supabase = createClient();

    // Get campaigns with creative counts
    const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

    // Get aggregate stats
    const { count: totalImpressions } = await supabase
        .from('ad_impressions')
        .select('id', { count: 'exact', head: true })
        .gte('viewed_at', new Date(Date.now() - 24 * 3600000).toISOString());

    const { count: totalClicks } = await supabase
        .from('ad_clicks')
        .select('id', { count: 'exact', head: true })
        .gte('clicked_at', new Date(Date.now() - 24 * 3600000).toISOString());

    const ctr = totalImpressions && totalImpressions > 0
        ? ((totalClicks || 0) / totalImpressions * 100).toFixed(2) : '0.00';

    const statusColors: Record<string, string> = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        archived: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white">Ad Campaign Manager</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage native ad campaigns across all surfaces</p>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Campaigns</p>
                        <p className="text-2xl font-black text-white mt-1">{campaigns?.length || 0}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Impressions (24h)</p>
                        <p className="text-2xl font-black text-amber-400 mt-1">{(totalImpressions || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Clicks (24h)</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1">{(totalClicks || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">CTR (24h)</p>
                        <p className="text-2xl font-black text-blue-400 mt-1">{ctr}%</p>
                    </div>
                </div>

                {/* Campaigns Table */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                        <h2 className="font-bold text-white">Campaigns</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                    <th className="px-6 py-3">Campaign</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Budget</th>
                                    <th className="px-6 py-3">Daily Cap</th>
                                    <th className="px-6 py-3">Dates</th>
                                    <th className="px-6 py-3">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {(campaigns || []).map((c: Campaign) => (
                                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">{c.campaign_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColors[c.status] || ''}`}>
                                                {c.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 font-mono">${(c.budget_cents / 100).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-slate-400 font-mono">${(c.daily_cap_cents / 100).toFixed(2)}/day</td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {c.start_date || '—'} → {c.end_date || '∞'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {(!campaigns || campaigns.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-600">
                                            No campaigns yet. Create your first ad campaign to start monetizing.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Placement Surfaces */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="font-bold text-white mb-4">Ad Surfaces</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { id: 'directory_listing', label: 'Directory Listings', desc: 'Native cards in operator search results', format: 'Native Card' },
                            { id: 'load_board_inline', label: 'Load Board', desc: 'Inline rows between load listings', format: 'Inline Row' },
                            { id: 'chambers_sidebar', label: 'Chambers Pages', desc: 'Sidebar placements on chamber pages', format: 'Sidebar' },
                            { id: 'map_drawer', label: 'Map Drawer', desc: 'Inside jurisdiction drawer tabs', format: 'Native Card' },
                            { id: 'dashboard_banner', label: 'Dashboard', desc: 'Top banner on user dashboard', format: 'Banner' },
                        ].map(s => (
                            <div key={s.id} className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl">
                                <p className="font-bold text-white text-sm">{s.label}</p>
                                <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                                <p className="text-[10px] text-amber-500/60 mt-2 font-mono">{s.format}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
