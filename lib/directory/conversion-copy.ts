export type DirectoryProofCopyInput = {
  proofLabel: string;
  proofStrength: number;
  isClaimed: boolean;
  hasContactSignal: boolean;
};

export type DirectoryCardCopy = {
  proofLine: string;
  profileCta: string;
  packetCta: string;
  claimCta: string;
  sourceConfidenceLabel: string;
};

export const directoryConversionCopy = {
  answerEyebrow: "Proof-backed support, not a stale phone list",
  answerHeadline: "Find heavy-haul support without gambling the load on a blind call",
  answerSummary:
    "Haul Command turns scattered pilot car, escort, permit, route survey, yard, repair, broker, carrier, and field-support records into a proof-labeled action system. Buyers can build a support packet; providers can claim the profile that brokers already use to compare them.",
  answerBody:
    "The directory is intentionally conservative: a listed record is not the same as a verified operator, live availability, or proof-backed performance. Every view should push the user toward the next real action: request support, inspect proof, claim the record, correct bad data, or sponsor a market gap.",
  roleEyebrow: "Route pressure becomes a decision path",
  roleHeadline: "Stop guessing who can actually support the move",
  roleBody:
    "Start with the load problem: route, deadline, service type, and market. Haul Command surfaces claim paths, contact signals, proof state, and next actions so brokers do not waste the critical hour calling stale listings and providers do not stay invisible in markets they already serve.",
  sponsorHeadline: "Own the support moment before the buyer chooses a fallback",
  sponsorBody:
    "Directory sponsorship belongs beside real search intent: market gaps, urgent support, route planning, and role-specific comparison. Paid placement is labeled and cannot manufacture verification, availability, or rank.",
  linkGraphHeadline: "Move from search to proof, rules, tools, and action",
  trustRule:
    "Haul Command separates indexed, claimable, contact-confirmed, document-verified, and performance-backed records. Strong copy must follow the evidence: no fake live coverage, no fake reviews, and no fake verification.",
};

export const directorySearchPromiseCopy = [
  {
    label: "Find support before the load stalls",
    body: "Search pilot cars, escorts, permits, route survey, yards, repair, equipment, brokers, carriers, and project-cargo specialists by the role and market pressure that matters.",
  },
  {
    label: "See thin markets clearly",
    body: "Sparse country, state, province, city, and corridor views show request, claim, correction, and sponsor paths instead of pretending coverage exists.",
  },
  {
    label: "Read the proof before you trust it",
    body: "Every listing is labeled by evidence state so a broker knows whether they are looking at an indexed lead, a claimable profile, a contact path, or stronger proof.",
  },
  {
    label: "Turn comparison into action",
    body: "Request support, build a move packet, claim the profile, fix the record, check requirements, or sponsor the exact gap buyers are searching.",
  },
];

export function buildDirectoryCardCopy(input: DirectoryProofCopyInput): DirectoryCardCopy {
  const label = input.proofLabel.toLowerCase();

  if (input.proofStrength >= 4) {
    return {
      proofLine:
        "Stronger proof signal. Review service area, equipment, and route fit before you commit the move.",
      profileCta: "Inspect proof",
      packetCta: "Build fit packet",
      claimCta: input.isClaimed ? "Update proof" : "Claim proof lane",
      sourceConfidenceLabel: "high",
    };
  }

  if (input.isClaimed || label.includes("claimed")) {
    return {
      proofLine:
        "Owned profile. Keep service areas, equipment, and proof fresh so brokers do not compare you from stale data.",
      profileCta: "View profile",
      packetCta: "Request fit check",
      claimCta: "Improve profile",
      sourceConfidenceLabel: "managed",
    };
  }

  if (input.hasContactSignal || label.includes("contact")) {
    return {
      proofLine:
        "Contact path exists. Confirm equipment, route fit, timing, and proof before dispatch.",
      profileCta: "Check details",
      packetCta: "Request support",
      claimCta: "Claim and control it",
      sourceConfidenceLabel: "medium",
    };
  }

  if (label.includes("claim")) {
    return {
      proofLine:
        "Unclaimed profile. If this is your company, claim it before the next broker compares you from incomplete data.",
      profileCta: "Review record",
      packetCta: "Build backup plan",
      claimCta: "Claim and correct",
      sourceConfidenceLabel: "claim needed",
    };
  }

  return {
    proofLine:
      "Indexed lead only. Do not dispatch blind; request support, claim the record, or correct the market data.",
    profileCta: "Inspect record",
    packetCta: "Request backup",
    claimCta: "Claim or correct",
    sourceConfidenceLabel: "review needed",
  };
}

export function buildEmptyMarketConversionCopy(locationName: string, hasDataIssue: boolean) {
  if (hasDataIssue) {
    return {
      label: "DATA",
      headline: "Directory records are temporarily unavailable",
      body:
        "This is a data-read issue, not a market verdict. Refresh the source connection before treating this search as empty.",
      primaryCta: "Request route support",
      claimCta: "Claim your profile",
      sponsorCta: "Sponsor this gap",
      footnote: "",
    };
  }

  return {
    label: "GAP",
    headline: `No source-backed supply strong enough to show in ${locationName}`,
    body:
      "That is not a dead end. Post the need, claim the missing profile, suggest a provider, or sponsor the gap so the next broker has a clearer path.",
    primaryCta: "Post the support need",
    claimCta: "Claim the missing profile",
    sponsorCta: "Sponsor this market gap",
    footnote:
      "Thin markets are labeled honestly. Haul Command will not pretend local coverage exists until source-backed records, claims, or request activity support it.",
  };
}
