"use client";

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    elite: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-400/30" },
    strong: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-400/30" },
    solid: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-400/30" },
    watch: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-400/30" },
    risk: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-400/30" },
};

const SIZE_CLASSES = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
};

const SCORE_SIZES = {
    sm: "text-xs font-bold",
    md: "text-sm font-bold",
    lg: "text-base font-bold",
};

interface TrustBadgeProps {
    score: number;
    tier: "elite" | "strong" | "solid" | "watch" | "risk";
    size?: "sm" | "md" | "lg";
    showTier?: boolean;
    className?: string;
}

export function TrustBadge({
    score,
    tier,
    size = "md",
    showTier = true,
    className = "",
}: TrustBadgeProps) {
    const colors = TIER_COLORS[tier] ?? TIER_COLORS.risk;
    const sizeClass = SIZE_CLASSES[size];
    const scoreSz = SCORE_SIZES[size];

    return (
        <span
            className={`inline-flex items-center rounded-full border font-semibold ${colors.bg} ${colors.text} ${colors.border} ${sizeClass} ${className}`}
            title={`Trust Score: ${Math.round(score)} — ${tier}`}
        >
            <span className={scoreSz}>{Math.round(score)}</span>
            {showTier && (
                <span className="opacity-70 uppercase tracking-wide font-bold">
                    {tier}
                </span>
            )}
        </span>
    );
}
