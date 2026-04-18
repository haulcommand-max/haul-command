import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin — Haul Command',
  description: 'Haul Command internal operations dashboard.',
  robots: { index: false, follow: false },
};

const NAV_SECTIONS = [
  {
    label: 'ðŸ§ ðŸ‘ï¸âš™ï¸ AI Command',
    links: [
      { href: '/admin/ai-costs', label: 'AI Cost Dashboard', desc: 'Brain spend, latency, success rates' },
      { href: '/admin/batch-jobs', label: 'Batch AI Jobs', desc: 'Run meta, enrich, corridor, regulation batches' },
      { href: '/admin/ai-assets', label: 'AI Assets', desc: 'Generated images and creative' },
      { href: '/admin/ai-review', label: 'AI Review Queue', desc: 'Content pending review' },
    ],
  },
  {
    label: 'ðŸ“Š Revenue & Growth',
    links: [
      { href: '/admin/revenue', label: 'Revenue', desc: 'MRR, Stripe, payouts' },
      { href: '/admin/dashboards', label: 'Analytics', desc: 'Traffic, conversion, funnels' },
      { href: '/admin/ads', label: 'Ads', desc: 'Campaign management' },
      { href: '/admin/social', label: 'Social', desc: 'Content calendar, LinkedIn, YouTube' },
    ],
  },
  {
    label: 'ðŸ—‚ï¸ Content & SEO',
    links: [
      { href: '/admin/content', label: 'Content Queue', desc: 'Blog, LinkedIn, YouTube pipeline' },
      { href: '/admin/content/video-guide', label: 'Video Guide', desc: 'Free-tool video production guide' },
      { href: '/admin/moat', label: 'SEO Moat', desc: 'Directory coverage and gaps' },
    ],
  },
  {
    label: 'ðŸš¨ Operations',
    links: [
      { href: '/admin/directory', label: 'Directory', desc: '7,745 listings management' },
      { href: '/admin/ops', label: 'Ops', desc: 'Platform operations' },
      { href: '/admin/trust', label: 'Trust & Safety', desc: 'Fraud, verification, disputes' },
      { href: '/admin/abuse', label: 'Abuse', desc: 'Reports and bans' },
      { href: '/admin/vendors', label: 'Vendors', desc: 'Third-party integrations' },
    ],
  },
];

export default function AdminPage() {
  return (
    <div className=" bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">HC</div>
            <h1 className="text-2xl font-bold">Haul Command Admin</h1>
          </div>
          <p className="text-gray-500 text-sm">
            3-Brain AI Stack: ðŸ§  Claude THINK · ðŸ‘ï¸ Gemini SEE · âš™ï¸ OpenAI ACT
          </p>
        </div>

        {/* Quick stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Directory Listings', value: '1.5M+', sub: 'across 120 countries' },
            { label: 'AI Cost Dashboard', value: 'ðŸ‘ï¸', href: '/admin/ai-costs', sub: 'Monitor 3-brain spend' },
            { label: 'Batch Jobs', value: 'ðŸš€', href: '/admin/batch-jobs', sub: '$1.76 total to fill all' },
            { label: 'Route Check Tool', value: 'âœ”', href: '/route-check', sub: 'SEO inbound trap' },
          ].map(card => (
            <Link aria-label="Navigation Link"
              key={card.label}
              href={card.href ?? '#'}
              className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 transition-colors group"
            >
              <p className="text-2xl font-bold mb-1 group-hover:text-amber-400 transition-colors">{card.value}</p>
              <p className="text-xs font-medium text-white">{card.label}</p>
              <p className="text-xs text-gray-600 mt-0.5">{card.sub}</p>
            </Link>
          ))}
        </div>

        {/* Nav sections */}
        <div className="space-y-6">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">{section.label}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {section.links.map(link => (
                  <Link aria-label="Navigation Link"
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 hover:bg-white/8 transition-all group"
                  >
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">{link.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{link.desc}</p>
                    </div>
                    <span className="text-gray-600 group-hover:text-amber-400 transition-colors">â†’</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
          <p className="text-xs text-amber-400/70">
            ðŸ“„ Run migration: <code className="text-amber-300">db/migrations/20260324_full_ai_sprint.sql</code> in Supabase SQL Editor to activate all AI features.
          </p>
        </div>
      </div>
    </div>
  );
}