"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

// Haul Command: Self-Serve AdGrid Advertiser Dashboard
// Path: app/(public)/advertise/dashboard/page.tsx

interface Campaign {
  id: string;
  name: string;
  type: "cpc" | "corridor" | "territory";
  status: "active" | "paused" | "ended";
  budget_cents: number;
  spent_cents: number;
  impressions: number;
  clicks: number;
  ctr: number;
  created_at: string;
}

// In production, fetched from /api/adgrid/campaigns
const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: "c1", name: "Texas Pilot Car Search", type: "cpc", status: "active",
    budget_cents: 50000, spent_cents: 18750, impressions: 12400, clicks: 87, ctr: 0.7,
    created_at: "2026-04-01",
  },
  {
    id: "c2", name: "I-10 Corridor Sponsor", type: "corridor", status: "active",
    budget_cents: 19900, spent_cents: 19900, impressions: 34200, clicks: 412, ctr: 1.2,
    created_at: "2026-03-15",
  },
];

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  paused: "#eab308",
  ended: "#6b7280",
};

export default function AdvertiserDashboard() {
  const [campaigns] = useState<Campaign[]>(DEMO_CAMPAIGNS);

  const totalSpent = campaigns.reduce((s, c) => s + c.spent_cents, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-end border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">AdGrid Command Center</h1>
            <p className="text-sm text-gray-400 mt-1">Manage campaigns, track performance, and scale spend.</p>
          </div>
          <Link href="/advertise/buy" className="bg-yellow-500 text-black font-bold text-sm px-6 py-3 rounded hover:bg-yellow-400 transition uppercase">
            + New Campaign
          </Link>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: "Total Spend", value: `$${(totalSpent / 100).toFixed(2)}`, color: "#D4A843" },
            { label: "Impressions", value: totalImpressions.toLocaleString(), color: "#3b82f6" },
            { label: "Clicks", value: totalClicks.toLocaleString(), color: "#22c55e" },
            { label: "Avg CTR", value: `${avgCTR}%`, color: "#8b5cf6" },
          ].map(kpi => (
            <div key={kpi.label} className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">{kpi.label}</div>
              <div className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Campaign Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-bold uppercase tracking-tight">Active Campaigns</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-widest border-b border-gray-800">
                <th className="px-6 py-4">Campaign</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Impressions</th>
                <th className="px-6 py-4">Clicks</th>
                <th className="px-6 py-4">CTR</th>
                <th className="px-6 py-4">Spent</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-6 py-4 font-bold text-white">{c.name}</td>
                  <td className="px-6 py-4 text-gray-400 uppercase text-xs">{c.type}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold uppercase px-2 py-1 rounded" style={{ color: STATUS_COLORS[c.status], background: `${STATUS_COLORS[c.status]}15`, border: `1px solid ${STATUS_COLORS[c.status]}30` }}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-300">{c.impressions.toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono text-gray-300">{c.clicks}</td>
                  <td className="px-6 py-4 font-mono text-gray-300">{c.ctr}%</td>
                  <td className="px-6 py-4 font-mono text-yellow-500">${(c.spent_cents / 100).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <button className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1 rounded transition mr-2">
                      {c.status === "active" ? "Pause" : "Resume"}
                    </button>
                    <button className="text-xs text-gray-400 hover:text-red-400 border border-gray-700 px-3 py-1 rounded transition">
                      End
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upsell */}
        <div className="bg-gradient-to-r from-yellow-900/20 to-black border border-yellow-500/20 rounded-xl p-8 text-center">
          <h3 className="text-xl font-black text-white mb-2">Want Higher Placement?</h3>
          <p className="text-sm text-gray-400 mb-4">Upgrade from CPC to Corridor or Territory Sponsorship for guaranteed top-slot visibility.</p>
          <Link href="/advertise/buy" className="bg-yellow-500 text-black font-bold text-sm px-8 py-3 rounded hover:bg-yellow-400 transition uppercase">
            Explore Sponsorships
          </Link>
        </div>

      </div>
    </div>
  );
}
