import { Metadata } from 'next';
import Link from 'next/link';
import {
  ClipboardList, CheckCircle, ArrowRight, Calendar,
  Users, Map, Truck, Shield, Globe,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Project Planning for Heavy Haul & Oversize Loads | Haul Command',
  description: 'End-to-end project planning for complex heavy haul moves. Multi-escort coordination, permit sequencing, route engineering, and staging logistics across 120 countries.',
  keywords: ['heavy haul project planning', 'oversize load planning', 'transport project management', 'escort coordination', 'heavy haul logistics'],
  openGraph: {
    title: 'Project Planning for Heavy Haul & Oversize Loads | Haul Command',
    description: 'End-to-end project planning for multi-escort, multi-state heavy haul operations.',
    url: 'https://haulcommand.com/services/project-planning',
  },
  alternates: { canonical: 'https://haulcommand.com/services/project-planning' },
};

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Full-Service Coordination",
    desc: "From initial route survey to final delivery, we manage every moving piece of your project â€” escorts, permits, staging, and communications.",
  },
  {
    icon: Calendar,
    title: "Multi-Phase Scheduling",
    desc: "Projects with multiple legs, night moves, or weather-dependent windows get a custom timeline with built-in contingencies.",
  },
  {
    icon: Users,
    title: "Multi-Escort Orchestration",
    desc: "4 escorts across 5 states? 12 escorts for a wind blade project? Our dispatch engine coordinates them all with a single point of contact.",
  },
  {
    icon: Map,
    title: "Route Engineering",
    desc: "Pre-haul route surveys, bridge clearance verification, turning radius assessment, and utility coordination â€” all included.",
  },
  {
    icon: Shield,
    title: "Permit Sequencing",
    desc: "Multi-state permits sequenced correctly with timing windows aligned to your haul schedule. No gaps, no expired permits mid-move.",
  },
  {
    icon: Globe,
    title: "Cross-Border Logistics",
    desc: "U.S.â€“Canada, EU cross-border, or any international move â€” we handle customs escort requirements, documentation, and local compliance.",
  },
];

export default function ProjectPlanningPage() {
  return (
    <div className=" bg-[#0a0a0a] text-white">
      <section className="py-16 sm:py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/[0.06]">
            <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">
              Enterprise Planning
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Project Planning for{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Complex Moves
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Wind blades. Transformers. Oversized machinery. When the move is too complex for a simple dispatch, 
            our project planning team builds you a custom execution plan.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
            >
              Request a Plan <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/enterprise"
              className="px-6 py-3 rounded-xl text-sm font-bold text-white border border-white/20 hover:border-white/40 transition-colors"
            >
              Enterprise Solutions
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-blue-500/20 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: '#3b82f612', border: '1px solid #3b82f620' }}>
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Let Us Plan Your Next Move</h2>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          Our project planning team has coordinated 40,000+ specialized loads. Tell us what you're moving.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
        >
          Get a Custom Plan <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Heavy Haul Project Planning",
          "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://haulcommand.com" },
          "description": "End-to-end project planning for complex heavy haul moves including multi-escort coordination, permit sequencing, and route engineering.",
          "areaServed": { "@type": "Place", "name": "Worldwide" },
          "serviceType": "Project Planning",
        }),
      }} />
    </div>
  );
}