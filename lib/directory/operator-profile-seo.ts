import type { Metadata } from "next";

type DirectoryOperatorRecord = Record<string, any>;
export type DirectoryOperatorFaq = { question: string; answer: string };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.haulcommand.com").replace(/\/$/, "");
const PRECOMPUTED_JSON_LD_KEYS = [
  "json_ld",
  "jsonld",
  "schema_json",
  "schema_jsonld",
  "schema_payload",
  "structured_data",
  "schema_org",
];

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function asRecord(value: unknown): DirectoryOperatorRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as DirectoryOperatorRecord) : {};
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function isJsonLdPayload(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record["@context"] === "https://schema.org" || Array.isArray(record["@graph"]);
}

export function getDirectoryOperatorName(record: DirectoryOperatorRecord) {
  return firstString(record.company, record.company_name, record.public_label, record.display_name, record.name);
}

export function getDirectoryOperatorSlug(record: DirectoryOperatorRecord, fallbackId: string) {
  return encodeURIComponent(firstString(record.slug, record.id, record.contact_id, fallbackId));
}

export function buildDirectoryOperatorCanonicalUrl(record: DirectoryOperatorRecord, fallbackId: string) {
  return `${SITE_URL}/directory/dossier/${getDirectoryOperatorSlug(record, fallbackId)}`;
}

export function getDirectoryOperatorServices(record: DirectoryOperatorRecord) {
  const metadata = asRecord(record.metadata);
  return uniqueStrings(asArray(record.services).concat(asArray(metadata.services)));
}

export function getDirectoryOperatorLocation(record: DirectoryOperatorRecord) {
  const metadata = asRecord(record.metadata);
  const city = firstString(record.city, record.city_inferred, metadata.city);
  const region = firstString(record.admin1_code, record.state_inferred, record.region_code, metadata.admin1_code, metadata.state);
  const country = firstString(record.country_code, record.country, metadata.country_code, metadata.country);
  const label = [city, region, country].filter(Boolean).join(", ");
  return { city, region, country, label };
}

export function getDirectoryOperatorClaimStatus(record: DirectoryOperatorRecord) {
  const metadata = asRecord(record.metadata);
  return firstString(record.claim_status, metadata.claim_status, record.claimed_status, metadata.claimed_status) || "unclaimed";
}

export function getDirectoryOperatorVerificationStatus(record: DirectoryOperatorRecord) {
  const metadata = asRecord(record.metadata);
  return firstString(record.verification_status, metadata.verification_status, record.proof_status, metadata.proof_status) || "not_verified";
}

export function getDirectoryOperatorSourceConfidence(record: DirectoryOperatorRecord) {
  const metadata = asRecord(record.metadata);
  const raw = firstString(record.source_confidence, metadata.source_confidence, record.confidence_label, metadata.confidence_label);
  if (raw) return raw;
  const score = firstNumber(record.trust_score, record.confidence_score, metadata.trust_score);
  if (score >= 80) return "high";
  if (score >= 45) return "medium";
  return "limited";
}

export function getPrecomputedDirectoryOperatorJsonLd(record: DirectoryOperatorRecord) {
  const metadata = asRecord(record.metadata);
  for (const key of PRECOMPUTED_JSON_LD_KEYS) {
    if (isJsonLdPayload(record[key])) return record[key] as Record<string, unknown>;
    if (isJsonLdPayload(metadata[key])) return metadata[key] as Record<string, unknown>;
  }
  return null;
}

export function shouldIndexDirectoryOperator(record: DirectoryOperatorRecord) {
  const metadata = asRecord(record.metadata);
  const name = getDirectoryOperatorName(record);
  const { country } = getDirectoryOperatorLocation(record);
  if (!name) return { index: false, reason: "missing_name" };
  if (!country) return { index: false, reason: "missing_country" };

  const location = firstString(record.city, record.city_inferred, record.admin1_code, record.state_inferred, metadata.city);
  const services = getDirectoryOperatorServices(record);
  const proof = firstString(record.claim_status, record.verification_status, metadata.claim_status);
  const trustScore = firstNumber(record.trust_score, record.confidence_score, metadata.trust_score);
  const precomputed = getPrecomputedDirectoryOperatorJsonLd(record);

  if (!location && services.length === 0 && !proof && trustScore === 0 && !precomputed) {
    return { index: false, reason: "thin_record" };
  }

  return { index: true, reason: "source_backed_profile" };
}

