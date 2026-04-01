"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// =========================================================
// VendorStatusToggle — Inline status switcher for vendor locations
// Shows live_status pill + dropdown to change
// Calls toggle_vendor_location_status RPC
// =========================================================

const STATUS_OPTIONS = [
    { value: "available", label: "Available", color: "bg-green-500", dot: "bg-green-400" },
    { value: "en_route", label: "En Route", color: "bg-blue-500", dot: "bg-blue-400" },
    { value: "on_job", label: "On Job", color: "bg-yellow-500", dot: "bg-yellow-400" },
    { value: "off_duty", label: "Off Duty", color: "bg-gray-400", dot: "bg-gray-300" },
] as const;

type LiveStatus = typeof STATUS_OPTIONS[number]["value"];

interface Props {
    locationId: string;
    initialStatus: LiveStatus;
    lastSeenAt?: string | null;
    compact?: boolean;
    onStatusChange?: (newStatus: LiveStatus) => void;
}

export default function VendorStatusToggle({
    locationId,
    initialStatus,
    lastSeenAt,
    compact = false,
    onStatusChange,
}: Props) {
    const supabase = createClient();
    const [status, setStatus] = useState<LiveStatus>(initialStatus);
    const [working, setWorking] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState("");

    const current = STATUS_OPTIONS.find(o => o.value === status) ?? STATUS_OPTIONS[3];

    async function handleChange(newStatus: LiveStatus) {
        if (newStatus === status) { setOpen(false); return; }
        setWorking(true);
        setError("");

        // Attempt to get current GPS position
        let lat: number | undefined;
        let lng: number | undefined;
        if (typeof navigator !== "undefined" && navigator.geolocation) {
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
                );
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch { /* GPS not available — proceed without */ }
        }

        const { data, error: rpcErr } = await supabase.rpc("toggle_vendor_location_status", {
            p_location_id: locationId,
            p_status: newStatus,
            p_lat: lat ?? null,
            p_lng: lng ?? null,
        });

        setWorking(false);
        if (rpcErr || !(data as any)?.ok) {
            setError((data as any)?.error ?? rpcErr?.message ?? "Failed");
            return;
        }

        setStatus(newStatus);
        setOpen(false);
        onStatusChange?.(newStatus);
    }

    // Compact mode: just the pill (for emergency results list)
    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white ${current.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${current.dot} animate-pulse`} />
                {current.label}
            </span>
        );
    }

    return (
        <div className="relative inline-block">
            {/* Current status button */}
            <button
                onClick={() => setOpen(!open)}
                disabled={working}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all ${current.color} ${working ? "opacity-50" : "hover:brightness-110"
                    }`}
            >
                <span className={`w-2 h-2 rounded-full ${current.dot} ${status === "available" ? "animate-pulse" : ""}`} />
                {working ? "Updating…" : current.label}
                <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    {STATUS_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => handleChange(opt.value)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${opt.value === status ? "bg-gray-50 font-medium" : "hover:bg-gray-50"
                                }`}
                        >
                            <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                            <span className="text-gray-800">{opt.label}</span>
                            {opt.value === status && <span className="ml-auto text-gray-400 text-xs">current</span>}
                        </button>
                    ))}
                </div>
            )}

            {/* Last seen */}
            {lastSeenAt && (
                <p className="text-xs text-gray-400 mt-1">
                    Last seen {new Date(lastSeenAt).toLocaleString()}
                </p>
            )}

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
