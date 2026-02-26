
import React from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--hc-panel-dark)" }}>
            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="hidden md:block">
                <AdminSidebar />
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <AdminTopBar />
                <main style={{ flex: 1, padding: 20, overflowY: "auto" }}>
                    {children}
                </main>

                {/* Mobile Bottom Nav Placeholder */}
                <div className="md:hidden" style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "var(--hc-panel)",
                    borderTop: "1px solid var(--hc-border)",
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    zIndex: 50
                }}>
                    {/* We'll implement mobile items in a separate component or here later */}
                </div>
            </div>
        </div>
    );
}
