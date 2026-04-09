import type { Metadata } from "next";
import type {
  GlossaryHubPayload,
  GlossaryTermPayload,
  GlossaryTopicPayload,
  GlossaryCountryPayload,
} from "./types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haulcommand.com";

export function glossaryHubMetadata(payload: GlossaryHubPayload): Metadata {
  return {
    title: `Heavy Haul & Pilot Car Glossary | Haul Command`,
    description: `Browse ${payload.counts.total_terms} heavy haul and pilot car terms across ${payload.counts.total_countries} country overlays and ${payload.counts.total_topics} topic clusters.`,
    alternates: {
      canonical: `${SITE_URL}/glossary`,
    },
  };
}

export function glossaryTermMetadata(payload: GlossaryTermPayload): Metadata {
  const term = payload.term;
  return {
    title: `${term.canonical_term} Meaning | Haul Command Glossary`,
    description:
      term.short_definition ||
      term.plain_english ||
      `Learn what ${term.canonical_term} means in heavy haul and oversize transport.`,
    alternates: {
      canonical: `${SITE_URL}/glossary/${term.slug}`,
    },
  };
}

export function glossaryTopicMetadata(payload: GlossaryTopicPayload): Metadata {
  return {
    title: `${payload.topic.name} Glossary | Haul Command`,
    description:
      payload.topic.description ||
      `Browse ${payload.topic.name} glossary terms for heavy haul and pilot car operations.`,
    alternates: {
      canonical: `${SITE_URL}/glossary/topics/${payload.topic.slug}`,
    },
  };
}

export function glossaryCountryMetadata(payload: GlossaryCountryPayload): Metadata {
  return {
    title: `${payload.country_code} Heavy Haul Glossary | Haul Command`,
    description: `Country-specific heavy haul glossary terms, overlays, aliases, and related links for ${payload.country_code}.`,
    alternates: {
      canonical: `${SITE_URL}/glossary/${payload.country_code.toLowerCase()}`,
    },
  };
}
