"use client";

/**
 * OwnerVisibilityControls — Dashboard panel for claimed owners
 *
 * Lets claimed operators toggle public visibility of profile, report card,
 * media, and contact info. All changes are audited via the
 * toggle_profile_visibility RPC.
 */

import React from "react";
import {
    Eye, EyeOff, ShieldCheck, FileText, Camera, Phone,
    Info, Loader2, AlertTriangle
} from "lucide-react";
import { useVisibilityControls } from "@/hooks/useVisibility";
import type { VisibilitySettings } from "@/lib/trust/visibility-resolver";

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface OwnerVisibilityControlsProps {
    listingId: string;
    className?: string;
}

interface ControlRow {
    field: keyof VisibilitySettings;
    label: string;
    description: string;
    icon: React.ElementType;
    warning?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// CONTROL DEFINITIONS
// ════════════════════════════════════════════════════════════════════════════

const CONTROLS: ControlRow[] = [
    {
        field: "public_profile_visible",
        label: "Public Profile",
        description: "Show your profile to anyone browsing the directory",
        icon: Eye,
        warning: "Hiding your profile prevents new discovery by brokers and carriers",
    },
    {
        field: "public_report_card_visible",
        label: "Report Card",
        description: "Show your trust report card to free users",
        icon: FileText,
        warning: "Hidden report cards are still visible to paid subscribers",
    },
    {
        field: "public_media_visible",
        label: "Public Media",
        description: "Show your vehicle and equipment photos publicly",
        icon: Camera,
    },
    {
        field: "public_contact_visible",
        label: "Contact Info",
        description: "Show phone, email to logged-in users",
        icon: Phone,
        warning: "Hiding contact info may reduce inbound leads",
    },
];

// ════════════════════════════════════════════════════════════════════════════
// TOGGLE SWITCH
// ════════════════════════════════════════════════════════════════════════════

function ToggleSwitch({
    checked,
    onChange,
    disabled,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full 
                border-2 border-transparent transition-all duration-200 ease-in-out
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1A91B] 
                focus-visible:ring-offset-2 focus-visible:ring-offset-black
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
            style={{
                background: checked
                    ? "linear-gradient(90deg, #F1A91B, #f0b93a)"
                    : "rgba(255,255,255,0.1)",
            }}
        >
            <span
                className={`
                    pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg 
                    ring-0 transition-transform duration-200 ease-in-out
                    ${checked ? "translate-x-5" : "translate-x-0"}
                `}
            />
        </button>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export function OwnerVisibilityControls({ listingId, className = "" }: OwnerVisibilityControlsProps) {
    const { settings, loading, saving, toggle } = useVisibilityControls({ listingId });

    if (loading) {
        return (
            <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 ${className}`}>
                <div className="flex items-center justify-center gap-2 py-8">
                    <Loader2 className="w-4 h-4 text-[#F1A91B] animate-spin" />
                    <span className="text-xs text-[#555]">Loading visibility controls…</span>
                </div>
            </div>
        );
    }

    // Count how many surfaces are hidden
    const hiddenCount = CONTROLS.filter(c => !settings[c.field]).length;

    return (
        <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#F1A91B]" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-[0.15em]">
                        Visibility Controls
                    </h3>
                </div>
                {saving && (
                    <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 text-[#F1A91B] animate-spin" />
                        <span className="text-[10px] text-[#666] uppercase tracking-wider">Saving…</span>
                    </div>
                )}
            </div>

            {/* Warning banner if anything is hidden */}
            {hiddenCount > 0 && (
                <div className="px-6 py-3 bg-amber-500/5 border-b border-amber-500/10 flex items-start gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-400/80 leading-relaxed">
                        {hiddenCount} surface{hiddenCount !== 1 ? "s" : ""} hidden from free users.
                        Paid subscribers can still view hidden report cards and subscriber media.
                    </p>
                </div>
            )}

            {/* Control rows */}
            <div className="divide-y divide-[#111]">
                {CONTROLS.map((control) => {
                    const isEnabled = settings[control.field];
                    const Icon = control.icon;

                    return (
                        <div
                            key={control.field}
                            className="px-6 py-4 flex items-start gap-4 transition-colors hover:bg-white/[0.01]"
                        >
                            {/* Icon */}
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{
                                    background: isEnabled ? "rgba(241,169,27,0.1)" : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${isEnabled ? "rgba(241,169,27,0.2)" : "rgba(255,255,255,0.06)"}`,
                                }}
                            >
                                <Icon
                                    className="w-4 h-4"
                                    style={{ color: isEnabled ? "#F1A91B" : "#555" }}
                                />
                            </div>

                            {/* Label + Description */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-bold text-white">{control.label}</span>
                                    {!isEnabled && (
                                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-[#666]">
                                            Hidden
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-[#666] leading-relaxed">
                                    {control.description}
                                </p>
                                {!isEnabled && control.warning && (
                                    <p className="text-[10px] text-amber-400/60 mt-1 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        {control.warning}
                                    </p>
                                )}
                            </div>

                            {/* Toggle */}
                            <div className="flex-shrink-0 pt-1">
                                <ToggleSwitch
                                    checked={isEnabled}
                                    onChange={(v) => toggle(control.field, v)}
                                    disabled={saving}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-[#050505] border-t border-[#1a1a1a]">
                <div className="flex items-start gap-1.5">
                    <Info className="w-3 h-3 text-white/15 flex-shrink-0 mt-0.5" />
                    <span className="text-[9px] text-white/20 leading-relaxed">
                        Visibility changes are audited and take effect immediately.
                        Paid subscribers always retain access to report cards and subscriber-eligible media
                        regardless of these settings.
                    </span>
                </div>
            </div>
        </div>
    );
}
