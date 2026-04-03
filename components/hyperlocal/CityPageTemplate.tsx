// components/hyperlocal/CityPageTemplate.tsx
// Hyperlocal Dominance OS — city page template
// Every city page connects to: directory, regulations, tools, glossary,
// nearby cities, nearby corridors, local proof, and commercial intent.
// Rule: Never leave a city or corridor page as a thin stub.

"use client";
import React from "react";
import { AnswerBlock } from "@/components/ai-search/AnswerBlock";
import { FreshnessConfidenceBadge } from "@/components/legal/FreshnessConfidenceBadge";
import type { LegalConfidence } from "@/lib/legal/freshness-confidence";

interface CityData {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  slug: string;
  // Supply
  operatorCount: number;
  claimedCount: number;
  placeCount: number;
  // Regulations
  escortRequired: boolean | null;
  regulationSummary: string;
  regulationConfidence: LegalConfidence;
  regulationLastVerified: string | null;
  officialSource: string | null;
  officialSourceUrl: string | null;
  // Corridors
  nearbyCities: { name: string; slug: string; distance_km: number }[];
  nearbyCorridors: { name: string; slug: string }[];
  // Market
  marketMode: string;
  avgResponseHours: number;
  // Social proof
  recentActivity: { action: string; time: string }[];
}

interface Props {
  data: CityData;
}

export function CityPageTemplate({ data }: Props) {
  const d = data;

  return (
    <article className="hyperlocal-city-page" itemScope itemType="https://schema.org/City">
      {/* ── Hero ── */}
      <header className="hyperlocal-hero">
        <div className="hyperlocal-breadcrumbs">
          <a href={`/${d.countryCode.toLowerCase()}`}>{d.country}</a>
          <span> / </span>
          <a href={`/${d.countryCode.toLowerCase()}/${d.region.toLowerCase().replace(/\s+/g, "-")}`}>{d.region}</a>
          <span> / </span>
          <span>{d.city}</span>
        </div>

        <h1 itemProp="name">
          Heavy Haul &amp; Pilot Car Services in {d.city}, {d.region}
        </h1>

        <p className="hyperlocal-subtitle">
          {d.operatorCount} operators • {d.claimedCount} verified • {d.placeCount} support services
        </p>

        {/* Market mode indicator */}
        <div className={`hyperlocal-market-mode mode-${d.marketMode}`}>
          Market: {d.marketMode.replace("_", " ")}
          {d.avgResponseHours > 0 && ` • Avg response: ${d.avgResponseHours}h`}
        </div>
      </header>

      {/* ── AI Answer Block ── */}
      <AnswerBlock
        question={`Do you need a pilot car for oversize loads in ${d.city}, ${d.region}?`}
        answer={d.regulationSummary}
        confidence={d.regulationConfidence}
        lastVerified={d.regulationLastVerified ?? undefined}
        entityType="regulation"
        country={d.countryCode}
        region={d.region}
        ctaLabel="Find Pilot Cars"
        ctaUrl={`/directory?city=${d.slug}`}
        secondaryCtaLabel="Check Requirements"
        secondaryCtaUrl={`/requirements/${d.countryCode.toLowerCase()}/${d.region.toLowerCase().replace(/\s+/g, "-")}`}
      />

      {/* ── Legal Freshness ── */}
      <FreshnessConfidenceBadge
        confidence={d.regulationConfidence}
        lastVerified={d.regulationLastVerified}
        officialSource={d.officialSource}
        officialSourceUrl={d.officialSourceUrl}
      />

      {/* ── Directory Section ── */}
      <section className="hyperlocal-section">
        <h2>Pilot Car &amp; Escort Services in {d.city}</h2>
        <a href={`/directory?city=${d.slug}`} className="hyperlocal-cta">
          Browse {d.operatorCount} Operators →
        </a>
      </section>

      {/* ── Nearby Corridors ── */}
      {d.nearbyCorridors.length > 0 && (
        <section className="hyperlocal-section">
          <h2>Major Corridors Near {d.city}</h2>
          <div className="hyperlocal-corridor-grid">
            {d.nearbyCorridors.map(c => (
              <a key={c.slug} href={`/corridors/${c.slug}`} className="hyperlocal-corridor-card">
                🛤️ {c.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Nearby Cities ── */}
      {d.nearbyCities.length > 0 && (
        <section className="hyperlocal-section">
          <h2>Nearby Cities</h2>
          <div className="hyperlocal-nearby-grid">
            {d.nearbyCities.map(c => (
              <a key={c.slug} href={`/near/${c.slug}`} className="hyperlocal-nearby-card">
                📍 {c.name} ({c.distance_km} km)
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Social Proof / Activity ── */}
      {d.recentActivity.length > 0 && (
        <section className="hyperlocal-section">
          <h2>Recent Activity</h2>
          <ul className="hyperlocal-activity">
            {d.recentActivity.slice(0, 5).map((a, i) => (
              <li key={i}>{a.action} <span className="activity-time">{a.time}</span></li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Tools ── */}
      <section className="hyperlocal-section">
        <h2>Tools for {d.city}</h2>
        <div className="hyperlocal-tool-grid">
          <a href="/tools/escort-calculator" className="hyperlocal-tool-card">💰 Escort Cost Calculator</a>
          <a href="/tools/route-complexity" className="hyperlocal-tool-card">🗺️ Route Complexity Check</a>
          <a href="/tools/permit-checker" className="hyperlocal-tool-card">📋 Permit Checker</a>
        </div>
      </section>

      {/* ── Claim CTA ── */}
      <section className="hyperlocal-claim-cta">
        <h2>Are you a pilot car operator in {d.city}?</h2>
        <p>Claim your profile to get listed, verified, and start receiving leads.</p>
        <a href="/claim" className="hc-answer-cta-primary">Claim Your Profile</a>
      </section>
    </article>
  );
}
