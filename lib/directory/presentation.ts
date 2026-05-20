import { COUNTRY_REGISTRY, getCountry } from "@/lib/config/country-registry";
import { definePageSeoContract, type PageSeoContract } from "@/lib/seo/page-seo-contract";

export type DirectoryRecordLike = {
  entity_family?: string | null;
  entity_type?: string | null;
  entity_subtype?: string | null;
  role_primary?: string | null;
  verification_status?: string | null;
  claim_status?: string | null;
  availability_status?: string | null;
  phone?: string | null;
  phone_number?: string | null;
  phone_e164?: string | null;
  phone_raw?: string | null;
  email?: string | null;
  website?: string | null;
  service_area?: string | null;
  city?: string | null;
  city_inferred?: string | null;
  state?: string | null;
  state_inferred?: string | null;
  equipment_types?: string[] | string | null;
  service_categories?: string[] | string | null;
};

export type DirectoryProofState = {
  label: string;
  description: string;
  strength: 0 | 1 | 2 | 3 | 4 | 5;
};

export type DirectoryIntentLane = {
  label: string;
  body: string;
  href: string;
};

export type DirectoryCountryPageContract = {
  countryCode: string;
  displayName: string;
  subRegions: string[];
  noIndex: boolean;
  sourceBasis: string;
};

export type DirectoryMarketSeoInput = {
  countryCode: string;
  marketName: string;
  slug: string;
  recordCount: number;
  noIndexWhenEmpty?: boolean;
  marketKind?: "country" | "region" | "metro" | "city";
};

const COUNTRY_DIRECTORY_CONTRACTS: Record<string, Omit<DirectoryCountryPageContract, "countryCode">> = {
  us: {
    displayName: "United States",
    subRegions: ["Texas", "Florida", "California", "Oklahoma", "Louisiana"],
    noIndex: false,
    sourceBasis: "Static U.S. seed regions are present in the current directory country route.",
  },
};

const ENTITY_LABELS: Record<string, string> = {
  operator: "Operator",
  infrastructure: "Infrastructure",
  authority: "Permit / Compliance",
  compliance: "Permit / Compliance",
  broker: "Broker",
  carrier: "Carrier",
  supplier: "Supplier",
  route_support: "Route Support",
  support: "Route Support",
};

const SUBTYPE_LABELS: Record<string, string> = {
  truck_parking: "Infrastructure",
  staging_yard: "Infrastructure",
  industrial_yard: "Infrastructure",
  mobile_truck_repair: "Infrastructure",
  repair_shop: "Infrastructure",
  pilot_car_permits: "Permit / Compliance",
  freight_broker: "Broker",
  heavy_haul_carrier: "Carrier",
  carrier: "Carrier",
  pilot_car_operator: "Operator",
  escort_operator: "Operator",
};

