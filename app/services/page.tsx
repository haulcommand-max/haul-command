'use client';

import Link from 'next/link';
import {
  ArrowRight, Truck, MapPin, Wind, Route, Bot,
  Receipt, Siren, Shield, Award, ClipboardList, Wrench,
  FileCheck, ShieldCheck, ShoppingCart,
} from 'lucide-react';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SERVICES INDEX — Complete service stack
   â”€ Absorbs every ODS service offering, then adds 6 more
     that ODS doesn't have. Each service page is a 
     self-serve product surface with SEO + lead-gen + schema.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const SERVICES = [
  {
    slug: 'pilot-car',
    title: 'Pilot Car Services',
    description: 'Certified pilot car operators for oversize and overweight loads across 50+ countries.',
    longDescription: 'Professional lead and follow escort services across every major corridor in all 50+ countries we serve. Verified operators with $1M+ insurance on file.',
    features: ['Lead vehicle escort', 'Follow vehicle escort', 'Route surveying', 'Height pole operation', 'Communication relay'],
    icon: Truck,
    accent: '#F59E0B',
  },
  {
    slug: 'wide-load-escort',
    title: 'Wide Load Escort',
    description: 'Professional wide load escort operators for permitted oversize cargo transport.',
    longDescription: 'Wide load escort services with trained operators in local regulations, signage requirements, and traffic control procedures for all 120 operating countries.',
    features: ['Oversize banners & flags', 'Traffic control', 'Intersection clearing', 'Bridge height verification', 'Night escort capability'],
    icon: Truck,
    accent: '#3b82f6',
  },
  {
    slug: 'heavy-haul',
    title: 'Heavy Haul Transport',
    description: 'End-to-end heavy haul logistics for industrial equipment, transformers, and machinery.',
    longDescription: 'Specialized heavy haul escort operators who understand bridge weight limits, route restrictions, and permit requirements for extreme loads.',
    features: ['Multi-axle load escorts', 'Bridge weight verification', 'Utility coordination', 'Police escorts', 'Route engineering'],
    icon: Wrench,
    accent: '#8b5cf6',
  },
  {
    slug: 'wind-energy',
    title: 'Wind Energy Transport',
    description: 'Specialized escort services for wind turbine blade, tower, and nacelle transportation.',
    longDescription: 'Wind energy component transport with highly specialized escort operators experienced in turning movements, rural road navigation, and multi-escort coordination.',
    features: ['Blade transport escorts', 'Tower section escorts', 'Nacelle escorts', 'Rural road navigation', 'Multi-state coordination'],
    icon: Wind,
    accent: '#06b6d4',
  },
  {
    slug: 'route-survey',
    title: 'Route Survey Services',
    description: 'Pre-haul route surveys to verify clearances, hazards, and permit compliance.',
    longDescription: 'Qualified route surveyors verify bridge clearances, utility heights, road widths, turning radii, and construction zones along planned routes.',
    features: ['Bridge height verification', 'Road width measurement', 'Turning radius assessment', 'Utility clearance check', 'Digital survey reports'],
    icon: Route,
    accent: '#10b981',
  },
  {
    slug: 'consolidated-invoicing',
    title: 'Consolidated Invoicing',
    description: 'One invoice per project. Multi-escort, multi-state, multi-day — all consolidated.',
    longDescription: 'Stop managing 15 different escort invoices for one load. Our consolidated invoicing system creates a single, clean billing document per project.',
    features: ['Single invoice per project', 'Multi-state consolidation', 'QuickBooks/SAP export', 'Net-30/15/instant terms', 'Automatic documentation'],
    icon: Receipt,
    accent: '#a855f7',
  },
  {
    slug: 'fleet-backup',
    title: 'Fleet Backup & Rescue',
    description: '24/7 emergency escort dispatch. No-shows, cancellations, breakdowns — resolved in under 15 minutes.',
    longDescription: 'Our rescue dispatch layer activates in under 15 minutes when escorts no-show, cancel, or break down. 6,900+ operator network, 50+ countries.',
    features: ['< 15 min response SLA', '24/7/365 availability', 'Surge dispatch', 'Asset-based fleet backup', 'Mid-route replacement'],
    icon: Siren,
    accent: '#ef4444',
  },
  {
    slug: 'risk-mitigation',
    title: 'Risk & Liability Mitigation',
    description: 'Insurance verification, route risk scoring, compliance automation, and GPS oversight.',
    longDescription: 'Six layers of risk protection on every move: insurance verification, route risk scoring, compliance automation, GPS oversight, escrow protection, and incident documentation.',
    features: ['Insurance verification', 'Route risk scoring', 'Compliance automation', 'GPS oversight', 'Escrow protection'],
    icon: Shield,
    accent: '#F59E0B',
  },
  {
    slug: 'project-planning',
    title: 'Project Planning',
    description: 'End-to-end planning for complex multi-escort, multi-state heavy haul operations.',
    longDescription: 'Custom execution plans for wind blades, transformers, and oversized machinery. Multi-escort coordination, permit sequencing, and staging logistics.',
    features: ['Multi-phase scheduling', 'Multi-escort orchestration', 'Route engineering', 'Permit sequencing', 'Cross-border logistics'],
    icon: ClipboardList,
    accent: '#3b82f6',
  },
  {
    slug: 'certification',
    title: 'Certification & Training',
    description: 'CEVO, CSE, and state-specific pilot car certifications. Get certified, get more jobs.',
    longDescription: 'Industry-recognized certification programs. Certified operators earn 40% more and get dispatched 3x faster on the Haul Command platform.',
    features: ['CEVO certification', 'CSE certification', 'State-specific modules', 'Haul Command Verified badge', 'Self-paced training'],
    icon: Award,
    accent: '#C6923A',
  },
  {
    slug: 'autonomous-escort',
    title: 'Autonomous Vehicle Escort',
    description: 'Certified escort services for autonomous and self-driving vehicle testing convoys.',
    longDescription: 'SAE-certified AV escort operators trained in autonomous vehicle convoy management, real-time telemetry, and safety perimeter protocols.',
    features: ['SAE-certified operators', 'Real-time telemetry', 'Convoy management', 'Safety perimeter vehicles', 'Incident reporting'],
    icon: Bot,
    accent: '#6366f1',
  },
  {
    slug: 'permit-filing',
    title: 'Permit Filing & Acquisition',
    description: 'Multi-state oversize load permit acquisition — single and annual permits across all 50 states.',
    longDescription: 'Stop calling each state DOT individually. Haul Command automates multi-state permit filing, tracks processing times, and notifies you when permits are approved.',
    features: ['Single-trip permits', 'Annual/blanket permits', 'Multi-state coordination', 'Processing time tracking', 'Permit document vault'],
    icon: FileCheck,
    accent: '#22d3ee',
  },
  {
    slug: 'insurance-verification',
    title: 'Insurance & COI Vault',
    description: 'Automated insurance verification, COI storage, and expiry alerting for operators and carriers.',
    longDescription: 'Upload COIs once, share with every carrier via secure link. Auto-alerts 30/7/1 days before expiry. Carrier-facing verification portal for instant compliance checks.',
    features: ['COI document vault', 'Auto-expiry alerts', 'Carrier verification links', 'Coverage amount tracking', 'Workers comp verification'],
    icon: ShieldCheck,
    accent: '#f43f5e',
  },
  {
    slug: 'marketplace',
    title: 'Equipment Marketplace',
    description: 'Buy, sell, and rent escort equipment — signs, lights, flags, height poles, and vehicles.',
    longDescription: 'The first marketplace purpose-built for the escort industry. New and used equipment from verified sellers with buyer protection and escrow payments.',
    features: ['Pilot car equipment', 'Signs & banners', 'Lights & safety gear', 'Height poles', 'Used escort vehicles'],
    icon: ShoppingCart,
    accent: '#84cc16',
  },
];

