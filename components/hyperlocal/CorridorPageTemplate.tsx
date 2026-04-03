// components/hyperlocal/CorridorPageTemplate.tsx
// Hyperlocal corridor page — route intelligence, services, operators, sponsors
"use client";
import React from "react";
import { AnswerBlock } from "@/components/ai-search/AnswerBlock";

interface CorridorData {
  name: string;
  slug: string;
  description: string;
  startCity: string;
  endCity: string;
  countries: string[];
  totalMiles: number;
  // Intelligence
  demandHeat: "cold" | "warm" | "hot" | "critical";
  avgRate: number | null;
  restrictionCount: number;
  // Supply
  operatorCount: number;
  nearbyPlaces: { name: string; type: string; slug: string }[];
  // Sponsor
  sponsorSlotAvailable: boolean;
  currentSponsor?: { name: string; logo?: string; url: string };
}

const HEAT_COLORS = { cold: "#6b7280", warm: "#f59e0b", hot: "#ef4444", critical: "#dc2626" };

export function CorridorPageTemplate({ data }: { data: CorridorData }) {
  const d = data;
  return (
    <article className="hyperlocal-corridor-page">
      <header className="hyperlocal-hero">
        <h1>🛤️ {d.name}</h1>
        <p className="hyperlocal-subtitle">
          {d.startCity} → {d.endCity} • {d.totalMiles} miles
          • {d.operatorCount} operators • {d.restrictionCount} restrictions
        </p>
        <span className="corridor-heat" style={{ color: HEAT_COLORS[d.demandHeat] }}>
          Demand: {d.demandHeat.toUpperCase()}
        </span>
      </header>

      <AnswerBlock
        question={`What do you need to know about the ${d.name} corridor?`}
        answer={d.description}
        entityType="corridor"
        ctaLabel="Find Operators on This Route"
        ctaUrl={`/directory?corridor=${d.slug}`}
        secondaryCtaLabel="Check Restrictions"
        secondaryCtaUrl={`/tools/route-complexity?corridor=${d.slug}`}
      />

      {d.avgRate && (
        <section className="hyperlocal-section">
          <h2>Rate Intelligence</h2>
          <p>Average pilot car rate on this corridor: <strong>${d.avgRate}/mile</strong></p>
          <a href="/tools/rate-lookup" className="hyperlocal-cta">Check Current Rates →</a>
        </section>
      )}

      {d.nearbyPlaces.length > 0 && (
        <section className="hyperlocal-section">
          <h2>Support Services Along Route</h2>
          <div className="hyperlocal-tool-grid">
            {d.nearbyPlaces.slice(0, 8).map(p => (
              <a key={p.slug} href={`/places/${p.slug}`} className="hyperlocal-tool-card">
                {p.type === "truck_stop" ? "⛽" : p.type === "repair" ? "🔧" : "🏨"} {p.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Sponsor slot */}
      {d.currentSponsor ? (
        <aside className="corridor-sponsor">
          <span className="sponsor-label">Corridor Sponsor</span>
          <a href={d.currentSponsor.url}>{d.currentSponsor.name}</a>
        </aside>
      ) : d.sponsorSlotAvailable ? (
        <aside className="corridor-sponsor-cta">
          <p>Sponsor this corridor and reach operators on this route.</p>
          <a href={`/advertise?corridor=${d.slug}`} className="hc-answer-cta-primary">
            Sponsor This Corridor
          </a>
        </aside>
      ) : null}
    </article>
  );
}
