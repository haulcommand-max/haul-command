import { Metadata } from 'next';
import Link from 'next/link';
import {
  Siren, CheckCircle, ArrowRight, Clock,
  MapPin, Radio, Phone, Shield, Truck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Fleet Backup & Emergency Escort Dispatch | Haul Command',
  description: '24/7 emergency escort dispatch. Escort no-shows, last-minute cancellations, route changes — our rescue layer activates in under 15 minutes across 120 countries.',
  keywords: ['emergency escort', 'fleet backup', 'urgent pilot car', 'escort no show', 'emergency dispatch', 'last minute escort', 'rescue escort'],
  openGraph: {
    title: 'Fleet Backup & Emergency Escort Dispatch | Haul Command',
    description: '24/7 emergency escort dispatch with under 15 minute response time across 120 countries.',
    url: 'https://haulcommand.com/services/fleet-backup',
  },
  alternates: { canonical: 'https://haulcommand.com/services/fleet-backup' },
};

const SCENARIOS = [
  {
    icon: Siren,
    title: "Escort No-Show",
    desc: "Your booked escort didn't show? Our rescue system auto-detects missed confirmations and begins replacement matching within 60 seconds.",
  },
  {
    icon: Clock,
    title: "Last-Minute Cancellation",
    desc: "Cancellation 2 hours before the move? Our surge dispatch broadcasts to every available operator within 100 miles.",
  },
  {
    icon: MapPin,
    title: "Mid-Route Emergency",
    desc: "Escort breaks down mid-haul? We dispatch the nearest qualified replacement to your exact GPS location.",
  },
  {
    icon: Truck,
    title: "Multi-Escort Shortage",
    desc: "Need 4 escorts but can only find 2? Our fleet backup layer fills the remaining positions from our 6,900+ operator network.",
  },
  {
    icon: Radio,
    title: "After-Hours Dispatch",
    desc: "Saturday night emergency? Our 24/7 command center operates every hour of every day, including holidays.",
  },
  {
    icon: Shield,
    title: "Asset-Based Fleet",
    desc: "In critical corridors, we maintain our own fleet of backup vehicles for guaranteed coverage when independent operators aren't available.",
  },
];

export default function FleetBackupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="py-16 sm:py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(239,68,68,0.08),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/[0.06]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em]">
              24/7 Emergency Dispatch
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Fleet Backup &{' '}
            <span className="bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
              Rescue Coverage
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            When escorts no-show, cancel, or break down — our rescue dispatch layer activates in under 
            15 minutes. 6,900+ operators. 120 countries. No move left stranded.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/emergency"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 4px 20px rgba(239,68,68,0.3)' }}
            >
              <Phone className="w-4 h-4" /> Emergency Request <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white border border-white/20 hover:border-white/40 transition-colors"
            >
              Talk to Dispatch
            </Link>
          </div>

          {/* SLA Bar */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-center">
            {[
              { value: "< 15 min", label: "Response SLA" },
              { value: "24/7/365", label: "Availability" },
              { value: "120", label: "Countries" },
              { value: "6,900+", label: "Operators" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-xl font-black text-red-400">{value}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black text-center mb-10">When You Need Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCENARIOS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-red-500/20 transition-colors">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: '#ef444412', border: '1px solid #ef444420' }}>
                <Icon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Never Get Stranded Again</h2>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          Add fleet backup coverage to any move. Enterprise carriers get dedicated priority dispatch.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/emergency"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            <Phone className="w-4 h-4" /> Request Now
          </Link>
          <Link
            href="/enterprise"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white border border-white/20 hover:border-white/40 transition-colors"
          >
            Enterprise Plans
          </Link>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Fleet Backup & Emergency Escort Dispatch",
          "provider": { "@type": "Organization", "name": "Haul Command", "url": "https://haulcommand.com" },
          "description": "24/7 emergency escort dispatch with under 15 minute response time. Escort no-shows, cancellations, and breakdowns resolved instantly.",
          "areaServed": { "@type": "Place", "name": "Worldwide" },
          "serviceType": "Emergency Escort Dispatch",
          "availableChannel": { "@type": "ServiceChannel", "serviceUrl": "https://haulcommand.com/emergency", "availableLanguage": ["en", "fr", "es"] },
        }),
      }} />
    </div>
  );
}
