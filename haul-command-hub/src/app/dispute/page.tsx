import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Haul Command Dispute Resolution — Certified Incident Reports',
  description:
    'GPS-verified incident reports for cargo damage claims, escort disputes, and permit violations. Used by insurance adjusters, law firms, and project owners.',
};

const REPORT_TYPES = [
  { icon: '📍', title: 'GPS Track Report', desc: 'Complete GPS trace for the entire move — every waypoint, speed, timestamp, and deviation from permitted route.', price: '$150' },
  { icon: '⏱️', title: 'Timeline Certification', desc: 'Verified start/end times, escort arrival, load pickup, route milestones, and stop documentation.', price: '$150' },
  { icon: '👤', title: 'Operator Performance Record', desc: 'Full operator history: completion rate, dispute history, safety score, and client ratings as of the incident date.', price: '$100' },
  { icon: '📋', title: 'Permit Documentation Package', desc: 'All permit records, route approvals, dimension verifications, and jurisdiction clearances for the specific move.', price: '$100' },
  { icon: '📊', title: 'Full Incident Package', desc: 'Complete certified report: GPS, timeline, operator record, permits, and platform summary. Used in litigation.', price: '$495' },
  { icon: '🏛️', title: 'Expert Witness Summary', desc: 'Executive summary prepared for legal proceedings, signed by Haul Command data operations.', price: '$750' },
];

const CUSTOMERS = [
  {
    icon: '🏢',
    type: 'Insurance Adjusters',
    desc: 'Cargo damage claims on oversize loads take months to resolve without documentation. Our reports cut investigation time from weeks to hours.',
    value: '$150–$500 per claim • Auto-approve under $5K threshold',
  },
  {
    icon: '⚖️',
    type: 'Law Firms',
    desc: 'Cross-border disputes have no neutral arbiter. GPS-verified, timestamp-certified data beats any self-reported incident account.',
    value: '$500–$5,000 per case • Expert witness available',
  },
  {
    icon: '🏗️',
    type: 'Project Owners',
    desc: 'Giga-factory, wind farm, and infrastructure projects need accountability tracking across every oversize move.',
    value: 'Project retainer pricing • Proactive monitoring',
  },
  {
    icon: '🚛',
    type: 'Hauling Companies',
    desc: 'When a broker or shipper disputes a job you completed, our records are the authoritative proof of performance.',
    value: 'Free for verified operators defending claims',
  },
];

export default function DisputeResolutionPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Dispute Resolution</span>
        </nav>

        {/* Hero */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">🛡️ Certified Incident Reports</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
            The Authoritative Record<br />
            <span className="text-blue-400">for Every Dispute</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            When a load gets damaged, a dispute follows. Lawyers, insurance adjusters, and project owners
            need verified data — not phone calls. We have the GPS, the timestamps, the permits, and the
            operator record. Certified and delivered in 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dispute/request"
              className="bg-blue-500 text-white px-8 py-3.5 rounded-xl font-black text-sm hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20"
            >
              Request a Report →
            </Link>
            <Link
              href="#report-types"
              className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors"
            >
              View Report Types
            </Link>
          </div>
        </header>

        {/* What We Have */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2 text-center">What We Have That No One Else Does</h2>
          <p className="text-gray-500 text-sm text-center mb-8">For every job that runs through Haul Command, we have a verified, tamper-evident record</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: '📍', label: 'GPS Track', sub: 'Every second. Every location.' },
              { icon: '⏱️', label: 'Timestamps', sub: 'Blockchain-anchored records' },
              { icon: '👤', label: 'Operator History', sub: '12-month performance record' },
              { icon: '📋', label: 'Permit Docs', sub: 'All jurisdictions, all moves' },
            ].map(d => (
              <div key={d.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center">
                <div className="text-3xl mb-2">{d.icon}</div>
                <div className="text-white font-bold text-sm">{d.label}</div>
                <div className="text-gray-500 text-[10px] mt-1">{d.sub}</div>
              </div>
            ))}
          </div>
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-5 text-sm text-gray-400">
            <span className="text-blue-400 font-bold">Zero marginal cost.</span> We already have this data for every job.
            Dispute resolution is pure data monetization — the same records that run the platform become
            the evidence that resolves disputes.
          </div>
        </section>

        {/* Who We Serve */}
        <section className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Who Uses Our Reports</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Four distinct customer types, each paying $150–$5,000 per case</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CUSTOMERS.map(c => (
              <div key={c.type} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-blue-500/20 transition-all">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{c.icon}</span>
                  <div>
                    <h3 className="text-white font-bold text-base mb-1">{c.type}</h3>
                    <p className="text-gray-400 text-xs mb-3 leading-relaxed">{c.desc}</p>
                    <div className="text-blue-400 text-xs font-bold">{c.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Report Types */}
        <section id="report-types" className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">Report Types</h2>
          <p className="text-gray-500 text-sm text-center mb-10">Order individually or as a full incident package</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TYPES.map(r => (
              <div key={r.title} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-blue-500/20 transition-all">
                <div className="text-3xl mb-3">{r.icon}</div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-bold text-base">{r.title}</h3>
                  <span className="text-accent font-black text-sm ml-2 flex-shrink-0">{r.price}</span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Submit Request', desc: 'Provide the job ID, date, and parties involved. Takes 2 minutes online or by phone.' },
              { step: '2', title: 'Identity Verification', desc: 'We confirm you have standing to request the report (adjuster, attorney, or direct party).' },
              { step: '3', title: 'Report Generation', desc: 'We pull and certify the data from our platform systems. Zero fabrication possible — data is locked at job close.' },
              { step: '4', title: 'Certified Delivery', desc: 'PDF report with digital signature delivered within 24 hours. Expert witness available on request.' },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 h-full">
                  <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-black text-sm mb-3">{s.step}</div>
                  <h3 className="text-white font-bold text-sm mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-xs">{s.desc}</p>
                </div>
                {i < 3 && <div className="hidden sm:block absolute top-1/2 -right-3 text-gray-700 z-10">→</div>}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-3xl tracking-tighter mb-3">Have a Dispute? Act Fast.</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Incident records are locked immediately at job close. Requesting a report within 30 days
            ensures the most complete data package. Most insurance claims expire within 90 days.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dispute/request"
              className="bg-blue-500 text-white px-10 py-4 rounded-xl font-black text-base hover:bg-blue-400 transition-colors"
            >
              Request Report — $150+ →
            </Link>
            <Link
              href="mailto:disputes@haulcommand.com"
              className="bg-white/5 text-white px-10 py-4 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/10 transition-colors"
            >
              Talk to a Specialist
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-4">Reports available for all jobs on the Haul Command platform · 57 countries · 24h delivery SLA</p>
        </div>
      </main>
    </>
  );
}
