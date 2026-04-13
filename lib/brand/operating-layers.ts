// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Operating Layer Branding Registry
// Per Master Prompt §5: The brand should love itself.
// Every sticky, monetizable, defensible function carries the
// Haul Command name. This file is the single source of truth
// for internal module → public brand name mapping.
// ══════════════════════════════════════════════════════════════

export interface OperatingLayer {
  /** Internal module key */
  key: string;
  /** Public branded name */
  brand: string;
  /** Short tagline for nav/titles */
  tagline: string;
  /** Route prefix if applicable */
  route?: string;
  /** Command-OS module prefix */
  cmdModule?: string;
}

export const OPERATING_LAYERS: OperatingLayer[] = [
  {
    key: "directory",
    brand: "Haul Command Directory",
    tagline: "The Global Pilot Car & Escort Directory",
    route: "/directory",
    cmdModule: "ent",
  },
  {
    key: "dispatch",
    brand: "Haul Command Dispatch",
    tagline: "Real-Time Assignment & Matching",
    route: "/dispatch",
    cmdModule: "agt",
  },
  {
    key: "route-iq",
    brand: "Haul Command Route IQ",
    tagline: "Intelligent Routing & Restriction Intelligence",
    route: "/tools/route-survey",
    cmdModule: "inf",
  },
  {
    key: "proof",
    brand: "Haul Command Proof",
    tagline: "Trust, Verification & Evidence Wallet",
    route: "/trust",
    cmdModule: "trt",
  },
  {
    key: "pay",
    brand: "Haul Command Pay",
    tagline: "Escrow, QuickPay & Settlement",
    route: "/escrow",
    cmdModule: "mon",
  },
  {
    key: "compliance",
    brand: "Haul Command Compliance",
    tagline: "Forms, Permits & Regulatory Intelligence",
    route: "/compliance-kit",
    cmdModule: "cmp",
  },
  {
    key: "academy",
    brand: "Haul Command Academy",
    tagline: "Certification & Compliance Training",
    route: "/training",
    cmdModule: "cmp",
  },
  {
    key: "adgrid",
    brand: "Haul Command AdGrid",
    tagline: "Premium Geo-Aware Sponsor Engine",
    route: "/advertise",
    cmdModule: "mon",
  },
  {
    key: "intel",
    brand: "Haul Command Intel",
    tagline: "Corridor, Market & Rate Intelligence",
    route: "/intel",
    cmdModule: "seo",
  },
  {
    key: "signals",
    brand: "Haul Command Signals",
    tagline: "Real-Time Market & Demand Alerts",
    route: "/notifications",
    cmdModule: "ntf",
  },
  {
    key: "command-center",
    brand: "Haul Command HQ",
    tagline: "Board-Level Control Plane",
    route: "/hq",
    cmdModule: "cmd",
  },
  {
    key: "marketplace",
    brand: "Haul Command Marketplace",
    tagline: "Equipment, Insurance & Services",
    route: "/partners",
    cmdModule: "inf",
  },
  {
    key: "infrastructure",
    brand: "Haul Command Infrastructure",
    tagline: "Yards, Truck Stops & Route Support",
    route: "/vendors",
    cmdModule: "inf",
  },
  {
    key: "autonomous",
    brand: "Haul Command Autonomous",
    tagline: "AV Escort & Remote Support",
    route: "/autonomous",
    cmdModule: "agt",
  },
];

/**
 * Get the public brand name for an internal module key.
 * Falls back to "Haul Command" if key not found.
 */
export function getBrandName(key: string): string {
  return OPERATING_LAYERS.find((l) => l.key === key)?.brand ?? "Haul Command";
}

/**
 * Get the tagline for a module.
 */
export function getBrandTagline(key: string): string {
  return OPERATING_LAYERS.find((l) => l.key === key)?.tagline ?? "";
}

/**
 * Get all operating layers for navigation rendering.
 */
export function getOperatingLayers(): OperatingLayer[] {
  return OPERATING_LAYERS;
}
