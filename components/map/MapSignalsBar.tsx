"use client";
import React from "react";

// Lightweight live signals bar for the /map page
// Shows active loads, hot states, and a live indicator
export function MapSignalsBar() {
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 14px",
            background: "rgba(15,23,32,0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            backdropFilter: "blur(12px)",
            flexWrap: "wrap",
        }}>
            {/* Live pulse */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#27d17f", boxShadow: "0 0 8px #27d17f",
                    animation: "pulse-slow 2s infinite",
                }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#27d17f", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    Live Map
                </span>
            </div>

            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)" }} />

            {[
                { label: "US States", value: "50" },
                { label: "CA Provinces", value: "10" },
                { label: "Corridors", value: "Hot" },
            ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#cfd8e3" }}>{value}</span>
                    <span style={{ fontSize: 10, color: "#8fa3b8" }}>{label}</span>
                </div>
            ))}

            <div style={{ marginLeft: "auto", fontSize: 10, color: "#8fa3b8" }}>
                Click any state or province to browse operators
            </div>
        </div>
    );
}
