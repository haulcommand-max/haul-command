
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShieldCheck,
    Users,
    Trophy,
    Map,
    Flame,
    Settings,
    CreditCard
} from "lucide-react";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Moderation", href: "/admin/moderation", icon: ShieldCheck },
    { name: "Directory", href: "/admin/directory", icon: Users },
    { name: "Leaderboard", href: "/admin/leaderboard", icon: Trophy },
    { name: "Corridors", href: "/admin/corridors", icon: Map },
    { name: "Heat Engine", href: "/admin/heat", icon: Flame },
    { name: "Billing", href: "/admin/sponsors", icon: CreditCard },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div style={{
            width: 260,
            background: "var(--hc-panel)",
            borderRight: "1px solid var(--hc-border)",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            position: "sticky",
            top: 0
        }}>
            <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--hc-border)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "var(--hc-gold-600)" }}>
                    CONTROL TOWER
                </h2>
                <p style={{ fontSize: 10, color: "var(--hc-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Haul Command Admin
                </p>
            </div>

            <nav style={{ flex: 1, padding: "20px 12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "12px 14px",
                                    borderRadius: 12,
                                    textDecoration: "none",
                                    color: isActive ? "#111" : "var(--hc-text)",
                                    background: isActive ? "var(--hc-gold-600)" : "transparent",
                                    fontWeight: isActive ? 900 : 500,
                                    fontSize: 14,
                                    transition: "all 0.2s"
                                }}
                            >
                                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div style={{ padding: 20, borderTop: "1px solid var(--hc-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--hc-gold-600)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, color: "#111" }}>
                        AD
                    </div>
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Root Admin</p>
                        <p style={{ fontSize: 10, color: "var(--hc-muted)", margin: 0 }}>System Access</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
