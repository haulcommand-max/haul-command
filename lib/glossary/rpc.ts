import { createClient } from "@/utils/supabase/server";
import type {
  GlossaryHubPayload,
  GlossaryTermPayload,
  GlossaryTopicPayload,
  GlossaryCountryPayload,
} from "./types";

export async function rpcGlossaryHubPayload(): Promise<GlossaryHubPayload> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("glo_glossary_hub_payload");

  if (error) throw error;
  return data as GlossaryHubPayload;
}

export async function rpcGlossaryTermPayload(params: {
  termSlug: string;
  countryCode?: string | null;
  regionCode?: string | null;
}): Promise<GlossaryTermPayload | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("glo_term_page_payload", {
    p_term_slug: params.termSlug,
    p_country_code: params.countryCode ?? null,
    p_region_code: params.regionCode ?? null,
  });

  if (error) throw error;
  if (!data || !data.term) return null;

  return data as GlossaryTermPayload;
}

export async function rpcGlossaryTopicPayload(
  topicSlug: string
): Promise<GlossaryTopicPayload | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("glo_topic_page_payload", {
    p_topic_slug: topicSlug,
  });

  if (error) throw error;
  if (!data || !data.topic) return null;

  return data as GlossaryTopicPayload;
}

export async function rpcGlossaryCountryPayload(
  countryCode: string
): Promise<GlossaryCountryPayload | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("glo_country_hub_payload", {
    p_country_code: countryCode,
  });

  if (error) throw error;
  if (!data || !data.country_code) return null;

  return data as GlossaryCountryPayload;
}
