import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { DATA_PRODUCT_CATALOG, type DataProduct } from "@/lib/monetization/data-product-engine";

type PurchaseStatus = "pending" | "active" | "expired" | "cancelled" | string;

type DataPurchaseRow = {
  id: string;
  product_id: string | null;
  product_type: string | null;
  country_code: string | null;
  status: PurchaseStatus | null;
  purchased_at: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown> | null;
};

export type DataProductDashboardRow = {
  product: DataProduct;
  totalPurchases: number;
  activePurchases: number;
  pendingPurchases: number;
  expiredPurchases: number;
  estimatedActiveRevenueUsd: number;
  estimatedMrrUsd: number;
  fulfillmentRequired: number;
  countries: string[];
};

export type DataProductsDashboardReadModel = {
  asOf: string;
  products: DataProductDashboardRow[];
  purchaseCount: number;
  activePurchaseCount: number;
  pendingPurchaseCount: number;
  expiredPurchaseCount: number;
  fulfillmentRequiredCount: number;
  estimatedActiveRevenueUsd: number;
  estimatedMrrUsd: number;
  activeProductCount: number;
  countryCount: number;
  statusCounts: Record<string, number>;
  monthlyRevenue: Array<{
    month: string;
    estimatedActiveRevenueUsd: number;
    activePurchases: number;
  }>;
  source: {
    table: "data_purchases";
    revenueBasis: "catalog_price_for_active_purchases";
  };
  error?: string;
};

function monthKey(value: string | null): string {
  if (!value) return "Unpaid";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function isFulfillmentRequired(row: DataPurchaseRow): boolean {
  const status = row.metadata?.fulfillment_status;
  return status === "required" || status === "pending" || status === "queued";
}

function priceFor(product: DataProduct | undefined): number {
  return product?.price_usd && product.price_usd > 0 ? product.price_usd : 0;
}

export async function getDataProductsDashboardReadModel(): Promise<DataProductsDashboardReadModel> {
  const asOf = new Date().toISOString();
  const productsById = new Map(DATA_PRODUCT_CATALOG.map((product) => [product.id, product]));

  const baseModel: DataProductsDashboardReadModel = {
    asOf,
    products: DATA_PRODUCT_CATALOG.map((product) => ({
      product,
      totalPurchases: 0,
      activePurchases: 0,
      pendingPurchases: 0,
      expiredPurchases: 0,
      estimatedActiveRevenueUsd: 0,
      estimatedMrrUsd: 0,
      fulfillmentRequired: 0,
      countries: [],
    })),
    purchaseCount: 0,
    activePurchaseCount: 0,
    pendingPurchaseCount: 0,
    expiredPurchaseCount: 0,
    fulfillmentRequiredCount: 0,
    estimatedActiveRevenueUsd: 0,
    estimatedMrrUsd: 0,
    activeProductCount: DATA_PRODUCT_CATALOG.filter((product) => product.active).length,
    countryCount: new Set(DATA_PRODUCT_CATALOG.flatMap((product) => product.country_scope)).size,
    statusCounts: {},
    monthlyRevenue: [],
    source: {
      table: "data_purchases",
      revenueBasis: "catalog_price_for_active_purchases",
    },
  };

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("data_purchases")
      .select("id, product_id, product_type, country_code, status, purchased_at, expires_at, metadata")
      .order("purchased_at", { ascending: false })
      .limit(5000);

    if (error) {
      return { ...baseModel, error: error.message };
    }

    const rows = (data ?? []) as DataPurchaseRow[];
    const byProduct = new Map(baseModel.products.map((row) => [row.product.id, row]));
    const monthly = new Map<string, { estimatedActiveRevenueUsd: number; activePurchases: number }>();

    for (const row of rows) {
      const product = row.product_id ? productsById.get(row.product_id) : undefined;
      const dashboardRow = product ? byProduct.get(product.id) : undefined;
      const status = row.status ?? "unknown";
      const active = status === "active";
      const pending = status === "pending";
      const expired = status === "expired" || status === "cancelled";
      const priceUsd = priceFor(product);
      const fulfillmentRequired = isFulfillmentRequired(row);

      baseModel.purchaseCount += 1;
      baseModel.statusCounts[status] = (baseModel.statusCounts[status] ?? 0) + 1;
      if (active) baseModel.activePurchaseCount += 1;
      if (pending) baseModel.pendingPurchaseCount += 1;
      if (expired) baseModel.expiredPurchaseCount += 1;
      if (fulfillmentRequired) baseModel.fulfillmentRequiredCount += 1;

      if (active) {
        baseModel.estimatedActiveRevenueUsd += priceUsd;
        if (product?.purchase_type === "subscription") {
          baseModel.estimatedMrrUsd += priceUsd;
        }

        const key = monthKey(row.purchased_at);
        const current = monthly.get(key) ?? { estimatedActiveRevenueUsd: 0, activePurchases: 0 };
        current.estimatedActiveRevenueUsd += priceUsd;
        current.activePurchases += 1;
        monthly.set(key, current);
      }

      if (!dashboardRow) continue;
      dashboardRow.totalPurchases += 1;
      if (active) dashboardRow.activePurchases += 1;
      if (pending) dashboardRow.pendingPurchases += 1;
      if (expired) dashboardRow.expiredPurchases += 1;
      if (active) dashboardRow.estimatedActiveRevenueUsd += priceUsd;
      if (active && product?.purchase_type === "subscription") dashboardRow.estimatedMrrUsd += priceUsd;
      if (fulfillmentRequired) dashboardRow.fulfillmentRequired += 1;
      if (row.country_code && !dashboardRow.countries.includes(row.country_code)) {
        dashboardRow.countries.push(row.country_code);
      }
    }

    return {
      ...baseModel,
      monthlyRevenue: Array.from(monthly.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([month, value]) => ({ month, ...value })),
    };
  } catch (error) {
    return {
      ...baseModel,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
