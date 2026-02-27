"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, List, Users, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ══════════════════════════════════════════════════════════════
// MobileBottomNav — Haul Command v4
// Sticky bottom navigation for mobile. md:hidden.
// 60px height. 44px+ touch targets. Gold active state.
// Blue-collar first: 5 core destinations only.
// ══════════════════════════════════════════════════════════════

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    match?: RegExp;
    badge?: number;
}

const NAV_ITEMS: NavItem[] = [
    { href: "/map", label: "Map", icon: Map, match: /^\/map/ },
    { href: "/loads", label: "Loads", icon: List, match: /^\/loads/ },
    { href: "/directory", label: "Directory", icon: Users, match: /^\/directory/ },
    { href: "/leaderboards", label: "Ranks", icon: BarChart3, match: /^\/leaderboards/ },
    { href: "/profile", label: "Profile", icon: User, match: /^\/profile/ },
];

export function MobileBottomNav({ badgeCounts }: { badgeCounts?: Record<string, number> }) {
    const pathname = usePathname();

    return (
        <>
            {/* Hide on desktop — Tailwind md:hidden unreliable in route-group context */}
            <style>{`
                .mobile-bottom-nav-shell { display: block; }
                @media (min-width: 768px) { .mobile-bottom-nav-shell { display: none !important; } }
            `}</style>
            <nav className="mobile-bottom-nav-shell fixed bottom-0 left-0 right-0 z-50 bg-hc-surface/95 backdrop-blur-xl border-t border-hc-border safe-area-pb">
                <div className="flex items-stretch h-[60px]">
                    {NAV_ITEMS.map((item) => {
                        const isActive = item.match
                            ? item.match.test(pathname)
                            : pathname === item.href;
                        const badge = badgeCounts?.[item.href] ?? 0;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex-1 flex flex-col items-center justify-center gap-0.5",
                                    "min-h-[60px] transition-colors duration-150",
                                    isActive
                                        ? "text-hc-gold-500"
                                        : "text-hc-muted hover:text-hc-text",
                                )}
                            >
                                {/* Active indicator bar */}
                                {isActive && (
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-hc-gold-500 rounded-full" />
                                )}

                                {/* Icon + Badge */}
                                <span className="relative">
                                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                                    {badge > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-hc-danger text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                            {badge > 9 ? "9+" : badge}
                                        </span>
                                    )}
                                </span>

                                {/* Label */}
                                <span className={cn(
                                    "text-[10px] font-semibold uppercase tracking-wider",
                                    isActive ? "text-hc-gold-500" : "text-hc-muted",
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}

export default MobileBottomNav;
