"use client";
import { useEffect, useState } from "react";

type AlertSettings = {
    enabled: boolean;
    radius_miles: number;
    corridor_ids: string[];
    alert_types: string[];
    quiet_hours_enabled: boolean;
    quiet_start: string | null;
    quiet_end: string | null;
    max_push_per_hour: number;
    max_push_per_day: number;
};

const ALERT_TYPE_LABELS: Record<string, string> = {
    load_posted: "New Load Posted",
    offer_received: "Offer Received",
    corridor_hot: "Corridor Heating Up",
    nearby_driver_needed: "Driver Needed Nearby",
};

export default function AlertsSettingsPage() {
    const [s, setS] = useState<AlertSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch("/api/settings/alerts").then((r) => r.json()).then(setS);
    }, []);

    async function save() {
        if (!s) return;
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch("/api/settings/alerts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(s),
            });
            if (!res.ok) throw new Error("Save failed");
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    }

    if (!s) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <header className="px-5 pt-8 pb-4 border-b border-gray-800">
                <h1 className="text-2xl font-black">Alert Settings</h1>
                <p className="text-gray-400 text-sm mt-1">Control when and how you get notified.</p>
            </header>

            <div className="px-5 py-6 space-y-8 max-w-xl">
                {/* Master toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">Push Notifications</p>
                        <p className="text-gray-400 text-sm">Receive alerts for loads, offers, and corridor activity.</p>
                    </div>
                    <button
                        onClick={() => setS({ ...s, enabled: !s.enabled })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${s.enabled ? "bg-orange-500" : "bg-gray-700"}`}
                        aria-checked={s.enabled}
                        role="switch"
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${s.enabled ? "translate-x-6" : ""}`} />
                    </button>
                </div>

                {s.enabled && (
                    <>
                        {/* Radius */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <p className="font-semibold">Alert Radius</p>
                                <span className="text-orange-400 font-bold">{s.radius_miles} mi</span>
                            </div>
                            <input
                                type="range" min={5} max={250} step={5} value={s.radius_miles}
                                onChange={(e) => setS({ ...s, radius_miles: Number(e.target.value) })}
                                className="w-full accent-orange-500"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>5 mi</span><span>250 mi</span>
                            </div>
                        </div>

                        {/* Alert types */}
                        <div>
                            <p className="font-semibold mb-3">Alert Types</p>
                            <div className="space-y-3">
                                {Object.entries(ALERT_TYPE_LABELS).map(([type, label]) => (
                                    <label key={type} className="flex items-center justify-between cursor-pointer">
                                        <span className="text-gray-300">{label}</span>
                                        <button
                                            onClick={() => {
                                                const next = s.alert_types.includes(type)
                                                    ? s.alert_types.filter((x) => x !== type)
                                                    : [...s.alert_types, type];
                                                setS({ ...s, alert_types: next });
                                            }}
                                            className={`relative w-10 h-5 rounded-full transition-colors ${s.alert_types.includes(type) ? "bg-orange-500" : "bg-gray-700"}`}
                                            role="switch" aria-checked={s.alert_types.includes(type)}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.alert_types.includes(type) ? "translate-x-5" : ""}`} />
                                        </button>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Quiet hours */}
                        <div>
                            <label className="flex items-center justify-between cursor-pointer mb-3">
                                <div>
                                    <p className="font-semibold">Quiet Hours</p>
                                    <p className="text-gray-400 text-sm">No alerts during set hours.</p>
                                </div>
                                <button
                                    onClick={() => setS({ ...s, quiet_hours_enabled: !s.quiet_hours_enabled })}
                                    className={`relative w-10 h-5 rounded-full transition-colors ${s.quiet_hours_enabled ? "bg-orange-500" : "bg-gray-700"}`}
                                    role="switch" aria-checked={s.quiet_hours_enabled}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.quiet_hours_enabled ? "translate-x-5" : ""}`} />
                                </button>
                            </label>
                            {s.quiet_hours_enabled && (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">From</p>
                                        <input type="time" value={s.quiet_start ?? "22:00"}
                                            onChange={(e) => setS({ ...s, quiet_start: e.target.value })}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1">To</p>
                                        <input type="time" value={s.quiet_end ?? "06:00"}
                                            onChange={(e) => setS({ ...s, quiet_end: e.target.value })}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Caps */}
                        <div>
                            <p className="font-semibold mb-3">Daily Limits</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Max per hour</p>
                                    <input type="number" min={0} max={60} value={s.max_push_per_hour}
                                        onChange={(e) => setS({ ...s, max_push_per_hour: Math.min(60, Math.max(0, Number(e.target.value))) })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Max per day</p>
                                    <input type="number" min={0} max={500} value={s.max_push_per_day}
                                        onChange={(e) => setS({ ...s, max_push_per_day: Math.min(500, Math.max(0, Number(e.target.value))) })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Save */}
                <button
                    onClick={save}
                    disabled={saving}
                    className={`w-full py-3.5 rounded-xl font-bold text-white transition-all ${saved ? "bg-green-600" : "bg-orange-500 hover:bg-orange-400"} disabled:opacity-60`}
                >
                    {saving ? "Saving…" : saved ? "✓ Saved" : "Save Settings"}
                </button>
            </div>
        </div>
    );
}
