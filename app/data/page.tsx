import type { Metadata } from 'next';
import Link from 'next/link';
import { DATA_PRODUCT_CATALOG } from '@/lib/monetization/data-product-engine';
import { HC_15X_DATA_PRODUCTS } from '@/lib/monetization/data-product-15x-catalog';
import BuyButton from '@/components/data/BuyButton';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';

export const metadata: Metadata = {
  title: 'Haul Command Data Marketplace | 120-Country Heavy Haul Intelligence',
  description: 'Self-serve heavy haul intelligence across 120 countries: corridor demand, operator scarcity, ports, border crossings, permit rules, staging infrastructure, rate benchmarks, and market-entry reports.',
  alternates: {
    canonical: 'https://www.haulcommand.com/data',
  },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Haul Command Data Marketplace',
  description: 'Self-serve heavy haul market intelligence across 120 countries: corridor demand, rate benchmarks, operator scarcity, port pressure, cross-border readiness, permit rules, and infrastructure intelligence.',
  url: 'https://www.haulcommand.com/data',
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What data does Haul Command sell?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Haul Command sells aggregate, confidence-scored heavy haul intelligence: corridor demand snapshots, operator scarcity maps, rate benchmarks, port pressure indexes, cross-border readiness packs, permit and escort requirement datasets, staging infrastructure maps, export files, and enterprise API feeds across 120 countries.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Haul Command sell private personal data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Haul Command data products are designed around aggregate, redacted, confidence-scored market intelligence. Sensitive person-level data is gated, redacted, reviewed, or blocked depending on product and jurisdiction.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I get Haul Command data via API?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Haul Command supports API-oriented data products for developers, brokers, carriers, insurers, infrastructure owners, and enterprise buyers. Self-serve exports are available for supported datasets, with enterprise API access available for larger buyers.',
      },
    },
  ],
};

const PRODUCT_UI: Record<string, { icon: string; color: string; badge?: string }> = {
  corridor_snapshot: { icon: 'Road', color: 'from-blue-500/10', badge: 'Real-time' },
  market_report: { icon: 'Chart', color: 'from-purple-500/10', badge: 'Daily refresh' },
  rate_benchmark: { icon: 'Rates', color: 'from-green-500/10', badge: 'Best value' },
  competitor_tracking: { icon: 'Track', color: 'from-orange-500/10', badge: 'Subscription' },
  claim_gap_report: { icon: 'Gap', color: 'from-cyan-500/10', badge: '$9 one-time' },
  csv_export: { icon: 'CSV', color: 'from-gray-500/10', badge: 'Metered' },
  api_access: { icon: 'API', color: 'from-pink-500/10', badge: 'Enterprise' },
  alert_subscription: { icon: 'Alert', color: 'from-yellow-500/10', badge: 'Included Pro' },
  enterprise_feed: { icon: 'Feed', color: 'from-red-500/10', badge: 'Enterprise' },
};

const FIFTEEN_X_UI: Record<string, { label: string; badge: string }> = {
  'broker-demand-heatmap': { label: 'Demand', badge: 'Broker favorite' },
  'corridor-liquidity-index': { label: 'Liquidity', badge: 'DAT-style signal' },
  'operator-scarcity-map': { label: 'Supply', badge: 'Scarcity map' },
  'port-heavy-haul-pressure-index': { label: 'Ports', badge: 'Port pressure' },
  'cross-border-escort-readiness-pack': { label: 'Borders', badge: 'Cross-border' },
  'infrastructure-staging-yard-map': { label: 'Infra', badge: 'Infrastructure' },
  'permit-escort-requirement-dataset': { label: 'Rules', badge: 'Permit data' },
  'market-entry-war-room-pack': { label: 'War Room', badge: 'Enterprise' },
};

function formatPrice(product: typeof DATA_PRODUCT_CATALOG[number]): string {
  if (product.price_usd === 0) return product.purchase_type === 'metered' ? '$4.99/export (free tier)' : 'Included with Pro';
  if (product.purchase_type === 'subscription') return `$${product.price_usd}/mo`;
  if (product.purchase_type === 'one_time') return `$${product.price_usd}`;
  if (product.purchase_type === 'metered') return `$${product.price_usd}/use`;
  return `$${product.price_usd}`;
}

function format15XPrice(product: typeof HC_15X_DATA_PRODUCTS[number]): string {
  if (product.purchase_model === 'monthly') return `$${product.base_price_usd}/mo+`;
  if (product.purchase_model === 'one_time') return `$${product.base_price_usd}+`;
  if (product.purchase_model === 'metered') return `$${product.base_price_usd}/use+`;
  return `$${product.base_price_usd}-$${product.max_price_usd}`;
}

