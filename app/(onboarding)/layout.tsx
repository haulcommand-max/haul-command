"use client";

import { usePathname } from "next/navigation";
import { OnboardingProgress } from "./components/OnboardingProgress";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Map routes to step numbers
    const steps: Record<string, number> = {
        "/start": 1,
        "/territory": 2,
        "/loads": 3,
        "/claim": 4,
        "/verify": 5, // Optional step
    };

    const currentStep = steps[pathname] || 1;

    return (
        <div className="min-h-screen bg-brand-dark text-brand-text flex flex-col relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-brand-bronze/5 blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="p-6 flex justify-center sticky top-0 z-50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Haul Command" className="h-8 w-auto" />
                    <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-brand-gold to-brand-bronze bg-clip-text text-transparent">
                        HAUL COMMAND
                    </span>
                </div>
            </header>

            {/* Progress Bar (Only show for first 4 steps) */}
            {currentStep <= 4 && (
                <div className="px-6">
                    <OnboardingProgress currentStep={currentStep} totalSteps={4} />
                </div>
            )}

            {/* Content */}
            <main className="flex-1 flex flex-col px-6 pb-12 max-w-md mx-auto w-full z-10">
                {children}
            </main>
        </div>
    );
}
