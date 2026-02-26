"use client";

import { cn } from "@/lib/utils";
import { Terminal, PhoneCall, Truck, Map, ShieldCheck, DollarSign, Settings, LayoutDashboard, Radio, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Voice Rail', href: '/dashboard/voice-rail', icon: Radio },
    { name: 'Loads', href: '/dashboard/loads', icon: Truck },
    { name: 'Network', href: '/dashboard/network', icon: Users },
    { name: 'Finance', href: '/dashboard/finance', icon: DollarSign },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-200">
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950/50 backdrop-blur-xl">
                <div className="border-b border-slate-800 p-6">
                    <h1 className="text-xl font-bold tracking-tighter text-white">
                        HAUL <span className="text-amber-500">COMMAND</span>
                    </h1>
                    <p className="mt-1 font-mono text-xs text-slate-500">OS v1.0.4 [BETA]</p>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "border-l-2 border-amber-500 bg-slate-800 text-amber-500"
                                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t border-slate-800 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        <span className="font-mono text-xs text-slate-400">SYSTEM ONLINE</span>
                    </div>
                </div>
            </aside>
            <main className="min-h-screen w-full bg-slate-950 pl-64">
                {children}
            </main>
        </div>
    );
}
