import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ChevronRight, ArrowRight, Calculator, AlertTriangle, CheckCircle, Globe, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'When Do You Need a Pilot Car? Load Dimensions & State Rules | Haul Command',
  description: 'When do you need a pilot car? Most US states require an escort vehicle when a load exceeds 14 ft wide, 14.5 ft tall, or 100 ft long. State-by-state thresholds, plus international rules.',
  alternates: { canonical: 'https://www.haulcommand.com/when-do-you-need-a-pilot-car' },
};

const STATE_THRESHOLDS = [
  { state: 'Texas', width1: '12 ft', width2: '14 ft', height: '17 ft', length: '110 ft', notes: 'Lead + rear required over 14 ft. Police escort over 18 ft.' },
  { state: 'California', width1: '10 ft', width2: '12 ft', height: '15 ft', length: '100 ft', notes: 'CA PCO certification required. No reciprocity.' },
  { state: 'Florida', width1: '12 ft', width2: '14 ft', height: '14.5 ft', length: '100 ft', notes: 'FDOT certification required for operators.' },
  { state: 'Ohio', width1: '12 ft', width2: '14 ft', height: '14.5 ft', length: '100 ft', notes: 'Police escort required over 16 ft wide.' },
  { state: 'Pennsylvania', width1: '12 ft', width2: '14 ft', height: '14.5 ft', length: '100 ft', notes: 'PA requires specific certification.' },
  { state: 'Louisiana', width1: '12 ft', width2: '14 ft', height: '17 ft', length: '100 ft', notes: 'Night restrictions for loads over 14 ft wide.' },
];

const INTERNATIONAL = [
  { country: 'Canada', threshold: 'Varies by province. Generally 3.8–4.5m wide triggers escort requirement.', units: 'Metric (km/m)', body: 'Provincial transport ministries' },
  { country: 'Australia', threshold: 'OSOM loads: pilot vehicles required typically over 3.5m wide or 4.6m high.', units: 'Metric (km/m)', body: 'NHVR / State transport authorities' },
  { country: 'United Kingdom', threshold: 'Abnormal load STGO categories determine escort. Cat 1: notification; Cat 2/3: attendant vehicles.', units: 'Imperial (ft/miles)', body: 'DVSA / Highways England' },
  { country: 'Germany', threshold: 'Schwertransport: escort (Begleitfahrzeug) generally required over 3.5m wide or over route-specific thresholds.', units: 'Metric', body: 'BAG / State road authorities' },
];

const LOAD_TYPES = [
  { type: 'Wind Turbine Blade', notes: 'Almost always requires 2 pilot cars + route survey. Blades can exceed 200 ft and require special dolly configurations.' },
  { type: 'Power Transformer', notes: 'Superload class — requires pilot cars, police escort, and extensive route engineering in most states.' },
  { type: 'Modular/Manufactured Home', notes: 'Typically 14–16 ft wide. 2 pilot cars required in most states. Specific rules for HUD-code vs modular.' },
  { type: 'Construction Equipment', notes: 'Depends on specific equipment dimensions. Excavators and cranes often trigger escort requirements.' },
  { type: 'Industrial Pressure Vessel', notes: 'High weight often the trigger (bridge formula). May need superload permit + escort + engineering review.' },
  { type: 'Oilfield Equipment', notes: 'Variable. Frac tanks, separators, and drill equipment each have different dimension profiles.' },
];

export default function WhenDoYouNeedPilotCarPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-white/[0.06]" style={{ background: 'linear-gradient(135deg, #0B0F14 0%, #111827 60%, #0f1a24 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-14">
          <nav className="flex items-center gap-2 text-xs text-amber-200/60 mb-6">
            <Link href="/" className="hover:text-amber-200">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/escort-requirements" className="hover:text-amber-200">Escort Requirements</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-amber-200/80">When You Need a Pilot Car</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            When Do You Need<br />
            <span className="text-[#F1A91B]">a Pilot Car?</span>
          </h1>
          <p className="text-base text-amber-100/70 leading-relaxed mb-8 max-w-2xl">
            In most US states, a pilot car is required when your load exceeds <strong className="text-white">14 feet wide, 14.5 feet tall, or 100 feet long</strong> — but exact thresholds vary significantly by state. This guide covers the rules you need before moving an oversize load.
          </p>
          <Link href="/tools/escort-count-calculator" className="hc-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm">
            <Calculator className="w-4 h-4" /> Check Your Load — Free Calculator
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Fast answer */}
        <div className="hc-card rounded-2xl p-6 border-l-4 border-l-[#F1A91B]">
          <p className="text-sm font-black text-white mb-3">The Short Answer</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Width', value: 'Over 12–14 ft wide', note: 'One pilot car. Over 14 ft usually means two.' },
              { label: 'Height', value: 'Over 14–14.5 ft tall', note: 'Height pole required in lead vehicle.' },
              { label: 'Length', value: 'Over 100–110 ft', note: 'Rear pilot car often required.' },
            ].map(d => (
              <div key={d.label} className="bg-white/[0.04] rounded-xl p-4">
                <div className="text-[10px] font-bold text-amber-200/60 uppercase tracking-widest mb-1">{d.label}</div>
                <div className="text-base font-black text-[#F1A91B] mb-1">{d.value}</div>
                <div className="text-xs text-amber-100/60">{d.note}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-200/50 mt-4">* US thresholds. Exact rules vary by state. Weight can also trigger escort requirements independent of dimensions.</p>
        </div>

        {/* How many pilot cars */}
        <section>
          <h2 className="text-2xl font-black text-white mb-6">How Many Pilot Cars Do You Need?</h2>
          <div className="space-y-4">
            {[
              {
                width: '12 ft – 14 ft wide',
                count: '1 Pilot Car',
                color: '#22c55e',
                desc: 'One lead or rear pilot car. Most states require the lead position for first-time moves on a route.',
                states: 'Standard in most US states'
              },
              {
                width: '14 ft – 16 ft wide',
                count: '2 Pilot Cars',
                color: '#F1A91B',
                desc: 'Both a lead car (in front) and a chase car (behind the load). Height pole required in lead car if load is over 14–14.5 ft tall.',
                states: 'Most US states, all Canadian provinces'
              },
              {
                width: 'Over 16 ft wide',
                count: '2 Pilot Cars + Police',
                color: '#ef4444',
                desc: 'Pilot cars plus mandatory law enforcement escort in most states. Often requires a dedicated police officer for each jurisdiction the load passes through.',
                states: 'Varies — check state rules for exact thresholds'
              },
              {
                width: 'Superloads (extreme size)',
                count: 'Custom — Full Engineering',
                color: '#8b5cf6',
                desc: 'Superloads require a full movement plan: route survey, engineering sign-off, bridge reviews, utility coordination, advance notice to authorities, and a multi-vehicle escort convoy.',
                states: 'All states have superload permit processes'
              },
            ].map(tier => (
              <div key={tier.width} className="hc-card rounded-xl p-6 flex flex-col md:flex-row gap-5">
                <div className="flex-shrink-0">
                  <div className="text-xs font-bold text-amber-200/60 uppercase tracking-wider mb-1">Load Width</div>
                  <div className="text-lg font-black text-white">{tier.width}</div>
                </div>
                <div className="w-px bg-white/10 hidden md:block" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-black" style={{ color: tier.color }}>{tier.count}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-amber-200/60">{tier.states}</span>
                  </div>
                  <p className="text-xs text-amber-100/70 leading-relaxed">{tier.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* State thresholds table */}
        <section>
          <h2 className="text-2xl font-black text-white mb-2">State-by-State Pilot Car Thresholds</h2>
          <p className="text-sm text-amber-100/70 mb-6">High-traffic states. For the full 50-state breakdown, see our Escort Requirements pages.</p>
          <div className="hc-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-6 px-5 py-3 bg-white/5 border-b border-white/[0.06]">
              {['State', 'Width (1 car)', 'Width (2 cars)', 'Height', 'Length', 'Notes'].map(h => (
                <div key={h} className="text-[10px] font-bold text-amber-200/60 uppercase tracking-widest">{h}</div>
              ))}
            </div>
            {STATE_THRESHOLDS.map((row, i) => (
              <div key={row.state} className={`grid grid-cols-6 px-5 py-4 border-b border-white/[0.06] last:border-0 text-xs ${i % 2 ? 'bg-white/[0.02]' : ''}`}>
                <div className="font-bold text-white">
                  <Link href={`/escort-requirements/${row.state.toLowerCase().replace(' ', '-')}`}
                    className="hover:text-[#F1A91B] transition-colors">{row.state}</Link>
                </div>
                <div className="text-amber-100/70">{row.width1}</div>
                <div className="text-[#F1A91B] font-bold">{row.width2}</div>
                <div className="text-amber-100/70">{row.height}</div>
                <div className="text-amber-100/70">{row.length}</div>
                <div className="text-amber-100/50">{row.notes}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4">
            <Link href="/escort-requirements" className="hc-btn-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
              All 50 States <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/tools/escort-count-calculator" className="hc-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
              <Calculator className="w-4 h-4" /> Calculator
            </Link>
          </div>
        </section>

        {/* Weight triggers */}
        <section>
          <h2 className="text-2xl font-black text-white mb-4">Weight Can Also Trigger Escort Requirements</h2>
          <div className="hc-card rounded-2xl p-6">
            <p className="text-sm text-amber-100/80 leading-relaxed mb-4">
              While dimension thresholds get most of the attention, <strong className="text-white">weight can independently require a pilot car</strong> — especially for superloads. Common weight triggers:
            </p>
            <ul className="space-y-3">
              {[
                'Most states: loads over 200,000 lbs GVW may require pilot cars regardless of dimensions',
                'Bridge formula violations: even legal-width loads may need escorts when bridge weight limits are exceeded',
                'Superload permits (typically 500,000+ lbs) require full escort convoy and route engineering',
                'Some states set lower superload thresholds — always verify with your specific state DOT',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-amber-100/70">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* By load type */}
        <section>
          <h2 className="text-2xl font-black text-white mb-6">Pilot Car Requirements by Common Load Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LOAD_TYPES.map(load => (
              <div key={load.type} className="hc-card rounded-xl p-5">
                <div className="text-sm font-black text-white mb-2">{load.type}</div>
                <p className="text-xs text-amber-100/70 leading-relaxed">{load.notes}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-200/50 mt-4">Load-specific requirements depend on actual dimensions of your specific load. Use the calculator for an accurate count.</p>
        </section>

        {/* International */}
        <section>
          <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-400" /> International Pilot Car Requirements
          </h2>
          <p className="text-sm text-amber-100/70 mb-6">Haul Command covers 120 countries. Here are the rules in major markets:</p>
          <div className="space-y-4">
            {INTERNATIONAL.map(country => (
              <div key={country.country} className="hc-card rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-white mb-1">{country.country}</div>
                    <p className="text-xs text-amber-100/70 leading-relaxed">{country.threshold}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] text-amber-200/50">{country.units}</div>
                    <div className="text-[10px] text-amber-200/50">{country.body}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/regulations" className="hc-btn-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
              <Globe className="w-4 h-4" /> All 120 Countries
            </Link>
          </div>
        </section>

        {/* Bottom actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Calculate Escort Requirements', desc: 'Enter your load dimensions and get an instant escort count by state.', href: '/tools/escort-count-calculator', label: 'Open Calculator', primary: true },
            { title: 'Find Certified Pilot Cars', desc: 'Browse verified pilot car operators near your load origin.', href: '/directory', label: 'Browse Directory', primary: false },
            { title: 'Full Rate Guide', desc: 'What does a pilot car actually cost? 2026 benchmark rates by region.', href: '/pilot-car-cost', label: 'See 2026 Rates', primary: false },
          ].map(action => (
            <div key={action.title} className="hc-card rounded-2xl p-6 flex flex-col">
              <div className="text-sm font-black text-white mb-2">{action.title}</div>
              <p className="text-xs text-amber-100/70 leading-relaxed mb-4 flex-1">{action.desc}</p>
              <Link href={action.href}
                className={action.primary ? 'hc-btn-primary px-4 py-2.5 rounded-xl text-xs text-center' : 'hc-btn-secondary px-4 py-2.5 rounded-xl text-xs text-center'}>
                {action.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
