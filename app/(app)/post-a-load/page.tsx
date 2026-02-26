"use client";

/**
 * /post-a-load — Premium Intake Form
 *
 * Full load posting form with all required + optional fields.
 * On submit:
 *   1. Validates fields client-side
 *   2. POSTs to /api/loads/create
 *   3. Triggers match-generate top 3
 *   4. Redirects to /loads/[id] with top 3 cards
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Calendar, Weight, Ruler, FileText,
    Zap, ChevronRight, AlertTriangle, CheckCircle,
    Truck, Clock, DollarSign
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoadForm {
    origin: string;
    destination: string;
    pickup_datetime: string;
    length_ft: string;
    width_ft: string;
    height_ft: string;
    weight_lbs: string;
    description: string;
    route_notes: string;
    permit_notes: string;
    escort_needs: string[];
    time_flex_hours: string;
    budget_per_mile: string;
    quick_pay: boolean;
}

const ESCORT_OPTIONS = [
    { id: "lead", label: "Lead Car" },
    { id: "chase", label: "Chase Car" },
    { id: "height_pole", label: "Height Pole" },
    { id: "police", label: "Police Escort" },
];

const emptyForm: LoadForm = {
    origin: "", destination: "", pickup_datetime: "",
    length_ft: "", width_ft: "", height_ft: "", weight_lbs: "",
    description: "", route_notes: "", permit_notes: "",
    escort_needs: [], time_flex_hours: "", budget_per_mile: "",
    quick_pay: false,
};

// ── Field components ──────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">{children}</label>;
}

function TextInput({ id, value, onChange, placeholder, type = "text", required }: {
    id: string; value: string; onChange: (v: string) => void;
    placeholder?: string; type?: string; required?: boolean;
}) {
    return (
        <input
            id={id} type={type} value={value} required={required}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-10 rounded-xl px-3 text-sm text-white placeholder-white/20 outline-none transition-all"
            style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
            }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(241,169,27,0.5)"}
            onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
        />
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PostALoadPage() {
    const router = useRouter();
    const [form, setForm] = useState<LoadForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const set = (field: keyof LoadForm) => (val: string | boolean) =>
        setForm(prev => ({ ...prev, [field]: val }));

    const toggleEscort = (id: string) =>
        setForm(prev => ({
            ...prev,
            escort_needs: prev.escort_needs.includes(id)
                ? prev.escort_needs.filter(e => e !== id)
                : [...prev.escort_needs, id],
        }));

    const validate = (): string | null => {
        if (!form.origin.trim()) return "Origin is required";
        if (!form.destination.trim()) return "Destination is required";
        if (!form.pickup_datetime) return "Pickup date & time is required";
        if (!form.weight_lbs || isNaN(Number(form.weight_lbs))) return "Valid weight is required";
        if (!form.description.trim()) return "Load description is required";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setSubmitting(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            const payload = {
                broker_id: user?.id ?? null,
                origin_address: form.origin,
                dest_address: form.destination,
                pickup_at: form.pickup_datetime,
                length_ft: parseFloat(form.length_ft) || null,
                width_ft: parseFloat(form.width_ft) || null,
                height_ft: parseFloat(form.height_ft) || null,
                weight_lbs: parseFloat(form.weight_lbs),
                description: form.description,
                route_notes: form.route_notes || null,
                permit_notes: form.permit_notes || null,
                escort_needs: form.escort_needs,
                time_flex_hours: parseFloat(form.time_flex_hours) || null,
                rate_per_mile: parseFloat(form.budget_per_mile) || null,
                quick_pay: form.quick_pay,
                status: "open",
            };

            const res = await fetch("/api/loads/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error((await res.json()).error ?? "Failed to post load");
            const { load_id } = await res.json();

            // Trigger match-generate asynchronously (non-blocking)
            fetch("/api/loads/match-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    load_id,
                    origin_state: form.origin.split(",").pop()?.trim() ?? "",
                    quick_pay: form.quick_pay,
                    rate_per_mile: parseFloat(form.budget_per_mile) || null,
                }),
            }).catch(() => {/* non-critical */ });

            setSuccess(true);
            setTimeout(() => router.push(`/loads`), 1500);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
                <h2 className="text-xl font-black text-white">Load Posted</h2>
                <p className="text-white/40 text-sm">Matching escorts now…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white pb-20">

            {/* Header */}
            <div
                className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3 border-b"
                style={{
                    background: "rgba(4,6,12,0.92)",
                    backdropFilter: "blur(16px)",
                    borderColor: "rgba(255,255,255,0.06)",
                }}
            >
                <Truck className="w-5 h-5 text-[#F1A91B]" />
                <div>
                    <h1 className="text-sm font-black text-white tracking-wide">Post a Load</h1>
                    <p className="text-[10px] text-white/30">Real-time escort matching · Corridor intelligence</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 pt-8 space-y-8">

                {/* ── Route ──────────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-4 h-4 text-[#F1A91B]" />
                        <span className="text-sm font-black text-white uppercase tracking-widest">Route</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Origin *</FieldLabel>
                            <TextInput id="origin" value={form.origin} onChange={set("origin")}
                                placeholder="City, State" required />
                        </div>
                        <div>
                            <FieldLabel>Destination *</FieldLabel>
                            <TextInput id="destination" value={form.destination} onChange={set("destination")}
                                placeholder="City, State" required />
                        </div>
                    </div>
                </section>

                {/* ── Schedule ───────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-4 h-4 text-[#F1A91B]" />
                        <span className="text-sm font-black text-white uppercase tracking-widest">Schedule</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Pickup Date & Time *</FieldLabel>
                            <TextInput id="pickup_datetime" value={form.pickup_datetime}
                                onChange={set("pickup_datetime")} type="datetime-local" required />
                        </div>
                        <div>
                            <FieldLabel>Time Window Flex (hours)</FieldLabel>
                            <TextInput id="time_flex" value={form.time_flex_hours}
                                onChange={set("time_flex_hours")} type="number" placeholder="e.g. 2" />
                        </div>
                    </div>
                </section>

                {/* ── Dimensions ─────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Ruler className="w-4 h-4 text-[#F1A91B]" />
                        <span className="text-sm font-black text-white uppercase tracking-widest">Dimensions</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(["length_ft", "width_ft", "height_ft"] as const).map(f => (
                            <div key={f}>
                                <FieldLabel>{f.split("_")[0].toUpperCase()} (ft)</FieldLabel>
                                <TextInput id={f} value={form[f]} onChange={set(f)} type="number" placeholder="0" />
                            </div>
                        ))}
                        <div>
                            <FieldLabel>Weight (lbs) *</FieldLabel>
                            <TextInput id="weight_lbs" value={form.weight_lbs} onChange={set("weight_lbs")}
                                type="number" placeholder="0" required />
                        </div>
                    </div>
                </section>

                {/* ── Load Description ───────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-[#F1A91B]" />
                        <span className="text-sm font-black text-white uppercase tracking-widest">Load Details</span>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <FieldLabel>Description *</FieldLabel>
                            <textarea
                                id="description"
                                value={form.description}
                                onChange={e => set("description")(e.target.value)}
                                rows={3}
                                placeholder="What are you hauling? Construction equipment, transformer, modular home…"
                                required
                                className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none resize-none"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = "rgba(241,169,27,0.5)"}
                                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                            />
                        </div>
                        <div>
                            <FieldLabel>Route Preferences (optional)</FieldLabel>
                            <TextInput id="route_notes" value={form.route_notes} onChange={set("route_notes")}
                                placeholder="Avoid bridges, prefer I-10 corridor…" />
                        </div>
                        <div>
                            <FieldLabel>Permit Notes (optional)</FieldLabel>
                            <TextInput id="permit_notes" value={form.permit_notes} onChange={set("permit_notes")}
                                placeholder="Permits in hand / pending / not required…" />
                        </div>
                    </div>
                </section>

                {/* ── Escort Requirements ────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Truck className="w-4 h-4 text-[#F1A91B]" />
                        <span className="text-sm font-black text-white uppercase tracking-widest">Escort Needs</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ESCORT_OPTIONS.map(opt => {
                            const active = form.escort_needs.includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => toggleEscort(opt.id)}
                                    className="h-10 rounded-xl text-xs font-bold transition-all"
                                    style={{
                                        background: active ? "rgba(241,169,27,0.15)" : "rgba(255,255,255,0.04)",
                                        border: `1px solid ${active ? "rgba(241,169,27,0.5)" : "rgba(255,255,255,0.08)"}`,
                                        color: active ? "#F1A91B" : "rgba(255,255,255,0.4)",
                                    }}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ── Budget ─────────────────────────────────────────────── */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-4 h-4 text-[#F1A91B]" />
                        <span className="text-sm font-black text-white uppercase tracking-widest">Budget</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <FieldLabel>Rate per Mile (USD)</FieldLabel>
                            <TextInput id="budget" value={form.budget_per_mile} onChange={set("budget_per_mile")}
                                type="number" placeholder="e.g. 3.50" />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div
                                    onClick={() => set("quick_pay")(!form.quick_pay)}
                                    className="w-11 h-6 rounded-full relative transition-all cursor-pointer"
                                    style={{
                                        background: form.quick_pay ? "#F1A91B" : "rgba(255,255,255,0.08)",
                                    }}
                                >
                                    <div
                                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                                        style={{ left: form.quick_pay ? "calc(100% - 22px)" : 2 }}
                                    />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">Quick Pay</div>
                                    <div className="text-[10px] text-white/30">Same-day or next-day payment</div>
                                </div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* ── Error ─────────────────────────────────────────────── */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-300"
                            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
                        >
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Submit ─────────────────────────────────────────────── */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest text-black transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
                    style={{
                        background: submitting ? "#888" : "#F1A91B",
                        boxShadow: submitting ? "none" : "0 0 24px rgba(241,169,27,0.3)",
                    }}
                >
                    {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                            Posting Load…
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Zap className="w-4 h-4" />
                            Post Load & Match Escorts
                            <ChevronRight className="w-4 h-4" />
                        </span>
                    )}
                </button>

                <p className="text-center text-xs text-white/20 pb-4">
                    Real-time corridor intelligence · Trusted escort network
                </p>
            </form>
        </div>
    );
}
