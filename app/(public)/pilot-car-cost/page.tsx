import type { Metadata } from 'next';
import Link from 'next/link';
import { DollarSign, MapPin, ChevronRight, ArrowRight, CheckCircle, AlertTriangle, Info, Calculator } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How Much Does a Pilot Car Cost? 2026 Rate Guide | Haul Command',
  description: 'Pilot car costs in 2026: $1.65–$2.25/mile for standard escort, $450–$800/day. Height poles $1.90–$2.75/mile. Route surveys $550–$1,200. Full breakdown by region, load type, and state.',
  alternates: { canonical: 'https://www.haulcommand.com/pilot-car-cost' },
};

const RATE_TABLE = [
  { region: 'Southeast', states: 'TX, LA, MS, AL, GA, FL', perMile: '$1.65–$1.85', dayRate: '$450–$575', notes: 'High demand in Permian Basin and Gulf Coast corridors' },
  { region: 'Midwest', states: 'OH, IN, IL, MI, WI, MN', perMile: '$1.75–$1.95', dayRate: '$475–$625', notes: 'Wind energy corridors elevating rates in ND, SD, IA' },
  { region: 'Northeast', states: 'PA, NY, NJ, CT, MA', perMile: '$1.80–$2.05', dayRate: '$500–$650', notes: 'Urban moves command premium. Tight route availability.' },
  { region: 'Southwest', states: 'AZ, NM, CO, UT, NV', perMile: '$1.85–$2.10', dayRate: '$475–$650', notes: 'Remote corridors add deadhead charges' },
  { region: 'West Coast', states: 'CA, OR, WA', perMile: '$2.00–$2.25+', dayRate: '$550–$800', notes: 'CA certification required. Strict rules drive costs up.' },
  { region: 'Mountain/Plains', states: 'MT, WY, ID, KS, NE', perMile: '$1.70–$1.90', dayRate: '$450–$575', notes: 'Oilfield and wind energy work drives demand' },
];

const ADDITIONAL_COSTS = [
  { item: 'Height Pole (lead vehicle)', rate: '$1.90–$2.75/mile or $550–$900/day', when: 'Required when load exceeds 14 ft height (varies by state)' },
  { item: 'Route Survey', rate: '$550–$1,200 per survey', when: 'Required for complex, first-time, or superload moves' },
  { item: 'Police Escort (per officer)', rate: '$31–$65/hour + mileage', when: 'Required for widest loads (16+ ft in most states) or urban routes' },
  { item: 'Bucket Truck / Line Lift', rate: '$2.25–$3.50/mile', when: 'Required when overhead lines must be raised to clear load' },
  { item: 'Deadhead / Repositioning', rate: '$0.75–$1.25/mile', when: 'Charged when pilot car must travel empty to load origin' },
  { item: 'Layover / Detention', rate: '$300–$500/day', when: 'When move is delayed overnight due to permit, weather, or route issues' },
  { item: 'Night Move Premium', rate: '+$0.25–$0.50/mile', when: 'Moves required between sunset and sunrise' },
  { item: 'Weekend / Holiday Premium', rate: '+15–25%', when: 'Moves on weekends, holidays, or emergency dispatches' },
  { item: 'Rush / Emergency Dispatch', rate: '+$150–$400 flat fee', when: 'Same-day or next-day booking with less than 24 hours notice' },
];

