
import React from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

const MOCK_BILLING = [
    { id: '1', sponsor: 'Texas Heavy Haul', mode: 'Performance', budget: '$50.00', spent: '$12.50', leads: 42, status: 'Active' },
    { id: '2', sponsor: 'Sunshine Pilot Cars', mode: 'Flat', budget: '--', spent: '$250.00', leads: 156, status: 'Active' },
    { id: '3', sponsor: 'Stallone Spec Pilot', mode: 'Performance', budget: '$100.00', spent: '$88.20', leads: 231, status: 'Active' },
    { id: '4', sponsor: 'Miami Permit Co', mode: 'Performance', budget: '$20.00', spent: '$19.80', leads: 8, status: 'Cap Reached' },
];

export default function BillingPage() {
    return (
        <div className="flex flex-col h-full bg-[#070707]">
            <AdminTopBar title="Sponsors & Performance Billing" />

            <div className="px-8 pt-4 border-b border-[#1a1a1a] flex gap-8">
                <Tab label="Sponsors" active />
                <Tab label="Placements" />
                <Tab label="Daily Ledger" />
                <Tab label="Fraud Review" />
            </div>

            <div className="p-8 space-y-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label="Total Revenue (30d)" value="$12,482.00" color="text-green-500" />
                    <StatCard label="Billable Leads" value="1,842" color="text-white" />
                    <StatCard label="Active Sponsors" value="48" color="text-[#ffb400]" />
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
                            {MOCK_BILLING.map((b) => (
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
                                        <button className="text-[10px] font-black uppercase text-[#444] hover:text-[#ffb400] transition-colors">
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
        <button className={`py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${active ? 'border-[#ffb400] text-[#ffb400]' : 'border-transparent text-[#444] hover:text-[#888]'}`}>
            {label}
        </button>
    );
}
