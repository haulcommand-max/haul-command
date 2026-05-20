import { headers } from "next/headers";

export type StorefrontBillingInterval = "month" | "year" | "one_time";

export type StorefrontProduct = {
  product_code: string;
  name: string;
  description: string | null;
  product_type: string | null;
  category: string | null;
  price_cents: number | null;
  price_annual_cents: number | null;
  currency_code: string | null;
  country_codes: string[] | null;
  trial_days: number | null;
  stripe_payment_link_monthly_url: string | null;
  stripe_payment_link_annual_url: string | null;
  stripe_payment_link_one_time_url: string | null;
  preview_sample: unknown | null;
  methodology_note: string | null;
  data_as_of: string | null;
  refresh_cadence: string | null;
};

export type StorefrontCategory = {
  slug: string;
  label: string;
  products: StorefrontProduct[];
};

const COUNTRY_HEADER_KEYS = [
  "x-vercel-ip-country",
  "x-country-code",
  "cf-ipcountry",
  "x-user-country",
];

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeStorefrontCategory(value: string | null | undefined) {
  return value?.trim() || "Uncategorized";
}

export function slugifyStorefrontCategory(value: string | null | undefined) {
  return normalizeStorefrontCategory(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "uncategorized";
}

export function labelFromStorefrontCategorySlug(slug: string) {
  return titleCase(slug.replace(/-/g, " "));
}

export async function detectRequestCountry() {
  const headerList = await headers();
  for (const key of COUNTRY_HEADER_KEYS) {
    const value = headerList.get(key);
    if (value && /^[a-z]{2}$/i.test(value)) return value.toUpperCase();
  }
  return "US";
}

export function formatStorefrontPrice(cents: number | null | undefined, currencyCode = "USD") {
  if (typeof cents !== "number" || Number.isNaN(cents)) return "Contact sales";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function groupStorefrontProducts(products: StorefrontProduct[]) {
  const grouped = new Map<string, StorefrontProduct[]>();
  for (const product of products) {
    const label = normalizeStorefrontCategory(product.category);
    grouped.set(label, [...(grouped.get(label) ?? []), product]);
  }

  return Array.from(grouped.entries())
    .map(([label, categoryProducts]) => ({
      slug: slugifyStorefrontCategory(label),
      label,
      products: categoryProducts.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getStorefrontProducts() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = createClient() as any;
  const { data, error } = await supabase
    .from("v_storefront_pricing")
    .select(
      "product_code,name,description,product_type,category,price_cents,price_annual_cents,currency_code,country_codes,trial_days,stripe_payment_link_monthly_url,stripe_payment_link_annual_url,stripe_payment_link_one_time_url,preview_sample,methodology_note,data_as_of,refresh_cadence",
    )
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[storefront/pricing] failed to load v_storefront_pricing", error);
    return [] as StorefrontProduct[];
  }

  return (data ?? []) as StorefrontProduct[];
}

export function findStorefrontCategory(products: StorefrontProduct[], categorySlug: string) {
  return groupStorefrontProducts(products).find((category) => category.slug === categorySlug) ?? null;
}
