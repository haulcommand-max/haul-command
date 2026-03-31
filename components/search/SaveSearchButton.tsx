'use client';

import { useState } from 'react';
import { Bell, BellOff, Check, Loader2 } from 'lucide-react';
import { track } from '@/lib/telemetry';

/* ──────────────────────────────────────────────────── */
/*  SaveSearchButton                                     */
/*  Saves current search + configures alert preferences   */
/* ──────────────────────────────────────────────────── */

interface SaveSearchButtonProps {
    /** Current search type */
    searchType: 'load' | 'operator' | 'corridor';
    /** Current search filters (the entire search state) */
    filters: Record<string, unknown>;
    /** Search center coordinates */
    geoCenter?: { lat: number; lon: number };
    /** Search radius in km */
    radiusKm?: number;
    /** Country code */
    countryCode?: string;
    /** Is the user logged in? */
    isAuthenticated?: boolean;
}

type AlertFrequency = 'instant' | 'daily_digest' | 'weekly_digest';
type AlertChannel = 'push' | 'email' | 'both';

export default function SaveSearchButton({
    searchType,
    filters,
    geoCenter,
    radiusKm,
    countryCode,
    isAuthenticated = false,
}: SaveSearchButtonProps) {
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [frequency, setFrequency] = useState<AlertFrequency>('instant');
    const [channel, setChannel] = useState<AlertChannel>('push');

    const handleSave = async () => {
        if (!isAuthenticated) {
            // Redirect to login with return URL
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}&action=save_search`;
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/saved-searches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    search_type: searchType,
                    filters,
                    geo_center_lat: geoCenter?.lat || null,
                    geo_center_lon: geoCenter?.lon || null,
                    radius_km: radiusKm || null,
                    country_code: countryCode || null,
                    alert_frequency: frequency,
                    alert_channel: channel,
                }),
            });

            if (res.ok) {
                setSaved(true);
                track('saved_search_created' as any, {
                    entity_type: searchType,
                    metadata: { frequency, channel, country_code: countryCode },
                });
            }
        } catch {
            // Silently fail
        } finally {
            setSaving(false);
        }
    };

    if (saved) {
        return (
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium">
                <Check className="w-4 h-4" />
                Saved! You&apos;ll get alerts.
            </div>
        );
    }

    return (
        <div className="relative">
            <button aria-label="Interactive Button"
                onClick={() => setShowConfig(!showConfig)}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
                <Bell className="w-4 h-4 text-amber-400" />
                Save Search + Alert
            </button>

            {showConfig && (
                <div className="absolute top-full mt-2 right-0 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 space-y-4 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-medium">Alert frequency</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {(['instant', 'daily_digest', 'weekly_digest'] as AlertFrequency[]).map((f) => (
                                <button aria-label="Interactive Button"
                                    key={f}
                                    onClick={() => setFrequency(f)}
                                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${frequency === f
                                            ? 'bg-amber-500 text-slate-900'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {f === 'instant' ? 'Instant' : f === 'daily_digest' ? 'Daily' : 'Weekly'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-medium">Receive via</label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {(['push', 'email', 'both'] as AlertChannel[]).map((c) => (
                                <button aria-label="Interactive Button"
                                    key={c}
                                    onClick={() => setChannel(c)}
                                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${channel === c
                                            ? 'bg-amber-500 text-slate-900'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button aria-label="Interactive Button"
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-900 font-bold px-4 py-2.5 rounded-lg transition-colors text-sm"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Bell className="w-4 h-4" />
                                Save &amp; Enable Alerts
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
