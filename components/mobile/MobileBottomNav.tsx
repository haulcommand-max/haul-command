"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Truck, Wrench, User } from "lucide-react";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════
// MOBILE BOTTOM TAB NAVIGATION — 5-tab bar
// Refactored: eliminated 50+ lines of inline <style> tags.
// Now uses Tailwind utility classes exclusively.
// Safe-area aware. WCAG 44px touch targets. Glass blur.
// ══════════════════════════════════════════════════════════════

const TABS = [
  { href: "/", label: "Home", icon: Home, match: ["/"] },
  { href: "/directory", label: "Directory", icon: Search, match: ["/directory", "/near"] },
  { href: "/loads", label: "Loads", icon: Truck, match: ["/loads", "/jobs"] },
  { href: "/tools", label: "Tools", icon: Wrench, match: ["/tools", "/rates", "/requirements"] },
  { href: "/login", label: "Account", icon: User, match: ["/login", "/onboarding", "/settings", "/profile", "/claim"] },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (tab: (typeof TABS)[number]) => {
    if (tab.href === "/" && pathname === "/") return true;
    if (tab.href === "/") return false;
    return tab.match.some((m) => pathname.startsWith(m));
  };

  return (
    <>
      {/* Spacer so content isn't hidden behind fixed nav */}
      <div className="block md:hidden h-[calc(60px+env(safe-area-inset-bottom,0px))]" />

      <nav
        className={cn(
          // Hidden on desktop
          "fixed bottom-0 left-0 right-0 z-[9999]",
          "flex md:hidden",
          // Glass surface
          "bg-[rgba(11,11,12,0.95)]",
          "backdrop-blur-[20px] saturate-[180%]",
          "-webkit-backdrop-filter-blur-[20px]",
          // Border
          "border-t border-white/[0.06]",
          // Safe area padding
          "pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5",
          "justify-around items-center"
        )}
        aria-label="Mobile navigation"
      >
        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5",
                "py-1 min-w-[56px] min-h-[44px]",
                "no-underline",
                "transition-colors duration-150",
                active ? "text-hc-gold-400" : "text-hc-subtle"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-[0.04em]">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
