import { Metadata } from 'next';
import Link from 'next/link';
import {
  Award, CheckCircle, ArrowRight, BookOpen,
  Shield, Globe, BadgeCheck, GraduationCap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'CEVO, CSE & Pilot Car Certification Programs | Haul Command',
  description: 'Get certified as a professional pilot car operator. CEVO, CSE, state-specific certifications, and Haul Command verified badges. Training programs across 50+ countries.',
  keywords: ['CEVO certification', 'CSE certification', 'pilot car certification', 'escort vehicle training', 'pilot car training program', 'CEVO pilot car'],
  openGraph: {
    title: 'CEVO, CSE & Pilot Car Certification Programs | Haul Command',
    description: 'Professional pilot car certification programs. Get verified, get more jobs.',
    url: 'https://haulcommand.com/services/certification',
  },
  alternates: { canonical: 'https://haulcommand.com/services/certification' },
};

const PROGRAMS = [
  {
    title: "CEVO — Certified Escort Vehicle Operator",
    desc: "The industry-standard certification for pilot car operators. Our CEVO-aligned training covers safety protocols, communication procedures, equipment standards, and state-specific requirements.",
    price: "$299",
    duration: "Self-paced, ~16 hours",
    features: ["Industry-recognized certification", "State-specific modules", "Digital certificate + badge", "Valid for 3 years"],
    accent: "#F59E0B",
  },
  {
    title: "CSE — Certified Safety Escort",
    desc: "Advanced safety escort certification covering complex moves, multi-escort coordination, night operations, and incident response for heavy haul professionals.",
    price: "$449",
    duration: "Self-paced, ~24 hours",
    features: ["Advanced safety protocols", "Multi-escort coordination", "Night operation techniques", "Incident response training"],
    accent: "#3b82f6",
  },
  {
    title: "State-Specific Certifications",
    desc: "Many states require specific certifications or training beyond CEVO/CSE. Our state-specific modules ensure you meet every local requirement.",
    price: "$99/state",
    duration: "2-4 hours per state",
    features: ["State regulation deep-dive", "Equipment checklists", "Compliance verification", "Updated with regulation changes"],
    accent: "#22c55e",
  },
  {
    title: "Haul Command Verified Badge",
    desc: "Complete our verification process to earn the Haul Command Verified badge. Verified operators get priority dispatch, higher visibility, and carrier trust.",
    price: "Free",
    duration: "Background check + docs",
    features: ["Priority dispatch queue", "Directory visibility boost", "Carrier trust signal", "Premium load access"],
    accent: "#C6923A",
  },
];

export default function CertificationPage() {
  return (
    <div className=" bg-[#0a0a0a] text-white">
      <section className="py-16 sm:py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(198,146,58,0.08),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-[#C6923A]/20 bg-[#C6923A]/[0.06]">
            <GraduationCap className="w-3.5 h-3.5 text-[#C6923A]" />
            <span className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em]">
              Certification & Training
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
            Get Certified.{' '}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Get More Jobs.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            CEVO, CSE, and state-specific certifications — all available through Haul Command. 
            Certified operators earn 40% more and get dispatched 3x faster.
          </p>
          <Link
            href="/training"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #C6923A, #E0B05C)' }}
          >
            Browse Programs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROGRAMS.map(({ title, desc, price, duration, features, accent }) => (
            <div key={title} className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-amber-500/20 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent}12`, border: `1px solid ${accent}20` }}>
                  <Award className="w-5 h-5" style={{ color: accent }} />
                </div>
                <div className="text-right">
                  <div className="text-lg font-black" style={{ color: accent }}>{price}</div>
                  <div className="text-[10px] text-gray-500">{duration}</div>
                </div>
              </div>
              <h3 className="font-bold text-white text-base mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">{desc}</p>
              <ul className="space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accent }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Start Your Certification Today</h2>
        <p className="text-gray-400 mb-6 max-w-xl mx-auto">
          Self-paced training. Industry-recognized certifications. Unlock better jobs and higher pay.
        </p>
        <Link
          href="/training"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #C6923A, #E0B05C)' }}
        >
          Start Certification <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "Haul Command Training & Certification",
          "url": "https://haulcommand.com/services/certification",
          "description": "Professional pilot car certification programs including CEVO, CSE, and state-specific training.",
          "offers": [
            { "@type": "Offer", "name": "CEVO Certification", "price": "299", "priceCurrency": "USD" },
            { "@type": "Offer", "name": "CSE Certification", "price": "449", "priceCurrency": "USD" },
          ],
        }),
      }} />
    </div>
  );
}