/**
 * Article Enrichment Registry
 *
 * Slug-keyed configuration for intelligence article upgrades.
 * Each article can have: quick-answer data, FAQs, regulatory changes,
 * and intent-matched CTAs.
 *
 * This is the canonical data source for all per-article enrichments
 * that sit outside the content_html stored in Supabase.
 */

import type { QuickAnswer } from "@/components/blog/QuickAnswerBox";
import type { ChangeItem } from "@/components/blog/WhatChangedBox";

export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface ArticleCTA {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "outline";
}

export interface ArticleEnrichment {
  quickAnswer?: QuickAnswer;
  faqs?: ArticleFaq[];
  changes?: { year: string; items: ChangeItem[] };
  ctas?: ArticleCTA[];
  internalLinks?: { anchorText: string; href: string; insertAfter?: string }[];
}

/* ============================================================
 * TEXAS SUPERLOAD STRATEGY
 * ============================================================ */
const texasSuperloadStrategy: ArticleEnrichment = {
  quickAnswer: {
    headline: "Texas Superload: The 60-Second Summary",
    summary:
      "A Texas superload is any permitted move exceeding 16\u2019 wide, 18\u2019 tall, 125\u2019 long, or 254,300 lbs GVW. TxDMV processed ~18,000 superload permits in 2025. Each requires engineering analysis, DPS police escort, and 5\u201310 day advance scheduling.",
    facts: [
      { label: "Permit turnaround", value: "3\u201310 business days (corridor-dependent)" },
      { label: "Escort requirement", value: "DPS police escort mandatory" },
      { label: "Estimated cost", value: "$8,000\u2013$45,000+ per move" },
      { label: "Key corridors", value: "I-10, I-35, I-45 (Texas Triangle)" },
      { label: "2025 permit volume", value: "~900,000 OS/OW (18K superloads)" },
      { label: "Advance notice", value: "5\u201310 business days for DPS escort" },
    ],
    sourceNote:
      "Data from TxDMV FY 2025 Annual Report and HC Intelligence Corridor Database. Last verified: March 2026.",
  },

  faqs: [
    {
      question: "How much does a Texas superload permit cost?",
      answer:
        "Texas superload permits range from $1,200 to $6,500+ depending on load dimensions, route complexity, and number of bridge studies required. The base TxDMV single-trip permit fee is $270 for oversize loads, but superloads incur additional engineering review fees ($500\u2013$2,000), bridge analysis charges ($300\u2013$800 per bridge), and DPS police escort fees ($85\u2013$125/hour per officer). Total move cost including escorts, permits, and route preparation typically runs $8,000\u2013$45,000 for a standard Texas Triangle corridor move.",
    },
    {
      question: "How far in advance do I need to schedule a DPS police escort in Texas?",
      answer:
        "Texas Department of Public Safety (DPS) requires a minimum of 5 business days advance notice for police escort scheduling on I-10 (Houston\u2013San Antonio), 7\u201310 business days on I-35 (San Antonio\u2013DFW) due to high demand, and 3\u20135 business days on I-45 (Dallas\u2013Houston) thanks to pre-approved routing. During peak season (March\u2013June for wind energy, September\u2013December for refinery maintenance), lead times can extend significantly. Contact DPS Commercial Vehicle Enforcement at (512) 424-2000.",
    },
    {
      question: "Can I move a superload on Texas highways at night?",
      answer:
        "It depends on the route and load dimensions. TxDMV generally restricts superload movement to daylight hours (30 minutes before sunrise to 30 minutes after sunset). However, some I-10 corridor moves through sparsely populated areas may receive nighttime movement authorization if the load is time-sensitive (e.g., transformer deliveries for critical infrastructure). Night moves always require additional DPS escorts and specialized lighting equipment. Weekend moves (Saturday\u2013Sunday) are generally restricted on I-35 through urban zones.",
    },
    {
      question: "What bridges are restricted for superloads on I-10 in Texas?",
      answer:
        "TxDMV maintains a list of weight-restricted bridges that require case-by-case engineering analysis. Key restrictions on I-10 include the Colorado River bridge near Columbus (load limit varies by span), the San Jacinto River crossing east of Houston, and several overpasses in the San Antonio metropolitan area. Every superload permit application triggers an automatic bridge study for the proposed route. TxDMV\u2019s Bridge Division typically completes studies in 3\u20135 business days.",
    },
    {
      question: "Do I need a route survey for a Texas superload?",
      answer:
        "Yes, for most superloads exceeding 16\u2019 wide or 18\u2019 tall. TxDMV strongly recommends pre-move route surveys to identify overhead obstructions (utility lines, traffic signals, signage), low-clearance structures, and tight-radius turns. For loads over 20\u2019 wide or 20\u2019 tall, route surveys are effectively mandatory because DPS will not assign escorts without confirmation that the route is clear. Route survey services typically cost $800\u2013$3,000 depending on corridor length.",
    },
    {
      question: "What insurance minimums does Texas require for superloads?",
      answer:
        "Texas requires a minimum $1,000,000 combined single limit (CSL) liability policy for any oversize/overweight movement. For superloads, many shippers and brokers require additional coverage: $2,000,000\u2013$5,000,000 CSL is standard for loads valued over $500,000. Cargo insurance should match the declared value of the load. TxDMV verifies insurance at permit issuance and DPS officers verify proof of insurance at the movement start point.",
    },
  ],

  changes: {
    year: "2026",
    items: [
      { date: "Jan 2026", text: "TxDMV increased superload permit base fees by 12% effective January 1" },
      { date: "Feb 2026", text: "New I-35 bridge weight restriction at Hillsboro overpass (McLennan County) \u2014 max 180,000 lbs single-span" },
      { date: "Mar 2026", text: "DPS expanded digital escort coordination to all 254 counties via the TxEscort portal" },
    ],
  },

  ctas: [
    { label: "Check TX Permit Requirements", href: "/tools/permit-checker/us", variant: "primary" },
    { label: "Find TX Escort Operators", href: "/directory/us/tx", variant: "secondary" },
    { label: "Get Rate Estimate", href: "/tools/rate-estimator/us", variant: "outline" },
  ],
};

