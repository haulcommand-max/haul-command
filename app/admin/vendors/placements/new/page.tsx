"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { dateToTs, nowTs } from "@/lib/vendor/helpers";

// =========================================================
// Admin Create Placement — /admin/vendors/placements/new
// =========================================================

const PLACEMENT_TYPES = ["near_route", "emergency_top", "category_top", "corridor_exclusive", "push_eligible"];

export default function AdminPlacementsNewPage() {
    const router = useRouter();
    const supabase = createClient();

    const [vendors, setVendors] = useState<any[]>([]);
    const [form, setForm] = useState({
        vendor_id: "",
        placement_type: "near_route",
        region1: "",
        corridor_name: "",
        start: "",
        end: "",
        bid_monthly: 0,
        is_exclusive: false,
    });
    const [working, setWorking] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        supabase.from("vendors").select("id, legal_name, dba_name, vendor_type")
            .eq("status", "active").order("legal_name")
            .then(({ data }) => setVendors(data ?? []));
    }, []);

    function set(k: string, v: unknown) {
        setForm(f => ({ ...f, [k]: v }));
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!form.vendor_id) { setError("Select a vendor."); return; }
        if (!form.start || !form.end) { setError("Start and end dates required."); return; }

        setWorking(true);
        setError("");

        // Exclusivity conflict check
        if (form.is_exclusive || form.placement_type === "corridor_exclusive") {
            const { data: conflicts } = await supabase
                .from("premium_placements")
                .select("id")
                .eq("placement_type", form.placement_type)
                .eq("region1", form.region1)
                .eq("is_exclusive", true)
                .lte("start_at", dateToTs(form.end))
                .gte("end_at", dateToTs(form.start));
            if ((conflicts ?? []).length > 0) {
                setError("Exclusive conflict: another exclusive placement already covers this window.");
                setWorking(false);
                return;
            }
        }

        const { error: dbErr } = await supabase.from("premium_placements").insert({
            vendor_id: form.vendor_id,
            placement_type: form.placement_type,
            region1: form.region1 || null,
            corridor_name: form.corridor_name || null,
            start_at: dateToTs(form.start),
            end_at: dateToTs(form.end),
            bid_monthly: form.bid_monthly,
            is_exclusive: form.placement_type === "corridor_exclusive" ? true : form.is_exclusive,
        });

        setWorking(false);
        if (dbErr) { setError(dbErr.message); return; }
        router.push("/admin/vendors/placements");
    }

    const inp = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Placement</h1>
                <p className="mt-1 text-sm text-gray-500">Admin-created placements (deals, promos, manual overrides).</p>
            </div>

            <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                        <select required value={form.vendor_id} onChange={e => set("vendor_id", e.target.value)} className={inp}>
                            <option value="">— select vendor —</option>
                            {vendors.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.dba_name ?? v.legal_name} ({v.vendor_type.replace(/_/g, " ")})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                        <select required value={form.placement_type} onChange={e => set("placement_type", e.target.value)} className={inp}>
                            {PLACEMENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region (State/Province)</label>
                        <input value={form.region1} onChange={e => set("region1", e.target.value)}
                            placeholder="FL, GA, ON…" className={inp} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Corridor (optional)</label>
                        <input value={form.corridor_name} onChange={e => set("corridor_name", e.target.value)}
                            placeholder="I-75, I-95, 401…" className={inp} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bid ($/mo)</label>
                        <input type="number" min={0} value={form.bid_monthly}
                            onChange={e => set("bid_monthly", Number(e.target.value))} className={inp} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
                        <input type="date" required value={form.start} onChange={e => set("start", e.target.value)} className={inp} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End date *</label>
                        <input type="date" required value={form.end} onChange={e => set("end", e.target.value)} className={inp} />
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        <input type="checkbox" id="exclusive" checked={form.is_exclusive}
                            onChange={e => set("is_exclusive", e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                        <label htmlFor="exclusive" className="text-sm text-gray-700 cursor-pointer">Exclusive</label>
                    </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={working}
                        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                        {working ? "Creating…" : "Create Placement"}
                    </button>
                    <button type="button" onClick={() => router.back()}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
