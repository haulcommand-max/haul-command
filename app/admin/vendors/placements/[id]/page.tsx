"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { nowTs } from "@/lib/vendor/helpers";

// =========================================================
// Admin Placement Detail — /admin/vendors/placements/:id
// Edit placement, expire, see exclusivity conflicts
// =========================================================

export default function AdminPlacementDetailPage() {
    const { id } = useParams() as { id: string };
    const supabase = createClient();

    const [placement, setPlacement] = useState<any>(null);
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [toast, setToast] = useState("");

    useEffect(() => {
        async function load() {
            const { data: p } = await supabase.from("premium_placements").select("*").eq("id", id).single();
            setPlacement(p);

            if (p) {
                // Find overlapping exclusive placements with the same type + region + corridor
                const { data: cx } = await supabase
                    .from("premium_placements")
                    .select("id, vendor_id, placement_type, region1, corridor_name, start_at, end_at")
                    .eq("placement_type", p.placement_type)
                    .eq("is_exclusive", true)
                    .eq("region1", p.region1 ?? "")
                    .neq("id", id)
                    .lte("start_at", p.end_at)
                    .gte("end_at", p.start_at);
                setConflicts(cx ?? []);
            }
            setLoading(false);
        }
        load();
    }, [id]);

    function set(k: string, v: unknown) {
        setPlacement((prev: any) => ({ ...prev, [k]: v }));
    }

    async function save() {
        setWorking(true);
        const { error } = await supabase.from("premium_placements").update({
            placement_type: placement.placement_type,
            region1: placement.region1,
            corridor_name: placement.corridor_name,
            bid_monthly: placement.bid_monthly,
            is_exclusive: placement.is_exclusive,
            start_at: placement.start_at,
            end_at: placement.end_at,
            updated_at: new Date().toISOString(),
        }).eq("id", id);
        setWorking(false);
        setToast(error ? "Error: " + error.message : "Saved.");
    }

    async function expireConflict(conflictId: string) {
        await supabase.from("premium_placements").update({ end_at: nowTs() }).eq("id", conflictId);
        setConflicts(prev => prev.filter(c => c.id !== conflictId));
        setToast("Conflict expired.");
    }

    const inp = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

    if (loading) return <div className="p-8 text-gray-400 text-sm">Loading…</div>;
    if (!placement) return <div className="p-8 text-red-500 text-sm">Placement not found.</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Placement Detail</h1>
                <p className="mt-1 text-sm text-gray-500">Edit or expire a placement. Exclusivity conflicts are shown below.</p>
            </div>

            {/* Edit card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <h2 className="font-semibold text-gray-800">Placement</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <input value={placement.placement_type} onChange={e => set("placement_type", e.target.value)} className={inp} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
                        <input value={placement.region1 ?? ""} onChange={e => set("region1", e.target.value)} className={inp} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Corridor</label>
                        <input value={placement.corridor_name ?? ""} onChange={e => set("corridor_name", e.target.value)} className={inp} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Bid ($/mo)</label>
                        <input type="number" min={0} value={placement.bid_monthly}
                            onChange={e => set("bid_monthly", Number(e.target.value))} className={inp} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
                        <input type="datetime-local" value={placement.start_at?.slice(0, 16) ?? ""}
                            onChange={e => set("start_at", e.target.value + ":00Z")} className={inp} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
                        <input type="datetime-local" value={placement.end_at?.slice(0, 16) ?? ""}
                            onChange={e => set("end_at", e.target.value + ":00Z")} className={inp} />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <input type="checkbox" id="excl" checked={placement.is_exclusive ?? false}
                            onChange={e => set("is_exclusive", e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                        <label htmlFor="excl" className="text-sm text-gray-700 cursor-pointer">Exclusive</label>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button onClick={save} disabled={working}
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                        {working ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => { set("end_at", nowTs()); save(); }}
                        className="px-5 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                        Expire Now
                    </button>
                </div>
                {toast && <p className="text-sm text-gray-600">{toast}</p>}
            </div>

            {/* Exclusivity conflicts */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h2 className="font-semibold text-gray-800">Exclusivity Conflicts</h2>
                    {conflicts.length === 0 && <p className="text-sm text-gray-500 mt-1">No conflicts.</p>}
                </div>
                {conflicts.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
                                <tr>
                                    {["Vendor", "Type", "Region", "Corridor", "Overlap", ""].map(h => (
                                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {conflicts.map(c => {
                                    const overlapStart = c.start_at > placement.start_at ? c.start_at : placement.start_at;
                                    const overlapEnd = c.end_at < placement.end_at ? c.end_at : placement.end_at;
                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-600 text-xs">{c.vendor_id.slice(0, 8)}</td>
                                            <td className="px-4 py-3">{c.placement_type.replace(/_/g, " ")}</td>
                                            <td className="px-4 py-3">{c.region1 ?? "—"}</td>
                                            <td className="px-4 py-3">{c.corridor_name ?? "—"}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                {new Date(overlapStart).toLocaleDateString()} → {new Date(overlapEnd).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => expireConflict(c.id)}
                                                    className="text-red-500 hover:underline text-xs font-medium">Expire Conflict</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
