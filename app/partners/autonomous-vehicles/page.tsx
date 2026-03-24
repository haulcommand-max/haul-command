import { Metadata } from 'next';
import Link from 'next/link';
import { PartnerInquiryForm } from '@/components/partners/PartnerInquiryForm';

export const metadata: Metadata = {
  title: 'Escort Dispatch for Autonomous Trucks — AV-Ready Operators | Haul Command',
  description: 'Haul Command connects autonomous vehicle operations teams with HC AV-Ready certified escort operators. Aurora, Kodiak, Waabi, Gatik corridor coverage. 47-min fill time.',
};

const AV_FEATURES = [
  {
    title: 'HC AV-Ready Certified Operators',
    desc: 'Our operators complete AV proximity training, understanding sensor field clearances, communication protocols when there\u2019s no driver, and emergency stop procedures for specific AV platforms.',
  },
  {
    title: 'Platform-Specific Knowledge',
    desc: 'Aurora Driver, Kodiak Driver, Waabi Driver, Torc Aspen \u2014 each platform has different sensor configurations and escort requirements. Our operators are trained on the platforms operating their corridors.',
  },
  {
    title: 'API Integration Available',
    desc: 'Connect your dispatch system to Haul Command via API. Your ops team posts escort requirements directly from your fleet management system. Responses arrive in minutes.',
  },
  {
    title: 'Compliance Documentation',
    desc: 'Every escort engagement generates a digital record: operator certification, insurance verification, route compliance, and completion confirmation. Audit-ready by default.',
  },
];

export default function AVPartnerPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full mb-6">
            For Autonomous Vehicle Operations
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Your autonomous trucks still need<br />
            <span className="text-amber-400">human escorts.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl">
            Haul Command\u2019s HC AV-Ready certified escort operators understand Aurora Driver behavior,
            Kodiak sensor fields, and the protocols that keep everyone safe when there\u2019s no human in the cab.
          </p>
          <div className="flex gap-4">
            <a
              href="#inquiry"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
            >
              Get Operator Coverage
            </a>
            <Link
              href="/training/corporate"
              className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
            >
              Certify Your Network
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem Statement */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
          <h2 className="text-xl font-bold mb-4">The AV escort problem, clearly stated</h2>
          <p className="text-gray-300 mb-4">
            Federal regulations require human escort vehicles for autonomous trucks operating under certain conditions.
            Texas, the primary AV corridor state, requires escorts for loads exceeding standard dimensions regardless
            of the cab configuration. When Aurora\u2019s trucks run oversize freight or when regulatory conditions require
            an escort, there\u2019s been no reliable system to book one.
          </p>
          <p className="text-gray-300">
            Standard escort operators aren\u2019t trained in AV protocols. They don\u2019t know what to do when the truck
            takes autonomous evasive action. They don\u2019t know sensor field clearance requirements. They\u2019re using
            the same radio protocols they\u2019d use with a human driver.
            Haul Command is fixing that.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Built for AV operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AV_FEATURES.map((f) => (
            <div key={f.title} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Corridors */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Active AV corridors with Haul Command coverage</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'I-45 Dallas \u2192 Houston (Aurora)',
            'I-10 Houston \u2192 San Antonio (Kodiak)',
            'I-20 Dallas \u2192 Midland (Kodiak)',
            'I-30 Fort Worth \u2192 Texarkana',
            'US-287 Amarillo Corridor',
            'I-35 San Antonio \u2192 Laredo',
          ].map((corridor) => (
            <div key={corridor} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">
              {corridor}
            </div>
          ))}
        </div>
      </section>

      {/* Inquiry */}
      <section id="inquiry" className="max-w-2xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-2 text-center">Tell us about your AV operations</h2>
        <p className="text-gray-400 text-center mb-8">No sales call required. Tell us your corridors and we\u2019ll show you coverage.</p>
        <PartnerInquiryForm defaultInterest="AV corridor escorts" />
      </section>
    </div>
  );
}
