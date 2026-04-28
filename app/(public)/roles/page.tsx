import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Car, FileText, TrendingUp, MapPin, Wrench, Truck, BookOpen,
  Shield, Star, Building2, ShoppingBag, Megaphone, BadgeCheck,
  Cpu, DollarSign, Globe, ChevronRight, ArrowRight, CheckCircle,
  Clock, Award, Navigation, Users
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Heavy Haul Role Guide — Pilot Cars, Brokers, Carriers, Permits | Haul Command',
  description: 'Start here for your heavy haul role. Complete guides for pilot car operators, brokers, carriers, permit agents, route surveyors, height pole operators, and every other oversize load professional — across 120 countries.',
  alternates: { canonical: 'https://www.haulcommand.com/roles' },
};

const ROLES = [
  {
    id: 'pilot-car-operator',
    label: 'Pilot Car Operator',
    subtitle: 'PEVO / Escort Vehicle Operator',
    Icon: Car,
    color: '#F1A91B',
    what: 'You drive ahead of or behind oversize loads, clearing the route, warning traffic, and communicating with the load driver.',
    pay: '$1.65–$2.25/mile or $450–$800/day depending on state, load type, and certifications.',
    needs: ['State certification or PEVO card', 'Oversize Load sign + amber lights', 'CB/UHF radio', 'Height pole (for over-height loads)', 'Commercial auto insurance', 'Flagging equipment'],
    steps: ['Get state certification (or PEVO training)', 'Insure your vehicle for commercial escort work', 'Buy and mount required equipment', 'Claim your Haul Command profile', 'Connect with brokers through our load board'],
    tools: [
      { label: 'Escort Count Calculator', href: '/tools/escort-count-calculator' },
      { label: 'Rate Guide 2026', href: '/rates/guide/pilot-car' },
      { label: 'Certification Path', href: '/training' },
      { label: 'Equipment Checklist', href: '/training' },
      { label: 'Claim Your Profile', href: '/claim' },
      { label: 'Find Loads', href: '/loads' },
    ],
    countries: true,
    cta: { label: 'Claim Your Pilot Car Profile', href: '/claim' },
  },
  {
    id: 'height-pole-operator',
    label: 'Height Pole Operator',
    subtitle: 'Over-Height Load Specialist',
    Icon: TrendingUp,
    color: '#F1A91B',
    what: 'You operate the lead vehicle equipped with a calibrated height pole that detects overhead obstacles — bridges, utility lines, and traffic signals — before the oversize load reaches them.',
    pay: '$1.90–$2.75/mile. Premium over standard pilot car rates.',
    needs: ['Standard pilot car certification', 'Calibrated height pole', 'Height pole training (required in most states)', 'Special lighting (white wigwag lights in some states)', 'Route pre-survey capability'],
    steps: ['Earn base PEVO certification', 'Complete height pole training', 'Calibrate and document your height pole', 'Get calibration certificate', 'Claim specialist profile on Haul Command', 'Command premium rates'],
    tools: [
      { label: 'Height Pole Requirements', href: '/escort-requirements' },
      { label: 'Height Pole Rate Guide', href: '/rates/guide/pilot-car#height-pole' },
      { label: 'Specialist Profile', href: '/claim' },
      { label: 'Certification Path', href: '/training' },
    ],
    countries: true,
    cta: { label: 'List as Height Pole Specialist', href: '/claim' },
  },
  {
    id: 'route-surveyor',
    label: 'Route Surveyor',
    subtitle: 'Pre-Move Route Assessment Specialist',
    Icon: MapPin,
    color: '#22c55e',
    what: 'You physically drive or analyze the planned route before an oversize load moves. You identify low clearances, weight-restricted bridges, tight turns, overhead hazards, and staging areas.',
    pay: '$550–$1,200 per survey. Day rates $600–$900.',
    needs: ['Pilot car or survey vehicle', 'Measurement equipment', 'Bridge formula knowledge', 'Permit reading ability', 'Report writing skills'],
    steps: ['Build route survey methodology', 'List on Haul Command as route surveyor', 'Connect with permit agents and brokers', 'Build a portfolio of surveyed corridors', 'Offer combined survey + escort packages'],
    tools: [
      { label: 'Route Survey Rates', href: '/rates/guide/oversize-support#route-survey' },
      { label: 'Corridor Map', href: '/corridors' },
      { label: 'Claim Survey Profile', href: '/claim' },
    ],
    countries: true,
    cta: { label: 'List as Route Surveyor', href: '/claim' },
  },
  {
    id: 'broker-dispatcher',
    label: 'Broker / Dispatcher',
    subtitle: 'Oversize Load Coordinator',
    Icon: FileText,
    color: '#3b82f6',
    what: 'You coordinate the movement of oversize loads — finding and booking pilot cars, managing permits, timing movements, and ensuring compliance. You connect carriers with escort services.',
    pay: 'Commission-based. $150–$500+ per move arranged.',
    needs: ['Knowledge of state escort rules', 'Network of certified operators', 'Permit coordination ability', 'Dispatch software or system', 'Insurance (E&O recommended)'],
    steps: ['Learn escort requirements by state', 'Build an operator network', 'Use Haul Command to find available escorts', 'Post loads on our load board', 'Track moves with our dispatch tools'],
    tools: [
      { label: 'Find Escorts', href: '/directory' },
      { label: 'Post a Load', href: '/loads/post' },
      { label: 'Escort Cost Calculator', href: '/tools/escort-count-calculator' },
      { label: 'State Requirements', href: '/escort-requirements' },
      { label: 'Rate Intelligence', href: '/rates' },
    ],
    countries: true,
    cta: { label: 'Post Your First Load', href: '/loads/post' },
  },
  {
    id: 'carrier-driver',
    label: 'Carrier / Driver',
    subtitle: 'Oversize Load Hauler',
    Icon: Truck,
    color: '#8b5cf6',
    what: 'You haul oversize or overweight loads on public roads. You must have proper permits, work with certified escort vehicles, and comply with all state/provincial regulations.',
    pay: 'Varies widely. $3–$6+ per loaded mile for specialty hauls.',
    needs: ['CDL (Class A in most cases)', 'Oversize load permit', 'Certified pilot car(s) based on load dimensions', 'Pre-trip route survey where required', 'FMCSA authority (US interstate)'],
    steps: ['Get the right permits for your load', 'Calculate how many pilot cars you need', 'Hire certified escorts through Haul Command', 'Plan route with any required surveys', 'Execute the move and stay in compliance'],
    tools: [
      { label: 'Do I Need a Pilot Car?', href: '/tools/escort-count-calculator' },
      { label: 'Get Permit Help', href: '/tools/permit-calculator' },
      { label: 'Find Escorts Now', href: '/directory' },
      { label: 'Route Intelligence', href: '/corridors' },
    ],
    countries: true,
    cta: { label: 'Find Certified Escorts', href: '/directory' },
  },
  {
    id: 'permit-agent',
    label: 'Permit Agent / Compliance',
    subtitle: 'Oversize Load Permit Specialist',
    Icon: BookOpen,
    color: '#ec4899',
    what: 'You obtain oversize/overweight permits from state DOTs and other authorities. You interpret regulations, calculate legal routes, and ensure loads move with proper authorization.',
    pay: '$75–$200+ per permit. Volume-based packages with carriers.',
    needs: ['State permit system access', 'Regulation knowledge (50 US states + 120 countries)', 'Bridge formula expertise', 'FMCSA / DOT knowledge', 'Professional liability insurance'],
    steps: ['Build state-by-state permit knowledge', 'Get credentialed with state systems', 'List on Haul Command permit directory', 'Connect with carriers needing permit services', 'Automate with our permit tools'],
    tools: [
      { label: 'Permit Cost Calculator', href: '/tools/permit-calculator' },
      { label: '120-Country Regulations', href: '/regulations' },
      { label: 'State Requirements', href: '/escort-requirements' },
      { label: 'Compliance Copilot', href: '/tools/compliance-card' },
    ],
    countries: true,
    cta: { label: 'List Your Permit Services', href: '/claim' },
  },
  {
    id: 'new-to-heavy-haul',
    label: 'New to Heavy Haul',
    subtitle: 'Career Starter Guide',
    Icon: Star,
    color: '#f59e0b',
    what: 'You\'re exploring a career in heavy haul — whether as a pilot car operator, carrier, broker, or support role. This is your starting point.',
    pay: 'Entry-level pilot car operators earn $40,000–$70,000/year. Experienced specialists earn $80,000–$120,000+.',
    needs: ['Valid driver\'s license', 'Clean driving record', 'Vehicle (your own or financed)', 'State training / certification', 'Commercial auto insurance'],
    steps: ['Read: What is a pilot car?', 'Choose your state and check requirements', 'Get certified through an approved program', 'Buy and mount required equipment', 'Create your free Haul Command profile', 'Start taking jobs through the load board'],
    tools: [
      { label: 'What Is a Pilot Car?', href: '/what-is-a-pilot-car' },
      { label: 'Get Certified', href: '/training' },
      { label: 'Equipment Checklist', href: '/training' },
      { label: 'Industry Glossary', href: '/glossary' },
      { label: 'Create Free Profile', href: '/claim' },
      { label: 'Rate Guide 2026', href: '/rates/guide/pilot-car' },
    ],
    countries: false,
    cta: { label: 'Start Your Pilot Car Career', href: '/training' },
  },
  {
    id: 'bucket-truck',
    label: 'Bucket Truck / Utility Escort',
    subtitle: 'Line-Lift & Utility Support',
    Icon: Wrench,
    color: '#06b6d4',
    what: 'You operate a bucket truck or utility vehicle that lifts power lines, communication cables, and other overhead obstacles to allow oversize loads to pass safely beneath them.',
    pay: '$2.25–$3.50/mile. Day rates $800–$1,400.',
    needs: ['Commercial driver\'s license', 'Bucket truck (properly equipped)', 'Utility coordination experience', 'Power company contact network', 'Insurance covering utility work'],
    steps: ['Certify your crew for utility work', 'Build relationships with utility companies', 'List on Haul Command as utility escort', 'Connect with pilot car companies and brokers', 'Command premium rates for specialty work'],
    tools: [
      { label: 'Bucket Truck Rates', href: '/rates/guide/oversize-support#bucket-truck' },
      { label: 'Claim Utility Profile', href: '/claim' },
      { label: 'Corridor Demand', href: '/corridors' },
    ],
    countries: true,
    cta: { label: 'List as Utility Escort', href: '/claim' },
  },
  {
    id: 'police-authority',
    label: 'Police / Traffic Authority',
    subtitle: 'Law Enforcement Escort Coordination',
    Icon: Shield,
    color: '#6366f1',
    what: 'Law enforcement officers who provide or coordinate mandatory police escorts for the widest, heaviest, and highest-risk oversize loads — particularly in urban areas and on controlled-access highways.',
    pay: '$31–$65/hour (agency rate) plus mileage.',
    needs: ['Law enforcement certification', 'Knowledge of oversize load regulations', 'Escort coordination training', 'Radio communication capability'],
    steps: ['Review state escort requirements for police mandates', 'Coordinate with permit offices', 'Establish agency escort rates', 'List availability on Haul Command', 'Connect with brokers and carriers needing police escorts'],
    tools: [
      { label: 'Police Escort Requirements', href: '/escort-requirements' },
      { label: 'Police Escort Rates', href: '/rates/guide/oversize-support#police' },
      { label: 'State-by-State Rules', href: '/escort-requirements' },
    ],
    countries: true,
    cta: { label: 'List Police Escort Services', href: '/claim' },
  },
  {
    id: 'staging-yard',
    label: 'Staging Yard / Infrastructure',
    subtitle: 'Oversize Load Staging & Parking',
    Icon: Building2,
    color: '#84cc16',
    what: 'You own or operate a yard, lot, or facility that can accommodate oversized equipment, trailers, and loads during permitted movement windows, driver rest breaks, or equipment staging.',
    pay: '$200–$800/night for staging. Monthly contracts with carriers $3,000–$10,000+.',
    needs: ['Large flat surface area', 'Adequate turning radius', 'Security lighting', 'Permission for commercial overnight parking', 'Proximity to major corridors'],
    steps: ['List your facility on Haul Command', 'Set your capacity and pricing', 'Connect with corridor operators', 'Get verified by the Haul Command trust system', 'Accept bookings through the platform'],
    tools: [
      { label: 'List My Staging Yard', href: '/claim' },
      { label: 'Corridor Demand Map', href: '/corridors' },
      { label: 'Infrastructure Partner', href: '/advertise/buy' },
    ],
    countries: false,
    cta: { label: 'List Your Staging Facility', href: '/claim' },
  },
  {
    id: 'equipment-supplier',
    label: 'Equipment Supplier / Installer',
    subtitle: 'Pilot Car Gear & Outfitting',
    Icon: ShoppingBag,
    color: '#f97316',
    what: 'You sell, rent, or install equipment used by pilot car operators — including oversize load signs, amber light bars, height poles, flags, cones, radios, and vehicle outfitting packages.',
    pay: 'Equipment sales $500–$15,000 per operator setup. Installation services $200–$800/vehicle.',
    needs: ['Inventory of required equipment', 'Knowledge of state equipment requirements', 'Installation capability', 'Commercial warranty policy'],
    steps: ['Apply to the Haul Command supplier directory', 'List products by state compliance', 'Connect with new operators needing outfitting', 'Offer state-compliance packages', 'Sponsor category pages'],
    tools: [
      { label: 'Supplier Application', href: '/advertise/buy' },
      { label: 'Equipment Categories', href: '/directory' },
      { label: 'Rate Guide Reference', href: '/rates/guide/pilot-car' },
    ],
    countries: false,
    cta: { label: 'Apply as Equipment Supplier', href: '/advertise/buy' },
  },
  {
    id: 'advertiser-sponsor',
    label: 'Advertiser / Sponsor',
    subtitle: 'Reach the Heavy Haul Industry',
    Icon: Megaphone,
    color: '#e11d48',
    what: 'You want to reach the heavy haul industry — operators, brokers, carriers, and permitting professionals — through targeted advertising, sponsorships, and sponsored content on Haul Command.',
    pay: 'Ad packages from $99/month. Corridor sponsorships $299–$999/month. Category ownership $499+/month.',
    needs: ['A product or service relevant to the heavy haul industry', 'Budget for digital advertising', 'Target geography or corridor in mind'],
    steps: ['Review AdGrid ad products', 'Choose your target: state, corridor, or category', 'Create your ad with our AI generator', 'Track impressions, clicks, and conversions', 'Scale what works'],
    tools: [
      { label: 'View Ad Products', href: '/advertise/buy' },
      { label: 'Get a Proposal', href: '/advertise/buy' },
      { label: 'AdGrid Dashboard', href: '/advertise' },
    ],
    countries: false,
    cta: { label: 'Get Your Advertising Proposal', href: '/advertise/buy' },
  },
];

