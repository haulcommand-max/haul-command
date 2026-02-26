"use client";
import React, { useState } from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import DetailDrawer from '@/components/admin/DetailDrawer';
import { createClient } from '@/lib/supabase/client';

const MOCK_ITEMS = [
    { id: '1', priority: 95, type: 'corridor_report', summary: 'Construction in TX-10', region: 'TX', created: '2m ago', status: 'open' },
    { id: '2', priority: 80, type: 'provider', summary: 'New Escort Service - Miami', region: 'FL', created: '15m ago', status: 'open' },
    { id: '3', priority: 100, type: 'load_post', summary: 'Superload Alert (I-95 North)', region: 'GA', created: '1h ago', status: 'in_review' },
    { id: '4', priority: 40, type: 'user', summary: 'New Operator Verification', region: 'CA', created: '3h ago', status: 'open' },
];

export default function ModerationPage() {
    const supabase = createClient();
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('Inbox');

    async function handleAction(action: 'VERIFY' | 'REJECT', item: any) {
        if (!item) return;
        setProcessing(true);

        try {
            const { error } = await supabase.rpc('record_audit_event', {
                p_action: `${action}_${item.type.toUpperCase()}`,
                p_entity_type: item.type,
                p_entity_id: item.id,
                p_note: `Action performed via Admin Moderation Console. Tab: ${activeTab}`
            });

            if (error) throw error;

            alert(`${action} logged successfully for ${item.summary}`);
            setSelectedItem(null);
            // In a real app, we would re-fetch or update local state here
        } catch (err: any) {
            console.error(err);
            alert(`Error recording action: ${err.message}`);
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#070707]">
            <AdminTopBar title="Moderation Inbox" />

            {/* Tabs */}
            <div className="px-8 pt-4 border-b border-[#1a1a1a] flex gap-8">
                {['Inbox', 'In Review', 'Resolved', 'Spam Watch'].map(tab => (
                    <Tab
                        key={tab}
                        label={tab}
                        count={tab === 'Inbox' ? 12 : tab === 'In Review' ? 3 : undefined}
                        active={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                    />
                ))}
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
                <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0f0f0f] border-b border-[#1a1a1a] text-[#444] uppercase text-[10px] font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Summary</th>
                                <th className="px-6 py-4">Region</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            {MOCK_ITEMS.map((item) => (
                                <tr
                                    key={item.id}
                                    className="hover:bg-[#111] cursor-pointer transition-colors group"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <td className="px-6 py-4">
                                        <span className={`font-black ${item.priority >= 90 ? 'text-red-500' : 'text-[#ffb400]'}`}>
                                            {item.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[#666] uppercase text-[10px] font-bold tracking-tight">
                                        {item.type.replace('_', ' ')}
                                    </td>
                                    <td className="px-6 py-4 font-medium italic group-hover:text-white transition-colors">
                                        {item.summary}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{item.region}</td>
                                    <td className="px-6 py-4 text-[#444]">{item.created}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            disabled={processing}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAction('VERIFY', item);
                                            }}
                                            className="text-[10px] font-black uppercase text-[#444] hover:text-[#ffb400] transition-colors disabled:opacity-50"
                                        >
                                            {processing ? '...' : 'Quick Verify'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Drawer */}
            <DetailDrawer
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title={selectedItem?.summary}
                actions={
                    <>
                        <button
                            disabled={processing}
                            onClick={() => handleAction('VERIFY', selectedItem)}
                            className="flex-1 bg-[#22c55e] text-black py-3 rounded text-xs font-black uppercase hover:bg-green-400 transition-all disabled:opacity-50"
                        >
                            {processing ? 'Processing...' : 'Verify Item'}
                        </button>
                        <button
                            disabled={processing}
                            onClick={() => handleAction('REJECT', selectedItem)}
                            className="flex-1 border border-[#ef4444] text-[#ef4444] py-3 rounded text-xs font-black uppercase hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                            {processing ? 'Processing...' : 'Reject / Spam'}
                        </button>
                    </>
                }
            >
                <div className="space-y-6">
                    <Section title="Evidence & Details">
                        <div className="p-4 bg-[#0a0a0a] rounded border border-[#1a1a1a] space-y-4">
                            <div className="flex justify-between">
                                <span className="text-[10px] text-[#444] uppercase">Source ID</span>
                                <span className="text-[10px] font-mono">USR-88219-B</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[10px] text-[#444] uppercase">Trust Level</span>
                                <span className="text-[10px] text-[#22c55e] font-black uppercase">High Fidelity</span>
                            </div>
                            <p className="text-xs text-[#888] leading-relaxed">
                                "Multiple reports of a bridge strike at this location. DOT has dispatched a crew. Expect delays of 2+ hours."
                            </p>
                        </div>
                    </Section>

                    <Section title="Suggested Action">
                        <p className="text-xs text-[#666]">
                            Based on historical data for this corridor, we recommend **Verifying** and pinning an alert for the next 4 hours.
                        </p>
                    </Section>
                </div>
            </DetailDrawer>
        </div>
    );
}

function Tab({ label, count, active }: any) {
    return (
        <button className={`py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${active ? 'border-[#ffb400] text-[#ffb400]' : 'border-transparent text-[#444] hover:text-[#888]'}`}>
            {label} {count && <span className="ml-1 opacity-50">({count})</span>}
        </button>
    );
}

function StatusBadge({ status }: any) {
    const colors: any = {
        open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        in_review: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[status] || colors.open}`}>
            {status.replace('_', ' ')}
        </span>
    );
}

function Section({ title, children }: any) {
    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#444] border-b border-[#1a1a1a] pb-1">
                {title}
            </h4>
            {children}
        </div>
    );
}