const FAQS = [
  {
    q: 'Why does my pilot car quote seem high?',
    a: 'Pilot car rates reflect more than driving. You\'re paying for certification, commercial insurance ($1M+ liability), specialized equipment, radio communication, and expertise. Rates also reflect market demand — if pilots are scarce in your area, prices go up. Haul Command shows you verified rates so you can compare fairly.'
  },
  {
    q: 'Can I negotiate pilot car rates?',
    a: 'Yes, especially for multi-day moves, repeat business, or volume contracts. Rate guides like this are benchmarks — actual rates depend on operator, location, and load specifics. Build relationships with operators you trust and you\'ll get better pricing over time.'
  },
  {
    q: 'Do I pay per mile or per day?',
    a: 'Both models exist. Per-mile is common for point-to-point moves where distance is the main driver. Per-day is common for complex moves with uncertain timing, urban moves with lots of stopping, or multi-day projects. Always clarify which model applies before booking.'
  },
  {
    q: 'What does deadhead mean on a pilot car invoice?',
    a: 'Deadhead is the empty travel from the pilot car\'s home base (or last job) to your load\'s origin. Most operators charge deadhead at a reduced per-mile rate ($0.75–$1.25/mile). If your load starts far from available pilots, deadhead can add significantly to your cost.'
  },
  {
    q: 'How many pilot cars do I need?',
    a: 'It depends on your load dimensions and state rules. One pilot car for loads 12–14 ft wide. Two pilot cars (front + rear) for loads 14–16 ft wide. Two pilot cars + police escort for loads over 16 ft wide (varies by state). Use our free Escort Count Calculator for a definitive answer by load and state.'
  },
  {
    q: 'Are pilot car rates different in other countries?',
    a: 'Yes. In Australia, rates are in AUD per km. In Canada, in CAD per km. In the UK, escort vehicle costs follow different structures tied to STGO categories. Haul Command covers 120 countries — use our global directory to find local rates in your jurisdiction.'
  },
];