function RoleCard({ role }: { role: typeof ROLES[0] }) {
  return (
    <div id={role.id} className="hc-card rounded-2xl p-8 scroll-mt-24">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${role.color}20` }}>
              <role.Icon className="w-5 h-5" style={{ color: role.color }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{role.label}</h2>
              <p className="text-xs text-amber-200/60 font-medium">{role.subtitle}</p>
            </div>
          </div>
        </div>
        {role.countries && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold whitespace-nowrap">
            <Globe className="w-3 h-3" /> 120 Countries
          </span>
        )}
      </div>

      {/* What you do */}
      <div className="mb-6">
        <p className="text-sm text-amber-100/80 leading-relaxed">{role.what}</p>
      </div>

      {/* Pay */}
      <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
        <DollarSign className="w-4 h-4 text-[#F1A91B] flex-shrink-0" />
        <span className="text-xs text-amber-200/70 font-medium">Typical pay: </span>
        <span className="text-xs text-white font-bold">{role.pay}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* What you need */}
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" /> What You Need
          </h3>
          <ul className="space-y-1.5">
            {role.needs.map(n => (
              <li key={n} className="flex items-start gap-2 text-xs text-amber-100/70">
                <span className="w-1 h-1 rounded-full bg-amber-400/60 flex-shrink-0 mt-1.5" />
                {n}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps to start */}
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-400" /> How to Start
          </h3>
          <ol className="space-y-1.5">
            {role.steps.map((s, i) => (
              <li key={s} className="flex items-start gap-2 text-xs text-amber-100/70">
                <span className="w-4 h-4 rounded-full bg-white/10 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Tools */}
      <div className="mt-6 pt-5 border-t border-white/[0.06]">
        <h3 className="text-[10px] font-bold text-amber-200/60 uppercase tracking-widest mb-3">Tools & Resources</h3>
        <div className="flex flex-wrap gap-2 mb-5">
          {role.tools.map(t => (
            <Link key={t.label} href={t.href}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 text-xs text-amber-100/80 hover:text-amber-200 transition-all">
              {t.label} →
            </Link>
          ))}
        </div>
        <Link href={role.cta.href}
          className="hc-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm">
          {role.cta.label} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function RolesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-white/[0.06]" style={{ background: 'linear-gradient(135deg, #0B0F14 0%, #111827 60%, #0f1a24 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400/80 mb-3">Haul Command Role Hub</p>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
              Start Here for Your<br />
              <span className="text-[#F1A91B]">Heavy Haul Role</span>
            </h1>
            <p className="text-base text-amber-100/70 leading-relaxed mb-8 max-w-2xl">
              Every role in heavy haul transportation — pilot car operator, broker, carrier, permit agent, route surveyor, and more. What you do, what you earn, what you need, and how Haul Command gets you there. Available across 120 countries.
            </p>
            <div className="flex flex-wrap gap-3">
              {ROLES.slice(0, 6).map(r => (
                <a key={r.id} href={`#${r.id}`}
                  className="hc-chip text-xs flex items-center gap-1.5">
                  <r.Icon className="w-3 h-3" style={{ color: r.color }} />
                  {r.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick role nav */}
      <div className="border-b border-white/[0.06] bg-black/20">
        <div className="max-w-5xl mx-auto px-4 py-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {ROLES.map(r => (
              <a key={r.id} href={`#${r.id}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold text-amber-200/70 hover:text-[#F1A91B] bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-500/30 transition-all whitespace-nowrap">
                <r.Icon className="w-3 h-3" />
                {r.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Role cards */}
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        {ROLES.map(role => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-white/[0.06] bg-black/20">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <Award className="w-10 h-10 text-[#F1A91B] mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-3">Don't See Your Role?</h2>
          <p className="text-sm text-amber-100/70 mb-6 max-w-lg mx-auto">
            Haul Command covers every role in the oversize load ecosystem across 120 countries. If you work in heavy haul, we have a place for you.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/directory" className="hc-btn-primary px-6 py-3 rounded-xl flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" /> Browse the Directory
            </Link>
            <Link href="/claim" className="hc-btn-secondary px-6 py-3 rounded-xl flex items-center gap-2 text-sm">
              <Navigation className="w-4 h-4" /> Claim Your Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
