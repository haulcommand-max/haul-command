import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Download, ChevronRight, ArrowRight, Shield, BookOpen, Truck, Star } from 'lucide-react';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// /resources/forms â€” FORMS HUB
// Absorbs the forms-bundle competitor's entire catalog.
// Free starter templates + paid autofill/vault/branding upgrade path.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export const metadata: Metadata = {
  title: 'Pilot Car Forms & Templates â€” Free Downloads | Haul Command',
  description:
    'Free downloadable forms, checklists, and templates for pilot car operators, heavy haul carriers, and freight brokers. Pre-trip inspection, bill of lading, service agreement, and route packet templates.',
  keywords: [
    'pilot car forms', 'escort vehicle forms', 'oversize load forms', 'heavy haul forms',
    'bill of lading template free', 'pilot car checklist', 'escort pre-trip inspection form',
    'pilot car service agreement template', 'route packet template', 'oversize load paperwork',
    'pilot car forms bundle', 'escort vehicle checklist pdf', 'heavy haul compliance forms',
  ],
  alternates: { canonical: 'https://haulcommand.com/resources/forms' },
  openGraph: {
    title: 'Pilot Car Forms & Templates â€” Free Downloads | Haul Command',
    description: 'The industry\'s most complete collection of pilot car, escort vehicle, and heavy haul forms. Free starter templates.',
    url: 'https://haulcommand.com/resources/forms',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

const FORMS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Pilot Car Forms & Templates',
  description: 'Free downloadable forms, checklists, and templates for pilot car operators and heavy haul professionals.',
  url: 'https://haulcommand.com/resources/forms',
  publisher: { '@type': 'Organization', name: 'Haul Command', url: 'https://haulcommand.com' },
  numberOfItems: 15,
};

interface FormItem {
  slug: string;
  title: string;
  description: string;
  category: string;
  tier: 'free' | 'pro' | 'elite';
  format: string;
  downloadable: boolean;
}

const FORMS: FormItem[] = [
  // â”€â”€ FREE TIER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: 'escort-pre-trip-checklist',
    title: 'Escort Pre-Trip Inspection Checklist',
    description: 'Complete vehicle inspection, safety equipment verification, and communications check before every escort run.',
    category: 'Checklists',
    tier: 'free',
    format: 'PDF',
    downloadable: true,
  },
  {
    slug: 'heavy-haul-readiness-checklist',
    title: 'Heavy Haul Readiness Checklist',
    description: 'Everything you need verified before accepting an oversize load assignment â€” permits, equipment, route, escorts.',
    category: 'Checklists',
    tier: 'free',
    format: 'PDF',
    downloadable: true,
  },
  {
    slug: 'bill-of-lading-template',
    title: 'Bill of Lading (BOL) Template',
    description: 'Industry-standard oversize/heavy haul bill of lading template. Print-ready, legally compliant.',
    category: 'Forms',
    tier: 'free',
    format: 'PDF',
    downloadable: true,
  },
  {
    slug: 'pilot-car-startup-checklist',
    title: 'Pilot Car Startup Checklist',
    description: 'Business formation, insurance, equipment, certification, and first-job checklist for new pilot car operators.',
    category: 'Checklists',
    tier: 'free',
    format: 'PDF',
    downloadable: true,
  },
  {
    slug: 'escort-daily-log',
    title: 'Escort Daily Activity Log',
    description: 'Track daily escort activities, mileage, hours, route conditions, and incidents.',
    category: 'Forms',
    tier: 'free',
    format: 'PDF',
    downloadable: true,
  },

  // â”€â”€ PRO TIER ($29/mo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: 'service-agreement-template',
    title: 'Pilot Car Service Agreement',
    description: 'Legal contract template for escort service engagements. Covers liability, payment terms, scope of work, and insurance.',
    category: 'Contracts',
    tier: 'pro',
    format: 'PDF + Digital',
    downloadable: true,
  },
  {
    slug: 'route-packet-builder',
    title: 'Route Packet Builder',
    description: 'Auto-generated route packet with permit requirements, escort counts, bridge restrictions, and fuel stops.',
    category: 'Packets',
    tier: 'pro',
    format: 'Digital',
    downloadable: false,
  },
  {
    slug: 'operator-compliance-packet',
    title: 'Operator Compliance Packet',
    description: 'Shareable packet: insurance cert, certifications, equipment list, safety record. Send to brokers in one link.',
    category: 'Packets',
    tier: 'pro',
    format: 'Digital + PDF',
    downloadable: false,
  },
  {
    slug: 'invoice-template',
    title: 'Escort Service Invoice Template',
    description: 'Professional invoice template for escort services. Includes mileage, day rate, overnight, and expense tracking.',
    category: 'Forms',
    tier: 'pro',
    format: 'PDF + Digital',
    downloadable: true,
  },
  {
    slug: 'incident-report-form',
    title: 'Incident / Accident Report Form',
    description: 'DOT-style incident report for escorts. Document damage, conditions, and witness info. Insurance-ready.',
    category: 'Forms',
    tier: 'pro',
    format: 'PDF',
    downloadable: true,
  },

  // â”€â”€ ELITE TIER ($79/mo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    slug: 'branded-forms-pack',
    title: 'Branded Company Forms Pack',
    description: 'All forms branded with your company logo, name, and contact. Professional look for every document you send.',
    category: 'Bundles',
    tier: 'elite',
    format: 'Digital + PDF',
    downloadable: false,
  },
  {
    slug: 'audit-ready-compliance-pack',
    title: 'Audit-Ready Compliance Pack',
    description: 'Complete compliance documentation: safety policies, training records, equipment certs, insurance history. FMCSA/DOT-ready.',
    category: 'Bundles',
    tier: 'elite',
    format: 'Digital + PDF',
    downloadable: false,
  },
  {
    slug: 'fleet-operations-manual',
    title: 'Fleet Operations Manual Template',
    description: 'Safety manual, dispatch procedures, driver handbook, and emergency protocols for escort fleet operations.',
    category: 'Bundles',
    tier: 'elite',
    format: 'Digital',
    downloadable: false,
  },
  {
    slug: 'multi-state-permit-guide',
    title: 'Multi-State Permit Requirements Pack',
    description: 'State-by-state permit requirements, fees, processing times, and applications for all 50 states. Auto-updated.',
    category: 'Guides',
    tier: 'elite',
    format: 'Digital',
    downloadable: false,
  },
  {
    slug: 'broker-carrier-packet',
    title: 'Broker-Carrier Setup Packet',
    description: 'Everything a broker needs to onboard you: W-9, insurance cert, authority letter, rate confirmation, and safety record.',
    category: 'Packets',
    tier: 'elite',
    format: 'Digital + PDF',
    downloadable: false,
  },
];