export default function ServicesPage() {
  return (
    <div className=" bg-[#0a0a0a] text-white">
      <section className="py-16 sm:py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(198,146,58,0.08),transparent)] pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Professional Escort Services —{' '}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              120 Countries
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-2">
            The world's most complete escort service stack. From pilot cars to autonomous vehicle escorts, 
            consolidated invoicing to fleet backup — everything in one platform.
          </p>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Find the right operator for every load type. Self-serve or full-service — your choice.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Link aria-label={service.title}
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:bg-white/[0.03]"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${service.accent}30`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${service.accent}12`, border: `1px solid ${service.accent}20` }}>
                  <Icon className="w-5 h-5" style={{ color: service.accent }} />
                </div>
                <h2 className="text-base font-bold mb-2 group-hover:text-amber-400 transition-colors">
                  {service.title}
                </h2>
                <p className="text-sm text-gray-400 mb-4">{service.description}</p>
                <ul className="space-y-1 mb-4">
                  {service.features.slice(0, 3).map((f) => (
                    <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: service.accent }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <span className="inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all"
                  style={{ color: service.accent }}>
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '6,900+', label: 'Verified Operators' },
            { value: '120', label: 'Countries' },
            { value: '14', label: 'Service Categories' },
            { value: '<15 min', label: 'Rescue Response' },
          ].map(s => (
            <div key={s.label} className="text-center py-4 px-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="text-xl font-black bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Need an Escort Operator?</h2>
        <p className="text-gray-400 mb-6">
          Post your load on the Haul Command load board and receive responses from verified operators in minutes — or get a quote for managed, end-to-end logistics.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/quote"
            className="px-8 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #C6923A, #E0B05C)' }}
          >
            Get a Quote
          </Link>
          <Link
            href="/loads"
            className="px-8 py-3 border border-amber-500/30 hover:border-amber-500/60 text-amber-400 font-semibold rounded-xl transition-colors"
          >
            Post a Load
          </Link>
          <Link
            href="/directory"
            className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
          >
            Browse Directory
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Heavy Haul Escort Services",
          "description": "Professional escort services across 50+ countries",
          "numberOfItems": SERVICES.length,
          "itemListElement": SERVICES.map((s, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "item": {
              "@type": "Service",
              "name": s.title,
              "description": s.description,
              "url": `https://haulcommand.com/services/${s.slug}`,
            },
          })),
        }),
      }} />
    </div>
  );
}