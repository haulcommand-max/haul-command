import { getSupabaseAdmin } from "@/lib/supabase/admin";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type CreativeRow = {
  creative_id: string;
  campaign_id: string;
  headline: string | null;
  description: string | null;
  body: string | null;
  creative_type: string | null;
  ad_class: string | null;
  status: string | null;
  active: boolean | null;
  ab_variant: string | null;
  page_types: string[] | null;
  country_slugs: string[] | null;
  corridor_slugs: string[] | null;
  service_slugs: string[] | null;
  quality_score: number | null;
  creative_quality_score: number | null;
  historical_ctr: number | null;
  impressions_total: number | null;
  clicks_total: number | null;
  advertiser_name: string | null;
  created_at: string | null;
};

type CampaignRow = {
  campaign_id: string;
  status: string | null;
  campaign_type: string | null;
  geo_targets: JsonValue;
  placement_targets: JsonValue;
  spend_total_cents: number | null;
  budget_daily_cents: number | null;
  budget_total_cents: number | null;
};

type ImpressionRow = {
  campaign_id: string | null;
  variant: string | null;
};

type ClickRow = {
  campaign_id: string | null;
  variant: string | null;
};

type EventRow = {
  event_type: string | null;
  campaign_id: string | null;
  billing_amount_cents: number | null;
};

type OutcomeRow = {
  campaign_id: string | null;
  creative_id: string | null;
  outcome_event: string | null;
  outcome_value_cents: number | null;
  billed_amount_cents: number | null;
};

export type AdgridCreativePerformanceRow = {
  creativeId: string;
  campaignId: string;
  headline: string;
  advertiserName: string;
  country: string;
  surface: string;
  creativeType: string;
  campaignType: string;
  variant: string;
  status: string;
  scoreComposite: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenueUsd: number;
  budgetUsd: number;
  createdAt: string | null;
};

export type AdgridCreativePerformanceReadModel = {
  asOf: string;
  source: {
    creativesTable: "hc_ad_creatives";
    campaignsTable: "hc_ad_campaigns";
    impressionsTable: "hc_adgrid_impressions";
    clicksTable: "hc_adgrid_clicks";
    eventsTable: "hc_adgrid_events";
    outcomesTable: "hc_adgrid_outcome_events";
    attributionBasis: "creative_or_campaign_variant_or_campaign_fallback";
  };
  totals: {
    creatives: number;
    activeCreatives: number;
    approvedCreatives: number;
    eventBackedCreatives: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    revenueUsd: number;
  };
  statusCounts: Record<string, number>;
  rows: AdgridCreativePerformanceRow[];
  activationGaps: string[];
  error?: string;
};

const IMPRESSION_EVENTS = new Set(["impression", "ad_impression"]);
const CLICK_EVENTS = new Set(["click", "ad_click", "sponsor_cta_click"]);
const CONVERSION_EVENTS = new Set(["conversion", "claim", "upgrade", "signup", "quote_request", "contact_unlock"]);

function dollars(cents: number | null | undefined) {
  return (cents ?? 0) / 100;
}

function firstString(value: unknown, fallback: string) {
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === "string" && item.trim().length > 0);
    return typeof first === "string" ? first : fallback;
  }
  return fallback;
}

function normalizeStatus(creative: CreativeRow, campaign?: CampaignRow) {
  const creativeStatus = creative.status?.trim().toLowerCase() || "unknown";
  const campaignStatus = campaign?.status?.trim().toLowerCase() || "";
  if (creative.active && ["approved", "active"].includes(creativeStatus) && (!campaignStatus || ["active", "approved"].includes(campaignStatus))) {
    return "active";
  }
  if (!creative.active && creativeStatus === "approved") return "approved_inactive";
  return creativeStatus;
}

function compositeScore(creative: CreativeRow) {
  const raw = creative.creative_quality_score ?? creative.quality_score ?? creative.historical_ctr ?? 0;
  if (raw > 1) return Math.min(raw / 100, 1);
  return Math.max(raw, 0);
}

function key(campaignId?: string | null, variant?: string | null) {
  return `${campaignId || "none"}::${variant || "none"}`;
}