function toBuyButtonPurchaseType(product: typeof HC_15X_DATA_PRODUCTS[number]) {
  if (product.purchase_model === 'monthly') return 'subscription' as const;
  if (product.purchase_model === 'metered') return 'metered' as const;
  return 'one_time' as const;
}

export default function DataMarketplacePage() {
  const products = DATA_PRODUCT_CATALOG.filter(p => p.active);
  const selfServeProducts = products.filter(p => p.tier_required !== 'enterprise');
  const enterpriseProducts = products.filter(p => p.tier_required === 'enterprise');
  const fifteenXSelfServe = HC_15X_DATA_PRODUCTS.filter(p => p.purchase_model !== 'enterprise');
  const fifteenXEnterprise = HC_15X_DATA_PRODUCTS.filter(p => p.purchase_model === 'enterprise');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="bg-[#0B0B0C] text-white">
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(ellipse at 30% 0%, #3b82f680 0%, transparent 70%)' }} />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400">
                  Heavy Haul Intelligence Marketplace
                </div>
                <FreshnessBadge lastSeenAt={new Date().toISOString()} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-[1.1]">
                The data layer for heavy haul across{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  120 countries
                </span>
              </h1>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                Sellable intelligence from corridors, ports, border crossings, escort scarcity, permits, staging yards,
                operator coverage, broker demand, infrastructure, culture, holidays, and local market behavior. Built for brokers,
                carriers, insurers, permit services, infrastructure owners, sponsors, and developers.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><span className="text-blue-400">*</span> 120-country architecture</span>
                <span className="flex items-center gap-1.5"><span className="text-blue-400">*</span> Ports, borders, corridors</span>
                <span className="flex items-center gap-1.5"><span className="text-blue-400">*</span> Confidence-scored data</span>
                <span className="flex items-center gap-1.5"><span className="text-blue-400">*</span> Self-serve exports + API path</span>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              ['120', 'countries planned for localized heavy-haul intelligence'],
              ['8', '15X data product families beyond basic reports'],
              ['Ports', 'port pressure, staging, border, and industrial-zone overlays'],
              ['Safe', 'aggregate, redacted, confidence-scored export model'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-2xl font-extrabold text-white">{k}</div>
                <div className="text-xs text-gray-400 mt-1 leading-relaxed">{v}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-white mb-2">15X Heavy-Haul Intelligence Products</h2>
          <p className="text-gray-400 mb-8 text-sm">
            These are the high-margin data products customized for Haul Command, not generic scraped lists.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {fifteenXSelfServe.map(product => {
              const ui = FIFTEEN_X_UI[product.id] ?? { label: 'Data', badge: product.purchase_model };
              return (
                <div key={product.id} className="relative bg-gradient-to-br from-blue-500/10 to-[#121214] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all">
                  <span className="absolute top-4 right-4 text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                    {ui.badge}
                  </span>
                  <div>
                    <div className="text-xs font-extrabold tracking-widest uppercase text-blue-300 mb-3">{ui.label}</div>
                    <h3 className="font-bold text-white mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{product.why_it_sells}</p>
                  </div>

                  <div className="border border-white/5 rounded-lg p-3 bg-black/20">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Geography</div>
                    <div className="flex flex-wrap gap-1">
                      {product.geo_granularity.slice(0, 5).map(f => (
                        <span key={f} className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded">{f.replace(/_/g, ' ')}</span>
                      ))}
                      {product.geo_granularity.length > 5 && (
                        <span className="text-xs text-gray-500 px-2 py-0.5">+{product.geo_granularity.length - 5} more</span>
                      )}
                    </div>
                  </div>

                  <div className="border border-white/5 rounded-lg p-3 bg-black/20">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Paid fields</div>
                    <div className="flex flex-wrap gap-1">
                      {product.paid_fields.slice(0, 5).map(f => (
                        <span key={f} className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded">{f.replace(/_/g, ' ')}</span>
                      ))}
                      <span className="text-xs text-gray-500 px-2 py-0.5">+{Math.max(0, product.paid_fields.length - 5)} locked</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <BuyButton
                      productId={product.id}
                      productName={product.name}
                      price={format15XPrice(product)}
                      purchaseType={toBuyButtonPurchaseType(product)}
                      tierRequired={product.privacy_class === 'enterprise_review_required' ? 'enterprise' : 'pro'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <AdGridSlot zone="data_product_sponsor" />
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
          <h2 className="text-2xl font-bold text-white mb-2">Core Self-Serve Data Products</h2>
          <p className="text-gray-400 mb-8 text-sm">Purchase instantly. No sales call required for these products.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {selfServeProducts.map(product => {
              const ui = PRODUCT_UI[product.type] ?? { icon: 'Data', color: 'from-gray-500/10' };
              return (
                <div key={product.id}
                  className={`relative bg-gradient-to-br ${ui.color} to-[#121214] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all group`}>
                  {ui.badge && (
                    <span className="absolute top-4 right-4 text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full text-gray-300">
                      {ui.badge}
                    </span>
                  )}

                  <div>
                    <div className="text-xs font-extrabold tracking-widest uppercase text-blue-300 mb-3">{ui.icon}</div>
                    <h3 className="font-bold text-white mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{product.description}</p>
                  </div>

                  <div className="border border-white/5 rounded-lg p-3 bg-black/20">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Preview fields</div>
                    <div className="flex flex-wrap gap-1">
                      {product.preview_fields.map(f => (
                        <span key={f} className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded">{f.replace(/_/g, ' ')}</span>
                      ))}
                      <span className="text-xs text-gray-500 px-2 py-0.5">+{product.full_fields.length - product.preview_fields.length} locked</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <BuyButton
                      productId={product.id}
                      productName={product.name}
                      price={formatPrice(product)}
                      purchaseType={product.purchase_type}
                      tierRequired={product.tier_required}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-t border-white/5 bg-[#0f1115]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold text-white mb-2">Enterprise Intelligence Feeds</h2>
            <p className="text-gray-400 mb-8 text-sm">
              For logistics companies, insurers, fleet managers, ports, infrastructure owners, governments, and enterprise buyers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[...enterpriseProducts, ...fifteenXEnterprise.map(product => ({
                id: product.id,
                type: 'enterprise_feed' as const,
                name: product.name,
                description: product.why_it_sells,
                price_usd: product.base_price_usd,
                purchase_type: 'one_time' as const,
                tier_required: 'enterprise' as const,
                preview_fields: product.preview_fields,
                full_fields: product.paid_fields,
                refresh_frequency: product.refresh_frequency,
                country_scope: ['ALL'],
                active: true,
              }))].map(product => {
                const ui = PRODUCT_UI[product.type] ?? { icon: 'Feed', color: 'from-gray-500/10' };
                return (
                  <div key={product.id} className="border border-white/10 rounded-2xl p-6 bg-[#121214] hover:border-white/20 transition-all">
                    <div className="text-xs font-extrabold tracking-widest uppercase text-blue-300 mb-3">{ui.icon}</div>
                    <h3 className="font-bold text-white mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">{product.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {product.country_scope.map(c => (
                        <span key={c} className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded">{c === 'ALL' ? '120 countries' : c}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-extrabold text-white">{formatPrice(product)}</span>
                      <BuyButton
                        productId={product.id}
                        productName={product.name}
                        price={formatPrice(product)}
                        purchaseType={product.purchase_type}
                        tierRequired={product.tier_required}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/10 border border-blue-500/20 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Need programmatic access?</h2>
              <p className="text-gray-300 max-w-lg">
                The Haul Command API path gives buyers direct access to operator coverage, corridor intelligence,
                port pressure, permit rules, rate benchmarks, and confidence-scored market snapshots.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Link href="/developers" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-500 transition-all whitespace-nowrap">
                Get a Sandbox API Key
              </Link>
              <Link href="/developers/pricing" className="text-center text-sm text-gray-400 hover:text-white transition-colors">
                View API pricing
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Data Marketplace FAQ</h2>
          <div className="space-y-5">
            {[
              {
                q: 'What makes this different from a generic scraped list?',
                a: 'Haul Command products combine public, platform, partner, manually verified, and derived signals into heavy-haul-specific intelligence: corridors, ports, escorts, permits, infrastructure, border crossings, and local operating rules.',
              },
              {
                q: 'How does this handle 120 countries?',
                a: 'Every country can carry market maturity, language, measurement system, holiday, religion, work-week, permit authority, port behavior, and local terminology overlays instead of pretending every market works like the United States.',
              },
              {
                q: 'Is the data safe to sell?',
                a: 'The product model prioritizes aggregate, redacted, confidence-scored data. Private personal data is not treated as a self-serve export product.',
              },
              {
                q: 'Who buys this?',
                a: 'Brokers, carriers, insurers, port-adjacent businesses, infrastructure owners, permit services, industrial project teams, heavy-haul sponsors, developers, and companies entering new markets.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border border-white/10 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-1.5 text-sm">{q}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="border-t border-white/5 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 justify-center">
            <Link href="/developers" className="hover:text-white transition-colors">Developer API</Link>
            <span>-</span>
            <Link href="/corridors" className="hover:text-white transition-colors">Corridor Intelligence</Link>
            <span>-</span>
            <Link href="/directory" className="hover:text-white transition-colors">Operator Directory</Link>
            <span>-</span>
            <Link href="/advertise" className="hover:text-white transition-colors">Advertise</Link>
            <span>-</span>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </div>
    </>
  );
}
