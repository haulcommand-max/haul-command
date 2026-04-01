"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { planPrice, planEntitlements, regionsForVendor, dateToTs, nowTs } from "@/lib/vendor/helpers";

// =========================================================
// Vendor Upgrade & Placements — /vendors/:vendorId/upgrade
// =========================================================

const PLAN_TIERS = [
    { value: "free", label: "Free — Listed + limited in-app surfacing", price: "$0" },
    { value: "verified", label: "Verified — Badge + better surfacing", price: "$29/mo" },
    { value: "priority", label: "Priority — Boosted emergency + route", price: "$99/mo" },
    { value: "command_partner", label: "Command Partner — top eligible placement", price: "$299/mo" },
    { value: "corridor_dominator", label: "Corridor Dominator — corridor exclusivity", price: "$999/mo" },
] as const;

const PLACEMENT_TABS = ["Emergency Top", "Near Route", "Category Top", "Corridor Exclusive"] as const;
type PlacementTabName = typeof PLACEMENT_TABS[number];

const PLACEMENT_TYPE_MAP: Record<PlacementTabName, string> = {
    "Emergency Top": "emergency_top",
    "Near Route": "near_route",
    "Category Top": "category_top",
    "Corridor Exclusive": "corridor_exclusive",
};

const PLACEMENT_DESC: Record<PlacementTabName, { desc: string; bestFor: string; defaultBid: number; needsCorridor: boolean }> = {
    "Emergency Top": { desc: "Shows you higher when drivers hit Emergency Nearby.", bestFor: "Towing, roadside repair, tire service.", defaultBid: 299, needsCorridor: false },
    "Near Route": { desc: "Surfaces your listing when a route passes through your coverage area.", bestFor: "Parking, parts, repair, towing.", defaultBid: 99, needsCorridor: false },
    "Category Top": { desc: "Top slot inside your category for a region.", bestFor: "Winning your local market.", defaultBid: 149, needsCorridor: false },
    "Corridor Exclusive": { desc: "Exclusive placement for a corridor (if available). Own the lane.", bestFor: "Dominant corridor presence.", defaultBid: 999, needsCorridor: true },
};

function makePlacementForm(defaultBid: number) {
    return { region1: "", corridor: "", start: "", end: "", bid: defaultBid, exclusive: false };
}

