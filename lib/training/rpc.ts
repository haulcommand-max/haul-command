import { createClient } from "@/utils/supabase/server";
import type {
  TrainingHubPayload,
  TrainingPagePayload,
  TrainingCountryPayload,
} from "./types";

export async function rpcTrainingHubPayload(): Promise<TrainingHubPayload> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("training_hub_payload");
  if (error) throw error;
  return data as TrainingHubPayload;
}

export async function rpcTrainingPagePayload(params: {
  slug: string;
  countryCode?: string | null;
  regionCode?: string | null;
}): Promise<TrainingPagePayload | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("training_page_payload", {
    p_slug: params.slug,
    p_country_code: params.countryCode ?? null,
    p_region_code: params.regionCode ?? null,
  });
  if (error) throw error;
  if (!data || !data.training) return null;
  return data as TrainingPagePayload;
}

export async function rpcTrainingCountryPayload(
  countryCode: string
): Promise<TrainingCountryPayload | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("training_country_payload", {
    p_country_code: countryCode,
  });
  if (error) throw error;
  if (!data) return null;
  return data as TrainingCountryPayload;
}
