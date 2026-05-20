import type { Metadata } from "next";
import Link from "next/link";

import { StorefrontBuyButton } from "@/components/pricing/StorefrontBuyButton";
import { NoDeadEndBlock } from "@/components/ui/NoDeadEndBlock";
import { ProofStrip } from "@/components/ui/ProofStrip";
import {
  detectRequestCountry,
  formatStorefrontPrice,
  getStorefrontProducts,
  groupStorefrontProducts,
} from "@/lib/storefront/pricing";

export const metadata: Metadata = {
  title: "Haul Command Data Products & Pricing",
  description:
    "Buy Haul Command data products, market intelligence, AdGrid signals, and heavy-haul operating reports with localized pricing where available.",
  alternates: {
    canonical: "https://www.haulcommand.com/pricing",
  },
};

const storefrontSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Haul Command Data Products & Pricing",
  url: "https://www.haulcommand.com/pricing",
  description:
    "Storefront for Haul Command data products, market intelligence, AdGrid signals, and heavy-haul operating reports.",
  publisher: { "@type": "Organization", name: "Haul Command", url: "https://www.haulcommand.com" },
};

export default async function PricingPage() {
  const [countryCode, products] = await Promise.all([
    detectRequestCountry(),
    getStorefrontProducts(),
  ]);
  const categories = groupStorefrontProducts(products);
  const isLocalized = countryCode !== "US";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storefrontSchema) }} />
      <ProofStrip variant="bar" />

      <main className="min-h-screen bg-[#0B0F14] text-white">
        <section className="border-b border-white/10 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4950e]/30 bg-[#d4950e]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#F1A91B]">
              Data Monetization Storefront
            </div>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                  Buy the market signals that move heavy haul.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                  Pricing is loaded from Haul Command's live storefront catalog. Each product keeps its sample, methodology, refresh cadence, and Stripe readiness attached to the product code.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Visitor market</div>
                <div className="mt-2 text-3xl font-black text-white">{countryCode}</div>
                {isLocalized ? (
                  <div className="mt-3 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200">
                    Localized pricing resolved at checkout
                  </div>
                ) : (
                  <div className="mt-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
                    U.S. base pricing
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/pricing/${category.slug}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-[#d4950e]/40 hover:text-[#F1A91B]"
                >
                  {category.label}
                  <span className="ml-2 text-xs text-slate-500">{category.products.length}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100">
              The storefront catalog is not available in this environment yet. Once `v_storefront_pricing` is reachable, products will render here without hardcoded prices.
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl space-y-12 px-4 pb-16 sm:px-6 lg:px-8">
          {categories.map((category) => (
            <section key={category.slug} id={category.slug}>
              <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-2xl font-black text-white">{category.label}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {category.products.length} sellable product{category.products.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Link href={`/pricing/${category.slug}`} className="text-sm font-bold text-[#F1A91B] hover:text-white">
                  Open category
                </Link>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {category.products.map((product) => (
                  <article key={product.product_code} className="flex min-h-[360px] flex-col rounded-lg border border-white/10 bg-[#111820] p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F1A91B]">
                          {product.product_type || "Data product"}
                        </div>
                        <h3 className="mt-2 text-lg font-black leading-6 text-white">{product.name}</h3>
                      </div>
                      {product.trial_days ? (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-200">
                          {product.trial_days}d trial
                        </span>
                      ) : null}
                    </div>

                    <p className="min-h-[72px] text-sm leading-6 text-slate-300">{product.description || "Market intelligence product from the Haul Command data catalog."}</p>

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
              </div>
            </section>
          ))}
        </section>

        <section className="border-t border-white/10 px-4 py-10 text-center text-xs text-slate-500">
          <p>Some data © OpenStreetMap contributors</p>
        </section>

        <NoDeadEndBlock
          heading="Need a different Haul Command path?"
          moves={[
            { href: "/claim", icon: "PRO", title: "Claim Profile", desc: "Turn operators into market signal", primary: true, color: "#D4A844" },
            { href: "/advertise", icon: "ADS", title: "Advertise", desc: "Buy sponsor visibility", primary: true, color: "#22C55E" },
            { href: "/directory", icon: "DIR", title: "Directory", desc: "Search providers" },
            { href: "/tools", icon: "TLS", title: "Tools", desc: "Run calculators and checklists" },
          ]}
        />
      </main>
    </>
  );
}
