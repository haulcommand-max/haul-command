"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Navigation, MapPin, Clock, ArrowRight, CheckCircle2, Zap,
    Shield, TrendingUp, Phone, Mail, User, Truck, ChevronDown
} from "lucide-react";

const ESCORT_TYPES = [
    { value: "front", label: "Front Escort", icon: "ðŸš—" },
    { value: "rear", label: "Rear Escort", icon: "ðŸš™" },
    { value: "both", label: "Front & Rear", icon: "ðŸš—ðŸš™" },
    { value: "high_pole", label: "Height Pole", icon: "ðŸ“¡" },
    { value: "route_survey", label: "Route Survey", icon: "ðŸ—ºï¸" },
];

const EQUIPMENT_OPTIONS = [
    "Height Pole", "Oversize Signs", "Amber Lights", "Radio/CB",
    "Flags/Banners", "Escort Vehicle Kit", "Arrow Board", "Night Lights"
];

export default function AvailabilityPage() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [result, setResult] = useState<{ provider_key?: string; signal_id?: number; profile_created?: boolean } | null>(null);

    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: "",
        current_city: "",
        current_region: "",
        current_country: "US",
        heading_direction: "",
        escort_type: "",
        equipment_tags: [] as string[],
        certifications: [] as string[],
        available_hours: 6,
    });

    const updateForm = (key: string, value: string | number | string[]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const toggleEquipment = (tag: string) => {
        setForm((prev) => ({
            ...prev,
            equipment_tags: prev.equipment_tags.includes(tag)
                ? prev.equipment_tags.filter((t) => t !== tag)
                : [...prev.equipment_tags, tag],
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/availability/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.ok) {
                setResult(data);
                setIsSuccess(true);
            } else {
                alert(data.error || "Something went wrong");
            }
        } catch {
            alert("Network error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className=" bg-[#0a0a0f] text-white">
            {/* Hero */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.08) 0%, transparent 60%)' }} />

                <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6"
                    >
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300 text-sm font-medium">Global Capacity Exchange</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold mb-4"
                    >
                        Deadhead who?{" "}
                        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Make money instead.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-400 max-w-2xl mx-auto mb-8"
                    >
                        Share your availability and get matched with escort jobs on your route.
                        No deadhead miles. Just profit miles.
                    </motion.p>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center gap-8 text-sm"
                    >
                        {[
                            { icon: Navigation, label: "191 Corridors", color: "text-emerald-400" },
                            { icon: Shield, label: "120 countries", color: "text-cyan-400" },
                            { icon: TrendingUp, label: "Instant Matching", color: "text-violet-400" },
                        ].map((stat) => (
                            <div key={stat.label} className="flex items-center gap-2">
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                <span className="text-gray-300">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl mx-auto px-4 pb-24">
                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#111118] border border-emerald-500/30 rounded-2xl p-8 text-center"
                        >
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">You&apos;re Live on the Network</h2>
                            <p className="text-gray-400 mb-4">
                                {result?.profile_created
                                    ? "We created your HAUL COMMAND profile and you're now visible to brokers."
                                    : "Your availability signal is now broadcasting to nearby loads."}
                            </p>
                            <div className="bg-[#0a0a0f] rounded-xl p-4 mb-6 text-left space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Signal ID</span>
                                    <span className="text-emerald-400 font-mono">#{result?.signal_id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Provider Key</span>
                                    <span className="text-gray-300 font-mono text-xs">{result?.provider_key?.slice(0, 12)}...</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Status</span>
                                    <span className="text-emerald-400">â— Broadcasting</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                We&apos;ll notify you when loads match your route. Claim your full profile at{" "}
                                <span className="text-cyan-400">haulcommand.com/claim</span>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#111118] border border-white/5 rounded-2xl overflow-hidden"
                        >
                            {/* Progress Bar */}
                            <div className="h-1 bg-white/5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                                    animate={{ width: `${(step / 3) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>

                            <div className="p-6 md:p-8">
                                {/* Step 1: Identity */}
                                {step === 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <h2 className="text-xl font-bold mb-1">Who are you?</h2>
                                        <p className="text-sm text-gray-500 mb-6">Basic contact info â€” takes 30 seconds.</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1.5">Name / Company</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        value={form.name}
                                                        onChange={(e) => updateForm("name", e.target.value)}
                                                        placeholder="e.g. Johnson Pilot Cars"
                                                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1.5">Phone</label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                                                        <input
                                                            type="tel"
                                                            value={form.phone}
                                                            onChange={(e) => updateForm("phone", e.target.value)}
                                                            placeholder="(555) 123-4567"
                                                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                                                        <input
                                                            type="email"
                                                            value={form.email}
                                                            onChange={(e) => updateForm("email", e.target.value)}
                                                            placeholder="pilot@example.com"
                                                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button aria-label="Interactive Button"
                                            onClick={() => step < 3 && form.name && (form.phone || form.email) && setStep(2)}
                                            disabled={!form.name || (!form.phone && !form.email)}
                                            className="mt-6 w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                                        >
                                            Next: Location <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* Step 2: Location + Direction */}
                                {step === 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <h2 className="text-xl font-bold mb-1">Where are you heading?</h2>
                                        <p className="text-sm text-gray-500 mb-6">This lets us match you with loads on your route.</p>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1.5">Current City</label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                                                        <input
                                                            type="text"
                                                            value={form.current_city}
                                                            onChange={(e) => updateForm("current_city", e.target.value)}
                                                            placeholder="Dallas"
                                                            className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-gray-400 mb-1.5">State / Region</label>
                                                    <input
                                                        type="text"
                                                        value={form.current_region}
                                                        onChange={(e) => updateForm("current_region", e.target.value)}
                                                        placeholder="TX"
                                                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1.5">Heading Toward</label>
                                                <div className="relative">
                                                    <Navigation className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        value={form.heading_direction}
                                                        onChange={(e) => updateForm("heading_direction", e.target.value)}
                                                        placeholder="Houston, TX"
                                                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:border-emerald-500/50 focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1.5">Available For</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                                                    <select
                                                        value={form.available_hours}
                                                        onChange={(e) => updateForm("available_hours", parseInt(e.target.value))}
                                                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-white appearance-none focus:border-emerald-500/50 focus:outline-none"
                                                    >
                                                        <option value={2}>Next 2 hours</option>
                                                        <option value={4}>Next 4 hours</option>
                                                        <option value={6}>Next 6 hours</option>
                                                        <option value={12}>Next 12 hours</option>
                                                        <option value={24}>Next 24 hours</option>
                                                        <option value={48}>Next 2 days</option>
                                                        <option value={168}>This week</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button aria-label="Interactive Button"
                                                onClick={() => setStep(1)}
                                                className="px-6 py-3 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            >
                                                Back
                                            </button>
                                            <button aria-label="Interactive Button"
                                                onClick={() => setStep(3)}
                                                className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                                            >
                                                Next: Equipment <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 3: Equipment + Submit */}
                                {step === 3 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <h2 className="text-xl font-bold mb-1">What do you run?</h2>
                                        <p className="text-sm text-gray-500 mb-6">Select your escort type and equipment.</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-2">Escort Type</label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {ESCORT_TYPES.map((type) => (
                                                        <button aria-label="Interactive Button"
                                                            key={type.value}
                                                            onClick={() => updateForm("escort_type", type.value)}
                                                            className={`p-3 rounded-lg border text-left text-sm transition-all ${form.escort_type === type.value
                                                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                                                                : "border-white/10 bg-[#0a0a0f] text-gray-400 hover:border-white/20"
                                                                }`}
                                                        >
                                                            <span className="text-lg mr-2">{type.icon}</span>
                                                            {type.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-gray-400 mb-2">Equipment</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {EQUIPMENT_OPTIONS.map((tag) => (
                                                        <button aria-label="Interactive Button"
                                                            key={tag}
                                                            onClick={() => toggleEquipment(tag)}
                                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.equipment_tags.includes(tag)
                                                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                                                : "bg-white/5 text-gray-500 border border-white/10 hover:text-gray-300"
                                                                }`}
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button aria-label="Interactive Button"
                                                onClick={() => setStep(2)}
                                                className="px-6 py-3 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            >
                                                Back
                                            </button>
                                            <button aria-label="Interactive Button"
                                                onClick={handleSubmit}
                                                disabled={isSubmitting}
                                                className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Broadcasting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Truck className="w-5 h-5" />
                                                        Broadcast Availability
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Value props */}
                {!isSuccess && (
                    <div className="grid md:grid-cols-3 gap-4 mt-8">
                        {[
                            {
                                icon: "âš¡",
                                title: "Instant Profile",
                                desc: "Your HAUL COMMAND listing is created automatically.",
                            },
                            {
                                icon: "ðŸ“¡",
                                title: "Live Signal",
                                desc: "Brokers see you on the corridor in real-time.",
                            },
                            {
                                icon: "ðŸ’°",
                                title: "Profit Miles",
                                desc: "Get matched with loads on your deadhead route.",
                            },
                        ].map((prop) => (
                            <div
                                key={prop.title}
                                className="bg-[#111118] border border-white/5 rounded-xl p-4 text-center"
                            >
                                <div className="text-2xl mb-2">{prop.icon}</div>
                                <h3 className="font-semibold text-sm mb-1">{prop.title}</h3>
                                <p className="text-xs text-gray-500">{prop.desc}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}