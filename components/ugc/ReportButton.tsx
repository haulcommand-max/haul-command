'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const REASONS = [
    { value: 'spam', label: 'Spam or fake listing' },
    { value: 'harassment', label: 'Harassment or threats' },
    { value: 'fraud', label: 'Fraud or scam' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'illegal', label: 'Illegal activity' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'other', label: 'Other' },
] as const;

interface ReportButtonProps {
    entityType: 'profile' | 'load' | 'review' | 'message' | 'comment';
    entityId: string;
    className?: string;
}

export function ReportButton({ entityType, entityId, className = '' }: ReportButtonProps) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    async function handleSubmit() {
        if (!reason) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reported_entity_type: entityType,
                    reported_entity_id: entityId,
                    reason,
                    details,
                }),
            });
            if (res.ok) setDone(true);
        } catch {
            // Fail silently — user sees nothing
        }
        setSubmitting(false);
    }

    if (done) {
        return (
            <div className="text-emerald-500 text-xs font-bold py-2">
                ✓ Report submitted. Our team will review it within 24 hours.
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors ${className}`}
            >
                <AlertTriangle className="w-3.5 h-3.5" />
                Report
            </button>

            {open && (
                <div className="mt-3 p-4 bg-[#111] border border-white/10 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Report this {entityType}</div>
                    <select
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-red-500 focus:outline-none"
                    >
                        <option value="">Select a reason…</option>
                        {REASONS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                    <textarea
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                        placeholder="Additional details (optional)…"
                        rows={2}
                        className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-sm text-white resize-none focus:border-red-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!reason || submitting}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        {submitting ? 'Submitting…' : 'Submit Report'}
                    </button>
                </div>
            )}
        </>
    );
}
