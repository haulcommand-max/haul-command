import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: '30 Heavy Haul Tools — Route Calculators, Permit Cost, Bridge Formula | Haul Command',
  description:
    'Free oversize load tools: escort calculator, bridge formula, permit cost estimator, curfew calculator, superload meter, axle weight distribution, wind turbine planner, and more. 30 tools for heavy haul professionals.',
};

const TOOL_SUITES = [
  {
    id: 'suite-1',
    title: 'Suite 1 — Load Planning',
    icon: '📦',
    tools: [
      { href: '/tools/route-planner',        icon: '🗺️', title: 'Multi-State Route Planner', desc: 'Auto-detect transit states & combined permit costs',         hot: true },
      { href: '/tools/load-analyzer',       icon: '🔍', title: 'Load Analyzer',         desc: 'Profit score, risk, and hidden costs for any load',          hot: true },
      { href: '/tools/axle-weight',          icon: '⚖️',  title: 'Axle Weight Distribution', desc: 'Per-axle weight check across trailer configurations',    hot: true },
      { href: '/tools/bridge-formula',       icon: '🌉', title: 'Bridge Formula',        desc: 'Federal Formula B — axle legality instant check',            hot: true },
      { href: '/tools/superload-meter',      icon: '🌡️', title: 'Superload Risk Meter',  desc: 'Predictive feasibility scoring for massive moves',           hot: false },
      { href: '/tools/wind-turbine-planner', icon: '🌬️', title: 'Wind Turbine Planner', desc: 'Blade runner, turning radius, and escort for wind energy',   hot: true },
    ],
  },
  {
    id: 'suite-2',
    title: 'Suite 2 — Compliance & Permits',
    icon: '📋',
    tools: [
      { href: '/tools/escort-calculator',  icon: '🧮', title: 'Route Calculator',        desc: 'All escort requirements on every state in your route',       hot: true },
      { href: '/tools/permit-cost',        icon: '💵', title: 'Permit Cost Estimator',   desc: 'Total permit fees + lead times for multi-state moves',       hot: true },
      { href: '/tools/curfew-calculator',  icon: '⏰', title: 'Travel Curfew Calculator', desc: 'Movement windows, weekend lockouts, holiday blackouts',     hot: true },
      { href: '/tools/friday-checker',     icon: '📅', title: 'Friday Checker',          desc: 'Can I move this Friday? Weekend curfew instant check',       hot: false },
      { href: '/tools/compliance-card',    icon: '🛡️', title: 'Compliance Card',         desc: 'Load compliance summary for your move',                     hot: false },
    ],
  },
  {
    id: 'suite-3',
    title: 'Suite 3 — Cost & Quoting',
    icon: '💰',
    tools: [
      { href: '/tools/cost-estimator',   icon: '🧾', title: 'Cost Estimator',     desc: 'Full convoy overhead based on state-specific market data',    hot: false },
      { href: '/tools/rate-advisor',     icon: '💰', title: 'Rate Advisor',       desc: 'Corridor-specific rate recommendations for operators',        hot: true },
      { href: '/tools/regulation-alerts', icon: '🚨', title: 'Corridor Alerts',   desc: 'DOT shutdowns, weather delays, curfew hits before they cost', hot: true },
      { href: '/tools/load-board-ingest', icon: '📥', title: 'Load Board Intel',  desc: 'AI-analyzed loads from major boards with profit scoring',     hot: false },
    ],
  },
  {
    id: 'suite-4',
    title: 'Suite 4 — Route Intelligence',
    icon: '🛤️',
    tools: [
      { href: '/tools/discovery-map',   icon: '🗺️', title: 'Discovery Map',      desc: 'Visual escort supply + demand across all markets',           hot: false },
      { href: '/tools/cross-border',    icon: '🌍', title: 'Cross-Border Comparator', desc: 'Side-by-side regulations for any two countries',        hot: true },
    ],
  },
  {
    id: 'suite-5',
    title: 'Suite 5 — Operator Life',
    icon: '🏨',
    tools: [
      { href: '/tools/hotel-finder',         icon: '🏨', title: 'Lodging & Truck Stops', desc: 'Hotels with pilot car rates + truck stops with showers, scales & WiFi', hot: true },
      { href: '/tools/certifications',       icon: '🎓', title: 'Certification Finder', desc: 'Find PEVO, Flagger, and WITPAC training courses by state', hot: true },
    ],
  },
  {
    id: 'suite-6',
    title: 'Suite 6 — Emerging & Future',
    icon: '🚀',
    tools: [
      { href: '/tools/av-readiness',        icon: '🤖', title: 'AV Readiness Checker', desc: 'Is your route eligible for autonomous heavy haul?',        hot: true },
    ],
  },
];

export default function ToolsPage() {
  const allTools = TOOL_SUITES.flatMap((s) => s.tools);

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Tools</span>
        </nav>

        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
            <span className="text-accent text-xs font-bold">ALL FREE · NO ACCOUNT REQUIRED</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">
            30 Heavy Haul <span className="text-accent">Tools</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            The complete back-office for heavy haul professionals. Escort calculators, permit cost estimators,
            bridge formula checks, curfew windows, and emerging tech tools — all free, all instant.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {allTools.length} tools live
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              57 countries covered
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Edge-powered — instant globally
            </div>
          </div>
        </header>

        {/* Suites */}
        {TOOL_SUITES.map((suite) => (
          <section key={suite.id} className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xl">{suite.icon}</span>
              <h2 className="text-lg font-black text-white tracking-tight">{suite.title}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suite.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group relative bg-white/[0.03] border border-white/[0.06] p-5 rounded-2xl hover:border-accent/30 hover:bg-accent/[0.03] transition-all ag-card-hover ${tool.hot ? 'ring-1 ring-accent/10' : ''}`}
                >
                  {tool.hot && (
                    <span className="absolute top-3 right-3 bg-accent/20 text-accent text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Hot
                    </span>
                  )}
                  <div className="text-2xl mb-2">{tool.icon}</div>
                  <h3 className="text-white font-bold text-sm mb-1 group-hover:text-accent transition-colors">{tool.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{tool.desc}</p>
                  <span className="mt-3 block text-accent text-xs font-bold group-hover:underline">Open tool →</span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-black text-xl tracking-tighter mb-1">
              Operator on <span className="text-accent">Haul Command</span>?
            </h3>
            <p className="text-gray-400 text-sm">Claim your listing and get load alerts when shippers need you.</p>
          </div>
          <Link
            href="/claim"
            className="bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors flex-shrink-0"
          >
            Claim Your Listing →
          </Link>
        </div>
      </main>
    </>
  );
}
