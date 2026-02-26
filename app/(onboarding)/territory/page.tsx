"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { BackButton } from "../components/BackButton";
import { Check } from "lucide-react";
import { cn } from "../../../lib/utils/cn";

const REGIONS = [
    { id: "southeast", label: "Southeast", states: "FL, GA, AL, MS, TN, SC, NC" },
    { id: "midwest", label: "Midwest", states: "OH, IN, IL, MI, WI, MN, IA, MO" },
    { id: "texas", label: "Texas & South", states: "TX, OK, AR, LA" },
    { id: "west", label: "West Coast", states: "CA, OR, WA, NV, AZ" },
    { id: "northeast", label: "Northeast", states: "NY, PA, NJ, MA, CT, MD, VA" },
    { id: "plains", label: "Plains / Mountain", states: "CO, UT, ID, MT, WY, ND, SD, NE, KS" },
];

function TerritoryPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eq = searchParams.get("eq");
    const [selected, setSelected] = useState<string[]>([]);

    const toggleRegion = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const handleNext = () => {
        if (selected.length === 0) return;
        router.push(`/loads?eq=${eq}&regions=${selected.join(",")}`);
    };

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BackButton />

            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent mb-2">
                    Where do you run?
                </h1>
                <p className="text-brand-muted text-sm">
                    We'll match you with loads in your preferred lanes.
                </p>
            </div>

            <div className="grid gap-3 mb-8">
                {REGIONS.map((region) => {
                    const isSelected = selected.includes(region.id);
                    return (
                        <button
                            key={region.id}
                            onClick={() => toggleRegion(region.id)}
                            className={cn(
                                "p-4 rounded-xl border text-left transition-all relative",
                                isSelected
                                    ? "border-brand-gold bg-brand-gold/10 text-brand-text"
                                    : "border-brand-steel/50 bg-brand-charcoal/40 text-brand-muted hover:border-brand-muted"
                            )}
                        >
                            <div className="font-bold text-sm">{region.label}</div>
                            <div className="text-xs opacity-70 truncate">{region.states}</div>

                            {isSelected && (
                                <div className="absolute top-1/2 -translate-y-1/2 right-4 text-brand-gold">
                                    <Check size={18} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <button
                onClick={handleNext}
                disabled={selected.length === 0}
                className={cn(
                    "w-full py-4 rounded-xl font-bold text-lg transition-all",
                    selected.length > 0
                        ? "bg-brand-gold text-brand-dark hover:brightness-110 shadow-lg shadow-brand-gold/20"
                        : "bg-brand-steel/30 text-brand-muted cursor-not-allowed"
                )}
            >
                See Available Loads
            </button>
        </div>
    );
}

export default function TerritoryPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center p-20"><div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>}>
            <TerritoryPageInner />
        </Suspense>
    );
}
