"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// =========================================================
// TrustScoreBadge — Displays trust score + tier
// Shows factor breakdown on hover
// =========================================================

const TIER_STYLE: Record<string, { bg: string; text: string; label: string }> = {
    elite: { bg: "bg-amber-100 border-amber-300", text: "text-amber-800", label: "Elite" },
    preferred: { bg: "bg-blue-100 border-blue-300", text: "text-blue-800", label: "Preferred" },
    standard: { bg: "bg-gray-100 border-gray-300", text: "text-gray-700", label: "Standard" },
    probation: { bg: "bg-red-100 border-red-300", text: "text-red-700", label: "Probation" },
};

interface Props {
    trustScore: number;         // 0-1
    trustTier: string;         // elite | preferred | standard | probation
    factorsJson?: Record<string, number | string | null>;
    compact?: boolean;
}

export default function TrustScoreBadge({ trustScore, trustTier, factorsJson, compact = false }: Props) {
    const [showFactors, setShowFactors] = useState(false);
    const style = TIER_STYLE[trustTier] ?? TIER_STYLE.standard;
    const pct = Math.round(trustScore * 100);

    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text}`}>
                {style.label} · {pct}%
            </span>
        );
    }

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setShowFactors(!showFactors)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${style.bg} ${style.text} hover:brightness-95`}
            >
                <span className="font-semibold">{pct}%</span>
                <span className="font-normal">{style.label}</span>
            </button>

            {showFactors && factorsJson && (
                <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4 space-y-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trust Factors</h4>
                    {Object.entries(factorsJson)
                        .filter(([k]) => k !== "computed_at")
                        .map(([key, val]) => (
                            <div key={key} className="flex justify-between text-sm">
                                <span className="text-gray-600">{key.replace(/_/g, " ")}</span>
                                <span className="font-medium text-gray-900">
                                    {typeof val === "number" ? `${Math.round(val * 100)}%` : String(val ?? "—")}
                                </span>
                            </div>
                        ))}
                    {factorsJson.computed_at && (
                        <p className="text-xs text-gray-400 pt-1 border-t">
                            Computed {new Date(factorsJson.computed_at as string).toLocaleDateString()}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
