"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// =========================================================
// Vendor Public Profile — /vendors/:vendorId
// Tabs: Overview | Locations | Reviews
// =========================================================

type TabId = "overview" | "locations" | "reviews";

export default function VendorProfilePage() {
    const { vendorId } = useParams() as { vendorId: string };
    const supabase = createClient();

    const [tab, setTab] = useState<TabId>("overview");
    const [vendor, setVendor] = useState<any>(null);
    const [plan, setPlan] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [vRes, pRes, sRes, lRes, rRes] = await Promise.all([
                supabase.from("vendors").select("*").eq("id", vendorId).single(),
                supabase.from("vendor_plans").select("*").eq("vendor_id", vendorId).eq("plan_status", "active").single(),
                supabase.from("vendor_services").select("*").eq("vendor_id", vendorId).eq("is_active", true),
                supabase.from("vendor_locations").select("*").eq("vendor_id", vendorId),
                supabase.from("vendor_reviews").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }).limit(20),
            ]);
            setVendor(vRes.data);
            setPlan(pRes.data);
            setServices(sRes.data ?? []);
            setLocations(lRes.data ?? []);
            setReviews(rRes.data ?? []);
            setLoading(false);
        }
        load();
    }, [vendorId]);

    if (loading) return <div className="p-8 text-gray-400 text-sm">Loading…</div>;
    if (!vendor) return <div className="p-8 text-red-500 text-sm">Vendor not found.</div>;

    const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {vendor.dba_name ?? vendor.legal_name}
                        </h1>
                        {vendor.verified_status === "verified" && (
                            <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-medium">
                                ✓ Verified
                            </span>
                        )}
                        {plan?.entitlements_json?.verified_badge && (
                            <span className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-full text-xs font-medium">
                                {plan.plan_tier}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        {vendor.vendor_type.replace(/_/g, " ")}
                        {avgRating && ` · ⭐ ${avgRating} (${reviews.length} reviews)`}
                    </p>
                </div>
                <Link href={`/vendors/${vendorId}/upgrade`}
                    className="shrink-0 px-4 py-2 border border-orange-400 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors">
                    Upgrade Plan
                </Link>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-6">
                    {(["overview", "locations", "reviews"] as TabId[]).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t
                                    ? "border-orange-500 text-orange-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview */}
            {tab === "overview" && (
                <div className="space-y-4">
                    {vendor.description && (
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="font-semibold text-gray-800 text-sm mb-2">About</h2>
                            <p className="text-sm text-gray-600">{vendor.description}</p>
                        </div>
                    )}

                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-gray-800 text-sm mb-3">Services</h2>
                        {services.length ? (
                            <div className="flex flex-wrap gap-2">
                                {services.map(s => (
                                    <div key={s.id} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                        <span className="font-medium text-gray-800">{s.service_name}</span>
                                        {s.rate_unit !== "quote" && s.rate_amount && (
                                            <span className="ml-1.5 text-gray-500">${s.rate_amount}/{s.rate_unit}</span>
                                        )}
                                        {s.rate_unit === "quote" && <span className="ml-1.5 text-gray-400">Quote</span>}
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-gray-500">No services listed.</p>}
                    </div>

                    {vendor.primary_contact_phone && (
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h2 className="font-semibold text-gray-800 text-sm mb-3">Contact</h2>
                            <div className="space-y-2 text-sm">
                                {vendor.primary_contact_name && (
                                    <p className="text-gray-700">{vendor.primary_contact_name}</p>
                                )}
                                <a href={`tel:${vendor.primary_contact_phone}`}
                                    className="inline-flex items-center gap-2 text-orange-600 font-medium hover:underline">
                                    📞 {vendor.primary_contact_phone}
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Locations */}
            {tab === "locations" && (
                <div className="space-y-3">
                    {locations.length === 0 ? (
                        <p className="text-sm text-gray-500">No locations on file.</p>
                    ) : locations.map(loc => (
                        <div key={loc.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {loc.location_name ??
                                            [loc.city, loc.region1, loc.country].filter(Boolean).join(", ")}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {loc.address_line1 && `${loc.address_line1} · `}
                                        {loc.city}, {loc.region1} {loc.postal_code}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Radius: {loc.service_radius_miles} mi
                                        {loc.is_24_7 && " · 24/7"}
                                    </p>
                                </div>
                                {loc.dispatch_phone && (
                                    <a href={`tel:${loc.dispatch_phone}`}
                                        className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                                        Call dispatch
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reviews */}
            {tab === "reviews" && (
                <div className="space-y-3">
                    {reviews.length === 0 ? (
                        <p className="text-sm text-gray-500">No reviews yet.</p>
                    ) : reviews.map(r => (
                        <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-orange-500 font-semibold">{r.rating}/5</span>
                                <span className="text-gray-400 text-xs">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </span>
                                {r.is_verified && (
                                    <span className="px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded">Verified</span>
                                )}
                            </div>
                            {r.review_text && <p className="text-sm text-gray-700">{r.review_text}</p>}
                            {r.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {(r.tags as string[]).map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