const TIER_CONFIG = {
  free: { label: 'Free', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
  pro: { label: 'Pro', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
  elite: { label: 'Elite', color: '#C6923A', bg: 'rgba(198,146,58,0.08)', border: 'rgba(198,146,58,0.2)' },
};

const CATEGORY_COLORS: Record<string, string> = {
  Checklists: '#22c55e',
  Forms: '#3b82f6',
  Contracts: '#a78bfa',
  Packets: '#f59e0b',
  Bundles: '#C6923A',
  Guides: '#22d3ee',
};

export default function FormsHubPage() {
  const freeCount = FORMS.filter(f => f.tier === 'free').length;
  const categories = [...new Set(FORMS.map(f => f.category))];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FORMS_SCHEMA) }} />

      <div style={{ minHeight: '100vh', background: '#080810', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>

        {/* â”€â”€ Hero â”€â”€ */}
        <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <Link href="/resources" style={{ color: '#6b7280', textDecoration: 'none' }}>Resources</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#3b82f6' }}>Forms & Templates</span>
            </nav>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, marginBottom: 16 }}>
              <FileText style={{ width: 12, height: 12, color: '#3b82f6' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1 }}>Forms & Templates</span>
            </div>

            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Pilot Car Forms &<br />
              <span style={{ color: '#3b82f6' }}>Compliance Templates</span>
            </h1>
            <p style={{ margin: '0 0 2rem', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.65, maxWidth: 560 }}>
              {freeCount} free templates to get started. Pre-trip checklists, service agreements, route packets, and compliance bundles â€” used by 3,000+ operators.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="#free" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff', fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none',
              }}>
                <Download style={{ width: 14, height: 14 }} /> Get Free Templates
              </a>
              <Link href="/pricing" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#d1d5db', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none',
              }}>
                See All Plans
              </Link>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>

          {/* â”€â”€ Category nav â”€â”€ */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
            {categories.map(cat => (
              <a key={cat} href={`#${cat.toLowerCase()}`} style={{
                padding: '6px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 12, fontWeight: 700, color: CATEGORY_COLORS[cat] || '#94a3b8',
                textDecoration: 'none',
              }}>
                {cat}
              </a>
            ))}
          </div>

          {/* â”€â”€ Free section â”€â”€ */}
          <section id="free" style={{ marginBottom: 48, scrollMarginTop: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Download style={{ width: 18, height: 18, color: '#22c55e' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>Free Templates</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Download instantly, no account required</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {FORMS.filter(f => f.tier === 'free').map(form => (
                <FormCard key={form.slug} form={form} />
              ))}
            </div>
          </section>

          {/* â”€â”€ Pro section â”€â”€ */}
          <section id="pro" style={{ marginBottom: 48, scrollMarginTop: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star style={{ width: 18, height: 18, color: '#3b82f6' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>Pro Templates</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Included with Pro ($29/mo) â€” autofill, vault storage, and reminders</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {FORMS.filter(f => f.tier === 'pro').map(form => (
                <FormCard key={form.slug} form={form} />
              ))}
            </div>
          </section>

          {/* â”€â”€ Elite section â”€â”€ */}
          <section id="elite" style={{ marginBottom: 48, scrollMarginTop: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield style={{ width: 18, height: 18, color: '#C6923A' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>Elite Templates</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Included with Elite ($79/mo) â€” branded, audit-ready, fleet-grade</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {FORMS.filter(f => f.tier === 'elite').map(form => (
                <FormCard key={form.slug} form={form} />
              ))}
            </div>
          </section>

          {/* â”€â”€ Email capture CTA â”€â”€ */}
          <section style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 20, padding: '2.5rem', textAlign: 'center', marginBottom: 48,
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(59,130,246,0.1)', borderRadius: 20, marginBottom: 16 }}>
              <Download style={{ width: 12, height: 12, color: '#3b82f6' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1 }}>Free Starter Bundle</span>
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 900, color: '#f9fafb' }}>
              Get All {freeCount} Free Templates
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#94a3b8', maxWidth: 450, marginLeft: 'auto', marginRight: 'auto' }}>
              Pre-trip checklist, bill of lading, daily log, and startup guide â€” in one download. Used by 3,000+ operators.
            </p>
            <form
              action="/api/leads/resource-download"
              method="POST"
              style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <input type="hidden" name="source" value="forms-hub" />
              <input
                type="email" name="email" required
                placeholder="your@email.com"
                style={{
                  flex: 1, minWidth: 220, padding: '11px 16px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none',
                }}
              />
              <button type="submit" style={{
                padding: '11px 22px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff', fontSize: 13, fontWeight: 800, borderRadius: 10, border: 'none', cursor: 'pointer',
              }}>
                Download Free Bundle
              </button>
            </form>
            <p style={{ marginTop: 12, fontSize: 11, color: '#4b5563' }}>No spam. Unsubscribe anytime.</p>
          </section>

          {/* â”€â”€ Cross-links â”€â”€ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { href: '/resources', icon: BookOpen, label: 'Resource Hub', desc: '40+ guides & references', color: '#C6923A' },
              { href: '/directory', icon: Truck, label: 'Operator Directory', desc: 'Find verified escorts', color: '#22c55e' },
              { href: '/claim', icon: Shield, label: 'Claim Profile', desc: 'Get found by brokers', color: '#3b82f6' },
              { href: '/available-now', icon: Star, label: 'Available Now', desc: 'Live availability feed', color: '#f59e0b' },
            ].map(card => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '1rem',
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, textDecoration: 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${card.color}10`, border: `1px solid ${card.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon style={{ width: 16, height: 16, color: card.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{card.label}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{card.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function FormCard({ form }: { form: FormItem }) {
  const tier = TIER_CONFIG[form.tier];
  const catColor = CATEGORY_COLORS[form.category] || '#94a3b8';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', padding: '20px',
      background: 'rgba(255,255,255,0.025)', border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 14, transition: 'all 0.18s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f9fafb', lineHeight: 1.4, flex: 1, paddingRight: 8 }}>
          {form.title}
        </h3>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
            background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            {tier.label}
          </span>
        </div>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94a3b8', lineHeight: 1.55, flex: 1 }}>
        {form.description}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
            background: `${catColor}10`, color: catColor,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            {form.category}
          </span>
          <span style={{
            padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700,
            background: 'rgba(255,255,255,0.04)', color: '#64748b',
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            {form.format}
          </span>
        </div>
        {form.tier === 'free' ? (
          <Link href={`/resources/forms/${form.slug}`} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700, color: '#22c55e', textDecoration: 'none',
          }}>
            Download <ArrowRight style={{ width: 10, height: 10 }} />
          </Link>
        ) : (
          <Link href="/pricing" style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700, color: tier.color, textDecoration: 'none',
          }}>
            Unlock <ArrowRight style={{ width: 10, height: 10 }} />
          </Link>
        )}
      </div>
    </div>
  );
}