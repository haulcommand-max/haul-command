"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// =========================================================
// Vendor Apply Form — /vendors/apply
// Writes: vendor_applications (status = 'pending')
// =========================================================

const VENDOR_TYPES = [
    "roadside_repair", "towing", "truck_parking", "parts",
    "escort_service", "spill_response", "welding", "tire_service", "fuel", "other",
] as const;

const SERVICE_OPTIONS = [
    "towing", "roadside_repair", "tire_service", "mobile_mechanic", "welding",
    "spill_response", "truck_parking", "parts", "escort", "bucket_truck",
    "traffic_control", "other",
] as const;

const PLAN_TIERS = [
    { value: "free", label: "Free — Listed in directory + limited in-app surfacing", price: "$0" },
    { value: "verified", label: "Verified — Badge + better surfacing", price: "$29/mo" },
    { value: "priority", label: "Priority — Boosted emergency + route placement", price: "$99/mo" },
    { value: "command_partner", label: "Command Partner — Top eligible placement", price: "$299/mo" },
    { value: "corridor_dominator", label: "Corridor Dominator — Corridor exclusivity", price: "$999/mo" },
] as const;

export default function VendorApplyPage() {
    const router = useRouter();
    const supabase = createClient();

    const [form, setForm] = useState({
        company_name: "",
        vendor_type: "other",
        website_url: "",
        notes: "",
        primary_contact_name: "",
        primary_contact_phone: "",
        primary_contact_email: "",
        dispatch_phone: "",
        country: "US",
        region1: "",
        city: "",
        postal_code: "",
        address_line1: "",
        lat: "",
        lng: "",
        is_24_7: false,
        service_radius_miles: 50,
        services_quick: [] as string[],
        preferred_plan_tier: "free",
        terms: false,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function set(field: string, value: unknown) {
        setForm(f => ({ ...f, [field]: value }));
    }

    function toggleService(s: string) {
        setForm(f => ({
            ...f,
            services_quick: f.services_quick.includes(s)
                ? f.services_quick.filter(x => x !== s)
                : [...f.services_quick, s],
        }));
    }

    function mapServicesQuick(services: string[]) {
        return services.map(s => ({
            service_category: s,
            service_name: s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            rate_unit: "quote",
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.terms) { setError("Please confirm the checkbox."); return; }

        setLoading(true);
        setError("");

        const services_json = mapServicesQuick(form.services_quick);

        const payload = {
            company_name: form.company_name,
            vendor_type: form.vendor_type,
            website_url: form.website_url || null,
            notes: form.notes || null,
            primary_contact_name: form.primary_contact_name,
            primary_contact_phone: form.primary_contact_phone,
            primary_contact_email: form.primary_contact_email || null,
            dispatch_phone: form.dispatch_phone,
            country: form.country,
            region1: form.region1 || null,
            city: form.city,
            postal_code: form.postal_code || null,
            address_line1: form.address_line1 || null,
            lat: form.lat ? Number(form.lat) : null,
            lng: form.lng ? Number(form.lng) : null,
            is_24_7: form.is_24_7,
            service_radius_miles: Number(form.service_radius_miles),
            services_json: services_json.length ? services_json : [],
            preferred_plan_tier: form.preferred_plan_tier,
            status: "pending",
        };

        const { error: dbErr } = await supabase.from("vendor_applications").insert(payload);
        setLoading(false);

        if (dbErr) { setError(dbErr.message); return; }
        router.push("/vendors/apply/thanks");
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Vendor Application</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Get listed free. Upgrade later for better placement in the app.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* — Company — */}
                <Card title="Company">
                    <Grid2>
                        <Field label="Company name *">
                            <input required value={form.company_name} onChange={e => set("company_name", e.target.value)}
                                placeholder="e.g., United Axle" className={input} />
                        </Field>
                        <Field label="Business type *">
                            <select required value={form.vendor_type} onChange={e => set("vendor_type", e.target.value)} className={input}>
                                {VENDOR_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                            </select>
                        </Field>
                        <Field label="Website (optional)">
                            <input value={form.website_url} onChange={e => set("website_url", e.target.value)}
                                placeholder="https://..." className={input} />
                        </Field>
                        <Field label="Notes (optional)">
                            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3}
                                placeholder="Gate code, after-hours process, etc." className={input} />
                        </Field>
                    </Grid2>
                </Card>

                {/* — Primary Contact — */}
                <Card title="Primary Contact">
                    <Grid2>
                        <Field label="Contact name *">
                            <input required value={form.primary_contact_name} onChange={e => set("primary_contact_name", e.target.value)} className={input} />
                        </Field>
                        <Field label="Contact phone *">
                            <input required type="tel" value={form.primary_contact_phone} onChange={e => set("primary_contact_phone", e.target.value)} className={input} />
                        </Field>
                        <Field label="Contact email (optional)">
                            <input type="email" value={form.primary_contact_email} onChange={e => set("primary_contact_email", e.target.value)} className={input} />
                        </Field>
                        <Field label="Dispatch phone (what drivers call) *">
                            <input required type="tel" value={form.dispatch_phone} onChange={e => set("dispatch_phone", e.target.value)} className={input} />
                        </Field>
                    </Grid2>
                </Card>

                {/* — Location & Coverage — */}
                <Card title="Location & Coverage">
                    <Grid2>
                        <Field label="Country *">
                            <select required value={form.country} onChange={e => set("country", e.target.value)} className={input}>
                                <option value="US">US</option>
                                <option value="CA">CA</option>
                            </select>
                        </Field>
                        <Field label="State / Province">
                            <input value={form.region1} onChange={e => set("region1", e.target.value)} placeholder="FL, GA, ON…" className={input} />
                        </Field>
                        <Field label="City *">
                            <input required value={form.city} onChange={e => set("city", e.target.value)} className={input} />
                        </Field>
                        <Field label="ZIP / Postal code">
                            <input value={form.postal_code} onChange={e => set("postal_code", e.target.value)} className={input} />
                        </Field>
                        <Field label="Street address (optional)" className="col-span-2">
                            <input value={form.address_line1} onChange={e => set("address_line1", e.target.value)} className={input} />
                        </Field>
                        <Field label="Service radius (miles)">
                            <input type="number" min={5} max={500} value={form.service_radius_miles}
                                onChange={e => set("service_radius_miles", e.target.value)} className={input} />
                        </Field>
                        <Field label="24/7 service?">
                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                <input type="checkbox" checked={form.is_24_7} onChange={e => set("is_24_7", e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300" />
                                <span className="text-sm text-gray-700">Yes, we operate 24/7</span>
                            </label>
                        </Field>
                        <Field label="Latitude">
                            <input type="number" step="any" value={form.lat} onChange={e => set("lat", e.target.value)}
                                placeholder="e.g. 27.9944" className={input} />
                        </Field>
                        <Field label="Longitude">
                            <input type="number" step="any" value={form.lng} onChange={e => set("lng", e.target.value)}
                                placeholder="e.g. -81.7602" className={input} />
                        </Field>
                    </Grid2>
                </Card>

                {/* — Services — */}
                <Card title="Services">
                    <p className="text-sm text-gray-500 mb-3">
                        We&apos;ll use this to show you in Emergency Nearby results.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {SERVICE_OPTIONS.map(s => (
                            <button key={s} type="button"
                                onClick={() => toggleService(s)}
                                className={`px-3 py-1 rounded-full text-sm border transition-colors ${form.services_quick.includes(s)
                                        ? "bg-orange-500 text-white border-orange-500"
                                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                                    }`}>
                                {s.replace(/_/g, " ")}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* — Plan — */}
                <Card title="Plan (optional)">
                    <div className="space-y-2">
                        {PLAN_TIERS.map(tier => (
                            <label key={tier.value}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.preferred_plan_tier === tier.value
                                        ? "border-orange-500 bg-orange-50"
                                        : "border-gray-200 hover:border-orange-300"
                                    }`}>
                                <input type="radio" name="tier" value={tier.value}
                                    checked={form.preferred_plan_tier === tier.value}
                                    onChange={() => set("preferred_plan_tier", tier.value)}
                                    className="mt-0.5" />
                                <span className="text-sm">
                                    <span className="font-medium">{tier.label}</span>
                                    <span className="ml-1 text-orange-600 font-semibold">{tier.price}</span>
                                </span>
                            </label>
                        ))}
                    </div>
                </Card>

                {/* — Submit — */}
                <div className="border-t pt-6 flex items-center justify-between gap-4">
                    <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" required checked={form.terms} onChange={e => set("terms", e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300" />
                        <span className="text-sm text-gray-600">
                            I confirm the info is accurate and I&apos;m authorized to submit it.
                        </span>
                    </label>
                    <button type="submit" disabled={loading}
                        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors whitespace-nowrap">
                        {loading ? "Submitting…" : "Submit Application"}
                    </button>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
        </div>
    );
}

// ─── Local components ───────────────────────────────────
const input = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">{title}</h2>
            {children}
        </div>
    );
}

function Grid2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            {children}
        </div>
    );
}
