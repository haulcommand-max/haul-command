"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { nowTs } from "@/lib/vendor/helpers";

// =========================================================
// Admin Placements Manager — /admin/vendors/placements
// =========================================================

const TYPE_OPTIONS = ["all", "near_route", "emergency_top", "category_top", "corridor_exclusive", "push_eligible"];
const STATUS_OPTIONS = ["active_now", "upcoming", "expired", "all"];

export default function AdminPlacementsPage() {
    const supabase = createClient();
    const [filters, setFilters] = useState({ type: "all", region1: "", corridor: "", status: "active_now" });
    const [placements, setPlacements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    function setFilter(k: string, v: string) {
        setFilters(f => ({ ...f, [k]: v }));
    }

    async function load() {
        setLoading(true);
        let q = supabase.from("premium_placements").select("*, vendors(legal_name, dba_name)").order("start_at", { ascending: false });

        if (filters.type !== "all") q = q.eq("placement_type", filters.type);
        if (filters.region1) q = q.eq("region1", filters.region1);
        if (filters.corridor) q = q.eq("corridor_name", filters.corridor);

        const now = new Date().toISOString();
        if (filters.status === "active_now") { q = q.lte("start_at", now).gte("end_at", now); }
        else if (filters.status === "upcoming") { q = q.gt("start_at", now); }
        else if (filters.status === "expired") { q = q.lt("end_at", now); }

        const { data } = await q;
        setPlacements(data ?? []);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function expireNow(id: string) {
        await supabase.from("premium_placements").update({ end_at: nowTs() }).eq("id", id);
        setPlacements(prev => prev.map(p => p.id === id ? { ...p, end_at: nowTs() } : p));
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Premium Placements</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage emergency top, near route, category top, corridor exclusives.</p>
                </div>
                <Link aria-label="Navigation Link" href="/admin/vendors/placements/new"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                    Create Placement
                </Link>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-white/10 bg-[#121212] p-4 shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <select value={filters.type} onChange={e => setFilter("type", e.target.value)}
                            className="w-full border border-white/20 rounded-md px-2 py-1.5 text-sm">
                            {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
                        <input value={filters.region1} onChange={e => setFilter("region1", e.target.value)}
                            placeholder="FL, ON"¦" className="w-full border border-white/20 rounded-md px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Corridor</label>
                        <input value={filters.corridor} onChange={e => setFilter("corridor", e.target.value)}
                            placeholder="I-75, 401"¦" className="w-full border border-white/20 rounded-md px-2 py-1.5 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                        <select value={filters.status} onChange={e => setFilter("status", e.target.value)}
                            className="w-full border border-white/20 rounded-md px-2 py-1.5 text-sm">
                            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
                <button aria-label="Interactive Button" onClick={load} className="mt-3 px-4 py-1.5 border border-white/20 text-sm rounded-lg hover:bg-[#1A1A1A] transition-colors">
                    Apply
                </button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/10 bg-[#121212] shadow-sm overflow-hidden">
                {loading ? (
                    <p className="p-6 text-gray-400 text-sm">Loading"¦</p>
                ) : placements.length === 0 ? (
                    <p className="p-6 text-gray-500 text-sm">No placements found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#1A1A1A] text-xs text-gray-500 uppercase tracking-wide text-left">
                                <tr>
                                    {["Type", "Vendor", "Region", "Corridor", "Bid", "Excl", "Start", "End", ""].map(h => (
                                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {placements.map(p => (
                                    <tr key={p.id} className="hover:bg-[#1A1A1A]">
                                        <td className="px-4 py-3">{p.placement_type.replace(/_/g, " ")}</td>
                                        <td className="px-4 py-3 text-neutral-300 font-medium">
                                            {(p.vendors as any)?.dba_name ?? (p.vendors as any)?.legal_name ?? p.vendor_id.slice(0, 8)}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{p.region1 ?? "—"}</td>
                                        <td className="px-4 py-3 text-gray-600">{p.corridor_name ?? "—"}</td>
                                        <td className="px-4 py-3">${p.bid_monthly}</td>
                                        <td className="px-4 py-3">{p.is_exclusive ? "âœ“" : "—"}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.start_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.end_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 flex gap-3">
                                            <Link aria-label="Navigation Link" href={`/admin/vendors/placements/${p.id}`}
                                                className="text-orange-600 hover:underline text-xs font-medium">Open</Link>
                                            <button aria-label="Interactive Button" onClick={() => expireNow(p.id)}
                                                className="text-red-500 hover:underline text-xs">Expire</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}