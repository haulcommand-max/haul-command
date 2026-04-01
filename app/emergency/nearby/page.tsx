"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// =========================================================
// Emergency Nearby — /emergency/nearby
// Authenticated. Incident form → calls emergency-vendors
// edge function → ranked results list.
// =========================================================

const INCIDENT_TYPES = [
    { value: "breakdown", label: "Breakdown" },
    { value: "tire", label: "Tire" },
    { value: "tow", label: "Tow needed" },
    { value: "spill", label: "Spill / Hazmat" },
    { value: "parking", label: "Truck parking" },
    { value: "parts", label: "Parts needed" },
    { value: "other", label: "Other" },
] as const;

type IncidentType = typeof INCIDENT_TYPES[number]["value"];

interface NearbyResult {
    rank: number;
    vendor_id: string;
    vendor_location_id: string;
    vendor_name: string;
    vendor_type: string;
    dispatch_phone: string;
    city: string;
    region1: string;
    distance_miles: number;
    plan_tier: string;
    verified_status: string;
    is_24_7: boolean;
    services_joined: string;
    surfaced_reason: string[];
}

export default function EmergencyNearbyPage() {
    const supabase = createClient();
    const router = useRouter();

    const [form, setForm] = useState({
        incident_type: "breakdown" as IncidentType,
        lat: "",
        lng: "",
        region1: "",
        notes: "",
    });
    const [results, setResults] = useState<NearbyResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [requestId, setRequestId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [locating, setLocating] = useState(false);

    function set(field: string, value: string) {
        setForm(f => ({ ...f, [field]: value }));
    }

    function useMyLocation() {
        if (!navigator.geolocation) { setError("Geolocation not available"); return; }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            pos => {
                set("lat", String(pos.coords.latitude.toFixed(6)));
                set("lng", String(pos.coords.longitude.toFixed(6)));
                setLocating(false);
            },
            () => { setError("Could not get location"); setLocating(false); }
        );
    }

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        if (!form.lat || !form.lng) { setError("Lat/lng required — use the button above or enter manually."); return; }
        setLoading(true);
        setError("");
        setResults([]);

        // Create emergency_request row first
        const { data: erData, error: erErr } = await supabase
            .from("emergency_requests")
            .insert({
                incident_type: form.incident_type,
                lat: Number(form.lat),
                lng: Number(form.lng),
                region1: form.region1 || null,
                notes: form.notes || null,
                status: "open",
            })
            .select("id")
            .single();

        if (erErr || !erData) { setError("Failed to create request: " + erErr?.message); setLoading(false); return; }
        setRequestId(erData.id);

        // Call edge function
        const { data: { session } } = await supabase.auth.getSession();
        const resp = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/emergency-vendors`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token ?? ""}`,
                },
                body: JSON.stringify({
                    emergency_request_id: erData.id,
                    lat: Number(form.lat),
                    lng: Number(form.lng),
                    incident_type: form.incident_type,
                    region1: form.region1 || undefined,
                }),
            }
        );

        setLoading(false);
        if (!resp.ok) { setError("Search failed. Try again."); return; }
        const json = await resp.json() as { results: NearbyResult[] };
        setResults(json.results ?? []);
    }

    async function logCall(result: NearbyResult) {
        if (!requestId) return;
        await supabase.from("emergency_dispatch_log").insert({
            emergency_request_id: requestId,
            vendor_id: result.vendor_id,
            vendor_location_id: result.vendor_location_id,
            surfaced_rank: result.rank,
            surfaced_reason: result.surfaced_reason,
            call_initiated: true,
            call_initiated_at: new Date().toISOString(),
        });
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-red-600">🚨 Emergency Nearby</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Find the nearest available service provider for your situation.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSearch} className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Incident type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Incident type *</label>
                        <select required value={form.incident_type} onChange={e => set("incident_type", e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                            {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    {/* State / Province */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State / Province (optional)</label>
                        <input value={form.region1} onChange={e => set("region1", e.target.value)}
                            placeholder="FL, ON…" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    </div>

                    {/* Lat */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                        <input value={form.lat} onChange={e => set("lat", e.target.value)} type="number" step="any"
                            placeholder="e.g. 27.9944" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    </div>

                    {/* Lng */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                        <input value={form.lng} onChange={e => set("lng", e.target.value)} type="number" step="any"
                            placeholder="e.g. -81.7602" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
                        placeholder="Vehicle height, what broke, load type…" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>

                <div className="flex items-center gap-3">
                    <button type="button" onClick={useMyLocation} disabled={locating}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                        {locating ? "Locating…" : "📍 Use my location"}
                    </button>
                    <button type="submit" disabled={loading}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                        {loading ? "Searching…" : "Find Help Now"}
                    </button>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </form>

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-3">
                    <h2 className="font-semibold text-gray-800">
                        {results.length} vendors nearby
                    </h2>
                    {results.map((r) => (
                        <div key={r.vendor_id} className={`rounded-xl border bg-white p-5 shadow-sm flex items-start justify-between gap-4 ${r.rank === 1 ? "border-orange-300 ring-1 ring-orange-200" : "border-gray-200"
                            }`}>
                            <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {r.rank === 1 && (
                                        <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded font-medium">Top Pick</span>
                                    )}
                                    <span className="font-semibold text-gray-900">{r.vendor_name}</span>
                                    {r.verified_status === "verified" && (
                                        <span className="text-green-600 text-xs">✓ Verified</span>
                                    )}
                                    {r.is_24_7 && <span className="text-gray-500 text-xs">24/7</span>}
                                    {r.plan_tier !== "free" && (
                                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{r.plan_tier}</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">
                                    {r.vendor_type.replace(/_/g, " ")} · {r.city}, {r.region1} · {r.distance_miles} mi away
                                </p>
                                {r.services_joined && (
                                    <p className="text-xs text-gray-400 truncate">{r.services_joined}</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 shrink-0">
                                <a href={`tel:${r.dispatch_phone}`}
                                    onClick={() => logCall(r)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                                    📞 Call
                                </a>
                                <a href={`/vendors/${r.vendor_id}`}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm text-center transition-colors whitespace-nowrap">
                                    Profile
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
