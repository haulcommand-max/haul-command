'use client';

import { Flag } from 'lucide-react';
import { useState } from 'react';

interface ReportIssueButtonProps {
    entityType: string;
    entityId: string;
    className?: string;
}

const ISSUE_TYPES = [
    { value: 'incorrect_info', label: 'Incorrect Information' },
    { value: 'closed', label: 'Permanently Closed' },
    { value: 'duplicate', label: 'Duplicate Listing' },
    { value: 'spam', label: 'Spam or Fake' },
    { value: 'other', label: 'Other Issue' },
];

/**
 * "Report Issue" button — opens a lightweight modal to submit data corrections.
 * Feeds the moderation queue for community-driven data quality.
 */
export default function ReportIssueButton({ entityType, entityId, className = '' }: ReportIssueButtonProps) {
    const [open, setOpen] = useState(false);
    const [issueType, setIssueType] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    async function handleSubmit() {
        if (!issueType) return;
        setSubmitting(true);
        try {
            await fetch('/api/data-issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entity_type: entityType,
                    entity_id: entityId,
                    issue_type: issueType,
                    description: description || null,
                }),
            });
            setSubmitted(true);
            setTimeout(() => { setOpen(false); setSubmitted(false); setIssueType(''); setDescription(''); }, 2000);
        } catch {
            // Silent fail — don't block UX
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={`inline-flex items-center gap-1 text-xs text-hc-muted hover:text-hc-danger transition-colors ${className}`}
                title="Report incorrect information"
            >
                <Flag className="w-3 h-3" />
                Report Issue
            </button>

            {open && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-hc-card border border-hc-border rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        {submitted ? (
                            <div className="text-center py-8">
                                <div className="text-3xl mb-3">✅</div>
                                <p className="text-hc-text font-semibold">Report Submitted</p>
                                <p className="text-hc-muted text-sm mt-1">Thank you for helping keep our data accurate.</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-hc-text mb-4">Report an Issue</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-hc-muted uppercase tracking-wider mb-2">
                                            Issue Type
                                        </label>
                                        <div className="space-y-1.5">
                                            {ISSUE_TYPES.map(t => (
                                                <button
                                                    key={t.value}
                                                    onClick={() => setIssueType(t.value)}
                                                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${issueType === t.value
                                                            ? 'bg-hc-gold-500/10 border-hc-gold-500/30 text-hc-gold-500 font-semibold'
                                                            : 'bg-hc-elevated border-hc-border text-hc-text hover:bg-hc-elevated/80'
                                                        }`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-hc-muted uppercase tracking-wider mb-2">
                                            Details (optional)
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="What's wrong with this listing?"
                                            className="w-full px-3 py-2 rounded-lg bg-hc-elevated border border-hc-border text-hc-text text-sm
                                                placeholder:text-hc-muted focus:outline-none focus:ring-1 focus:ring-hc-gold-500/50"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setOpen(false)}
                                            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-hc-muted
                                                bg-hc-elevated border border-hc-border hover:bg-hc-elevated/80 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!issueType || submitting}
                                            className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-black
                                                bg-hc-gold-500 hover:bg-hc-gold-400 transition-all
                                                disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submitting ? 'Submitting…' : 'Submit Report'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
