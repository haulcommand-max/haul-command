export type StaticToolConcept = {
  slug: string;
  name: string;
  status: string;
  page_url: string | null;
  family: string;
  category: string;
  short_desc: string;
  tier: string;
  coverage_scope: string;
  is_free: boolean;
  requires_login: boolean;
  primary_audience: string;
};

export const STATIC_TOOL_CONCEPTS: StaticToolConcept[] = [
  ["axle-weight-calculator", "Axle Weight Calculator", "load", "load_analysis", "Estimate axle distribution before permit planning."],
  ["bridge-weight", "Bridge Weight Overlay", "route", "route_compliance", "Plan bridge-risk review points for heavy haul routing."],
  ["cb-radio-channel-guide", "CB Radio Channel Guide", "escort", "communications", "Plan convoy radio protocol with jurisdiction-aware cautions."],
  ["certification-timeline", "Certification Timeline", "certification", "training", "Plan credential timing by role and market."],
  ["compliance-card", "Compliance Card", "compliance", "documents", "Build a compliance proof card for broker review."],
  ["compliance-copilot", "Compliance Copilot", "compliance", "documents", "Check documents, requirements, and next compliance actions."],
  ["compliance-sentinel", "Compliance Sentinel", "compliance", "monitoring", "Track compliance risk signals that need review."],
  ["corridor-pricing", "Corridor Pricing", "rates", "pricing", "Compare corridor pricing context and planning variables."],
  ["cost-calculator", "Cost Calculator", "rates", "pricing", "Plan common heavy haul support cost components."],
  ["crc-recorder", "CRC Recorder", "compliance", "documents", "Record communication and compliance checkpoints."],
  ["cross-border", "Cross-Border Planner", "route", "cross_border", "Plan cross-border heavy haul support handoffs."],
  ["discovery-map", "Discovery Map", "data", "market_intelligence", "Explore market coverage and support signals."],
  ["dot-lookup", "DOT Lookup", "compliance", "authority_lookup", "Look up DOT-style carrier authority context where supported."],
  ["escort-calculator", "Escort Cost Calculator", "rates", "pricing", "Estimate escort cost components for a planned move."],
  ["escort-count-calculator", "Escort Count Calculator", "escort", "requirements", "Estimate how many escorts a load may require."],
  ["escort-requirement-checker", "Escort Requirement Checker", "escort", "requirements", "Plan escort requirement checks with authority verification reminders."],
  ["frost-law-tracker", "Frost Law Tracker", "route", "seasonal_limits", "Track frost law and seasonal weight restriction context."],
  ["global-command-map", "Global Command Map", "data", "market_intelligence", "Browse global heavy-haul command signals."],
  ["heavy-haul-index", "Heavy Haul Index", "data", "market_intelligence", "Track market intelligence signals for heavy haul support."],
  ["ifta-calculator", "IFTA Calculator", "rates", "tax", "Plan IFTA fuel-tax context for commercial routes."],
  ["instant-quote", "Instant Quote", "broker", "quotes", "Build a planning quote from move variables."],
  ["load-analyzer", "Load Analyzer", "load", "load_analysis", "Analyze dimensions, support roles, and next planning steps."],
  ["load-dimension-checker", "Load Dimension Checker", "load", "load_analysis", "Check whether a load exceeds common dimension bands."],
  ["load-types", "Load Types", "load", "load_analysis", "Browse heavy-haul load types and support needs."],
  ["oversize-load-checker", "Oversize Load Checker", "load", "requirements", "Check whether a move appears oversize or overweight."],
  ["permit-calculator", "Permit Calculator", "permit", "permit_cost", "Estimate permit planning variables by move type."],
  ["permit-checker", "Permit Complexity Checker", "permit", "requirements", "Check permit complexity and supporting actions."],
  ["permit-cost-calculator", "Permit Cost Calculator", "permit", "permit_cost", "Estimate permit-related cost bands."],
  ["permit-filing", "Permit Filing", "permit", "filing", "Prepare permit filing details and handoff steps."],
  ["permit-sla-tracker", "Permit SLA Tracker", "permit", "monitoring", "Track permit timing and delay risk."],
  ["railroad-profiler", "Railroad Profiler", "infrastructure", "rail", "Profile rail crossing and infrastructure considerations."],
  ["rate-advisor", "Rate Advisor", "rates", "pricing", "Review rate context and support pricing variables."],
  ["rate-lookup", "Rate Lookup", "rates", "pricing", "Look up rate guidance and related planning inputs."],
  ["regulation-alerts", "Regulation Alerts", "route", "monitoring", "Monitor rule-change and restriction alert context."],
  ["route-complexity", "Route Complexity", "route", "route_compliance", "Estimate route complexity and review needs."],
  ["route-iq", "Route IQ", "route", "route_compliance", "Analyze heavy-haul route planning context."],
  ["route-survey", "Route Survey", "route", "survey", "Plan route survey needs and obstruction checks."],
  ["state-requirements", "State Requirements", "escort", "requirements", "Review state-level escort requirement context."],
  ["superload-calculator", "Superload Calculator", "load", "requirements", "Estimate whether a move may require superload handling."],
  ["terminology", "Terminology", "localization", "glossary", "Translate heavy-haul terms into operational language."],
  ["total-trip-cost-calculator", "Total Trip Cost Calculator", "rates", "pricing", "Estimate full trip support cost categories."],
].map(([slug, name, family, category, short_desc]) => ({
  slug,
  name,
  status: "coming_soon",
  page_url: `/tools/${slug}`,
  family,
  category,
  short_desc,
  tier: "fallback",
  coverage_scope: "market_varies",
  is_free: true,
  requires_login: false,
  primary_audience: "operators_brokers",
}));