export function buildDirectoryOperatorFaqs(record: DirectoryOperatorRecord): DirectoryOperatorFaq[] {
  const name = getDirectoryOperatorName(record);
  const { city, region, country, label } = getDirectoryOperatorLocation(record);
  const services = getDirectoryOperatorServices(record);
  const serviceLabel = services[0]?.replace(/_/g, " ") || "heavy-haul support";
  const claimStatus = getDirectoryOperatorClaimStatus(record).replace(/_/g, " ");
  const verificationStatus = getDirectoryOperatorVerificationStatus(record).replace(/_/g, " ");
  const sourceConfidence = getDirectoryOperatorSourceConfidence(record).replace(/_/g, " ");
  const serviceArea = label || [region, country].filter(Boolean).join(", ") || "its listed service area";

  if (!name) return [];

  return [
    {
      question: `Does ${name} offer ${serviceLabel} near ${city || region || country || "this market"}?`,
      answer: `${name} is listed on Haul Command for ${serviceLabel} support around ${serviceArea}. Availability, equipment fit, schedule, and route requirements should be confirmed before dispatch.`,
    },
    {
      question: `Is ${name} claimed or verified on Haul Command?`,
      answer: `${name} is currently marked as ${claimStatus}, with verification status listed as ${verificationStatus}. Haul Command separates claim status, verification status, proof signals, and source confidence so brokers and carriers can understand what has and has not been confirmed.`,
    },
    {
      question: `What should I check before requesting support from ${name}?`,
      answer: `Before requesting support, review service areas, listed capabilities, proof status, source confidence, and recent update signals. For regulated moves, confirm permit, escort, credential, and route requirements with the appropriate authority or qualified provider.`,
    },
    {
      question: `Can brokers request urgent coverage from this profile?`,
      answer: `Brokers can start a support request from this profile. If ${name} cannot be confirmed for the move, Haul Command can route the request into matching, directory, and demand-capture workflows instead of ending at a dead profile.`,
    },
    {
      question: `How can ${name} update this profile?`,
      answer: `${name} can claim the profile to update service areas, equipment, proof assets, contact options, and availability. Haul Command may review updates before showing them publicly.`,
    },
    {
      question: `How do I report incorrect information about ${name}?`,
      answer: `Use the report or correction action on the profile to flag outdated, private, duplicate, or inaccurate information. Haul Command uses correction signals to improve public trust without exposing private data.`,
    },
    {
      question: `What is the source confidence for this profile?`,
      answer: `This profile currently shows ${sourceConfidence} source confidence. Limited-confidence records remain useful for discovery and correction, but should be verified before dispatch or public claims are treated as complete.`,
    },
  ];
}

export function buildDirectoryOperatorJsonLd(
  record: DirectoryOperatorRecord,
  canonicalUrl: string,
  options: { includeFaq?: boolean; faqs?: DirectoryOperatorFaq[] } = {},
) {
  const precomputed = getPrecomputedDirectoryOperatorJsonLd(record);
  if (precomputed) return precomputed;

  const metadata = asRecord(record.metadata);
  const name = getDirectoryOperatorName(record);
  const { city, region, country } = getDirectoryOperatorLocation(record);
  const description = firstString(record.description, record.summary, metadata.description, metadata.summary);
  const services = getDirectoryOperatorServices(record);
  const ratingValue = firstNumber(record.rating_avg, metadata.avg_rating, metadata.rating_avg);
  const reviewCount = firstNumber(record.rating_count, metadata.review_count, metadata.rating_count);
  const serviceType = services[0]?.replace(/_/g, " ") || "Heavy-haul support";
  const faqs = options.faqs ?? buildDirectoryOperatorFaqs(record);

  const businessJsonLd: Record<string, unknown> = {
    "@type": ["Organization", "LocalBusiness", "ProfessionalService"],
    "@id": `${canonicalUrl}#business`,
    url: canonicalUrl,
    name,
    serviceType,
  };

  if (description) businessJsonLd.description = description;
  if (services.length > 0) businessJsonLd.knowsAbout = services;
  if (city || region || country) {
    businessJsonLd.address = {
      "@type": "PostalAddress",
      ...(city ? { addressLocality: city } : {}),
      ...(region ? { addressRegion: region } : {}),
      ...(country ? { addressCountry: country } : {}),
    };
    businessJsonLd.areaServed = {
      "@type": "Place",
      name: [city, region, country].filter(Boolean).join(", "),
    };
  }
  if (ratingValue > 0 && reviewCount > 0) {
    businessJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#profile`,
      url: canonicalUrl,
      name: `${name} | Haul Command profile`,
      about: { "@id": `${canonicalUrl}#business` },
      isPartOf: { "@type": "WebSite", name: "Haul Command", url: SITE_URL },
    },
    businessJsonLd,
    {
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Directory", item: `${SITE_URL}/directory` },
        { "@type": "ListItem", position: 3, name, item: canonicalUrl },
      ],
    },
  ];

  if (options.includeFaq && faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonicalUrl}#faq`,
      url: canonicalUrl,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function buildDirectoryOperatorMetadata(record: DirectoryOperatorRecord | null, fallbackId: string): Metadata {
  if (!record) {
    return {
      title: "Operator Not Found | Haul Command",
      robots: { index: false, follow: true },
      alternates: { canonical: `${SITE_URL}/directory` },
    };
  }

  const name = getDirectoryOperatorName(record) || "Directory Operator";
  const city = firstString(record.city, record.city_inferred);
  const region = firstString(record.admin1_code, record.state_inferred, record.region_code, record.country_code, record.country);
  const location = [city, region].filter(Boolean).join(", ") || "heavy-haul markets";
  const canonical = buildDirectoryOperatorCanonicalUrl(record, fallbackId);
  const gate = shouldIndexDirectoryOperator(record);

  return {
    title: `${name} | Directory Profile | Haul Command`,
    description: `View source-backed profile details, trust signals, service coverage, and request paths for ${name} in ${location}.`,
    alternates: { canonical },
    robots: {
      index: gate.index,
      follow: true,
      googleBot: {
        index: gate.index,
        follow: true,
      },
    },
    openGraph: {
      title: `${name} | Haul Command Directory`,
      description: `Directory profile for ${name} in ${location}.`,
      url: canonical,
      type: "website",
    },
  };
}
