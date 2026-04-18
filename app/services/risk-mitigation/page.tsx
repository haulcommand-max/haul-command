import { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield, CheckCircle, ArrowRight, AlertTriangle,
  FileCheck, Scale, Eye, Lock, Map,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Risk & Liability Mitigation for Oversize Transport | Haul Command',
  description: 'Minimize risk on every heavy haul move. Insurance verification, route risk scoring, compliance automation, and real-time GPS oversight across 50+ countries.',
  keywords: ['risk mitigation heavy haul', 'liability oversize load', 'escort insurance', 'pilot car liability', 'heavy haul compliance', 'transport risk management'],
  openGraph: {
    title: 'Risk & Liability Mitigation for Oversize Transport | Haul Command',
    description: 'Insurance verification, route risk scoring, compliance automation for heavy haul.',
    url: 'https://haulcommand.com/services/risk-mitigation',
  },
  alternates: { canonical: 'https://haulcommand.com/services/risk-mitigation' },
};

const RISK_LAYERS = [
  {
    icon: FileCheck,
    title: "Insurance Verification",
    desc: "Every escort operator on Haul Command carries a minimum $1M insurance policy verified on file. COI documents stored in our encrypted vault and auto-checked before dispatch.",
  },
  {
    icon: Map,
    title: "Route Risk Scoring",
    desc: "Our Corridor Risk Scanner analyzes bridge clearances, weight restrictions, construction zones, and weather conditions to assign a risk score to every route before you dispatch.",
  },
  {
    icon: Scale,
    title: "Compliance Automation",
    desc: "Escort count requirements, permit needs, equipment mandates — auto-checked for every state on the route. Never get fined for a compliance gap again.",
  },
  {
    icon: Eye,
    title: "GPS Oversight",
    desc: "Real-time position tracking on every active escort through our Traccar-integrated GPS system. Know exactly where your escorts are, every mile of the haul.",
  },
  {
    icon: Lock,
    title: "Escrow Protection",
    desc: "All payments run through escrow. Funds release only on confirmed completion. Dispute resolution built into the platform with GPS evidence.",
  },
  {
    icon: AlertTriangle,
    title: "Incident Documentation",
    desc: "In the rare event of an incident, our platform auto-generates documentation packages with GPS logs, timestamps, operator verifications, and communication records.",
  },
];

export default function RiskMitigationPage() {
  return (
    <div className=" bg-[#0a0a0a] text-white">
      <section className="py-16 sm:py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(245,158,11,0.08),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.06]">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">
              Risk Management
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Risk & Liability{' '}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Mitigation
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Every escort verified. Every route scored. Every payment protected. 
            Haul Command wraps every move in six layers of risk protection.
          </p>
          <Link
            href="/onboarding/start?role=carrier"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
          >
            Start Dispatching Safer <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RISK_LAYERS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-amber-500/20 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: '#F59E0B12', border: '1px solid #F59E0B20' }}>
                <Icon className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Move Safer. Ship Smarter.</h2>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          Every carrier on Haul Command gets risk mitigation built in. Enterprise tiers unlock advanced corridor risk analytics.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/onboarding/start" className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-colors">
            Get Started Free
          </Link>
          <Link href="/enterprise" className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors">
            Enterprise Risk Packages
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Risk & Liability Mitigation for Oversize Transport",
          "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://haulcommand.com" },
          "description": "Insurance verification, route risk scoring, compliance automation, and GPS oversight for heavy haul transport across 50+ countries.",
          "areaServed": { "@type": "Place", "name": "Worldwide" },
          "serviceType": "Risk Mitigation",
        }),
      }} />
    </div>
  );
}