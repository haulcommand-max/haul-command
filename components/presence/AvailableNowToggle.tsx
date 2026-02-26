"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ══════════════════════════════════════════════════════════════════════════════
// AvailableNowToggle — flips driver availability via driver-presence-update
// Shows current status, last-seen time, and optional city/state override.
// Uses geolocation API if available; falls back to profile home_base.
// ══════════════════════════════════════════════════════════════════════════════

interface AvailableNowToggleProps {
    /** Controlled mode — pass in current value + handler */
    value?: boolean;
    onChange?: (available: boolean) => void;
    /** Whether to attempt geolocation on toggle-on */
    useGeo?: boolean;
    className?: string;
}

type PulseState = "idle" | "loading" | "success" | "error";

export function AvailableNowToggle({
    value,
    onChange,
    useGeo = true,
    className = "",
}: AvailableNowToggleProps) {
    const [available, setAvailable] = useState<boolean>(value ?? false);
    const [pulse, setPulse] = useState<PulseState>("idle");
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [profileBase, setProfileBase] = useState<{ city: string; state: string } | null>(null);
    const supabase = createClient();

    // Load initial state from driver_presence
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const [{ data: presence }, { data: profile }] = await Promise.all([
                supabase.from("driver_presence").select("is_available, last_seen_at").eq("user_id", user.id).single(),
                supabase.from("profiles").select("home_base_city, home_base_state").eq("id", user.id).single(),
            ]);

            if (presence) {
                setAvailable(presence.is_available ?? false);
                setLastUpdate(presence.last_seen_at);
            }
            if (profile) {
                setProfileBase({ city: profile.home_base_city, state: profile.home_base_state });
            }
        }
        init();
    }, []);

    async function getCoords(): Promise<{ lat: number; lng: number } | null> {
        if (!useGeo || !navigator.geolocation) return null;
        return new Promise(resolve => {
            navigator.geolocation.getCurrentPosition(
                pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve(null),
                { timeout: 5000 }
            );
        });
    }

    async function toggle() {
        if (!userId || pulse === "loading") return;
        const next = !available;
        setPulse("loading");

        try {
            const coords = next ? await getCoords() : null;

            const payload: Record<string, unknown> = {
                user_id: userId,
                is_available: next,
                city: profileBase?.city ?? "",
                state: profileBase?.state ?? "",
                lat: coords?.lat ?? null,
                lng: coords?.lng ?? null,
            };

            const { error } = await supabase.functions.invoke("driver-presence-update", {
                body: payload,
            });

            if (error) throw error;

            setAvailable(next);
            setLastUpdate(new Date().toISOString());
            onChange?.(next);
            setPulse("success");
            setTimeout(() => setPulse("idle"), 1500);
        } catch {
            setPulse("error");
            setTimeout(() => setPulse("idle"), 2000);
        }
    }

    const isOn = available;
    const dotColor = isOn ? "#10b981" : "#6b7280";
    const bgColor = isOn ? "rgba(16,185,129,0.08)" : "var(--hc-panel, #141414)";
    const borderColor = isOn ? "rgba(16,185,129,0.4)" : "var(--hc-border, #333)";

    function formatLast(iso: string) {
        const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
    }

    return (
        <div
            className={className}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: 16,
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                transition: "all 0.25s",
                cursor: pulse === "loading" ? "wait" : "pointer",
            }}
            onClick={toggle}
            role="switch"
            aria-checked={isOn}
            aria-label="Toggle availability"
        >
            {/* Left — status text */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Animated dot */}
                <div style={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
                    <div style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        background: dotColor,
                        animation: isOn ? "pulse-dot 2s infinite" : "none",
                    }} />
                    <style>{`@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: isOn ? "#10b981" : "var(--hc-muted, #aaa)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {isOn ? "Available Now" : "Off Duty"}
                    </p>
                    {lastUpdate && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--hc-muted, #888)" }}>
                            Updated {formatLast(lastUpdate)}
                        </p>
                    )}
                </div>
            </div>

            {/* Right — pill toggle */}
            <div style={{
                width: 52, height: 28, borderRadius: 14,
                background: isOn ? "#10b981" : "var(--hc-elevated, #222)",
                border: `1.5px solid ${isOn ? "#10b981" : "var(--hc-border, #444)"}`,
                position: "relative",
                transition: "all 0.2s",
                flexShrink: 0,
            }}>
                <div style={{
                    position: "absolute",
                    top: 2, left: isOn ? 24 : 2,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                    transition: "left 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10,
                }}>
                    {pulse === "loading" ? "⌛" : pulse === "error" ? "!" : ""}
                </div>
            </div>
        </div>
    );
}

export default AvailableNowToggle;
