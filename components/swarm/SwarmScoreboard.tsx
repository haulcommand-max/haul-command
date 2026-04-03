// components/swarm/SwarmScoreboard.tsx
// Required visibility layer — daily swarm performance metrics
"use client";

import React, { useEffect, useState } from "react";

interface Scoreboard {
  executions_today: number;
  claims_driven: number;
  listings_created: number;
  loads_captured: number;
  matches_created: number;
  revenue_influenced: number;
  sponsor_inventory_filled: number;
  ai_citation_pages: number;
  no_dead_end_fixes: number;
  market_activations: number;
}

const METRIC_CONFIG = [
  { key: "executions_today", label: "Executions", icon: "⚡", format: "number" },
  { key: "claims_driven", label: "Claims Driven", icon: "🛡️", format: "number" },
  { key: "listings_created", label: "Listings Created", icon: "📋", format: "number" },
  { key: "loads_captured", label: "Loads Captured", icon: "📦", format: "number" },
  { key: "matches_created", label: "Matches", icon: "🔗", format: "number" },
  { key: "revenue_influenced", label: "Revenue Influenced", icon: "💰", format: "currency" },
  { key: "sponsor_inventory_filled", label: "Sponsors Filled", icon: "🎯", format: "number" },
  { key: "ai_citation_pages", label: "AI Citation Pages", icon: "🤖", format: "number" },
  { key: "no_dead_end_fixes", label: "Dead Ends Fixed", icon: "🔧", format: "number" },
  { key: "market_activations", label: "Markets Activated", icon: "🌍", format: "number" },
] as const;

export function SwarmScoreboard() {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);

  useEffect(() => {
    fetch("/api/swarm/scoreboard")
      .then(r => r.json())
      .then(d => setScoreboard(d.scoreboard))
      .catch(() => {});
  }, []);

  if (!scoreboard) {
    return <div className="swarm-scoreboard-loading">Loading scoreboard...</div>;
  }

  return (
    <div className="swarm-scoreboard">
      <h2 className="swarm-scoreboard-title">🐝 Swarm Scoreboard</h2>
      <div className="swarm-scoreboard-grid">
        {METRIC_CONFIG.map(({ key, label, icon, format }) => {
          const value = scoreboard[key as keyof Scoreboard];
          return (
            <div key={key} className="swarm-metric-card">
              <span className="swarm-metric-icon">{icon}</span>
              <span className="swarm-metric-value">
                {format === "currency" ? `$${(value as number).toLocaleString()}` : (value as number).toLocaleString()}
              </span>
              <span className="swarm-metric-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
