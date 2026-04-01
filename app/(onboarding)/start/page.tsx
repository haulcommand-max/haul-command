"use client";

import { useRouter } from "next/navigation";
import { Truck, ShieldAlert, Flag, Scale } from "lucide-react";
import { cn } from "../../../lib/utils/cn";

const EQUIPMENT_TYPES = [
    { id: "high_pole", label: "High Pole", icon: Truck, desc: "Height detection & Pole cars" },
    { id: "chase", label: "Chase / Steer", icon: ShieldAlert, desc: "Rear escort & steering" },
    { id: "lead", label: "Lead Escort", icon: Flag, desc: "Front visual & communication" },
    { id: "superload", label: "Superload", icon: Scale, desc: "Heavy haul (>150k lbs)" },
];

export default function StartPage() {
    const router = useRouter();

    const handleSelect = (id: string) => {
        router.push(`/territory?eq=${id}`);
    };

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent mb-2">
                    What do you run?
                </h1>
                <p className="text-brand-muted text-sm">
                    Select your primary equipment to see available loads.
                </p>
            </div>

            <div className="grid gap-4">
                {EQUIPMENT_TYPES.map((eq) => (
                    <button
                        key={eq.id}
                        onClick={() => handleSelect(eq.id)}
                        className="group relative p-4 rounded-xl border border-brand-steel/50 bg-brand-charcoal/40 hover:bg-brand-charcoal/80 transition-all text-left flex items-center gap-4 hover:border-brand-gold/50"
                    >
                        <div className="w-12 h-12 rounded-full bg-brand-steel/20 flex items-center justify-center text-brand-gold group-hover:scale-110 transition-transform">
                            <eq.icon size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-brand-text group-hover:text-brand-gold transition-colors">
                                {eq.label}
                            </div>
                            <div className="text-xs text-brand-muted">{eq.desc}</div>
                        </div>
                        <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity text-brand-gold">
                            →
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
