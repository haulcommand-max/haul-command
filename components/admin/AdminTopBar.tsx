
import React from 'react';
import { Search, Plus, Bell } from "lucide-react";

export function AdminTopBar({ title = "Control Tower", phase = 'LAUNCH' }: { title?: string; phase?: string }) {
    return (
        <header style={{
            height: 64,
            borderBottom: "1px solid var(--hc-border)",
            background: "var(--hc-panel)",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 50
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
                <span style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.05)",
                    fontSize: 9,
                    fontWeight: 900,
                    color: "var(--hc-muted)",
                    border: "1px solid var(--hc-border)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em"
                }}>
                    {phase} PHASE
                </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {/* Global Search */}
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Search size={14} style={{ position: "absolute", left: 12, color: "var(--hc-muted)" }} />
                    <input
                        type="text"
                        placeholder="Search network (⌘K)"
                        style={{
                            width: 280,
                            background: "rgba(0,0,0,0.2)",
                            border: "1px solid var(--hc-border)",
                            borderRadius: 20,
                            padding: "8px 12px 8px 36px",
                            fontSize: 12,
                            outline: "none",
                            color: "var(--hc-text)"
                        }}
                    />
                </div>

                {/* Utils */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, borderRight: "1px solid var(--hc-border)", paddingRight: 20 }}>
                    <button style={{ background: "none", border: "none", color: "var(--hc-muted)", cursor: "pointer" }}>
                        <Bell size={18} />
                    </button>
                    <button style={{
                        background: "var(--hc-gold-600)",
                        border: "none",
                        borderRadius: 8,
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                    }}>
                        <Plus size={18} color="#111" />
                    </button>
                </div>

                {/* Profile */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 11, fontWeight: 900, margin: 0 }}>T. STALLONE</p>
                        <p style={{ fontSize: 9, color: "var(--hc-gold-600)", margin: 0, fontWeight: 700 }}>OWNER ADMIN</p>
                    </div>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "linear-gradient(135deg, var(--hc-panel) 0%, #000 100%)",
                        border: "1px solid var(--hc-border)"
                    }} />
                </div>
            </div>
        </header>
    );
}
