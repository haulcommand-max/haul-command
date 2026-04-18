import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight, Shield, Trophy, Globe, Zap } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { BreadcrumbRail } from '@/components/ui/breadcrumb-rail';

// ══════════════════════════════════════════════════════════════
// DYNAMIC COMPETITOR COMPARISON PAGES
// Per Master Prompt §39: Build comparison pages for
// bottom-of-funnel commercial intent SEO capture.
// Route: /vs/[slug] — data-driven from COMPETITORS registry.
// ══════════════════════════════════════════════════════════════

interface ComparisonRow {
  feature: string;
  hc: boolean;
  hcNote?: string;
  comp: boolean;
  compNote?: string;
}

interface Competitor {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  features: ComparisonRow[];
  whySwitchReasons: { title: string; body: string }[];
}

// ── Competitor data registry (canonical source of truth) ──
const COMPETITORS: Record<string, Competitor> = {
  'oversize-io': {
    slug: 'oversize-io',
    name: 'Oversize.io',
    tagline: 'Calculator tools vs full operating system',
    description: 'Oversize.io offers permit and weight calculators. Haul Command offers that plus a full marketplace, directory, training academy, trust system, and global global coverage.',
    features: [
      { feature: 'Permit cost calculator',     hc: true, hcNote: 'Free, no login',           comp: true,  compNote: 'Login required / gated' },
      { feature: 'Axle weight calculator',      hc: true, hcNote: 'Free, no login',           comp: true,  compNote: 'Partial feature' },
      { feature: 'Superload calculator',        hc: true, hcNote: 'Free',                     comp: false, compNote: 'Not available' },
      { feature: 'Frost law tracker',           hc: true, hcNote: 'Free, push alerts',        comp: false, compNote: 'Not available' },
      { feature: 'Load dimension checker',      hc: true, hcNote: 'Free',                     comp: false, compNote: 'Not available' },
      { feature: 'Route planner',               hc: true, hcNote: 'Free',                     comp: true,  compNote: 'Paid tier only' },
      { feature: 'Operator directory',          hc: true, hcNote: '50+ countries, verified',   comp: false, compNote: 'US only, unverified' },
      { feature: 'Real-time availability',      hc: true, hcNote: 'Live broadcasted feed',    comp: false, compNote: 'Not available' },
      { feature: 'Load board',                  hc: true, hcNote: 'Two-sided marketplace',    comp: false, compNote: 'Not available' },
      { feature: 'Training & certification',    hc: true, hcNote: '6-tier, 50+ courses',      comp: false, compNote: 'Not available' },
      { feature: 'Trust score / verification',  hc: true, hcNote: 'Visible on all profiles',  comp: false, compNote: 'Not available' },
      { feature: 'Push notifications',          hc: true, hcNote: 'Load match, claims, alerts', comp: false, compNote: 'Not available' },
      { feature: 'Global coverage',             hc: true, hcNote: '50+ countries',             comp: false, compNote: 'US only' },
      { feature: 'Mobile app',                  hc: true, hcNote: 'iOS + Android',             comp: true,  compNote: 'iOS + Android' },
      { feature: 'Free tier',                   hc: true, hcNote: 'Most tools free, no wall',  comp: false, compNote: 'Login wall on most tools' },
    ],
    whySwitchReasons: [
      { title: 'Free tools, no login wall', body: 'Every Haul Command tool is fully free and requires no account. Oversize.io gates most functionality behind paid plans.' },
      { title: 'Global operator directory', body: 'Haul Command indexes operators across 50+ countries with real-time availability, trust scores, and verified credentials.' },
      { title: 'Two-sided marketplace', body: 'Haul Command connects brokers and operators through a live load board, real-time capacity feed, and instant request system.' },
      { title: 'Training and certification', body: "Haul Command's Training Academy offers 50+ courses across 6 tiers, including heavy haul certifications." },
    ],
  },
  'ods-north-america': {
    slug: 'ods-north-america',
    name: 'ODS North America',
    tagline: 'Regional dispatch vs global operating system',
    description: 'ODS North America focuses on oversize/overweight permit management in North America. Haul Command adds a full marketplace, global directory, and autonomous dispatch.',
    features: [
      { feature: 'Permit management',           hc: true, hcNote: 'Automated + concierge',    comp: true,  compNote: 'Core product' },
      { feature: 'Route planning',              hc: true, hcNote: 'AI-assisted, multi-stop',   comp: true,  compNote: 'Manual route planning' },
      { feature: 'Operator directory',          hc: true, hcNote: '50+ countries',              comp: false, compNote: 'Not available' },
      { feature: 'Load board',                  hc: true, hcNote: 'Two-sided marketplace',     comp: false, compNote: 'Not available' },
      { feature: 'Trust scores',                hc: true, hcNote: 'Proof-based scoring',       comp: false, compNote: 'Not available' },
      { feature: 'Training academy',            hc: true, hcNote: '50+ courses, 6 tiers',      comp: false, compNote: 'Not available' },
      { feature: 'Real-time availability',      hc: true, hcNote: 'Live status broadcasting',  comp: false, compNote: 'Not available' },
      { feature: 'Escrow payments',             hc: true, hcNote: 'Built-in escrow + QuickPay', comp: false, compNote: 'Not available' },
      { feature: 'Global coverage',             hc: true, hcNote: '50+ countries',              comp: false, compNote: 'North America only' },
      { feature: 'Mobile app',                  hc: true, hcNote: 'iOS + Android',              comp: false, compNote: 'Limited mobile' },
      { feature: 'Free tier',                   hc: true, hcNote: 'Most features free',        comp: false, compNote: 'Enterprise pricing only' },
    ],
    whySwitchReasons: [
      { title: 'Beyond permits', body: 'ODS focuses on permit management. Haul Command handles permits AND the marketplace, payments, trust, and training.' },
      { title: 'Global from day one', body: 'Haul Command covers 50+ countries. ODS is limited to North America.' },
      { title: 'Operator marketplace', body: 'Find and hire verified escort operators directly through the platform instead of separate phone/email workflows.' },
    ],
  },
  'wideloadshipping': {
    slug: 'wideloadshipping',
    name: 'Wide Load Shipping',
    tagline: 'Basic directory vs intelligent platform',
    description: 'Wide Load Shipping provides a basic transport directory. Haul Command adds real-time intelligence, trust verification, escrow payments, and a full operating system.',
    features: [
      { feature: 'Transport directory',         hc: true, hcNote: 'Verified, 50+ countries',   comp: true,  compNote: 'Basic US directory' },
      { feature: 'Quote request system',        hc: true, hcNote: 'Instant + standing orders',  comp: true,  compNote: 'Basic form' },
      { feature: 'Trust scores',                hc: true, hcNote: 'Proof-based scoring',       comp: false, compNote: 'Not available' },
      { feature: 'Real-time availability',      hc: true, hcNote: 'Live status broadcasting',  comp: false, compNote: 'Not available' },
      { feature: 'Permit tools',                hc: true, hcNote: 'Free calculators + concierge', comp: false, compNote: 'Not available' },
      { feature: 'Load board',                  hc: true, hcNote: 'Two-sided marketplace',     comp: false, compNote: 'Not available' },
      { feature: 'Escrow payments',             hc: true, hcNote: 'Built-in escrow',            comp: false, compNote: 'Not available' },
      { feature: 'Training academy',            hc: true, hcNote: '50+ courses',                comp: false, compNote: 'Not available' },
      { feature: 'Mobile app',                  hc: true, hcNote: 'iOS + Android native',       comp: false, compNote: 'No mobile app' },
      { feature: 'Regulation database',         hc: true, hcNote: 'State-by-state requirements', comp: false, compNote: 'Not available' },
    ],
    whySwitchReasons: [
      { title: 'Verified operators', body: 'Every operator on Haul Command has a trust score based on completed jobs, credentials, and proof of service.' },
      { title: 'Live marketplace', body: 'Wide Load Shipping is a static directory. Haul Command is a live marketplace with real-time availability and instant matching.' },
      { title: 'Built-in payments', body: 'Escrow-protected payments, QuickPay advances, and automated invoice generation — no chasing invoices.' },
    ],
  },
  'heavyhaulers': {
    slug: 'heavyhaulers',
    name: 'HeavyHaulers',
    tagline: 'Brokered loads vs open marketplace',
    description: 'HeavyHaulers operates as a freight brokerage. Haul Command is an open marketplace that connects shippers and operators directly with full transparency.',
    features: [
      { feature: 'Freight quotes',              hc: true, hcNote: 'Direct + brokered',         comp: true,  compNote: 'Brokered only' },
      { feature: 'Operator directory',          hc: true, hcNote: 'Open, searchable, verified', comp: false, compNote: 'Closed network' },
      { feature: 'Price transparency',          hc: true, hcNote: 'Public rate intelligence',   comp: false, compNote: 'Markup hidden' },
      { feature: 'Direct operator contact',     hc: true, hcNote: 'Instant messaging + call',   comp: false, compNote: 'Through broker only' },
      { feature: 'Load board',                  hc: true, hcNote: 'Open marketplace',           comp: false, compNote: 'Closed brokerage' },
      { feature: 'Permit tools',                hc: true, hcNote: 'Free calculators',            comp: false, compNote: 'Not available' },
      { feature: 'Trust scores',                hc: true, hcNote: 'Proof-based, public',        comp: false, compNote: 'Not available' },
      { feature: 'Training',                    hc: true, hcNote: '50+ courses',                 comp: false, compNote: 'Not available' },
      { feature: 'Real-time tracking',          hc: true, hcNote: 'GPS + proof of delivery',    comp: true,  compNote: 'Basic tracking' },
      { feature: 'Global coverage',             hc: true, hcNote: '50+ countries',               comp: false, compNote: 'US-focused' },
    ],
    whySwitchReasons: [
      { title: 'No middleman markup', body: 'HeavyHaulers is a broker — they add margin. Haul Command connects you directly to operators with transparent pricing.' },
      { title: 'Open marketplace', body: 'Search, compare, and hire operators directly. See trust scores, real-time availability, and verified credentials before you commit.' },
      { title: 'Full operating system', body: 'Beyond freight brokerage: permits, training, compliance, route planning, analytics — all in one platform.' },
    ],
  },
};

