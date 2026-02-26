'use client';

import React, { useState, useEffect } from 'react';
import { X, Phone, MessageSquare, Globe, ChevronRight, Shield, AlertTriangle, Download, Copy, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useMapAnalytics } from '@/hooks/useMapAnalytics';

type DrawerTab = 'operators' | 'rules' | 'support' | 'export';

interface Operator {
    operator_id: string;
    business_name: string;
    phone: string;
    website_url: string | null;
    categories: string[];
    verified: boolean;
    rating: number;
    response_time_sec_avg: number;
    coverage_notes: string | null;
}

interface Rulepack {
    rulepack_id: string;
    topic: string;
    summary: string;
    source_links: string[] | null;
    effective_date: string | null;
}

interface SupportContact {
    contact_id: string;
    contact_type: string;
    label: string;
    phone: string | null;
    website_url: string | null;
    notes: string | null;
}

interface DrawerData {
    meta: { jurisdiction_code: string; name: string; updated_at: string } | null;
    operators: Operator[];
    rulepacks: Rulepack[];
    support_contacts: SupportContact[];
    message?: string;
}

interface JurisdictionDrawerProps {
    jurisdictionCode: string | null;
    jurisdictionName: string;
    onClose: () => void;
}

export function JurisdictionDrawer({ jurisdictionCode, jurisdictionName, onClose }: JurisdictionDrawerProps) {
    const [tab, setTab] = useState<DrawerTab>('operators');
    const [data, setData] = useState<DrawerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const analytics = useMapAnalytics();

    useEffect(() => {
        if (!jurisdictionCode) return;
        setLoading(true);
        analytics.trackDrawerOpened(jurisdictionCode);

        const supabase = createClient();
        (async () => {
            try {
                const { data: result } = await supabase.rpc('get_jurisdiction_drawer', { p_jurisdiction_code: jurisdictionCode });
                setData(result as DrawerData);
            } catch {
                // RPC failed — drawer will show empty state
            } finally {
                setLoading(false);
            }
        })();
    }, [jurisdictionCode]);

    if (!jurisdictionCode) return null;

    const tabs: { key: DrawerTab; label: string }[] = [
        { key: 'operators', label: 'Operators' },
        { key: 'rules', label: 'Rules' },
        { key: 'support', label: 'Support' },
        { key: 'export', label: 'Export' },
    ];

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 md:right-0 md:left-auto md:w-[420px] md:inset-y-0 md:top-12">
            {/* Backdrop (mobile only) */}
            <div className="fixed inset-0 bg-black/40 md:hidden" onClick={onClose} />

            {/* Drawer Panel */}
            <div className="relative bg-slate-900 border-t md:border-l border-slate-700 rounded-t-2xl md:rounded-none max-h-[85vh] md:max-h-full md:h-full flex flex-col animate-slide-up md:animate-slide-left">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-white">{jurisdictionName}</h2>
                        <p className="text-xs text-slate-500 font-mono">{jurisdictionCode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex border-b border-slate-800 shrink-0">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${tab === t.key
                                ? 'text-amber-500 border-b-2 border-amber-500'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <>
                            {tab === 'operators' && <OperatorsTab operators={data?.operators || []} jurisdictionCode={jurisdictionCode} analytics={analytics} />}
                            {tab === 'rules' && <RulesTab rulepacks={data?.rulepacks || []} jurisdictionCode={jurisdictionCode} analytics={analytics} />}
                            {tab === 'support' && <SupportTab contacts={data?.support_contacts || []} jurisdictionCode={jurisdictionCode} analytics={analytics} />}
                            {tab === 'export' && <ExportTab jurisdictionCode={jurisdictionCode} jurisdictionName={jurisdictionName} copied={copied} setCopied={setCopied} analytics={analytics} />}
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .animate-slide-up { animation: slideUp 0.3s ease-out; }
                .animate-slide-left { animation: slideLeft 0.3s ease-out; }
            `}</style>
        </div>
    );
}

/* ── Operators Tab ── */
function OperatorsTab({ operators, jurisdictionCode, analytics }: { operators: Operator[]; jurisdictionCode: string; analytics: ReturnType<typeof useMapAnalytics> }) {
    if (operators.length === 0) return <EmptyState text="No operators listed for this jurisdiction yet." />;

    return (
        <div className="space-y-3">
            {operators.map(op => (
                <div key={op.operator_id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{op.business_name}</span>
                                {op.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                            </div>
                            {op.coverage_notes && <p className="text-xs text-slate-500 mt-1">{op.coverage_notes}</p>}
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-amber-400 font-black text-sm">{op.rating.toFixed(1)}★</div>
                            <div className="text-[10px] text-slate-600">{Math.round(op.response_time_sec_avg / 60)}min avg</div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <a href={`tel:${op.phone}`}
                            onClick={() => analytics.trackOperatorCalled(jurisdictionCode, op.operator_id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors">
                            <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                        <a href={`sms:${op.phone}`}
                            onClick={() => analytics.trackOperatorTexted(jurisdictionCode, op.operator_id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-lg transition-colors">
                            <MessageSquare className="w-3.5 h-3.5" /> Text
                        </a>
                        {op.website_url && (
                            <a href={op.website_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition-colors">
                                <Globe className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Rules Tab ── */
function RulesTab({ rulepacks, jurisdictionCode, analytics }: { rulepacks: Rulepack[]; jurisdictionCode: string; analytics: ReturnType<typeof useMapAnalytics> }) {
    if (rulepacks.length === 0) return <EmptyState text="No regulation data available for this jurisdiction yet." />;

    return (
        <div className="space-y-2">
            {rulepacks.map(rp => (
                <button key={rp.rulepack_id}
                    onClick={() => analytics.trackRulepackOpened(jurisdictionCode, rp.rulepack_id)}
                    className="w-full text-left p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-amber-500/30 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{rp.topic}</span>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{rp.summary}</p>
                    {rp.effective_date && <p className="text-[10px] text-slate-600 mt-1">Effective: {rp.effective_date}</p>}
                </button>
            ))}
        </div>
    );
}

/* ── Support Tab ── */
function SupportTab({ contacts, jurisdictionCode, analytics }: { contacts: SupportContact[]; jurisdictionCode: string; analytics: ReturnType<typeof useMapAnalytics> }) {
    return (
        <div className="space-y-3">
            {/* Pinned Emergency */}
            <a href="tel:911"
                onClick={() => analytics.trackSupportContactOpened(jurisdictionCode, 'emergency')}
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <div className="flex-1">
                    <span className="font-black text-red-400 text-sm">Emergency — 911</span>
                    <p className="text-[10px] text-red-400/60">Use local emergency services</p>
                </div>
                <Phone className="w-4 h-4 text-red-400" />
            </a>

            {contacts.length === 0 ? (
                <EmptyState text="No support contacts available for this jurisdiction yet." />
            ) : (
                contacts.map(sc => (
                    <div key={sc.contact_id}
                        onClick={() => analytics.trackSupportContactOpened(jurisdictionCode, sc.contact_type)}
                        className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-bold text-white text-sm">{sc.label}</span>
                            <span className="px-2 py-0.5 bg-slate-700 text-[10px] text-slate-400 rounded-full uppercase tracking-wider">{sc.contact_type}</span>
                        </div>
                        {sc.notes && <p className="text-xs text-slate-500 mb-2">{sc.notes}</p>}
                        <div className="flex gap-2">
                            {sc.phone && (
                                <a href={`tel:${sc.phone}`} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                                    <Phone className="w-3 h-3" /> {sc.phone}
                                </a>
                            )}
                            {sc.website_url && (
                                <a href={sc.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                                    <Globe className="w-3 h-3" /> Website
                                </a>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

/* ── Export Tab ── */
function ExportTab({ jurisdictionCode, jurisdictionName, copied, setCopied, analytics }: {
    jurisdictionCode: string; jurisdictionName: string; copied: boolean; setCopied: (v: boolean) => void;
    analytics: ReturnType<typeof useMapAnalytics>;
}) {
    const handleExport = async () => {
        analytics.trackStatePacketExported(jurisdictionCode);
        window.open(`/api/export/state-packet?jurisdiction_code=${jurisdictionCode}`, '_blank');
    };

    const handleCopyLinks = () => {
        const links = [
            `Operators: ${window.location.origin}/map?jurisdiction=${jurisdictionCode}`,
            `Regulations: ${window.location.origin}/requirements/${jurisdictionCode.replace('US-', '').replace('CA-', '').toLowerCase()}/escort-vehicle-rules`,
            `Directory: ${window.location.origin}/chambers/${jurisdictionCode.replace('US-', '').replace('CA-', '').toLowerCase()}`,
        ].join('\n');

        navigator.clipboard.writeText(links).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="space-y-4">
            <div className="text-sm text-slate-400 mb-4">
                Export data for <strong className="text-white">{jurisdictionName} ({jurisdictionCode})</strong> to share with your team or for offline reference.
            </div>

            <button onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-xl transition-colors">
                <Download className="w-4 h-4" /> Export State Packet
            </button>

            <button onClick={handleCopyLinks}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm rounded-xl transition-colors">
                {copied ? <><CheckCircle className="w-4 h-4 text-emerald-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Quick Links</>}
            </button>
        </div>
    );
}

/* ── Empty State ── */
function EmptyState({ text }: { text: string }) {
    return (
        <div className="py-12 text-center">
            <Shield className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">{text}</p>
        </div>
    );
}
