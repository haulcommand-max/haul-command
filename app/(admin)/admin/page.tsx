
"use client";

import React from "react";
import {
    Users,
    ShieldCheck,
    Activity,
    TrendingUp,
    AlertTriangle,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

import { ReporterDial } from "@/components/reporter/ReporterDial";

export default function AdminDashboardPage() {
    const stats = [
        { name: "Global Providers", value: "34,204", change: "+12%", icon: Users, color: "var(--hc-gold-600)" },
        { name: "Active Moderation", value: "12", change: "Needs Action", icon: ShieldCheck, color: "var(--hc-danger)" },
        { name: "System Load", value: "Lite", change: "Optimal", icon: Activity, color: "#4ade80" },
        { name: "Revenue (MTD)", value: "$12,400", change: "+8%", icon: TrendingUp, color: "var(--hc-gold-600)" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <ReporterDial />

            {/* KPI Section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {stats.map((stat) => (
                    <div key={stat.name} style={{
                        background: "var(--hc-panel)",
                        padding: 20,
                        borderRadius: 16,
                        border: "1px solid var(--hc-border)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start"
                    }}>
                        <div>
                            <p style={{ fontSize: 11, color: "var(--hc-muted)", fontWeight: 700, textTransform: "uppercase", margin: 0, marginBottom: 8 }}>
                                {stat.name}
                            </p>
                            <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>{stat.value}</h3>
                            <p style={{ fontSize: 10, fontWeight: 700, margin: 0, marginTop: 4, color: stat.color }}>
                                {stat.change}
                            </p>
                        </div>
                        <stat.icon size={20} color={stat.color} />
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Critical Alerts */}
                <div style={{ background: "var(--hc-panel)", borderRadius: 16, border: "1px solid var(--hc-border)", overflow: "hidden" }}>
                    <div style={{ padding: 16, borderBottom: "1px solid var(--hc-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>CRITICAL ALERTS</h3>
                        <span style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>4 Active</span>
                    </div>
                    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                        <AlertCard
                            type="danger"
                            title="Duplicate Provider Spike"
                            msg="A spike in duplicate entries detected from Region: SE (GA)."
                        />
                        <AlertCard
                            type="warning"
                            title="Corridor Volatility"
                            msg="I-10 corridor rates deviating >15% from benchmark."
                        />
                        <AlertCard
                            type="info"
                            title="Database Backup"
                            msg="Last automated snapshot successful: 4h ago."
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: "var(--hc-panel)", padding: 20, borderRadius: 16, border: "1px solid var(--hc-border)" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0, marginBottom: 12 }}>MODERATION INBOX</h3>
                        <p style={{ fontSize: 12, color: "var(--hc-muted)", marginBottom: 16 }}>
                            There are 8 unverified pilots and 4 flagged loads awaiting review.
                        </p>
                        <Link href="/admin/moderation" style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "var(--hc-gold-600)",
                            borderRadius: 12,
                            color: "#111",
                            textDecoration: "none",
                            fontWeight: 900,
                            fontSize: 12
                        }}>
                            REVIEW QUEUE <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div style={{ background: "var(--hc-panel)", padding: 20, borderRadius: 16, border: "1px solid var(--hc-border)" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0, marginBottom: 12 }}>PERFORMANCE BILLING</h3>
                        <p style={{ fontSize: 12, color: "var(--hc-muted)", marginBottom: 16 }}>
                            Total leads generated this week: 1,402. Settlement pending for 4 clients.
                        </p>
                        <Link href="/admin/sponsors" style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid var(--hc-border)",
                            borderRadius: 12,
                            color: "var(--hc-text)",
                            textDecoration: "none",
                            fontWeight: 900,
                            fontSize: 12
                        }}>
                            VIEW BILLING CENTER <ArrowRight size={16} />
                        </Link>
                    </div>
                </div >
            </div >
        </div >
    );
}

function AlertCard({ type, title, msg }: { type: 'danger' | 'warning' | 'info', title: string, msg: string }) {
    const colors = {
        danger: "#ff4d4d",
        warning: "#f59e0b",
        info: "#60a5fa"
    };

    return (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 4, height: 32, background: colors[type], borderRadius: 2 }} />
            <div>
                <h4 style={{ fontSize: 12, fontWeight: 900, margin: 0 }}>{title}</h4>
                <p style={{ fontSize: 11, color: "var(--hc-muted)", margin: 0 }}>{msg}</p>
            </div>
        </div>
    );
}
