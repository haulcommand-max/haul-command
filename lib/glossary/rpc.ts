import { createClient } from "@/utils/supabase/server";
import type {
  GlossaryHubPayload,
  GlossaryTermPayload,
  GlossaryTopicPayload,
  GlossaryCountryPayload,
} from "./types";

/**
 * P0 FIX: All RPCs now gracefully degrade instead of throwing
 * when stored procedures don't exist in the DB yet.
 * 
 * Root cause: `if (error) throw error` was crashing every page
 * that referenced glossary data, triggering the "SYSTEM FAULT"
 * error boundary.
 */

export async function rpcGlossaryHubPayload(): Promise<GlossaryHubPayload> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("glo_glossary_hub_payload");

    if (error) {
      console.warn("[glossary] Hub RPC failed, returning empty payload:", error.message);
      return { terms: [], topics: [], featured: [] } as unknown as GlossaryHubPayload;
    }
    return data as GlossaryHubPayload;
  } catch (e) {
    console.warn("[glossary] Hub RPC threw, returning empty payload:", e);
    return { terms: [], topics: [], featured: [] } as unknown as GlossaryHubPayload;
  }
}

export async function rpcGlossaryTermPayload(params: {
  termSlug: string;
  countryCode?: string | null;
  regionCode?: string | null;
}): Promise<GlossaryTermPayload | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("glo_term_page_payload", {
      p_term_slug: params.termSlug,
      p_country_code: params.countryCode ?? null,
      p_region_code: params.regionCode ?? null,
    });

    if (error) {
      console.warn("[glossary] Term RPC failed:", error.message);
      return null;
    }
    if (!data || !data.term) return null;
    return data as GlossaryTermPayload;
  } catch (e) {
    console.warn("[glossary] Term RPC threw:", e);
    return null;
  }
}

export async function rpcGlossaryTopicPayload(
  topicSlug: string
): Promise<GlossaryTopicPayload | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("glo_topic_page_payload", {
      p_topic_slug: topicSlug,
    });

    if (error) {
      console.warn("[glossary] Topic RPC failed:", error.message);
      return null;
    }
    if (!data || !data.topic) return null;
    return data as GlossaryTopicPayload;
  } catch (e) {
    console.warn("[glossary] Topic RPC threw:", e);
    return null;
  }
}

export async function rpcGlossaryCountryPayload(
  countryCode: string
): Promise<GlossaryCountryPayload | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("glo_country_hub_payload", {
      p_country_code: countryCode,
    });

    if (error) {
      console.warn("[glossary] Country RPC failed:", error.message);
      return null;
    }
    if (!data || !data.country_code) return null;
    return data as GlossaryCountryPayload;
  } catch (e) {
    console.warn("[glossary] Country RPC threw:", e);
    return null;
  }
}
