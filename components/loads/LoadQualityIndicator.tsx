import * as React from "react";

type LoadQualityIndicatorProps = {
    score: number; // 0-100
    variant?: "badge" | "pill" | "icon";
    className?: string;
};

function clampScore(n: number) {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}

function quality(score: number) {
    if (score >= 85) return { label: "High", tone: "emerald", arrow: "↑↑" };
    if (score >= 70) return { label: "Good", tone: "blue", arrow: "↑" };
    if (score >= 55) return { label: "Fair", tone: "zinc", arrow: "•" };
    if (score >= 40) return { label: "Low", tone: "amber", arrow: "↓" };
    return { label: "Bad", tone: "red", arrow: "↓↓" };
}

function toneClasses(tone: string) {
    switch (tone) {
        case "emerald":
            return { ring: "ring-emerald-500/35", bg: "bg-emerald-500/10", text: "text-emerald-200" };
        case "blue":
            return { ring: "ring-blue-500/35", bg: "bg-blue-500/10", text: "text-blue-200" };
        case "amber":
            return { ring: "ring-amber-500/35", bg: "bg-amber-500/10", text: "text-amber-200" };
        case "red":
            return { ring: "ring-red-500/35", bg: "bg-red-500/10", text: "text-red-200" };
        default:
            return { ring: "ring-white/15", bg: "bg-white/5", text: "text-white/70" };
    }
}

export function LoadQualityIndicator({ score, variant = "badge", className }: LoadQualityIndicatorProps) {
    const s = clampScore(score);
    const q = quality(s);
    const c = toneClasses(q.tone);

    if (variant === "icon") {
        return (
            <span
                className={["inline-flex items-center justify-center h-6 w-6 rounded-full ring-1", c.bg, c.ring, className ?? ""].join(" ")}
                aria-label={`Load Quality ${q.label} (${s})`}
                title={`Load Quality ${q.label} (${s})`}
            >
                <span className={["text-xs font-semibold", c.text].join(" ")}>{q.arrow}</span>
            </span>
        );
    }

    if (variant === "pill") {
        return (
            <span
                className={[
                    "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1",
                    c.bg,
                    c.ring,
                    className ?? "",
                ].join(" ")}
                aria-label={`Load Quality ${q.label} (${s})`}
                title={`Load Quality ${q.label} (${s})`}
            >
                <span className={["font-semibold tabular-nums", c.text].join(" ")}>{q.arrow}</span>
                <span className={["font-semibold", c.text].join(" ")}>{q.label}</span>
                <span className="text-white/40 tabular-nums">{s}</span>
            </span>
        );
    }

    // badge
    return (
        <div
            className={[
                "inline-flex items-center gap-3 rounded-xl px-3 py-2 ring-1",
                c.bg,
                c.ring,
                className ?? "",
            ].join(" ")}
            aria-label={`Load Quality ${q.label} (${s})`}
            title={`Load Quality ${q.label} (${s})`}
        >
            <span className={["text-sm font-semibold tabular-nums", c.text].join(" ")}>{q.arrow}</span>
            <div className="flex flex-col leading-tight">
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/50">Load</span>
                <span className={["text-sm font-semibold", c.text].join(" ")}>
                    {q.label}
                    <span className="text-white/40 font-medium"> • </span>
                    <span className="tabular-nums">{s}</span>
                </span>
            </div>
        </div>
    );
}
