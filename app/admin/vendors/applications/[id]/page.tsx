"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { VendorApplication } from "@/lib/vendor/types";

// =========================================================
// Admin Application Review — /admin/vendors/applications/:id
// Actions: Approve, Needs Info, Reject
// =========================================================

const STATUS_BADGE: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    needs_info: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

export default function AdminApplicationReviewPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const supabase = createClient();

    const [app, setApp] = useState<VendorApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [toast, setToast] = useState("");

    useEffect(() => {
        supabase.from("vendor_applications").select("*").eq("id", id).single()
            .then(({ data }) => { setApp(data); setLoading(false); });
    }, [id]);

    async function approve() {
        setWorking(true);
        const { data, error } = await supabase.rpc("approve_vendor_application", { p_application_id: id });
        setWorking(false);
        if (error || !data?.ok) { setToast("Error: " + (error?.message ?? data?.error)); return; }
        setToast(`Approved → vendor ${data.vendor_id}`);
        setTimeout(() => router.push(`/vendors/${data.vendor_id}`), 1000);
    }

    async function setStatus(status: "needs_info" | "rejected") {
        setWorking(true);
        const { error } = await supabase
            .from("vendor_applications")
            .update({ status, reviewed_at: new Date().toISOString() })
            .eq("id", id);
        setWorking(false);
        if (error) { setToast("Error: " + error.message); return; }
        setToast(`Marked ${status}`);
        setTimeout(() => router.push("/admin/vendors/applications"), 800);
    }

    if (loading) return <div className="p-8 text-gray-400 text-sm">Loading…</div>;
    if (!app) return <div className="p-8 text-red-500 text-sm">Application not found.</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{app.company_name}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {app.vendor_type.replace(/_/g, " ")} · {app.city}, {app.region1 ?? ""} {app.country}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[app.status] ?? ""}`}>
                    {app.status}
                </span>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard title="Contact">
                    <KV label="Name" value={app.primary_contact_name} />
                    <KV label="Phone" value={app.primary_contact_phone} />
                    <KV label="Email" value={app.primary_contact_email ?? "—"} />
                    <KV label="Dispatch" value={app.dispatch_phone} />
                </InfoCard>

                <InfoCard title="Location & Coverage">
                    <KV label="Address" value={[app.address_line1, app.city, app.region1, app.postal_code].filter(Boolean).join(", ")} />
                    <KV label="Radius" value={`${app.service_radius_miles} mi`} />
                    <KV label="Lat/Lng" value={app.lat && app.lng ? `${app.lat}, ${app.lng}` : "Not provided"} />
                    <KV label="24/7" value={app.is_24_7 ? "Yes" : "No"} />
                </InfoCard>

                <InfoCard title="Services">
                    {app.services_json?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                            {(app.services_json as any[]).map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 rounded text-xs">
                                    {typeof s === "string" ? s : s.service_name ?? s.service_category}
                                </span>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-500">None listed</p>}
                </InfoCard>

                <InfoCard title="Plan Preference">
                    <KV label="Tier" value={app.preferred_plan_tier} />
                    <KV label="Notes" value={app.notes ?? "—"} />
                    <KV label="Website" value={app.website_url ?? "—"} />
                </InfoCard>
            </div>

            {/* Actions */}
            {app.status !== "approved" && (
                <div className="flex items-center gap-3 pt-2">
                    <button onClick={approve} disabled={working}
                        className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                        {working ? "Working…" : "Approve & Publish"}
                    </button>
                    <button onClick={() => setStatus("needs_info")} disabled={working}
                        className="px-5 py-2 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium transition-colors">
                        Needs Info
                    </button>
                    <button onClick={() => setStatus("rejected")} disabled={working}
                        className="px-5 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium transition-colors">
                        Reject
                    </button>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm z-50">
                    {toast}
                </div>
            )}
        </div>
    );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 text-sm mb-3">{title}</h2>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function KV({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-2 text-sm">
            <span className="text-gray-500 shrink-0 w-20">{label}</span>
            <span className="text-gray-900">{value || "—"}</span>
        </div>
    );
}
