"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { VendorApplication } from "@/lib/vendor/types";

// =========================================================
// Admin Vendor Applications Queue — /admin/vendors/applications
// Shows pending + needs_info applications
// =========================================================

const STATUS_BADGE: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    needs_info: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

export default function AdminVendorApplicationsPage() {
    const supabase = createClient();
    const [apps, setApps] = useState<VendorApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const { data } = await supabase
                .from("vendor_applications")
                .select("*")
                .in("status", ["pending", "needs_info"])
                .order("submitted_at", { ascending: false });
            setApps(data ?? []);
            setLoading(false);
        }
        load();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Vendor Applications</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Approve to publish vendors into the app + directory.
                </p>
            </div>

            {/* Queue table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">Queue</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
                ) : apps.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No pending applications.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                                <tr>
                                    {["Submitted", "Company", "Type", "Country", "Region", "City", "24/7", "Tier", "Status", ""].map(h => (
                                        <th key={h} className="px-4 py-3 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {apps.map(app => (
                                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                            {new Date(app.submitted_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{app.company_name}</td>
                                        <td className="px-4 py-3 text-gray-600">{app.vendor_type.replace(/_/g, " ")}</td>
                                        <td className="px-4 py-3 text-gray-600">{app.country}</td>
                                        <td className="px-4 py-3 text-gray-600">{app.region1 ?? "—"}</td>
                                        <td className="px-4 py-3 text-gray-600">{app.city}</td>
                                        <td className="px-4 py-3">{app.is_24_7 ? "✓" : "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                                {app.preferred_plan_tier}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[app.status] ?? ""}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/admin/vendors/applications/${app.id}`}
                                                className="text-orange-600 hover:underline font-medium text-xs">
                                                Review →
                                            </Link>
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