export default function VendorUpgradePage() {
    const { vendorId } = useParams() as { vendorId: string };
    const router = useRouter();
    const supabase = createClient();

    const [plan, setPlan] = useState<any>(null);
    const [regions, setRegions] = useState<string[]>([]);
    const [placements, setPlacements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Plan upgrade
    const [nextTier, setNextTier] = useState("");
    const [planWorking, setPlanWorking] = useState(false);
    const [planToast, setPlanToast] = useState("");

    // Placement tabs
    const [activeTab, setActiveTab] = useState<PlacementTabName>("Emergency Top");
    const [pForms, setPForms] = useState<Record<PlacementTabName, ReturnType<typeof makePlacementForm>>>({
        "Emergency Top": makePlacementForm(299),
        "Near Route": makePlacementForm(99),
        "Category Top": makePlacementForm(149),
        "Corridor Exclusive": makePlacementForm(999),
    });
    const [piWorking, setPiWorking] = useState(false);
    const [piToast, setPiToast] = useState("");

    useEffect(() => {
        async function load() {
            const [pRes, lRes, plRes] = await Promise.all([
                supabase.from("vendor_plans").select("*").eq("vendor_id", vendorId).eq("plan_status", "active").single(),
                supabase.from("vendor_locations").select("region1").eq("vendor_id", vendorId),
                supabase.from("premium_placements").select("*").eq("vendor_id", vendorId).order("start_at", { ascending: false }),
            ]);
            setPlan(pRes.data);
            setNextTier(pRes.data?.plan_tier ?? "free");
            const rgs = [...new Set((lRes.data ?? []).map((x: any) => x.region1).filter(Boolean))] as string[];
            setRegions(rgs);
            setPlacements(plRes.data ?? []);
            setLoading(false);
        }
        load();
    }, [vendorId]);

    async function applyPlanChange() {
        if (!plan) return;
        setPlanWorking(true);
        const { error } = await supabase.from("vendor_plans").update({
            plan_tier: nextTier,
            monthly_price: planPrice(nextTier),
            entitlements_json: planEntitlements(nextTier),
            updated_at: new Date().toISOString(),
        }).eq("id", plan.id);
        setPlanWorking(false);
        setPlanToast(error ? "Error: " + error.message : "Plan updated!");
        if (!error) setPlan((p: any) => ({ ...p, plan_tier: nextTier, monthly_price: planPrice(nextTier), entitlements_json: planEntitlements(nextTier) }));
    }

    async function buyPlacement(tabName: PlacementTabName) {
        const f = pForms[tabName];
        if (!f.start || !f.end) { setPiToast("Start and end dates required."); return; }
        if (tabName === "Corridor Exclusive" && !f.corridor) { setPiToast("Corridor name required."); return; }

        setPiWorking(true);
        setPiToast("");

        // Exclusivity check
        if (f.exclusive || tabName === "Corridor Exclusive") {
            const now = new Date().toISOString();
            const { data: conflicts } = await supabase
                .from("premium_placements")
                .select("id")
                .eq("placement_type", PLACEMENT_TYPE_MAP[tabName])
                .eq("is_exclusive", true)
                .eq("region1", f.region1)
                .eq("corridor_name", f.corridor || "")
                .lte("start_at", dateToTs(f.end))
                .gte("end_at", dateToTs(f.start));
            if ((conflicts ?? []).length > 0) {
                setPiToast("Exclusive placement already taken for this corridor/window.");
                setPiWorking(false);
                return;
            }
        }

        const { error } = await supabase.from("premium_placements").insert({
            vendor_id: vendorId,
            placement_type: PLACEMENT_TYPE_MAP[tabName],
            region1: f.region1 || null,
            corridor_name: f.corridor || null,
            bid_monthly: f.bid,
            is_exclusive: tabName === "Corridor Exclusive" ? true : f.exclusive,
            start_at: dateToTs(f.start),
            end_at: dateToTs(f.end),
        });
        setPiWorking(false);
        if (error) { setPiToast("Error: " + error.message); return; }
        setPiToast("Placement requested!");
        // Refresh placements list
        supabase.from("premium_placements").select("*").eq("vendor_id", vendorId).order("start_at", { ascending: false })
            .then(({ data }) => setPlacements(data ?? []));
    }

    async function cancelPlacement(id: string) {
        if (!confirm("Cancel this placement?")) return;
        await supabase.from("premium_placements").update({ end_at: nowTs() }).eq("id", id);
        setPlacements(prev => prev.map(p => p.id === id ? { ...p, end_at: nowTs() } : p));
    }

    function setForm(tab: PlacementTabName, field: string, value: unknown) {
        setPForms(prev => ({ ...prev, [tab]: { ...prev[tab], [field]: value } }));
    }

    if (loading) return <div className="p-8 text-gray-400 text-sm">Loading…</div>;

    const ent = plan?.entitlements_json ?? {};
    const pf = pForms[activeTab];
    const pd = PLACEMENT_DESC[activeTab];

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Upgrade & Placements</h1>
                    <p className="mt-1 text-sm text-gray-500">Boost visibility inside Emergency Nearby and route/corridor surfacing.</p>
                </div>
                <a href={`/vendors/${vendorId}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                    View Profile
                </a>
            </div>

            {/* Plan grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current plan */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
                    <h2 className="font-semibold text-gray-800">Current Plan</h2>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {[["Tier", plan?.plan_tier], ["Status", plan?.plan_status], ["Monthly", `$${plan?.monthly_price ?? 0}`]].map(([l, v]) => (
                            <div key={l} className="bg-gray-50 rounded-lg p-2">
                                <p className="text-xs text-gray-500">{l}</p>
                                <p className="font-semibold text-gray-900 text-sm">{v}</p>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-3 space-y-1 text-sm text-gray-600">
                        <p>Verified badge: <span className="font-medium">{String(ent.verified_badge ?? false)}</span></p>
                        <p>Emergency: <span className="font-medium">{ent.emergency_surface ?? "none"}</span></p>
                        <p>In-app surface: <span className="font-medium">{ent.in_app_surface ?? "limited"}</span></p>
                        <p>Corridor boost: <span className="font-medium">{String(ent.corridor_boost ?? false)}</span></p>
                        <p>Push eligible: <span className="font-medium">{String(ent.push_eligible ?? false)}</span></p>
                    </div>
                </div>

                {/* Upgrade selector */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                    <h2 className="font-semibold text-gray-800">Upgrade Plan</h2>
                    <div className="space-y-2">
                        {PLAN_TIERS.map(tier => (
                            <label key={tier.value}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${nextTier === tier.value ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"
                                    }`}>
                                <input type="radio" name="tier" value={tier.value} checked={nextTier === tier.value}
                                    onChange={() => setNextTier(tier.value)} className="mt-0.5" />
                                <span className="text-sm">
                                    <span className="font-medium">{tier.label}</span>
                                    <span className="ml-1 text-orange-600 font-semibold">{tier.price}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                    <button onClick={applyPlanChange} disabled={planWorking || nextTier === plan?.plan_tier}
                        className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                        {planWorking ? "Applying…" : "Apply Plan Change"}
                    </button>
                    {planToast && <p className="text-sm text-gray-600">{planToast}</p>}
                    <p className="text-xs text-gray-400">Billing integration: plug your billing system into the backend workflow before charging.</p>
                </div>
            </div>

            {/* Premium Placements */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h2 className="font-semibold text-gray-800">Premium Placements (In-App)</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Workflow placements — not banner ads.</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-100 flex">
                    {PLACEMENT_TABS.map(t => (
                        <button key={t} onClick={() => setActiveTab(t)}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}>
                            {t}
                        </button>
                    ))}
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-gray-700">{pd.desc}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Best for: {pd.bestFor}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Region */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">State/Province</label>
                            <select value={pf.region1} onChange={e => setForm(activeTab, "region1", e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm">
                                <option value="">— select —</option>
                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        {/* Corridor */}
                        {(!pd.needsCorridor ? activeTab === "Near Route" : true) && (
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Corridor {pd.needsCorridor ? "*" : "(optional)"}
                                </label>
                                <input value={pf.corridor} onChange={e => setForm(activeTab, "corridor", e.target.value)}
                                    required={pd.needsCorridor}
                                    placeholder="I-75, I-95, 401…"
                                    className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm" />
                            </div>
                        )}
                        {/* Bid */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Monthly bid ($)</label>
                            <input type="number" min={0} value={pf.bid} onChange={e => setForm(activeTab, "bid", Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm" />
                        </div>
                        {/* Start */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Start date *</label>
                            <input type="date" required value={pf.start} onChange={e => setForm(activeTab, "start", e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm" />
                        </div>
                        {/* End */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">End date *</label>
                            <input type="date" required value={pf.end} onChange={e => setForm(activeTab, "end", e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm" />
                        </div>
                        {/* Exclusive toggle (not shown for corridor_exclusive – always true) */}
                        {activeTab !== "Corridor Exclusive" && (
                            <div className="flex items-end pb-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={pf.exclusive} onChange={e => setForm(activeTab, "exclusive", e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300" />
                                    <span className="text-xs text-gray-600">Exclusive (if available)</span>
                                </label>
                            </div>
                        )}
                    </div>

                    <button onClick={() => buyPlacement(activeTab)} disabled={piWorking}
                        className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                        {piWorking ? "Requesting…" : `Request ${activeTab} Placement`}
                    </button>
                    {piToast && <p className="text-sm text-gray-600">{piToast}</p>}
                </div>

                {/* Active placements table */}
                <div className="border-t">
                    <div className="px-6 py-3 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Your Active / Upcoming Placements</p>
                    </div>
                    {placements.length === 0 ? (
                        <p className="px-6 py-4 text-sm text-gray-500">No placements yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                                    <tr>
                                        {["Type", "Region", "Corridor", "Bid ($/mo)", "Exclusive", "Start", "End", ""].map(h => (
                                            <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {placements.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-gray-700">{p.placement_type.replace(/_/g, " ")}</td>
                                            <td className="px-4 py-2 text-gray-600">{p.region1 ?? "—"}</td>
                                            <td className="px-4 py-2 text-gray-600">{p.corridor_name ?? "—"}</td>
                                            <td className="px-4 py-2 text-gray-600">${p.bid_monthly}</td>
                                            <td className="px-4 py-2">{p.is_exclusive ? "✓" : "—"}</td>
                                            <td className="px-4 py-2 text-gray-500 text-xs">{new Date(p.start_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 text-gray-500 text-xs">{new Date(p.end_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-2">
                                                <button onClick={() => cancelPlacement(p.id)}
                                                    className="text-red-500 hover:underline text-xs">Cancel</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
