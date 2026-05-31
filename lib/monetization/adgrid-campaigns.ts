import type { getSupabaseAdmin } from "@/lib/supabase/admin";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

export type AdgridAdvertiserInput = {
  companyName: string;
  contactEmail: string;
  contactPhone?: string | null;
  userId?: string | null;
};

export type AdgridCampaignInput = {
  advertiserId: string;
  advertiserName: string;
  name: string;
  campaignType: string;
  status?: string;
  billingModel?: string;
  bidCents?: number | null;
  dailyBudgetCents?: number | null;
  totalBudgetCents?: number | null;
  countries?: string[] | null;
  corridors?: string[] | null;
  placements?: string[] | null;
  targeting?: Record<string, unknown> | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type AdgridCreativeInput = {
  campaignId: string;
  advertiserId: string;
  advertiserName: string;
  headline?: string | null;
  body?: string | null;
  description?: string | null;
  ctaLabel?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  pageTypes?: string[] | null;
  countrySlugs?: string[] | null;
  corridorSlugs?: string[] | null;
  serviceSlugs?: string[] | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

function cleanArray(values?: string[] | null) {
  return [...new Set((values ?? []).map((value) => value?.trim()).filter(Boolean) as string[])];
}

export function normalizeAdgridCampaignType(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "sponsored_listing";
  if (normalized === "ron" || normalized === "run_of_network") return "run_of_network";
  if (normalized === "corridor") return "corridor_targeted";
  if (normalized === "exclusive") return "corridor_exclusive";
  return normalized.replace(/[^a-z0-9_]+/g, "_");
}

export async function ensureCanonicalAdgridAdvertiser(
  supabase: SupabaseAdmin,
  input: AdgridAdvertiserInput,
) {
  const email = input.contactEmail.trim().toLowerCase();
  const { data: existing, error: existingError } = await supabase
    .from("hc_adgrid_advertiser")
    .select("id")
    .eq("contact_email", email)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    await supabase
      .from("hc_adgrid_advertiser")
      .update({
        company_name: input.companyName,
        contact_phone: input.contactPhone ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return { id: existing.id };
  }

  const { data: created, error: createError } = await supabase
    .from("hc_adgrid_advertiser")
    .insert({
      company_name: input.companyName,
      contact_email: email,
      contact_phone: input.contactPhone ?? null,
      billing_status: "pending",
      monthly_budget_cents: 0,
      total_spent_cents: 0,
    })
    .select("id")
    .single();

  if (createError || !created) throw createError ?? new Error("Failed to create advertiser");
  return { id: created.id };
}

export async function createCanonicalAdgridCampaign(
  supabase: SupabaseAdmin,
  input: AdgridCampaignInput,
) {
  const countries = cleanArray(input.countries);
  const corridors = cleanArray(input.corridors);
  const placements = cleanArray(input.placements);
  const now = new Date().toISOString();

  const { data: campaign, error } = await supabase
    .from("hc_ad_campaigns")
    .insert({
      advertiser_id: input.advertiserId,
      name: input.name,
      campaign_type: normalizeAdgridCampaignType(input.campaignType),
      status: input.status ?? "pending_review",
      billing_model: input.billingModel ?? "cpc",
      bid_amount_cents: input.bidCents ?? null,
      bid_per_click_cents: input.billingModel === "cpc" ? input.bidCents ?? null : null,
      budget_daily_cents: input.dailyBudgetCents ?? null,
      daily_budget_cents: input.dailyBudgetCents ?? null,
      budget_total_cents: input.totalBudgetCents ?? null,
      total_budget_cents: input.totalBudgetCents ?? null,
      geo_targets: countries,
      corridor_targets: corridors,
      placement_targets: placements.length > 0 ? placements : ["directory_results"],
      target_countries: countries,
      target_corridors: corridors,
      targeting: {
        ...(input.targeting ?? {}),
        advertiser_name: input.advertiserName,
      },
      start_date: input.startsAt ?? now,
      end_date: input.endsAt ?? null,
    })
    .select("campaign_id")
    .single();

  if (error || !campaign) throw error ?? new Error("Failed to create campaign");
  return { campaignId: campaign.campaign_id };
}

export async function createCanonicalAdgridCreative(
  supabase: SupabaseAdmin,
  input: AdgridCreativeInput,
) {
  const headline = input.headline?.trim() || `${input.advertiserName} sponsor`;
  const ctaLabel = input.ctaLabel?.trim() || input.ctaText?.trim() || "Learn More";

  const { data: creative, error } = await supabase
    .from("hc_ad_creatives")
    .insert({
      campaign_id: input.campaignId,
      advertiser_id: input.advertiserId,
      advertiser_name: input.advertiserName,
      creative_type: "native_card",
      headline,
      description: input.description ?? input.body ?? null,
      body: input.body ?? input.description ?? "",
      cta_text: input.ctaText ?? ctaLabel,
      cta_label: ctaLabel,
      cta_url: input.ctaUrl ?? null,
      status: "pending_review",
      active: false,
      page_types: cleanArray(input.pageTypes),
      country_slugs: cleanArray(input.countrySlugs),
      corridor_slugs: cleanArray(input.corridorSlugs),
      service_slugs: cleanArray(input.serviceSlugs),
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
    })
    .select("creative_id")
    .single();

  if (error || !creative) throw error ?? new Error("Failed to create creative");
  return { creativeId: creative.creative_id };
}
