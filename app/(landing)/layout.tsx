/**
 * Landing Layout — Marketing pages (homepage, about, pricing)
 *
 * The root app/layout.tsx already mounts GlobalCommandBar globally.
 * DO NOT mount it again here — that was causing a double-header on mobile.
 * This layout is a clean full-width pass-through only.
 */

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <main className="flex-1 w-full flex flex-col">
                {children}
            </main>
        </div>
    );
}