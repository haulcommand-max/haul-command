import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Haul Command Drone Survey Marketplace — Route Survey Automation',
  description:
    'Connect with drone-certified route surveyors for oversize load permit surveys. Automated clearance mapping, obstacle detection, and bridge height verification across 120 countries.',
};

const SURVEY_TYPES = [
  {
    icon: '🌉',
    name: 'Bridge Clearance Survey',
    desc: 'Drone flies the proposed route, maps every bridge clearance with LiDAR precision. Replaces a truck-and-person drive that takes 4–8 hours.',
    time: '2–4 hours',
    price: 'From $285',
    savings: '80% faster than manual',
  },
  {
    icon: '⚡',
    name: 'Utility Line Survey',
    desc: 'Maps all overhead power lines, telecoms, and traffic signals along the route. Height readings accurate to ±0.5 inches.',
    time: '1–3 hours',
    price: 'From $195',
    savings: '90% cost reduction vs manual',
  },
  {
    icon: '🛣️',
    name: 'Full Route Survey',
    desc: 'End-to-end route survey: clearances, obstacles, road conditions, turning radii, and surface observations. Complete permit intelligence.',
    time: '4–8 hours',
    price: 'From $575',
    savings: 'Replaces 2-day manual survey',
  },
  {
    icon: '📋',
    name: 'Pre-Permit Survey',
    desc: 'Targeted survey to validate specific permit dimensions before filing. Reduces rejected permits and route revision costs.',
    time: '1–2 hours',
    price: 'From $150',
    savings: 'Avoid $2K+ permit rejections',
  },
  {
    icon: '🏭',
    name: 'Project Corridor Survey',
    desc: 'Recurring surveys for giga-factory, wind farm, or infrastructure projects. All loads on the same corridor surveyed once — not 200 times.',
    time: 'Project scoped',
    price: 'Custom pricing',
    savings: 'Project-wide efficiency',
  },
  {
    icon: '🌍',
    name: 'International Survey',
    desc: 'Cross-border route surveys coordinated with local drone operators in our global network. Available in 28 countries currently.',
    time: 'Country-dependent',
    price: 'From $400',
    savings: '28 countries + growing',
  },
];

const HOW_IT_WORKS = [
  { step: '1', icon: '📍', title: 'Submit Route', desc: 'Provide start/end points and load dimensions. We generate the survey scope and match you with a certified drone operator in the area.' },
  { step: '2', icon: '🤖', title: 'Drone Flies', desc: 'Certified drone operator flies the route, capturing LiDAR data, photos, and video. Takes 2–8 hours depending on route length.' },
  { step: '3', icon: '📊', title: 'Data Processed', desc: 'AI processes the flight data into a structured route intelligence report with clearances, obstacles, and permit recommendations.' },
  { step: '4', icon: '📋', title: 'Report Delivered', desc: 'You get a complete route survey report with GPS-tagged measurements, photos, and a permit-ready summary. Within 24 hours of flight.' },
];

const OPERATOR_TYPES = [
  { icon: '🚁', name: 'FAA Part 107 Certified', desc: 'All US operators are Part 107 certified and insured. Equivalent certification required in all 120 countries.' },
  { icon: '📡', name: 'LiDAR Equipped', desc: 'Operators in our marketplace are equipped with commercial-grade LiDAR for precise clearance measurements.' },
  { icon: '🛡️', name: 'Liability Insured', desc: '$1M+ coverage per flight. Required for all operators. Insurance verified during marketplace onboarding.' },
  { icon: '⭐', name: 'Rated & Reviewed', desc: 'Every completed survey gets rated by the broker or operator who ordered it. Ratings visible before booking.' },
];

const FUTURE_STATE = [
  { year: 'Now', desc: 'Manual route surveys (2–4 days, $1,000–$5,000)' },
  { year: '2025', desc: 'Drone surveys in select US corridors (2–8 hours, $150–$575)' },
  { year: '2026', desc: 'AI-automated survey interpretation, instant permit recommendations' },
  { year: '2027', desc: 'Permanent route monitoring — drones resurvey key corridors automatically when routes change' },
  { year: '2030+', desc: 'Digital twin of every permitted corridor in 120 countries, continuously updated' },
];

