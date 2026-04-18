import React from "react";
import Link from "next/link";
import { IntentMonetizationSurface, MasterIntent } from "@/components/ui/intent-blocks";

/**
 * DataProductTeaser
 * 
 * Embeddable component for regulation, tool, and corridor pages.
 * Renders a compact teaser that cross-sells the relevant data product.
 * 
 * This replaces the pattern of having disconnected "Browse Data Products" links
 * with context-aware, intent-moment teasers that know what the user is looking at.
 */

interface DataProductTeaserProps {
  productSlug: string;
  productName: string;
  teaserText: string;
  priceCents: number;
  stripeProductId?: string;
  /** The context this teaser appears in — used for attribution tracking */
  sourcePageFamily: "regulation" | "tool" | "corridor" | "blog" | "glossary";
  sourceEntityId: string;
}

export function DataProductTeaser({ 
  productSlug, 
  productName, 
  teaserText, 
  priceCents, 
  stripeProductId,
  sourcePageFamily,
  sourceEntityId 
}: DataProductTeaserProps) {
  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-black border border-blue-500/20 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex-1">
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 block">
          Data Intelligence
        </span>
        <h4 className="text-lg font-bold text-white mb-1">{productName}</h4>
        <p className="text-sm text-gray-400">{teaserText}</p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <div className="text-2xl font-black text-white mb-2">
          ${(priceCents / 100).toFixed(0)}
        </div>
        <Link
          href={`/data?product=${productSlug}&src=${sourcePageFamily}&ref=${sourceEntityId}`}
          className="bg-blue-500 text-white font-bold text-xs px-6 py-2 rounded hover:bg-blue-400 transition uppercase"
        >
          View Report →
        </Link>
      </div>
    </div>
  );
}

/**
 * Pre-built teasers for the most common cross-sell scenarios.
 * Use these as drop-in components on regulation, tool, and corridor pages.
 */

export function CorridorRateTeaser({ corridorId }: { corridorId: string }) {
  return (
    <DataProductTeaser
      productSlug="corridor-rate-report"
      productName="Corridor Rate Intelligence Report"
      teaserText={`Get per-mile rate benchmarks, escort supply density, and seasonal demand patterns for this corridor. Includes historical trends and forecasting.`}
      priceCents={2900}
      sourcePageFamily="corridor"
      sourceEntityId={corridorId}
    />
  );
}

export function RegulationComplianceTeaser({ countryCode, regionCode }: { countryCode: string; regionCode?: string }) {
  return (
    <DataProductTeaser
      productSlug="compliance-export"
      productName="Full Compliance Data Export"
      teaserText="Download the complete requirement matrix, permit contacts, threshold variations, and equipment mandates for this jurisdiction as a structured dataset."
      priceCents={4900}
      sourcePageFamily="regulation"
      sourceEntityId={`${countryCode}${regionCode ? `-${regionCode}` : ''}`}
    />
  );
}

export function MarketDensityTeaser({ countryCode }: { countryCode: string }) {
  return (
    <DataProductTeaser
      productSlug="market-density-report"
      productName="Operator Density & Market Maturity Report"
      teaserText="See the verified operator count, claim rates, coverage gaps, and competitive positioning for this market. Includes enterprise-grade export."
      priceCents={9900}
      sourcePageFamily="regulation"
      sourceEntityId={countryCode}
    />
  );
}
