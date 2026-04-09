import type { Metadata } from "next";
import type { TrainingPagePayload, TrainingCountryPayload } from "./types";
import { HC_PUBLISHER, HC_AUTHOR } from "@/lib/glossary/eeat";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haulcommand.com";

export function trainingHubMetadata(): Metadata {
  return {
    title: "Heavy Haul Training & Certification | Haul Command",
    description:
      "Professional pilot car, escort vehicle, and heavy haul training programs. Earn credentials, improve your directory ranking, and meet jurisdiction requirements across 120 countries.",
    alternates: {
      canonical: `${SITE_URL}/training`,
    },
  };
}

export function trainingPageMetadata(payload: TrainingPagePayload): Metadata {
  const t = payload.training;
  return {
    title: `${t.title} | Haul Command Training`,
    description:
      t.summary ||
      `${t.title} training program — ${t.module_count} modules, ${t.hours_total} hours.`,
    alternates: {
      canonical: `${SITE_URL}/training/${t.slug}`,
    },
  };
}

export function trainingCountryMetadata(payload: TrainingCountryPayload): Metadata {
  return {
    title: `${payload.country_code} Training Programs | Haul Command`,
    description: `Training programs applicable to heavy haul and pilot car operations in ${payload.country_code}.`,
    alternates: {
      canonical: `${SITE_URL}/training/countries/${payload.country_code.toLowerCase()}`,
    },
  };
}

export function buildTrainingPageSchema(payload: TrainingPagePayload) {
  const t = payload.training;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: t.title,
    description: t.summary,
    url: `${SITE_URL}/training/${t.slug}`,
    provider: HC_PUBLISHER,
    instructor: HC_AUTHOR,
    numberOfCredits: t.hours_total,
    hasCourseInstance: payload.modules.map((m) => ({
      "@type": "CourseInstance",
      name: m.title,
      description: m.summary,
    })),
    ...(t.pricing_json && {
      offers: {
        "@type": "Offer",
        category: t.pricing_mode,
      },
    }),
    educationalCredentialAwarded: payload.levels.map((l) => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: l.level_name,
      name: l.level_name,
    })),
  };
}
