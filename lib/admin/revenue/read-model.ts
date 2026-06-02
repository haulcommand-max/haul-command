import { getAdgridFillYieldReadModel } from "@/lib/admin/adgrid/fill-yield-read-model";
import { getDataProductsDashboardReadModel } from "@/lib/admin/data-products/read-model";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Trend = "up" | "down" | "flat";

type MoneyRow = {
  id?: string | null;
  created_at?: string | null;
  amount_usd?: number | string | null;
  amount_cents?: number | null;
  price_cents?: number | null;
  estimated_mrr_cents?: number | null;
  status?: string | null;
  recognition_status?: string | null;
  source?: string | null;
  product_kind?: string | null;
  product_key?: string | null;
  product_code?: string | null;
  billing_mode?: string | null;
  cadence?: string | null;
  country_code?: string | null;
  currency?: string | null;
};

export type RevenueCommandSurface = {
  surface: string;
  sourceTable: string;
  basis: string;
  todayUsd: number;
  weekUsd: number;
  monthUsd: number;
  totalUsd: number;
  pendingUsd: number;
  records: number;
  trend: Trend;
  status: "live" | "pipeline" | "planned" | "gap";
};

export type RevenueCommandCountry = {
  code: string;
  revenueUsd: number;
  pendingUsd: number;
  records: number;
};