function normalizeValue(value?: string | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function hasContactSignal(record: DirectoryRecordLike): boolean {
  return Boolean(record.phone || record.phone_number || record.phone_e164 || record.phone_raw || record.email || record.website);
}

function toAttributeList(value?: string[] | string | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function humanize(value?: string | null): string {
  const cleaned = String(value ?? "").replace(/[_-]+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getDirectoryEntityLabel(record: DirectoryRecordLike): string {
  const subtype = normalizeValue(record.entity_subtype);
  const family = normalizeValue(record.entity_family || record.entity_type);
  return SUBTYPE_LABELS[subtype] ?? ENTITY_LABELS[family] ?? "Support Record";
}

export function getDirectoryProofState(record: DirectoryRecordLike): DirectoryProofState {
  const verification = normalizeValue(record.verification_status);
  const claim = normalizeValue(record.claim_status);

  if (verification.includes("performance")) {
    return {
      label: "Performance Verified",
      description: "Verified job or performance evidence is attached.",
      strength: 5,
    };
  }

  if (verification.includes("document") || verification.includes("verified")) {
    return {
      label: "Document Verified",
      description: "Verification evidence exists for this record.",
      strength: 4,
    };
  }

  if (claim === "claimed" || claim === "approved") {
    return {
      label: "Claimed",
      description: "The profile has an owner or managed claim path.",
      strength: 3,
    };
  }

  if (verification.includes("contact") || hasContactSignal(record)) {
    return {
      label: "Contact Confirmed",
      description: "A phone, site, or contact path is present.",
      strength: 2,
    };
  }

  if (claim === "unclaimed" || claim === "claimable" || claim === "pending") {
    return {
      label: "Claimable",
      description: "This indexed record can be claimed or improved.",
      strength: 1,
    };
  }

  return {
    label: "Indexed",
    description: "The support record is indexed for discovery.",
    strength: 0,
  };
}

export function getDirectorySupportAttributes(record: DirectoryRecordLike): string[] {
  const attributes = [
    humanize(record.availability_status),
    humanize(record.service_area),
    humanize(record.role_primary),
    ...toAttributeList(record.equipment_types).map(humanize),
    ...toAttributeList(record.service_categories).map(humanize),
  ].filter(Boolean);

  return [...new Set(attributes)].slice(0, 4);
}

export function buildDirectoryIntentLanes(countryCode?: string | null): DirectoryIntentLane[] {
  const country = String(countryCode || "GLOBAL").toUpperCase();
  const countryQuery = country === "GLOBAL" ? "" : `?country=${encodeURIComponent(country)}`;
  const withCountry = (href: string) => {
    const separator = href.includes("?") ? "&" : "?";
    return country === "GLOBAL" ? href : `${href}${separator}country=${encodeURIComponent(country)}`;
  };

  return [
    {
      label: "Need load support",
      body: "Build a support packet for escorts, parking, permits, repair, and route needs.",
      href: withCountry("/load-board/post"),
    },
    {
      label: "Claim profile",
      body: "Take ownership of an indexed company, service, or support profile.",
      href: withCountry("/claim"),
    },
    {
      label: "Research market",
      body: "Scan support density, claimability, and route-support categories before outreach.",
      href: withCountry("/data?intent=market-density"),
    },
    {
      label: "Provide support",
      body: "Join the graph as an operator, infrastructure partner, permit service, or supplier.",
      href: withCountry("/claim?intent=provider-onboarding"),
    },
  ];
}

export function buildDirectoryCountryPageContract(countryCode?: string | null): DirectoryCountryPageContract {
  const normalizedCountry = String(countryCode || "us").trim().toLowerCase() || "us";
  const contract = COUNTRY_DIRECTORY_CONTRACTS[normalizedCountry];
  const registryCountry = getCountry(normalizedCountry.toUpperCase());

  if (contract) {
    return {
      countryCode: normalizedCountry,
      ...contract,
    };
  }

  if (registryCountry) {
    return {
      countryCode: normalizedCountry,
      displayName: registryCountry.name,
      subRegions: registryCountry.topMetros,
      noIndex: true,
      sourceBasis: `${registryCountry.name} is present in the country registry, but this directory country page remains source-review until live supply and region evidence are attached.`,
    };
  }

  return {
    countryCode: normalizedCountry,
    displayName: normalizedCountry.toUpperCase(),
    subRegions: [],
    noIndex: true,
    sourceBasis: "No source-backed region list is wired for this country directory page yet.",
  };
}

export function buildDirectoryCountrySeoContract(countryCode?: string | null): PageSeoContract {
  const country = buildDirectoryCountryPageContract(countryCode);
  const countryUpper = country.countryCode.toUpperCase();

  return definePageSeoContract({
    path: `/directory/${country.countryCode}`,
    pageType: "directory_country",
    title: `${country.displayName} Pilot Car Directory & Heavy Haul Support | Haul Command`,
    metaDescription: `Find source-reviewed heavy haul support, claimable records, regulations, and route-support actions for ${country.displayName}.`,
    canonicalPath: `/directory/${country.countryCode}`,
    robots: country.noIndex ? "noindex" : "index",
    h1: `${country.displayName} Heavy Haul Network`,
    eyebrow: "Country directory",
    visibleIntro: `Find heavy haul support records, route planning tools, source-backed regulation paths, and claimable provider profiles for ${country.displayName}.`,
    quickAnswer: country.noIndex
      ? `${country.displayName} is in source review, so the page stays followable but noindex until live supply evidence is attached.`
      : `${country.displayName} has source-backed directory regions and operational support paths.`,
    h2Outline: ["Operating regions", "Support records", "Regulation paths", "Claim and correction actions"],
    faqQuestions: [
      `How do I find heavy haul support in ${country.displayName}?`,
      `Can I claim or correct a ${country.displayName} directory record?`,
    ],
    schemaTypes: ["CollectionPage", "ItemList", "BreadcrumbList"],
    primaryKeyword: `${country.displayName} pilot car directory`,
    secondaryKeywords: [
      `${country.displayName} heavy haul support`,
      `${country.displayName} escort network`,
      `${country.displayName} oversize load services`,
    ],
    entityTerms: ["pilot car operators", "permit support", "truck parking", "route survey", "heavy haul corridors"],
    country: countryUpper,
    internalLinkSlots: [
      { label: "Global directory", href: "/directory", reason: "Directory root", pageFamily: "directory_hub" },
      { label: "Country regulations", href: `/regulations/${country.countryCode}`, reason: "Regulation context", pageFamily: "regulation" },
      { label: "Post a support load", href: `/load-board/post?country=${countryUpper}`, reason: "Demand capture", pageFamily: "load_board" },
      { label: "Heavy haul tools", href: `/tools?country=${countryUpper}`, reason: "Action path", pageFamily: "tools_hub" },
    ],
    conversionCtas: [
      { label: "Search directory", href: `/directory?country=${countryUpper}`, intent: "find_provider", primary: true },
      { label: "Claim or correct a profile", href: `/claim?country=${countryUpper}&source=directory-country`, intent: "claim_profile" },
      { label: "Build support packet", href: `/load-board/post?country=${countryUpper}&intent=country-support`, intent: "post_load" },
    ],
    sourceBasis: country.sourceBasis,
    updateFrequency: country.noIndex ? "weekly" : "daily",
    qualityStatus: country.noIndex ? "source_review_needed" : "indexable",
    linkMagnetModules: ["citation_block", "source_pack", "data_preview"],
  });
}

export function buildDirectoryMarketSeoContract(input: DirectoryMarketSeoInput): PageSeoContract {
  const countryUpper = input.countryCode.toUpperCase();
  const countryLower = input.countryCode.toLowerCase();
  const marketKind = input.marketKind ?? "city";
  const shouldNoIndex = Boolean(input.noIndexWhenEmpty && input.recordCount === 0);

  return definePageSeoContract({
    path: `/directory/${countryLower}/${input.slug}`,
    pageType: marketKind === "region" ? "directory_region" : "directory_city",
    title: `Pilot Car & Escort Services in ${input.marketName} | Haul Command`,
    metaDescription: `Find pilot car, escort vehicle, and heavy haul support records in ${input.marketName}, ${countryUpper}. Compare proof states, claim status, contact paths, and support-packet actions without fake availability claims.`,
    canonicalPath: `/directory/${countryLower}/${input.slug}`,
    robots: shouldNoIndex ? "noindex" : "index",
    h1: `Pilot Car Services in ${input.marketName}`,
    eyebrow: `${countryUpper} ${marketKind} directory`,
    visibleIntro: input.recordCount > 0
      ? `${input.recordCount} indexed support records serving the ${input.marketName} area.`
      : `Submit or claim a support record for ${input.marketName} so the market can mature without fake supply.`,
    quickAnswer: shouldNoIndex
      ? `${input.marketName} is followable but noindex until source-backed records are present.`
      : `${input.marketName} has indexed support records with proof, claim, and contact-request paths.`,
    h2Outline: ["Support records", "Proof and claim state", "Post a support request", "Corrections"],
    faqQuestions: [
      `How do I find pilot cars in ${input.marketName}?`,
      `Can I claim a ${input.marketName} directory record?`,
    ],
    schemaTypes: ["CollectionPage", "ItemList", "LocalBusiness"],
    primaryKeyword: `${input.marketName} pilot car services`,
    secondaryKeywords: [`${input.marketName} escort vehicles`, `${input.marketName} heavy haul support`],
    entityTerms: ["pilot cars", "escort vehicles", "route support", "claimable profiles"],
    country: countryUpper,
    city: marketKind === "city" || marketKind === "metro" ? input.marketName : undefined,
    region: marketKind === "region" ? input.marketName : undefined,
    internalLinkSlots: [
      { label: `${countryUpper} directory`, href: `/directory/${countryLower}`, reason: "Country rollup", pageFamily: "directory_country" },
      { label: "Post a load", href: `/load-board/post?country=${countryUpper}&market=${encodeURIComponent(input.slug)}`, reason: "Demand capture", pageFamily: "load_board" },
      { label: "Claim profile", href: `/claim?country=${countryUpper}&market=${encodeURIComponent(input.slug)}`, reason: "Claim path", pageFamily: "profile" },
    ],
    conversionCtas: [
      { label: "Request support", href: `/load-board/post?country=${countryUpper}&market=${encodeURIComponent(input.slug)}`, intent: "request_support", primary: true },
      { label: "Claim or correct listing", href: `/claim?country=${countryUpper}&market=${encodeURIComponent(input.slug)}`, intent: "claim_profile" },
    ],
    sourceBasis: input.recordCount > 0
      ? `Directory surface queries returned ${input.recordCount} source-backed records for this market.`
      : "No source-backed directory records are currently attached to this market route.",
    updateFrequency: input.recordCount > 0 ? "daily" : "weekly",
    qualityStatus: shouldNoIndex ? "source_review_needed" : "indexable",
    linkMagnetModules: ["citation_block", "source_pack"],
  });
}

export function buildDirectoryCountryStaticParams() {
  return COUNTRY_REGISTRY.map((country) => ({
    country: country.code.toLowerCase(),
  }));
}
