"use client";

import { useState, useEffect } from "react";

interface EscortBrokerInviteModalProps {
    /** 'post_approval' — shown after profile goes live
     *  'post_job' — shown after a job is completed */
    context: "post_approval" | "post_job";
    escortName?: string;
    brokerName?: string;
    sourceJobId?: string;
    onClose?: () => void;
}

export default function EscortBrokerInviteModal({
    context,
    escortName,
    brokerName,
    sourceJobId,
    onClose,
}: EscortBrokerInviteModalProps) {
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [visible, setVisible] = useState(false);

    // Animate in on mount
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    const generateLink = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/invites/escort", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    broker_name: brokerName ?? null,
                    trigger_context: context,
                    source_job_id: sourceJobId ?? null,
                }),
            });
            const data = await res.json();
            if (data.invite_url) setInviteUrl(data.invite_url);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!inviteUrl) return;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // fallback
            const el = document.createElement("textarea");
            el.value = inviteUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleText = () => {
        if (!inviteUrl) return;
        const msg = encodeURIComponent(
            `Hey — I just set up my verified pilot car profile on Haul Command. You can book me directly here: ${inviteUrl}`
        );
        window.open(`sms:?body=${msg}`, "_blank");
    };

    const handleEmail = () => {
        if (!inviteUrl) return;
        const subject = encodeURIComponent("Book me directly on Haul Command");
        const body = encodeURIComponent(
            `Hey${brokerName ? " " + brokerName : ""},\n\nI just set up my verified pilot car profile on Haul Command — you can book me directly and see my live availability:\n\n${inviteUrl}\n\nTakes 2 minutes to set up for you — and you'll get faster responses from me.\n\n${escortName ?? "Your escort"}`
        );
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    };

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => onClose?.(), 300);
    };

    const isPostJob = context === "post_job";

    return (
        <div
            className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4
        transition-all duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6
          transition-all duration-300 ${visible ? "translate-y-0" : "translate-y-4"}`}
            >
                {/* Close */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Header */}
                <div className="mb-5">
                    <div className="text-3xl mb-2">{isPostJob ? "🎉" : "🚀"}</div>
                    <h2 className="text-xl font-bold text-white">
                        {isPostJob
                            ? `Want ${brokerName ?? "this broker"} to book you faster next time?`
                            : "Get more direct broker requests"}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {isPostJob
                            ? "Send them your verified Haul Command profile — they can book you directly next time."
                            : `Invite the brokers you already work with${escortName ? ", " + escortName : ""}.`}
                    </p>
                </div>

                {/* Broker info display */}
                {isPostJob && brokerName && (
                    <div className="bg-slate-700/50 rounded-lg px-4 py-3 mb-4 text-sm text-slate-300">
                        📦 Invite: <span className="text-white font-semibold">{brokerName}</span>
                    </div>
                )}

                {/* Action buttons */}
                {!inviteUrl ? (
                    <button
                        onClick={generateLink}
                        disabled={loading}
                        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-xl transition-colors text-sm"
                    >
                        {loading ? "⟳ Generating link..." : "Generate My Invite Link"}
                    </button>
                ) : (
                    <div className="space-y-3">
                        {/* URL display */}
                        <div className="bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-2">
                            <p className="text-xs text-slate-500 mb-0.5">Your invite link</p>
                            <p className="text-xs text-amber-400 font-mono truncate">{inviteUrl}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={handleCopy}
                                className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all
                  ${copied
                                        ? "bg-green-500/20 border-green-500/40 text-green-400"
                                        : "bg-slate-700/60 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                                    }`}
                            >
                                <span className="text-lg">{copied ? "✓" : "📋"}</span>
                                {copied ? "Copied!" : "Copy Link"}
                            </button>

                            <button
                                onClick={handleText}
                                className="flex flex-col items-center gap-1 py-3 rounded-xl border border-slate-600 bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold transition-all"
                            >
                                <span className="text-lg">💬</span>
                                Text Broker
                            </button>

                            {isPostJob && (
                                <button
                                    onClick={handleEmail}
                                    className="flex flex-col items-center gap-1 py-3 rounded-xl border border-slate-600 bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold transition-all"
                                >
                                    <span className="text-lg">✉️</span>
                                    Email Broker
                                </button>
                            )}

                            {!isPostJob && (
                                <button
                                    onClick={handleEmail}
                                    className="flex flex-col items-center gap-1 py-3 rounded-xl border border-slate-600 bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold transition-all"
                                >
                                    <span className="text-lg">✉️</span>
                                    Email
                                </button>
                            )}
                        </div>

                        {/* Incentive note */}
                        <p className="text-center text-xs text-slate-500">
                            Brokers who book through verified profiles get priority response visibility from you
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
