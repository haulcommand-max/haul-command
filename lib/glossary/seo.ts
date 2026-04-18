import type { Metadata } from "next";
import type {
  GlossaryHubPayload,
  GlossaryTermPayload,
  GlossaryTopicPayload,
  GlossaryCountryPayload,
} from "./types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haulcommand.com";

/**
 * DA 97 Hack #4 — 120-Country Hreflang Overlay System
 *
 * Full coverage across all 5 tiers of the Haul Command global operating map.
 * Every country where heavy haul transport exists and HC can legally operate.
 *
 * Tier A — Gold (10)
 * Tier B — Blue (18)
 * Tier C — Silver (26)
 * Tier D — Slate (25)
 * Tier E — Copper (41)
 */

// 120-country → hreflang language-region mapping
const COUNTRY_LANG_MAP: Record<string, string> = {
  // ── Tier A — Gold (10) ──────────────────────────────────────────
  US: "en-US",
  CA: "en-CA",
  AU: "en-AU",
  GB: "en-GB",
  NZ: "en-NZ",
  ZA: "en-ZA",
  DE: "de-DE",
  NL: "nl-NL",
  AE: "ar-AE",
  BR: "pt-BR",

  // ── Tier B — Blue (18) ──────────────────────────────────────────
  IE: "en-IE",
  SE: "sv-SE",
  NO: "nb-NO",
  DK: "da-DK",
  FI: "fi-FI",
  BE: "fr-BE",
  AT: "de-AT",
  CH: "de-CH",
  ES: "es-ES",
  FR: "fr-FR",
  IT: "it-IT",
  PT: "pt-PT",
  SA: "ar-SA",
  QA: "ar-QA",
  MX: "es-MX",
  IN: "en-IN",
  ID: "id-ID",
  TH: "th-TH",

  // ── Tier C — Silver (26) ────────────────────────────────────────
  PL: "pl-PL",
  CZ: "cs-CZ",
  SK: "sk-SK",
  HU: "hu-HU",
  SI: "sl-SI",
  EE: "et-EE",
  LV: "lv-LV",
  LT: "lt-LT",
  HR: "hr-HR",
  RO: "ro-RO",
  BG: "bg-BG",
  GR: "el-GR",
  TR: "tr-TR",
  KW: "ar-KW",
  OM: "ar-OM",
  BH: "ar-BH",
  SG: "en-SG",
  MY: "ms-MY",
  JP: "ja-JP",
  KR: "ko-KR",
  CL: "es-CL",
  AR: "es-AR",
  CO: "es-CO",
  PE: "es-PE",
  VN: "vi-VN",
  PH: "en-PH",

  // ── Tier D — Slate (25) ─────────────────────────────────────────
  UY: "es-UY",
  PA: "es-PA",
  CR: "es-CR",
  IL: "he-IL",
  NG: "en-NG",
  EG: "ar-EG",
  KE: "en-KE",
  MA: "fr-MA",
  RS: "sr-RS",
  UA: "uk-UA",
  KZ: "kk-KZ",
  TW: "zh-TW",
  PK: "ur-PK",
  BD: "bn-BD",
  MN: "mn-MN",
  TT: "en-TT",
  JO: "ar-JO",
  GH: "en-GH",
  TZ: "sw-TZ",
  GE: "ka-GE",
  AZ: "az-AZ",
  CY: "el-CY",
  IS: "is-IS",
  LU: "fr-LU",
  EC: "es-EC",

  // ── Tier E — Copper (41) ────────────────────────────────────────
  BO: "es-BO",
  PY: "es-PY",
  GT: "es-GT",
  DO: "es-DO",
  HN: "es-HN",
  SV: "es-SV",
  NI: "es-NI",
  JM: "en-JM",
  GY: "en-GY",
  SR: "nl-SR",
  BA: "bs-BA",
  ME: "sr-ME",
  MK: "mk-MK",
  AL: "sq-AL",
  MD: "ro-MD",
  IQ: "ar-IQ",
  NA: "en-NA",
  AO: "pt-AO",
  MZ: "pt-MZ",
  ET: "am-ET",
  CI: "fr-CI",
  SN: "fr-SN",
  BW: "en-BW",
  ZM: "en-ZM",
  UG: "en-UG",
  CM: "fr-CM",
  KH: "km-KH",
  LK: "si-LK",
  UZ: "uz-UZ",
  LA: "lo-LA",
  NP: "ne-NP",
  DZ: "ar-DZ",
  TN: "ar-TN",
  MT: "mt-MT",
  BN: "ms-BN",
  RW: "rw-RW",
  MG: "mg-MG",
  PG: "en-PG",
  TM: "tk-TM",
  KG: "ky-KG",
  MW: "en-MW",
};

function buildHreflangAlternates(
  basePath: string,
  countryCodes: string[]
): Metadata["alternates"] {
  const languages: Record<string, string> = {};

  // x-default always points to the canonical term page (no country prefix)
  languages["x-default"] = `${SITE_URL}${basePath}`;

  for (const cc of countryCodes) {
    const lang = COUNTRY_LANG_MAP[cc];
    if (lang) {
      languages[lang] = `${SITE_URL}/glossary/${cc.toLowerCase()}`;
    }
  }

  return {
    canonical: `${SITE_URL}${basePath}`,
    languages,
  };
}

export function glossaryHubMetadata(payload: GlossaryHubPayload): Metadata {
  return {
    title: `Heavy Haul & Pilot Car Glossary | Haul Command`,
    description: `Browse ${payload.counts.total_terms} heavy haul and pilot car terms across ${payload.counts.total_countries} country overlays and ${payload.counts.total_topics} topic clusters.`,
    alternates: {
      canonical: `${SITE_URL}/glossary`,
    },
  };
}

export function glossaryTermMetadata(
  payload: GlossaryTermPayload,
  availableCountryCodes?: string[]
): Metadata {
  const term = payload.term;

  const alternates = availableCountryCodes && availableCountryCodes.length > 0
    ? buildHreflangAlternates(`/glossary/${term.slug}`, availableCountryCodes)
    : {
        canonical: `${SITE_URL}/glossary/${term.slug}`,
      };

  return {
    title: `${term.canonical_term} Meaning | Haul Command Glossary`,
    description:
      term.short_definition ||
      term.plain_english ||
      `Learn what ${term.canonical_term} means in heavy haul and oversize transport.`,
    alternates,
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
  const lang = COUNTRY_LANG_MAP[payload.country_code];

  return {
    title: `${payload.country_code} Heavy Haul Glossary | Haul Command`,
    description: `Country-specific heavy haul glossary terms, overlays, aliases, and related links for ${payload.country_code}.`,
    alternates: {
      canonical: `${SITE_URL}/glossary/${payload.country_code.toLowerCase()}`,
      ...(lang && {
        languages: {
          [lang]: `${SITE_URL}/glossary/${payload.country_code.toLowerCase()}`,
          "x-default": `${SITE_URL}/glossary`,
        },
      }),
    },
  };
}

/**
 * Utility: Get the full 120-country map for use in other modules.
 */
export function getCountryLangMap(): Readonly<Record<string, string>> {
  return COUNTRY_LANG_MAP;
}

/**
 * Utility: Get all 120 supported country codes.
 */
export function getAllSupportedCountryCodes(): string[] {
  return Object.keys(COUNTRY_LANG_MAP);
}
