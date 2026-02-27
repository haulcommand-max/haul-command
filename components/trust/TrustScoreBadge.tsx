import * as React from "react";

type TrustScoreBadgeProps = {
    score: number; // 0-100
    variant?: "full" | "compact" | "dot";
    className?: string;
};

function clampScore(n: number) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}

function tier(score: number) {
    if (score >= 90) return { label: "Elite", ring: "ring-emerald-500/40", text: "text-emerald-300" };
    if (score >= 75) return { label: "Strong", ring: "ring-blue-500/40", text: "text-blue-300" };
    if (score >= 60) return { label: "Watch", ring: "ring-amber-500/40", text: "text-amber-300" };
    return { label: "Risk", ring: "ring-red-500/40", text: "text-red-300" };
}

export function TrustScoreBadge({ score, variant = "full", className }: TrustScoreBadgeProps) {
    const s = clampScore(score);
    const t = tier(s);

    if (variant === "dot") {
        return (
            <span
                className={[
                    "inline-flex h-2.5 w-2.5 rounded-full",
                    s >= 90 ? "bg-emerald-400" : s >= 75 ? "bg-blue-400" : s >= 60 ? "bg-amber-400" : "bg-red-400",
                    className ?? "",
                ].join(" ")}
                aria-label={`Trust Score ${s} (${t.label})`}
                title={`Trust Score ${s} (${t.label})`}
            />
        );
    }

    if (variant === "compact") {
        return (
            <span
                className={[
                    "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1",
                    t.ring,
                    "bg-white/5",
                    className ?? "",
                ].join(" ")}
                aria-label={`Trust Score ${s} (${t.label})`}
                title={`Trust Score ${s} (${t.label})`}
            >
                <span className={["font-semibold tabular-nums", t.text].join(" ")}>{s}</span>
                <span className="text-white/60">{t.label}</span>
            </span>
        );
    }

    // full
    return (
        <div
            className={[
                "inline-flex items-center gap-3 rounded-xl px-3 py-2 ring-1 bg-white/5",
                t.ring,
                className ?? "",
            ].join(" ")}
            aria-label={`Trust Score ${s} (${t.label})`}
            title={`Trust Score ${s} (${t.label})`}
        >
            <div className="flex flex-col leading-tight">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/50">Trust</span>
                <span className={["text-sm font-semibold", t.text].join(" ")}>
                    {t.label}
                    <span className="text-white/40 font-medium"> • </span>
                    <span className="tabular-nums">{s}</span>
                </span>
            </div>

            <div className="h-8 w-[86px] rounded-full bg-black/30 ring-1 ring-white/10 overflow-hidden">
                <div
                    className={[
                        "h-full",
                        s >= 90 ? "bg-emerald-500/70" : s >= 75 ? "bg-blue-500/70" : s >= 60 ? "bg-amber-500/70" : "bg-red-500/70",
                    ].join(" ")}
                    style={{ width: `${s}%` }}
                />
            </div>
        </div>
    );
}
