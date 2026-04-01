"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Bell, BellOff, Clock, Shield, ChevronRight, Loader2, Check } from "lucide-react";

interface EmailPrefs {
    newsletter_opt_in: boolean;
    product_updates: boolean;
    viewed_you: boolean;
    claim_reminders: boolean;
    leaderboard_alerts: boolean;
    corridor_risk_pulse: boolean;
    digest_frequency: string;
    quiet_hours_start: string;
    quiet_hours_end: string;
}

const DEFAULT_PREFS: EmailPrefs = {
    newsletter_opt_in: true,
    product_updates: true,
    viewed_you: true,
    claim_reminders: true,
    leaderboard_alerts: false,
    corridor_risk_pulse: false,
    digest_frequency: "monthly",
    quiet_hours_start: "21:00:00",
    quiet_hours_end: "07:00:00",
};

const TOGGLE_ITEMS: { key: keyof EmailPrefs; label: string; desc: string; icon: string }[] = [
    { key: "newsletter_opt_in", label: "Monthly Market Digest", desc: "Corridor heat, leaderboard movers, and intel", icon: "📡" },
    { key: "product_updates", label: "Platform Updates", desc: "New features and system changes", icon: "🚀" },
    { key: "viewed_you", label: "Profile Views", desc: "Get notified when someone checks your listing", icon: "👀" },
    { key: "claim_reminders", label: "Claim Reminders", desc: "Nudges to claim your directory listing", icon: "📋" },
    { key: "leaderboard_alerts", label: "Leaderboard Movement", desc: "When your rank changes on the board", icon: "🏆" },
    { key: "corridor_risk_pulse", label: "Corridor Risk Alerts", desc: "Safety and risk signals on your lanes", icon: "⚠️" },
];

export default function EmailPreferencesPanel() {
    const [prefs, setPrefs] = useState<EmailPrefs>(DEFAULT_PREFS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        loadPrefs();
    }, []);

    async function loadPrefs() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch("/api/email/preferences", {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPrefs({ ...DEFAULT_PREFS, ...data });
            }
        } catch (err) {
            console.error("Failed to load email prefs:", err);
        } finally {
            setLoading(false);
        }
    }

    async function savePrefs(updates: Partial<EmailPrefs>) {
        setSaving(true);
        setSaved(false);
        const newPrefs = { ...prefs, ...updates };
        setPrefs(newPrefs);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            await fetch("/api/email/preferences", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(updates),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Failed to save prefs:", err);
        } finally {
            setSaving(false);
        }
    }

    function togglePref(key: keyof EmailPrefs) {
        const newVal = !prefs[key];
        savePrefs({ [key]: newVal });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#C6923A] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-[#C6923A]" />
                        Email Preferences
                    </h2>
                    <p className="text-sm text-[#9ca3af] mt-1">Control what hits your inbox.</p>
                </div>
                {saved && (
                    <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium">
                        <Check className="w-4 h-4" /> Saved
                    </span>
                )}
            </div>

            {/* Toggle Grid */}
            <div className="bg-[#111210] border border-[#1a1c14] rounded-xl divide-y divide-[#1a1c14]">
                {TOGGLE_ITEMS.map(item => (
                    <div key={item.key} className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{item.icon}</span>
                            <div>
                                <p className="text-white text-sm font-semibold">{item.label}</p>
                                <p className="text-[#6b7280] text-xs">{item.desc}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => togglePref(item.key)}
                            disabled={saving}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${prefs[item.key] ? "bg-[#C6923A]" : "bg-[#374151]"
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${prefs[item.key] ? "translate-x-5" : "translate-x-0"
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>

            {/* Digest Frequency */}
            <div className="bg-[#111210] border border-[#1a1c14] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-[#C6923A]" />
                    <p className="text-white text-sm font-semibold">Digest Frequency</p>
                </div>
                <div className="flex gap-2">
                    {["weekly", "monthly", "never"].map(freq => (
                        <button
                            key={freq}
                            onClick={() => savePrefs({ digest_frequency: freq })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${prefs.digest_frequency === freq
                                    ? "bg-[#C6923A] text-[#0a0b07]"
                                    : "bg-[#1a1c14] text-[#9ca3af] hover:bg-[#222]"
                                }`}
                        >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quiet Hours */}
            <div className="bg-[#111210] border border-[#1a1c14] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                    <BellOff className="w-4 h-4 text-[#C6923A]" />
                    <p className="text-white text-sm font-semibold">Quiet Hours</p>
                    <span className="text-[#6b7280] text-xs ml-1">(no emails during this window)</span>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="time"
                        value={prefs.quiet_hours_start?.slice(0, 5) || "21:00"}
                        onChange={e => savePrefs({ quiet_hours_start: e.target.value + ":00" })}
                        className="bg-[#0a0b07] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm"
                    />
                    <span className="text-[#6b7280] text-sm">to</span>
                    <input
                        type="time"
                        value={prefs.quiet_hours_end?.slice(0, 5) || "07:00"}
                        onChange={e => savePrefs({ quiet_hours_end: e.target.value + ":00" })}
                        className="bg-[#0a0b07] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm"
                    />
                </div>
            </div>

            {/* Unsubscribe All */}
            <div className="text-center pt-2">
                <button
                    onClick={() => {
                        savePrefs({
                            newsletter_opt_in: false,
                            product_updates: false,
                            viewed_you: false,
                            claim_reminders: false,
                            leaderboard_alerts: false,
                            corridor_risk_pulse: false,
                        });
                    }}
                    className="text-[#6b7280] hover:text-red-400 text-xs underline transition-colors"
                >
                    Unsubscribe from all emails
                </button>
            </div>
        </div>
    );
}
