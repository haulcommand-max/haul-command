'use client';

import React from 'react';
import { FileCheck, AlertTriangle, Clock, Shield, Upload, CheckCircle2, XCircle } from 'lucide-react';

type ComplianceDoc = {
    id: string;
    doc_type: string;
    doc_name: string;
    issued_at: string | null;
    expires_at: string | null;
    days_until_expiry: number | null;
    status: 'active' | 'expiring_soon' | 'expired' | 'pending_review' | 'rejected';
    verified_at: string | null;
    file_url: string | null;
};

const DOC_TYPE_LABELS: Record<string, string> = {
    insurance_coi: 'Certificate of Insurance',
    insurance_auto: 'Auto Insurance',
    business_license: 'Business License',
    dot_authority: 'DOT Authority',
    vehicle_registration: 'Vehicle Registration',
    safety_certification: 'Safety Certification',
    escort_permit: 'Escort Permit',
    pilot_car_cert: 'Pilot Car Cert',
    hazmat_endorsement: 'HAZMAT Endorsement',
    twic_card: 'TWIC Card',
    medical_card: 'Medical Card',
    other: 'Other Document',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
    active: { label: 'Active', color: 'text-emerald-400', icon: CheckCircle2, bg: 'bg-emerald-500/10 border-emerald-500/20' },
    expiring_soon: { label: 'Expiring Soon', color: 'text-amber-400', icon: AlertTriangle, bg: 'bg-amber-500/10 border-amber-500/20' },
    expired: { label: 'Expired', color: 'text-red-400', icon: XCircle, bg: 'bg-red-500/10 border-red-500/20' },
    pending_review: { label: 'Pending Review', color: 'text-blue-400', icon: Clock, bg: 'bg-blue-500/10 border-blue-500/20' },
    rejected: { label: 'Rejected', color: 'text-red-500', icon: XCircle, bg: 'bg-red-500/10 border-red-500/20' },
};

export function ComplianceWallet({ documents, onUpload }: { documents: ComplianceDoc[]; onUpload?: () => void }) {
    const expiringSoon = documents.filter(d => d.status === 'expiring_soon').length;
    const expired = documents.filter(d => d.status === 'expired').length;
    const active = documents.filter(d => d.status === 'active').length;

    const sorted = [...documents].sort((a, b) => {
        const statusOrder = { expired: 0, expiring_soon: 1, pending_review: 2, active: 3, rejected: 4 };
        return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
    });

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <div>
                        <h3 className="text-white font-bold">Compliance Wallet</h3>
                        <p className="text-xs text-slate-500">{documents.length} documents tracked</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {expired > 0 && (
                        <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full animate-pulse">
                            {expired} expired
                        </span>
                    )}
                    {expiringSoon > 0 && (
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                            {expiringSoon} expiring
                        </span>
                    )}
                    {onUpload && (
                        <button onClick={onUpload}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" /> Upload
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Bar */}
            {documents.length > 0 && (
                <div className="px-6 py-3 border-b border-slate-800 bg-slate-950 flex items-center gap-6 text-xs">
                    <span className="text-emerald-400 font-bold">{active} active</span>
                    <span className="text-amber-400 font-bold">{expiringSoon} expiring</span>
                    <span className="text-red-400 font-bold">{expired} expired</span>
                    <div className="flex-1" />
                    <span className="text-slate-600">
                        Coverage: {documents.length > 0 ? ((active / documents.length) * 100).toFixed(0) : 0}%
                    </span>
                </div>
            )}

            {/* Document List */}
            <div className="divide-y divide-slate-800">
                {sorted.map(doc => {
                    const statusCfg = STATUS_CONFIG[doc.status] || STATUS_CONFIG.active;
                    const StatusIcon = statusCfg.icon;

                    return (
                        <div key={doc.id} className="px-6 py-4 flex items-center gap-4">
                            <FileCheck className={`w-5 h-5 ${statusCfg.color} shrink-0`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white truncate">{doc.doc_name}</span>
                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusCfg.bg} ${statusCfg.color}`}>
                                        {statusCfg.label}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                                    {doc.expires_at && (
                                        <span className="ml-2">
                                            · Expires {new Date(doc.expires_at).toLocaleDateString()}
                                            {doc.days_until_expiry != null && doc.days_until_expiry >= 0 && (
                                                <span className={doc.days_until_expiry <= 30 ? 'text-amber-400 font-bold' : ''}>
                                                    {' '}({doc.days_until_expiry}d left)
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {doc.verified_at && (
                                <div className="text-emerald-500 shrink-0" title="Verified">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {documents.length === 0 && (
                    <div className="px-6 py-12 text-center">
                        <Shield className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No compliance documents uploaded yet.</p>
                        <p className="text-xs text-slate-600 mt-1">Upload your insurance, permits, and certifications to build trust.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
