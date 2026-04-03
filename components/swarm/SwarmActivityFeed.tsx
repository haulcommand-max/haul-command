'use client';
// components/swarm/SwarmActivityFeed.tsx
// Required visibility layer — live feed of what agents are doing
"use client";

import React, { useEffect, useState } from "react";

interface ActivityEntry {
  id: string;
  agent_name: string;
  domain?: string;
  trigger_reason: string;
  action_taken: string;
  surfaces_touched: string[];
  revenue_impact: number | null;
  trust_impact: number | null;
  country: string;
  market_key?: string;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#10b981",
  running: "#6366f1",
  queued: "#f59e0b",
  failed: "#ef4444",
  skipped: "#6b7280",
};

const DOMAIN_LABELS: Record<string, string> = {
  command_governance: "⚙️ Governance",
  supply_control: "📦 Supply",
  demand_capture: "📥 Demand",
  matching_execution: "🔗 Matching",
  claim_identity_control: "🛡️ Claims",
  trust_reputation_control: "⭐ Trust",
  search_intent_capture: "🔍 Search",
  monetization_control: "💰 Revenue",
  data_intelligence_control: "📊 Data",
};

export function SwarmActivityFeed({ limit = 25 }: { limit?: number }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const url = filter === "all"
      ? `/api/swarm/activity?limit=${limit}`
      : `/api/swarm/activity?limit=${limit}&domain=${filter}`;

    fetch(url)
      .then(r => r.json())
      .then(d => { setEntries(d.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [limit, filter]);

  return (
    <div className="swarm-feed">
      <div className="swarm-feed-header">
        <h2>🐝 Swarm Activity</h2>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="swarm-feed-filter"
        >
          <option value="all">All Domains</option>
          {Object.entries(DOMAIN_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="swarm-feed-loading">Loading swarm activity...</div>
      ) : entries.length === 0 ? (
        <div className="swarm-feed-empty">No swarm activity yet. Agents are initializing.</div>
      ) : (
        <div className="swarm-feed-list">
          {entries.map(entry => (
            <div key={entry.id} className="swarm-feed-entry">
              <div className="swarm-entry-top">
                <span
                  className="swarm-entry-status"
                  style={{ background: STATUS_COLORS[entry.status] || "#6b7280" }}
                />
                <span className="swarm-entry-agent">{entry.agent_name.replace(/_/g, " ")}</span>
                {entry.domain && (
                  <span className="swarm-entry-domain">
                    {DOMAIN_LABELS[entry.domain] || entry.domain}
                  </span>
                )}
                <span className="swarm-entry-time">
                  {new Date(entry.created_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="swarm-entry-action">{entry.action_taken}</div>
              <div className="swarm-entry-meta">
                <span className="swarm-entry-trigger">⚡ {entry.trigger_reason}</span>
                {entry.country && <span className="swarm-entry-country">🌍 {entry.country.toUpperCase()}</span>}
                {entry.revenue_impact && entry.revenue_impact > 0 && (
                  <span className="swarm-entry-revenue">💰 +${entry.revenue_impact}</span>
                )}
                {entry.surfaces_touched?.length > 0 && (
                  <span className="swarm-entry-surfaces">
                    📋 {entry.surfaces_touched.join(", ")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
