import { getSupabaseAdmin } from "@/lib/supabase/admin";

type AdgridEventRow = {
  event_type: string | null;
  surface: string | null;
  zone: string | null;
  campaign_id: string | null;
  billing_amount_cents: number | null;
};

type AdgridOutcomeRow = {
  outcome_value_cents: number | null;
  billed_amount_cents: number | null;
  billing_status: string | null;
  campaign_id: string | null;
};

type AdgridCampaignRow = {
  campaign_id: string;
  status: string | null;
  campaign_type: string | null;
  spend_cents: number | null;
  spend_total_cents: number | null;
};

export type AdgridFillYieldSurfaceRow = {
  surface: string;
  trackedRequests: number;
  filledImpressions: number;
  fillRate: number | null;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  estimatedRevenueUsd: number;
  avgCpm: number | null;
  avgCpc: number | null;
};

export type AdgridFillYieldReadModel = {
  asOf: string;
  source: {
    eventsTable: "hc_adgrid_events";
    outcomesTable: "hc_adgrid_outcome_events";
    campaignsTable: "hc_ad_campaigns";
    revenueBasis: "event_billing_plus_outcomes_or_campaign_spend_fallback";
  };
  totals: {
    trackedRequests: number;
    impressions: number;
    clicks: number;
    ctr: number;
    estimatedRevenueUsd: number;
    avgFillRate: number | null;
    activeCampaigns: number;
    campaignCount: number;
  };
  surfaces: AdgridFillYieldSurfaceRow[];
  statusCounts: Record<string, number>;
  measurementGaps: string[];
  error?: string;
};

const REQUEST_EVENTS = new Set(["request", "ad_request", "serve_request"]);
const IMPRESSION_EVENTS = new Set(["impression", "ad_impression"]);
const CLICK_EVENTS = new Set(["click", "ad_click", "sponsor_cta_click"]);

function dollars(cents: number | null | undefined) {
  return (cents ?? 0) / 100;
}

function cleanSurface(row: AdgridEventRow) {
  return row.surface?.trim() || row.zone?.trim() || "unknown";
}

function emptyModel(asOf = new Date().toISOString()): AdgridFillYieldReadModel {
  return {
    asOf,
    source: {
      eventsTable: "hc_adgrid_events",
      outcomesTable: "hc_adgrid_outcome_events",
      campaignsTable: "hc_ad_campaigns",
      revenueBasis: "event_billing_plus_outcomes_or_campaign_spend_fallback",
    },
    totals: {
      trackedRequests: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      estimatedRevenueUsd: 0,
      avgFillRate: null,
      activeCampaigns: 0,
      campaignCount: 0,
    },
    surfaces: [],
    statusCounts: {},
    measurementGaps: [],
  };
}

export async function getAdgridFillYieldReadModel(): Promise<AdgridFillYieldReadModel> {
  const asOf = new Date().toISOString();
  const model = emptyModel(asOf);

  try {
    const supabase = getSupabaseAdmin();
    const [{ data: events, error: eventsError }, { data: outcomes, error: outcomesError }, { data: campaigns, error: campaignsError }] = await Promise.all([
      supabase
        .from("hc_adgrid_events")
        .select("event_type, surface, zone, campaign_id, billing_amount_cents")
        .limit(100000),
      supabase
        .from("hc_adgrid_outcome_events")
        .select("outcome_value_cents, billed_amount_cents, billing_status, campaign_id")
        .limit(100000),
      supabase
        .from("hc_ad_campaigns")
        .select("campaign_id, status, campaign_type, spend_cents, spend_total_cents")
        .limit(5000),
    ]);

    const firstError = eventsError || outcomesError || campaignsError;
    if (firstError) {
      return { ...model, error: firstError.message };
    }

    const surfaceMap = new Map<string, AdgridFillYieldSurfaceRow>();
    const rows = (events ?? []) as AdgridEventRow[];
    const outcomeRows = (outcomes ?? []) as AdgridOutcomeRow[];
    const campaignRows = (campaigns ?? []) as AdgridCampaignRow[];
    let campaignSpendUsd = 0;
    let outcomeRevenueUsd = 0;

    for (const campaign of campaignRows) {
      const status = campaign.status ?? "unknown";
      model.statusCounts[status] = (model.statusCounts[status] ?? 0) + 1;
      if (status === "active") model.totals.activeCampaigns += 1;
      model.totals.campaignCount += 1;
      campaignSpendUsd += dollars(campaign.spend_total_cents ?? campaign.spend_cents);
    }

    for (const row of rows) {
      const surface = cleanSurface(row);
      const current = surfaceMap.get(surface) ?? {
        surface,
        trackedRequests: 0,
        filledImpressions: 0,
        fillRate: null,
        totalImpressions: 0,
        totalClicks: 0,
        ctr: 0,
        estimatedRevenueUsd: 0,
        avgCpm: null,
        avgCpc: null,
      };

      const type = row.event_type ?? "unknown";
      if (REQUEST_EVENTS.has(type)) {
        current.trackedRequests += 1;
        model.totals.trackedRequests += 1;
      }
      if (IMPRESSION_EVENTS.has(type)) {
        current.filledImpressions += 1;
        current.totalImpressions += 1;
        model.totals.impressions += 1;
      }
      if (CLICK_EVENTS.has(type)) {
        current.totalClicks += 1;
        model.totals.clicks += 1;
      }
      current.estimatedRevenueUsd += dollars(row.billing_amount_cents);
      model.totals.estimatedRevenueUsd += dollars(row.billing_amount_cents);
      surfaceMap.set(surface, current);
    }

    for (const outcome of outcomeRows) {
      outcomeRevenueUsd += dollars(outcome.billed_amount_cents ?? outcome.outcome_value_cents);
    }
    model.totals.estimatedRevenueUsd += outcomeRevenueUsd > 0 ? outcomeRevenueUsd : campaignSpendUsd;

    const surfaces = Array.from(surfaceMap.values()).map((surface) => {
      const fillRate = surface.trackedRequests > 0 ? (surface.filledImpressions / surface.trackedRequests) * 100 : null;
      const ctr = surface.totalImpressions > 0 ? (surface.totalClicks / surface.totalImpressions) * 100 : 0;
      const avgCpm = surface.totalImpressions > 0 ? (surface.estimatedRevenueUsd / surface.totalImpressions) * 1000 : null;
      const avgCpc = surface.totalClicks > 0 ? surface.estimatedRevenueUsd / surface.totalClicks : null;
      return { ...surface, fillRate, ctr, avgCpm, avgCpc };
    });

    const surfacesWithFill = surfaces.filter((surface) => surface.fillRate !== null);
    model.surfaces = surfaces.sort((a, b) => b.totalImpressions - a.totalImpressions).slice(0, 25);
    model.totals.ctr = model.totals.impressions > 0 ? (model.totals.clicks / model.totals.impressions) * 100 : 0;
    model.totals.avgFillRate = surfacesWithFill.length
      ? surfacesWithFill.reduce((sum, surface) => sum + (surface.fillRate ?? 0), 0) / surfacesWithFill.length
      : null;

    if (model.totals.trackedRequests === 0) {
      model.measurementGaps.push("AdGrid request events are not being recorded yet, so fill rate is shown as unmeasured instead of inferred.");
    }
    if (outcomeRows.length === 0) {
      model.measurementGaps.push("No AdGrid outcome events are available yet, so yield only reflects campaign spend and event billing fields.");
    }

    return model;
  } catch (error) {
    return {
      ...model,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
