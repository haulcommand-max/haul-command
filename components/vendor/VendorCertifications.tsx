"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// =========================================================
// VendorCertifications — View + manage certifications
// Used on: vendor profile page, admin review page
// =========================================================

const CERT_TYPE_LABELS: Record<string, string> = {
    general_liability: "General Liability",
    auto_liability: "Auto Liability",
    cargo_insurance: "Cargo Insurance",
    workers_comp: "Workers Comp",
    umbrella: "Umbrella Policy",
    twic: "TWIC Card",
    amber_light_permit: "Amber Light Permit",
    oversize_escort_cert: "Oversize Escort Cert",
    state_pilot_car_license: "State Pilot Car License",
    dot_medical: "DOT Medical Card",
    hm_endorsement: "HazMat Endorsement",
    first_aid_cpr: "First Aid / CPR",
    osha_10: "OSHA-10",
    height_pole_cert: "Height Pole Certification",
    other: "Other",
};

const STATUS_BADGE: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    revoked: "bg-red-200 text-red-800",
    pending_review: "bg-yellow-100 text-yellow-700",
};

interface Props {
    vendorId: string;
    isAdmin?: boolean;
    showAddForm?: boolean;
}

export default function VendorCertifications({ vendorId, isAdmin = false, showAddForm = false }: Props) {
    const supabase = createClient();
    const [certs, setCerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [working, setWorking] = useState(false);
    const [form, setForm] = useState({ cert_type: "general_liability", cert_name: "", cert_number: "", issuing_body: "", expires_at: "" });

    useEffect(() => {
        supabase.from("vendor_certifications").select("*").eq("vendor_id", vendorId)
            .order("expires_at", { ascending: true })
            .then(({ data }) => { setCerts(data ?? []); setLoading(false); });
    }, [vendorId]);

    function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setWorking(true);
        const { error } = await supabase.from("vendor_certifications").insert({
            vendor_id: vendorId,
            cert_type: form.cert_type,
            cert_name: form.cert_name || CERT_TYPE_LABELS[form.cert_type],
            cert_number: form.cert_number || null,
            issuing_body: form.issuing_body || null,
            expires_at: form.expires_at || null,
        });
        setWorking(false);
        if (!error) {
            setAdding(false);
            setForm({ cert_type: "general_liability", cert_name: "", cert_number: "", issuing_body: "", expires_at: "" });
            supabase.from("vendor_certifications").select("*").eq("vendor_id", vendorId)
                .order("expires_at", { ascending: true })
                .then(({ data }) => setCerts(data ?? []));
        }
    }

    async function verify(certId: string) {
        await supabase.from("vendor_certifications").update({ is_verified: true, verified_at: new Date().toISOString(), status: "active" }).eq("id", certId);
        setCerts(prev => prev.map(c => c.id === certId ? { ...c, is_verified: true, status: "active" } : c));
    }

    async function revoke(certId: string) {
        await supabase.from("vendor_certifications").update({ status: "revoked" }).eq("id", certId);
        setCerts(prev => prev.map(c => c.id === certId ? { ...c, status: "revoked" } : c));
    }

    if (loading) return <p className="text-sm text-gray-400 p-4">Loading certifications…</p>;

    const expiringSoon = certs.filter(c =>
        c.status === "active" && c.expires_at &&
        new Date(c.expires_at).getTime() - Date.now() < 30 * 86_400_000 &&
        new Date(c.expires_at).getTime() > Date.now()
    );

    const inp = "w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

    return (
        <div className="space-y-3">
            {/* Expiring soon warning */}
            {expiringSoon.length > 0 && (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3">
                    <p className="text-sm font-medium text-yellow-800">
                        ⚠️ {expiringSoon.length} certification{expiringSoon.length > 1 ? "s" : ""} expiring within 30 days
                    </p>
                    <ul className="mt-1 text-xs text-yellow-700 space-y-0.5">
                        {expiringSoon.map(c => (
                            <li key={c.id}>{CERT_TYPE_LABELS[c.cert_type] ?? c.cert_type} — expires {new Date(c.expires_at!).toLocaleDateString()}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Certs table */}
            {certs.length === 0 ? (
                <p className="text-sm text-gray-500">No certifications on file.</p>
            ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide text-left">
                            <tr>
                                {["Type", "Name", "Number", "Issuer", "Expires", "Status", "Verified", ""].map(h => (
                                    <th key={h} className="px-3 py-2.5 font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {certs.map(c => {
                                const isExpiringSoon = c.expires_at && new Date(c.expires_at).getTime() - Date.now() < 30 * 86_400_000 && c.status === "active";
                                return (
                                    <tr key={c.id} className={`hover:bg-gray-50 ${isExpiringSoon ? "bg-yellow-50/50" : ""}`}>
                                        <td className="px-3 py-2 font-medium text-gray-800">{CERT_TYPE_LABELS[c.cert_type] ?? c.cert_type}</td>
                                        <td className="px-3 py-2 text-gray-600">{c.cert_name}</td>
                                        <td className="px-3 py-2 text-gray-500 text-xs">{c.cert_number ?? "—"}</td>
                                        <td className="px-3 py-2 text-gray-500 text-xs">{c.issuing_body ?? "—"}</td>
                                        <td className="px-3 py-2 text-gray-500 text-xs">
                                            {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "No expiry"}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status] ?? ""}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            {c.is_verified ? (
                                                <span className="text-green-600 text-xs font-medium">✓ Verified</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Unverified</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            {isAdmin && !c.is_verified && c.status === "active" && (
                                                <button onClick={() => verify(c.id)} className="text-green-600 hover:underline text-xs mr-2">Verify</button>
                                            )}
                                            {isAdmin && c.status === "active" && (
                                                <button onClick={() => revoke(c.id)} className="text-red-500 hover:underline text-xs">Revoke</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add form */}
            {(showAddForm || adding) && (
                <form onSubmit={handleAdd} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700">Add Certification</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Type *</label>
                            <select value={form.cert_type} onChange={e => set("cert_type", e.target.value)} className={inp}>
                                {Object.entries(CERT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Name</label>
                            <input value={form.cert_name} onChange={e => set("cert_name", e.target.value)} placeholder="e.g. Acme Insurance" className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Number</label>
                            <input value={form.cert_number} onChange={e => set("cert_number", e.target.value)} placeholder="Policy #" className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Issuer</label>
                            <input value={form.issuing_body} onChange={e => set("issuing_body", e.target.value)} placeholder="State, insurer…" className={inp} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Expiry date</label>
                            <input type="date" value={form.expires_at} onChange={e => set("expires_at", e.target.value)} className={inp} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" disabled={working}
                            className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                            {working ? "Adding…" : "Add"}
                        </button>
                        <button type="button" onClick={() => setAdding(false)}
                            className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {!adding && !showAddForm && (
                <button onClick={() => setAdding(true)}
                    className="text-sm text-orange-600 hover:underline font-medium">
                    + Add certification
                </button>
            )}
        </div>
    );
}