export default function PilotCarCostPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-white/[0.06]" style={{ background: 'linear-gradient(135deg, #0B0F14 0%, #111827 60%, #0f1a24 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 py-14">
          <nav className="flex items-center gap-2 text-xs text-amber-200/60 mb-6">
            <Link href="/" className="hover:text-amber-200">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/rates" className="hover:text-amber-200">Rates</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-amber-200/80">Pilot Car Cost</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            How Much Does a<br />
            <span className="text-[#F1A91B]">Pilot Car Cost?</span>
          </h1>
          <p className="text-base text-amber-100/70 leading-relaxed mb-6 max-w-2xl">
            2026 pilot car rates run <strong className="text-white">$1.65–$2.25 per mile</strong> or <strong className="text-white">$450–$800 per day</strong>, depending on region, load type, certifications, and market demand. Height poles, route surveys, and police escorts add to the base rate.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/rates/guide/pilot-car" className="hc-btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4" /> Full 2026 Rate Guide
            </Link>
            <Link href="/tools/escort-count-calculator" className="hc-btn-secondary px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm">
              <Calculator className="w-4 h-4" /> Calculate Escort Cost
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Quick answer callout */}
        <div className="hc-card rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#F1A91B] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-white mb-2">Quick Answer</p>
              <p className="text-sm text-amber-100/80 leading-relaxed">
                For a standard oversize load needing one pilot car on a US highway move, budget <strong className="text-white">$1.65–$2.25 per mile</strong>. A 500-mile move typically costs <strong className="text-white">$825–$1,125</strong> for a single pilot car. Add height poles, route surveys, and police escorts depending on your load dimensions and state requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Regional rate table */}
        <section>
          <h2 className="text-2xl font-black text-white mb-2">2026 Pilot Car Rates by Region</h2>
          <p className="text-sm text-amber-100/70 mb-6">US rates. Rates in Canada are in CAD/km. Australia in AUD/km. See global rates in our directory.</p>
          <div className="hc-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-5 gap-0 bg-white/5 px-5 py-3 text-[10px] font-bold text-amber-200/60 uppercase tracking-widest border-b border-white/[0.06]">
              <div className="col-span-1">Region</div>
              <div className="col-span-1">States</div>
              <div className="col-span-1">Per Mile</div>
              <div className="col-span-1">Day Rate</div>
              <div className="col-span-1">Notes</div>
            </div>
            {RATE_TABLE.map((row, i) => (
              <div key={row.region} className={`grid grid-cols-5 gap-0 px-5 py-4 border-b border-white/[0.06] last:border-0 ${i % 2 === 1 ? 'bg-white/[0.02]' : ''}`}>
                <div className="col-span-1 text-sm font-bold text-white">{row.region}</div>
                <div className="col-span-1 text-xs text-amber-100/60">{row.states}</div>
                <div className="col-span-1 text-sm font-black text-[#F1A91B]">{row.perMile}</div>
                <div className="col-span-1 text-sm font-bold text-white">{row.dayRate}</div>
                <div className="col-span-1 text-xs text-amber-100/60">{row.notes}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-200/50 mt-3">Market benchmarks based on operator-reported rates. Actual rates vary by operator, season, and load specifics.</p>
        </section>

        {/* Additional costs */}
        <section>
          <h2 className="text-2xl font-black text-white mb-2">Additional Costs to Budget For</h2>
          <p className="text-sm text-amber-100/70 mb-6">The base pilot car rate is just the start. Most oversize moves include at least one of these additional line items.</p>
          <div className="space-y-3">
            {ADDITIONAL_COSTS.map(cost => (
              <div key={cost.item} className="hc-card rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-black text-white mb-1">{cost.item}</div>
                    <div className="text-xs text-amber-100/60">{cost.when}</div>
                  </div>
                  <div className="text-sm font-black text-[#F1A91B] whitespace-nowrap">{cost.rate}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cost calculator CTA */}
        <section className="hc-card rounded-2xl p-8 text-center">
          <Calculator className="w-10 h-10 text-[#F1A91B] mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-3">Calculate Your Exact Escort Cost</h2>
          <p className="text-sm text-amber-100/70 mb-6 max-w-md mx-auto">
            Enter your load dimensions, origin, destination, and state. Get an instant escort requirement count and estimated cost.
          </p>
          <Link href="/tools/escort-count-calculator" className="hc-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm">
            <Calculator className="w-4 h-4" /> Open Escort Cost Calculator
          </Link>
        </section>

        {/* What affects the price */}
        <section>
          <h2 className="text-2xl font-black text-white mb-6">What Affects the Price?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Load Dimensions', desc: 'Wider, taller, and longer loads often require more pilots or specialty equipment like height poles — all of which add cost.' },
              { title: 'State Requirements', desc: 'California requires state-specific PCO certification. That scarcity drives up CA rates versus states with fewer requirements.' },
              { title: 'Market Supply', desc: 'Corridors with escort shortages (see our Shortage Index) command premium rates. Permian Basin and some Midwest wind corridors run 20–40% above typical rates.' },
              { title: 'Time of Day/Week', desc: 'Night moves, weekend moves, and holiday moves all carry premiums. Emergency same-day dispatch adds a flat fee on top.' },
              { title: 'Route Complexity', desc: 'Urban moves, bridge-heavy routes, rail crossings, and complex turning moves cost more due to time and expertise required.' },
              { title: 'Distance and Deadhead', desc: 'Very long moves (500+ miles) may require multiple operators and handoffs. Remote origin points add deadhead costs.' },
            ].map(item => (
              <div key={item.title} className="hc-card rounded-xl p-5">
                <div className="text-sm font-black text-white mb-2">{item.title}</div>
                <p className="text-xs text-amber-100/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Warning */}
        <div className="flex items-start gap-3 p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-white mb-1">Don't Go Cheap on Escort Selection</p>
            <p className="text-sm text-amber-100/70 leading-relaxed">
              An uncertified or underequipped pilot car is a liability, not a cost savings. Many states impose heavy fines on carriers who use unqualified escorts. Haul Command's verified directory only shows operators who meet minimum state requirements. Use it.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-black text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <div key={faq.q} className="hc-card rounded-xl p-6">
                <p className="text-sm font-black text-white mb-2">{faq.q}</p>
                <p className="text-sm text-amber-100/70 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related links — no dead ends */}
        <section className="hc-card rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-200/60 mb-4">Related Resources</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Full 2026 Pilot Car Rate Guide', href: '/rates/guide/pilot-car' },
              { label: 'When Do You Need a Pilot Car?', href: '/when-do-you-need-a-pilot-car' },
              { label: 'What Is a Pilot Car?', href: '/what-is-a-pilot-car' },
              { label: 'Escort Count Calculator', href: '/tools/escort-count-calculator' },
              { label: 'Find Pilot Cars Near You', href: '/directory' },
              { label: 'Shortage Index', href: '/shortage-index' },
            ].map(l => (
              <Link key={l.label} href={l.href}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-amber-500/5 border border-white/10 hover:border-amber-500/20 text-xs font-semibold text-amber-100/80 hover:text-amber-200 transition-all group">
                {l.label}
                <ChevronRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