function emptyModel(asOf = new Date().toISOString()): AdgridCreativePerformanceReadModel {
  return {
    asOf,
    source: {
      creativesTable: "hc_ad_creatives",
      campaignsTable: "hc_ad_campaigns",
      impressionsTable: "hc_adgrid_impressions",
      clicksTable: "hc_adgrid_clicks",
      eventsTable: "hc_adgrid_events",
      outcomesTable: "hc_adgrid_outcome_events",
      attributionBasis: "creative_or_campaign_variant_or_campaign_fallback",
    },
    totals: {
      creatives: 0,
      activeCreatives: 0,
      approvedCreatives: 0,
      eventBackedCreatives: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      conversions: 0,
      revenueUsd: 0,
    },
    statusCounts: {},
    rows: [],
    activationGaps: [],
  };
}

export async function getAdgridCreativePerformanceReadModel(): Promise<AdgridCreativePerformanceReadModel> {
  const asOf = new Date().toISOString();
  const model = emptyModel(asOf);

  try {
    const supabase = getSupabaseAdmin();
    const [
      { data: creatives, error: creativesError },
      { data: campaigns, error: campaignsError },
      { data: impressions, error: impressionsError },
      { data: clicks, error: clicksError },
      { data: events, error: eventsError },
      { data: outcomes, error: outcomesError },
    ] = await Promise.all([
      supabase
        .from("hc_ad_creatives")
        .select("creative_id, campaign_id, headline, description, body, creative_type, ad_class, status, active, ab_variant, page_types, country_slugs, corridor_slugs, service_slugs, quality_score, creative_quality_score, historical_ctr, impressions_total, clicks_total, advertiser_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("hc_ad_campaigns")
        .select("campaign_id, status, campaign_type, geo_targets, placement_targets, spend_total_cents, budget_daily_cents, budget_total_cents")
        .limit(5000),
      supabase
        .from("hc_adgrid_impressions")
        .select("campaign_id, variant")
        .limit(100000),
      supabase
        .from("hc_adgrid_clicks")
        .select("campaign_id, variant")
        .limit(100000),
      supabase
        .from("hc_adgrid_events")
        .select("event_type, campaign_id, billing_amount_cents")
        .limit(100000),
      supabase
        .from("hc_adgrid_outcome_events")
        .select("campaign_id, creative_id, outcome_event, outcome_value_cents, billed_amount_cents")
        .limit(100000),
    ]);

    const firstError = creativesError || campaignsError || impressionsError || clicksError || eventsError || outcomesError;
    if (firstError) return { ...model, error: firstError.message };

    const creativeRows = (creatives ?? []) as CreativeRow[];
    const campaignRows = (campaigns ?? []) as CampaignRow[];
    const impressionRows = (impressions ?? []) as ImpressionRow[];
    const clickRows = (clicks ?? []) as ClickRow[];
    const eventRows = (events ?? []) as EventRow[];
    const outcomeRows = (outcomes ?? []) as OutcomeRow[];

    const campaignsById = new Map(campaignRows.map((campaign) => [campaign.campaign_id, campaign]));
    const impressionsByVariant = new Map<string, number>();
    const clicksByVariant = new Map<string, number>();
    const eventImpressionsByCampaign = new Map<string, number>();
    const eventClicksByCampaign = new Map<string, number>();
    const eventRevenueByCampaign = new Map<string, number>();
    const outcomesByCreative = new Map<string, { conversions: number; revenueUsd: number }>();
    const outcomesByCampaign = new Map<string, { conversions: number; revenueUsd: number }>();

    for (const row of impressionRows) {
      impressionsByVariant.set(key(row.campaign_id, row.variant), (impressionsByVariant.get(key(row.campaign_id, row.variant)) ?? 0) + 1);
    }

    for (const row of clickRows) {
      clicksByVariant.set(key(row.campaign_id, row.variant), (clicksByVariant.get(key(row.campaign_id, row.variant)) ?? 0) + 1);
    }

    for (const row of eventRows) {
      if (!row.campaign_id) continue;
      const type = row.event_type ?? "";
      if (IMPRESSION_EVENTS.has(type)) eventImpressionsByCampaign.set(row.campaign_id, (eventImpressionsByCampaign.get(row.campaign_id) ?? 0) + 1);
      if (CLICK_EVENTS.has(type)) eventClicksByCampaign.set(row.campaign_id, (eventClicksByCampaign.get(row.campaign_id) ?? 0) + 1);
      eventRevenueByCampaign.set(row.campaign_id, (eventRevenueByCampaign.get(row.campaign_id) ?? 0) + dollars(row.billing_amount_cents));
    }

    for (const row of outcomeRows) {
      const conversion = CONVERSION_EVENTS.has(row.outcome_event ?? "") ? 1 : 1;
      const revenueUsd = dollars(row.billed_amount_cents ?? row.outcome_value_cents);
      if (row.creative_id) {
        const current = outcomesByCreative.get(row.creative_id) ?? { conversions: 0, revenueUsd: 0 };
        outcomesByCreative.set(row.creative_id, { conversions: current.conversions + conversion, revenueUsd: current.revenueUsd + revenueUsd });
      }
      if (row.campaign_id) {
        const current = outcomesByCampaign.get(row.campaign_id) ?? { conversions: 0, revenueUsd: 0 };
        outcomesByCampaign.set(row.campaign_id, { conversions: current.conversions + conversion, revenueUsd: current.revenueUsd + revenueUsd });
      }
    }

    const rows = creativeRows.map((creative) => {
      const campaign = campaignsById.get(creative.campaign_id);
      const variantKey = key(creative.campaign_id, creative.ab_variant);
      const directImpressions = impressionsByVariant.get(variantKey) ?? 0;
      const directClicks = clicksByVariant.get(variantKey) ?? 0;
      const impressions = directImpressions || eventImpressionsByCampaign.get(creative.campaign_id) || creative.impressions_total || 0;
      const clicks = directClicks || eventClicksByCampaign.get(creative.campaign_id) || creative.clicks_total || 0;
      const creativeOutcome = outcomesByCreative.get(creative.creative_id);
      const campaignOutcome = outcomesByCampaign.get(creative.campaign_id);
      const revenueUsd = creativeOutcome?.revenueUsd ?? campaignOutcome?.revenueUsd ?? eventRevenueByCampaign.get(creative.campaign_id) ?? dollars(campaign?.spend_total_cents);
      const conversions = creativeOutcome?.conversions ?? campaignOutcome?.conversions ?? 0;
      const status = normalizeStatus(creative, campaign);
      const country = firstString(creative.country_slugs, firstString(campaign?.geo_targets, "global"));
      const surface = firstString(creative.page_types, firstString(campaign?.placement_targets, "unknown"));
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const budgetUsd = dollars(campaign?.budget_total_cents ?? campaign?.budget_daily_cents);

      model.statusCounts[status] = (model.statusCounts[status] ?? 0) + 1;
      model.totals.creatives += 1;
      if (status === "active") model.totals.activeCreatives += 1;
      if (status === "active" || status === "approved_inactive" || status === "approved") model.totals.approvedCreatives += 1;
      if (impressions > 0 || clicks > 0 || conversions > 0 || revenueUsd > 0) model.totals.eventBackedCreatives += 1;
      model.totals.impressions += impressions;
      model.totals.clicks += clicks;
      model.totals.conversions += conversions;
      model.totals.revenueUsd += revenueUsd;

      return {
        creativeId: creative.creative_id,
        campaignId: creative.campaign_id,
        headline: creative.headline || creative.description || creative.body || "Untitled AdGrid creative",
        advertiserName: creative.advertiser_name || "Unknown advertiser",
        country,
        surface,
        creativeType: creative.creative_type || creative.ad_class || "canonical_adgrid",
        campaignType: campaign?.campaign_type || "unknown",
        variant: creative.ab_variant || "default",
        status,
        scoreComposite: compositeScore(creative),
        impressions,
        clicks,
        ctr,
        conversions,
        revenueUsd,
        budgetUsd,
        createdAt: creative.created_at,
      };
    });

    model.rows = rows
      .sort((a, b) => (b.revenueUsd - a.revenueUsd) || (b.impressions - a.impressions) || (b.scoreComposite - a.scoreComposite))
      .slice(0, 100);
    model.totals.ctr = model.totals.impressions > 0 ? (model.totals.clicks / model.totals.impressions) * 100 : 0;

    if (model.totals.creatives === 0) {
      model.activationGaps.push("No canonical AdGrid creatives exist yet in hc_ad_creatives.");
    }
    if (model.totals.activeCreatives === 0 && model.totals.creatives > 0) {
      model.activationGaps.push("Canonical creatives exist, but none are active and approved for serving.");
    }
    if (model.totals.eventBackedCreatives === 0 && model.totals.creatives > 0) {
      model.activationGaps.push("Creatives exist, but no impression, click, conversion, or billed telemetry is attached yet.");
    }
    if (outcomeRows.length === 0) {
      model.activationGaps.push("No AdGrid outcome events are available, so creative winner selection cannot prove claim, signup, or paid conversion outcomes yet.");
    }

    return model;
  } catch (error) {
    return {
      ...model,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