/* ============================================================
 * ESCORT RECIPROCITY GUIDE (existing, migrated from hardcoded)
 * ============================================================ */
const escortReciprocityGuide: ArticleEnrichment = {
  faqs: [
    {
      question: "Which escort certification should I get first?",
      answer:
        "Oregon\u2019s ODOT pilot car certification is the most widely accepted across the country. It\u2019s recognized by all full-reciprocity states and several partial-reciprocity states, making it the best starting point for multi-state operators. The certification costs approximately $250 and can be completed online through ODOT-approved providers.",
    },
    {
      question: "How long does reciprocity approval take?",
      answer:
        "In full-reciprocity states, no additional approval is needed \u2014 your existing certification is accepted immediately. In partial-reciprocity states, processing times vary: Texas requires an 8-hour online refresher, Colorado requires passing a written exam (typically same-day results), and Ohio issues temporary operating authority within 5\u20137 business days.",
    },
    {
      question: "Can I operate in non-reciprocity states with an Oregon certification?",
      answer:
        "No. States with no reciprocity (like New York, Pennsylvania, and Florida) require their own state-specific certification regardless of what other certifications you hold. You must complete the state\u2019s approved training program and pass their exam before operating as an escort vehicle in those jurisdictions.",
    },
    {
      question: "What happens if my certification expires while on a job?",
      answer:
        "Operating with an expired certification is treated the same as having no certification at all. Most states impose fines of $500\u2013$2,000 for uncertified escort operations, and some states (like New York and Texas) can impound your vehicle. Set reminders 60 days before expiration and check renewal requirements, as some states require continuing education credits.",
    },
    {
      question: "Is ESCA working toward a national escort certification standard?",
      answer:
        "Yes. The Escort Service Coordinators Association (ESCA) has been actively lobbying for federal recognition of a national certification standard since 2023. Their proposal includes a 40-hour minimum training requirement, standardized equipment specifications, and a national certification database. Several states have begun aligning their programs with ESCA guidelines in anticipation of federal action.",
    },
    {
      question: "How do I verify which certifications a state accepts?",
      answer:
        "Check the state\u2019s DOT website for official reciprocity agreements, or use Haul Command\u2019s Requirements pages for state-specific details. You can also contact the state\u2019s Oversize/Overweight Permit Office directly. ESCA maintains an updated reciprocity matrix for member operators. Always verify before crossing state lines, as agreements can change without notice.",
    },
  ],
};

/* ============================================================
 * REGISTRY
 * ============================================================ */
export const ARTICLE_ENRICHMENTS: Record<string, ArticleEnrichment> = {
  "texas-superload-strategy": texasSuperloadStrategy,
  "escort-reciprocity-guide": escortReciprocityGuide,
};

export function getArticleEnrichment(slug: string): ArticleEnrichment | null {
  return ARTICLE_ENRICHMENTS[slug] ?? null;
}
