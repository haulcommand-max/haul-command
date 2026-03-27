import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import HCFaqModule from '@/components/hc/FaqModule';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';

export const metadata: Metadata = {
  title: 'Contact Haul Command — Support, Partnerships & Data Issues',
  description:
    'Reach Haul Command for support, listing disputes, partnership inquiries, API access, and advertising. Multiple contact channels available.',
};

const CONTACT_CHANNELS = [
  {
    icon: '📧',
    title: 'General Support',
    desc: 'Listing issues, account help, and general questions.',
    action: 'mailto:support@haulcommand.com',
    actionLabel: 'support@haulcommand.com',
    type: 'email' as const,
  },
  {
    icon: '🏢',
    title: 'Partnerships & Enterprise',
    desc: 'API integrations, TMS partnerships, fleet and enterprise plans.',
    action: 'mailto:partnerships@haulcommand.com',
    actionLabel: 'partnerships@haulcommand.com',
    type: 'email' as const,
  },
  {
    icon: '📢',
    title: 'Advertising & Sponsorships',
    desc: 'Directory sponsorships, corridor placements, and branded campaigns.',
    action: '/advertise',
    actionLabel: 'View ad inventory →',
    type: 'link' as const,
  },
  {
    icon: '🛡️',
    title: 'Data Issues & Listing Removal',
    desc: 'Report incorrect data, request listing corrections, or remove your listing.',
    action: '/report-data-issue',
    actionLabel: 'Report a data issue →',
    type: 'link' as const,
  },
  {
    icon: '🔗',
    title: 'API & Developer Access',
    desc: 'Integrate Haul Command data into your TMS, brokerage, or fleet tools.',
    action: '/developers',
    actionLabel: 'Developer docs →',
    type: 'link' as const,
  },
  {
    icon: '💼',
    title: 'Broker & Shipper Onboarding',
    desc: 'Dedicated onboarding for freight brokers and shippers managing oversize loads.',
    action: 'mailto:brokers@haulcommand.com',
    actionLabel: 'brokers@haulcommand.com',
    type: 'email' as const,
  },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Contact</span>
        </nav>

        <header className="mb-8 sm:mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 sm:mb-4">
            Contact <span className="text-accent">Haul Command</span>
          </h1>
          <p className="text-[#b0b0b0] text-base sm:text-lg max-w-xl mx-auto">
            We operate the world&apos;s largest pilot car and escort vehicle directory.
            Here&apos;s how to reach us.
          </p>
        </header>

        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {CONTACT_CHANNELS.map((ch) => (
            <div
              key={ch.title}
              className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:border-accent/20 transition-all"
            >
              <div className="text-2xl mb-3">{ch.icon}</div>
              <h2 className="text-white font-bold text-base mb-1.5">{ch.title}</h2>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed">{ch.desc}</p>
              {ch.type === 'email' ? (
                <a
                  href={ch.action}
                  className="text-accent text-sm font-bold hover:underline break-all"
                >
                  {ch.actionLabel}
                </a>
              ) : (
                <Link
                  href={ch.action}
                  className="text-accent text-sm font-bold hover:underline"
                >
                  {ch.actionLabel}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Response Time Expectations */}
        <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-6 sm:p-8 mb-12">
          <h2 className="text-white font-black text-xl tracking-tighter mb-4">
            Response <span className="text-accent">Expectations</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'General Support', time: '< 24 hours', icon: '⚡' },
              { label: 'Data Issues', time: '< 48 hours', icon: '🔧' },
              { label: 'Partnerships', time: '< 3 business days', icon: '🤝' },
            ].map((r) => (
              <div key={r.label} className="text-center">
                <div className="text-lg mb-1">{r.icon}</div>
                <div className="text-white font-bold text-sm">{r.label}</div>
                <div className="text-accent text-xs font-bold">{r.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Quick Actions</h2>
          <p className="text-gray-500 text-sm text-center mb-6">Common requests — no email needed</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/claim', icon: '🏷️', label: 'Claim Profile' },
              { href: '/report-data-issue', icon: '📝', label: 'Fix Data' },
              { href: '/remove-listing', icon: '🗑️', label: 'Remove Listing' },
              { href: '/pricing', icon: '💎', label: 'View Pricing' },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center hover:border-accent/30 transition-all"
              >
                <span className="text-lg">{a.icon}</span>
                <p className="text-xs text-gray-300 mt-1 font-medium">{a.label}</p>
              </Link>
            ))}
          </div>
        </section>

        <HCFaqModule
          items={[
            { question: 'How do I remove my listing?', answer: 'Visit the Remove Listing page and submit your request. We process removals within 48 hours and comply with all applicable privacy regulations.' },
            { question: 'I found incorrect data on my listing. How do I fix it?', answer: 'Use the Report Data Issue page to flag inaccuracies. If you claim your profile, you can edit your profile directly at any time.' },
            { question: 'How do I advertise on Haul Command?', answer: 'Visit our Advertise page to see available sponsorship slots including directory placements, corridor sponsorships, and tool-page banners. Pricing starts at $49/month.' },
            { question: 'Do you offer an API?', answer: 'Yes. Our API provides escort lookup, rate intelligence, and corridor data. Visit the Developer docs for authentication guides, rate limits, and endpoint references.' },
          ]}
        />

        <div className="mt-8">
          <HCTrustGuardrailsModule />
        </div>
      </main>
    </>
  );
}
