import type { Metadata } from "next";

import { createPublicClient } from "@/lib/supabase/server";
import { getGlobalHreflangTags } from "@/lib/seo/hreflang";
import type { Json } from "@/types/supabase";

export type DbPageSeoContract = {
  canonical_url: string;
  page_type: string;
  route_family: string | null;
  title: string;
  meta_description: string | null;
  h1: string;
  intro_copy: string | null;
  structured_data_json: Json | null;
  robots_directive: string;
};

function normalizePath(path: string) {
  if (!path) return "/";
  try {
    const url = new URL(path);
    return url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "");
  } catch {
    const withSlash = path.startsWith("/") ? path : `/${path}`;
    return withSlash === "/" ? "/" : withSlash.replace(/\/$/, "");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

let didWarnSeoContractLookup = false;

function isOptionalLookupFailure(error: { message?: string; code?: string } | null | undefined) {
  const message = String(error?.message ?? "").toLowerCase();
  return (
    message.includes("invalid api key") ||
    message.includes("jwt") ||
    message.includes("fetch failed") ||
    message.includes("permission denied") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

function warnSeoContractOnce(message: string, detail?: unknown) {
  if (didWarnSeoContractLookup) return;
  didWarnSeoContractLookup = true;
  if (detail) {
    console.warn(message, detail);
  } else {
    console.warn(message);
  }
}

export function normalizeStructuredData(value: Json | null): Record<string, unknown> | Record<string, unknown>[] | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeStructuredData(parsed as Json);
    } catch {
      return null;
    }
  }
  if (Array.isArray(value)) {
    const entries = value.filter(isRecord);
    return entries.length > 0 ? entries : null;
  }
  return isRecord(value) ? value : null;
}

export async function getPageSeoContract(path: string): Promise<DbPageSeoContract | null> {
  const normalizedPath = normalizePath(path);
  const canonicalUrl = `https://www.haulcommand.com${normalizedPath === "/" ? "" : normalizedPath}`;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("hc_page_seo_contracts")
      .select("canonical_url,page_type,route_family,title,meta_description,h1,intro_copy,structured_data_json,robots_directive")
      .in("canonical_url", [canonicalUrl, `${canonicalUrl}/`, normalizedPath])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (!isOptionalLookupFailure(error)) {
        warnSeoContractOnce("[seo-contract] lookup failed:", error.message);
      }
      return null;
    }

    return (data as DbPageSeoContract | null) ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("fetch failed")) {
      warnSeoContractOnce("[seo-contract] lookup threw:", error);
    }
    return null;
  }
}

export function metadataFromDbPageSeoContract(contract: DbPageSeoContract, canonicalPath: string): Metadata {
  const normalizedPath = normalizePath(canonicalPath);
  const canonical = contract.canonical_url || `https://www.haulcommand.com${normalizedPath}`;
  const shouldIndex = !String(contract.robots_directive || "").toLowerCase().includes("noindex");

  return {
    title: contract.title,
    description: contract.meta_description ?? contract.intro_copy ?? undefined,
    alternates: {
      canonical,
      languages: getGlobalHreflangTags(normalizedPath),
    },
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: contract.title,
      description: contract.meta_description ?? contract.intro_copy ?? undefined,
      url: canonical,
      siteName: "Haul Command",
      type: "website",
    },
  };
}