const ALL_COMPETITOR_SLUGS = Object.keys(COMPETITORS);

interface VsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ALL_COMPETITOR_SLUGS.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: VsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const comp = COMPETITORS[slug];
  if (!comp) return { title: 'Comparison | Haul Command' };

  return {
    title: `Haul Command vs ${comp.name} — Full Comparison 2026 | Haul Command`,
    description: `Haul Command vs ${comp.name}: Side-by-side comparison of features, pricing, tools, global coverage, and operator directory. See why Haul Command wins.`,
    alternates: { canonical: `https://www.haulcommand.com/vs/${slug}` },
  };
}

export default async function VsCompetitorPage({ params }: VsPageProps) {
  const { slug } = await params;
  const comp = COMPETITORS[slug];
  if (!comp) notFound();

  const hcWins = comp.features.filter(f => f.hc && !f.comp).length;
  const ties = comp.features.filter(f => f.hc && f.comp).length;
  const compWins = comp.features.filter(f => !f.hc && f.comp).length;
  const otherCompetitors = ALL_COMPETITOR_SLUGS.filter(s => s !== slug);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Haul Command vs ${comp.name}`,
    description: `Feature-by-feature comparison of Haul Command and ${comp.name} for heavy haul logistics.`,
    url: `https://www.haulcommand.com/vs/${slug}`,
  };

  return (
    <>
      <JsonLd data={schema} />
      <div className="bg-hc-bg text-hc-text min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4">
          <BreadcrumbRail
            items={[
              { label: 'Comparisons', href: '/vs' },
              { label: `vs ${comp.name}` },
            ]}
          />
        </div>

        {/* Hero */}
        <div className="border-b border-hc-border bg-gradient-to-r from-hc-surface to-hc-bg">
          <div className="px-4 lg:px-10 py-12 max-w-4xl mx-auto">
            <p className="text-[11px] tracking-[0.2em] text-hc-gold-500 font-semibold mb-3 uppercase">
              Comparison · 2026
            </p>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-hc-text mb-4">
              Haul Command vs {comp.name}
            </h1>
            <p className="text-sm text-hc-muted max-w-2xl">{comp.description}</p>
          </div>
        </div>

        <div className="px-4 lg:px-10 py-10 max-w-4xl mx-auto">
          {/* Score Cards */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-hc-surface border border-hc-border rounded-2xl p-5 text-center">
              <p className="text-3xl font-black text-emerald-400">{hcWins}</p>
              <p className="text-[10px] text-hc-subtle mt-1">Haul Command leads</p>
            </div>
            <div className="bg-hc-surface border border-hc-border rounded-2xl p-5 text-center">
              <p className="text-3xl font-black text-hc-subtle">{ties}</p>
              <p className="text-[10px] text-hc-subtle mt-1">Both offer</p>
            </div>
            <div className="bg-hc-surface border border-hc-border rounded-2xl p-5 text-center">
              <p className="text-3xl font-black text-red-400">{compWins}</p>
              <p className="text-[10px] text-hc-subtle mt-1">{comp.name} only</p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto mb-10 rounded-2xl border border-hc-border bg-hc-surface">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-hc-border">
                  <th className="text-left text-hc-subtle font-semibold py-3 px-4 w-1/3">Feature</th>
                  <th className="text-center text-hc-gold-500 font-bold py-3 px-4">Haul Command</th>
                  <th className="text-center text-hc-subtle font-semibold py-3 px-4">{comp.name}</th>
                </tr>
              </thead>
              <tbody>
                {comp.features.map((row, i) => (
                  <tr key={i} className="border-b border-hc-border/50 hover:bg-hc-elevated/50 transition-colors">
                    <td className="py-3 px-4 text-hc-text font-semibold">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      {row.hc ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 inline" />
                          {row.hcNote && <p className="text-[10px] text-hc-subtle mt-0.5">{row.hcNote}</p>}
                        </>
                      ) : (
                        <XCircle className="h-4 w-4 text-hc-subtle/40 inline" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.comp ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-hc-subtle inline" />
                          {row.compNote && <p className="text-[10px] text-hc-subtle mt-0.5">{row.compNote}</p>}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-hc-subtle/30 inline" />
                          {row.compNote && <p className="text-[10px] text-hc-subtle/50 mt-0.5">{row.compNote}</p>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Why Switch */}
          <div className="bg-hc-surface border border-hc-border rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-hc-text mb-4">
              Why Heavy Haul Professionals Are Switching to Haul Command
            </h2>
            {comp.whySwitchReasons.map((item, i) => (
              <div key={i} className={i < comp.whySwitchReasons.length - 1 ? 'border-b border-hc-border/50 pb-4 mb-4' : ''}>
                <p className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {item.title}
                </p>
                <p className="text-xs text-hc-muted leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-hc-surface to-hc-elevated border border-hc-border rounded-2xl p-8 text-center mb-8">
            <h2 className="text-lg font-bold text-hc-text mb-3">
              Try Haul Command Free — No Credit Card
            </h2>
            <p className="text-sm text-hc-muted mb-6">
              All tools. All public. No login required for core features.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/tools/permit-cost-calculator"
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Try Permit Calculator →
              </Link>
              <Link
                href="/onboarding/start"
                className="border border-hc-gold-500 text-hc-gold-500 hover:bg-hc-gold-500/10 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>

          {/* Other Comparisons */}
          <div className="flex flex-wrap gap-2">
            {otherCompetitors.map(otherSlug => {
              const other = COMPETITORS[otherSlug];
              return (
                <Link
                  key={otherSlug}
                  href={`/vs/${otherSlug}`}
                  className="text-xs bg-hc-surface border border-hc-border text-hc-muted px-3 py-2 rounded-lg hover:border-hc-gold-500/30 transition-colors"
                >
                  vs {other.name} →
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
