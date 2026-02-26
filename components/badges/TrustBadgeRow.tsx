"use client";

interface BadgeConfig {
    icon: string;
    label: string;
    tooltip: string;
    color: string; // tailwind classes
}

const BADGE_MAP: Record<string, BadgeConfig> = {
    // Escort-side
    verified_profile: {
        icon: "✓",
        label: "Verified",
        tooltip: "Identity and contact validated by Haul Command",
        color: "bg-green-500/15 text-green-400 border-green-400/30",
    },
    docs_on_file: {
        icon: "📋",
        label: "Docs On File",
        tooltip: "Certification and insurance documents uploaded and verified",
        color: "bg-blue-500/15 text-blue-400 border-blue-400/30",
    },
    active_30d: {
        icon: "⚡",
        label: "Active",
        tooltip: "Active on Haul Command within the last 30 days",
        color: "bg-emerald-500/15 text-emerald-400 border-emerald-400/30",
    },
    fast_responder: {
        icon: "🚀",
        label: "Fast Responder",
        tooltip: "Median reply time under 15 minutes on recent offers",
        color: "bg-amber-500/15 text-amber-400 border-amber-400/30",
    },
    corridor_experienced: {
        icon: "🛣️",
        label: "Corridor Expert",
        tooltip: "3+ completed jobs on the same corridor — knows the road",
        color: "bg-purple-500/15 text-purple-400 border-purple-400/30",
    },
    preferred: {
        icon: "⭐",
        label: "HC Preferred",
        tooltip: "Top-tier escort recognized by Haul Command for consistent excellence",
        color: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    },
    // Broker-side
    fast_pay: {
        icon: "💸",
        label: "Fast Pay",
        tooltip: "Pays escorts quickly — escorts report fast payment history",
        color: "bg-green-500/15 text-green-400 border-green-400/30",
    },
    low_dispute: {
        icon: "🤝",
        label: "Low Dispute",
        tooltip: "Consistently low dispute rate with escort operators",
        color: "bg-blue-500/15 text-blue-400 border-blue-400/30",
    },
    repeat_booker: {
        icon: "🔄",
        label: "Repeat Booker",
        tooltip: "Regularly re-books the same escorts — reliable relationship",
        color: "bg-indigo-500/15 text-indigo-400 border-indigo-400/30",
    },
    verified_company: {
        icon: "🏢",
        label: "Verified Co.",
        tooltip: "Business identity verified by Haul Command",
        color: "bg-slate-400/15 text-slate-300 border-slate-400/30",
    },
};

interface TrustBadgeRowProps {
    badges: string[];
    size?: "sm" | "md";
    className?: string;
    maxVisible?: number;
}

export function TrustBadgeRow({
    badges,
    size = "sm",
    className = "",
    maxVisible = 4,
}: TrustBadgeRowProps) {
    if (!badges || badges.length === 0) return null;

    const visible = badges.slice(0, maxVisible);
    const overflow = badges.length - maxVisible;

    const sizeClasses =
        size === "sm"
            ? "text-[10px] px-1.5 py-0.5 gap-0.5"
            : "text-xs px-2 py-1 gap-1";

    return (
        <div className={`flex flex-wrap gap-1 ${className}`} role="list" aria-label="Trust badges">
            {visible.map((slug) => {
                const config = BADGE_MAP[slug];
                if (!config) return null;
                return (
                    <span
                        key={slug}
                        role="listitem"
                        title={config.tooltip}
                        className={`inline-flex items-center rounded-full border font-semibold select-none
              ${config.color} ${sizeClasses} cursor-default`}
                    >
                        <span aria-hidden="true">{config.icon}</span>
                        <span className="ml-1">{config.label}</span>
                    </span>
                );
            })}
            {overflow > 0 && (
                <span
                    className={`inline-flex items-center rounded-full border border-slate-600 bg-slate-700/40 text-slate-400 font-semibold ${sizeClasses}`}
                    title={`+${overflow} more badges`}
                >
                    +{overflow}
                </span>
            )}
        </div>
    );
}

/** Standalone single badge pill — for use in compact spaces */
export function BadgePill({ slug }: { slug: string }) {
    const config = BADGE_MAP[slug];
    if (!config) return null;
    return (
        <span
            title={config.tooltip}
            className={`inline-flex items-center gap-0.5 rounded-full border text-[10px] px-1.5 py-0.5 font-semibold ${config.color}`}
        >
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}

export { BADGE_MAP };
export type { BadgeConfig };
