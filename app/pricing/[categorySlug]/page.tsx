import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StorefrontBuyButton } from "@/components/pricing/StorefrontBuyButton";
import {
  detectRequestCountry,
  findStorefrontCategory,
  formatStorefrontPrice,
  getStorefrontProducts,
  labelFromStorefrontCategorySlug,
} from "@/lib/storefront/pricing";

type CategoryPricingPageProps = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateMetadata({ params }: CategoryPricingPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const label = labelFromStorefrontCategorySlug(categorySlug);
  return {
    title: `${label} Data Products | Haul Command Pricing`,
    description: `Browse ${label} data products in the Haul Command storefront.`,
    alternates: {
      canonical: `https://www.haulcommand.com/pricing/${categorySlug}`,
    },
  };
}

export default async function CategoryPricingPage({ params }: CategoryPricingPageProps) {
  const { categorySlug } = await params;
  const [countryCode, products] = await Promise.all([
    detectRequestCountry(),
    getStorefrontProducts(),
  ]);
  const category = findStorefrontCategory(products, categorySlug);

  if (!category) return notFound();

  return (
    <main className="min-h-screen bg-[#0B0F14] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/pricing" className="text-sm font-bold text-[#F1A91B] hover:text-white">
          Back to pricing
        </Link>

        <header className="mt-6 border-b border-white/10 pb-8">
          <div className="mb-4 inline-flex rounded-full border border-[#d4950e]/30 bg-[#d4950e]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#F1A91B]">
            {countryCode !== "US" ? "Localized pricing" : "U.S. base pricing"}
          </div>
          <h1 className="text-4xl font-black tracking-tight">{category.label}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Products in this category are loaded from `v_storefront_pricing`; payment links are resolved against the visitor country at purchase time.
          </p>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {category.products.map((product) => (
            <article key={product.product_code} className="flex min-h-[340px] flex-col rounded-lg border border-white/10 bg-[#111820] p-5">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F1A91B]">
                {product.product_type || "Data product"}
              </div>
              <h2 className="mt-2 text-lg font-black leading-6 text-white">{product.name}</h2>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-300">
                {product.description || "Market intelligence product from the Haul Command data catalog."}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Monthly</div>
                  <div className="mt-1 text-xl font-black text-white">
                    {formatStorefrontPrice(product.price_cents, product.currency_code || "USD")}
                  </div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Annual</div>
                  <div className="mt-1 text-xl font-black text-white">
                    {formatStorefrontPrice(product.price_annual_cents, product.currency_code || "USD")}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-400">
                {product.methodology_note ? <p>Methodology: {product.methodology_note}</p> : null}
                {product.refresh_cadence ? <p>Refresh: {product.refresh_cadence}</p> : null}
                {product.data_as_of ? <p>Data as of: {product.data_as_of}</p> : null}
              </div>

              <div className="mt-auto flex gap-2 pt-5">
                <StorefrontBuyButton product={product} countryCode={countryCode} interval="month" className="flex-1 rounded-lg bg-[#d4950e] px-4 py-3 text-sm font-black text-[#0B0F14] transition hover:bg-[#F1A91B]" />
                <StorefrontBuyButton product={product} countryCode={countryCode} interval="year" className="flex-1 rounded-lg border border-[#d4950e]/40 px-4 py-3 text-sm font-black text-[#F1A91B] transition hover:bg-[#d4950e]/10" />
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          Some data &copy; OpenStreetMap contributors
        </footer>
      </div>
    </main>
  );
}