export type RevenueCommandReadModel = {
  asOf: string;
  sourceTables: string[];
  totals: {
    todayUsd: number;
    weekUsd: number;
    monthUsd: number;
    totalUsd: number;
    pendingUsd: number;
    liveSurfaces: number;
    pipelineSurfaces: number;
    gapCount: number;
  };
  surfaces: RevenueCommandSurface[];
  countries: RevenueCommandCountry[];
  tableHealth: Array<{
    table: string;
    records: number;
    state: "live" | "gap";
    note: string;
  }>;
  activationGaps: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const SOURCE_TABLES = [
  "hc_adgrid_events",
  "hc_adgrid_outcome_events",
  "hc_ad_campaigns",
  "data_purchases",
  "hc_pay_revenue",
  "hc_checkout_intents",
  "hc_abandoned_checkouts",
  "hc_billing_prices",
  "payments",
] as const;

function usdFromCents(cents: number | null | undefined) {
  return (cents ?? 0) / 100;
}

function usdFromAmount(value: number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTime(value: string | null | undefined) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function trend(todayUsd: number, weekUsd: number): Trend {
  const previousSixDaysAverage = Math.max(0, (weekUsd - todayUsd) / 6);
  if (todayUsd > previousSixDaysAverage * 1.15) return "up";
  if (todayUsd < previousSixDaysAverage * 0.85) return "down";
  return "flat";
}

function sumRows(rows: MoneyRow[], amount: (row: MoneyRow) => number, nowMs: number) {
  const dayStart = nowMs - DAY_MS;
  const weekStart = nowMs - 7 * DAY_MS;
  const monthStart = nowMs - 30 * DAY_MS;

  return rows.reduce(
    (acc, row) => {
      const value = amount(row);
      const createdAt = parseTime(row.created_at);
      acc.totalUsd += value;
      if (createdAt !== null && createdAt >= dayStart) acc.todayUsd += value;
      if (createdAt !== null && createdAt >= weekStart) acc.weekUsd += value;
      if (createdAt !== null && createdAt >= monthStart) acc.monthUsd += value;
      return acc;
    },
    { todayUsd: 0, weekUsd: 0, monthUsd: 0, totalUsd: 0 },
  );
}

function surface(input: Omit<RevenueCommandSurface, "trend">): RevenueCommandSurface {
  return {
    ...input,
    trend: trend(input.todayUsd, input.weekUsd),
  };
}

async function readRows(table: string, select: string, orderColumn = "created_at", limit = 5000) {
  const supabase = getSupabaseAdmin();
  const { data, error, count } = await supabase
    .from(table)
    .select(select, { count: "exact" })
    .order(orderColumn, { ascending: false })
    .limit(limit);

  return {
    rows: (data ?? []) as MoneyRow[],
    count: count ?? data?.length ?? 0,
    error: error ? "Unreadable" : undefined,
  };
}

export async function getRevenueCommandReadModel(): Promise<RevenueCommandReadModel> {
  const asOf = new Date().toISOString();
  const nowMs = Date.now();

  const [adgrid, dataProducts, hcPay, checkoutIntents, abandonedCheckouts, billingPrices, payments] = await Promise.all([
    getAdgridFillYieldReadModel(),
    getDataProductsDashboardReadModel(),
    readRows("hc_pay_revenue", "id,source,amount_usd,recognition_status,reference_type,created_at", "created_at", 5000),
    readRows("hc_checkout_intents", "id,product_kind,product_key,price_cents,status,country_code,currency,created_at", "created_at", 5000),
    readRows("hc_abandoned_checkouts", "id,product_code,amount_cents,status,currency,created_at", "created_at", 5000),
    readRows("hc_billing_prices", "id,product_code,billing_mode,status,amount_cents,estimated_mrr_cents,cadence,created_at", "created_at", 5000),
    readRows("payments", "id,amount_cents,status,created_at", "created_at", 5000),
  ]);

  const earnedHcPay = hcPay.rows.filter((row) => !["refunded", "voided"].includes(row.recognition_status ?? ""));
  const hcPaySums = sumRows(earnedHcPay, (row) => usdFromAmount(row.amount_usd), nowMs);
  const paymentRows = payments.rows.filter((row) => ["paid", "captured", "succeeded", "completed"].includes(row.status ?? ""));
  const paymentSums = sumRows(paymentRows, (row) => usdFromCents(row.amount_cents), nowMs);
  const checkoutRows = checkoutIntents.rows.filter((row) => !["paid", "cancelled", "expired"].includes(row.status ?? ""));
  const checkoutSums = sumRows(checkoutRows, (row) => usdFromCents(row.price_cents), nowMs);
  const abandonedSums = sumRows(abandonedCheckouts.rows, (row) => usdFromCents(row.amount_cents), nowMs);
  const plannedMrrUsd = billingPrices.rows
    .filter((row) => ["ready_for_stripe", "needs_checkout", "live"].includes(row.status ?? ""))
    .reduce((sum, row) => sum + usdFromCents(row.estimated_mrr_cents ?? (row.cadence === "month" ? row.amount_cents : 0)), 0);

  const surfaces: RevenueCommandSurface[] = [
    surface({
      surface: "AdGrid Yield",
      sourceTable: "hc_adgrid_events + hc_adgrid_outcome_events + hc_ad_campaigns",
      basis: adgrid.source.revenueBasis,
      todayUsd: 0,
      weekUsd: 0,
      monthUsd: adgrid.totals.estimatedRevenueUsd,
      totalUsd: adgrid.totals.estimatedRevenueUsd,
      pendingUsd: 0,
      records: adgrid.totals.impressions + adgrid.totals.clicks + adgrid.totals.campaignCount,
      status: adgrid.error ? "gap" : "live",
    }),
    surface({
      surface: "Data Products",
      sourceTable: "data_purchases",
      basis: dataProducts.source.revenueBasis,
      todayUsd: 0,
      weekUsd: 0,
      monthUsd: dataProducts.estimatedMrrUsd,
      totalUsd: dataProducts.estimatedActiveRevenueUsd,
      pendingUsd: dataProducts.pendingPurchaseCount,
      records: dataProducts.purchaseCount,
      status: dataProducts.error ? "gap" : "live",
    }),
    surface({
      surface: "HC Pay / Matching Fees",
      sourceTable: "hc_pay_revenue",
      basis: "recognized amount_usd excluding refunded and voided rows",
      ...hcPaySums,
      pendingUsd: hcPay.rows
        .filter((row) => row.recognition_status === "pending_capture")
        .reduce((sum, row) => sum + usdFromAmount(row.amount_usd), 0),
      records: hcPay.count,
      status: hcPay.error ? "gap" : "live",
    }),
    surface({
      surface: "Captured Payments",
      sourceTable: "payments",
      basis: "paid/captured/succeeded/completed amount_cents",
      ...paymentSums,
      pendingUsd: payments.rows
        .filter((row) => ["pending", "authorized", "requires_capture"].includes(row.status ?? ""))
        .reduce((sum, row) => sum + usdFromCents(row.amount_cents), 0),
      records: payments.count,
      status: payments.error ? "gap" : "live",
    }),
    surface({
      surface: "Checkout Intent Pipeline",
      sourceTable: "hc_checkout_intents",
      basis: "open checkout price_cents, not counted as earned revenue",
      ...checkoutSums,
      pendingUsd: checkoutSums.totalUsd,
      records: checkoutIntents.count,
      status: checkoutIntents.error ? "gap" : "pipeline",
    }),
    surface({
      surface: "Abandoned Checkout Recovery",
      sourceTable: "hc_abandoned_checkouts",
      basis: "abandoned checkout amount_cents recovery pool",
      ...abandonedSums,
      pendingUsd: abandonedSums.totalUsd,
      records: abandonedCheckouts.count,
      status: abandonedCheckouts.error ? "gap" : "pipeline",
    }),
    surface({
      surface: "Billing Price Catalog",
      sourceTable: "hc_billing_prices",
      basis: "ready/live estimated_mrr_cents readiness, not booked revenue",
      todayUsd: 0,
      weekUsd: 0,
      monthUsd: plannedMrrUsd,
      totalUsd: plannedMrrUsd,
      pendingUsd: plannedMrrUsd,
      records: billingPrices.count,
      status: billingPrices.error ? "gap" : "planned",
    }),
  ];

  const countryMap = new Map<string, RevenueCommandCountry>();
  for (const row of checkoutIntents.rows) {
    const code = row.country_code?.toUpperCase();
    if (!code) continue;
    const current = countryMap.get(code) ?? { code, revenueUsd: 0, pendingUsd: 0, records: 0 };
    current.pendingUsd += usdFromCents(row.price_cents);
    current.records += 1;
    countryMap.set(code, current);
  }
  for (const product of dataProducts.products) {
    for (const code of product.countries) {
      const current = countryMap.get(code) ?? { code, revenueUsd: 0, pendingUsd: 0, records: 0 };
      current.revenueUsd += product.estimatedActiveRevenueUsd / Math.max(1, product.countries.length);
      current.records += product.activePurchases;
      countryMap.set(code, current);
    }
  }

  const activationGaps: string[] = [];
  if (adgrid.error) activationGaps.push("AdGrid revenue telemetry is unreadable by the Revenue Command read model.");
  if (dataProducts.error) activationGaps.push("Data-product purchase telemetry is unreadable by the Revenue Command read model.");
  for (const table of [hcPay, checkoutIntents, abandonedCheckouts, billingPrices, payments]) {
    if (table.error) activationGaps.push("A canonical money table is not readable by the Revenue Command read model.");
  }
  if (!hcPay.error && hcPay.count === 0) activationGaps.push("No HC Pay revenue rows are visible yet.");
  if (!checkoutIntents.error && checkoutIntents.count === 0) activationGaps.push("No checkout intents are visible yet, so money clicks may not be fully captured.");
  if (!billingPrices.error && billingPrices.count === 0) activationGaps.push("No billing price catalog rows are visible yet.");

  const earnedSurfaces = surfaces.filter((row) => row.status === "live");
  const pipelineSurfaces = surfaces.filter((row) => row.status === "pipeline" || row.status === "planned");

  return {
    asOf,
    sourceTables: [...SOURCE_TABLES],
    totals: {
      todayUsd: earnedSurfaces.reduce((sum, row) => sum + row.todayUsd, 0),
      weekUsd: earnedSurfaces.reduce((sum, row) => sum + row.weekUsd, 0),
      monthUsd: earnedSurfaces.reduce((sum, row) => sum + row.monthUsd, 0),
      totalUsd: earnedSurfaces.reduce((sum, row) => sum + row.totalUsd, 0),
      pendingUsd: surfaces.reduce((sum, row) => sum + row.pendingUsd, 0),
      liveSurfaces: earnedSurfaces.length,
      pipelineSurfaces: pipelineSurfaces.length,
      gapCount: surfaces.filter((row) => row.status === "gap").length,
    },
    surfaces,
    countries: Array.from(countryMap.values()).sort((a, b) => (b.revenueUsd + b.pendingUsd) - (a.revenueUsd + a.pendingUsd)).slice(0, 20),
    tableHealth: [
      { table: "hc_adgrid_events", records: adgrid.totals.impressions + adgrid.totals.clicks, state: adgrid.error ? "gap" : "live", note: adgrid.error ? "Unreadable" : adgrid.source.revenueBasis },
      { table: "data_purchases", records: dataProducts.purchaseCount, state: dataProducts.error ? "gap" : "live", note: dataProducts.error ? "Unreadable" : dataProducts.source.revenueBasis },
      { table: "hc_pay_revenue", records: hcPay.count, state: hcPay.error ? "gap" : "live", note: hcPay.error ?? "amount_usd recognition" },
      { table: "hc_checkout_intents", records: checkoutIntents.count, state: checkoutIntents.error ? "gap" : "live", note: checkoutIntents.error ?? "money click capture" },
      { table: "hc_abandoned_checkouts", records: abandonedCheckouts.count, state: abandonedCheckouts.error ? "gap" : "live", note: abandonedCheckouts.error ?? "recovery queue" },
      { table: "hc_billing_prices", records: billingPrices.count, state: billingPrices.error ? "gap" : "live", note: billingPrices.error ?? "price readiness" },
      { table: "payments", records: payments.count, state: payments.error ? "gap" : "live", note: payments.error ?? "captured payment rows" },
    ],
    activationGaps,
  };
}
