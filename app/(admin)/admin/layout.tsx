
import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-[#070707] text-[#e5e5e5]">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#1a1a1a] bg-[#0c0c0c] flex flex-col">
                <div className="p-6 border-b border-[#1a1a1a]">
                    <h1 className="text-xl font-black tracking-tighter text-[#ffb400]">
                        HAUL COMMAND <span className="block text-[10px] text-[#444] uppercase tracking-[0.2em]">Control Tower</span>
                    </h1>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <AdminNavLink href="/admin" label="Dashboard" icon="📊" />
                    <AdminNavLink href="/admin/moderation" label="Moderation Inbox" icon="📥" />
                    <AdminNavLink href="/admin/directory" label="Directory" icon="📇" />
                    <AdminNavLink href="/admin/loads" label="Load Board" icon="📦" />
                    <AdminNavLink href="/admin/leaderboard" label="Leaderboard" icon="🏆" />
                    <AdminNavLink href="/admin/corridors" label="Corridors" icon="🛣️" />
                    <AdminNavLink href="/admin/heat" label="Heat Engine" icon="🔥" />
                    <AdminNavLink href="/admin/billing" label="Sponsors & Billing" icon="💰" />
                    <div className="my-4 border-t border-[#1a1a1a] opacity-20" />
                    <AdminNavLink href="/admin/settings" label="Settings" icon="⚙️" />
                    <AdminNavLink href="/admin/audit" label="Audit Log" icon="📜" />
                </nav>

                <div className="p-4 border-t border-[#1a1a1a]">
                    <div className="flex items-center gap-2 text-xs text-[#666]">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>System Active</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto flex flex-col">
                {children}
            </main>
        </div>
    );
}

function AdminNavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all hover:bg-[#1a1a1a] hover:text-white group"
        >
            <span className="opacity-50 group-hover:opacity-100">{icon}</span>
            <span>{label}</span>
        </Link>
    );
}
