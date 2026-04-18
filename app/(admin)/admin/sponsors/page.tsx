"use client";
import React, { useState, useEffect } from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { createClient } from '@/lib/supabase/client';

export default function BillingPage() {
    const supabase = createClient();
    const [sponsors, setSponsors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ revenue: '—', leads: '—', active: '—' });

    useEffect(() => {
        async function fetchSponsors() {
            try {
                const { data, count } = await supabase
                    .from('territory_sponsorships')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .limit(50);
                if (data) {
                    setSponsors(data.map((s: any) => ({
                        id: s.id, sponsor: s.sponsor_company || 'Unknown',
                        mode: s.territory_type === 'country' ? 'Premium' : 'Performance',
                        budget: `$${s.plan_price_monthly || 0}/mo`,
                        spent: '—', leads: '—',
                        status: s.status === 'active' ? 'Active' : s.status,
                    })));
                    const activeCount = data.filter((s: any) => s.status === 'active').length;
                    setStats({ revenue: `$${data.reduce((sum: number, s: any) => sum + (s.plan_price_monthly || 0), 0)}/mo`, leads: '—', active: String(activeCount) });
                }
            } catch { /* graceful */ }
            setLoading(false);
        }
        fetchSponsors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <div className="flex flex-col h-full bg-[#070707]">
            <AdminTopBar title="Sponsors & Performance Billing" />

            <div className="px-8 py-4 border-b border-[#1a1a1a] flex gap-8">
                <Tab label="Sponsors" active />
                <Tab label="Placements" />
                <Tab label="Daily Ledger" />
                <Tab label="Fraud Review" />
            </div>

            <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Revenue (30d)" value={stats.revenue} color={stats.revenue !== '—' ? 'text-[#22c55e]' : 'text-[#444]'} />
                    <StatCard label="Billable Leads" value={stats.leads} color="text-[#444]" />
                    <StatCard label="Active Sponsors" value={stats.active} color={stats.active !== '—' ? 'text-[#ffb400]' : 'text-[#444]'} />
                </div>

                <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0f0f0f] border-b border-[#1a1a1a] text-[#444] uppercase text-[10px] font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Sponsor</th>
                                <th className="px-6 py-4">Mode</th>
                                <th className="px-6 py-4">Daily Budget</th>
                                <th className="px-6 py-4">Spent (Today)</th>
                                <th className="px-6 py-4">Leads</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-[#444]">Loading sponsors...</td></tr>
                            ) : sponsors.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="text-2xl mb-2">ðŸ“</div><span className="text-[#444]">No active sponsors yet. Territories are available at <a href="/sponsor" className="text-[#ffb400] hover:underline">/sponsor</a></span></td></tr>
                            ) : sponsors.map((b) => (
                                <tr key={b.id} className="hover:bg-[#111] transition-colors">
                                    <td className="px-6 py-4 font-black uppercase text-[11px] tracking-tight">{b.sponsor}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${b.mode === 'Performance' ? 'bg-[#ffb400]/10 text-[#ffb400] border-[#ffb400]/20' : 'bg-white/5 text-white border-white/10'}`}>
                                            {b.mode}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{b.budget}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{b.spent}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{b.leads}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold ${b.status === 'Cap Reached' ? 'text-red-500' : 'text-green-500'}`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button aria-label="Interactive Button" className="text-[10px] font-black uppercase text-[#444] hover:text-[#ffb400] transition-colors">
                                            Edit Profile
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: any) {
    return (
        <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-6 rounded-lg">
            <p className="text-[10px] font-black uppercase text-[#444] mb-1">{label}</p>
            <p className={`text-2xl font-black tracking-tighter ${color}`}>{value}</p>
        </div>
    );
}

function Tab({ label, active }: any) {
    return (
        <button aria-label="Interactive Button" className={`py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${active ? 'border-[#ffb400] text-[#ffb400]' : 'border-transparent text-[#444] hover:text-[#888]'}`}>
            {label}
        </button>
    );
}