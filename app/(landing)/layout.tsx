/**
 * Landing Layout — Marketing pages (homepage, about, pricing)
 * 
 * NO sidebar. NO mobile bottom nav. NO app shell.
 * This is a clean, full-width marketing layout.
 * Header and footer live inside HomeClient for now,
 * and can be extracted to shared LandingHeader/LandingFooter
 * components as more landing pages are added.
 */


import { GlobalCommandBar } from "@/components/layout/GlobalCommandBar";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-hc-bg">
            <GlobalCommandBar />
            <main className="flex-1 w-full flex flex-col">
                {children}
            </main>
        </div>
    );
}