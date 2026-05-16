import type { Metadata } from "next";

type DirectoryOperatorRecord = Record<string, any>;

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
  const country = firstString(record.country_code, record.country, metadata.country_code, metadata.country);
  if (!name) return { index: false, reason: "missing_name" };
  if (!country) return { index: false, reason: "missing_country" };

  const location = firstString(record.city, record.city_inferred, record.admin1_code, record.state_inferred, metadata.city);
  const services = asArray(record.services).concat(asArray(metadata.services));
  const proof = firstString(record.claim_status, record.verification_status, metadata.claim_status);
  const trustScore = firstNumber(record.trust_score, record.confidence_score, metadata.trust_score);
  const precomputed = getPrecomputedDirectoryOperatorJsonLd(record);

  if (!location && services.length === 0 && !proof && trustScore === 0 && !precomputed) {
    return { index: false, reason: "thin_record" };
  }

  return { index: true, reason: "source_backed_profile" };
}

export function buildDirectoryOperatorJsonLd(record: DirectoryOperatorRecord, canonicalUrl: string) {
  const precomputed = getPrecomputedDirectoryOperatorJsonLd(record);
  if (precomputed) return precomputed;

  const metadata = asRecord(record.metadata);
  const name = getDirectoryOperatorName(record);
  const city = firstString(record.city, record.city_inferred, metadata.city);
  const region = firstString(record.admin1_code, record.state_inferred, record.region_code, metadata.admin1_code, metadata.state);
  const country = firstString(record.country_code, record.country, metadata.country_code, metadata.country);
  const description = firstString(record.description, record.summary, metadata.description, metadata.summary);
  const services = asArray(record.services).concat(asArray(metadata.services));
  const ratingValue = firstNumber(record.rating_avg, metadata.avg_rating, metadata.rating_avg);
  const reviewCount = firstNumber(record.rating_count, metadata.review_count, metadata.rating_count);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": canonicalUrl,
    url: canonicalUrl,
    name,
  };

  if (description) jsonLd.description = description;
  if (services.length > 0) jsonLd.knowsAbout = Array.from(new Set(services));
  if (city || region || country) {
    jsonLd.address = {
      "@type": "PostalAddress",
      ...(city ? { addressLocality: city } : {}),
      ...(region ? { addressRegion: region } : {}),
      ...(country ? { addressCountry: country } : {}),
    };
    jsonLd.areaServed = {
      "@type": "Place",
      name: [city, region, country].filter(Boolean).join(", "),
    };
  }
  if (ratingValue > 0 && reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return jsonLd;
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