export default function DroneSurveyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Drone Survey Marketplace</span>
        </nav>

        {/* Hero */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">🚁 Wave 2 — Drone Automation · Now Launching</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Route Surveys in<br />
            <span className="text-indigo-400">Hours, Not Days</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            A manual route survey takes 2 days and costs $1,000–$5,000. A drone does it in 4 hours
            for $285. Haul Command Drone Survey Marketplace connects brokers and operators with
            FAA-certified drone surveyors for oversize load route intelligence — any route, any country.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/drone-survey/order"
              className="bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
            >
              Order a Survey →
            </Link>
            <Link
              href="/drone-survey/become-operator"
              className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors"
            >
              Join as Drone Operator
            </Link>
          </div>
        </header>

        {/* Economics */}
        <section className="mb-16 bg-gradient-to-r from-indigo-500/5 to-transparent border border-indigo-500/15 rounded-2xl p-8">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-4">The Math Is Simple</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { before: '$2,500', after: '$285', label: 'Cost per survey', improvement: '89% cheaper' },
              { before: '2 days', after: '4 hours', label: 'Time to complete', improvement: '12x faster' },
              { before: '±6 inches', after: '±0.5 inches', label: 'Clearance accuracy', improvement: '12x more precise' },
              { before: 'Photo', after: 'GPS+LiDAR', label: 'Data quality', improvement: 'Machine-readable' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-red-400 line-through text-sm">{s.before}</span>
                  <span className="text-gray-500 text-xs">→</span>
                  <span className="text-indigo-400 font-black text-base">{s.after}</span>
                </div>
                <div className="text-white text-xs font-bold">{s.label}</div>
                <div className="text-green-400 text-[10px] mt-0.5">{s.improvement}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Survey Types */}
        <section className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Survey Types</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Every survey type that currently requires a human in a vehicle can be done with a drone</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SURVEY_TYPES.map(s => (
              <div key={s.name} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-indigo-500/20 transition-all">
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="text-white font-bold text-base mb-1">{s.name}</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-4">{s.desc}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-accent font-black text-base">{s.price}</div>
                    <div className="text-gray-600 text-[10px]">{s.time} · {s.savings}</div>
                  </div>
                  <Link
                    href="/drone-survey/order"
                    className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-500/20 transition-colors"
                  >
                    Order →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">How It Works</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Submit, fly, process, deliver — all within 24 hours</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 h-full">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Step {s.step}</div>
                  <h3 className="text-white font-bold text-sm mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-xs">{s.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 -right-3 text-gray-700 z-10">→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Drone Operator Requirements */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2 text-center">Operator Standards</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Every drone operator in our marketplace is vetted and verified</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {OPERATOR_TYPES.map(o => (
              <div key={o.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center hover:border-indigo-500/20 transition-all">
                <div className="text-3xl mb-2">{o.icon}</div>
                <div className="text-white font-bold text-xs mb-1">{o.name}</div>
                <div className="text-gray-500 text-[10px]">{o.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Future State Roadmap */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-6">The Route Survey Future</h2>
          <div className="space-y-3">
            {FUTURE_STATE.map((f, i) => (
              <div key={f.year} className={`flex gap-4 items-start p-4 rounded-xl border ${
                i === 0 ? 'border-red-500/20 bg-red-500/5' :
                i === 1 ? 'border-indigo-500/30 bg-indigo-500/5' :
                'border-white/[0.04] bg-white/[0.02]'
              }`}>
                <span className={`font-black text-sm min-w-[48px] ${
                  i === 0 ? 'text-red-400' :
                  i === 1 ? 'text-indigo-400' :
                  'text-gray-500'
                }`}>{f.year}</span>
                <span className={`text-sm ${i <= 1 ? 'text-white' : 'text-gray-500'}`}>{f.desc}</span>
                {i === 1 && <span className="ml-auto text-indigo-400 text-[10px] font-black whitespace-nowrap">NOW LIVE</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Become an Operator */}
        <section className="mb-16 bg-gradient-to-r from-indigo-500/5 to-transparent border border-indigo-500/15 rounded-2xl p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter mb-3">Already a Drone Operator?</h2>
              <p className="text-gray-400 text-sm mb-4">
                If you hold FAA Part 107 (or equivalent in your country) and have LiDAR or photogrammetry
                capability, you can join our marketplace and get survey orders delivered to you.
                No marketing required — we have the brokers and operators who need this service.
              </p>
              <ul className="space-y-2 mb-4">
                {[
                  'Set your coverage area and availability',
                  'Receive survey requests matching your location',
                  '80% of every survey fee goes to you',
                  'Haul Command handles billing, insurance verification, and dispatching',
                ].map(s => (
                  <li key={s} className="flex gap-2 text-xs text-gray-400">
                    <span className="text-green-400 flex-shrink-0">✓</span> {s}
                  </li>
                ))}
              </ul>
              <Link href="/drone-survey/become-operator" className="text-indigo-400 hover:underline text-sm font-bold">
                Join as Drone Operator →
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { metric: '80%', label: 'Operator revenue share' },
                { metric: '$285–$575', label: 'Average survey payout' },
                { metric: '28', label: 'Countries currently active' },
                { metric: '0', label: 'Marketing cost to you' },
              ].map(m => (
                <div key={m.label} className="flex items-center justify-between bg-white/[0.03] border border-indigo-500/10 rounded-xl px-5 py-3">
                  <span className="text-gray-400 text-sm">{m.label}</span>
                  <span className="text-indigo-400 font-black text-lg">{m.metric}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-3xl tracking-tighter mb-3">Order a Survey. Get Results Tomorrow.</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Available in the US now, expanding to 120 countries in 2025–2026. Enter your route
            and get matched with a certified operator within 15 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/drone-survey/order"
              className="bg-indigo-500 text-white px-10 py-4 rounded-xl font-black text-base hover:bg-indigo-400 transition-colors"
            >
              Order Survey — From $150 →
            </Link>
            <Link
              href="/drone-survey/become-operator"
              className="bg-white/5 text-white px-10 py-4 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/10 transition-colors"
            >
              Join as Drone Operator
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-4">Results delivered within 24 hours · FAA/CASA/CAA certified operators · 120 countries expanding</p>
        </div>
      </main>
    </>
  );
}
