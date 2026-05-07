export type EscPublicPage = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  sections: Array<{
    heading: string;
    body: string;
    bullets: string[];
  }>;
  relatedLinks: Array<{ label: string; href: string }>;
};

export const ESC_RESOURCE_PAGES: Record<string, EscPublicPage> = {
  "pilot-car-safety-library": {
    slug: "pilot-car-safety-library",
    eyebrow: "Safety Library",
    title: "Pilot Car Safety Library",
    description:
      "PEVO equipment, high-pole, insurance, certification, route survey, and pre-trip safety resources wired into Haul Command training, directory, and marketplace workflows.",
    primaryCta: { label: "Check certification reciprocity", href: "/tools/certification-reciprocity-checker" },
    secondaryCta: { label: "Claim your operator profile", href: "/claim" },
    sections: [
      {
        heading: "What this replaces",
        body:
          "Static safety articles are useful, but Haul Command connects each safety topic to verification, profile scoring, operator routing, training, and equipment readiness.",
        bullets: [
          "PEVO and WITPAC source topics become searchable training and requirement records.",
          "Certification facts flow into operator trust, profile proof, and dispatch readiness.",
          "Equipment requirements connect to RouteReady gear bundles and profile attributes.",
        ],
      },
      {
        heading: "Core safety topics",
        body:
          "The library is organized around what brokers, carriers, and operators need to know before a move is dispatched.",
        bullets: [
          "Pilot car setup and minimum equipment.",
          "High pole and bridge-strike prevention.",
          "Insurance, liability, and E&O awareness.",
          "Route survey, radio protocol, pre-trip briefings, and emergency procedure.",
        ],
      },
    ],
    relatedLinks: [
      { label: "PEVO certification", href: "/training/pevo-certification" },
      { label: "WITPAC", href: "/training/witpac" },
      { label: "Equipment checklist", href: "/resources/pilot-car-equipment-checklist" },
      { label: "Find operators", href: "/directory?category=pilot-car" },
    ],
  },
  "pilot-car-equipment-checklist": {
    slug: "pilot-car-equipment-checklist",
    eyebrow: "RouteReady",
    title: "Pilot Car Equipment Checklist",
    description:
      "A practical pilot car and escort vehicle equipment checklist for signs, amber warning lights, radios, high pole equipment, PPE, traffic control, and emergency staging.",
    primaryCta: { label: "Run equipment checker", href: "/tools/pilot-car-equipment-checker" },
    secondaryCta: { label: "Find pilot car operators", href: "/directory?category=pilot-car" },
    sections: [
      {
        heading: "Minimum readiness stack",
        body:
          "Equipment requirements vary by jurisdiction, but every serious operator needs a baseline kit that can survive inspection and real route conditions.",
        bullets: [
          "Oversize load signage and amber warning light or light bar.",
          "CB or two-way radio communication for convoy coordination.",
          "High-visibility PPE, emergency triangles, cones, flags, and STOP/SLOW paddle.",
          "High pole equipment where route clearance or tall loads require it.",
        ],
      },
      {
        heading: "Monetization layer",
        body:
          "Haul Command can turn equipment requirements into RouteReady bundles, sponsor inventory, and profile readiness checks.",
        bullets: [
          "Operators show equipment proof on profiles.",
          "Brokers filter by height pole, signage, radio, and route survey readiness.",
          "Suppliers sponsor equipment-category pages and local markets.",
        ],
      },
    ],
    relatedLinks: [
      { label: "High pole guide", href: "/resources/high-pole-guide" },
      { label: "PEVO safety library", href: "/resources/pilot-car-safety-library" },
      { label: "Claim listing", href: "/claim" },
    ],
  },
  "high-pole-guide": {
    slug: "high-pole-guide",
    eyebrow: "Clearance Safety",
    title: "High Pole Guide for Oversize Loads",
    description:
      "How high pole and height pole operators help prevent bridge strikes, utility conflicts, and overhead clearance failures during oversize load movement.",
    primaryCta: { label: "Find height pole operators", href: "/directory?category=height-pole" },
    secondaryCta: { label: "Take high-pole training", href: "/training/hc-high-pole-mastery" },
    sections: [
      {
        heading: "Why high pole matters",
        body:
          "Certification alone does not prove clearance competence. High pole work requires equipment, disciplined speed, radio communication, route awareness, and a safety margin.",
        bullets: [
          "Use non-conductive pole equipment and verified mounting hardware.",
          "Account for pole flex, road crown, load suspension, and utility sag.",
          "Document route survey hazards and clearance warnings before movement.",
        ],
      },
      {
        heading: "Haul Command upgrade",
        body:
          "High pole capability becomes a profile attribute, dispatch filter, training path, score input, and sponsored equipment category.",
        bullets: [
          "Operators can claim height pole readiness.",
          "Brokers can search by height pole service.",
          "Training and equipment pages link directly into marketplace routing.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Equipment checklist", href: "/resources/pilot-car-equipment-checklist" },
      { label: "Route survey training", href: "/training/hc-route-survey-professional" },
      { label: "Escort requirements", href: "/escort-requirements" },
    ],
  },
  "pilot-car-insurance": {
    slug: "pilot-car-insurance",
    eyebrow: "Risk Proof",
    title: "Pilot Car Insurance and Proof Guide",
    description:
      "Insurance and proof guidance for pilot car operators, including commercial auto, general liability, E&O, occupational accident, and profile verification.",
    primaryCta: { label: "Verify credentials", href: "/tools/pevo-certification-lookup" },
    secondaryCta: { label: "Claim profile", href: "/claim" },
    sections: [
      {
        heading: "Insurance proof matters",
        body:
          "A generic auto policy may not prove pilot car readiness. Brokers and carriers need clear proof state before routing work.",
        bullets: [
          "Commercial auto and general liability should be visible on claimed profiles.",
          "E&O proof matters for route survey, high pole, and bridge-strike exposure.",
          "Expired, self-reported, or missing proof should not render as verified schema.",
        ],
      },
      {
        heading: "How Haul Command uses it",
        body:
          "Insurance proof feeds trust score, profile readiness, broker confidence, and marketplace ranking without pretending certification equals performance.",
        bullets: [
          "Proof status is separated as verified, self-reported, seeded, missing, or expired.",
          "Claim flows ask operators to correct missing insurance and credential facts.",
          "Broker search can prefer verified proof when urgency is high.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Certification lookup", href: "/tools/pevo-certification-lookup" },
      { label: "Safety library", href: "/resources/pilot-car-safety-library" },
      { label: "Operator directory", href: "/directory?category=pilot-car" },
    ],
  },
};

export const ESC_TOOL_PAGES: Record<string, EscPublicPage> = {
  "pevo-certification-lookup": {
    slug: "pevo-certification-lookup",
    eyebrow: "Credential Verification",
    title: "PEVO Certification Lookup",
    description:
      "Verify operator certification signals, expiration status, third-party credentials, and HC-ID proof before routing work.",
    primaryCta: { label: "Open operator directory", href: "/directory?category=pilot-car" },
    secondaryCta: { label: "API route: credentials verify", href: "/api/credentials/verify" },
    sections: [
      {
        heading: "Verification layer",
        body:
          "Haul Command should verify Haul Command-issued training, uploaded third-party certifications, expiration dates, reciprocity, and proof confidence.",
        bullets: [
          "Free public status for basic operator proof.",
          "Broker/carrier verification API for scale.",
          "Profile badges and renewal reminders for operators.",
        ],
      },
      {
        heading: "No fake proof",
        body:
          "If data is missing or self-reported, the UI and schema must say so. Verified status should only appear when proof exists.",
        bullets: [
          "Verified, self-reported, seeded, expired, and missing states remain separate.",
          "Certification affects trust score but does not replace reviews or performance data.",
          "HC-ID identifier links verification to profile, assignment, and claim workflows.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Claim listing", href: "/claim" },
      { label: "Washington PEVO", href: "/training/washington-pilot-car-certification" },
      { label: "WITPAC", href: "/training/witpac" },
    ],
  },
  "certification-reciprocity-checker": {
    slug: "certification-reciprocity-checker",
    eyebrow: "Reciprocity Graph",
    title: "Certification Reciprocity Checker",
    description:
      "Check whether a pilot car, PEVO, WITPAC, or other escort credential issued in one jurisdiction can be used in another.",
    primaryCta: { label: "Browse certification rules", href: "/training/safety-library" },
    secondaryCta: { label: "Find certified operators", href: "/directory?category=pilot-car" },
    sections: [
      {
        heading: "What gets checked",
        body:
          "The reciprocity graph considers credential type, issuing region, target region, validity type, proof requirements, and source freshness.",
        bullets: [
          "Washington PEVO acceptance by state.",
          "WITPAC specialist use for wind and renewable-energy transport.",
          "Conditional markets where state-specific proof or defensive driving may apply.",
        ],
      },
      {
        heading: "Marketplace routing",
        body:
          "Reciprocity is not only content. It should route operators to legal markets and warn brokers when a credential may not cover a move.",
        bullets: [
          "Operator legality cache and dispatch eligibility.",
          "Training upsells for blocked markets.",
          "Revenue unlocks for certified operators entering high-demand corridors.",
        ],
      },
    ],
    relatedLinks: [
      { label: "PEVO lookup", href: "/tools/pevo-certification-lookup" },
      { label: "State certifications", href: "/resources/certification/state-pilot-car-certifications" },
      { label: "Regulations", href: "/regulations" },
    ],
  },
  "pilot-car-equipment-checker": {
    slug: "pilot-car-equipment-checker",
    eyebrow: "RouteReady",
    title: "Pilot Car Equipment Checker",
    description:
      "Compare pilot car equipment against baseline escort vehicle, high-pole, PPE, traffic control, and emergency-readiness requirements.",
    primaryCta: { label: "View checklist", href: "/resources/pilot-car-equipment-checklist" },
    secondaryCta: { label: "Claim equipment readiness", href: "/claim" },
    sections: [
      {
        heading: "Checklist logic",
        body:
          "The checker maps equipment to role, jurisdiction, service category, training, and marketplace readiness.",
        bullets: [
          "Signage, amber lights, radio, high pole, PPE, triangles, cones, flags, and STOP/SLOW paddle.",
          "Jurisdiction overlays should add local requirements where available.",
          "Missing equipment becomes a profile gap and a RouteReady bundle opportunity.",
        ],
      },
      {
        heading: "Supplier monetization",
        body:
          "Equipment requirements create sponsor inventory for suppliers, installers, insurers, and training providers.",
        bullets: [
          "Sponsor high-pole searches and equipment pages.",
          "Bundle gear with training and profile readiness.",
          "Route verified equipment into broker confidence scoring.",
        ],
      },
    ],
    relatedLinks: [
      { label: "High pole guide", href: "/resources/high-pole-guide" },
      { label: "Pilot car insurance", href: "/resources/pilot-car-insurance" },
      { label: "Advertise equipment", href: "/advertise/buy" },
    ],
  },
};

export const ESC_GLOSSARY_PAGES: Record<string, EscPublicPage> = {
  pevo: {
    slug: "pevo",
    eyebrow: "Glossary",
    title: "PEVO",
    description:
      "PEVO means Pilot/Escort Vehicle Operator: a trained operator who provides lead, chase, height-pole, traffic warning, or route-support services for oversize and overweight loads.",
    primaryCta: { label: "PEVO certification", href: "/training/pevo-certification" },
    secondaryCta: { label: "Find PEVO operators", href: "/directory?category=pilot-car" },
    sections: [
      {
        heading: "Plain definition",
        body:
          "A PEVO helps move oversize loads by warning traffic, guiding the load, checking route clearance, coordinating with the driver, and helping the team follow permit conditions.",
        bullets: [
          "Commonly called pilot car operator or escort vehicle operator.",
          "May work lead, chase, height pole, route survey, or traffic-control roles.",
          "Certification, equipment, insurance, and experience should be verified separately.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Safety library", href: "/resources/pilot-car-safety-library" },
      { label: "Certification lookup", href: "/tools/pevo-certification-lookup" },
    ],
  },
  witpac: {
    slug: "witpac",
    eyebrow: "Glossary",
    title: "WITPAC",
    description:
      "WITPAC is a wind transport specialist credential path used to identify operators prepared for wind blade, tower, nacelle, and renewable-energy heavy transport support.",
    primaryCta: { label: "WITPAC training", href: "/training/witpac" },
    secondaryCta: { label: "Find WITPAC operators", href: "/directory?category=pilot-car&credential=witpac" },
    sections: [
      {
        heading: "Why it matters",
        body:
          "Wind jobs often involve long loads, complex route surveys, utility exposure, staging coordination, and high-value route support. WITPAC gives Haul Command a specialist filter for that market.",
        bullets: [
          "Useful for wind blade and renewable-energy corridors.",
          "Should connect to operator profile tags and dispatch routing.",
          "Does not replace proof verification, reviews, or performance scoring.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Reciprocity checker", href: "/tools/certification-reciprocity-checker" },
      { label: "Wind training", href: "/training/witpac" },
    ],
  },
  "high-pole": {
    slug: "high-pole",
    eyebrow: "Glossary",
    title: "High Pole",
    description:
      "A high pole is a non-conductive measuring pole mounted on an escort vehicle to test overhead clearance before a tall oversize load passes.",
    primaryCta: { label: "High pole guide", href: "/resources/high-pole-guide" },
    secondaryCta: { label: "Find height pole operators", href: "/directory?category=height-pole" },
    sections: [
      {
        heading: "Operational role",
        body:
          "The high pole operator travels ahead of the load and warns the convoy about overhead hazards, bridges, utilities, signs, and clearance conflicts.",
        bullets: [
          "Requires disciplined speed and communication.",
          "Equipment proof should be visible on the operator profile.",
          "High pole competence should feed trust and broker confidence scoring.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Equipment checker", href: "/tools/pilot-car-equipment-checker" },
      { label: "High pole training", href: "/training/hc-high-pole-mastery" },
    ],
  },
  "route-survey": {
    slug: "route-survey",
    eyebrow: "Glossary",
    title: "Route Survey",
    description:
      "A route survey documents the planned oversize load route, hazards, turns, utilities, bridges, rail crossings, staging points, and clearance issues before movement.",
    primaryCta: { label: "Route survey training", href: "/training/hc-route-survey-professional" },
    secondaryCta: { label: "Find route survey providers", href: "/directory?category=route-survey" },
    sections: [
      {
        heading: "Why brokers need it",
        body:
          "Route surveys reduce permit risk, bridge-strike risk, utility conflicts, missed turns, and failed movement windows.",
        bullets: [
          "Supports permit planning and pre-trip safety briefings.",
          "Can be attached to profiles and assignments.",
          "Should connect to route intelligence and corridor pages.",
        ],
      },
    ],
    relatedLinks: [
      { label: "Route IQ", href: "/tools/route-iq" },
      { label: "Safety library", href: "/resources/pilot-car-safety-library" },
    ],
  },
  "certification-reciprocity": {
    slug: "certification-reciprocity",
    eyebrow: "Glossary",
    title: "Certification Reciprocity",
    description:
      "Certification reciprocity is the rule graph that determines whether a pilot car or escort credential issued in one jurisdiction is accepted in another.",
    primaryCta: { label: "Check reciprocity", href: "/tools/certification-reciprocity-checker" },
    secondaryCta: { label: "State certification guide", href: "/resources/certification/state-pilot-car-certifications" },
    sections: [
      {
        heading: "Dispatch impact",
        body:
          "Reciprocity affects whether an operator can legally support a move in a state, province, or route market.",
        bullets: [
          "Full, conditional, prohibited, and unknown states must stay separate.",
          "The checker should cite source URLs and last-verified dates.",
          "Blocked operators should receive training and renewal recommendations.",
        ],
      },
    ],
    relatedLinks: [
      { label: "PEVO lookup", href: "/tools/pevo-certification-lookup" },
      { label: "Claim profile", href: "/claim" },
    ],
  },
};

export function getEscResourcePage(slug: string) {
  return ESC_RESOURCE_PAGES[slug] ?? null;
}

export function getEscToolPage(slug: string) {
  return ESC_TOOL_PAGES[slug] ?? null;
}

export function getEscGlossaryPage(slug: string) {
  return ESC_GLOSSARY_PAGES[slug] ?? null;
}
