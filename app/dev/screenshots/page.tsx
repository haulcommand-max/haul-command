"use client";

import dynamic from "next/dynamic";
import { ScreenshotOverlay } from "@/components/ScreenshotOverlay";


// CommandMap uses browser APIs — must be dynamically imported (no SSR)
const CommandMap = dynamic(() => import("@/components/CommandMap").then(m => m.CommandMap), {
    ssr: false,
    loading: () => <div style={{ height: 900, background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#333", fontSize: 12 }}>Loading map...</span>
    </div>,
});


// DEV ONLY — generates exportable App Store screenshot mocks
// Visit /dev/screenshots to preview
// Use browser screenshot tool or puppeteer to export as 1290×2796 PNG

export default function ScreenshotMocksPage() {
    const mapSlot = <CommandMap height={900} />;

    const screenshots = [
        {
            title: "Find Escort Jobs Near You",
            subtitle: "Live loads + demand map in real time",
            children: mapSlot,
        },
        {
            title: "See Where Drivers Are Needed Now",
            subtitle: "Heat zones update as the market moves",
            children: mapSlot,
        },
        {
            title: "Get Matched in Minutes",
            subtitle: "Push offers → one-tap accept",
            imageSrc: "/mock/match-screen.svg",
        },
        {
            title: "Turn Availability Into Income",
            subtitle: "Choose runs that fit your radius",
            imageSrc: "/mock/earnings-screen.svg",
        },
        {
            title: "Built for Pro Escort Operators",
            subtitle: "Verified profiles + capability tags",
            imageSrc: "/mock/profile-screen.svg",
        },
        {
            title: "Join the Haul Command Network",
            subtitle: "Drivers • Brokers • Dispatch",
            children: mapSlot,
        },
    ];

    return (
        <main style={{ maxWidth: 420, margin: "0 auto", padding: 24, display: "grid", gap: 24, background: "#070707", minHeight: "100vh" }}>
            <div style={{ color: "#555", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                DEV ONLY · App Store Screenshot Mocks
            </div>
            {screenshots.map((s, i) => (
                <div key={i}>
                    <div style={{ color: "#444", fontSize: 10, marginBottom: 6, fontWeight: 700 }}>
                        Screenshot {i + 1}
                    </div>
                    <ScreenshotOverlay
                        title={s.title}
                        subtitle={s.subtitle}
                        imageSrc={(s as any).imageSrc}
                    >
                        {s.children}
                    </ScreenshotOverlay>
                </div>
            ))}
        </main>
    );
}
