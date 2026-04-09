import { Metadata } from 'next';
import Link from 'next/link';
import {
  Receipt, CheckCircle, ArrowRight, FileText,
  Globe, DollarSign, Clock, Shield,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Consolidated Invoicing for Heavy Haul & Oversize Loads | Haul Command',
  description: 'One invoice per project. Multi-escort, multi-state, multi-day heavy haul moves — all consolidated into a single billing document. Streamline your escort billing with Haul Command.',
  keywords: ['consolidated invoicing', 'heavy haul billing', 'escort invoicing', 'pilot car billing', 'oversize load billing', 'multi-escort invoice'],
  openGraph: {
    title: 'Consolidated Invoicing for Heavy Haul & Oversize Loads | Haul Command',
    description: 'One invoice per project. Streamline multi-escort billing across states and jurisdictions.',
    url: 'https://haulcommand.com/services/consolidated-invoicing',
  },
  alternates: { canonical: 'https://haulcommand.com/services/consolidated-invoicing' },
};

const BENEFITS = [
  {
    icon: FileText,
    title: "One Invoice Per Project",
    desc: "Whether you use 2 escorts or 20 across 5 states, you get a single, clean invoice. No more reconciling dozens of separate bills.",
  },
  {
    icon: Globe,
    title: "Multi-Jurisdiction, Zero Hassle",
    desc: "Cross-state and cross-border moves automatically consolidated. Each escort's compliance documentation included.",
  },
  {
    icon: DollarSign,
    title: "Flexible Payment Terms",
    desc: "Net-30, Net-15, or instant payment options. Enterprise accounts get custom terms and dedicated billing support.",
  },
  {
    icon: Clock,
    title: "Real-Time Billing Dashboard",
    desc: "Track all active jobs, pending invoices, and payment status in one place. Export to QuickBooks, SAP, or any accounting system.",
  },
  {
    icon: Shield,
    title: "Escrow-Protected Transactions",
    desc: "Every payment runs through our escrow system. Funds release only on confirmed job completion. No disputes, no chargebacks.",
  },
  {
    icon: Receipt,
    title: "Automatic Documentation",
    desc: "COIs, completion confirmations, GPS logs, and regulatory compliance docs attached to every invoice automatically.",
  },
];

export default function ConsolidatedInvoicingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="py-16 sm:py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(168,85,247,0.08),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/[0.06]">
            <Receipt className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em]">
              Billing Made Simple
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Consolidated Invoicing for{' '}
            <span className="bg-gradient-to-r from-purple-400 to-violet-500 bg-clip-text text-transparent">
              Heavy Haul
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            One project. One invoice. Multi-escort, multi-state, multi-day — all consolidated. 
            Stop managing 15 different escort invoices for a single load.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/onboarding/start?role=carrier"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }}
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white border border-white/20 hover:border-white/40 transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-purple-500/20 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: '#a855f712', border: '1px solid #a855f720' }}>
                <Icon className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-center mb-10">How Consolidated Invoicing Works</h2>
        <div className="space-y-6">
          {[
            { step: 1, title: "Dispatch Your Escorts", desc: "Book multiple escorts across any number of states through Haul Command's dispatch system." },
            { step: 2, title: "Jobs Complete & Confirm", desc: "Each escort confirms completion with GPS verification. All documentation auto-captured." },
            { step: 3, title: "Receive One Invoice", desc: "We consolidate all escort charges, compliance docs, and completion records into a single invoice." },
            { step: 4, title: "Pay & Close", desc: "Pay via ACH, wire, or card. Funds release through escrow to operators. Clean, done." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 flex-shrink-0">
                {step}
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Simplify Your Escort Billing?</h2>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          Join carriers who save an average of 12 hours per week on escort invoicing. Free to start.
        </p>
        <Link
          href="/onboarding/start?role=carrier"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' }}
        >
          Start Free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Consolidated Invoicing for Heavy Haul",
          "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://haulcommand.com" },
          "description": "One invoice per project for multi-escort, multi-state heavy haul moves. Streamline escort billing across 120 countries.",
          "areaServed": { "@type": "Place", "name": "Worldwide" },
          "serviceType": "Consolidated Invoicing",
        }),
      }} />
    </div>
  );
}
