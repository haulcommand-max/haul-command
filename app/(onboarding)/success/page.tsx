"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

// Lazy-load modal — only needed at this step
const EscortBrokerInviteModal = dynamic(
    () => import("@/components/onboarding/EscortBrokerInviteModal"),
    { ssr: false }
);

function ProfileApprovedInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const name = searchParams.get("name") ?? undefined;
    const [showInvite, setShowInvite] = useState(false);
    const [inviteDismissed, setInviteDismissed] = useState(false);

    // Auto-trigger invite modal after 1.5s — high conversion moment
    useEffect(() => {
        const t = setTimeout(() => setShowInvite(true), 1500);
        return () => clearTimeout(t);
    }, []);

    const handleContinue = () => {
        router.push("/directory");
    };

    return (
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            {/* Success graphic */}
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mx-auto mb-6 animate-in zoom-in duration-500">
                <ShieldCheck size={40} />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
                🚀 Profile Live
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent mb-3">
                {name ? `You're in, ${name}!` : "Your Profile is Live!"}
            </h1>

            <p className="text-brand-muted text-sm max-w-xs mb-8">
                Brokers can now find and book you on Haul Command. Invite the brokers you already work with to get direct requests faster.
            </p>

            {/* Invite CTA — highest priority action */}
            {!inviteDismissed && (
                <button
                    onClick={() => setShowInvite(true)}
                    className="w-full max-w-xs bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl transition-colors mb-3 flex items-center justify-center gap-2"
                >
                    🚀 Invite My Brokers
                </button>
            )}

            <button
                onClick={handleContinue}
                className="w-full max-w-xs flex items-center justify-center gap-2 py-3 text-brand-muted hover:text-brand-text text-sm transition-colors"
            >
                {inviteDismissed ? "Go to Directory" : "Skip for now"}
                <ArrowRight size={16} />
            </button>

            {/* Stats strip */}
            <div className="mt-10 grid grid-cols-3 gap-4 text-center border-t border-brand-steel/30 pt-6 w-full max-w-xs">
                {[
                    { label: "Profile Views", value: "0" },
                    { label: "Invite Accepted", value: "0" },
                    { label: "Jobs Available", value: "Live" },
                ].map((s) => (
                    <div key={s.label}>
                        <div className="text-2xl font-bold text-brand-gold">{s.value}</div>
                        <div className="text-[10px] text-brand-muted mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Invite modal — fires automatically after 1.5s */}
            {showInvite && (
                <EscortBrokerInviteModal
                    context="post_approval"
                    escortName={name}
                    onClose={() => {
                        setShowInvite(false);
                        setInviteDismissed(true);
                    }}
                />
            )}
        </div>
    );
}

export default function ProfileApprovedPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-gray-500" /></div>}>
            <ProfileApprovedInner />
        </Suspense>
    );
}
